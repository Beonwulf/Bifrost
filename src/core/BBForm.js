export class BBForm {
	values = {};
	errors = {};
	#csrfToken = '';

	/**
	 * Wird von Subklassen überschrieben, um die Felder (Schema) zu definieren.
	 */
	fields() {
		return {};
	}

	/**
	 * Füllt das Formular mit Daten (z. B. aus req.body) und wendet Filter an.
	 */
	bind($data = {}) {
		const schema = this.fields();
		
		for (const key in schema) {
			// Spezialbehandlung für Checkboxen: Im HTTP-Standard fehlen nicht-angehakte Checkboxen im Request komplett
			if (schema[key].type === 'checkbox') {
				// Checkboxen schicken oft "on", "true" oder "1" wenn angehakt
				this.values[key] = ['on', 'true', '1', true].includes($data[key]);
				continue; // Filter überspringen, da der Wert jetzt ein striktes Boolean ist
			}

			let val = $data[key] !== undefined ? $data[key] : '';

			// Filter anwenden (z. B. 'trim', 'lower' oder eigene Callback-Funktion)
			const filters = schema[key].filters || [];
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
		const schema = this.fields();
		let valid = true;

		for (const key in schema) {
			const rules = schema[key].rules || [];
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
					
					if (rName === 'required' && (val === undefined || val === null || String(val).trim() === '')) {
						this.addError(key, 'Dieses Feld ist ein Pflichtfeld.');
						valid = false; break;
					}
					
					// Folgeprüfungen nur ausführen, wenn das Feld nicht komplett leer ist
					// (leere Felder werden durch 'required' kontrolliert)
					if (val !== undefined && val !== null && String(val).trim() !== '') {
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

	// ── Galdr Rendering Helpers ──────────────────────────────────────────────

	/** Übergibt das CSRF-Token an das Formular (z.B. aus req.session._csrf) */
	withCsrf($token) {
		this.#csrfToken = $token;
		return this; // Erlaubt Chaining
	}

	/** Generiert das versteckte CSRF-Feld für das HTML-Template */
	renderCsrf() {
		if (!this.#csrfToken) return '';
		return `<input type="hidden" name="_csrf" value="${this.#csrfToken}">\n`;
	}

	/** Generiert das value="..." Attribut sicher (HTML-escaped) */
	val($key) {
		if (this.values[$key] === undefined || this.values[$key] === null) return '';
		const escaped = String(this.values[$key]).replace(/"/g, '&quot;');
		return `value="${escaped}"`;
	}

	/** Generiert die Fehlermeldung als HTML-Span */
	error($key) {
		if (this.hasError($key)) {
			return `<span class="form-error">${this.errors[$key]}</span>`;
		}
		return '';
	}

	/** 
	 * Rendert ein komplettes HTML-Feld passend zu den Bifröst CSS-Klassen
	 * (inkl. Label, Input, alten Werten und Fehlermeldungen)
	 */
	renderField($key) {
		const field = this.fields()[$key];
		if (!field) return '';

		const id = `form_${$key}`;
		const type = field.type || 'text';
		const label = field.label || $key;
		
		// CSS-Klassen aus dem Bifröst UI-Framework
		const errClass = this.hasError($key) ? 'is-error' : '';
		const valAttr = this.val($key);

		// Checkboxen erfordern ein leicht anderes HTML-Layout (Input vor dem Label)
		if (type === 'checkbox') {
			const checked = this.values[$key] ? ' checked' : '';
			let html = `<div class="form-group">\n`;
			html += `  <label for="${id}" class="flex items-center gap-sm font-normal">\n`;
			html += `    <input type="checkbox" id="${id}" name="${$key}" class="${errClass}" value="true"${checked}>\n`;
			html += `    ${label}\n`;
			html += `  </label>\n`;
			if (this.hasError($key)) html += `  ${this.error($key)}\n`;
			html += `</div>`;
			return html;
		}

		let html = `<div class="form-group">\n`;
		html += `  <label for="${id}">${label}</label>\n`;

		if (type === 'textarea') {
			const escapedVal = String(this.values[$key] || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			html += `  <textarea id="${id}" name="${$key}" class="${errClass}">${escapedVal}</textarea>\n`;
		} else if (type === 'select') {
			html += `  <select id="${id}" name="${$key}" class="${errClass}">\n`;
			const options = field.options || {};
			for (const [optVal, optLabel] of Object.entries(options)) {
				const selected = String(this.values[$key]) === String(optVal) ? ' selected' : '';
				html += `    <option value="${optVal}"${selected}>${optLabel}</option>\n`;
			}
			html += `  </select>\n`;
		} else {
			html += `  <input type="${type}" id="${id}" name="${$key}" class="${errClass}" ${valAttr}>\n`;
		}

		if (this.hasError($key)) {
			html += `  ${this.error($key)}\n`;
		}
		html += `</div>`;

		return html;
	}
}