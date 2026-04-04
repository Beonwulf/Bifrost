import { BBController } from '../src/routing/BBController.js';

export default class SpaController extends BBController {
    // Wildcard-Route: Fängt alle Anfragen ab (z.B. /profile/123)
    static path = '/*';
    static methods = ['get'];

    async get() {
        // Die Wildcard-Gruppe gibt uns den genauen Pfad nach dem '/' zurück
        const requestedPath = this.params.wildcard_0 || '';

        // Standard Meta-Daten für die SPA
        let pageTitle = 'Meine großartige SPA';
        let pageDesc = 'Willkommen in meiner Single Page Application.';

        // Einfaches Beispiel: Dynamische Daten anhand des Pfades ermitteln
        // (In der Praxis würdest du hier ggf. eine Datenbank-Abfrage machen)
        if (requestedPath.startsWith('profile/')) {
            pageTitle = 'Benutzerprofil | Meine SPA';
            pageDesc = 'Sieh dir dieses Benutzerprofil an.';
        } else if (requestedPath === 'settings') {
            pageTitle = 'Einstellungen | Meine SPA';
        }

        // Galdr rendern und Meta-Daten übergeben
        await this.render('spa-index', {
            title: pageTitle,
            description: pageDesc,
            ogType: 'website' // Nutzt den BBController SEO-Standard
        });
    }
}