import { mimeTypes } from '../utils/mimeTypes.js';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve, sep } from 'node:path';
import zlib from 'node:zlib';
import { promisify } from 'node:util';
import crypto from 'node:crypto';
import { AuthService } from './AuthService.js';


const gzip = promisify(zlib.gzip);

/** Maximale Body-Größe (1 MB) — schützt vor DoS durch überdimensionale Payloads. */
const MAX_BODY_BYTES = 1 * 1024 * 1024;


export class BifrostStatic {


	static #compression = false;

	static enableCompression() { BifrostStatic.#compression = true; }
	static disableCompression() { BifrostStatic.#compression = false; }
	static useCompression() { return BifrostStatic.#compression; }

	/**
	 * Logger-Rune — loggt jeden HTTP-Request (Methode, URL, Status, Dauer).
	 * @param {import('../utils/Logger.js').Logger} $logger
	 */
	static createLoggerRune($logger) {
		return async (req, res, next) => {
			const start = performance.now();

			res.on('finish', () => {
				const ms = (performance.now() - start).toFixed(1);
				const status = res.statusCode;
				
				// Farbe anhand des HTTP-Statuscodes
				let statusColor = '\x1b[32m'; // Grün für 200er
				if (status >= 300) statusColor = '\x1b[36m'; // Cyan für 300er (Redirects)
				if (status >= 400) statusColor = '\x1b[33m'; // Gelb für 400er (Client Error)
				if (status >= 500) statusColor = '\x1b[31m'; // Rot für 500er (Server Error)
				
				const meta = `${statusColor}${status}\x1b[0m - ${ms}ms`;
				
				// Socket.io Polling spamt oft die Logs, daher als 'debug' einstufen
				const level = req.url.startsWith('/socket.io') ? 'debug' : 'info';
				$logger[level](`[${req.method}] ${req.url}`, meta);
			});

			await next();
		};
	}

	/**
	 * CORS-Rune — Setzt Cross-Origin Resource Sharing Header und behandelt OPTIONS-Preflights.
	 * 
	 * @param {object} [$options]
	 * @param {string|string[]|boolean|Function} [$options.origin] Erlaubte Origins (Standard: '*')
	 * @param {string|string[]} [$options.methods] Erlaubte Methoden (Standard: 'GET,HEAD,PUT,PATCH,POST,DELETE')
	 * @param {string|string[]} [$options.allowedHeaders] Erlaubte Request-Header
	 * @param {string|string[]} [$options.exposedHeaders] Header, die der Client lesen darf
	 * @param {boolean} [$options.credentials] Cookies/Auth-Header zulassen (Standard: false)
	 * @param {number} [$options.maxAge] Cache-Dauer für Preflight-Requests in Sekunden
	 * @param {number} [$options.optionsSuccessStatus] HTTP-Status für erfolgreichen Preflight (Standard: 204)
	 */
	static createCorsRune($options = {}) {
		const {
			origin = '*',
			methods = 'GET,HEAD,PUT,PATCH,POST,DELETE',
			allowedHeaders,
			exposedHeaders,
			credentials = false,
			maxAge,
			optionsSuccessStatus = 204
		} = $options;

		return async (req, res, next) => {
			const requestOrigin = req.headers.origin;
			let allowOrigin = '';

			// Origin-Ermittlung
			if (origin === '*') {
				allowOrigin = '*';
			} else if (typeof origin === 'string') {
				allowOrigin = origin;
			} else if (Array.isArray(origin)) {
				if (origin.includes(requestOrigin)) allowOrigin = requestOrigin;
			} else if (typeof origin === 'function') {
				allowOrigin = await origin(requestOrigin, req);
			} else if (origin === true) {
				allowOrigin = requestOrigin || '*';
			}

			// CORS-Spezifikation: Wildcard (*) und Credentials (true) dürfen nicht kombiniert werden.
			// Browser werfen sonst einen harten Fehler. Wir beheben das automatisch, 
			// indem wir stattdessen den Request-Origin dynamisch reflektieren.
			if (allowOrigin === '*' && credentials) {
				allowOrigin = requestOrigin || '*';
			}

			// WICHTIG: Bei dynamischen Origins muss der Cache (Browser/CDN) wissen, 
			// dass sich die Antwort je nach "Origin"-Header des Clients ändern kann.
			if (origin !== '*') {
				const vary = res.getHeader('Vary') || '';
				if (!vary.includes('Origin')) res.setHeader('Vary', vary ? `${vary}, Origin` : 'Origin');
			}

			// Header setzen
			if (allowOrigin) res.setHeader('Access-Control-Allow-Origin', allowOrigin);
			if (credentials) res.setHeader('Access-Control-Allow-Credentials', 'true');
			if (exposedHeaders) res.setHeader('Access-Control-Expose-Headers', Array.isArray(exposedHeaders) ? exposedHeaders.join(',') : exposedHeaders);

			// Preflight-Logik (OPTIONS)
			if (req.method === 'OPTIONS') {
				res.setHeader('Access-Control-Allow-Methods', Array.isArray(methods) ? methods.join(',') : methods);

				const reqHeaders = req.headers['access-control-request-headers'];
				if (reqHeaders) {
					res.setHeader('Access-Control-Allow-Headers', reqHeaders);
				} else if (allowedHeaders) {
					res.setHeader('Access-Control-Allow-Headers', Array.isArray(allowedHeaders) ? allowedHeaders.join(',') : allowedHeaders);
				}

				if (maxAge !== undefined && maxAge !== null) {
					res.setHeader('Access-Control-Max-Age', String(maxAge));
				}

				// Preflight direkt beantworten und Kette abbrechen
				res.writeHead(optionsSuccessStatus, { 'Content-Length': '0' });
				res.end();
				return;
			}

			await next();
		};
	}

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
		const bypass   = $options.bypass ?? null;
		return async ($req, $res, $next) => {
			if (bypass === true) return await $next();
			if (typeof bypass === 'function' && bypass($req)) return await $next();
			if (typeof bypass === 'string' && bypass.toUpperCase() === $req.method) return await $next();
			if (Array.isArray(bypass) && bypass.map(m => String(m).toUpperCase()).includes($req.method)) return await $next();

			if (['POST', 'PUT', 'PATCH'].includes($req.method)) {
				const chunks = [];
				let bytes    = 0;
				for await (const chunk of $req) {
					bytes += chunk.length;
					if (bytes > maxBytes) {
						$res.writeHead(413, { 'Content-Type': 'application/json' });
						$res.end(JSON.stringify({ error: 'Payload Too Large' }));
						return;
					}
					chunks.push(chunk);
				}
				
				const rawBuffer = Buffer.concat(chunks);
				const ct = $req.headers['content-type'] ?? '';
				
				$req.body = {};
				$req.files = {};

				if (ct.includes('application/json')) {
					try { $req.body = JSON.parse(rawBuffer.toString('utf-8')); } catch { $req.body = null; }
				} else if (ct.includes('multipart/form-data')) {
					// Eigener Zero-Dependency Multipart-Parser
					const match = ct.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
					if (match) {
						const boundary = match[1] || match[2];
						const boundaryBuffer = Buffer.from(`--${boundary}`);
						const doubleCrlf = Buffer.from('\r\n\r\n');
						
						const parts = [];
						let offset = 0;
						let index = rawBuffer.indexOf(boundaryBuffer, offset);
						while (index !== -1) {
							parts.push(rawBuffer.subarray(offset, index));
							offset = index + boundaryBuffer.length;
							index = rawBuffer.indexOf(boundaryBuffer, offset);
						}
						parts.push(rawBuffer.subarray(offset));

						for (const part of parts) {
							let start = 0;
							let end = part.length;
							if (part[start] === 13 && part[start+1] === 10) start += 2;
							if (part[end-2] === 13 && part[end-1] === 10) end -= 2;
							if (start >= end) continue;
							if (part[start] === 45 && part[start+1] === 45) continue; // -- EOF Marker

							const slice = part.subarray(start, end);
							const headerEnd = slice.indexOf(doubleCrlf);
							if (headerEnd === -1) continue;

							const headerText = slice.subarray(0, headerEnd).toString('utf-8');
							const dataBuffer = slice.subarray(headerEnd + 4);

							const dispMatch = headerText.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i);
							if (!dispMatch) continue;

							const fieldName = dispMatch[1];
							const fileName = dispMatch[2];

							if (fileName !== undefined) {
								const typeMatch = headerText.match(/Content-Type:\s*([^\r\n]+)/i);
								const fileObj = { filename: fileName, mimetype: typeMatch ? typeMatch[1].trim() : 'application/octet-stream', data: dataBuffer, size: dataBuffer.length };
								if ($req.files[fieldName]) { if (!Array.isArray($req.files[fieldName])) $req.files[fieldName] = [$req.files[fieldName]]; $req.files[fieldName].push(fileObj); } else $req.files[fieldName] = fileObj;
							} else {
								const val = dataBuffer.toString('utf-8');
								if ($req.body[fieldName]) { if (!Array.isArray($req.body[fieldName])) $req.body[fieldName] = [$req.body[fieldName]]; $req.body[fieldName].push(val); } else $req.body[fieldName] = val;
							}
						}
					}
				} else {
					$req.body = rawBuffer.toString('utf-8'); // form-urlencoded oder raw
				}
			}
			await $next();
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
					req.user = AuthService.verify(token);
				} catch (err) {
					console.error('Auth-Fehler:', err.message);
					req.user = null;
				}
			}

			await next();
		};
	}

	/**
	 * Session-Rune — stellt einen In-Memory Session-Store zur Verfügung.
	 * Bindet das Session-Objekt an `req.session`.
	 *
	 * @param {object} [$options]
	 * @param {string}  [$options.name]     Cookie-Name (default: 'bifrost_sid')
	 * @param {number}  [$options.duration] Session-Dauer in Sekunden (default: 3600 = 1 Stunde)
	 * @param {boolean} [$options.secure]   Secure-Flag für Cookie erzwingen (default: auto-detect)
	 */
	static createSessionRune($options = {}) {
		const cookieName = $options.name || 'bifrost_sid';
		const durationMs = ($options.duration || 3600) * 1000;
		const forceSecure = $options.secure ?? null;

		const store = new Map();

		// Periodisches Cleanup abgelaufener Sessions, um Memory-Leaks zu vermeiden
		const interval = setInterval(() => {
			const now = Date.now();
			for (const [sid, session] of store) {
				if (session._exp <= now) store.delete(sid);
			}
		}, 60_000);
		if (interval.unref) interval.unref();

		return async (req, res, next) => {
			let sid = null;
			
			// 1. Session-ID aus Cookie lesen
			if (req.headers.cookie) {
				const match = req.headers.cookie.match(new RegExp(`(^|;\\s*)${cookieName}=([^;]+)`));
				if (match) sid = decodeURIComponent(match[2]);
			}

			const now = Date.now();
			let session = sid ? store.get(sid) : null;
			let sendCookie = false;

			// 2. Validieren oder neu erstellen
			if (!session || session._exp <= now) {
				if (session) store.delete(sid);
				sid = crypto.randomBytes(32).toString('hex');
				session = {};
				// _exp versteckt als non-enumerable Property anlegen (taucht nicht in Iterationen auf)
				Object.defineProperty(session, '_exp', { value: now + durationMs, writable: true });
				store.set(sid, session);
				sendCookie = true;
			} else {
				// Ablaufzeit verlängern (Rolling Session). 
				// Performance-Tipp: Wir erneuern den Cookie nur im Browser, wenn schon mind. 
				// 60 Sekunden abgelaufen sind, um bei jedem Klick redundante Header zu sparen.
				if (session._exp < now + durationMs - 60_000) {
					session._exp = now + durationMs;
					sendCookie = true;
				}
			}

			// 3. Hilfsfunktion zum Setzen/Löschen des Cookies (Vermeidet Code-Duplikate)
			const applyCookie = (currentSid, maxAgeSecs) => {
				const isSecure = forceSecure !== null ? forceSecure : (req.socket?.encrypted || req.headers['x-forwarded-proto']?.includes('https'));
				let cookieStr = `${cookieName}=${encodeURIComponent(currentSid)}; Path=/; Max-Age=${maxAgeSecs}; HttpOnly; SameSite=Lax`;
				if (isSecure) cookieStr += '; Secure';
				
				let existing = res.getHeader('Set-Cookie');
				let cookies = existing ? (Array.isArray(existing) ? existing : [existing]) : [];
				cookies.push(cookieStr);
				res.setHeader('Set-Cookie', cookies);
			};

			if (sendCookie) {
				applyCookie(sid, Math.floor(durationMs / 1000));
			}

			// 4. Session an req binden und destroy-Methode anfügen
			req.session = session;
			req.session.destroy = () => {
				store.delete(sid);
				req.session = null;
				applyCookie('', 0);
			};

			// 5. regenerate-Methode für Logins (Schutz vor Session Fixation)
			req.session.regenerate = () => {
				const oldData = { ...session }; // Aktuelle Daten retten
				store.delete(sid);
				sid = crypto.randomBytes(32).toString('hex');
				session = oldData;
				Object.defineProperty(session, '_exp', { value: Date.now() + durationMs, writable: true });
				store.set(sid, session);
				req.session = session;
				applyCookie(sid, Math.floor(durationMs / 1000));
			};

			await next();
		};
	}

}
