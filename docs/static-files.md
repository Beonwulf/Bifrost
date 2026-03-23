# Static Files

> Serve CSS, JavaScript, images, and other assets from a directory.

---

## Setup

```js
await app.startup({
    static: 'public',   // relative to process.cwd()
});
```

All files inside `./public/` are served at the root URL path:

```
public/
├── index.html        → GET /
├── app.js            → GET /app.js
├── styles/
│   └── main.css      → GET /styles/main.css
└── images/
    └── logo.png      → GET /images/logo.png
```

> `/` is automatically resolved to `/index.html`.

---

## Supported MIME types

| Extension | MIME type |
|---|---|
| `.html` | `text/html` |
| `.js`, `.mjs` | `text/javascript` |
| `.css` | `text/css` |
| `.json` | `application/json` |
| `.png` | `image/png` |
| `.jpg` | `image/jpg` |
| `.gif` | `image/gif` |
| `.svg` | `image/svg+xml` |
| `.ico` | `image/x-icon` |
| `.wasm` | `application/wasm` |
| `.glb` | `model/gltf-binary` |
| `.gltf` | `model/gltf+json` |
| `.wav` | `audio/wav` |
| `.mp3` | `audio/mpeg` |
| `.mp4` | `video/mp4` |
| `.woff` | `application/font-woff` |
| `.ttf` | `application/font-ttf` |
| `.eot` | `application/vnd.ms-fontobject` |
| `.otf` | `application/font-otf` |
| `.pdf` | `application/pdf` |
| `.zip` | `application/zip` |
| `.gz` | `application/gzip` |
| `.tar` | `application/x-tar` |

Unknown extensions are served as `application/octet-stream`.

---

## Gzip compression

```js
await app.startup({
    static:      'public',
    compression: true,
});
```

When enabled, responses are compressed with gzip for clients that send `Accept-Encoding: gzip`. The `Content-Encoding: gzip` header is set automatically.

---

## SharedArrayBuffer headers

The static file Rune sets these headers on every file response:

```
Cross-Origin-Opener-Policy:   same-origin
Cross-Origin-Embedder-Policy: require-corp
```

These are required for `SharedArrayBuffer` and are suitable for WebAssembly use cases (e.g. `.glb`, `.wasm`).

---

## Behaviour

- **File not found**: The static Rune calls `next()` — the request continues to your route handlers or 404.
- **Socket.io bypass**: Requests to `/socket.io/*` are automatically skipped by the static Rune.
- **Directory traversal**: The file path is resolved using `process.cwd() + dir + URL`. The Rune does not perform an explicit jail check — avoid passing user-controlled strings as the `static` directory path.
