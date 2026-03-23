# Routing

> Two styles: functional routes and class-based BBControllers.

---

## Contents

- [Functional Routes](#functional-routes)
- [BBController](#bbcontroller)
  - [Static properties](#static-properties)
  - [Instance properties](#instance-properties)
  - [Response helpers](#response-helpers)
  - [prepare() lifecycle](#prepare-lifecycle)
  - [URL parameters (paramCb)](#url-parameters-paramcb)
- [Auto-loading with Router](#auto-loading-with-router)
- [URL parameters](#url-parameters)
- [Request body](#request-body)

---

## Functional Routes

Pass a handler function directly to the server. Good for simple API endpoints or one-offs.

```js
// Inline
bifrost.get('/ping', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
});

// Or load from a file directory
await app.loadRoutes(join(__dir, 'routes'));
```

A route file must export a default function that receives the `bifrost` instance:

```js
// routes/api.js
export default function ($bifrost) {
    $bifrost.get('/api/status', (req, res) => {
        res.json({ status: 'ok' });  // res.json() requires responseHelpers: true
    });

    $bifrost.post('/api/echo', (req, res) => {
        res.json(req.body);          // req.body requires bodyParser: true
    });
}
```

Supported HTTP methods: `get`, `post`, `put`, `patch`, `delete`.

---

## BBController

Class-based controllers. One class = one route. Inherit from `BBController` and set static properties.

```js
// controllers/UserController.js
import { BBController } from 'bifrost';

export default class UserController extends BBController {
    static path    = '/user/:id';
    static methods = ['get', 'post'];

    async get() {
        const { id } = this.params;
        await this.render('user/profile', { userId: id });
    }

    async post() {
        const data = this.body;          // parsed JSON body
        // ... save data
        this.json({ saved: true });
    }
}
```

### Static properties

| Property | Type | Default | Description |
|---|---|---|---|
| `path` | `string` | `'/'` | Route path, supports `:param` segments |
| `methods` | `string[]` | `['get']` | HTTP methods this controller handles |
| `withParam` | `boolean` | `false` | Enable `paramCb` validation (set implicitly when `paramName` is set) |
| `paramName` | `string \| null` | `null` | URL parameter name passed to `paramCb` |
| `paramCb` | `async Function \| null` | `null` | Called before the handler to validate/load the param |

### Instance properties

| Property | Description |
|---|---|
| `this.params` | URL parameters object, e.g. `{ id: '42' }` |
| `this.url` | `URL` instance of the current request |
| `this.body` | Parsed JSON body (requires `bodyParser: true`) |
| `this.req` | Raw `IncomingMessage` |
| `this.res` | Raw `ServerResponse` |
| `this.app` | `BifrostApp` instance |

### Response helpers

```js
// Plain text
this.send(200, 'Hello', 'text/plain');

// JSON
this.json({ ok: true });
this.json({ error: 'Not found' }, 404);

// HTML string
this.html('<h1>Hello</h1>');
this.html('<h1>Error</h1>', 500);

// Render a Galdr template
await this.render('dashboard', { user });
await this.render('error', { message: '...' }, 422);

// Redirect
this.redirect('/login');
this.redirect('/new-location', 301);

// Pass to next middleware
this.next();
```

### prepare() lifecycle

`prepare()` is called automatically before the method handler. Use it for authentication checks, loading shared data, or redirecting:

```js
export default class DashboardController extends BBController {
    static path    = '/dashboard';
    static methods = ['get'];

    async prepare() {
        if (!this.req.session?.userId) {
            this.redirect('/login');
            return false;  // returning false stops dispatch
        }
        return true;  // continue to get()
    }

    async get() {
        await this.render('dashboard');
    }
}
```

Returning `false` from `prepare()` (or sending a response there) stops the method handler from being called.

### URL parameters (paramCb)

For shared parameter loading (e.g. load a database record by `:id` before the handler runs):

```js
export default class PostController extends BBController {
    static path      = '/post/:slug';
    static methods   = ['get', 'post'];
    static paramName = 'slug';
    static paramCb   = async ($value, $req) => {
        $req.post = await db.findPostBySlug($value);
        if (!$req.post) throw new Error('Post not found');
    };

    async get() {
        await this.render('post', { post: this.req.post });
    }
}
```

`paramCb` receives `(paramValue, req)` and runs before `prepare()`.

---

## Auto-loading with Router

```js
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const __dir = fileURLToPath(new URL('.', import.meta.url));

// Load all BBController subclasses from a directory
await app.loadControllers(join(__dir, 'controllers'));

// Load all functional route files from a directory
await app.loadRoutes(join(__dir, 'routes'));
```

`Router.loadControllers` scans for `.js` files, imports each one, and only registers classes that extend `BBController`. Files that export something else are skipped with a warning.

---

## URL parameters

URL parameters use `:name` syntax and are available via `req.params` or `this.params` in a controller:

```js
bifrost.get('/user/:id/post/:postId', (req, res) => {
    const { id, postId } = req.params;
    // ...
});
```

Query string parameters are accessible via `this.url.searchParams` (in a `BBController`):

```js
const page = this.url.searchParams.get('page') ?? '1';
```

---

## Request body

Enable `bodyParser: true` in `startup()` to parse `POST`/`PUT`/`PATCH` JSON bodies:

```js
await app.startup({ bodyParser: true });
```

The parsed object is available on `req.body` (functional routes) or `this.body` (BBController). Non-JSON bodies result in `{}`.
