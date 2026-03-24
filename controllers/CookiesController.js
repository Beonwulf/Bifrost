import { BBController } from '../src/routing/BBController.js';

export default class CookiesController extends BBController {
    static path    = '/cookies';
    static methods = ['get'];
    static menu    = [{ footerlegal: 3, lang: 'nav.cookies' }];

    title       = 'Cookies — Bifröst';
    description = 'Cookie-Richtlinie';

    async get() {
        await this.render('cookies');
    }
}
