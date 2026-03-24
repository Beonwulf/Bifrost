import { BBController } from '../src/routing/BBController.js';

export default class ImpressumController extends BBController {
    static path    = '/imprint';
    static methods = ['get'];
    static menu    = [{ footerlegal: 1, lang: 'nav.impressum' }];

    title       = 'Impressum — Bifröst';
    description = 'Impressum';

    async get() {
        await this.render('impressum');
    }
}
