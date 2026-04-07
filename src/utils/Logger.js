import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { pipeline } from 'node:stream/promises';

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const COLORS = {
	debug: '\x1b[36m', // Cyan
	info:  '\x1b[32m', // Grün
	warn:  '\x1b[33m', // Gelb
	error: '\x1b[31m', // Rot
	reset: '\x1b[0m'
};

export class Logger {
	#level;
	#logDir;
	#writeToFile;
	#stream;
	#currentDay;
	#maxDays;
	#isRotating = false;

	constructor(options = {}) {
		this.#level = LEVELS[options.level || 'info'] ?? 1;
		this.#writeToFile = options.file ?? false;
		this.#logDir = options.dir ? path.resolve(process.cwd(), options.dir) : path.resolve(process.cwd(), 'logs');
		this.#maxDays = options.maxDays ?? 30; // Standardmäßig 30 Tage aufheben

		if (this.#writeToFile) {
			if (!fs.existsSync(this.#logDir)) {
				fs.mkdirSync(this.#logDir, { recursive: true });
			}
			this.#initStream();
		}
	}

	#initStream() {
		this.#currentDay = new Date().toISOString().slice(0, 10);
		const logFile = path.join(this.#logDir, 'bifrost.log');
		// Stream im "Append" (Anhängen)-Modus öffnen
		this.#stream = fs.createWriteStream(logFile, { flags: 'a' });
		this.#stream.on('error', (err) => {
			console.error('⚠️ Logger Stream Fehler:', err.message);
		});
	}

	async #checkRotation() {
		if (!this.#writeToFile || !this.#stream || this.#isRotating) return;
		const today = new Date().toISOString().slice(0, 10);
		
		if (today !== this.#currentDay) {
			this.#isRotating = true;
			const oldDay = this.#currentDay;
			this.#currentDay = today;
			
			// 1. Alten Stream schließen
			this.#stream.end();
			
			const oldFile = path.join(this.#logDir, 'bifrost.log');
			const archiveFile = path.join(this.#logDir, `bifrost-${oldDay}.log`);
			const gzFile = `${archiveFile}.gz`;

			try {
				// 2. Aktuelle Datei umbenennen
				if (fs.existsSync(oldFile)) fs.renameSync(oldFile, archiveFile);
				
				// 3. Sofort neuen Stream für den neuen Tag öffnen (Blockiert den Server nicht)
				this.#initStream();

				// 4. Datei im Hintergrund zippen (Gzip)
				if (fs.existsSync(archiveFile)) {
					await pipeline(
						fs.createReadStream(archiveFile),
						zlib.createGzip(),
						fs.createWriteStream(gzFile)
					);
					// 5. Unkomprimierte Original-Datei nach dem Zippen löschen
					await fs.promises.unlink(archiveFile);
				}

				// 6. Alte Archive bereinigen
				await this.#cleanupOldLogs();
			} catch (err) {
				console.error('⚠️ Fehler bei der Log-Rotation:', err);
				if (!this.#stream || this.#stream.closed) this.#initStream();
			} finally {
				this.#isRotating = false;
			}
		}
	}

	async #cleanupOldLogs() {
		if (this.#maxDays <= 0) return; // <= 0 bedeutet "für immer aufheben"
		try {
			const files = await fs.promises.readdir(this.#logDir);
			const now = Date.now();
			const maxAgeMs = this.#maxDays * 24 * 60 * 60 * 1000; // Tage in Millisekunden umrechnen

			for (const file of files) {
				if (file.startsWith('bifrost-') && file.endsWith('.log.gz')) {
					const dateStr = file.replace('bifrost-', '').replace('.log.gz', '');
					const fileDate = new Date(dateStr).getTime();
					if (!isNaN(fileDate) && now - fileDate > maxAgeMs) {
						await fs.promises.unlink(path.join(this.#logDir, file));
					}
				}
			}
		} catch (err) {
			console.error('⚠️ Fehler beim Bereinigen alter Logs:', err);
		}
	}

	log(levelName, message, meta = '') {
		const levelNum = LEVELS[levelName];
		if (levelNum < this.#level) return;

		this.#checkRotation(); // async Fire & Forget

		const now = new Date().toISOString();
		const color = COLORS[levelName] || COLORS.reset;

		const formatTerm = (v) => v instanceof Error ? (v.stack || v.message) : v;
		const termMsg = formatTerm(message);
		const termMeta = meta ? ` ${formatTerm(meta)}` : '';
		
		// Terminal Ausgabe
		console.log(`\x1b[90m[${now}]\x1b[0m ${color}[${levelName.toUpperCase()}]\x1b[0m ${termMsg}${termMeta}`);

		// Datei-Ausgabe (Ohne Terminal-Farbcodes)
		if (this.#writeToFile && this.#stream) {
			const formatFile = (v) => v instanceof Error ? (v.stack || v.message) : (typeof v === 'string' ? v.replace(/\x1B\[\d+m/g, '') : JSON.stringify(v));
			const cleanMsg = formatFile(message);
			const cleanMeta = meta ? ` ${formatFile(meta)}` : '';
			this.#stream.write(`[${now}] [${levelName.toUpperCase()}] ${cleanMsg}${cleanMeta}\n`);
		}
	}

	debug(msg, meta = '') { this.log('debug', msg, meta); }
	info(msg,  meta = '') { this.log('info', msg, meta); }
	warn(msg,  meta = '') { this.log('warn', msg, meta); }
	error(msg, meta = '') { this.log('error', msg, meta); }
}