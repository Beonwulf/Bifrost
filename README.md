# Bifröst 🌈

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-FF5E5B?logo=ko-fi&logoColor=white)](https://ko-fi.com/beonwulf)

> Standalone Node.js HTTP/HTTPS framework — no Express, no dependencies except `socket.io` and `selfsigned`.

Bifröst combines a custom HTTP/HTTPS server, a middleware pipeline (Runes), class-based routing, WebSocket support via Socket.io and a built-in template engine ([Galdr](./src/template/README.md)) in one lean, modular package.

---

## Installation

```bash
npm install bifrost
```

---

## Quick Start

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
    $res.end('The bridge is open.');
});

await app.run();
```

---

## Contents

- [BifrostApp](#bifrostapp) — High-level app layer
- [Bifrost](#bifrost) — Server core
- [Routing](#routing)
  - [Functional routes](#functional-routes)
  - [BBController](#bbcontroller)
- [Middleware (Runes)](#middleware-runes)
- [File Uploads](#file-uploads)
- [CORS](#cors)
- [WebSockets](#websockets)
- [SSL / HTTPS](#ssl--https)
- [Logging](#logging)
- [Template Engine — Galdr](./src/template/README.md)
- [Service Registry](#service-registry)
- [Error Handling](#error-handling)
- [Project Structure](#project-structure)

---

## BifrostApp

`BifrostApp` is the recommended entry point. It wraps the `Bifrost` instance, Socket.io and a service registry.

### Static Configuration

```js
import { BifrostApp } from 'bifrost';

BifrostApp.setPort(8080);
BifrostApp.setHost('0.0.0.0');
BifrostApp.setStatic('public');
BifrostApp.enableBodyParser();
BifrostApp.enableSocket();
BifrostApp.enableCors({ origin: '*' });
BifrostApp.enableLogging({ level: 'info', file: true });
BifrostApp.enableSessions({ duration: 3600 });
BifrostApp.enableSSL();           // Self-signed certificate (auto-generated)
// BifrostApp.enableSSL(key, cert) // Custom certificate
```

### `startup($options)`

```js
const { app, bifrost, io, router } = await app.startup({
    port:            3000,
    host:            '0.0.0.0',
    ssl:             false,
    socket:          false,
    static:          'public',   // folder for static files
    bodyParser:      { maxBytes: 10 * 1024 * 1024 }, // JSON & File uploads (10 MB Limit)
    cors:            true,       // Enable standard CORS
    sessions:        { duration: 3600 }, // In-Memory Sessions
    logging:         { level: 'info', file: true }, // File logger
    compression:     false,
    responseHelpers: true,       // res.json() / res.error()
});
```

### `configureViews($options)` _(static)_

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

The server core. Created internally by `BifrostApp`, but can also be used directly.

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

### Functional Routes

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

Load via `BifrostApp`:

```js
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = fileURLToPath(new URL('.', import.meta.url));
await app.loadRoutes(join(__dir, 'routes'));
```

### URL Parameters

```js
bifrost.get('/user/:id', ($req, $res) => {
    const { id } = $req.params;
    $res.json({ userId: id });
});
```

---

## BBController

Class-based controller system. Each class defines its path and HTTP methods via static properties.

```js
// controllers/UserController.js
import { BBController } from 'bifrost';

export default class UserController extends BBController {
    static path    = '/user/:id';
    static methods = ['get', 'post'];

