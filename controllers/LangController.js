import { BBController } from '../src/routing/BBController.js';

const SUPPORTED = ['de', 'en', 'fr', 'es', 'it', 'pt', 'ru'];

export default class LangController extends BBController {
    static path    = '/lang/:code';
    static methods = ['get'];

    async get() {
        const code = this.params.code?.toLowerCase();

        if (!SUPPORTED.includes(code)) {
            return this.redirect('/');
        }

        const back = this.req.headers.referer ?? '/';
        const isHttps = this.req.socket?.encrypted || this.req.headers['x-forwarded-proto']?.split(',')[0].trim() === 'https';
        this.res.setHeader('Set-Cookie',
            `locale=${code}; Path=/; Max-Age=31536000; SameSite=Lax${isHttps ? '; Secure' : ''}`
        );
        this.redirect(back);
    }
}
