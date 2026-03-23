/**
 * Galdr — Bifröst Template Engine
 *
 * Template-Syntax:
 *
 *   {{ $variable }}                      — HTML-escaped Ausgabe
 *   {{{ $variable }}}                    — Rohe (unescaped) Ausgabe
 *   {{ $nested.property }}               — Dot-Notation
 *
 *   {% partial name %}                   — Partial einbinden
 *
 *   {% if expr %}...{% else %}...{% endif %}   — Bedingung
 *   {% unless expr %}...{% endunless %}        — Inverse Bedingung
 *
 *   {% each array %}                     — Array-Schleife
 *     {{ this }}  {{ name }}             — Item-Kontext (Objekt-Properties direkt)
 *     {{ @index }} {{ @key }}            — Loop-Metadaten
 *     {{ @first }} {{ @last }}           — Boolean Flags
 *   {% endeach %}
 *
 *   {% each object %}                   — Objekt-Iteration (key/value)
 *     {{ @key }}: {{ this }}
 *   {% endeach %}
 *
 *   {% with obj %}...{% endwith %}       — Kontext-Wechsel
 *
 *   {% layout "name" %}...{% endlayout %} — Layout-Wrapper
 *                                          Layout-Datei nutzt {% yield %} als Slot
 *
 * Konfiguration:
 *   Galdr.configure({
 *       views:    '/absolute/path/to/views',     // String oder Array
 *       partials: '/absolute/path/to/partials',  // optional, Fallback: views-Dirs
 *       layouts:  '/absolute/path/to/layouts',   // optional, Fallback: views-Dirs
 *       cache:    true,                           // default: true
 *   });
 *
 *   // Zusätzliche Dirs mit höchster Priorität prependen (erster Treffer gewinnt):
 *   Galdr.addViews('/my/override/views');
 *   Galdr.addLayouts('/my/override/layouts');
 *   Galdr.addPartials('/my/override/partials');
 *
 * Suchreihenfolge: user-dirs (LIFO via unshift) → built-in src/template/views/
 * Absolute Pfade und Path-Traversal (..) sind in Template-Namen verboten.
 */

import { readFile }    from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __galdrDir = fileURLToPath(new URL('.', import.meta.url));

// Built-in Verzeichnisse — letzter Fallback, werden nie überschrieben
const BUILTIN_VIEWS    = join(__galdrDir, 'views');
const BUILTIN_LAYOUTS  = join(__galdrDir, 'views', 'layouts');
const BUILTIN_PARTIALS = join(__galdrDir, 'views', 'partials');


// ── Bifröst Built-in Templates ────────────────────────────────────────────────
// Gültige Namen für renderBuiltin() — Dateien liegen in src/template/views/.

export const BUILTIN_TEMPLATES = new Set(['404', '500']);


export class Galdr {

