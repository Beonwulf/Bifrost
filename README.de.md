# Bifröst 🌈

> Eigenständiges Node.js HTTP/HTTPS-Framework — kein Express, keine Abhängigkeiten außer `socket.io` und `selfsigned`.

Bifröst kombiniert einen eigenen HTTP/HTTPS-Server, eine Middleware-Pipeline (Runen), klassenbasiertes Routing, WebSocket-Support via Socket.io und eine eingebaute Template Engine ([Galdr](./src/template/README.de.md)) in einem schlanken, modularen Paket.

---

## Installation

```bash
npm install bifrost
```

---

## Quick-Start

```js
import { BifrostApp } from 'bifrost';

const app = new BifrostApp();

const { bifrost } = await app.startup({
    port:        3000,
    static:      'public',
    bodyParser:  true,
    socket:      false,
});

bifrost.get('/', ($req, $res) => {
    $res.writeHead(200, { 'Content-Type': 'text/plain' });
    $res.end('Die Brücke ist offen.');
});

await app.run();
```

---

## Inhalt

- [BifrostApp](#bifrostapp) — High-Level App-Layer
- [Bifrost](#bifrost) — Server-Kern
- [Routing](#routing)
  - [Funktionale Routen](#funktionale-routen)
  - [BBController](#bbcontroller)
- [Middleware (Runen)](#middleware-runen)
- [Datei-Uploads](#datei-uploads)
- [CORS](#cors)
- [WebSockets](#websockets)
- [SSL / HTTPS](#ssl--https)
- [Logging](#logging)
- [Template Engine — Galdr](./src/template/README.de.md)
- [Service-Registry](#service-registry)
- [Fehlerbehandlung](#fehlerbehandlung)
- [Projektstruktur](#projektstruktur)

---

## BifrostApp

`BifrostApp` ist der empfohlene Einstiegspunkt. Er kapselt die `Bifrost`-Instanz, Socket.io und eine Service-Registry.

### Statische Konfiguration

```js
import { BifrostApp } from 'bifrost';

BifrostApp.setPort(8080);
BifrostApp.setHost('0.0.0.0');
BifrostApp.setStatic('public');
BifrostApp.enableBodyParser();
BifrostApp.enableSocket();
BifrostApp.enableCors({ origin: ['http://localhost:3000', 'https://meine-app.de'] });
BifrostApp.enableLogging({ level: 'debug', file: true });
BifrostApp.enableSSL();           // Selbst-signiertes Zertifikat (auto-generiert)
// BifrostApp.enableSSL(key, cert) // Eigenes Zertifikat
```

### `startup($options)`

```js
const { app, bifrost, io, router } = await app.startup({
    port:            3000,
    host:            '0.0.0.0',
    ssl:             false,
    socket:          false,
    static:          'public',   // Ordner für statische Dateien
    bodyParser:      true,
        cors:            true,       // Standard-CORS aktivieren
    compression:     false,
        sessions:        { duration: 3600 }, // In-Memory Sessions aktivieren
        logging:         { level: 'info', file: true, maxDays: 30 }, // Rotierendes File-Logging
    responseHelpers: true,       // res.json() / res.error()
});
```

### `configureViews($options)` _(statisch)_

```js
import { BifrostApp } from 'bifrost';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const __dir = fileURLToPath(new URL('.', import.meta.url));

BifrostApp.configureViews({
    views:    join(__dir, 'views'),
    layouts:  join(__dir, 'views/layouts'),
    partials: join(__dir, 'views/partials'),
    cache:    true,
});
```

---

## Bifrost

Der Server-Kern. Wird intern von `BifrostApp` erstellt, ist aber auch direkt nutzbar.

```js
import { Bifrost } from 'bifrost';

const bifrost = new Bifrost({ port: 3000 });

bifrost
    .use(Bifrost.createResponseHelperRune())
    .use(Bifrost.createBodyParserRune());

bifrost.get('/ping', ($req, $res) => {
    $res.json({ pong: true });
});

await bifrost.ignite();
```

---

## Routing

### Funktionale Routen

```js
// routes/api.js
export default function ($bifrost) {
    $bifrost.get('/api/status', ($req, $res) => {
        $res.json({ status: 'ok' });
    });

    $bifrost.post('/api/data', ($req, $res) => {
        console.log($req.body);
        $res.json({ received: true });
    });
}
```

Laden via `BifrostApp`:

```js
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = fileURLToPath(new URL('.', import.meta.url));
await app.loadRoutes(join(__dir, 'routes'));
```

### URL-Parameter

```js
bifrost.get('/user/:id', ($req, $res) => {
    const { id } = $req.params;
    $res.json({ userId: id });
});
```

---

## BBController

Klassenbasiertes Controller-System. Jede Klasse definiert via Static-Properties Pfad und Methoden.

```js
// controllers/UserController.js
import { BBController } from 'bifrost';

export default class UserController extends BBController {
    static path    = '/user/:id';
    static methods = ['get', 'post'];

    // Wird vor dem Method-Dispatch aufgerufen
    // return false → Abbruch (z.B. nach redirect())
    async prepare() {
        if (!this.app.service('auth').check(this.req)) {
            this.redirect('/login');
            return false;
        }
        return true;
    }

    async get() {
        const user = await this.app.service('db').find(this.params.id);
        await this.render('user/profile', { user });
    }

    async post() {
        this.json({ saved: true }, 201);
    }
}
```

Laden:

```js
await app.loadControllers(join(__dir, 'controllers'));
```

### Parameter-Callback

```js
export default class PostController extends BBController {
    static path      = '/post/:slug';
    static methods   = ['get'];
    static paramName = 'slug';
    static paramCb   = async ($slug, $req) => {
        $req.post = await db.findBySlug($slug);
    };

    async get() {
        await this.render('post', { post: this.req.post });
    }
}
```

### Response-Helfer im Controller

| Methode | Beschreibung |
|---|---|
| `this.send(status, body, contentType)` | Rohe Antwort |
| `this.json(data, status?)` | JSON-Antwort |
| `this.html(html, status?)` | HTML-Antwort |
| `this.render(template, data, status?)` | Galdr-Template rendern |
| `this.redirect(url, status?)` | Weiterleitung (Standard: 302) |
| `this.next()` | An nächsten Handler weitergeben |

---

## Middleware (Runen)

Middleware-Funktionen werden als **Runen** bezeichnet. Eine Rune hat die Signatur `async (req, res, next) => void`.

```js
// Eigene Rune
bifrost.use(async ($req, $res, $next) => {
    console.log(`${$req.method} ${$req.url}`);
    await $next();
});
```

### Eingebaute Runen

```js
// Statische Dateien aus /public servieren
// Unterstützt ETag + 304 Not Modified automatisch
bifrost.use(Bifrost.createStaticRune('public'));

// JSON-Body parsen (POST/PUT/PATCH) → req.body,
// sowie Multipart Form-Data (Dateien) → req.files
// Optional: { maxBytes: 10 * 1024 * 1024 } (Standard: 1 MB)
bifrost.use(Bifrost.createBodyParserRune());

// res.json() und res.error() hinzufügen
bifrost.use(Bifrost.createResponseHelperRune());

// Sicherheits-Header (CSP, HSTS, X-Frame-Options, ...)
// Empfehlung: als allererste Rune registrieren
bifrost.use(Bifrost.createSecurityHeadersRune({
    // csp: "default-src 'self'; ...",  // eigene CSP überschreiben
    hsts: true,          // Strict-Transport-Security (nur HTTPS sinnvoll)
    hstsMaxAge: 31_536_000,
}));

// CORS — Behandelt Cross-Origin Anfragen & OPTIONS-Preflights
bifrost.use(Bifrost.createCorsRune({
    origin: ['https://frontend.de'],
    credentials: true
}));

// Rate Limiting — Fixed Window pro IP, kein externes Package nötig
// trustProxy: true wenn hinter nginx/Caddy (liest X-Forwarded-For)
bifrost.use(Bifrost.createRateLimitRune({ points: 100, duration: 60 }));
bifrost.use(Bifrost.createRateLimitRune({ points: 100, duration: 60, trustProxy: true }));
```

| Rune | Gesetzte Response-Header |
|---|---|
| `createStaticRune` | `ETag`, `Content-Type`, `Content-Length`, `COEP`, `COOP` |
| `createCorsRune` | `Access-Control-Allow-*`, `Access-Control-Expose-Headers` |
| `createSecurityHeadersRune` | `CSP`, `HSTS`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` |
| `createRateLimitRune` | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` |

---

## Datei-Uploads

Bifröst kann `multipart/form-data` direkt verarbeiten – ohne externe Abhängigkeiten wie Multer.

```js
// In der App aktivieren (z.B. mit 50 MB Limit)
await app.startup({ bodyParser: { maxBytes: 50 * 1024 * 1024 } });
```

Im Controller hast du bequemen Zugriff auf `this.files`. Jede Datei ist ein pures Node.js Buffer-Objekt (`{ filename, mimetype, size, data }`):
```js
async post() {
    const { avatar } = this.files;
    if (avatar) {
        await fs.promises.writeFile(`./uploads/${avatar.filename}`, avatar.data);
        this.json({ success: true });
    }
}
```

---

## CORS

Die eingebaute CORS-Rune ist hochflexibel und kümmert sich vollautomatisch um `OPTIONS`-Preflights, `Vary: Origin`-Caching und die Absicherung von Credentials-Konflikten.

```js
// In app.startup() konfigurieren
await app.startup({
    cors: {
        origin: ['https://frontend.de', 'http://localhost:3000'],
        credentials: true, // Erlaubt Cookies & Authorization-Header
        methods: 'GET,POST,PUT,DELETE',
        maxAge: 86400      // Preflight-Ergebnis im Browser für 24h cachen
    }
});
```

**Unterstützte Werte für `origin`:**
- `'*'`: Erlaubt Anfragen von überall (Standard).
- `true`: Reflektiert immer den anfragenden Origin (Dynamische Erlaubnis).
- `['https://a.de', 'https://b.de']`: Array von explizit erlaubten Domains.
- `async (reqOrigin, req) => { ... }`: Eigene Funktion zur Validierung (z.B. Check gegen eine Datenbank).

---

## WebSockets

```js
const app = new BifrostApp();
BifrostApp.enableSocket();

const { io } = await app.startup({ port: 3000 });

io.on('connection', ($socket) => {
    console.log('Verbunden:', $socket.id);

    $socket.on('message', ($data) => {
        $socket.emit('echo', $data);
    });
});

await app.run();
```

---

## SSL / HTTPS

**Selbst-signiertes Zertifikat (automatisch generiert):**

```js
await app.startup({ ssl: true });
// Zertifikat wird in data/bifrost/key.pem + cert.pem gespeichert
```

**Eigenes Zertifikat:**

```js
import { readFileSync } from 'node:fs';

BifrostApp.enableSSL(
    readFileSync('./certs/key.pem'),
    readFileSync('./certs/cert.pem')
);
await app.startup();
```

---

## Service-Registry

```js
// Dienste registrieren
app.register('db', myDatabaseInstance);
app.register('auth', myAuthService);

// In Controllern abrufbar via:
this.app.service('db').find(id);
```

---

## Fehlerbehandlung

```js
app.setErrorHandler(404, ($req, $res) => {
    $res.writeHead(404, { 'Content-Type': 'text/html' });
    $res.end('<h1>Nicht gefunden</h1>');
});

app.setErrorHandler(500, ($req, $res, $err) => {
    console.error($err);
    $res.writeHead(500);
    $res.end('Interner Fehler');
});
```

Ohne eigene Handler werden die eingebauten Galdr-Templates (`404.galdr.html` / `500.galdr.html`) gerendert.

---

## Projektstruktur

```
bifrost/
├── index.js                        ← Public API
├── package.json
└── src/
    ├── core/
    │   ├── Bifrost.js              ← HTTP/HTTPS-Server
    │   ├── BifrostApp.js           ← High-Level App-Layer
    │   └── BifrostStatic.js        ← Middleware-Factories
    ├── routing/
    │   ├── BBController.js         ← Basis-Controller-Klasse
    │   └── Router.js               ← Route/Controller-Loader
    ├── template/
    │   ├── Galdr.js                ← Template Engine
    │   ├── README.de.md            ← Galdr-Syntax-Referenz
    │   └── views/                  ← Built-in Templates
    ├── defaults/
    │   └── routes.js               ← Built-in 404/500 Handler
    └── utils/
        └── mimeTypes.js
```

---

## Lizenz

MIT
