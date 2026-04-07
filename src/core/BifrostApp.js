import { Bifrost } from './Bifrost.js';
import { Router }     from '../routing/Router.js';
import { Galdr }      from '../template/Galdr.js';
import { NavRegistry } from '../routing/NavRegistry.js';
import { handler404, handler500 } from '../defaults/routes.js';
import { Logger }     from '../utils/Logger.js';

/**
 * BifrostApp — Optionaler App-Layer für Bifröst.
 *
 * Kapselt Bifrost-Instanz, Socket.io und Service-Registry.
 * Überschreibbare Error-Handler für 404/500.
 *
 * @example
 * export const App = new BifrostApp();
 *
 * App.setErrorHandler(404, ($req, $res) => {
 *     $res.writeHead(404);
 *     $res.end('<h1>Nicht gefunden</h1>');
 * });
 *
 * await App.startup({
 *     port: 8008, ssl: true, socket: true, static: 'public'
 * });
 */
export class BifrostApp {

	static cfg = {
		port:            process.env.PORT || 3000,
		host:            '0.0.0.0',
		ssl:             false,
		sslCert:         null,
		socket:          false,
		static:          null,
		bodyParser:      false,
		compression:     false,
		responseHelpers: true,
		locales:         null,
		securityHeaders: false, // true oder Options-Objekt übergeben
		cors:            false, // true oder Options-Objekt übergeben
		rateLimit:       false, // true oder { points, duration, trustProxy } übergeben
		sessions:        false, // true oder Options-Objekt { name, duration, secure } übergeben
		csrf:            false, // true oder Options-Objekt { ignore: ['/api'] } übergeben
		logging:         { level: 'info', file: false }, // Logger Defaults
	};

	// ── Konfiguration (statische Setter) ──────────────────────────────────────

	static setPort($port)    { BifrostApp.cfg.port = $port; }
	static setHost($host)    { BifrostApp.cfg.host = $host; }
	static setStatic($dir)   { BifrostApp.cfg.static = $dir; }

	/**
	 * Aktiviert Locale-Prefix-Routing. Bekannte Locale-Codes werden aus der URL
	 * gestrippt und per req._locale an Controller weitergegeben.
	 * Registriert die Locales zusätzlich in NavRegistry für den automatischen LangSwitch.
	 * @param {string[]} $locales  z.B. ['de', 'en', 'fr', 'es', 'it']
	 */
	static setLocales($locales) {
		BifrostApp.cfg.locales = $locales;
		NavRegistry.setLocales($locales);
	}

	static enableSocket()          { BifrostApp.cfg.socket = true; }
	static disableSocket()         { BifrostApp.cfg.socket = false; }
	static enableBodyParser($options = true) { BifrostApp.cfg.bodyParser = $options; }
	static disableBodyParser()               { BifrostApp.cfg.bodyParser = false; }
	static enableCompression()     { BifrostApp.cfg.compression = true; }
	static disableCompression()    { BifrostApp.cfg.compression = false; }
	static enableResponseHelpers() { BifrostApp.cfg.responseHelpers = true; }
	static disableResponseHelpers(){ BifrostApp.cfg.responseHelpers = false; }
	static enableSecurityHeaders($options = {}) { BifrostApp.cfg.securityHeaders = $options; }
	static enableCors($options = {})     { BifrostApp.cfg.cors = $options; }
	static enableSessions($options = {}) { BifrostApp.cfg.sessions = $options; }
	static enableCsrf($options = {})     { BifrostApp.cfg.csrf = $options; }
	static enableLogging($options = {})  { BifrostApp.cfg.logging = { ...BifrostApp.cfg.logging, ...$options }; }
	static enableSSL($key, $cert)  {
		BifrostApp.cfg.ssl = true;
		if ($key && $cert) BifrostApp.cfg.sslCert = { key: $key, cert: $cert };
	}
	static disableSSL() {
		BifrostApp.cfg.ssl = false;
		BifrostApp.cfg.sslCert = null;
	}


	// ── Instanz ───────────────────────────────────────────────────────────────

	#bifrost   = null;
	#io        = null;
	#router    = null;
	#db        = null;
	#log       = null;
	#services  = new Map();
	#errorHandlers = new Map();


	// ── Error-Handler ─────────────────────────────────────────────────────────

	/**
	 * Setzt einen benutzerdefinierten Error-Handler.
	 * @param {number} $status  HTTP-Statuscode (z.B. 404, 500)
	 * @param {Function} $handler  ($req, $res) => void
	 */
	setErrorHandler($status, $handler) {
		this.#errorHandlers.set($status, $handler);
		return this;
	}

	/** Gibt den Error-Handler für den Statuscode zurück, oder den built-in Fallback.
	 * @param {number} $status
	 * @returns {Function}
	 */
	getErrorHandler($status) {
		return this.#errorHandlers.get($status) ?? BifrostApp.#builtInHandlers[$status] ?? BifrostApp.#builtInHandlers[500];
	}

