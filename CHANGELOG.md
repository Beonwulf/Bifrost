# Changelog

Alle bemerkenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt dem [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.21.0] - 2026-04-07

### Hinzugefügt (Added)
- **Server-Sent Events (SSE)**: Native Helfer in `res.sseInit()` und `res.sseSend()` (bzw. `this.sseInit()` und `this.sseSend()` im `BBController`), um leichtgewichtige unidirektionale Echtzeit-Streams ohne Socket.io zu realisieren.

## [0.20.0] - 2026-04-07

### Hinzugefügt (Added)
- **CacheService**: Ein globaler In-Memory Caching-Service (`CacheService.remember()`) zur einfachen Zwischenspeicherung von aufwendigen Datenbankabfragen oder externen API-Calls.

## [0.19.0] - 2026-04-07

### Hinzugefügt (Added)
- **API Testing Utilities**: Neue Methode `app.inject()` für extrem schnelle API-Tests im Arbeitsspeicher, ohne einen echten Port binden oder Netzwerk-Traffic generieren zu müssen.

## [0.18.0] - 2026-04-07

### Hinzugefügt (Added)
- **Live-Reload (Hot-Reload)**: Neue Rune `createLiveReloadRune`, die im Development-Modus (`NODE_ENV !== 'production'`) automatisch die HTML-Seite neu lädt, sobald der Node.js Server (z. B. durch `node --watch`) neustartet. Aktivierbar via `app.startup({ liveReload: true })`.

## [0.17.0] - 2026-04-07

### Hinzugefügt (Added)
- **CLI Code-Generatoren**: Neue CLI-Befehle `npx bifrost make:controller <Name>`, `npx bifrost make:form <Name>` und `npx bifrost make:view <Name>` zum schnellen Erstellen von Boilerplate-Code.
- **MVC-Ordnerstruktur**: Der Starter-Code (`npx bifrost init`) und die Generatoren verwenden nun standardmäßig eine aufgeräumte `mvc/`-Ordnerstruktur (`mvc/controllers`, `mvc/views`, `mvc/forms`).

## [0.16.0] - 2026-04-07

### Hinzugefügt (Added)
- **Formular-Verarbeitung (BBForm)**: Neue Basisklasse `BBForm` für strukturierte Formulare, Validierung (inkl. Custom Callbacks) und automatisches Galdr-Rendering.
- **CSRF-Schutz**: Native CSRF-Rune (`app.startup({ csrf: { ignore: ['/api/'] } })`) zum Schutz vor Cross-Site Request Forgery, nahtlos integriert mit `BBForm` und Galdr.

## [0.15.0] - 2026-04-07

### Hinzugefügt (Added)
- **Direct Binary Streaming**: `bodyParser.bypass` in der `app.startup()` Konfiguration akzeptiert nun Arrays (z. B. `['PUT']`) oder Strings (`'PUT'`), um große Datei-Uploads RAM-schonend nativ als Stream zu verarbeiten.
- **Authentifizierung & Sessions**: Native JWT-Implementierung (`AuthService`), schnelle In-Memory Sessions und neue Guards (`requireAuth`, `requireRole`) im `BBController`.
- **AdminController**: Neue Basisklasse für geschützte Backend-Routen (`src/routing/AdminController.js`).
- **Galdr Template Engine**: Vollständiges Feature-Set inklusive Layouts, Partials, Blöcken, Filtern und strukturierten Komponenten (`{% component %}`).
- **Bifröst CLI**: Neues Kommandozeilen-Tool (`npx bifrost init` & `npx bifrost flags`) für schnelles Projekt-Scaffolding inklusive CSS-Framework und UI-Komponenten.
- **Security & Middleware**: Native Runen für Rate-Limiting, Security Headers (CSP, HSTS) und flexibles CORS-Handling hinzugefügt.
- **Logging**: Zero-Dependency File-Logger mit automatischer täglicher Rotation und Gzip-Kompression alter Logs.
- **Internationalisierung (i18n)**: Locale-Prefix-Routing (SEO-URLs) und `I18n.js` Integration.

### Geändert (Changed)
- **Multipart/Form-Data**: Der interne BodyParser zerlegt File-Uploads nun komplett eigenständig und ohne externe `npm`-Pakete (wie Multer).
- Optimierung der Galdr-Engine für maximale Performance und Sicherheit (Path-Traversal-Schutz, automatisches HTML-Escaping).
- Socket.io CORS-Defaults auf eine sichere "Same-Origin" Richtlinie in Produktion gesetzt.

### Behoben (Fixed)
- CORS-Konflikte bei Kombination von Wildcard-Origin (`*`) und Credentials (`true`) werden nun dynamisch über Reflektion des Origin-Headers des Clients gelöst, um Browser-Blockaden zu verhindern.
- Rate-Limit-IPv6 Bucket-Sicherheit verbessert (Normalisierung von `::ffff:1.2.3.4` zu `1.2.3.4`).