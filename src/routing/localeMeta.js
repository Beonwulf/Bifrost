/**
 * localeMeta — Built-in Metadaten für gängige Locale-Codes.
 *
 * Wird von NavRegistry einmalig geladen (dynamischer Import).
 * flag: ISO 3166-1 alpha-2 Ländercode für CSS-Klasse (flag--XX)
 */
export const LOCALE_META = {
	// ── Europa ────────────────────────────────────────────────────────────────
	de: { label: 'Deutsch',      ariaLabel: 'Deutsch',       flag: 'de' },
	en: { label: 'English',      ariaLabel: 'English',       flag: 'gb' },
	fr: { label: 'Français',     ariaLabel: 'Français',      flag: 'fr' },
	es: { label: 'Español',      ariaLabel: 'Español',       flag: 'es' },
	it: { label: 'Italiano',     ariaLabel: 'Italiano',      flag: 'it' },
	pt: { label: 'Português',    ariaLabel: 'Português',     flag: 'pt' },
	nl: { label: 'Nederlands',   ariaLabel: 'Nederlands',    flag: 'nl' },
	pl: { label: 'Polski',       ariaLabel: 'Polski',        flag: 'pl' },
	cs: { label: 'Čeština',      ariaLabel: 'Čeština',       flag: 'cz' },
	sk: { label: 'Slovenčina',   ariaLabel: 'Slovenčina',    flag: 'sk' },
	hu: { label: 'Magyar',       ariaLabel: 'Magyar',        flag: 'hu' },
	ro: { label: 'Română',       ariaLabel: 'Română',        flag: 'ro' },
	bg: { label: 'Български',    ariaLabel: 'Bulgarski',     flag: 'bg' },
	hr: { label: 'Hrvatski',     ariaLabel: 'Hrvatski',      flag: 'hr' },
	sr: { label: 'Srpski',       ariaLabel: 'Srpski',        flag: 'rs' },
	sv: { label: 'Svenska',      ariaLabel: 'Svenska',       flag: 'se' },
	no: { label: 'Norsk',        ariaLabel: 'Norsk',         flag: 'no' },
	da: { label: 'Dansk',        ariaLabel: 'Dansk',         flag: 'dk' },
	fi: { label: 'Suomi',        ariaLabel: 'Suomi',         flag: 'fi' },
	el: { label: 'Ελληνικά',     ariaLabel: 'Ellinika',      flag: 'gr' },
	tr: { label: 'Türkçe',       ariaLabel: 'Türkçe',        flag: 'tr' },
	uk: { label: 'Українська',   ariaLabel: 'Ukrainska',     flag: 'ua' },
	ru: { label: 'Русский',      ariaLabel: 'Russkiy',       flag: 'ru' },

	// ── Naher Osten / Asien ───────────────────────────────────────────────────
	ar: { label: 'العربية',      ariaLabel: 'Arabic',        flag: 'sa' },
	he: { label: 'עברית',        ariaLabel: 'Hebrew',        flag: 'il' },
	fa: { label: 'فارسی',        ariaLabel: 'Farsi',         flag: 'ir' },
	hi: { label: 'हिन्दी',       ariaLabel: 'Hindi',         flag: 'in' },
	bn: { label: 'বাংলা',        ariaLabel: 'Bengali',       flag: 'bd' },
	zh: { label: '中文',          ariaLabel: 'Chinese',       flag: 'cn' },
	ja: { label: '日本語',        ariaLabel: 'Japanese',      flag: 'jp' },
	ko: { label: '한국어',        ariaLabel: 'Korean',        flag: 'kr' },
	th: { label: 'ภาษาไทย',      ariaLabel: 'Thai',          flag: 'th' },
	vi: { label: 'Tiếng Việt',   ariaLabel: 'Vietnamese',    flag: 'vn' },
	id: { label: 'Bahasa Indonesia', ariaLabel: 'Indonesian', flag: 'id' },
	ms: { label: 'Bahasa Melayu',ariaLabel: 'Malay',         flag: 'my' },

	// ── Amerika ───────────────────────────────────────────────────────────────
	'pt-br': { label: 'Português (BR)', ariaLabel: 'Português Brasil', flag: 'br' },
	'es-mx': { label: 'Español (MX)',   ariaLabel: 'Español México',   flag: 'mx' },
};
