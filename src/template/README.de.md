# Galdr — Template Engine

> Eigenständige Template Engine von Bifröst. Keine externen Abhängigkeiten.

---

## Inhalt

- [Konfiguration](#konfiguration)
- [Rendern](#rendern)
- [Syntax-Referenz](#syntax-referenz)
  - [Variablen ausgeben](#variablen-ausgeben)
  - [Partials](#partials)
  - [if / unless](#if--unless)
  - [each](#each)
  - [with](#with)
  - [layout](#layout)
  - [include with](#include-with)
  - [set](#set)
  - [Kommentare](#kommentare)
  - [Filter / Pipes](#filter--pipes)
  - [Komponenten](#komponenten)
- [Layouts & Partials erstellen](#layouts--partials-erstellen)
- [Cache](#cache)
- [Sicherheit](#sicherheit)

---

## Konfiguration

```js
import { BifrostApp } from 'bifrost';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const __dir = fileURLToPath(new URL('.', import.meta.url));

BifrostApp.configureViews({
    views:    join(__dir, 'views'),           // Pflicht
    layouts:  join(__dir, 'views/layouts'),   // Optional, Fallback: views
    partials: join(__dir, 'views/partials'),  // Optional, Fallback: views
    cache:    true,                           // Default: true
});
```

Mehrere Verzeichnisse — erster Treffer gewinnt:

```js
import { Galdr } from 'bifrost';

Galdr.addViews('/mein/override/views');       // höchste Priorität
Galdr.addLayouts('/mein/override/layouts');
Galdr.addPartials('/mein/override/partials');
```

---

## Rendern

```js
import { Galdr } from 'bifrost';

// Aus Datei (views/dashboard.galdr.html)
const html = await Galdr.render('dashboard', { user, title: 'Dashboard' });

// Aus String
const html = await Galdr.renderString('<h1>{{ $title }}</h1>', { title: 'Hallo' });

// Eingebaut (404 / 500) — kein views-Verzeichnis nötig
const html = await Galdr.renderBuiltin('404', { url: '/nicht/vorhanden' });
```

Im `BBController` direkt:

```js
async get() {
    await this.render('dashboard', { user: this.req.user });
}
```

---

## Syntax-Referenz

Template-Dateien haben die Endung `.galdr.html`.

### Variablen ausgeben

```html
<!-- HTML-escaped (sicher) -->
{{ $variable }}
{{ $user.name }}
{{ $nested.deep.value }}

<!-- Unescaped / Raw — nur für vertrauenswürdige Inhalte -->
{{{ $htmlContent }}}
```

Das führende `$` ist optional — `{{ name }}` funktioniert ebenfalls.

---

### Partials

```html
{% partial head %}
{% partial flash %}
{% partial components/card %}
```

Partials werden aus den konfigurierten `partials`-Verzeichnissen geladen.  
Partials können selbst weitere Partials enthalten.

---

### if / unless

```html
{% if $user.isAdmin %}
    <a href="/admin">Administration</a>
{% endif %}

{% if $count %}
    {{ $count }} Einträge
{% else %}
    Keine Einträge vorhanden.
{% endif %}

{% unless $user.verified %}
    <div class="alert">Bitte E-Mail bestätigen.</div>
{% endunless %}
```

Unterstützte Ausdrücke in `if`/`unless`:

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

**Array mit Objekt-Elementen:**

```html
{% each $users %}
    <tr>
        <td>{{ @index }}</td>
        <td>{{ name }}</td>
        <td>{{ email }}</td>
    </tr>
{% endeach %}
```

**Meta-Variablen:**

| Variable | Beschreibung |
|---|---|
| `this` | Das aktuelle Element |
| `@index` | Numerischer Index (0-basiert) |
| `@key` | Schlüssel (Array: Index als String, Objekt: Eigenschaftsname) |
| `@first` | `true` beim ersten Element |
| `@last` | `true` beim letzten Element |

**Objekt-Iteration:**

```html
{% each $config %}
    <dt>{{ @key }}</dt>
    <dd>{{ this }}</dd>
{% endeach %}
```

**Äußere Variablen bleiben zugänglich:**

```html
{% each $posts %}
    <!-- $currentUser stammt aus dem äußeren Kontext -->
    {% if $currentUser.isAdmin %}
        <button>Löschen</button>
    {% endif %}
    <h2>{{ title }}</h2>
{% endeach %}
```

---

### with

Wechselt den Kontext auf ein Unter-Objekt:

```html
{% with $user %}
    <p>{{ name }} — {{ email }}</p>
    {% if verified %}
        <span class="badge">Verifiziert</span>
    {% endif %}
{% endwith %}
```

---

### layout

Bindet das Template in ein Layout ein. Das Layout muss `{% yield %}` als Slot enthalten.

```html
{% layout "base" %}
    <h1>{{ $title }}</h1>
    <p>Willkommen, {{ $user.name }}.</p>
{% endlayout %}
```

Mit dem `minimal`-Layout:

```html
{% layout "minimal" %}
    <form method="post" action="/login">
        <input type="text" name="username" placeholder="Benutzername">
        <input type="password" name="password" placeholder="Passwort">
        <button type="submit" class="btn-primary">Anmelden</button>
    </form>
{% endlayout %}
```

---

### include with

Bindet ein Partial mit optionalem eigenem Kontext ein:

```html
<!-- Kontext-Variable übergeben -->
{% include "nav" with $myNav %}

<!-- Inline-Objekt (Schlüssel aus äußerem Kontext sind zugänglich) -->
{% include "nav" with { items: _nav.main, class: 'nav--dark' } %}

<!-- Name aus Variable auflösen -->
{% include partialName %}
```

Das eingebundene Template hat immer Zugriff auf den äußeren Kontext. Der `with`-Ausdruck fügt zusätzliche Schlüssel hinzu.

---

### set

Definiert eine Variable im aktuellen Scope:

```html
{% set $label = 'Hallo' %}
{% set $count = 42 %}
{% set $active = true %}
{% set $title = $page.title %}

{{ $label }}  <!-- Hallo -->
```

Unterstützte Werttypen: Strings (`'…'` / `"…"`), Zahlen, Booleans, `null` und Kontext-Pfade.

---

### Kommentare

```html
{# Wird nicht gerendert #}
{# TODO: Pagination #}
{{ $wert }} {# Inline-Kommentar #}
```

Kommentare werden vor dem Rendern vollständig entfernt — kein HTML-Output.

---

### Filter / Pipes

Filter transformieren einen Wert mit `|`:

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
{{ $value | default:'k.A.' }}
{{ $obj | json }}
```

Filter sind verkettbar:

```html
{{ $title | trim | upper }}
{{ $price | currency:',' | default:'—' }}
```

| Filter | Beschreibung |
|---|---|
| `upper` | Großbuchstaben |
| `lower` | Kleinbuchstaben |
| `trim` | Führende/nachgestellte Leerzeichen entfernen |
| `truncate:N` | Auf N Zeichen kürzen |
| `truncate:N:'…'` | Kürzen mit eigenem Suffix |
| `nl2br` | Zeilenumbrüche → `<br>` |
| `currency` | Zahl als Dezimalzahl (2 Stellen, `.`) |
| `currency:','` | Wie currency, eigenes Dezimalzeichen |
| `number:N` | N Dezimalstellen |
| `default:'x'` | Fallback bei null / undefined / leer |
| `json` | `JSON.stringify` (kein HTML-Escaping) |

---

### Komponenten

Galdr unterstützt zwei Komponenten-Syntaxen.

#### Custom Tags — `<x-name>`

Einfache Leaf-Komponenten mit optionalem Slot-Inhalt:

```html
<!-- Selbst-schließend -->
<x-spinner size="sm" ariaLabel="Lädt…" />

<!-- Mit Slot-Inhalt -->
<x-alert type="success">Gespeichert.</x-alert>
<x-badge type="primary">NEU</x-badge>
<x-card head="Titel"><p>Body-Text.</p></x-card>
```

Attribute werden als Template-Variablen in der Komponenten-Datei verfügbar. Der Tag-Inhalt steht als `{{{ slot }}}` (unescaped) bereit.

#### Strukturierte Komponenten — `{% component %}`

Für Layouts mit Named Slots:

```html
{% component "card" %}
    {% slot head %}Karten-Titel{% endslot %}
    {% slot body %}
        {% each $items %}<p>{{ name }}</p>{% endeach %}
    {% endslot %}
    {% slot foot %}
        <button class="btn btn-primary">Speichern</button>
    {% endslot %}
{% endcomponent %}
```

Innerhalb der Komponenten-Datei stehen Named Slots als `{{{ _slots.head }}}`, `{{{ _slots.body }}}`, `{{{ _slots.foot }}}` bereit. Mit `{% if _slots.foot %}` lässt sich prüfen, ob ein Slot befüllt wurde.

#### Eigene Komponente erstellen

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

Komponenten-Dateien liegen in `views/partials/` — dasselbe Verzeichnis wie reguläre Partials. Eingebaute Komponenten (`alert`, `badge`, `spinner`, `card`) sind ohne Konfiguration verfügbar.

---

## Layouts & Partials erstellen

### Layout-Datei

Eine Layout-Datei nutzt `{% yield %}` als Slot für den Seiten-Inhalt:

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

### Flash-Messages

Das eingebaute `flash`-Partial erwartet:

```js
await this.render('seite', {
    flash: {
        type:    'success', // 'success' | 'error' | 'info'
        message: 'Gespeichert.',
    }
});
```

---

## Cache

Im Produktionsbetrieb ist der Cache standardmäßig aktiv. Templates werden nach dem ersten Laden im Speicher gehalten.

```js
// Cache deaktivieren (z.B. Entwicklungsmodus)
BifrostApp.configureViews({ cache: false });

// Cache manuell leeren
import { Galdr } from 'bifrost';
Galdr.clearCache();
```

---

## Sicherheit

- **Path-Traversal**: Template-Namen mit `..` oder absoluten Pfaden werden abgelehnt.
- **Template-Ausdrücke** (`if`/`unless`): Werden gegen eine Whitelist-Regex validiert. Unsichere Ausdrücke fallen auf einfache Pfad-Auflösung zurück.
- **HTML-Escaping**: `{{ $var }}` escapt automatisch `& < > " '`. Nur `{{{ $var }}}` gibt roh aus — ausschließlich für vertrauenswürdige Inhalte verwenden.
