import { BBController } from '../src/routing/BBController.js';

export default class DatenschutzController extends BBController {
    static path    = '/privacy';
    static methods = ['get'];
    static menu    = [{ footerlegal: 2, lang: 'nav.datenschutz' }];

    title       = 'Privacy — Bifröst';
    description = 'Datenschutzerklärung';

    async get() {
        await this.render('datenschutz');
    }
}
