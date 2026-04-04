import crypto from 'node:crypto';

/**
 * AuthService — Native JWT Implementierung für Bifröst
 * Keine externen Abhängigkeiten, nutzt node:crypto.
 */
export class AuthService {
	#secret;

	/**
	 * @param {string} secret Das kryptografische Geheimnis zum Signieren der Tokens.
	 */
	constructor(secret) {
		if (!secret) throw new Error('AuthService benötigt ein Secret!');
		this.#secret = secret;
	}

	/**
	 * Erstellt einen signierten JWT.
	 * @param {object} payload Die Nutzdaten (z.B. { id: 1, role: 'admin' })
	 * @param {number} expiresInSeconds Ablaufzeit in Sekunden (Standard: 24h)
	 * @returns {string} Das fertige JWT
	 */
	sign(payload, expiresInSeconds = 86400) {
		const header = { alg: 'HS256', typ: 'JWT' };
		const now = Math.floor(Date.now() / 1000);

		const jwtPayload = { ...payload, iat: now, exp: now + expiresInSeconds };

		const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
		const encodedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url');

		const signature = crypto
			.createHmac('sha256', this.#secret)
			.update(`${encodedHeader}.${encodedPayload}`)
			.digest('base64url');

		return `${encodedHeader}.${encodedPayload}.${signature}`;
	}

	/**
	 * Verifiziert einen JWT und gibt den Payload zurück.
	 * Wirft einen Fehler, wenn das Token manipuliert oder abgelaufen ist.
	 */
	verify(token) {
		const parts = token.split('.');
		if (parts.length !== 3) throw new Error('Ungültiges Token-Format.');

		const [encodedHeader, encodedPayload, signature] = parts;

		// Erwartete Signatur berechnen
		const expectedSignature = crypto
			.createHmac('sha256', this.#secret)
			.update(`${encodedHeader}.${encodedPayload}`)
			.digest('base64url');

		// timingSafeEqual schützt vor Zeitmessungs-Angriffen!
		if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
			throw new Error('Ungültige Token-Signatur.');
		}

		// Payload dekodieren und Ablaufdatum prüfen
		const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
		if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
			throw new Error('Token ist abgelaufen.');
		}

		return payload;
	}
}