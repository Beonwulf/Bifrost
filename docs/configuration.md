# Configuration

> All options for `BifrostApp.cfg` and `startup()`.

---

## Static defaults

`BifrostApp.cfg` holds the default values. These can be changed before calling `startup()`:

```js
import { BifrostApp } from 'bifrost';

BifrostApp.setPort(8080);
BifrostApp.setHost('127.0.0.1');
BifrostApp.setStatic('public');
BifrostApp.enableBodyParser();
BifrostApp.enableSSL();
```

| Property | Default | Description |
|---|---|---|
| `port` | `process.env.PORT \| 3000` | TCP port to listen on |
| `host` | `'0.0.0.0'` | Bind address |
| `ssl` | `false` | Enable HTTPS |
| `sslCert` | `null` | Custom certificate `{ key, cert }` (see [https.md](https.md)) |
| `socket` | `false` | Enable Socket.io |
| `static` | `null` | Relative path to static files directory |
| `bodyParser` | `false` | Parse `POST`/`PUT`/`PATCH` bodies as JSON |
| `compression` | `false` | Enable gzip compression for static files |
| `responseHelpers` | `true` | Add `res.json()` and `res.error()` to every response |

---

## startup() options

`startup()` accepts an options object that overrides `BifrostApp.cfg` for that run:

```js
const { app, bifrost, io } = await app.startup({
    port:            3000,
    host:            '0.0.0.0',
    ssl:             false,
    sslCert:         null,
    socket:          false,
    static:          'public',
    bodyParser:      true,
    compression:     false,
    responseHelpers: true,
});
```

### Return value

`startup()` returns an object with the following properties:

| Property | Type | Description |
|---|---|---|
| `app` | `BifrostApp` | The `BifrostApp` instance itself |
| `bifrost` | `Bifrost` | The underlying server instance |
| `io` | `Server \| null` | Socket.io server (only if `socket: true`) |
| `router` | `Router` | The `Router` class (static) |

After `startup()`, call `app.run()` to actually start listening:

```js
await app.startup({ port: 3000 });
await app.run();
```

---

## Static setter methods

```js
BifrostApp.setPort(8080)             // port
BifrostApp.setHost('127.0.0.1')     // bind address

BifrostApp.setStatic('public')       // static file directory

BifrostApp.enableSocket()            // enable Socket.io
BifrostApp.disableSocket()

BifrostApp.enableBodyParser()        // parse JSON bodies
BifrostApp.disableBodyParser()

BifrostApp.enableCompression()       // gzip static files
BifrostApp.disableCompression()

BifrostApp.enableResponseHelpers()   // res.json() / res.error()
BifrostApp.disableResponseHelpers()

BifrostApp.enableSSL()               // self-signed auto cert
BifrostApp.enableSSL(key, cert)      // custom cert (PEM strings)
BifrostApp.disableSSL()
```

---

## Template engine

Configured separately via `BifrostApp.configureViews()` — see [../src/template/README.md](../src/template/README.md) for the full reference.

```js
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const __dir = fileURLToPath(new URL('.', import.meta.url));

BifrostApp.configureViews({
    views:    join(__dir, 'views'),
    layouts:  join(__dir, 'views/layouts'),   // optional
    partials: join(__dir, 'views/partials'),  // optional
    cache:    true,                           // default: true
});
```

---

## Service registry

Register shared services (database connections, external clients, etc.) so controllers can access them:

```js
import { createClient } from 'some-db-driver';

const db = await createClient(process.env.DB_URL);
app.register('db', db);

// In a BBController:
const db = this.app.service('db');
```

---

## Environment variables

| Variable | Usage |
|---|---|
| `PORT` | Default port when `BifrostApp.cfg.port` is not explicitly set |

Bifröst does not read any other environment variables — all other config is passed explicitly.
