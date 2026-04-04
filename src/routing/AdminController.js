import { BBController } from './BBController.js';

/**
 * AdminController — Basisklasse für alle geschützten Admin-Routen
 *
 * Überprüft im `prepare()` Lifecycle, ob der Nutzer eingeloggt ist
 * und die nötigen Rechte hat, bevor der eigentliche Handler aufgerufen wird.
 */
export class AdminController extends BBController {

	/**
	 * Lifecycle-Hook: Wird aufgerufen, bevor get/post ausgeführt wird.
	 */
	async prepare() {
		// Zuerst das Basis-Prepare aufrufen
		const proceed = await super.prepare();
		if (!proceed) return false;

		// Guard: Verlangt die Rolle 'admin'. 
		// Leitet automatisch zu '/login' um, falls nicht eingeloggt oder falsche Rolle.
		return this.requireRole('admin');
	}
}