    // Called before method dispatch
    // return false → abort (e.g. after redirect())
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

Load:

```js
await app.loadControllers(join(__dir, 'controllers'));
```

### Parameter Callback

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

### Controller Response Helpers

| Method | Description |
|---|---|
| `this.send(status, body, contentType)` | Raw response |
| `this.json(data, status?)` | JSON response |
| `this.html(html, status?)` | HTML response |
| `this.render(template, data, status?)` | Render a Galdr template |
| `this.redirect(url, status?)` | Redirect (default: 302) |
| `this.next()` | Pass to next handler |

---

## Middleware (Runes)

Middleware functions are called **Runes**. A Rune has the signature `async (req, res, next) => void`.

```js
// Custom Rune
bifrost.use(async ($req, $res, $next) => {
    console.log(`${$req.method} ${$req.url}`);
    await $next();
});
```

### Built-in Runes

```js
// Serve static files from /public
// Supports ETag + 304 Not Modified out of the box
bifrost.use(Bifrost.createStaticRune('public'));

// Parse JSON body (POST/PUT/PATCH) → req.body,
// and Multipart Form-Data (files) → req.files
// Optional: { maxBytes: 10 * 1024 * 1024 } (default: 1 MB)
bifrost.use(Bifrost.createBodyParserRune());

// Add res.json() and res.error()
bifrost.use(Bifrost.createResponseHelperRune());

// Security headers (CSP, HSTS, X-Frame-Options, ...)
// Recommended: register as the very first rune
bifrost.use(Bifrost.createSecurityHeadersRune({
    // csp: "default-src 'self'; ...",  // override default CSP
    hsts: true,        // Strict-Transport-Security (HTTPS only)
    hstsMaxAge: 31_536_000,
}));

// CORS — Handles cross-origin requests & OPTIONS preflights
bifrost.use(Bifrost.createCorsRune({
    origin: ['https://frontend.com'],
    credentials: true
}));

// Rate limiting — Fixed Window per IP, no external package required
// trustProxy: true when behind nginx/Caddy (reads X-Forwarded-For)
bifrost.use(Bifrost.createRateLimitRune({ points: 100, duration: 60 }));
bifrost.use(Bifrost.createRateLimitRune({ points: 100, duration: 60, trustProxy: true }));
```

| Rune | Response Headers set |
|---|---|
| `createStaticRune` | `ETag`, `Content-Type`, `Content-Length`, `COEP`, `COOP` |
| `createCorsRune` | `Access-Control-Allow-*`, `Access-Control-Expose-Headers` |
| `createSecurityHeadersRune` | `CSP`, `HSTS`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` |
| `createRateLimitRune` | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` |

---

## File Uploads

Bifröst can parse `multipart/form-data` directly — no external dependencies like Multer needed.

```js
// Enable in app startup (e.g. with 50 MB limit)
await app.startup({ bodyParser: { maxBytes: 50 * 1024 * 1024 } });
```

In your controller, you can comfortably access `this.files`. Each file is a raw Node.js Buffer object (`{ filename, mimetype, size, data }`):
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

The built-in CORS Rune handles cross-origin requests, `OPTIONS` preflights, and `Vary: Origin` caching automatically.

```js
// Configure in app.startup()
await app.startup({
    cors: {
        origin: ['https://frontend.com', 'http://localhost:3000'],
        credentials: true, // Allow cookies & authorization headers
        methods: 'GET,POST,PUT,DELETE',
        maxAge: 86400      // Cache preflight response for 24h
    }
});
```

**Supported values for `origin`:**
- `'*'`: Allow all origins (default).
- `true`: Always reflect the requesting origin dynamically.
- `['https://a.com', 'https://b.com']`: Array of explicitly allowed domains.
- `async (reqOrigin, req) => { ... }`: Custom validation function.

---

## WebSockets

```js
const app = new BifrostApp();
BifrostApp.enableSocket();

const { io } = await app.startup({ port: 3000 });

io.on('connection', ($socket) => {
    console.log('Connected:', $socket.id);

    $socket.on('message', ($data) => {
        $socket.emit('echo', $data);
    });
});

await app.run();
```

---

## SSL / HTTPS

**Self-signed certificate (auto-generated):**

```js
await app.startup({ ssl: true });
// Certificate is saved to data/bifrost/key.pem + cert.pem
```

**Custom certificate:**

```js
import { readFileSync } from 'node:fs';

BifrostApp.enableSSL(
    readFileSync('./certs/key.pem'),
    readFileSync('./certs/cert.pem')
);
await app.startup();
```

---

## Logging

Bifröst includes a fast logger with built-in **log rotation** (daily file stream & automatic gzip compression) — zero external dependencies.

```js
await app.startup({
    logging: { level: 'info', file: true, maxDays: 30 } // Rotates daily into /logs
});

// Available everywhere in your controllers:
this.app.log.info('Something happened');
this.app.log.error('An error occurred', new Error('...'));
```

---

## Service Registry

```js
// Register services
app.register('db', myDatabaseInstance);
app.register('auth', myAuthService);

// Access from controllers:
this.app.service('db').find(id);
```

---

## Error Handling

```js
app.setErrorHandler(404, ($req, $res) => {
    $res.writeHead(404, { 'Content-Type': 'text/html' });
    $res.end('<h1>Not Found</h1>');
});

app.setErrorHandler(500, ($req, $res, $err) => {
    console.error($err);
    $res.writeHead(500);
    $res.end('Internal Server Error');
});
```

Without custom handlers the built-in Galdr templates (`404.galdr.html` / `500.galdr.html`) are rendered.

---

## Project Structure

```
bifrost/
├── index.js                        ← Public API
├── package.json
└── src/
    ├── core/
    │   ├── Bifrost.js              ← HTTP/HTTPS server
    │   ├── BifrostApp.js           ← High-level app layer
    │   └── BifrostStatic.js        ← Middleware factories
    ├── routing/
    │   ├── BBController.js         ← Base controller class
    │   └── Router.js               ← Route/controller loader
    ├── template/
    │   ├── Galdr.js                ← Template engine
    │   ├── README.md               ← Galdr syntax reference
    │   └── views/                  ← Built-in templates
    ├── defaults/
    │   └── routes.js               ← Built-in 404/500 handlers
    └── utils/
        └── mimeTypes.js
```

---

## License

MIT
