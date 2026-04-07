import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import selfsigned from 'selfsigned';
import { Readable, Writable } from 'node:stream';
import { Server as SocketServer } from 'socket.io';
import { BifrostStatic } from './BifrostStatic.js';


export class Bifrost extends BifrostStatic {


	#port;
	#host;
	#server;
	#io = null;
	#runes = []; // Unser Middleware-Speicher
	#ssl = false;
	#sslOptions;
	#socketPath;
	#compression;
	#routes = [];
	#locales = null;
	#errorHandlers = new Map();


	constructor(
		{
			port = 3000, host = 'localhost', sslCert = null, ssl = false, compression = false, socketPath='socket.io'
		} = {}
	) {
		super();
		this.#port = port;
		this.#host = host;
		this.#server = null;
		this.#ssl = ssl;
		this.#sslOptions = sslCert; // Enthält { key, cert }
		this.#compression = compression;
		this.#socketPath = socketPath;

		/*
		if( compression === true ) {
			BifrostStatic.enableCompression();
		}
		else {
			BifrostStatic.disableCompression();
		}
		/**/
		this.#initMethods();
	}


	/**
	 * Setzt einen benutzerdefinierten Error-Handler für einen Statuscode.
	 * @param {number} $status
	 * @param {Function} $handler  ($req, $res, $err?) => void
	 */
	setErrorHandler($status, $handler) {
		this.#errorHandlers.set($status, $handler);
		return this;
	}

	/**
	 * Aktiviert Locale-Prefix-Routing (SEO-URLs).
	 * Bekannte Locale-Codes werden vor dem Route-Matching aus der URL gestrippt
	 * und als req._locale gesetzt. Beispiel: /de/about → req._locale='de', req.url='/about'
	 * @param {string[]} $locales  z.B. ['de', 'en', 'fr', 'es', 'it']
	 */
	setLocales($locales) {
		this.#locales = new Set(Array.isArray($locales) ? $locales : [$locales]);
		return this;
	}

	/**
	 * Methode zum Hinzufügen von Middleware (Runen)
	 */
	use($rune) {
		this.#runes.push($rune);
		return this; // Erlaubt Chaining: bridge.use(a).use(b)
	}


