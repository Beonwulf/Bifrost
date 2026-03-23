Bifrost/
├── index.js                          ← Public API (alle Exports)
├── package.json                      ← neu erstellt
└── src/
    ├── core/
    │   ├── Bifrost.js                ← HTTP/HTTPS Server
    │   ├── BifrostApp.js             ← High-Level App-Wrapper
    │   └── BifrostStatic.js          ← Middleware-Factories
    ├── routing/
    │   ├── BBController.js           ← Basis-Controller-Klasse
    │   └── Router.js                 ← Route/Controller-Loader
    ├── template/
    │   ├── Galdr.js                  ← Template Engine
    │   └── views/                    ← Framework-interne Views
    │       ├── 404.galdr.html
    │       ├── 500.galdr.html
    │       ├── layouts/
    │       │   ├── base.galdr.html
    │       │   └── minimal.galdr.html
    │       └── partials/
    │           ├── flash.galdr.html
    │           └── head.galdr.html
    ├── defaults/
    │   └── routes.js                 ← Built-in 404/500 Handler
    └── utils/
        └── mimeTypes.js              ← MIME-Typ-Tabelle