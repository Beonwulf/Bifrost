# Galdr — Template Engine

> Built-in template engine for Bifröst. No external dependencies.

---

## Contents

- [Configuration](#configuration)
- [Rendering](#rendering)
- [Syntax Reference](#syntax-reference)
  - [Outputting Variables](#outputting-variables)
  - [Partials](#partials)
  - [if / unless](#if--unless)
  - [each](#each)
  - [with](#with)
  - [layout](#layout)
- [Creating Layouts & Partials](#creating-layouts--partials)
- [Cache](#cache)
- [Security](#security)

---

## Configuration

```js
import { BifrostApp } from 'bifrost';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const __dir = fileURLToPath(new URL('.', import.meta.url));

BifrostApp.configureViews({
    views:    join(__dir, 'views'),           // Required
    layouts:  join(__dir, 'views/layouts'),   // Optional, fallback: views
    partials: join(__dir, 'views/partials'),  // Optional, fallback: views
    cache:    true,                           // Default: true
});
```

Multiple directories — first match wins:

```js
import { Galdr } from 'bifrost';

Galdr.addViews('/my/override/views');       // highest priority
Galdr.addLayouts('/my/override/layouts');
Galdr.addPartials('/my/override/partials');
```

---

## Rendering

```js
import { Galdr } from 'bifrost';

// From file (views/dashboard.galdr.html)
const html = await Galdr.render('dashboard', { user, title: 'Dashboard' });

// From string
const html = await Galdr.renderString('<h1>{{ $title }}</h1>', { title: 'Hello' });

// Built-in (404 / 500) — no views directory required
const html = await Galdr.renderBuiltin('404', { url: '/not/found' });
```

Directly inside a `BBController`:

```js
async get() {
    await this.render('dashboard', { user: this.req.user });
}
```

---

## Syntax Reference

Template files use the `.galdr.html` extension.

### Outputting Variables

```html
<!-- HTML-escaped (safe) -->
{{ $variable }}
{{ $user.name }}
{{ $nested.deep.value }}

<!-- Unescaped / Raw — only for trusted content -->
{{{ $htmlContent }}}
```

The leading `$` is optional — `{{ name }}` works as well.

---

### Partials

```html
{% partial head %}
{% partial flash %}
{% partial components/card %}
```

Partials are resolved from the configured `partials` directories.  
Partials may themselves include other partials.

---

### if / unless

```html
{% if $user.isAdmin %}
    <a href="/admin">Administration</a>
{% endif %}

{% if $count %}
    {{ $count }} entries
{% else %}
    No entries found.
{% endif %}

{% unless $user.verified %}
    <div class="alert">Please verify your email address.</div>
{% endunless %}
```

Supported expressions inside `if`/`unless`:

```html
{% if $user.age >= 18 %}
{% if $status === 'active' %}
{% if $a && $b %}
{% if !$hidden %}
```

---

### each

**Array:**

```html
{% each $items %}
    <li>{{ this }}</li>
{% endeach %}
```

**Array of objects:**

```html
{% each $users %}
    <tr>
        <td>{{ @index }}</td>
        <td>{{ name }}</td>
        <td>{{ email }}</td>
    </tr>
{% endeach %}
```

**Meta variables:**

| Variable | Description |
|---|---|
| `this` | The current element |
| `@index` | Numeric index (0-based) |
| `@key` | Key (array: index as string, object: property name) |
| `@first` | `true` for the first element |
| `@last` | `true` for the last element |

**Object iteration:**

```html
{% each $config %}
    <dt>{{ @key }}</dt>
    <dd>{{ this }}</dd>
{% endeach %}
```

**Outer variables remain accessible:**

```html
{% each $posts %}
    <!-- $currentUser comes from the outer context -->
    {% if $currentUser.isAdmin %}
        <button>Delete</button>
    {% endif %}
    <h2>{{ title }}</h2>
{% endeach %}
```

---

### with

Switches the context to a nested object:

```html
{% with $user %}
    <p>{{ name }} — {{ email }}</p>
    {% if verified %}
        <span class="badge">Verified</span>
    {% endif %}
{% endwith %}
```

---

### layout

Wraps the template in a layout. The layout must contain `{% yield %}` as a slot.

```html
{% layout "base" %}
    <h1>{{ $title }}</h1>
    <p>Welcome, {{ $user.name }}.</p>
{% endlayout %}
```

Using the `minimal` layout:

```html
{% layout "minimal" %}
    <form method="post" action="/login">
        <input type="text" name="username" placeholder="Username">
        <input type="password" name="password" placeholder="Password">
        <button type="submit" class="btn-primary">Sign in</button>
    </form>
{% endlayout %}
```

---

## Creating Layouts & Partials

### Layout file

A layout file uses `{% yield %}` as the slot for the page content:

```html
<!-- views/layouts/base.galdr.html -->
<!DOCTYPE html>
<html lang="{{ $lang }}">
<head>
    {% partial head %}
</head>
<body>
    <main>
        {% partial flash %}
        {% yield %}
    </main>
</body>
</html>
```

### Flash messages

The built-in `flash` partial expects:

```js
await this.render('page', {
    flash: {
        type:    'success', // 'success' | 'error' | 'info'
        message: 'Saved successfully.',
    }
});
```

---

## Cache

In production, the cache is active by default. Templates are held in memory after the first load.

```js
// Disable cache (e.g. development mode)
BifrostApp.configureViews({ cache: false });

// Clear cache manually
import { Galdr } from 'bifrost';
Galdr.clearCache();
```

---

## Security

- **Path traversal**: Template names containing `..` or absolute paths are rejected.
- **Template expressions** (`if`/`unless`): Validated against a whitelist regex. Unsafe expressions fall back to simple path resolution.
- **HTML escaping**: `{{ $var }}` automatically escapes `& < > " '`. Only `{{{ $var }}}` outputs raw HTML — use exclusively for trusted content.
