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
  - [include with](#include-with)
  - [set](#set)
  - [Comments](#comments)
  - [Filters / Pipes](#filters--pipes)
  - [Components](#components)
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

### include with

Includes a partial with an optional dedicated context:

```html
<!-- Pass a context variable -->
{% include "nav" with $myNav %}

<!-- Pass an inline object (keys from the outer context are accessible) -->
{% include "nav" with { items: _nav.main, class: 'nav--dark' } %}

<!-- Resolve name from a variable -->
{% include partialName %}
```

The included template always has full access to the outer context. The `with` expression merges additional keys on top of it.

---

### set

Defines a variable in the current scope:

```html
{% set $label = 'Hello' %}
{% set $count = 42 %}
{% set $active = true %}
{% set $title = $page.title %}

{{ $label }}  <!-- Hello -->
```

Supported value types: strings (`'…'` / `"…"`), numbers, booleans, `null`, and context paths.

---

### Comments

```html
{# This comment is not rendered #}
{# TODO: add pagination #}
{{ $value }} {# inline comment #}
```

Comments are removed before rendering — no HTML output.

---

### Filters / Pipes

Filters transform a value with `|`:

```html
{{ $name | upper }}
{{ $title | lower }}
{{ $text | trim }}
{{ $text | truncate:100 }}
{{ $text | truncate:100:'…' }}
{{ $bio | nl2br }}
{{ $price | currency }}
{{ $price | currency:',' }}
{{ $ratio | number:2 }}
{{ $value | default:'n/a' }}
{{ $obj | json }}
```

Filters can be chained:

```html
{{ $title | trim | upper }}
{{ $price | currency:',' | default:'—' }}
```

| Filter | Description |
|---|---|
| `upper` | Uppercase |
| `lower` | Lowercase |
| `trim` | Strip leading/trailing whitespace |
| `truncate:N` | Shorten to N characters |
| `truncate:N:'…'` | Shorten with custom suffix |
| `nl2br` | Convert newlines to `<br>` |
| `currency` | Format as decimal number (2 places, `.`) |
| `currency:','` | Same, custom decimal separator |
| `number:N` | N decimal places |
| `default:'x'` | Fallback if null / undefined / empty |
| `json` | `JSON.stringify` (no HTML-escaping) |

---

### Components

Galdr supports two component syntaxes.

#### Custom Tags — `<x-name>`

Simple leaf components with optional slot content:

```html
<!-- Self-closing -->
<x-spinner size="sm" ariaLabel="Loading…" />

<!-- With slot content -->
<x-alert type="success">Saved successfully.</x-alert>
<x-badge type="primary">NEW</x-badge>
<x-card head="Title"><p>Body text.</p></x-card>
```

Attributes become template variables inside the component file. The tag content is available as `{{{ slot }}}` (unescaped).

#### Structural Components — `{% component %}`

For layouts with named slots:

```html
{% component "card" %}
    {% slot head %}Card Title{% endslot %}
    {% slot body %}
        {% each $items %}<p>{{ name }}</p>{% endeach %}
    {% endslot %}
    {% slot foot %}
        <button class="btn btn-primary">Save</button>
    {% endslot %}
{% endcomponent %}
```

Inside the component template, named slots are available as `{{{ _slots.head }}}`, `{{{ _slots.body }}}`, `{{{ _slots.foot }}}`. Use `{% if _slots.foot %}` to check whether a slot was provided.

#### Creating a component

```html
<!-- views/partials/my-card.galdr.html -->
<div class="card{% if class %} {{ class }}{% endif %}">
    {% if _slots.head %}
    <div class="card-header">{{{ _slots.head }}}</div>
    {% elseif head %}
    <div class="card-header">{{ head }}</div>
    {% endif %}
    <div class="card-body">{{{ slot }}}{{{ _slots.body }}}</div>
    {% if _slots.foot %}
    <div class="card-footer">{{{ _slots.foot }}}</div>
    {% endif %}
</div>
```

Component files live in `views/partials/` — the same directory as regular partials. Built-in components (`alert`, `badge`, `spinner`, `card`) are always available without configuration.

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
