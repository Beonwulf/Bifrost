/**
 * NavRegistry — Bifröst Navigation Registry
 *
 * Singleton, der alle Menu-Einträge aus Controller::menu sammelt
 * und nach Nav-Name sortiert bereitstellt.
 * Verwaltet zusätzlich die konfigurierten Locales für den LangSwitch.
 *
 * @example
 * // Controller deklariert:
 * static menu = [{ main: 1, lang: 'nav.home' }];
 *
 * // Ergebnis nach loadControllers():
 * NavRegistry.getNav('main') // → [{ slug: '/', lang: 'nav.home', order: 1 }]
 *
 * // LangSwitch:
 * NavRegistry.setLocales(['de', 'en', 'fr']);
 * NavRegistry.getLangSwitch('de') // → [{ code, label, flag, href, active }]
 */

/** Einmalig gecachte Locale-Metadaten (lazy-loaded). */
let localeMeta = null;
async function getLocaleMeta() {
	if (!localeMeta) {
		({ LOCALE_META: localeMeta } = await import('./localeMeta.js'));
	}
	return localeMeta;
}

export class NavRegistry {

	/** @type {Map<string, Array<{slug: string, lang: string, order: number}>>} */
	static #menus = new Map();

	/** @type {string[]} */
	static #locales = [];

	/**
	 * Registriert einen einzelnen Nav-Eintrag.
	 * @param {string} $nav    Nav-Name (z.B. 'main', 'footer')
	 * @param {{ slug: string, lang: string, order: number }} $entry
	 */
	static register($nav, $entry) {
		if (!NavRegistry.#menus.has($nav)) NavRegistry.#menus.set($nav, []);
		NavRegistry.#menus.get($nav).push($entry);
	}

	/**
	 * Gibt alle Einträge einer Nav nach Reihenfolge sortiert zurück.
	 * @param {string} $nav  Nav-Name (default: 'main')
	 * @returns {Array<{slug: string, lang: string, order: number}>}
	 */
	static getNav($nav = 'main') {
		const entries = NavRegistry.#menus.get($nav) ?? [];
		return [...entries].sort(($a, $b) => $a.order - $b.order);
	}

	/**
	 * Gibt alle registrierten Nav-Namen zurück.
	 * @returns {string[]}
	 */
	static getNavNames() {
		return [...NavRegistry.#menus.keys()];
	}

	/**
	 * Setzt die verfügbaren Locale-Codes (werden von BifrostApp.setLocales() aufgerufen).
	 * @param {string[]} $locales  z.B. ['de', 'en', 'fr']
	 */
	static setLocales($locales) {
		NavRegistry.#locales = [...$locales];
	}

	/**
	 * Gibt die LangSwitch-Einträge für die aktuelle Locale zurück.
	 * @param {string} $activeLocale  Aktuell aktive Locale (z.B. 'de')
	 * @returns {Promise<Array<{code: string, label: string, ariaLabel: string, flag: string, href: string, active: boolean}>>}
	 */
	static async getLangSwitch($activeLocale = '') {
		const meta = await getLocaleMeta();
		return NavRegistry.#locales.map($code => {
			const m = meta[$code] ?? { label: $code.toUpperCase(), ariaLabel: $code, flag: $code };
			return {
				code:      $code,
				label:     m.label,
				ariaLabel: m.ariaLabel,
				flag:      m.flag,
				href:      `/lang/${$code}`,
				active:    $code === $activeLocale,
			};
		});
	}

	/** Löscht alle Einträge (z.B. für Tests). */
	static clear() {
		NavRegistry.#menus.clear();
		NavRegistry.#locales = [];
	}

}
