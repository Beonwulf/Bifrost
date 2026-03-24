import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import selfsigned from 'selfsigned';
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


	#addRoute(method, path, handler) {
		this.#routes.push({ method, path, handler });
	}


	/**
	 * Socket.io "andocken"
	 */
	async attachSockets($options = {}) {
		await this.initServer();
		// CORS ist bei Sockets oft der Endgegner
		const defaultOptions = {
			cors: {
				origin: "*", // Erlaubt alle Origins
				//methods: ["GET", "POST"]
			},
			transports: ['websocket'] // Erzwingt Websocket, wenn der Client das auch tut
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
		}
		return this.#server;
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


		// --- Locale-Prefix-Stripping (SEO-URLs: /de/about → req._locale='de', /about) ---
		if (this.#locales) {
			const rawUrl = new URL(req.url, `https://${req.headers.host}`);
			const m = rawUrl.pathname.match(/^\/([a-z]{2})(\/.*)?$/);
			if (m && this.#locales.has(m[1])) {
				req._locale = m[1];
				const newPath = m[2] || '/';
				req.url = newPath + (rawUrl.search || '');
			}
		}

		// --- Routing Logik (Erweitert für Parameter :id) ---
		const url = new URL(req.url, `https://${req.headers.host}`);

		let route = null;
		let params = {};

		for (const r of this.#routes) {
			if (r.method !== req.method) continue;

			// Schneller Check: Exakter Match
			if (r.path === url.pathname) {
				route = r;
				break;
			}

			// Parameter Check (z.B. /api/user/:id)
			if (r.path.includes(':')) {
				const pathParts = r.path.split('/');
				const urlParts = url.pathname.split('/');

				if (pathParts.length === urlParts.length) {
					let match = true;
					const tempParams = {};

					for (let i = 0; i < pathParts.length; i++) {
						if (pathParts[i].startsWith(':')) {
							const paramName = pathParts[i].substring(1);
							tempParams[paramName] = urlParts[i];
						} else if (pathParts[i] !== urlParts[i]) {
							match = false;
							break;
						}
					}

					if (match) {
						route = r;
						params = tempParams;
						break;
					}
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
				this.#io.close();
				this.#io = null;
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
