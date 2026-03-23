# HTTPS

> Bifröst supports HTTPS with automatic self-signed certificates or your own.

---

## Contents

- [Auto-generated certificate (development)](#auto-generated-certificate-development)
- [Custom certificate (production)](#custom-certificate-production)
- [Certificate storage](#certificate-storage)
- [Forcing HTTPS in production](#forcing-https-in-production)

---

## Auto-generated certificate (development)

Pass `ssl: true` without a `sslCert` and Bifröst generates a self-signed certificate automatically using the `selfsigned` package:

```js
await app.startup({
    port: 3443,
    ssl:  true,
});
// 🌈 Bifröst erstrahlt auf HTTPS://0.0.0.0:3443
```

The certificate is valid for **365 days** and is stored on disk so it is reused on the next start.

> Browsers will show a security warning for self-signed certificates. This is expected in development.

---

## Custom certificate (production)

Provide your own certificate as PEM-encoded strings:

```js
import { readFile } from 'node:fs/promises';

const key  = await readFile('/etc/ssl/private/my-domain.key',  'utf-8');
const cert = await readFile('/etc/ssl/certs/my-domain.crt',    'utf-8');

await app.startup({
    port:    443,
    ssl:     true,
    sslCert: { key, cert },
});
```

Or using the static setter before `startup()`:

```js
BifrostApp.enableSSL(key, cert);
await app.startup({ port: 443 });
```

---

## Certificate storage

Auto-generated certificates are stored in:

```
<project-root>/
└── data/
    └── bifrost/
        ├── key.pem
        └── cert.pem
```

If both files exist on disk, they are loaded without regenerating. To force a new certificate, delete the two files.

Add `data/bifrost/` to your `.gitignore`:

```gitignore
data/bifrost/
```

---

## Forcing HTTPS in production

An HTTPS redirect Rune to add in production environments:

```js
const httpsRedirectRune = async ($req, $res, $next) => {
    if ($req.headers['x-forwarded-proto'] === 'http') {
        const host = $req.headers.host;
        $res.writeHead(301, { Location: `https://${host}${$req.url}` });
        $res.end();
        return;
    }
    await $next();
};

bifrost.use(httpsRedirectRune);
```

Use `x-forwarded-proto` when running behind a reverse proxy (nginx, Caddy, etc.). If Bifröst is directly internet-facing, check `req.socket.encrypted` instead.
