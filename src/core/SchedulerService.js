/**
 * SchedulerService — Nativer Task-Scheduler für Hintergrundjobs (Cron-Ersatz)
 * Kommt komplett ohne externe Abhängigkeiten aus.
 */
export class SchedulerService {
	static #tasks = new Map();

	/**
	 * Führt eine Aufgabe in einem festen Intervall aus.
	 * @param {string} $name Eindeutiger Name des Tasks
	 * @param {number} $ms Intervall in Millisekunden
	 * @param {Function} $callback async Funktion
	 * @param {boolean} $runImmediately Wenn true, startet der Task direkt beim Aufruf (Default: false)
	 */
	static interval($name, $ms, $callback, $runImmediately = false) {
		SchedulerService.stop($name);
		let isRunning = false;

		const execute = async () => {
			if (isRunning) return;
			isRunning = true;
			try { await $callback(); } catch (err) { console.error(`[Scheduler] Task '${$name}' failed:`, err); }
			finally { isRunning = false; }
		};

		if ($runImmediately) execute(); // Sofort im Hintergrund starten

		const scheduleNext = () => {
			const timer = setTimeout(async () => {
				await execute();
				if (SchedulerService.#tasks.has($name)) scheduleNext();
			}, $ms);
			if (timer.unref) timer.unref();
			SchedulerService.#tasks.set($name, { type: 'interval', timer });
		};

		SchedulerService.#tasks.set($name, { type: 'interval', timer: null });
		scheduleNext();
	}

	/**
	 * Führt eine Aufgabe täglich zu einer bestimmten Uhrzeit aus.
	 * @param {string} $name Eindeutiger Name des Tasks
	 * @param {string} $time Uhrzeit im Format 'HH:MM' (z.B. '03:00')
	 * @param {Function} $callback async Funktion
	 */
	static daily($name, $time, $callback) {
		SchedulerService.stop($name);
		const [targetHour, targetMin] = $time.split(':').map(Number);
		let isRunning = false;

		const scheduleNext = () => {
			const now = new Date();
			const next = new Date(now);
			next.setHours(targetHour, targetMin, 0, 0);

			// Wenn die Zeit heute schon vergangen ist, auf morgen verschieben
			if (now >= next) {
				next.setDate(next.getDate() + 1);
			}

			const delay = next.getTime() - now.getTime();
			const timer = setTimeout(async () => {
				if (!isRunning) {
					isRunning = true;
					try { await $callback(); } catch (err) { console.error(`[Scheduler] Task '${$name}' failed:`, err); }
					finally { isRunning = false; }
				}
				if (SchedulerService.#tasks.has($name)) scheduleNext(); // Für den nächsten Tag neu einplanen
			}, delay);

			if (timer.unref) timer.unref();
			SchedulerService.#tasks.set($name, { type: 'daily', timer });
		};

		SchedulerService.#tasks.set($name, { type: 'daily', timer: null });
		scheduleNext();
	}

	static stop($name) {
		const task = SchedulerService.#tasks.get($name);
		if (task) {
			clearTimeout(task.timer);
			SchedulerService.#tasks.delete($name);
		}
	}

	static stopAll() {
		for (const name of SchedulerService.#tasks.keys()) SchedulerService.stop(name);
	}
}