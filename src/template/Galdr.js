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
 *   {% if expr %}...{% elseif expr %}...{% else %}...{% endif %}  — Bedingung
 *   {% unless expr %}...{% endunless %}                          — Inverse Bedingung
 *
 *   {% set $name = value %}              — Variable im aktuellen Scope setzen
 *                                          Werte: 'string', "string", Zahl, true/false, null, $pfad
 *
 *   {# Kommentar #}                      — Template-Kommentar (wird nicht gerendert)
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
 *   {% include "name" %}                 — Partial mit aktuellem Kontext
 *   {% include "name" with $obj %}       — Partial mit eigenem Kontext (merged)
 *   {% include varName %}                — Partial, Name aus Variable
 *   {% include varName with $obj %}      — Partial, Name aus Variable + eigener Kontext
 *
 *   {% component "name" %}              — Strukturierte Komponente mit Named Slots
 *     {% slot head %}...{% endslot %}    — Benannter Slot (kompiliert mit äußerem Kontext)
 *     {% slot body %}...{% endslot %}    — Default-Slot: alles außerhalb von slot-Tags
 *   {% endcomponent %}
 *                                        Komponenten-Template nutzt:
 *                                          {{{ _slots.head }}} — kompilierter Slot-HTML
 *                                          {{{ slot }}}        — Default-Slot-HTML
 *                                          {% if _slots.head %} — Slot vorhanden?
 *
 *   <x-name attr="val">slot</x-name>    — Inline-Komponente (Custom Tag)
 *   <x-name attr="val" />               — Inline-Komponente, selbst-schließend
 *                                        Attribute → Template-Kontext
 *                                        Inner HTML → {{{ slot }}} (unescaped)
 *
 *   {{ $value | upper }}                  — Filter-Pipe
 *   {{ $value | lower }}                  — Filter: Kleinbuchstaben
 *   {{ $value | trim }}                   — Filter: Whitespace entfernen
 *   {{ $value | truncate:100 }}           — Filter: auf N Zeichen kürzen
 *   {{ $value | truncate:100:'...' }}     — Filter: kürzen mit eigenem Suffix
 *   {{ $value | nl2br }}                  — Filter: Zeilenumbrüche → <br>
 *   {{ $value | currency }}               — Filter: Zahl als Währung (2 Dezimalstellen + .)
 *   {{ $value | currency:',' }}           — Filter: Währung mit eigenem Dezimalzeichen
 *   {{ $value | number:2 }}               — Filter: Zahl mit N Dezimalstellen
 *   {{ $value | default:'Fallback' }}     — Filter: Fallback wenn leer/null/undefined
 *   {{ $value | json }}                   — Filter: JSON.stringify (raw, kein Escaping)
 *
 *   {% layout "name" %}...{% endlayout %} — Layout-Wrapper
 *                                          Layout-Datei nutzt {% yield %} als Standard-Slot
 *                                          und {% yield blockname %} für benannte Slots
 *   {% block name %}...{% endblock %}     — Benannter Inhaltsblock (befüllt {% yield name %})
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
import { resolve, join, sep } from 'node:path';
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
	 * @param {{ views?: string|string[], partials?: string|string[], layouts?: string|string[], cache?: boolean }} $options
	 */
	static configure($options = {}) {
		if ($options.views    != null) Galdr.#cfg.views    = [].concat($options.views);
		if ($options.partials != null) Galdr.#cfg.partials = [].concat($options.partials);
		if ($options.layouts  != null) Galdr.#cfg.layouts  = [].concat($options.layouts);
		if ($options.cache    != null) Galdr.#cfg.cache    = $options.cache;
		Galdr.#cache.clear();
	}

	/** Fügt ein Views-Verzeichnis mit höchster Priorität hinzu (erster Treffer gewinnt). */
	static addViews($dir)    { (Galdr.#cfg.views    ??= []).unshift($dir); }
	/** Fügt ein Layouts-Verzeichnis mit höchster Priorität hinzu. */
	static addLayouts($dir)  { (Galdr.#cfg.layouts  ??= []).unshift($dir); }
	/** Fügt ein Partials-Verzeichnis mit höchster Priorität hinzu. */
	static addPartials($dir) { (Galdr.#cfg.partials ??= []).unshift($dir); }

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
		const dirs   = [...(Galdr.#cfg.views ?? []), BUILTIN_VIEWS];
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
			const resolvedDir = resolve(dir);
			const filePath    = join(resolvedDir, filename);

			// ── Jail: filePath muss innerhalb des Verzeichnisses liegen (inkl. sep) ───────────
			if (!filePath.startsWith(resolvedDir + sep) && filePath !== resolvedDir) continue;

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
		const ctx = { ...$data };  // Scope isolieren: set-Tags mutieren nur den lokalen Kontext

		// <pre> und <code>-Blöcke schützen — Template-Tags darin NICHT verarbeiten
		const preSlots = [];
		let out = $source.replace(/<(pre|code)([\s\S]*?)>([\s\S]*?)<\/\1>/g, ($m) => {
			const idx = preSlots.push($m) - 1;
			return `\x00GALDRPRE${idx}\x00`;
		});

		out = out.replace(/\{#[\s\S]*?#\}/g, '');  // {# Kommentare #} entfernen
		if (out.includes('{% layout'))                            out = await Galdr.#resolveLayout(out, ctx);
		if (out.includes('{% partial'))                           out = await Galdr.#resolvePartials(out, ctx);
		if (out.includes('{% component') || out.includes('<x-')) out = await Galdr.#resolveComponents(out, ctx);
		if (out.includes('{% include'))                           out = await Galdr.#resolveIncludes(out, ctx);
		if (out.includes('{%'))                                   out = await Galdr.#resolveBlocks(out, ctx);
		if (out.includes('{% url'))                               out =       Galdr.#resolveUrlTags(out, ctx);
		out =       Galdr.#interpolate(out, ctx);

		// Geschützte Blöcke wiederherstellen.
		// Platzhalter, die nicht in diesem preSlots-Kontext registriert wurden (z.B. aus einem
		// äußeren #compile-Aufruf), bleiben unverändert — der äußere Aufruf löst sie auf.
		out = out.replace(/\x00GALDRPRE(\d+)\x00/g, ($m, $i) => preSlots[+$i] ?? $m);
		return out;
	}


	// ── Layout ────────────────────────────────────────────────────────────────

	static async #resolveLayout($source, $data) {
		// {% layout "name" %}...{% endlayout %}
		const match = $source.match(/\{%\s*layout\s+"([^"]+)"\s*%\}([\s\S]*?)\{%\s*endlayout\s*%\}/);
		if (!match) return $source;

		const [full, layoutName, slotContent] = match;
		const layoutDirs   = [...(Galdr.#cfg.layouts?.length ? Galdr.#cfg.layouts : (Galdr.#cfg.views ?? [])), BUILTIN_LAYOUTS];
		const layoutSource = await Galdr.#load(layoutName, layoutDirs);

		// Benannte Blöcke extrahieren: {% block name %}...{% endblock %}
		const blocks    = new Map();
		const blockRx   = /\{%\s*block\s+(\w+)\s*%\}([\s\S]*?)\{%\s*endblock\s*%\}/g;
		let   blockMatch;
		while ((blockMatch = blockRx.exec(slotContent)) !== null) {
			blocks.set(blockMatch[1], blockMatch[2].trim());
		}

		// Hauptinhalt = slotContent ohne block-Tags
		const mainContent = slotContent
			.replace(/\{%\s*block\s+\w+\s*%\}[\s\S]*?\{%\s*endblock\s*%\}/g, '')
			.trim();

		// Benannte yield-Slots im Layout ersetzen: {% yield name %}
		let withSlot = layoutSource;
		for (const [name, content] of blocks) {
			withSlot = withSlot.replace(new RegExp(`\\{%\\s*yield\\s+${name}\\s*%\\}`, 'g'), content);
		}
		// Standard-Slot ersetzen: {% yield %}
		withSlot = withSlot.replace(/\{%\s*yield\s*%\}/g, mainContent);
		// Unbefüllte benannte yield-Slots entfernen (kein Block definiert)
		withSlot = withSlot.replace(/\{%\s*yield\s+\w+\s*%\}/g, '');

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
			const dirs        = [...(Galdr.#cfg.partials?.length ? Galdr.#cfg.partials : (Galdr.#cfg.views ?? [])), BUILTIN_PARTIALS];
			const partialSrc  = await Galdr.#load(name, dirs);
			const compiled    = await Galdr.#compile(partialSrc, $data);
			out = out.replace(tag, compiled);
			regex.lastIndex = 0; // Neu scannen nach Replace
		}

		return out;
	}


	// ── Components ──────────────────────────────────────────────────────────────

	/**
	 * Verarbeitet zwei Varianten:
	 *  1. {% component "name" %} ... {% endcomponent %} — Strukturierte Komponente mit Named Slots
	 *  2. <x-name attr="val">content</x-name>          — Inline Custom Tag
	 *  3. <x-name attr="val" />                         — Inline Custom Tag, selbst-schließend
	 *
	 * Slot-Inhalt und Tag-Inhalt werden mit dem äußeren Kontext kompiliert,
	 * bevor sie als {{{ slot }}} / {{{ _slots.name }}} in die Komponente eingefügt werden.
	 */
	static async #resolveComponents($source, $data) {
		let out = $source;
		let match;

		// ── 1. {% component "name" %} ... {% endcomponent %} ──────────────────────
		// Innerst zuerst: Inhalt darf kein weiteres {% component enthalten
		const compRx = /\{%\s*component\s+"([\w/-]+)"\s*%\}((?:(?!\{%\s*component\s)[\s\S])*?)\{%\s*endcomponent\s*%\}/g;

		while ((match = compRx.exec(out)) !== null) {
			const [full, name, inner] = match;

			// Named slots extrahieren & mit äußerem Kontext kompilieren
			const slots  = {};
			const slotRx = /\{%\s*slot\s+(\w+)\s*%\}([\s\S]*?)\{%\s*endslot\s*%\}/g;
			let   slotM;
			while ((slotM = slotRx.exec(inner)) !== null) {
				slots[slotM[1]] = await Galdr.#compile(slotM[2].trim(), $data);
			}

			// Default-Slot = alles außerhalb von slot-Tags
			const defaultRaw = inner
				.replace(/\{%\s*slot\s+\w+\s*%\}[\s\S]*?\{%\s*endslot\s*%\}/g, '')
				.trim();
			const slot = defaultRaw ? await Galdr.#compile(defaultRaw, $data) : '';

			const dirs     = [...(Galdr.#cfg.partials?.length ? Galdr.#cfg.partials : (Galdr.#cfg.views ?? [])), BUILTIN_PARTIALS];
			const src      = await Galdr.#load(name, dirs);
			const compiled = await Galdr.#compile(src, { ...$data, _slots: slots, slot });

			out = out.slice(0, match.index) + compiled + out.slice(match.index + full.length);
			compRx.lastIndex = 0;
		}

		// ── 2. <x-name attrs>content</x-name> ────────────────────────────────────
		// Innerst zuerst: content darf kein weiteres <x-NAME> mit selbem Namen enthalten
		const tagRx = /<x-([\w-]+)((?:\s+[\w:-]+(?:="[^"]*")?)*?)\s*>([\s\S]*?)<\/x-\1>/g;

		while ((match = tagRx.exec(out)) !== null) {
			const [full, name, attrStr, inner] = match;
			const attrs        = Galdr.#parseTagAttrs(attrStr);
			const compiledSlot = await Galdr.#compile(inner, $data);
			const dirs         = [...(Galdr.#cfg.partials?.length ? Galdr.#cfg.partials : (Galdr.#cfg.views ?? [])), BUILTIN_PARTIALS];
			try {
				const src      = await Galdr.#load(name, dirs);
				const compiled = await Galdr.#compile(src, { ...$data, ...attrs, slot: compiledSlot });
				out = out.slice(0, match.index) + compiled + out.slice(match.index + full.length);
			} catch { /* Template nicht gefunden → unverändert */ }
			tagRx.lastIndex = 0;
		}

		// ── 3. <x-name attrs /> selbst-schließend ────────────────────────────────
		const selfRx = /<x-([\w-]+)((?:\s+[\w:-]+(?:="[^"]*")?)*?)\s*\/>/g;

		while ((match = selfRx.exec(out)) !== null) {
			const [full, name, attrStr] = match;
			const attrs = Galdr.#parseTagAttrs(attrStr);
			const dirs  = [...(Galdr.#cfg.partials?.length ? Galdr.#cfg.partials : (Galdr.#cfg.views ?? [])), BUILTIN_PARTIALS];
			try {
				const src      = await Galdr.#load(name, dirs);
				const compiled = await Galdr.#compile(src, { ...$data, ...attrs, slot: '' });
				out = out.slice(0, match.index) + compiled + out.slice(match.index + full.length);
			} catch { /* Template nicht gefunden → unverändert */ }
			selfRx.lastIndex = 0;
		}

		return out;
	}

	/** Parst HTML-Attribut-String zu einem Objekt. Wert-lose Attribute → true. */
	static #parseTagAttrs($attrStr) {
		const attrs = {};
		const rx = /([\w:-]+)(?:="([^"]*)")?/g;
		let m;
		while ((m = rx.exec($attrStr)) !== null) {
			attrs[m[1]] = m[2] ?? true;
		}
		return attrs;
	}


	// ── Include (Partial mit optionalem eigenem Kontext) ─────────────────────

	static async #resolveIncludes($source, $data) {
		// {% include "name" with $expr %}      — Literal-Name, optionaler Kontext
		// {% include varName with $expr %}     — Variable als Name, optionaler Kontext
		// {% include varName %}                — Variable als Name, voller Context
		const regex = /\{%\s*include\s+(?:"([^"]+)"|(\$?[\w.]+))(?:\s+with\s+([^%]+?))?\s*%\}/g;
		let out     = $source;
		let match;

		while ((match = regex.exec(out)) !== null) {
			const [tag, literal, varName, withExpr] = match;

			// Name: Literal-String oder Variable aus Context auflösen
			const name = literal ?? String(Galdr.#resolvePath(varName, $data) ?? '');
			if (!name) { regex.lastIndex = 0; continue; }

			const dirs = [...(Galdr.#cfg.partials?.length ? Galdr.#cfg.partials : (Galdr.#cfg.views ?? [])), BUILTIN_PARTIALS];
			const src  = await Galdr.#load(name, dirs);

			let ctx = $data;
			if (withExpr) {
				const trimmed = withExpr.trim();
				// 1. Einfacher dot-notation Pfad (z.B. $myObj)
				const resolved = Galdr.#resolvePath(trimmed, $data);
				if (resolved != null && typeof resolved === 'object') {
					ctx = { ...$data, ...resolved };
				} else if (trimmed.startsWith('{')) {
					// 2. Object-Literal-Ausdruck (z.B. { items: _nav.main, class: 'foo' })
					// Sicherheitshinweis: with-Ausdrücke stammen aus Template-Dateien (Dev-kontrolliert)
					try {
						const normalized = trimmed.replace(/\$([a-zA-Z_])/g, '$1');
						const keys = Object.keys($data).filter(k => /^[a-zA-Z_$][\w$]*$/.test(k));
						const vals = keys.map(k => $data[k]);
						const evaluated = new Function(...keys, `return (${normalized})`).call(null, ...vals);
						if (evaluated != null && typeof evaluated === 'object') {
							ctx = { ...$data, ...evaluated };
						}
					} catch {
						// Ungültiger Ausdruck → voller Kontext bleibt
					}
				}
			}

			const compiled = await Galdr.#compile(src, ctx);
			out = out.replace(tag, compiled);
			regex.lastIndex = 0;
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
			out =        Galdr.#processSet(out, $data);
			// each + with zuerst: Sie kompilieren ihren Inhalt mit eigenem Kontext
			// via #compile() → processIf läuft dann mit dem korrekten Item-Scope
			out = await Galdr.#processEach(out, $data);
			out = await Galdr.#processWith(out, $data);
			out = await Galdr.#processIf(out, $data);
			out = await Galdr.#processUnless(out, $data);
			changed = out !== prev;
		}

		return out;
	}

	// {% if expr %}...{% elseif expr %}...{% else %}...{% endif %}
	static async #processIf($source, $data) {
		return Galdr.#replaceBlock($source, 'if', 'endif', ($expr, $inner) => {
			// Inhalt in Segmente aufteilen: parts[i] gehört zu seps[i-1] (bzw. $expr für parts[0])
			const parts = [];
			const seps  = [];
			const sepRx = /\{%\s*(?:elseif\s+([^%]+?)|else)\s*%\}/g;
			let cursor  = 0;
			let m;
			while ((m = sepRx.exec($inner)) !== null) {
				parts.push($inner.slice(cursor, m.index));
				seps.push(m[1] !== undefined
					? { type: 'elseif', expr: m[1].trim() }
					: { type: 'else' }
				);
				cursor = m.index + m[0].length;
			}
			parts.push($inner.slice(cursor));

			// Kette auswerten: parts[0] gehört zu $expr
			if (Galdr.#evalExpr($expr, $data)) return parts[0];
			for (let i = 0; i < seps.length; i++) {
				if (seps[i].type === 'else')                         return parts[i + 1];
				if (Galdr.#evalExpr(seps[i].expr, $data))           return parts[i + 1];
			}
			return '';
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
				// Prototype-Pollution-Schutz: __proto__, constructor, prototype aus Item-Daten blockieren
				const itemProps = {};
				if (typeof item === 'object' && item !== null) {
					for (const k of Object.keys(item)) {
						if (k !== '__proto__' && k !== 'constructor' && k !== 'prototype') {
							itemProps[k] = item[k];
						}
					}
				}
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

	// {% set $varName = value %}
	static #processSet($source, $data) {
		const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);
		return $source.replace(/\{%\s*set\s+\$?([a-zA-Z_]\w*)\s*=\s*([\s\S]*?)\s*%\}/g, (_, name, rawVal) => {
			if (!FORBIDDEN.has(name)) {
				$data[name] = Galdr.#parseSetValue(rawVal.trim(), $data);
			}
			return '';
		});
	}

	static #parseSetValue($raw, $data) {
		if (/^'[^']*'$/.test($raw))           return $raw.slice(1, -1);
		if (/^"[^"]*"$/.test($raw))           return $raw.slice(1, -1);
		if ($raw === 'true')                  return true;
		if ($raw === 'false')                 return false;
		if ($raw === 'null')                  return null;
		if (/^-?\d+(\.\d+)?$/.test($raw))    return Number($raw);
		return Galdr.#resolvePath($raw, $data);
	}


	// ── URL-Tag ───────────────────────────────────────────────────────────────

	/**
	 * Ersetzt {% url "/pfad" %} bzw. {% url $var %} durch locale-präfixierte URLs.
	 *
	 * Beispiele:
	 *   {% url "/about" %}        →  /de/about  (wenn _locale = 'de')
	 *   {% url "/" %}             →  /de
	 *   {% url $nextPage %}       →  /de/<wert von $nextPage>
	 *   (ohne _locale)           →  /about  (kein Präfix)
	 *
	 * @param {string} $source
	 * @param {object} $data   Muss { _locale: 'de' } enthalten (von BBController injiziert)
	 */
	static #resolveUrlTags($source, $data) {
		const locale = $data._locale ?? '';
		const prefix = locale ? `/${locale}` : '';

		return $source.replace(
			/\{%\s*url\s+(?:(['"])(.+?)\1|(\$?[\w.]+))\s*%\}/g,
			($_, $q, $literal, $varName) => {
				// Pfad aus Literal oder Variable
				const rawPath = $literal ?? String(Galdr.#resolvePath($varName, $data) ?? '');
				// Stets mit / beginnen
				const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
				// /  → /de  |  /about → /de/about  |  /de/about → /de/about (kein Doppel-Präfix)
				if (prefix && path.startsWith(prefix)) return path;
				return prefix + (path === '/' ? '' : path) || '/';
			}
		);
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
		// {{{ raw }}} zuerst (unescaped, Triple-Mustache) — Pipes werden ebenfalls unterstützt
		let out = $source.replace(/\{\{\{\s*([^}]+?)\s*\}\}\}/g, (_, $expr) => {
			const { path, filters } = Galdr.#parsePipeExpr($expr.trim());
			const val = Galdr.#resolvePath(path, $data);
			return Galdr.#applyFilters(val, filters);
		});

		// {{ var | filter }} (HTML-escaped) — ignoriert #, >, /, ! am Start (Block-Tags)
		out = out.replace(/\{\{\s*([^#>!/][^}]*?)\s*\}\}/g, (_, $expr) => {
			const { path, filters } = Galdr.#parsePipeExpr($expr.trim());
			const val = Galdr.#resolvePath(path, $data);
			const result = Galdr.#applyFilters(val, filters);
			// json-Filter liefert rohen String — kein weiteres Escaping
			if (filters.length > 0 && filters.at(-1).name === 'json') return result;
			return result == null ? '' : Galdr.#escape(result);
		});

		return out;
	}


	// ── Pipe-Parsing ──────────────────────────────────────────────────────────

	/**
	 * Zerlegt einen Interpolations-Ausdruck in Pfad + Filter-Kette.
	 * '{{ $price | currency:"," | upper }}' → { path: '$price', filters: [{name:'currency', args:[',']}, {name:'upper', args:[]}] }
	 */
	static #parsePipeExpr($expr) {
		const parts   = $expr.split('|').map(s => s.trim());
		const path    = parts[0];
		const filters = parts.slice(1).map($seg => {
			const colonIdx = $seg.indexOf(':');
			if (colonIdx === -1) return { name: $seg.trim(), args: [] };
			const name = $seg.slice(0, colonIdx).trim();
			// Args: durch ':' getrennt, Quotes werden gestrippt
			const args = $seg.slice(colonIdx + 1)
				.split(':')
				.map(a => a.trim().replace(/^['"](.*)['"]$/, '$1'));
			return { name, args };
		});
		return { path, filters };
	}

	/**
	 * Wendet eine Filter-Kette auf einen Wert an.
	 * Unbekannte Filter werden ignoriert (Wert bleibt unverändert).
	 */
	static #applyFilters($val, $filters) {
		if ($filters.length === 0) {
			return $val == null ? '' : String($val);
		}
		let out = $val;
		for (const { name, args } of $filters) {
			out = Galdr.#runFilter(name, out, args);
		}
		return out == null ? '' : String(out);
	}

	/** Built-in Filter. Erweiterbar via Galdr.registerFilter(). */
	static #runFilter($name, $val, $args) {
		const str = $val == null ? '' : String($val);
		switch ($name) {
			case 'upper':    return str.toUpperCase();
			case 'lower':    return str.toLowerCase();
			case 'trim':     return str.trim();
			case 'nl2br':    return str.replace(/\n/g, '<br>');
			case 'json': {
				const serialized = JSON.stringify($val);
				// Verhindert </script>-Ausbruch und HTML-Injection in <script>-Blöcken
				return serialized
					.replace(/&/g,    '\\u0026')
					.replace(/</g,    '\\u003c')
					.replace(/>/g,    '\\u003e')
					.replace(/\u2028/g, '\\u2028')
					.replace(/\u2029/g, '\\u2029');
			}

			case 'truncate': {
				const max    = parseInt($args[0] ?? '100', 10);
				const suffix = $args[1] ?? '…';
				return str.length > max ? str.slice(0, max) + suffix : str;
			}

			case 'currency': {
				const dec  = $args[0] ?? '.';
				const num  = parseFloat($val);
				if (isNaN(num)) return str;
				return num.toFixed(2).replace('.', dec);
			}

			case 'number': {
				const digits = parseInt($args[0] ?? '2', 10);
				const dec    = $args[1] ?? '.';
				const num    = parseFloat($val);
				if (isNaN(num)) return str;
				return num.toFixed(digits).replace('.', dec);
			}

			case 'default':  return (str === '' || $val == null) ? ($args[0] ?? '') : str;

			default: {
				// Benutzerdefinierter Filter
				const custom = Galdr.#customFilters.get($name);
				return custom ? custom($val, ...$args) : str;
			}
		}
	}

	static #customFilters = new Map();

	/**
	 * Registriert einen benutzerdefinierten Filter.
	 * @param {string}   $name  Filter-Name, z.B. 'dateFormat'
	 * @param {Function} $fn    ($value, ...args) => string
	 */
	static registerFilter($name, $fn) {
		Galdr.#customFilters.set($name, $fn);
	}


	// ── Utilities ─────────────────────────────────────────────────────────────

	/** Löst einen dot-notation Pfad in einem Objekt auf. Führendes $ wird ignoriert. */
	static #resolvePath($path, $data) {
		if ($path === 'this' || $path === '$this') {
			return 'this' in Object($data) ? $data['this'] : $data;
		}
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
