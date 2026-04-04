# Bifröst — Authentifizierung & Rollen

Bifröst bringt ein eigenes, natives Auth-System auf Basis von **JSON Web Tokens (JWT)** mit. Es benötigt keine externen npm-Pakete, nutzt das Node.js `crypto`-Modul und ist resistent gegen Timing-Angriffe.

## 1. Setup in der App

Um Auth in Bifröst zu aktivieren, musst du den `AuthService` als Service registrieren und die `AuthRune` (Middleware) einhängen.

```javascript
import { BifrostApp, Bifrost, AuthService } from 'bifrost';

const app = new BifrostApp();

// 1. JWT-Secret definieren (WICHTIG: In Production aus Umgebungsvariablen laden!)
const secret = process.env.JWT_SECRET || 'super-geheimes-secret';
app.register('auth', new AuthService(secret));

await app.startup({ /* ... */ });

// 2. AuthRune global einhängen (Liest Cookie/Header und setzt req.user)
app.bifrost.use(Bifrost.createAuthRune(app));

await app.run();
```

---

## 2. Token generieren (Login)

In deinem Login-Controller nutzt du den `AuthService`, um nach erfolgreicher Prüfung der Zugangsdaten ein Token auszustellen.

```javascript
import { BBController } from 'bifrost';

export default class LoginController extends BBController {
    static path = '/login';
    static methods = ['post'];

    async post() {
        const { username, password } = this.body;
        
        // Beispiel: Zugangsdaten prüfen (z.B. via Datenbank)
        if (username === 'admin' && password === '1234') {
            
            // Payload für das Token definieren
            const payload = { id: 1, name: 'Admin', role: 'admin' };
            
            // Token signieren (Gültigkeit: 24 Stunden = 86400 Sekunden)
            const token = this.app.service('auth').sign(payload, 86400);
            
            // Token sicher als HttpOnly Cookie setzen
            this.setCookie('auth_token', token, { httpOnly: true, path: '/' });
            
            this.redirect('/admin/dashboard');
        } else {
            await this.render('login', { error: 'Falsche Zugangsdaten' });
        }
    }
}
```

---

## 3. Routen absichern (Guards)

Der `BBController` bringt Hilfsmethoden (*Guards*) mit, um Zugriffe im `prepare()` Lifecycle-Hook zu blockieren.

### Einlogg-Zwang (Beliebige Rolle)
```javascript
export default class ProfileController extends BBController {
    static path = '/profile';

    async prepare() {
        const proceed = await super.prepare();
        if (!proceed) return false;

        // Leitet auf /login um, falls der Nutzer nicht eingeloggt ist
        return this.requireAuth('/login');
    }

    async get() {
        // this.user ist hier garantiert vorhanden!
        await this.render('profile', { user: this.user });
    }
}
```

### Rollen-Überprüfung (RBAC)
Du kannst eine oder mehrere Rollen fordern.
```javascript
async prepare() {
    const proceed = await super.prepare();
    if (!proceed) return false;

    // Nur User mit der Rolle 'editor' oder 'admin' dürfen hier rein
    return this.requireRole(['editor', 'admin']);
}
```

### Der AdminController
Für Bereiche wie das Backend empfiehlt es sich, eine Basisklasse zu erstellen, von der alle Backend-Controller erben. Bifröst bringt dafür den `AdminController` bereits mit.

```javascript
import { AdminController } from 'bifrost';

export default class DashboardController extends AdminController {
    static path = '/admin/dashboard';
    static methods = ['get'];

    async get() {
        await this.render('admin/dashboard', { user: this.user });
    }
}
```