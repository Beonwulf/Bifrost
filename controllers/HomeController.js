import { BBController } from '../src/routing/BBController.js';

export default class HomeController extends BBController {
    static path    = '/';
    static methods = ['get'];
    static menu    = [{ main: 1, lang: 'nav.home' }];

    title       = 'Bifröst';
    description = 'Bifröst — Lightweight Node.js Framework';

    async get() {
        await this.render('home');
    }
}
