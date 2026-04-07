import crypto from 'node:crypto';

export class TokenExpiredError extends Error {
	constructor(message = 'Token ist abgelaufen.') {
		super(message);
		this.name = 'TokenExpiredError';
		this.code = 'TOKEN_EXPIRED';
	}
}

export class TokenInvalidError extends Error {
	constructor(message = 'Ungültiges Token.') {
		super(message);
		this.name = 'TokenInvalidError';
		this.code = 'TOKEN_INVALID';
	}
}

/**
 * AuthService — Native JWT Implementierung für Bifröst
 * Keine externen Abhängigkeiten, nutzt node:crypto.
 */
export class AuthService {
	static #secret = null;
	static #expiresIn = 86400; // Default: 24h
	static #algorithm = 'HS256';

	/**
	 * Mappt den JWT-Algorithmus auf den internen Node.js Crypto-Hash
	 */
	static #getHashAlg(jwtAlg) {
		switch (jwtAlg) {
			case 'HS256': return 'sha256';
			case 'HS384': return 'sha384';
			case 'HS512': return 'sha512';
			default: throw new Error(`Nicht unterstützter Algorithmus: ${jwtAlg}`);
		}
	}

	/**
	 * Initialisiert den globalen Auth-Service mit einem Secret.
	 * @param {string} secret 
	 * @param {object} [$options]
	 * @param {number} [$options.expiresIn] Standard-Ablaufzeit in Sekunden
	 * @param {string} [$options.algorithm] HMAC-Algorithmus (HS256, HS384, HS512)
	 */
	static init(secret, $options = {}) {
		if (!secret) throw new Error('AuthService benötigt ein Secret!');
		AuthService.#secret = secret;
		if ($options.expiresIn) AuthService.#expiresIn = $options.expiresIn;
		if ($options.algorithm) AuthService.#algorithm = $options.algorithm;
	}

	/**
	 * Erstellt einen signierten JWT.
	 * @param {object} payload Die Nutzdaten (z.B. { id: 1, role: 'admin' })
	 * @param {number} [expiresInSeconds] Ablaufzeit in Sekunden (überschreibt den Default)
	 * @returns {string} Das fertige JWT
	 */
	static sign(payload, expiresInSeconds = AuthService.#expiresIn) {
		if (!AuthService.#secret) throw new Error('AuthService wurde nicht initialisiert!');

		const header = { alg: AuthService.#algorithm, typ: 'JWT' };
		const now = Math.floor(Date.now() / 1000);

		const jwtPayload = { ...payload, iat: now, exp: now + expiresInSeconds };

		const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
		const encodedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url');

		const signature = crypto
			.createHmac(AuthService.#getHashAlg(AuthService.#algorithm), AuthService.#secret)
			.update(`${encodedHeader}.${encodedPayload}`)
			.digest('base64url');

		return `${encodedHeader}.${encodedPayload}.${signature}`;
	}

	/**
	 * Verifiziert einen JWT und gibt den Payload zurück.
	 * Wirft einen Fehler, wenn das Token manipuliert oder abgelaufen ist.
	 */
	static verify(token) {
		if (!AuthService.#secret) throw new Error('AuthService wurde nicht initialisiert!');

		const parts = token.split('.');
		if (parts.length !== 3) throw new TokenInvalidError('Ungültiges Token-Format.');

		const [encodedHeader, encodedPayload, signature] = parts;

		// Header prüfen (Schutz vor Algorithm Downgrade Attacks)
		const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf-8'));
		if (header.alg !== AuthService.#algorithm) {
			throw new TokenInvalidError(`Ungültiger Algorithmus. Erwartet: ${AuthService.#algorithm}, bekommen: ${header.alg}`);
		}

		// Erwartete Signatur berechnen
		const expectedSignature = crypto
			.createHmac(AuthService.#getHashAlg(AuthService.#algorithm), AuthService.#secret)
			.update(`${encodedHeader}.${encodedPayload}`)
			.digest('base64url');

		// timingSafeEqual schützt vor Zeitmessungs-Angriffen!
		if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
			throw new TokenInvalidError('Ungültige Token-Signatur.');
		}

		// Payload dekodieren und Ablaufdatum prüfen
		const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
		if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
			throw new TokenExpiredError();
		}

		return payload;
	}

	/**
	 * Prüft rein strukturell, ob der String das Format eines JWT hat.
	 */
	static isJWT(token) {
		if (!token) return false;
		return /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(token);
	}

	/**
	 * Dekodiert den Payload eines JWTs (ohne Signatur-Prüfung).
	 */
	static decode(token) {
		if (!AuthService.isJWT(token)) return null;
		try {
			const base64Url = token.split('.')[1];
			const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
			return JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
		} catch (err) {
			return null;
		}
	}
}