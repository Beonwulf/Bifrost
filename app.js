import { BifrostApp, I18n, NavRegistry } from 'bifrost';
import { fileURLToPath } from 'node:url';
import { join }          from 'node:path';

const __dir = fileURLToPath(new URL('.', import.meta.url));

BifrostApp.enableBodyParser();
BifrostApp.enableSessions();
BifrostApp.enableCsrf();
// BifrostApp.enableSsl('path/to/cert.pem', 'path/to/key.pem'); // Optional: SSL aktivieren
const app   = new BifrostApp();

BifrostApp.configureViews({
	views:    join(__dir, 'mvc/views'),
	layouts:  join(__dir, 'mvc/views/layouts'),
	partials: join(__dir, 'mvc/views/partials'),
	cache:    process.env.NODE_ENV === 'production',
});

I18n.configure({
	dir:      join(__dir, 'i18n'),
	fallback: 'de',
});

BifrostApp.setLocales(['de', 'en', 'fr', 'es', 'it']);

await app.startup({
	port:            process.env.PORT || 3001,
	static:          'public',
	bodyParser:      true,
	responseHelpers: true,
	securityHeaders: true,
	liveReload:      true, // Auto-Refresh bei Änderungen (node --watch)
	rateLimit:       { points: 100, duration: 60 }, // trustProxy: true hinter nginx/Caddy
});

await app.loadControllers(join(__dir, 'mvc/controllers'));

// NavRegistry — Footer-Links registrieren
NavRegistry.register('footer', { slug: '/imprint', lang: 'nav.imprint', order: 1 });

app.setErrorHandler(404, async ($req, $res) => {
	$res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
	$res.end('<h1>404 — Nicht gefunden</h1>');
});

await app.run();
