import { mimeTypes } from '../utils/mimeTypes.js';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve, sep } from 'node:path';
import zlib from 'node:zlib';
import { promisify } from 'node:util';


const gzip = promisify(zlib.gzip);

/** Maximale Body-Größe (1 MB) — schützt vor DoS durch überdimensionale Payloads. */
const MAX_BODY_BYTES = 1 * 1024 * 1024;


export class BifrostStatic {


	static #compression = false;

	static enableCompression() { BifrostStatic.#compression = true; }
	static disableCompression() { BifrostStatic.#compression = false; }
	static useCompression() { return BifrostStatic.#compression; }


	static createStaticRune( $rootDir ) {
		// Absoluter, kanonischer Wurzelpfad — einmalig berechnet
		const rootResolved = resolve(process.cwd(), $rootDir);

		return async (req, res, next) => {
			if (req.url.startsWith('/socket.io')) {
				return await next(); // Sofort weiterreichen an Socket.io
			}

			// Query-String entfernen, bevor der Pfad aufgelöst wird
			const pathname = req.url.split('?')[0];
			const safeName = pathname === '/' ? '/index.html' : pathname;

			// Path-Traversal-Schutz: resolve() normalisiert alle '..' — danach Präfix-Check
			const filePath     = join(rootResolved, safeName);
			const fileResolved = resolve(filePath);
			if (!fileResolved.startsWith(rootResolved + sep) && fileResolved !== rootResolved) {
				return await next();
			}

			const acceptEncoding = req.headers['accept-encoding'] || '';

			try {
				const stats = await stat(fileResolved);

				if (stats.isFile()) {
					const ext         = extname(fileResolved).toLowerCase();
					const contentType = mimeTypes[ext] || 'application/octet-stream';

					// ETag aus mtime + size (kein kryptog. Hash nötig — reine Cache-Validierung)
					const etag = `"${stats.mtimeMs.toString(36)}-${stats.size.toString(36)}"`;

					// 304 Not Modified: Browser hat noch die aktuelle Version → kein Transfer
					if (req.headers['if-none-match'] === etag) {
						res.writeHead(304);
						res.end();
						return;
					}

					let content = await readFile(fileResolved);

					if( BifrostStatic.useCompression() === true ) {
						// Hier passiert die Kompression VOR dem Senden der Header
						if (acceptEncoding.includes('gzip')) {
							content = await gzip(content);
							res.setHeader('Content-Encoding', 'gzip');
						}
					}
					/**
					 * für Sharedarraybuffer
					 */
					res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
					res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

					res.setHeader('ETag', etag);
					res.setHeader('Content-Type', contentType);
		        	res.setHeader('Content-Length', content.length);
					res.end(content);
					return; // Wir beenden hier, kein next() nötig!
				}
			}
			catch (err) {
				// Wenn Datei nicht existiert, einfach zum nächsten Handler (z.B. API oder 404)
				return await next(); // UNBEDINGT weiterreichen!
			}

			await next();
		};
	}


	static createBodyParserRune($options = {}) {
		const maxBytes = $options.maxBytes ?? MAX_BODY_BYTES;
		return async (req, res, next) => {
			if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
				const chunks = [];
				let bytes    = 0;
				for await (const chunk of req) {
					bytes += chunk.length;
					if (bytes > maxBytes) {
						res.writeHead(413, { 'Content-Type': 'application/json' });
						res.end(JSON.stringify({ error: 'Payload Too Large' }));
						return;
					}
					chunks.push(chunk);
				}
				const body = Buffer.concat(chunks).toString('utf-8');
				const ct = req.headers['content-type'] ?? '';
				if (ct.includes('application/json')) {
					try { req.body = JSON.parse(body); } catch { req.body = null; }
				} else {
					req.body = body; // Roh durchreichen (z.B. form-urlencoded)
				}
			}

			// Weiter zur nächsten Rune
			await next();
		};
	}


	/**
	 * Security-Header-Rune — setzt grundlegende HTTP-Sicherheits-Header.
	 * Empfehlung: Als erste Rune registrieren.
	 *
	 * @param {object} [$options]
	 * @param {string}  [$options.csp]            Content-Security-Policy-Wert (default: strict)
	 * @param {boolean} [$options.hsts]           HSTS aktivieren (default: true, nur HTTPS sinnvoll)
	 * @param {number}  [$options.hstsMaxAge]     HSTS max-age in Sekunden (default: 1 Jahr)
	 */
	static createSecurityHeadersRune($options = {}) {
		const {
			csp         = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'",
			hsts        = true,
			hstsMaxAge  = 31_536_000,
		} = $options;

		return async (req, res, next) => {
			res.setHeader('X-Content-Type-Options',  'nosniff');
			res.setHeader('X-Frame-Options',         'DENY');
			res.setHeader('Referrer-Policy',          'strict-origin-when-cross-origin');
			res.setHeader('Content-Security-Policy', csp);
			if (hsts) {
				res.setHeader('Strict-Transport-Security', `max-age=${hstsMaxAge}; includeSubDomains`);
			}
			await next();
		};
	}


	/**
	 * Rate-Limit-Rune — schützt vor Brute-Force und DoS (kein externes Package nötig).
	 * Nutzt einen Fixed-Window-Counter pro IP-Adresse.
	 *
	 * @param {object} [$options]
	 * @param {number}  [$options.points]    Max. Requests pro Zeitfenster (default: 100)
	 * @param {number}  [$options.duration]  Fenstergröße in Sekunden (default: 60)
	 * @param {string}  [$options.message]   Fehlermeldung bei Überschreitung (default: 'Too Many Requests')
	 *
	 * @example
	 * bridge.use(BifrostStatic.createRateLimitRune({ points: 60, duration: 60 }));
	 */
	static createRateLimitRune($options = {}) {
		const {
			points      = 100,
			duration    = 60,
			message     = 'Too Many Requests',
			trustProxy  = false, // true: X-Forwarded-For auslesen (nur hinter vertrauenswürdigem Proxy!)
		} = $options;

		const durationMs = duration * 1_000;

		// Map: IP → { count, resetAt (ms) }
		const store = new Map();

		// Abgelaufene Einträge periodisch bereinigen — verhindert Memory-Leak bei vielen IPs
		const interval = setInterval(() => {
			const now = Date.now();
			for (const [key, entry] of store) {
				if (entry.resetAt <= now) store.delete(key);
			}
		}, durationMs);

		// Verhindert, dass das Interval den Prozess offen hält
		if (interval.unref) interval.unref();

		/**
		 * IPv4-mapped IPv6 normalisieren: ::ffff:1.2.3.4 → 1.2.3.4
		 * Ohne Normalisierung wären ::ffff:1.2.3.4 und 1.2.3.4 zwei verschiedene Buckets
		 * → Rate-Limit wäre durch IPv6-Adresse umgehbar.
		 */
		const normalizeIp = ($ip) => {
			const mapped = $ip.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
			return mapped ? mapped[1] : $ip;
		};

		/**
		 * IP-Adresse aus dem Request ermitteln.
		 * trustProxy=true: nur hinter einem Proxy nutzen, der X-Forwarded-For setzt —
		 * ansonsten kann der Client die IP frei wählen und das Rate-Limit umgehen.
		 */
		const getIp = ($req) => {
			if (trustProxy) {
				const fwd = $req.headers['x-forwarded-for'];
				if (fwd) {
					// Nur erste IP (direkter Client) — Rest sind durchgeleitete Proxies
					const candidate = fwd.split(',')[0].trim();
					// Nur valide IPv4/IPv6-Zeichen akzeptieren — keine freien Strings
					if (/^[\da-fA-F.:]+$/.test(candidate)) return normalizeIp(candidate);
				}
			}
			const addr = $req.socket?.remoteAddress;
			return addr ? normalizeIp(addr) : null;
		};

		return async (req, res, next) => {
			const ip  = getIp(req);
			const now = Date.now();

			// Kein IP-Wert ermittelbar → durchlassen (kein false-positive für interne Systeme)
			if (!ip) {
				await next();
				return;
			}

			let entry = store.get(ip);
			if (!entry || entry.resetAt <= now) {
				entry = { count: 0, resetAt: now + durationMs };
				store.set(ip, entry);
			}

			entry.count++;

			// Standard-Headers: transparent für den Client
			res.setHeader('X-RateLimit-Limit',     points);
			res.setHeader('X-RateLimit-Remaining', Math.max(0, points - entry.count));
			res.setHeader('X-RateLimit-Reset',     Math.ceil(entry.resetAt / 1_000));

			if (entry.count > points) {
				res.writeHead(429, { 'Content-Type': 'text/plain; charset=utf-8' });
				res.end(String(message));
				return;
			}

			await next();
		};
	}


	static createResponseHelperRune() {
		return async (req, res, next) => {
			// Wir fügen eine bequeme .json() Methode hinzu
			res.json = (data, status = 200) => {
				res.writeHead(status, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify(data));
			};

			// Und eine .error() Methode für einheitliche Fehlermeldungen
			res.error = (message, status = 400) => {
				res.json({ error: message }, status);
			};

			await next();
		};
	}

	/**
	 * AuthRune — Middleware zur Authentifizierung
	 *
	 * Liest den Token (Cookie oder Header) aus, validiert ihn über einen Auth-Service
	 * und setzt `req.user`, woraufhin `BBController.isAuthenticated` funktioniert.
	 */
	static createAuthRune($app) {
		return async (req, res, next) => {
			// 1. Token aus Header oder Cookie extrahieren
			let token = null;
			const authHeader = req.headers.authorization;
			if (authHeader && authHeader.startsWith('Bearer ')) {
				token = authHeader.substring(7);
			} else if (req.headers.cookie) {
				const match = req.headers.cookie.match(/(^| )auth_token=([^;]+)/);
				if (match) token = decodeURIComponent(match[2]);
			}

			// 2. Token validieren und req.user setzen
			if (token) {
				try {
					const authService = $app.service('auth');
					if (!authService) {
						throw new Error('AuthService ist nicht in der App registriert!');
					}
					// verify() wirft einen Fehler, wenn abgelaufen oder manipuliert
					req.user = authService.verify(token);
				} catch (err) {
					console.error('Auth-Fehler:', err.message);
					req.user = null;
				}
			}

			await next();
		};
	}

}
