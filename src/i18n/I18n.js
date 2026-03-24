/**
 * I18n — Bifröst Internationalisierung
 *
 * Design-Prinzipien:
 *  - Lazy Load: Sprachdateien werden erst beim ersten Zugriff geladen
 *  - Global Cache: geladene Namespaces bleiben für die Laufzeit im Speicher
 *    (in development wird der Cache übersprungen → kein Serverneustart nötig)
 *  - Namespace-Trennung: 'common' + seitenspezifische Namespaces
 *  - Fallback-Kette: angefragte Locale → Fallback-Locale → Key selbst
 *  - Params: {{ name }}, {{ count }} etc. per Interpolation
 *  - Plural: { "one": "...", "other": "..." } via count-Param
 *
 * Dateistruktur (Standard):
 *   i18n/
 *     de/
 *       common.json
 *       home.json
 *     en/
 *       common.json
 *       home.json
 *
 * @example
 * // In einem BBController:
 * const t = await this.i18n('de', ['common', 'home']);
 * this.render('home', { title: t('page.title'), t });
 *
 * // Im Template (dot-notation-freundlich):
 * {{ t.page_title }}        // → Key 'page.title' als 'page_title' abrufbar über Proxy
 */

import { readFile }  from 'node:fs/promises';
import { join }      from 'node:path';
import { existsSync } from 'node:fs';

const DEV = process.env.NODE_ENV !== 'production';

export class I18n {

	// ── Konfiguration ─────────────────────────────────────────────────────────

	static #baseDir        = null;
	static #fallbackLocale = 'de';

	/**
	 * Konfiguriert den I18n-Service (einmalig in app.js aufrufen).
	 * @param {object} $opts
	 * @param {string} $opts.dir              Absoluter Pfad zum i18n-Verzeichnis
	 * @param {string} [$opts.fallback='de']  Fallback-Locale wenn Key fehlt
	 */
	static configure($opts) {
		if ($opts.dir)      I18n.#baseDir        = $opts.dir;
		if ($opts.fallback) I18n.#fallbackLocale = $opts.fallback;
	}

	/** Gibt true zurück wenn I18n.configure() aufgerufen wurde. */
	static isConfigured() {
		return I18n.#baseDir !== null;
	}

	/**
	 * Gibt die gemergten Rohdaten für eine Locale zurück (für direkte Template-Nutzung).
	 * Ermöglicht {{ nav.home }} statt {{ t('nav.home') }} in Templates.
	 * @param {string}          $locale
	 * @param {string|string[]} $namespaces
	 * @returns {Promise<Record<string,any>>}
	 */
	static async getRaw($locale, $namespaces = ['common']) {
		const nsList = Array.isArray($namespaces) ? $namespaces : [$namespaces];
		const locale = I18n.#normalizeLocale($locale);
		const merged = {};
		await Promise.all(nsList.map(async ($ns) => {
			const data = await I18n.#loadNs(locale, $ns);
			Object.assign(merged, data);
		}));
		return merged;
	}

	// ── Cache ────────────────────────────────────────────────────────────────

	/** Map<'de:common', Record<string,any>> */
	static #cache = new Map();

