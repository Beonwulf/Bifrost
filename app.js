import { BifrostApp, I18n } from './index.js';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const __dir = fileURLToPath(new URL('.', import.meta.url));

I18n.configure({
    dir:      join(__dir, 'i18n'),
    fallback: 'en',
});

BifrostApp.setLocales(['en', 'de', 'fr', 'es', 'it', 'pt', 'ru']);

BifrostApp.configureViews({
    views:    join(__dir, 'views'),
    layouts:  join(__dir, 'views/layouts'),
    partials: join(__dir, 'views/partials'),
    cache:    false,
});

const app = new BifrostApp();

await app.startup({
    port:            3001,
    host:            '127.0.0.1',
    static:          'public',
    bodyParser:      true,
    responseHelpers: true,
});

await app.loadControllers(join(__dir, 'controllers'));

await app.run();

console.log('bifrost.mycoder.eu läuft auf http://127.0.0.1:3001');
