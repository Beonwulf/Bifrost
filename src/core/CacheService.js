/**
 * CacheService — Globaler In-Memory Cache für Bifröst
 * Perfekt um teure Datenbankabfragen oder externe API-Calls mit einer Time-to-Live (TTL)
 * im Arbeitsspeicher zwischenzuspeichern.
 */
export class CacheService {
	static #store = new Map();
	static #pending = new Map();
	static #interval = null;
	static MAX_KEYS = 100000; // Schutz vor Memory-Leaks

	/**
	 * Startet den Garbage-Collector für abgelaufene Keys (läuft alle 60 Sek).
	 */
	static #startCleanup() {
		if (!CacheService.#interval) {
			CacheService.#interval = setInterval(() => {
				const now = Date.now();
				for (const [key, entry] of CacheService.#store) {
					if (entry.exp !== 0 && entry.exp <= now) CacheService.#store.delete(key);
				}
			}, 60_000);
			// Verhindert, dass das Interval Node.js am Beenden hindert
			if (CacheService.#interval.unref) CacheService.#interval.unref();
		}
	}

	/**
	 * Speichert einen Wert im Cache.
	 * @param {string} $key 
	 * @param {any} $value 
	 * @param {number} $ttlSeconds Time-to-Live in Sekunden (0 = unendlich, Default: 60)
	 */
	static set($key, $value, $ttlSeconds = 60) {
		CacheService.#startCleanup();
		
		// OOM-Schutz: Verhindert, dass der RAM bei extrem vielen Schlüsseln vollläuft (FIFO-Prinzip)
		if (CacheService.#store.size >= CacheService.MAX_KEYS && !CacheService.#store.has($key)) {
			const firstKey = CacheService.#store.keys().next().value;
			CacheService.#store.delete(firstKey);
		}

		const exp = $ttlSeconds === 0 ? 0 : Date.now() + ($ttlSeconds * 1000);
		CacheService.#store.set($key, { value: $value, exp });
	}

	/**
	 * Holt einen Wert aus dem Cache. Gibt undefined zurück, falls nicht existent oder abgelaufen.
	 */
	static get($key) {
		const entry = CacheService.#store.get($key);
		if (!entry) return undefined;
		if (entry.exp !== 0 && entry.exp <= Date.now()) {
			CacheService.#store.delete($key);
			return undefined;
		}
		return entry.value;
	}

	static delete($key) {
		CacheService.#store.delete($key);
	}

	static clear() {
		CacheService.#store.clear();
	}

	/**
	 * Magische Helfer-Methode: Holt den Wert aus dem Cache.
	 * Wenn er nicht existiert, wird das Callback ausgeführt, das Ergebnis gespeichert und zurückgegeben.
	 * @param {string} $key 
	 * @param {number} $ttlSeconds (0 = unendlich)
	 * @param {Function} $callback  async () => data
	 */
	static async remember($key, $ttlSeconds, $callback) {
		const cached = CacheService.get($key);
		if (cached !== undefined) return cached; // Erlaubt das Cachen von "null"

		// Cache Stampede Protection (Verhindert, dass bei Ablauf 100 parallele DB-Queries starten)
		if (CacheService.#pending.has($key)) {
			return CacheService.#pending.get($key);
		}

		const promise = (async () => {
			try {
				const value = await $callback();
				CacheService.set($key, value, $ttlSeconds);
				return value;
			} finally {
				CacheService.#pending.delete($key);
			}
		})();

		CacheService.#pending.set($key, promise);
		return promise;
	}
}