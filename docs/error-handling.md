# Error Handling

> Bifröst provides built-in 404 and 500 pages. Replace them with your own handlers.

---

## Contents

- [Default behaviour](#default-behaviour)
- [Custom 404 handler](#custom-404-handler)
- [Custom 500 handler](#custom-500-handler)
- [Error handler in BBController](#error-handler-in-bbcontroller)
- [Rendering error pages with Galdr](#rendering-error-pages-with-galdr)

---

## Default behaviour

Without any configuration, Bifröst responds with its built-in error pages:

- **404** — Renders `src/template/views/404.galdr.html` with the requested URL.
- **500** — Renders `src/template/views/500.galdr.html` and logs the error to `console.error`.

These pages work without any template engine configuration.

---

## Custom 404 handler

```js
app.setErrorHandler(404, ($req, $res) => {
    $res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    $res.end('<h1>Page not found</h1>');
});
```

With Galdr:

```js
import { Galdr } from 'bifrost';

app.setErrorHandler(404, async ($req, $res) => {
    const html = await Galdr.render('errors/404', { url: $req.url });
    $res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    $res.end(html);
});
```

---

## Custom 500 handler

The 500 handler receives an additional `$err` argument:

```js
app.setErrorHandler(500, async ($req, $res, $err) => {
    console.error('Internal error:', $err);
    const html = await Galdr.render('errors/500', {});
    $res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    $res.end(html);
});
```

> The 500 handler is invoked when a route handler or Rune throws an unhandled exception.

---

## Error handler in BBController

Throw from a BBController method — the 500 handler catches it automatically:

```js
export default class DataController extends BBController {
    static path    = '/api/data';
    static methods = ['get'];

    async get() {
        const result = await loadSomething();  // may throw
        this.json(result);
    }
}
```

For expected errors (e.g. validation, auth), respond explicitly and do not throw:

```js
async post() {
    if (!this.body?.name) {
        this.json({ error: 'name is required' }, 422);
        return;
    }
    // ...
}
```

---

## Rendering error pages with Galdr

You can create custom error views anywhere in your `views/` directory:

```
views/
└── errors/
    ├── 404.galdr.html
    └── 500.galdr.html
```

```html
<!-- views/errors/404.galdr.html -->
{% layout "minimal" %}
    <h1>404 — Page not found</h1>
    <p>No route matched: <code>{{ $url }}</code></p>
    <a href="/">Back to home</a>
{% endlayout %}
```

```js
app.setErrorHandler(404, async ($req, $res) => {
    const html = await Galdr.render('errors/404', { url: $req.url });
    $res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    $res.end(html);
});
```