	#initMethods() {
		// Wir definieren die Methoden, die wir unterstützen wollen
		['get', 'post', 'put', 'patch', 'delete'].forEach(method => {
			this[method] = (path, handler) => {
				this.#addRoute(method.toUpperCase(), path, handler)

				return this;
			};
		});
	}


	#addRoute(method, $path, $handler) {
		const route = { method, path: $path, handler: $handler };

		// Parametrische (:param) oder Wildcard (*) Routen einmalig in RegExp übersetzen
		if ($path.includes(':') || $path.includes('*')) {
			const paramNames = [];
			let pattern = $path.replace(/:([^/]+)/g, ($_, $name) => {
				paramNames.push($name);
				return '([^/]+)';
			});

			let wildcardCount = 0;
			pattern = pattern.replace(/\*/g, () => {
				paramNames.push(`wildcard_${wildcardCount++}`);
				return '(.*)';
			});

			route.regex      = new RegExp(`^${pattern}$`);
			route.paramNames = paramNames;
		}

		this.#routes.push(route);

		// Sortieren: Wildcard-Routen (*) immer ans Ende der Liste schieben.
		this.#routes.sort((a, b) => {
			const aWild = a.path.includes('*') ? 1 : 0;
			const bWild = b.path.includes('*') ? 1 : 0;
			return aWild - bWild;
		});
	}


	/**
	 * Socket.io "andocken"
	 *
	 * @param {object} [$options]  Socket.io-Optionen — werden über den Default gemergt.
	 *
	 * Sicherheitshinweis: Im Default ist CORS auf die Server-Origin beschränkt.
	 * Für Production explizit setzen:
	 *   bridge.attachSockets({ cors: { origin: 'https://meine-app.de', methods: ['GET','POST'] } })
	 */
	async attachSockets($options = {}) {
		await this.initServer();
		// Sicherer Default: keine Wildcard-Origin in Production.
		// Kann per $options überschrieben werden.
		const defaultOptions = {
			cors: {
				origin: false, // Keine Cross-Origin-Verbindungen per Default
			},
			transports: ['websocket'],
		};

		if( this.#io  === null) {
			this.#io = new SocketServer(this.#server, { ...defaultOptions, ...$options });
		}

		return this.#io;
	}


	async initServer() {
		if(this.#server === null) {
			/**/
			if(this.#sslOptions === null && this.#ssl === true ) {
				this.#sslOptions = await this.#getOrCreateCertificates();
			}/**/

			// Wähle Protokoll: Wenn SSL-Optionen da sind, nutze HTTPS
			const engine = this.#sslOptions ? https : http;

			this.#server = engine.createServer(this.#sslOptions || {}, this.#handleRequest.bind(this) );
			// Schutz gegen Slowloris / hängende Verbindungen (30 s)
			this.#server.timeout       = 30_000;
			this.#server.keepAliveTimeout = 5_000;
		}
		return this.#server;
	}

	/**
	 * Simuliert einen HTTP-Request im Arbeitsspeicher (Memory-Injection).
	 * Perfekt für extrem schnelle API-Tests ohne Netzwerk-Overhead.
	 *
	 * @param {object} $options
	 * @param {string} $options.method  HTTP-Methode (z.B. 'GET', 'POST')
	 * @param {string} $options.url     Der Pfad (z.B. '/api/users')
	 * @param {object} [$options.headers] HTTP-Header
	 * @param {any}    [$options.body]  Body-Payload (Objekte werden als JSON gesendet)
	 * @returns {Promise<object>} { statusCode, headers, rawBody, body, json() }
	 */
	async inject($options = {}) {
		return new Promise((resolve) => {
			// 1. Mock Request (Readable Stream)
			const req = new Readable({ read() {} });
			req.method = ($options.method || 'GET').toUpperCase();
			req.url = $options.url || '/';
			req.headers = { host: 'localhost', ...($options.headers || {}) };
			req.socket = { remoteAddress: '127.0.0.1', encrypted: false };

			if ($options.body) {
				const isObj = typeof $options.body === 'object' && !Buffer.isBuffer($options.body);
				const payload = isObj ? JSON.stringify($options.body) : String($options.body);
				
				if (!req.headers['content-type'] && isObj) req.headers['content-type'] = 'application/json';
				req.headers['content-length'] = Buffer.byteLength(payload);
				req.push(payload);
			}
			req.push(null); // EOF (End of Stream)

			// 2. Mock Response (Writable Stream)
			const res = new Writable({ write(c, e, cb) { res.bodyChunks.push(Buffer.from(c)); cb(); } });
			res.statusCode = 200;
			res._headers = {};
			res.bodyChunks = [];
			res.writableEnded = false;

			res.setHeader = function(n, v) { this._headers[n.toLowerCase()] = v; };
			res.getHeader = function(n) { return this._headers[n.toLowerCase()]; };
			res.removeHeader = function(n) { delete this._headers[n.toLowerCase()]; };
			res.writeHead = function(status, headers = {}) { this.statusCode = status; for (const [k, v] of Object.entries(headers)) this.setHeader(k, v); };

			// Wenn res.end() im Controller/Rune aufgerufen wird, lösen wir unser Promise auf!
			res.end = function(chunk, encoding, callback) {
				if (this.writableEnded) return;
				if (chunk && typeof chunk !== 'function') this.bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
				this.writableEnded = true;
				this.emit('finish'); // Wichtig für den Logger!

				const rawBody = Buffer.concat(this.bodyChunks);
				resolve({ statusCode: this.statusCode, headers: this._headers, rawBody, body: rawBody.toString('utf8'), json: () => { try { return JSON.parse(rawBody.toString('utf8')); } catch { return null; } } });
			};

			// 3. Request in die Bifröst Pipeline werfen
			this.#handleRequest(req, res);
		});
	}

	/**
	 * Aktiviert die Brücke (Startet den Server)
	 * @returns {Promise<void>}
	 */
	async ignite() {
		await this.initServer();
		return new Promise((resolve, reject) => {
			const protokoll = this.#sslOptions ? 'HTTPS' : 'HTTP';
			this.#server.listen(this.#port, this.#host, () => {
				console.log(`🌈 Bifröst erstrahlt auf ${protokoll}://${this.#host}:${this.#port}`);
				resolve();
			});

			this.#server.on('error', (err) => {
				reject(err);
			});
		});
	}


	// Private Methode: Nur intern aufrufbar
	async #handleRequest(req, res) {
		// 1. Wenn es ein Socket.io Request ist, zieh dich zurück!
		// Socket.io hat sich bereits an den Server gebunden und regelt das intern.
		if(req.url.startsWith('/socket.io')) {
			return; // Socket.io übernimmt hier intern über den 'upgrade' listener
		}

		// Sicherer URL-Parse: Host-Header kann manipuliert sein → immer localhost als Basis
		let url;
		try {
			url = new URL(req.url, 'http://localhost');
		} catch {
			res.writeHead(400);
			res.end('Bad Request');
			return;
		}

		// --- Locale-Prefix-Stripping (SEO-URLs: /de/about → req._locale='de', /about) ---
		if (this.#locales) {
			const m = url.pathname.match(/^\/([a-z]{2})(\/.*)?$/);
			if (m && this.#locales.has(m[1])) {
				req._locale = m[1];
				const newPath = m[2] || '/';
				req.url = newPath + (url.search || '');
				url = new URL(req.url, 'http://localhost');
			}
		}

		// --- Routing Logik (Erweitert für Parameter :id) ---

		let route = null;
		let params = {};

		for (const r of this.#routes) {
			if (r.method !== req.method) continue;

			// Schneller Check: Exakter Match
			if (r.path === url.pathname) {
				route = r;
				break;
			}

			// Parameter-Check: vorkompilierte Regex — O(1) statt split + Loop
			if (r.regex) {
				const m = r.regex.exec(url.pathname);
				if (m) {
					for (let i = 0; i < r.paramNames.length; i++) {
						params[r.paramNames[i]] = m[i + 1];
					}
					route = r;
					break;
				}
			}
		}

		req.params = params;
		let index = 0;
		// Die "Next"-Logik: Geht die Kette der Runen durch
		const next = async () => {
			if (index < this.#runes.length) {
				const rune = this.#runes[index++];
				try {
					await rune(req, res, next);
				} catch (err) {
					this.#handleError(err, res);
				}
			}
			else if (route) {
				// Keine Runen mehr, aber eine passende Route gefunden!
				try {
					// Wir geben req, res und auch Zugriff auf die App/DB falls nötig
					await route.handler(req, res);
				} catch (err) {
					this.#handleError(err, res);
				}
			}
			else {
				// Wenn keine Runen mehr da sind: Standard-Antwort (Endstation)
				this.#finalize(req, res);
			}
		};

		await next();
	}


	async #finalize(req, res) {
		if (res.writableEnded) return;
		const handler = this.#errorHandlers.get(404);
		if (handler) {
			await handler(req, res);
		} else {
			res.writeHead(404);
			res.end('404 - Kein Pfad durch den Nebel gefunden.');
		}
	}


	async #handleError(err, res) {
		const handler = this.#errorHandlers.get(500);
		if (handler) {
			await handler(null, res, err);
		} else {
			console.error('⚠️ Fehler auf der Brücke:', err);
			res.writeHead(500);
			res.end('500 - Götterdämmerung (Interner Fehler)');
		}
	}


	/**
	 * Schließt die Verbindung sicher
	 */
	async extinguish() {
		if (!this.#server) return;

		return new Promise((resolve) => {
			this.#server.close(() => {
				if (this.#io) {
					this.#io.close();
					this.#io = null;
				}
				console.log('💀 Die Brücke ist erloschen.');
				resolve();
			});
		});
	}


	async #getOrCreateCertificates() {
		const certDir = path.join(process.cwd(), 'data', 'bifrost');
		const keyPath = path.join(certDir, 'key.pem');
		const certPath = path.join(certDir, 'cert.pem');

		// 1. Ordner prüfen & erstellen
		if (!fs.existsSync(certDir)) {
			fs.mkdirSync(certDir, { recursive: true });
			console.log(`📁 Ordner erstellt: ${certDir}`);
		}

		// 2. Zertifikate prüfen oder generieren
		if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
			console.log('🛡️  Bestehende Zertifikate aus data/bifrost geladen.');
			return {
				key: fs.readFileSync(keyPath),
				cert: fs.readFileSync(certPath)
			};
		}
		else {
			console.log('⚒️  Schmiede neue Zertifikate für die Brücke...');

			const attrs = [{ name: 'commonName', value: 'localhost' }];
			// Erzeugung der PEM-Daten
			const pems = await selfsigned.generate(attrs, { days: 365 });
			// Wir stellen sicher, dass wir auf 'private' und 'cert' zugreifen.
			// Manche Versionen nutzen pems.key, andere pems.private.
			const privateKey = pems.private || pems.key;
			const certificate = pems.cert || pems.public;

			if (!privateKey || !certificate) {
				console.log( pems );
				throw new Error("Götterdämmerung! Zertifikate konnten nicht generiert werden.");
			}

			fs.writeFileSync(keyPath, privateKey);
			fs.writeFileSync(certPath, certificate);

			console.log('✨ Neue Zertifikate in data/bifrost gespeichert.');
			return { key: pems.private, cert: pems.cert };
		}
	}


}
