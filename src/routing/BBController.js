/**
 * BBController — Bifröst Base Controller
 *
 * Basisklasse für alle HTTP-Controller.
 * Subklassen definieren via static properties welche Routen sie bedienen.
 *
 * @example
 * export default class OverlayController extends BBController {
 *     static path    = '/:username/overlay';
 *     static methods = ['get'];
 *
 *     async get() {
 *         this.send(200, '<html>...</html>', 'text/html');
 *     }
 * }
 */
import { I18n }         from '../i18n/I18n.js';
import { NavRegistry }  from './NavRegistry.js';
export class BBController {

	// ── Static-API (vom Router ausgelesen) ────────────────────────────────────

	/** Menu-Einträge für die Navigation (wird von NavRegistry ausgelesen). */
	static menu = [];

	/** HTTP-Pfad oder Array von Pfaden, z.B. '/:username/overlay', ['/login', '/anmelden'] oder '/api/*' */
	static path = '/';

	/** HTTP-Methoden, die dieser Controller bedient */
	static methods = ['get'];

	/**
	 * Wenn true: paramName + paramCb werden für Express-Parameter-Middleware genutzt.
	 * Wird implizit true, wenn paramName gesetzt ist.
	 */
	static withParam = false;

	/** Name des URL-Parameters, der per paramCb validiert/geladen wird */
	static paramName = null;

	/**
	 * Async-Callback zur Parameter-Validierung/-Auflösung.
	 * Wird vor dem eigentlichen Handler aufgerufen.
	 * @type {(($value: string, $req: IncomingMessage) => Promise<any>) | null}
	 */
	static paramCb = null;


	// ── Instanz ───────────────────────────────────────────────────────────────

	#req  = null;
	#res  = null;
	#next = null;
	#app  = null;

	// ── SEO-Properties (in Subklassen überschreiben) ──────────────────────────

	/** Seiten-Titel — wird als <title> und og:title verwendet */
	title       = null;
	/** Meta-Description */
	description = '';
	/** Komma-separierte Keywords */
	keywords    = '';
	/** robots-Direktive, z.B. 'noindex, nofollow' */
	robots      = 'index, follow';

	constructor($request, $response, $next = null, $app = null) {
		this.#req  = $request;
		this.#res  = $response;
		this.#next = $next;
		this.#app  = $app;

		this.params = $request.params ?? {};
		this.url    = new URL($request.url, `http://${$request.headers.host}`);
		this.body   = $request.body ?? null;
	}


	// ── App-Zugriff ───────────────────────────────────────────────────────────

