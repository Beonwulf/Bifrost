# Middleware (Runes)

> Bifröst calls middleware functions "Runes". They execute in registration order before routes.

---

## Contents

- [How Runes work](#how-runes-work)
- [Built-in Runes](#built-in-runes)
  - [responseHelpers](#responsehelpers)
  - [bodyParser](#bodyparser)
  - [static](#static)
- [Custom Runes](#custom-runes)
- [Registration order](#registration-order)
- [Stopping execution](#stopping-execution)

---

## How Runes work

A Rune is an `async` function with the signature `(req, res, next)`:

```js
async function ($req, $res, $next) {
    // do something before the route
    await $next();  // pass control to the next Rune or route handler
    // do something after (optional)
}
```

Runes are registered on the `bifrost` instance via `use()`:

```js
bifrost.use(myRune);
```

`BifrostApp.startup()` registers the built-in Runes automatically based on the config. If you use the low-level `Bifrost` class directly, you register them yourself.

---

## Built-in Runes

### responseHelpers

Adds convenience methods to the `ServerResponse` object.

```js
await app.startup({ responseHelpers: true }); // default: true
```

Adds:

```js
// Send a JSON response
res.json(data, status = 200)

// Send a JSON error response
res.error(message, status = 400)
// → { "error": "message" }
```

### bodyParser

Collects the request body and parses it as JSON.

```js
await app.startup({ bodyParser: true }); // default: false
```

After this Rune runs, `req.body` contains the parsed object. Malformed JSON results in `{}`.

Only active for `POST`, `PUT`, and `PATCH` requests.

### static

Serves files from a directory. Must be a path relative to `process.cwd()`.

```js
await app.startup({ static: 'public' }); // default: null (disabled)
```

- `/socket.io/*` requests are automatically bypassed.
- If the requested file is not found, the Rune calls `next()` to continue to the route handlers.
- Supports optional gzip compression (see [static-files.md](static-files.md)).

---

## Custom Runes

### Simple logging Rune

```js
const logRune = async ($req, $res, $next) => {
    const start = Date.now();
    await $next();
    console.log(`${$req.method} ${$req.url} — ${Date.now() - start}ms`);
};

bifrost.use(logRune);
```

### Authentication Rune

```js
const authRune = async ($req, $res, $next) => {
    const token = $req.headers['authorization']?.replace('Bearer ', '');
    if (!token || !isValidToken(token)) {
        $res.writeHead(401, { 'Content-Type': 'application/json' });
        $res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;  // stop — do NOT call next()
    }
    $req.user = decodeToken(token);
    await $next();
};

bifrost.use(authRune);
```

### Using Bifrost factory methods directly

The built-in Runes can also be instantiated and registered manually on a `Bifrost` instance:

```js
import { Bifrost } from 'bifrost';

const server = new Bifrost({ port: 3000 });

server.use(Bifrost.createResponseHelperRune());
server.use(Bifrost.createBodyParserRune());
server.use(Bifrost.createStaticRune('public'));
```

---

## Registration order

Runes execute in the order they are registered. `BifrostApp.startup()` always registers them in this order:

1. `responseHelpers` (if enabled)
2. `bodyParser` (if enabled)
3. `static` (if enabled)
4. *(your custom Runes, if you call `bifrost.use()` after startup)*

To add custom Runes before the built-ins, use the low-level `Bifrost` class directly instead of `BifrostApp`.

---

## Stopping execution

Not calling `next()` terminates the Rune chain. Nothing after that Rune will execute — no further Runes and no route handler:

```js
const maintenanceRune = async ($req, $res, $next) => {
    if (process.env.MAINTENANCE === 'true') {
        $res.writeHead(503);
        $res.end('Under maintenance.');
        return;  // chain stops here
    }
    await $next();
};
```