	static #builtInHandlers = {
		404: handler404,
		500: handler500,
	};


	// ── Service-Registry ─────────────────────────────────────────────────────

	register($name, $service) { this.#services.set($name, $service); return this; }
	service($name)            { return this.#services.get($name); }


	// ── Navigation ───────────────────────────────────────────────────────────

	/**
	 * Gibt die sortierten Nav-Einträge einer Navigation zurück.
	 * Einträge werden von Router::loadControllers via Controller::menu befüllt.
	 * @param {string} $nav  Nav-Name (z.B. 'main', 'footer')
	 * @returns {Array<{slug: string, lang: string, order: number}>}
	 */
	getNav($nav = 'main') {
		return NavRegistry.getNav($nav);
	}


	// ── Getter ────────────────────────────────────────────────────────────────

	get bifrost() { return this.#bifrost; }
	get io()      { return this.#io; }
	get router()  { return this.#router; }
	get db()      { return this.#db; }
	set db($db)   { this.#db = $db; }
	get log()     { return this.#log; }


	// ── Router-Shortcuts ─────────────────────────────────────────────────────

	/**
	 * Lädt function-basierte Routen aus einem Ordner.
	 * @param {string} $dir  Absoluter Pfad zum Routen-Ordner
	 */
	async loadRoutes($dir) {
		return Router.loadRoutes(this.#bifrost, $dir);
	}

	/**
	 * Scannt einen Ordner nach BBController-Subklassen und registriert sie.
	 * Die App-Instanz (this) wird automatisch als $app übergeben.
	 * @param {string} $dir  Absoluter Pfad zum Controllers-Ordner
	 */
	async loadControllers($dir) {
		return Router.loadControllers(this.#bifrost, this, $dir);
	}


	// ── Template Engine ───────────────────────────────────────────────────────

	/**
	 * Konfiguriert Galdr (Template Engine).
	 * @param {{ views: string, partials?: string, layouts?: string, cache?: boolean }} $options
	 */
	static configureViews($options) {
		Galdr.configure($options);
	}

	/** Gibt die Galdr-Klasse zurück (statische Engine). */
	get galdr() { return Galdr; }


	// ── Startup ───────────────────────────────────────────────────────────────

	/**
	 * Initialisiert Bifröst mit den gesetzten Optionen.
	 * Gibt { app, bifrost, io } zurück.
	 * @param {object} $options  Optionale Overrides (port, host, ssl, ...)
	 */
	async startup($options = {}) {
		const cfg = { ...BifrostApp.cfg, ...$options };

		this.#log = new Logger(cfg.logging);

		this.#bifrost = new Bifrost({
			port:        cfg.port,
			host:        cfg.host,
			ssl:         cfg.ssl,
			sslCert:     cfg.sslCert,
			compression: cfg.compression,
		});

		// Locale-Prefix-Routing konfigurieren
		if (cfg.locales) this.#bifrost.setLocales(cfg.locales);

		// Runen registrieren — Reihenfolge: Logger → Security → CORS → RateLimit → ResponseHelpers → Body → Static
		if (cfg.logging) {
			this.#bifrost.use(Bifrost.createLoggerRune(this.#log));
		}
		if (cfg.securityHeaders) this.#bifrost.use(Bifrost.createSecurityHeadersRune(
			typeof cfg.securityHeaders === 'object' ? cfg.securityHeaders : {}
		));
		if (cfg.cors)            this.#bifrost.use(Bifrost.createCorsRune(
			typeof cfg.cors === 'object' ? cfg.cors : {}
		));
		if (cfg.rateLimit)       this.#bifrost.use(Bifrost.createRateLimitRune(
			typeof cfg.rateLimit === 'object' ? cfg.rateLimit : {}
		));
		if (cfg.sessions)        this.#bifrost.use(Bifrost.createSessionRune(
			typeof cfg.sessions === 'object' ? cfg.sessions : {}
		));
		if (cfg.responseHelpers) this.#bifrost.use(Bifrost.createResponseHelperRune());
		if (cfg.bodyParser)      this.#bifrost.use(Bifrost.createBodyParserRune(
			typeof cfg.bodyParser === 'object' ? cfg.bodyParser : {}
		));
		if (cfg.csrf)            this.#bifrost.use(Bifrost.createCsrfRune(
			typeof cfg.csrf === 'object' ? cfg.csrf : {}
		));
		if (cfg.static)          this.#bifrost.use(Bifrost.createStaticRune(cfg.static));

		// Socket.io
		if (cfg.socket) {
			this.#io = await this.#bifrost.attachSockets();
		} else {
			await this.#bifrost.initServer();
		}

		// Error-Handler in Bifrost injizieren
		this.#bifrost.setErrorHandler(404, ($req, $res) => this.getErrorHandler(404)($req, $res));
		this.#bifrost.setErrorHandler(500, ($req, $res, $err) => this.getErrorHandler(500)($req, $res, $err));

		this.#router = Router;

		return { app: this, bifrost: this.#bifrost, io: this.#io, router: this.#router };
	}

	async run() {
		await this.#bifrost.ignite();
	}

}
