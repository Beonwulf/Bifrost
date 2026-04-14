export class BBForm {
	values = {};
	errors = {};
	#fields = new Map();
	#hiddens = new Map();

	constructor($initialData = {}) {
		this.setup();
		
		// Standardwerte aus der Feld-Definition (options.value) übernehmen
		for (const [key, field] of this.#fields.entries()) {
			if (field.value !== undefined) this.values[key] = field.value;
		}
		// Optionale Initial-Daten (z.B. aus der DB für "Bearbeiten"-Formulare)
		if ($initialData && typeof $initialData === 'object') {
			Object.assign(this.values, $initialData);
		}
	}

	/** Hook für Subklassen, um Felder zu definieren */
	setup() {}

	addField($type, $name, $options = {}) {
		if ($type === 'hidden') {
			this.addHidden($name, $options.value || '');
		} else {
			this.#fields.set($name, { type: $type, ...$options });
		}
		return this; // für Chaining
	}

	addHidden($name, $value) {
		this.#hiddens.set($name, $value);
		return this;
	}

	/**
	 * Füllt das Formular mit Daten (z. B. aus req.body) und wendet Filter an.
	 */
	bind($data = {}, $files = {}) {
		const schema = this.getFields();
		
		for (const key in schema) {
			// Spezialbehandlung für Checkboxen: Im HTTP-Standard fehlen nicht-angehakte Checkboxen im Request komplett
			if (schema[key].type === 'checkbox') {
				// Checkboxen schicken oft "on", "true" oder "1" wenn angehakt
				this.values[key] = ['on', 'true', '1', true].includes($data[key]);
				continue; // Filter überspringen, da der Wert jetzt ein striktes Boolean ist
			}

			// Spezialbehandlung für Datei-Uploads (aus req.files)
			if (schema[key].type === 'file') {
				this.values[key] = $files[key] || null;
				continue;
			}

			let val = $data[key] !== undefined ? $data[key] : '';

			// Filter anwenden (z. B. 'trim', 'lower' oder eigene Callback-Funktion)
			const rawFilters = schema[key].filters;
			const filters = Array.isArray(rawFilters) ? rawFilters : (rawFilters ? [rawFilters] : []);
			for (const filter of filters) {
				if (typeof filter === 'function') {
					val = filter(val);
				} else if (typeof filter === 'string') {
					if (filter === 'trim' && typeof val === 'string') val = val.trim();
					if (filter === 'lower' && typeof val === 'string') val = val.toLowerCase();
					if (filter === 'upper' && typeof val === 'string') val = val.toUpperCase();
					if (filter === 'number') val = Number(val) || 0;
				}
			}
			this.values[key] = val;
		}
	}

	/**
	 * Führt alle Validierungsregeln aus und füllt this.errors.
	 * @returns {boolean} true wenn alles gültig ist, sonst false.
	 */
	isValid() {
		this.errors = {};
		const schema = this.getFields();
		let valid = true;

		for (const key in schema) {
			const rawRules = schema[key].rules;
			const rules = Array.isArray(rawRules) ? rawRules : (rawRules ? [rawRules] : []);
			const val = this.values[key];

			for (const rule of rules) {
				// 1. Benutzerdefinierte Callback-Validierung
				if (typeof rule === 'function') {
					// Callback erhält den aktuellen Wert und alle bisherigen Formularwerte
					const result = rule(val, this.values);
					if (result !== true && result !== undefined) {
						this.addError(key, typeof result === 'string' ? result : 'Ungültiger Wert');
						valid = false;
						break; // Stoppt bei diesem Feld nach dem ersten Fehler
					}
				} 
				// 2. Eingebaute String-Validatoren
				else if (typeof rule === 'string') {
					const [rName, rArg] = rule.split(':');
					
					if (rName === 'required' && (
						val === undefined || 
						val === null || 
						(typeof val === 'string' && val.trim() === '') ||
						(Array.isArray(val) && val.length === 0)
					)) {
						this.addError(key, 'Dieses Feld ist ein Pflichtfeld.');
						valid = false; break;
					}
					
					// Folgeprüfungen nur ausführen, wenn das Feld nicht komplett leer ist
					// (leere Felder werden durch 'required' kontrolliert)
					if (val !== undefined && val !== null && val !== '') {
						if (rName === 'match' && String(val) !== String(this.values[rArg])) {
							this.addError(key, `Muss mit dem Feld "${rArg}" übereinstimmen.`);
							valid = false; break;
						}
						if (rName === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))) {
							this.addError(key, 'Bitte gib eine gültige E-Mail-Adresse ein.');
							valid = false; break;
						}
						if (rName === 'min' && String(val).length < parseInt(rArg, 10)) {
							this.addError(key, `Mindestens ${rArg} Zeichen erforderlich.`);
							valid = false; break;
						}
						if (rName === 'max' && String(val).length > parseInt(rArg, 10)) {
							this.addError(key, `Maximal ${rArg} Zeichen erlaubt.`);
							valid = false; break;
						}
						if (rName === 'in') {
							const allowed = rArg.split(',');
							if (!allowed.includes(String(val))) {
								this.addError(key, 'Ungültige Auswahl.');
								valid = false; break;
							}
						}
						if (rName === 'url') {
							try { new URL(String(val)); } catch {
								this.addError(key, 'Bitte gib eine gültige URL ein.');
								valid = false; break;
							}
						}
						if (rName === 'mimes') {
							const allowed = rArg.split(',');
							const files = Array.isArray(val) ? val : [val];
							if (!files.every(f => allowed.some(m => f.mimetype && f.mimetype.includes(m)))) {
								this.addError(key, `Nur folgende Dateitypen erlaubt: ${rArg}`);
								valid = false; break;
							}
						}
						if (rName === 'maxSize') {
							const maxBytes = parseInt(rArg, 10) * 1024;
							const files = Array.isArray(val) ? val : [val];
							if (files.some(f => f.size > maxBytes)) {
								this.addError(key, `Die Datei darf maximal ${rArg} KB groß sein.`);
								valid = false; break;
							}
						}
					}
				}
			}
		}
		return valid;
	}

	addError($key, $message) {
		this.errors[$key] = $message;
	}

	hasError($key) {
		return !!this.errors[$key];
	}

	// ── Getter für Galdr Templates ────────────────────────────────────────────

	getFields() {
		return Object.fromEntries(this.#fields);
	}
	get fields() { return this.getFields(); }

	getHiddens() {
		return Array.from(this.#hiddens.entries()).map(([name, value]) => ({ name, value }));
	}
	get hiddens() { return this.getHiddens(); }

	getUngroupedFields() {
		const ungrouped = {};
		for (const [name, field] of this.#fields.entries()) {
			if (!field.fieldsetname) {
				ungrouped[name] = field;
			}
		}
		return ungrouped;
	}
	get ungroupedFields() { return this.getUngroupedFields(); }

	getFieldsets() {
		const sets = new Map();
		for (const [name, field] of this.#fields.entries()) {
			if (field.fieldsetname) {
				const fsName = field.fieldsetname;
				if (!sets.has(fsName)) sets.set(fsName, { name: fsName, fields: {} });
				sets.get(fsName).fields[name] = field;
			}
		}
		return Array.from(sets.values());
	}
	get fieldsets() { return this.getFieldsets(); }

	withCsrf($token) {
		if ($token) this.addHidden('_csrf', $token);
		return this;
	}
}