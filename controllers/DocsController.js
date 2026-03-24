import { BBController } from '../src/routing/BBController.js';

export default class DocsController extends BBController {
    static path    = '/docs';
    static methods = ['get'];
    static menu    = [{ main: 2, lang: 'nav.docs' }];

    title       = 'Docs — Bifröst';
    description = 'Bifröst Dokumentation';

    async get() {
        await this.render('docs');
    }
}