	get app()  { return this.#app; }
	get req()  { return this.#req; }
	get res()  { return this.#res; }


	// ── Response-Helfer ───────────────────────────────────────────────────────

	send($status, $body, $contentType = 'text/plain') {
		if (this.#res.writableEnded) return;
		this.#res.setHeader('Content-Type', $contentType);
		this.#res.writeHead($status);
		this.#res.end($body);
	}

	json($data, $status = 200) {
		if (this.#res.writableEnded) return;
		const body = JSON.stringify($data);
		this.#res.setHeader('Content-Type', 'application/json');
		this.#res.writeHead($status);
		this.#res.end(body);
	}

	html($html, $status = 200) {
		this.send($status, $html, 'text/html; charset=utf-8');
	}

	/**
	 * Rendert ein Galdr-Template und sendet das Ergebnis als HTML-Response.
	 * @param {string} $template  Template-Name (ohne .html) oder absoluter Pfad
	 * @param {object} $data      Template-Variablen
	 * @param {number} $status    HTTP-Statuscode (default: 200)
	 */
	async render($template, $data = {}, $status = 200) {
		// Auto-Inject: Roh-Daten aus Namespace(s) + Cookie-Persistenz bei URL-Locale
		if (I18n.isConfigured()) {
			const locale = this.locale;
			// _ns aus $data lesen (z.B. _ns: ['common', 'about']); Fallback: 'common'
			const ns     = Array.isArray($data._ns) ? $data._ns : ['common'];
			const rawData = await I18n.getRaw(locale, ns);
				const t     = 't' in $data ? $data.t : await this.i18n(ns);
			const _path = this.req.url?.split('?')[0] || '/';

			// Nav aus Registry aufbauen: sortiert, übersetzt, active-Flag gesetzt
			const _nav = {};
			for (const navName of NavRegistry.getNavNames()) {
				_nav[navName] = NavRegistry.getNav(navName).map($entry => ({
					slug:     $entry.slug,
					label:    t($entry.lang),
					external: !!$entry.external,
					active:   !$entry.external && _path === $entry.slug,
				}));
			}

			// LangSwitch aus konfigurierten Locales aufbauen
			const _langSwitch = await NavRegistry.getLangSwitch(locale);

			// SEO-Defaults — Priorität: $data > Instanz-Property > Fallback
			// Host/Proto aus vertrauenswürdiger Quelle: APP_PROTO/APP_HOST env-Vars haben Vorrang
			const proto = process.env.APP_PROTO
				?? (this.req.socket?.encrypted ? 'https' : (this.req.headers['x-forwarded-proto']?.split(',')[0].trim() ?? 'http'));
			const host  = process.env.APP_HOST ?? this.req.headers.host ?? 'localhost';
			const seoDefaults = {
				description: $data.description ?? this.description,
				keywords:    $data.keywords    ?? this.keywords,
				canonical:   $data.canonical   ?? `${proto}://${host}${_path}`,
				robots:      $data.robots      ?? this.robots,
				ogType:      $data.ogType      ?? 'website',
				twitterCard: $data.twitterCard ?? 'summary',
			};

			$data = { year: new Date().getFullYear(), _path, _nav, _langSwitch, ...seoDefaults, ...rawData, ...$data, t, _locale: locale };
			delete $data._ns;
			// title: $data > Instanz-Property > page.title
			if (!$data.title) $data.title = this.title ?? $data.page?.title ?? null;
			// Locale aus URL-Präfix als Cookie persistieren
			if (this.req._locale) {
				const isHttps = this.req.socket?.encrypted || this.req.headers['x-forwarded-proto']?.split(',')[0].trim() === 'https';
				this.res.setHeader(
					'Set-Cookie',
					`locale=${this.req._locale}; Path=/; Max-Age=31536000; SameSite=Lax${isHttps ? '; Secure' : ''}`
				);
			}
		}
		const { Galdr } = await import('../template/Galdr.js');
		const rendered  = await Galdr.render($template, $data);
		this.html(rendered, $status);
	}

	redirect($url, $status = 302) {
		if (this.#res.writableEnded) return;
		this.#res.writeHead($status, { Location: $url });
		this.#res.end();
	}

	next() {
		if (typeof this.#next === 'function') this.#next();
	}


	// ── I18n ─────────────────────────────────────────────────────────────────

	/**
	 * Ermittelt die Locale des aktuellen Requests.
	 * Priorität: Cookie 'locale' → Accept-Language → Fallback-Locale aus I18n.configure()
	 * @returns {string}  z.B. 'de'
	 */
	get locale() {
		return I18n.detectLocale(this.#req);
	}

	/**
	 * Lädt Übersetzungen und gibt eine Translator-Funktion zurück.
	 * Shorthand für I18n.load(this.locale, namespaces).
	 *
	 * @param {string|string[]} $namespaces  z.B. ['common', 'home'] oder 'common'
	 * @param {string}          [$locale]    Override; Default: this.locale
	 * @returns {Promise<import('../i18n/I18n.js').TranslatorFn>}
	 *
	 * @example
	 * async get() {
	 *     const t = await this.i18n(['common', 'home']);
	 *     this.render('home', { title: t('page.title'), t });
	 * }
	 */
	async i18n($namespaces = ['common'], $locale = null) {
		return I18n.load($locale ?? this.locale, $namespaces);
	}

	/**
	 * Gibt die sortierten Nav-Einträge zurück (delegiert an App oder NavRegistry direkt).
	 * @param {string} $nav  Nav-Name (default: 'main')
	 * @returns {Array<{slug: string, lang: string, order: number}>}
	 */
	getNav($nav = 'main') {
		return this.#app?.getNav($nav) ?? NavRegistry.getNav($nav);
	}


	// ── Lifecycle ─────────────────────────────────────────────────────────────

	/**
	 * Wird vor dem Method-Handler aufgerufen.
	 * Hier können Checks (Auth, Params etc.) stattfinden.
	 * Gibt false zurück → Dispatch wird abgebrochen (z.B. weil redirect() bereits gesendet).
	 * @returns {Promise<boolean>}
	 */
	async prepare() { return true; }


	// ── Method-Handler (zu überschreiben) ────────────────────────────────────

	/**
	 * Gemeinsamer Handler für alle HTTP-Methoden.
	 * Wird aufgerufen, wenn kein spezifischer Handler (get/post/...) überschrieben wurde.
	 * Subklassen können handle() überschreiben, um GET + POST in einer Methode zu bedienen.
	 *
	 * @param {string} $method  HTTP-Methode in Kleinbuchstaben ('get', 'post', ...)
	 *
	 * @example
	 * async handle($method) {
	 *     const t = await this.i18n(['common', 'home']);
	 *     await this.render('home', { t });
	 * }
	 */
	async handle($method) { this.next(); }

	async get()    { return this.handle('get'); }
	async post()   { return this.handle('post'); }
	async put()    { return this.handle('put'); }
	async patch()  { return this.handle('patch'); }
	async delete() { return this.handle('delete'); }

	/**
	 * Liest einen Cookie-Wert anhand des Namens aus.
	 */
	getCookie(name) {
		const cookies = this.req.headers.cookie;
		if (!cookies) return null;
		const match = cookies.match(new RegExp('(^| )' + name + '=([^;]+)'));
		return match ? decodeURIComponent(match[2]) : null;
	}

	/**
	 * Setzt einen Cookie sicher und fügt ihn den bestehenden Headern hinzu.
	 */
	setCookie(name, value, options = {}) {
		let cookieStr = `${name}=${encodeURIComponent(value)}; Path=${options.path || '/'}`;
		if (options.maxAge) cookieStr += `; Max-Age=${options.maxAge}`;
		if (options.httpOnly) cookieStr += `; HttpOnly`;
		if (options.secure) cookieStr += `; Secure`;
		if (options.sameSite) cookieStr += `; SameSite=${options.sameSite}`;

		let existing = this.res.getHeader('Set-Cookie');
		let cookies = [];
		if (existing) {
			cookies = Array.isArray(existing) ? existing : [existing];
		}
		cookies.push(cookieStr);
		
		this.res.setHeader('Set-Cookie', cookies);
	}

	/**
	 * Holt das Token primär aus dem Authorization-Header, 
	 * oder fallbacksweise aus einem Cookie.
	 */
	get token() {
		const authHeader = this.req.headers.authorization;
		if (authHeader && authHeader.startsWith('Bearer ')) {
			return authHeader.substring(7);
		}
		// Fallback für Web-Sessions (z.B. Adminpanel)
		return this.getCookie('auth_token');
	}

	/**
	 * Prüft rein strukturell, ob das aktuelle Token das Format eines JWT hat (Header.Payload.Signature).
	 */
	get isJWT() {
		const t = this.token;
		if (!t) return false;
		return /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(t);
	}

	/**
	 * Dekodiert den Payload des JWTs (ACHTUNG: Ohne Signatur-Prüfung!).
	 * Nützlich, um z.B. Ablaufdaten (exp) oder Metadaten auszulesen, bevor verifiziert wird.
	 */
	get jwtPayload() {
		if (!this.isJWT) return null;
		try {
			const base64Url = this.token.split('.')[1];
			const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
			const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
			return JSON.parse(jsonPayload);
		} catch (err) {
			return null;
		}
	}

	/**
	 * Gibt den aktiven User zurück (wird idealerweise von einer Auth-Rune gesetzt)
	 */
	get user() {
		return this.req.user || null;
	}

	/**
	 * Hilfsmethode zur Überprüfung, ob ein User eingeloggt ist.
	 */
	get isAuthenticated() {
		return !!this.user;
	}

	// ── Guards ───────────────────────────────────────────────────────────────

	/**
	 * Guard: Prüft, ob ein User eingeloggt ist. Wenn nicht, erfolgt ein Redirect.
	 * Räumt automatisch ungültige Session-Cookies auf.
	 * 
	 * @param {string} $redirectUrl URL für den Redirect (default: '/login')
	 * @returns {boolean} true wenn eingeloggt, false wenn nicht (bricht Dispatch ab)
	 */
	requireAuth($redirectUrl = '/login') {
		if (!this.isAuthenticated) {
			// Fallback: Wenn ein Token-Cookie da ist, aber ungültig war, räumen wir auf.
			if (this.getCookie('auth_token')) {
				this.setCookie('auth_token', '', { maxAge: -1, path: '/' });
			}
			this.redirect($redirectUrl);
			return false;
		}
		return true;
	}

	/**
	 * Guard: Prüft, ob der eingeloggte User eine bestimmte Rolle besitzt.
	 * 
	 * @param {string|string[]} $roles Erlaubte Rolle(n) (z.B. 'admin' oder ['admin', 'editor'])
	 * @param {string} $redirectUrl URL für den Redirect bei fehlenden Rechten
	 * @returns {boolean}
	 */
	requireRole($roles, $redirectUrl = '/login') {
		if (!this.requireAuth($redirectUrl)) return false;
		
		const roles = Array.isArray($roles) ? $roles : [$roles];
		if (!this.user?.role || !roles.includes(this.user.role)) {
			this.redirect($redirectUrl);
			return false;
		}
		return true;
	}

}