	static #cfg = {
		views:    null,
		partials: null,
		layouts:  null,
		cache:    true,
	};

	static #cache = new Map();


	// ── Konfiguration ─────────────────────────────────────────────────────────

	/**
	 * Konfiguriert die Template-Engine.
	 * @param {{ views?: string, partials?: string, layouts?: string, cache?: boolean }} $options
	 */
	static configure($options = {}) {
		if ($options.views    != null) Galdr.#cfg.views    = $options.views;
		if ($options.partials != null) Galdr.#cfg.partials = $options.partials;
		if ($options.layouts  != null) Galdr.#cfg.layouts  = $options.layouts;
		if ($options.cache    != null) Galdr.#cfg.cache    = $options.cache;
		Galdr.#cache.clear();
	}

	/** Leert den Template-Cache (z.B. im Entwicklungsmodus nützlich). */
	static clearCache() {
		Galdr.#cache.clear();
	}


	// ── Public API ────────────────────────────────────────────────────────────

	/**
	 * Rendert ein Template mit den gegebenen Daten zu HTML.
	 * @param {string} $template  Template-Name (ohne .galdr.html) — kein Pfad, kein ..
	 * @param {object} $data      Template-Variablen
	 * @returns {Promise<string>}
	 */
	static async render($template, $data = {}) {
		const dirs   = [...Galdr.#cfg.views, BUILTIN_VIEWS];
		const source = await Galdr.#load($template, dirs);
		return Galdr.#compile(source, $data);
	}

	/**
	 * Rendert einen Template-String direkt (kein File-I/O).
	 * @param {string} $source  Rohes Template als String
	 * @param {object} $data    Template-Variablen
	 * @returns {Promise<string>}
	 */
	static async renderString($source, $data = {}) {
		return Galdr.#compile($source, $data);
	}

	/**
	 * Rendert ein eingebautes Bifröst-Template (z.B. '404', '500').
	 * Kein views-Verzeichnis erforderlich.
	 * @param {string} $name  Name des Built-in Templates
	 * @param {object} $data  Template-Variablen
	 * @returns {Promise<string>}
	 */
	static async renderBuiltin($name, $data = {}) {
		if (!BUILTIN_TEMPLATES.has($name)) throw new Error(`Galdr: Kein Built-in Template "${$name}" vorhanden.`);
		const source = await Galdr.#load($name, [BUILTIN_VIEWS]);
		return Galdr.#compile(source, $data);
	}


	// ── Loader ────────────────────────────────────────────────────────────────

	/**
	 * Sucht ein Template in einem Array von Verzeichnissen (erster Treffer gewinnt).
	 * Absolute Pfade und Path-Traversal (..) sind verboten.
	 * @param {string}   $name  Template-Name (ohne .galdr.html)
	 * @param {string[]} $dirs  Suchreihenfolge der Verzeichnisse
	 */
	static async #load($name, $dirs) {
		// ── Sicherheit: kein absoluter Pfad, kein Path-Traversal ────────────────
		if (
			$name.includes('..') ||
			$name.startsWith('/') ||
			/^[A-Za-z]:[/\\]/.test($name)
		) {
			throw new Error(`Galdr: Unzulässiger Template-Name "${$name}" (absoluter Pfad / Path-Traversal verboten).`);
		}

		const filename = $name.endsWith('.galdr.html') ? $name : `${$name}.galdr.html`;

		for (const dir of $dirs) {
			const filePath = resolve(dir, filename);

			// ── Jail: resolvedPath muss innerhalb des Verzeichnisses liegen ─────
			if (!filePath.startsWith(resolve(dir))) continue;

			if (Galdr.#cfg.cache && Galdr.#cache.has(filePath)) {
				return Galdr.#cache.get(filePath);
			}

			try {
				const content = await readFile(filePath, 'utf-8');
				if (Galdr.#cfg.cache) Galdr.#cache.set(filePath, content);
				return content;
			} catch {
				continue; // nicht in diesem Verzeichnis → weiter
			}
		}

		throw new Error(`Galdr: Template "${$name}" nicht gefunden in: [${$dirs.join(', ')}]`);
	}


	// ── Compiler ──────────────────────────────────────────────────────────────

	/**
	 * Vollständige Compile-Pipeline:
	 * Layout → Partials → Blöcke → Interpolation
	 */
	static async #compile($source, $data) {
		let out = $source;
		out = await Galdr.#resolveLayout(out, $data);
		out = await Galdr.#resolvePartials(out, $data);
		out = await Galdr.#resolveBlocks(out, $data);
		out =       Galdr.#interpolate(out, $data);
		return out;
	}


	// ── Layout ────────────────────────────────────────────────────────────────

	static async #resolveLayout($source, $data) {
		// {% layout "name" %}...{% endlayout %}
		const match = $source.match(/\{%\s*layout\s+"([^"]+)"\s*%\}([\s\S]*?)\{%\s*endlayout\s*%\}/);
		if (!match) return $source;

		const [full, layoutName, slotContent] = match;
		const dirs         = [...(Galdr.#cfg.layouts.length ? Galdr.#cfg.layouts : Galdr.#cfg.views), BUILTIN_LAYOUTS];
		const layoutSource = await Galdr.#load(layoutName, dirs);

		// Slot-Inhalt in {% yield %} des Layouts einsetzen
		const withSlot = layoutSource.replace(/\{%\s*yield\s*%\}/g, slotContent.trim());
		return $source.replace(full, withSlot);
	}


	// ── Partials ──────────────────────────────────────────────────────────────

	static async #resolvePartials($source, $data) {
		// {% partial name %}
		const regex = /\{%\s*partial\s+([\w/.-]+)\s*%\}/g;
		let out     = $source;
		let match;

		// Sequenziell: Partials können selbst Partials enthalten
		while ((match = regex.exec(out)) !== null) {
			const [tag, name] = match;
			const dirs        = [...(Galdr.#cfg.partials.length ? Galdr.#cfg.partials : Galdr.#cfg.views), BUILTIN_PARTIALS];
			const partialSrc  = await Galdr.#load(name, dirs);
			const compiled    = await Galdr.#compile(partialSrc, $data);
			out = out.replace(tag, compiled);
			regex.lastIndex = 0; // Neu scannen nach Replace
		}

		return out;
	}


	// ── Block-Helpers ─────────────────────────────────────────────────────────

	/**
	 * Verarbeitet alle Block-Helpers iterativ (innerste zuerst).
	 * Die while-Schleife läuft, bis keine weiteren Blöcke gefunden werden.
	 */
	static async #resolveBlocks($source, $data) {
		let out     = $source;
		let changed = true;

		while (changed) {
			const prev = out;
			out = await Galdr.#processIf(out, $data);
			out = await Galdr.#processUnless(out, $data);
			out = await Galdr.#processEach(out, $data);
			out = await Galdr.#processWith(out, $data);
			changed = out !== prev;
		}

		return out;
	}

	// {% if expr %}...{% else %}...{% endif %}
	static async #processIf($source, $data) {
		return Galdr.#replaceBlock($source, 'if', 'endif', ($expr, $inner) => {
			const [then = '', otherwise = ''] = $inner.split(/\{%\s*else\s*%\}/);
			return Galdr.#evalExpr($expr, $data) ? then : otherwise;
		});
	}

	// {% unless expr %}...{% endunless %}
	static async #processUnless($source, $data) {
		return Galdr.#replaceBlock($source, 'unless', 'endunless', ($expr, $inner) => {
			return !Galdr.#evalExpr($expr, $data) ? $inner : '';
		});
	}

	// {% each collection %}...{% endeach %}
	static async #processEach($source, $data) {
		return Galdr.#replaceBlock($source, 'each', 'endeach', async ($expr, $inner) => {
			const collection = Galdr.#resolvePath($expr, $data);
			if (!collection) return '';

			const isArray = Array.isArray(collection);
			const entries = isArray
				? collection.map((item, index) => ({
					item,
					key:   String(index),
					index,
					last:  index === collection.length - 1,
				}))
				: Object.entries(collection).map(([key, item], index, arr) => ({
					item,
					key,
					index,
					last:  index === arr.length - 1,
				}));

			const parts = await Promise.all(entries.map(({ item, key, index, last }) => {
				const itemProps = (typeof item === 'object' && item !== null) ? item : {};
				const ctx = {
					// Outer-Scope (flache Werte, damit äußere Variablen zugänglich bleiben)
					...$data,
					// Item-Properties (überschreiben Outer-Scope)
					...itemProps,
					// Explizite Meta-Variablen
					this:    item,
					'@index': index,
					'@key':   key,
					'@first': index === 0,
					'@last':  last,
				};
				// Volles Compile: Partials + Blöcke in each-Inhalt werden aufgelöst
				return Galdr.#compile($inner, ctx);
			}));

			return parts.join('');
		});
	}

	// {% with obj %}...{% endwith %}
	static async #processWith($source, $data) {
		return Galdr.#replaceBlock($source, 'with', 'endwith', async ($expr, $inner) => {
			const ctx = Galdr.#resolvePath($expr, $data);
			if (ctx == null) return '';
			const merged = (typeof ctx === 'object') ? { ...$data, ...ctx } : $data;
			return Galdr.#compile($inner, merged);
		});
	}


	// ── Block-Replacer ────────────────────────────────────────────────────────

	/**
	 * Findet und ersetzt den ersten "innersten" Block {% tag expr %}inner{% endtag %}.
	 * "Innerst" = inner enthält kein weiteres öffnendes {% tag.
	 * Läuft in einer Schleife bis alle gleichartigen Blöcke ersetzt sind.
	 *
	 * @param {string}   $source
	 * @param {string}   $openTag   Opening-Keyword (z.B. 'if', 'each')
	 * @param {string}   $closeTag  Closing-Keyword (z.B. 'endif', 'endeach')
	 * @param {Function} $fn       ($expr, $inner) => string | Promise<string>
	 */
	static async #replaceBlock($source, $openTag, $closeTag, $fn) {
		// Innerster Block: Inhalt enthält kein weiteres öffnendes {% openTag
		const pattern = new RegExp(
			`\\{%\\s*${$openTag}\\s+([^%]*)%\\}`  +                        // {% tag expr %}
			`((?:(?!\\{%\\s*${$openTag}\\s)[\\s\\S])*?)` +               // Inhalt (kein nested Opening)
			`\\{%\\s*${$closeTag}\\s*%\\}`,                               // {% endtag %}
			'g'
		);

		let out = $source;
		let match;

		while ((match = pattern.exec(out)) !== null) {
			const [full, expr, inner] = match;
			const replacement = String((await $fn(expr.trim(), inner)) ?? '');
			out = out.slice(0, match.index) + replacement + out.slice(match.index + full.length);
			pattern.lastIndex = 0; // Neustart nach Modifikation
		}

		return out;
	}


	// ── Interpolation ─────────────────────────────────────────────────────────

	static #interpolate($source, $data) {
		// {{{ raw }}} zuerst (unescaped, Triple-Mustache)
		let out = $source.replace(/\{\{\{\s*([^}]+?)\s*\}\}\}/g, (_, $path) => {
			const val = Galdr.#resolvePath($path.trim(), $data);
			return val == null ? '' : String(val);
		});

	// {{ var }} (HTML-escaped) — ignoriert #, >, /, ! am Start (Block-Tags), erlaubt $
		out = out.replace(/\{\{\s*([^#>!/][^}]*?)\s*\}\}/g, (_, $path) => {
			const val = Galdr.#resolvePath($path.trim(), $data);
			return val == null ? '' : Galdr.#escape(String(val));
		});

		return out;
	}


	// ── Utilities ─────────────────────────────────────────────────────────────

	/** Löst einen dot-notation Pfad in einem Objekt auf. Führendes $ wird ignoriert. */
	static #resolvePath($path, $data) {
		if ($path === 'this' || $path === '$this') return $data;
		const trimmed = $path.trim().replace(/^\$/, '');
		// @meta-Variablen direkt nachschlagen
		if (trimmed.startsWith('@')) return $data[trimmed];
		return trimmed.split('.').reduce((obj, key) => obj?.[key], $data);
	}

	/**
	 * Wertet einen Template-Ausdruck (aus {% if %} / {% unless %}) aus.
	 *
	 * Sicherheitshinweis: Ausdrücke stammen aus Template-Dateien (Entwickler-kontrolliert),
	 * niemals aus User-Input. new Function ist hier bewusst eingesetzt.
	 *
	 * Erlaubte Zeichen: Buchstaben, Ziffern, _ . @ $ Vergleichs-/Logik-Operatoren, (, ), ', "
	 */
	static #evalExpr($expr, $data) {
		// $ aus dem Ausdruck entfernen, damit $user.isAdmin wie user.isAdmin ausgewertet wird
		const normalized = $expr.replace(/\$([a-zA-Z_])/g, '$1');
		const safe = /^[a-zA-Z0-9_.@\s!&|><=?:()[\]'".-]+$/.test(normalized);
		if (!safe) {
			// Unsicherer Ausdruck → nur einfache Pfad-Auflösung
			return Boolean(Galdr.#resolvePath($expr, $data));
		}
		try {
			const keys = Object.keys($data).filter(k => /^[a-zA-Z_$][\w$]*$/.test(k));
			const vals = keys.map(k => $data[k]);
			return Boolean(new Function(...keys, `return !!(${normalized})`).call(null, ...vals));
		} catch {
			return Boolean(Galdr.#resolvePath($expr, $data));
		}
	}

	/** Escapt HTML-Sonderzeichen. */
	static #escape($str) {
		return $str
			.replace(/&/g,  '&amp;')
			.replace(/</g,  '&lt;')
			.replace(/>/g,  '&gt;')
			.replace(/"/g,  '&quot;')
			.replace(/'/g, '&#39;');
	}

}