	static #cacheKey($locale, $ns) {
		return `${$locale}:${$ns}`;
	}

	/** Alle gecachten Einträge löschen (z.B. für Tests). */
	static clearCache() {
		I18n.#cache.clear();
	}


	// ── Laden ────────────────────────────────────────────────────────────────

	/**
	 * Lädt einen einzelnen Namespace für eine Locale.
	 * Gibt {} zurück wenn die Datei nicht existiert (kein Fehler).
	 * @param {string} $locale  z.B. 'de'
	 * @param {string} $ns      z.B. 'common'
	 * @returns {Promise<Record<string,any>>}
	 */
	static async #loadNs($locale, $ns) {
		const key = I18n.#cacheKey($locale, $ns);

		// Cache-Hit (nur in production oder wenn bereits geladen)
		if (!DEV && I18n.#cache.has(key)) return I18n.#cache.get(key);
		if (DEV  && I18n.#cache.has(key)) return I18n.#cache.get(key);

		if (!I18n.#baseDir) {
			throw new Error('[I18n] Kein Basisverzeichnis konfiguriert. I18n.configure({ dir }) aufrufen.');
		}

		const filePath = join(I18n.#baseDir, $locale, `${$ns}.json`);

		if (!existsSync(filePath)) {
			// Namespace existiert nicht → leeres Objekt, nicht cachen in dev
			if (!DEV) I18n.#cache.set(key, {});
			return {};
		}

		try {
			const raw  = await readFile(filePath, 'utf8');
			const data = JSON.parse(raw);
			I18n.#cache.set(key, data);
			return data;
		} catch ($err) {
			throw new Error(`[I18n] Fehler beim Laden von '${filePath}': ${$err.message}`);
		}
	}

	/**
	 * Lädt mehrere Namespaces und gibt eine Translator-Funktion zurück.
	 *
	 * @param {string}          $locale      Gewünschte Locale, z.B. 'de'
	 * @param {string|string[]} $namespaces  Namespaces, z.B. ['common', 'home']
	 * @returns {Promise<TranslatorFn>}
	 */
	static async load($locale, $namespaces = ['common']) {
		const nsList = Array.isArray($namespaces) ? $namespaces : [$namespaces];
		const locale = I18n.#normalizeLocale($locale);
		const fbLocale = I18n.#fallbackLocale;

		// Haupt-Locale + Fallback parallel laden
		const toLoad = [...new Set([locale, fbLocale])];
		const loaded = {};

		await Promise.all(
			toLoad.flatMap($loc =>
				nsList.map(async $ns => {
					const data = await I18n.#loadNs($loc, $ns);
					if (!loaded[$loc]) loaded[$loc] = {};
					Object.assign(loaded[$loc], data);
				})
			)
		);

		return I18n.#createTranslator(locale, fbLocale, loaded);
	}


	// ── Locale-Erkennung ─────────────────────────────────────────────────────

	/**
	 * Ermittelt die Locale aus einem HTTP-Request.
	 * Priorität: Cookie 'locale' → Accept-Language-Header → Fallback
	 *
	 * @param {import('node:http').IncomingMessage} $req
	 * @returns {string}  z.B. 'de'
	 */
	static detectLocale($req) {
		// 0. URL-Präfix (gesetzt von Bifrost Locale-Prefix-Routing)
		if ($req._locale && I18n.#isValidLocale($req._locale)) return $req._locale;

		// 1. Cookie 'locale'
		const cookieLocale = I18n.#parseCookie($req.headers.cookie ?? '', 'locale');
		if (cookieLocale && I18n.#isValidLocale(cookieLocale)) return cookieLocale;

		// 2. Accept-Language Header
		const acceptLang = $req.headers['accept-language'];
		if (acceptLang) {
			const parsed = I18n.#parseAcceptLanguage(acceptLang);
			if (parsed) return parsed;
		}

		// 3. Fallback
		return I18n.#fallbackLocale;
	}

	static #normalizeLocale($locale) {
		// 'de-AT' → 'de', 'en-US' → 'en'
		return String($locale).slice(0, 2).toLowerCase();
	}

	static #isValidLocale($locale) {
		return /^[a-z]{2}$/.test($locale);
	}

	static #parseCookie($cookieHeader, $name) {
		for (const part of $cookieHeader.split(';')) {
			const [key, ...vals] = part.trim().split('=');
			if (key.trim() === $name) return decodeURIComponent(vals.join('=').trim());
		}
		return null;
	}

	static #parseAcceptLanguage($header) {
		// 'de-AT,de;q=0.9,en;q=0.8' → 'de'
		const first = $header.split(',')[0];
		const lang  = first.split(';')[0].trim().slice(0, 2).toLowerCase();
		return I18n.#isValidLocale(lang) ? lang : null;
	}


	// ── Translator-Fabrik ─────────────────────────────────────────────────────

	/**
	 * @typedef {(key: string, params?: Record<string,string|number>) => string} TranslatorFn
	 */

	/**
	 * Erstellt die `t()`-Funktion für Templates und Controller.
	 *
	 * @param {string}                          $locale
	 * @param {string}                          $fb       Fallback-Locale
	 * @param {Record<string, Record<string,*>> $loaded   { 'de': {...}, 'en': {...} }
	 * @returns {TranslatorFn}
	 */
	static #createTranslator($locale, $fb, $loaded) {
		const main     = $loaded[$locale] ?? {};
		const fallback = $loaded[$fb]     ?? {};

		/**
		 * Übersetzt einen Key.
		 * @param {string}                        $key     Dot-Notation: 'nav.home'
		 * @param {Record<string,string|number>}  [$params] Interpolations-Params + count
		 */
		const t = ($key, $params = {}) => {
			// Roh-Wert: erst Haupt-Locale, dann Fallback, dann Key selbst
			const raw = I18n.#resolveDot(main, $key)
				?? I18n.#resolveDot(fallback, $key)
				?? $key;

			// Plural-Auflösung: { "one": "...", "other": "..." }
			const resolved = I18n.#resolvePlural(raw, $params.count);

			// Param-Interpolation: "Hallo {name}" + { name: 'Max' } → "Hallo Max"
			return I18n.#interpolate(resolved, $params);
		};

		return t;
	}


	// ── Key-Auflösung ─────────────────────────────────────────────────────────

	/** Dot-Notation-Pfad-Auflösung: 'nav.home' → obj.nav.home */
	static #resolveDot($obj, $key) {
		return $key.split('.').reduce((o, k) => o?.[k], $obj) ?? null;
	}

	/**
	 * Plural-Auflösung.
	 * Wenn raw ein Objekt mit 'one'/'other'/'zero' ist → passende Form wählen.
	 * Unterstützte Schlüssel: zero | one | two | few | many | other
	 */
	static #resolvePlural($raw, $count) {
		if (typeof $raw !== 'object' || $raw === null) return $raw;

		if ($count === undefined) return $raw.other ?? $raw.one ?? Object.values($raw)[0] ?? '';

		const n = Number($count);
		if (n === 0 && 'zero'  in $raw) return $raw.zero;
		if (n === 1 && 'one'   in $raw) return $raw.one;
		if (n === 2 && 'two'   in $raw) return $raw.two;
		return $raw.other ?? $raw.one ?? '';
	}

	/**
	 * Interpoliert `{name}`, `{count}` etc. in einen String.
	 * Sicher: nur bekannte Params werden ersetzt, kein eval.
	 */
	static #interpolate($str, $params) {
		if (!$str || typeof $str !== 'string' || Object.keys($params).length === 0) {
			return String($str ?? '');
		}
		return $str.replace(/\{(\w+)\}/g, (_, $k) =>
			Object.prototype.hasOwnProperty.call($params, $k)
				? String($params[$k])
				: `{${$k}}`
		);
	}
}
