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
export class BBController {

	// ── Static-API (vom Router ausgelesen) ────────────────────────────────────

	/** HTTP-Pfad, z.B. '/:username/overlay' */
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


	// ── Lifecycle ─────────────────────────────────────────────────────────────

	/**
	 * Wird vor dem Method-Handler aufgerufen.
	 * Hier können Checks (Auth, Params etc.) stattfinden.
	 * Gibt false zurück → Dispatch wird abgebrochen (z.B. weil redirect() bereits gesendet).
	 * @returns {Promise<boolean>}
	 */
	async prepare() { return true; }


	// ── Method-Handler (zu überschreiben) ────────────────────────────────────

	async get()    { this.next(); }
	async post()   { this.next(); }
	async put()    { this.next(); }
	async patch()  { this.next(); }
	async delete() { this.next(); }

}
