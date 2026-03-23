# Getting Started

> From zero to a running Bifröst server in under 5 minutes.

---

## Requirements

- **Node.js** ≥ 18
- **ESM project** — your `package.json` must contain `"type": "module"`

---

## Installation

```bash
npm install bifrost
```

---

## Minimal setup

```js
// app.js
import { BifrostApp } from 'bifrost';

const app = new BifrostApp();

const { bifrost } = await app.startup({ port: 3000 });

bifrost.get('/', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('The bridge is open.');
});

await app.run();
```

```bash
node app.js
# 🌈 Bifröst erstrahlt auf HTTP://0.0.0.0:3000
```

---

## Recommended project layout

```
my-app/
├── app.js                  ← entry point
├── controllers/            ← BBController classes
│   └── HomeController.js
├── routes/                 ← functional routes
│   └── api.js
├── views/                  ← Galdr templates (.galdr.html)
│   ├── home.galdr.html
│   ├── layouts/
│   │   └── base.galdr.html
│   └── partials/
│       └── head.galdr.html
└── public/                 ← static files (CSS, JS, images)
```

---

## Full example with controllers, views and static files

```js
// app.js
import { BifrostApp } from 'bifrost';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const __dir = fileURLToPath(new URL('.', import.meta.url));

const app = new BifrostApp();

// Configure the template engine
BifrostApp.configureViews({
    views:    join(__dir, 'views'),
    layouts:  join(__dir, 'views/layouts'),
    partials: join(__dir, 'views/partials'),
});

// Start the server
await app.startup({
    port:           3000,
    static:         'public',   // serve files from ./public
    bodyParser:     true,       // parse JSON request bodies
    responseHelpers: true,      // adds res.json() and res.error()
});

// Load all controllers and routes
await app.loadControllers(join(__dir, 'controllers'));
await app.loadRoutes(join(__dir, 'routes'));

await app.run();
```

```js
// controllers/HomeController.js
import { BBController } from 'bifrost';

export default class HomeController extends BBController {
    static path    = '/';
    static methods = ['get'];

    async get() {
        await this.render('home', { title: 'Welcome' });
    }
}
```

```html
<!-- views/home.galdr.html -->
{% layout "base" %}
    <h1>{{ $title }}</h1>
{% endlayout %}
```

---

## Next steps

| Topic | Doc |
|---|---|
| All startup options | [configuration.md](configuration.md) |
| Routes & controllers | [routing.md](routing.md) |
| Middleware (Runes) | [middleware.md](middleware.md) |
| WebSockets | [websockets.md](websockets.md) |
| Static files | [static-files.md](static-files.md) |
| HTTPS | [https.md](https.md) |
| Error handling | [error-handling.md](error-handling.md) |
| Template engine | [../src/template/README.md](../src/template/README.md) |
