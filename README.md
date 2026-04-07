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
- [Forms & Validation](#forms--validation)
- [CLI & Generators](#cli--generators)
- [Middleware (Runes)](#middleware-runes)
- [File Uploads](#file-uploads)
- [CORS](#cors)
- [CSRF Protection](#csrf-protection)
- [WebSockets](#websockets)
- [Server-Sent Events (SSE)](#server-sent-events-sse)
- [Event-Bus](#event-bus)
- [SSL / HTTPS](#ssl--https)
- [Logging](#logging)
- [API Testing (app.inject)](#api-testing-appinject)
- [CacheService](#cacheservice)
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
        liveReload:      true,       // Enable hot-reload in dev mode
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

## Event-Bus

Bifröst includes a global event bus based on the native Node.js `EventEmitter`. This is perfect for an Event-Driven Architecture to decouple background tasks (like sending emails) from the actual HTTP request.

**Registering events (e.g. in `app.js`):**
```js
app.events.on('user.registered', async (user) => {
    console.log(`New user: ${user.name}`);
    // await MailService.sendWelcome(user);
});
```

**Emitting events (in your controller):**
```js
import { BBController } from 'bifrost';

export default class RegisterController extends BBController {
    static path = '/register';
    static methods = ['post'];

    async post() {
        const user = { id: 1, name: this.body.name };
        
        // Emit event asynchronously in the background
        this.events.emit('user.registered', user);
        
        this.json({ success: true });
    }
}
```

---

## CacheService

Bifröst includes a global in-memory cache, which is especially useful for caching expensive database queries or API calls with a Time-to-Live (TTL).

```js
import { BBController, CacheService } from 'bifrost';

export default class StatsController extends BBController {
    static path = '/api/stats';
    static methods = ['get'];

    async get() {
        // Retrieves the data from RAM. If it doesn't exist or has expired,
        // the callback is executed and the result is stored for 600 seconds (10 mins).
        const stats = await CacheService.remember('dashboard_stats', 600, async () => {
            return await this.app.db.calculateHeavyStats();
        });
        
        this.json(stats);
    }
}
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

---

## Forms & Validation

Bifröst provides a built-in `BBForm` class to handle data binding, filtering, validation, and HTML rendering with Galdr.

```js
import { BBForm } from 'bifrost';

export class ContactForm extends BBForm {
    fields() {
        return {
            name:  { type: 'text', rules: ['required', 'min:3'] },
            email: { type: 'email', rules: ['required', 'email'] },
            agb:   { type: 'checkbox', rules: [(val) => val === true ? true : 'Must accept'] }
        };
    }
}
```

In your controller:
```js
const form = new ContactForm().withCsrf(this.req.session?._csrf);

if (this.req.method === 'POST') {
    form.bind(this.body);
    if (form.isValid()) {
        // form.values contains the sanitized data
        return this.redirect('/success');
    }
}
await this.render('contact', { form });
```

In your Galdr template:
```html
<form method="post">
    {{{ form.renderCsrf() }}}
    {{{ form.renderField('name') }}}
    {{{ form.renderField('email') }}}
    {{{ form.renderField('agb') }}}
    <button type="submit">Send</button>
</form>
```

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

### Streaming Gigantic Files (e.g. 2GB Videos)

For very large files, `multipart/form-data` is inefficient and consumes a lot of RAM. Use **Direct Binary Streaming** instead. This bypasses the BodyParser for a specific route and streams the request directly to disk (using almost zero memory).

**1. Bypass the BodyParser for the upload route:**
```js
await app.startup({ 
    bodyParser: { 
        maxBytes: 10 * 1024 * 1024,
        bypass: ($req) => $req.url === '/api/stream-upload' 
    } 
});
```

**2. Pipe directly to disk in your controller:**
```js
import fs from 'node:fs';

export default class StreamUploadController extends BBController {
    static path = '/api/stream-upload';
    static methods = ['put'];

    async put() {
        const stream = fs.createWriteStream('./gigantic-video.mp4');
        this.req.pipe(stream);
        
        await new Promise(resolve => stream.on('finish', resolve));
        this.json({ success: true });
    }
}
```

**In the frontend (client), send the file like this:**
```javascript
const file = document.querySelector('input[type="file"]').files;
await fetch('/api/stream-upload', {
    method: 'PUT',
    body: file // The browser automatically streams the file in chunks!
});
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

---

## CSRF Protection

Enable native Cross-Site Request Forgery (CSRF) protection (requires sessions and the body parser).

```js
await app.startup({
    sessions: { duration: 3600 },
    csrf: { ignore: ['/api/'] } // Ignore stateless APIs
});
```

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
├── bin/
│   └── bifrost.js                  ← CLI Tool
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

## CLI & Generators

Bifröst comes with a built-in CLI tool for rapid project scaffolding and code generation.

```bash
# Initialize a new project (creates mvc/ structure, app.js, etc.)
npx bifrost init

# Generate a new controller (in mvc/controllers/)
npx bifrost make:controller admin/Dashboard

# Generate a new form class (in mvc/forms/)
npx bifrost make:form Contact

# Generate a new view template (in mvc/views/)
npx bifrost make:view contact
```

---

## API Testing (app.inject)

Bifröst includes a built-in memory-injector for automated testing (e.g. with Jest, Mocha, or Node's native test runner). It simulates the entire HTTP lifecycle entirely in memory without ever binding a port or creating real network traffic.

```js
import test from 'node:test';
import assert from 'node:assert';
import { BifrostApp } from 'bifrost';

test('User API', async () => {
    const app = new BifrostApp();
    await app.startup(); // Runes and Controllers must be loaded

    const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        body: { name: 'Thor' }
    });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.json().success, true);
});
```

---

## Server-Sent Events (SSE)

If you want to push data in real-time from the server to the client without the overhead of WebSockets (Socket.io), Bifröst provides built-in helpers for **Server-Sent Events**.

**In your Controller:**
```js
import { BBController } from 'bifrost';

export default class LiveTickerController extends BBController {
    static path = '/api/ticker';
    static methods = ['get'];

    async get() {
        this.sseInit(); // Set headers and keep stream open

        const interval = setInterval(() => {
            this.sseSend({ time: Date.now(), msg: 'Tick' }, 'update');
        }, 1000);

        // Important: Clean up when the client closes the tab!
        this.req.on('close', () => clearInterval(interval));
    }
}
```

**In the frontend (Client):**
```js
const evtSource = new EventSource('/api/ticker');
evtSource.addEventListener('update', (e) => {
    console.log('New tick:', JSON.parse(e.data));
});
```

---

## License

MIT
