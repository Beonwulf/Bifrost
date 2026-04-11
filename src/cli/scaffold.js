export const SCAFFOLD = {

	dirs: [
		'public',
		'data',
		'public/css',
		'public/js',
		'mvc/views',
		'mvc/views/layouts',
		'mvc/views/partials',
		'mvc/controllers',
		'i18n/de',
		'i18n/en',
		'i18n/fr',
		'i18n/es',
		'i18n/it',
	],

	files: {

		'data/.gitkeep': ``,

		// ── Layouts ──────────────────────────────────────────────────────────

		'mvc/views/layouts/base.galdr.html': `<!DOCTYPE html>
<html lang="de">
<head>
	{% partial head %}
	{% yield head %}
	<script src="/js/theme-init.js"></script>
</head>
<body>
	{% partial nav %}
	<main class="container">
		{% partial flash %}
		{% yield %}
	</main>
	{% partial footer %}
	<script src="/js/app.js" defer></script>
	{% yield scripts %}
</body>
</html>
`,

		// ── Partials ─────────────────────────────────────────────────────────

		'mvc/views/partials/head.galdr.html': `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{ title }}{% if title %} – {% endif %}Bifröst App</title>
{% partial seo %}
<link rel="stylesheet" href="/css/sz.css">
<link rel="stylesheet" href="/css/szicons.css">
<link rel="stylesheet" href="/css/flags.css">
`,

		'mvc/views/partials/footer.galdr.html': `<footer class="footer">
	<div class="footer-inner">
		<span>© {{ year | default:'2025' }} Bifröst App</span>
		{% include "nav" with { items: _nav.footer, class: 'footer-links' } %}
	</div>
</footer>
`,

		'mvc/views/partials/header.galdr.html': `<header class="site-header">
	<nav class="nav">
		<a href="{% url '/' %}" class="nav-brand">🌈 Bifröst</a>
		{% include "nav" with { items: _nav.main } %}
		{% partial langswitch %}
		<button class="btn-theme" id="theme-toggle" aria-label="Dark Mode umschalten" title="Theme umschalten">🌙</button>
	</nav>
</header>
`,

		'mvc/views/partials/flash.galdr.html': `{% if $flash %}
<div class="flash flash--{{ $flash.type }}">
	{{ $flash.message }}
</div>
{% endif %}
`,

		// ── Views ─────────────────────────────────────────────────────────────

		'mvc/views/home.galdr.html': `{% layout "base" %}
<section class="hero">
	<h1>Willkommen bei Bifröst ✨</h1>
	<p>Dein Server läuft. Bearbeite <code>mvc/controllers/HomeController.js</code> um loszulegen.</p>
	<div class="flex justify-center gap-md mt-lg">
		<a href="/about" class="btn btn-primary btn-lg">Mehr erfahren</a>
		<a href="https://github.com" class="btn btn-outline-light btn-lg">GitHub</a>
	</div>
</section>
<div class="section">
	<div class="grid grid--3">
		<div class="card">
			<div class="card-header">🗺️ Routing</div>
			<div class="card-body">
				<p>Controller-basiertes Routing mit <code>BBController</code> oder funktionale Routen.</p>
				<span class="badge badge--primary">ESM</span>
			</div>
		</div>
		<div class="card">
			<div class="card-header">📄 Templates</div>
			<div class="card-body">
				<p>Galdr Template-Engine mit Layouts, Partials, Blöcken und Filtern.</p>
				<span class="badge badge--success">Keine Deps</span>
			</div>
		</div>
		<div class="card">
			<div class="card-header">⚡ WebSockets</div>
			<div class="card-body">
				<p>Socket.io Integration für Echtzeit-Kommunikation out of the box.</p>
				<span class="badge badge--info">Socket.io</span>
			</div>
		</div>
	</div>
</div>
{% endlayout %}
`,

		'mvc/views/features.galdr.html': `{% layout "base" %}
{% block scripts %}
<script src="/js/features.js" defer></script>
{% endblock %}

<div class="layout-with-sidebar container items-start">

	<aside class="sidebar">
		<div class="sidebar-header">CSS-Komponenten</div>
		<ul class="sidebar-nav docs-nav">
			<li><a href="#typography">Typografie</a></li>
			<li><a href="#buttons">Buttons</a></li>
			<li><a href="#badges">Badges</a></li>
			<li><a href="#alerts">Alerts &amp; Flash</a></li>
			<li><a href="#cards">Cards</a></li>
			<li><a href="#forms">Formulare</a></li>
			<li><a href="#tables">Tabellen</a></li>
			<li><a href="#grid">Grid &amp; Layout</a></li>
			<li><a href="#nav-demo">Navigation</a></li>
			<li><a href="#breadcrumb">Breadcrumb</a></li>
			<li><a href="#pagination">Pagination</a></li>
			<li><a href="#tabs">Tabs</a></li>
			<li><a href="#accordion">Accordion</a></li>
			<li><a href="#modal">Modal</a></li>
			<li><a href="#dropdown">Dropdown</a></li>
			<li><a href="#tooltip">Tooltip</a></li>
			<li><a href="#spinner">Spinner</a></li>
			<li><a href="#data-charts">Daten &amp; Charts</a></li>
			<li><a href="#timeline">Timeline</a></li>
			<li><a href="#treeview">Treeview</a></li>
			<li><a href="#slideshow">Slideshow</a></li>
			<li><a href="#parallax">Parallax</a></li>
			<li><a href="#extra">Flipbox &amp; Extra</a></li>
			<li><a href="#components">Galdr-Komponenten</a></li>
		</ul>
		<div class="sidebar-divider"></div>
		<ul class="sidebar-nav">
			<li><a href="/galdr">Galdr-Engine →</a></li>
		</ul>
	</aside>

	<div class="docs-content">

		<h1>CSS-Komponenten</h1>
		<p class="text-lg text-muted mb-xl">Alle CSS-Klassen und UI-Komponenten auf einen Blick. Template-Engine-Docs: <a href="/galdr">Galdr-Engine →</a></p>

		<section class="docs-section" id="typography">
			<h2>Typografie</h2>
			<div class="card"><div class="card-body">
				<h1>h1 — Überschrift 1</h1>
				<h2>h2 — Überschrift 2</h2>
				<h3>h3 — Überschrift 3</h3>
				<h4>h4 — Überschrift 4</h4>
				<p>Fließtext. <strong>Fett</strong>, <em>kursiv</em>, <a href="#">Link</a>, <code>code</code>.</p>
				<p class="text-muted">Gedämpft mit <code>.text-muted</code></p>
				<p class="text-sm">Klein mit <code>.text-sm</code></p>
				<p class="text-lg">Groß mit <code>.text-lg</code></p>
				<blockquote>Blockquote — wichtige Zitate.</blockquote>
				<pre><code>// Code-Block
const msg = 'Bifröst';</code></pre>
			</div></div>
		</section>

		<section class="docs-section" id="buttons">
			<h2>Buttons</h2>
			<div class="card">
				<div class="card-header">Varianten</div>
				<div class="card-body flex flex-wrap gap-sm">
					<button class="btn btn-primary">Primary</button>
					<button class="btn btn-secondary">Secondary</button>
					<button class="btn btn-success">Success</button>
					<button class="btn btn-danger">Danger</button>
					<button class="btn btn-outline">Outline</button>
					<button class="btn btn-ghost">Ghost</button>
				</div>
				<div class="card-header">Größen</div>
				<div class="card-body flex flex-wrap items-center gap-sm">
					<button class="btn btn-primary btn-sm">Small</button>
					<button class="btn btn-primary">Default</button>
					<button class="btn btn-primary btn-lg">Large</button>
					<button class="btn btn-primary" disabled>Disabled</button>
				</div>
			</div>
		</section>

		<section class="docs-section" id="badges">
			<h2>Badges</h2>
			<div class="card"><div class="card-body flex flex-wrap gap-sm">
				<x-badge type="primary">primary</x-badge>
				<x-badge type="success">success</x-badge>
				<x-badge type="danger">danger</x-badge>
				<x-badge type="warning">warning</x-badge>
				<x-badge type="info">info</x-badge>
				<x-badge type="neutral">neutral</x-badge>
			</div></div>
		</section>

		<section class="docs-section" id="alerts">
			<h2>Alerts &amp; Flash</h2>
			<x-alert type="success">✅ <strong>Erfolg</strong> — Aktion abgeschlossen.</x-alert>
			<x-alert type="info">ℹ️ <strong>Info</strong> — Hinweis für den Nutzer.</x-alert>
			<x-alert type="warning">⚠️ <strong>Warnung</strong> — Bitte beachten.</x-alert>
			<x-alert type="danger">❌ <strong>Fehler</strong> — Etwas ging schief.</x-alert>
		</section>

		<section class="docs-section" id="cards">
			<h2>Cards</h2>
			<div class="grid grid--3">
				{% component "card" %}
					{% slot head %}Header{% endslot %}
					{% slot body %}<p>Body-Inhalt.</p>{% endslot %}
					{% slot foot %}<button class="btn btn-primary btn-sm">Action</button>{% endslot %}
				{% endcomponent %}
				{% component "card" %}
					{% slot body %}<p>Ohne Header &amp; Footer.</p><x-badge type="success">New</x-badge>{% endslot %}
				{% endcomponent %}
				<x-card>Nur Body, kein Header oder Footer.</x-card>
			</div>
		</section>

		<section class="docs-section" id="forms">
			<h2>Formulare</h2>
			<div class="card"><div class="card-body">
				<form>
					<div class="grid grid--2">
						<div class="form-group">
							<label for="ex-name">Name</label>
							<input type="text" id="ex-name" placeholder="Max Mustermann">
						</div>
						<div class="form-group">
							<label for="ex-email">E-Mail</label>
							<input type="email" id="ex-email" placeholder="mail@example.com">
						</div>
					</div>
					<div class="form-group">
						<label for="ex-sel">Kategorie</label>
						<select id="ex-sel"><option>Option A</option><option>Option B</option></select>
					</div>
					<div class="form-group">
						<label for="ex-msg">Nachricht</label>
						<textarea id="ex-msg" placeholder="Deine Nachricht…"></textarea>
						<span class="form-hint">Maximal 500 Zeichen.</span>
					</div>
					<div class="form-group">
						<label for="ex-err">Fehlerfeld</label>
						<input type="text" id="ex-err" class="is-error" value="ungültig">
						<span class="form-error">Dieses Feld ist ungültig.</span>
					</div>
					<button type="submit" class="btn btn-primary">Absenden</button>
				</form>
			</div></div>
		</section>

		<section class="docs-section" id="tables">
			<h2>Tabellen</h2>
			<div class="card"><div class="table-wrap">
				<table class="table">
					<thead><tr><th>Controller</th><th>Route</th><th>Methode</th><th>Status</th></tr></thead>
					<tbody>
						<tr><td>HomeController</td><td><code>/</code></td><td>GET</td><td><span class="badge badge--success">aktiv</span></td></tr>
						<tr><td>FeaturesController</td><td><code>/features</code></td><td>GET</td><td><span class="badge badge--info">docs</span></td></tr>
						<tr><td>GaldrController</td><td><code>/galdr</code></td><td>GET</td><td><span class="badge badge--info">docs</span></td></tr>
						<tr><td>AboutController</td><td><code>/about</code></td><td>GET</td><td><span class="badge badge--success">aktiv</span></td></tr>
						<tr><td>ImprintController</td><td><code>/imprint</code></td><td>GET</td><td><span class="badge badge--neutral">statisch</span></td></tr>
					</tbody>
				</table>
			</div></div>
		</section>

		<section class="docs-section" id="grid">
			<h2>Grid &amp; Layout</h2>
			<p class="text-muted mb-md"><code>.grid--2</code> / <code>.grid--3</code> / <code>.grid--4</code> / <code>.grid--auto</code></p>
			<div class="grid grid--4 mb-md">
				{% each gridCols %}
				<div class="card"><div class="card-body text-center">Spalte {{ this }}</div></div>
				{% endeach %}
			</div>
			<p class="text-muted"><code>.layout-with-sidebar</code> — diese Seite ist selbst ein Beispiel dafür.</p>
		</section>

		<section class="docs-section" id="nav-demo">
			<h2>Navigation</h2>
			<div class="card"><div class="card-body">
				<nav class="nav static shadow-none rounded">
					<a href="#" class="nav-brand">Brand</a>
					<ul class="nav-links">
						<li><a href="#" class="active">Aktiv</a></li>
						<li><a href="#">Link</a></li>
						<li><a href="#">Link</a></li>
					</ul>
				</nav>
			</div></div>
		</section>

		<section class="docs-section" id="breadcrumb">
			<h2>Breadcrumb</h2>
			<div class="card"><div class="card-body">
				<ol class="breadcrumb">
					<li class="breadcrumb-item"><a href="/">Home</a></li>
					<li class="breadcrumb-item"><a href="/features">Features</a></li>
					<li class="breadcrumb-item active">Breadcrumb</li>
				</ol>
			</div></div>
		</section>

		<section class="docs-section" id="pagination">
			<h2>Pagination</h2>
			<div class="card"><div class="card-body">
				<ul class="pagination">
					<li class="page-item disabled"><span>«</span></li>
					<li class="page-item active"><span>1</span></li>
					<li class="page-item"><a href="#">2</a></li>
					<li class="page-item"><a href="#">3</a></li>
					<li class="page-item"><a href="#">»</a></li>
				</ul>
			</div></div>
		</section>

		<section class="docs-section" id="tabs">
			<h2>Tabs</h2>
			<div class="card"><div class="card-body" data-tabs>
				<ul class="tabs">
					<li class="tab-item"><button class="tab-btn" data-tab="tab-a">Tab A</button></li>
					<li class="tab-item"><button class="tab-btn" data-tab="tab-b">Tab B</button></li>
					<li class="tab-item"><button class="tab-btn" data-tab="tab-c">Tab C</button></li>
				</ul>
				<div class="tab-panels">
					<div class="tab-panel" id="tab-a"><p>Inhalt von <strong>Tab A</strong>.</p></div>
					<div class="tab-panel" id="tab-b"><p>Inhalt von <strong>Tab B</strong>.</p></div>
					<div class="tab-panel" id="tab-c"><p>Inhalt von <strong>Tab C</strong>.</p></div>
				</div>
			</div></div>
		</section>

		<section class="docs-section" id="accordion">
			<h2>Accordion</h2>
			<div class="accordion">
				<button class="accordion-header" aria-expanded="false">Was ist Bifröst?</button>
				<div class="accordion-body"><p>Ein eigenständiges Node.js HTTP/HTTPS-Framework, kein Express, ESM-only.</p></div>
			</div>
			<div class="accordion">
				<button class="accordion-header" aria-expanded="false">Was ist Galdr?</button>
				<div class="accordion-body"><p>Die eingebaute Template-Engine — zero deps, mit Layouts, Partials, Filtern und mehr.</p></div>
			</div>
			<div class="accordion">
				<button class="accordion-header" aria-expanded="false">Brauche ich npm-Pakete?</button>
				<div class="accordion-body"><p>Für den Kern nein. Nur <code>socket.io</code> und <code>selfsigned</code> sind optionale Dependencies.</p></div>
			</div>
		</section>

		<section class="docs-section" id="modal">
			<h2>Modal</h2>
			<div class="card"><div class="card-body">
				<button class="btn btn-primary" data-modal-open="demo-modal">Modal öffnen</button>
			</div></div>
			<div class="modal-overlay" data-modal="demo-modal">
				<div class="modal">
					<div class="modal-header">
						Beispiel-Modal
						<button class="modal-close" aria-label="Schließen">✕</button>
					</div>
					<div class="modal-body">
						<p>Öffnen via <code>data-modal-open="id"</code>, schließen per <code>Escape</code> oder ✕.</p>
						<p>Programmatisch: <code>BifrostUI.openModal('demo-modal')</code></p>
					</div>
					<div class="modal-footer">
						<button class="btn btn-ghost" data-modal-close>Abbrechen</button>
						<button class="btn btn-primary">Bestätigen</button>
					</div>
				</div>
			</div>
		</section>

		<section class="docs-section" id="dropdown">
			<h2>Dropdown</h2>
			<div class="card"><div class="card-body">
				<div class="dropdown">
					<button class="btn btn-secondary" data-dropdown aria-expanded="false">Menü ▾</button>
					<ul class="dropdown-menu">
						<li><a href="#">Eintrag A</a></li>
						<li><a href="#">Eintrag B</a></li>
						<li class="dropdown-divider"></li>
						<li><a href="#" class="text-danger">Löschen</a></li>
					</ul>
				</div>
			</div></div>
		</section>

		<section class="docs-section" id="tooltip">
			<h2>Tooltip</h2>
			<div class="flex flex-wrap items-center gap-lg mt-md">
				<span data-tooltip="Ich bin ein Tooltip!">Hover über mich</span>
				<button class="btn btn-outline" data-tooltip="Speichern (Strg+S)">Speichern</button>
				<span class="badge badge--primary" data-tooltip="3 neue Nachrichten">Posteingang</span>
			</div>
		</section>

		<section class="docs-section" id="spinner">
			<h2>Spinner / Loader</h2>
			<div class="card"><div class="card-body flex items-center gap-lg">
				<x-spinner size="sm" ariaLabel="Lädt…" />
				<x-spinner ariaLabel="Lädt…" />
				<x-spinner size="lg" ariaLabel="Lädt…" />
				<span class="text-muted">.spinner--sm &nbsp;/&nbsp; default &nbsp;/&nbsp; .spinner--lg</span>
			</div></div>
		</section>

		<section class="docs-section" id="data-charts">
			<h2>Daten &amp; Fortschritt</h2>
			<div class="flex flex-col gap-xl mb-xl">
				<div>
					<h4 class="mb-md">Progress Bars</h4>
					<div class="progress"><div class="progress-bar w-45">45%</div></div>
					<div class="progress"><div class="progress-bar progress-bar--success w-80">Speicher (80%)</div></div>
					<div class="progress"><div class="progress-bar progress-bar--danger w-95">CPU (95%)</div></div>
				</div>
				<div>
					<h4 class="mb-md">CSS Pie Chart</h4>
					<div class="pie-chart pie-60">
						<span class="pie-chart-value">60%</span>
					</div>
				</div>
				<div>
					<h4 class="mb-md">CSS Donut Chart</h4>
					<div class="pie-chart donut donut-35">
						<span class="pie-chart-value">35%</span>
					</div>
				</div>
			</div>
		</section>

		<section class="docs-section" id="timeline">
			<h2>Timeline</h2>
			<div class="timeline">
				<div class="timeline-item">
					<div class="timeline-marker">1</div>
					<div class="timeline-content">
						<div class="timeline-date">Gestern, 14:00 Uhr</div>
						<h4>Bifröst initialisiert</h4>
						<p class="text-muted">Der Core-Server lauscht auf Port 3000.</p>
					</div>
				</div>
				<div class="timeline-item">
					<div class="timeline-marker">2</div>
					<div class="timeline-content">
						<div class="timeline-date">Heute, 09:30 Uhr</div>
						<h4>Galdr Engine verbunden</h4>
						<p class="text-muted">Templates erfolgreich kompiliert.</p>
					</div>
				</div>
				<div class="timeline-item">
					<div class="timeline-marker">3</div>
					<div class="timeline-content">
						<div class="timeline-date">Gerade eben</div>
						<h4>System-Check</h4>
						<p class="text-muted">Alle Module laufen stabil.</p>
					</div>
				</div>
			</div>
		</section>

		<section class="docs-section" id="treeview">
			<h2>Treeview (Verzeichnisbaum)</h2>
			<div class="card"><div class="card-body">
				<ul class="treeview treeview--lines">
					<li>
						<span class="treeview-caret open">📁 src</span>
						<ul class="treeview-nested open">
							<li>📄 app.js</li>
							<li>
								<span class="treeview-caret open">📁 controllers</span>
								<ul class="treeview-nested open">
									<li>📄 HomeController.js</li>
									<li>📄 FeaturesController.js</li>
								</ul>
							</li>
						</ul>
					</li>
					<li>📄 package.json</li>
				</ul>
			</div></div>
		</section>

				<section class="docs-section" id="slideshow">
			<h2>Slideshow / Carousel</h2>
			<div class="slideshow mb-md">
				<div class="slide active bg-demo-1">
					<div class="slide-content flex flex-col justify-center items-start">
						<h3 class="slide-text-light">Willkommen bei Bifröst</h3>
						<p class="slide-text-light">Native CSS Animationen.</p>
					</div>
				</div>
				<div class="slide bg-demo-2">
					<div class="slide-content flex flex-col justify-center items-start">
						<h3 class="slide-text-light">Performant &amp; Leicht</h3>
						<p class="slide-text-light">Ohne externe JS-Bibliotheken.</p>
					</div>
				</div>
				<button class="slideshow-nav slideshow-nav--prev">❮</button>
				<button class="slideshow-nav slideshow-nav--next">❯</button>
			</div>
		</section>

		<section class="docs-section" id="parallax">
			<h2>Parallax</h2>
			<div class="parallax rounded-lg flex items-center justify-center min-h-200 bg-demo-3">
				<h2 class="slide-text-light mb-0">Parallax Scrolling</h2>
			</div>
		</section>


		<section class="docs-section" id="extra">
			<h2>Flip-Box &amp; Notification Shapes</h2>
			<div class="grid grid--2">
				<div class="flip-box">
					<div class="flip-box-inner">
						<div class="flip-box-front">
							<h3>Hover mich!</h3>
							<p class="text-muted">CSS 3D-Flip</p>
						</div>
						<div class="flip-box-back">
							<h3>Rückseite</h3>
							<button class="btn btn-outline-light btn-sm mt-md">Aktion</button>
						</div>
					</div>
				</div>
				<div class="card p-lg flex flex-col gap-lg items-start justify-center">
					<div class="notification">
						<button class="btn btn-outline">Posteingang</button>
						<div class="badge-burst-8">3</div>
					</div>
					<div class="notification">
						<button class="btn btn-secondary">Kommentare</button>
						<div class="badge-talkbubble">1</div>
					</div>
				</div>
			</div>
		</section>

		<section class="docs-section" id="components">
			<h2>Galdr-Komponenten</h2>
			<p class="text-muted mb-md">Zwei Syntaxen — Custom Tags für einfache Leaf-Komponenten, <code>{% component %}</code> für strukturierte Layouts mit Named Slots.</p>
			<div class="grid grid--2">
				{% component "card" %}
					{% slot head %}Custom Tag — <code>&lt;x-name attr="val"&gt;</code>{% endslot %}
					{% slot body %}
					<pre><code>&lt;!-- selbst-schließend --&gt;
&lt;x-spinner size="sm" /&gt;

&lt;!-- mit Slot-Inhalt --&gt;
&lt;x-alert type="success"&gt;Gespeichert!&lt;/x-alert&gt;
&lt;x-badge type="primary"&gt;NEU&lt;/x-badge&gt;
&lt;x-card head="Titel"&gt;Body-Text&lt;/x-card&gt;</code></pre>
					{% endslot %}
				{% endcomponent %}
				{% component "card" %}
					{% slot head %}Structural — <code>{% component %} / {% slot %}</code>{% endslot %}
					{% slot body %}
					<pre><code>{% component "card" %}
  {% slot head %}Titel{% endslot %}
  {% slot body %}
    {% each items %}
      &lt;p&gt;{{ name }}&lt;/p&gt;
    {% endeach %}
  {% endslot %}
  {% slot foot %}
    &lt;button class="btn btn-primary"&gt;
      Speichern
    &lt;/button&gt;
  {% endslot %}
{% endcomponent %}</code></pre>
					{% endslot %}
				{% endcomponent %}
			</div>
		</section>

		<x-alert type="info" class="mt-xl">Template-Engine-Referenz: <a href="/galdr"><strong>Galdr-Engine →</strong></a></x-alert>

	</div>
</div>
{% endlayout %}
`,

		'mvc/views/galdr.galdr.html': `{% layout "base" %}
{% block scripts %}
<script src="/js/features.js" defer></script>
{% endblock %}

<div class="layout-with-sidebar container items-start">

	<aside class="sidebar">
		<div class="sidebar-header">Galdr-Engine</div>
		<ul class="sidebar-nav docs-nav">
			<li><a href="#galdr-layout">Layouts &amp; Partials</a></li>
			<li><a href="#galdr-blocks">Blöcke (yield)</a></li>
			<li><a href="#galdr-if">if / elseif / else</a></li>
			<li><a href="#galdr-each">each-Schleifen</a></li>
			<li><a href="#galdr-set">set-Variablen</a></li>
			<li><a href="#galdr-filters">Filter / Pipes</a></li>
			<li><a href="#galdr-include">include with</a></li>
			<li><a href="#galdr-comments">Kommentare</a></li>
			<li><a href="#galdr-components">Komponenten</a></li>
		</ul>
		<div class="sidebar-divider"></div>
		<ul class="sidebar-nav">
			<li><a href="/features">← CSS-Komponenten</a></li>
		</ul>
	</aside>

	<div class="docs-content">

		<h1>Galdr — Template-Engine</h1>
		<p class="text-lg text-muted mb-xl">Die eingebaute Template-Engine von Bifröst — zero dependencies. Layouts, Partials, Blöcke, Filter, Schleifen und mehr.</p>

		<section class="docs-section" id="galdr-layout">
			<h2>Layouts &amp; Partials</h2>
			<div class="card mb-lg"><div class="card-body">
				<pre><code>{% layout "base" %}
  Seiten-Inhalt hier…
{% endlayout %}

{# Partial einbinden #}
{% partial nav %}

{# Partial mit eigenem Kontext #}
{% include "card" with $item %}</code></pre>
			</div></div>
		</section>

		<section class="docs-section" id="galdr-blocks">
			<h2>Benannte Blöcke (yield)</h2>
			<div class="card mb-lg"><div class="card-body">
				<pre><code>{# Im Layout: Platzhalter #}
{% yield title %}
{% yield head %}
{% yield scripts %}
{% yield %}

{# Im Template: Blöcke füllen #}
{% block title %}Meine Seite{% endblock %}

{% block scripts %}
&lt;script src="/js/extra.js"&gt;&lt;/script&gt;
{% endblock %}</code></pre>
			</div></div>
		</section>

		<section class="docs-section" id="galdr-if">
			<h2>if / elseif / else</h2>
			<div class="card mb-lg"><div class="card-body">
				<pre><code>{% if $user.role === 'admin' %}
  &lt;span class="badge badge--danger"&gt;Admin&lt;/span&gt;
{% elseif $user.role === 'mod' %}
  &lt;span class="badge badge--warning"&gt;Moderator&lt;/span&gt;
{% else %}
  &lt;span class="badge badge--neutral"&gt;User&lt;/span&gt;
{% endif %}</code></pre>
			</div></div>
		</section>

		<section class="docs-section" id="galdr-each">
			<h2>each-Schleifen</h2>
			<div class="card mb-lg"><div class="card-body">
				<pre><code>{% each list %}
  &lt;li&gt;{{ name }}&lt;/li&gt;
{% endeach %}

{# Primitive: {{ this }} #}
{% each numbers %}
  &lt;li&gt;{{ this }}&lt;/li&gt;
{% endeach %}

{# mit Index / Key #}
{% each list %}
  &lt;li&gt;{{ @index }}: {{ name }}&lt;/li&gt;
{% endeach %}</code></pre>
				<p class="text-muted mt-md">Live-Demo mit Controller-Daten:</p>
				<ul>
					{% each features %}
					<li><strong>{{ name }}</strong> — {{ desc }}</li>
					{% endeach %}
				</ul>
			</div></div>
		</section>

		<section class="docs-section" id="galdr-set">
			<h2>set-Variablen</h2>
			<div class="card mb-lg"><div class="card-body">
				<pre><code>{% set $greeting = 'Hallo Welt' %}
{% set $count = $items.length %}
{{ $greeting }} — {{ $count }} Einträge</code></pre>
			</div></div>
		</section>

		<section class="docs-section" id="galdr-filters">
			<h2>Filter / Pipes</h2>
			<div class="card mb-lg"><div class="card-body">
				<pre><code>{{ $name | upper }}
{{ $title | lower }}
{{ $text | truncate:120 }}
{{ $price | currency }}
{{ $num | number:2 }}
{{ $html | nl2br }}
{{ $data | json }}
{{ $val | default:'Fallback' }}

{# Ketten #}
{{ $title | trim | upper }}

{# Eigener Filter (app.js) #}
import { Galdr } from 'bifrost';
Galdr.registerFilter('slug', ($v) =&gt;
  $v.toLowerCase().replace(/\\s+/g, '-'));</code></pre>
			</div></div>
		</section>

		<section class="docs-section" id="galdr-include">
			<h2>include with</h2>
			<div class="card mb-lg"><div class="card-body">
				<pre><code>{% include "card" with $product %}

{# views/partials/card.galdr.html #}
&lt;div class="card"&gt;
  &lt;div class="card-header"&gt;{{ $name }}&lt;/div&gt;
  &lt;div class="card-body"&gt;{{ $description }}&lt;/div&gt;
&lt;/div&gt;</code></pre>
			</div></div>
		</section>

		<section class="docs-section" id="galdr-comments">
			<h2>Kommentare</h2>
			<div class="card mb-lg"><div class="card-body">
				<pre><code>{# Wird nicht gerendert #}
{# TODO: Pagination #}
{{ $wert }} {# inline #}</code></pre>
				<p class="text-muted mt-md">Kommentare werden vor dem Rendern vollständig entfernt — kein HTML-Output.</p>
			</div></div>
		</section>

		<section class="docs-section" id="galdr-components">
			<h2>Komponenten-System</h2>
			<p class="text-muted mb-md">Galdr unterstützt zwei Syntaxen für wiederverwendbare Bausteine: <strong>Custom Tags</strong> (<code>&lt;x-name&gt;</code>) für einfache Leaf-Komponenten und <code>{% component %}</code> für strukturierte Layouts mit Named Slots.</p>

			<h3>Custom Tag — <code>&lt;x-name attr="val" /&gt;</code></h3>
			<div class="card mb-lg"><div class="card-body">
				<pre><code>&lt;!-- Selbst-schließend (kein Slot-Inhalt) --&gt;
&lt;x-spinner size="sm" ariaLabel="Lädt…" /&gt;

&lt;!-- Mit Slot-Inhalt --&gt;
&lt;x-alert type="success"&gt;Datei gespeichert.&lt;/x-alert&gt;
&lt;x-badge type="primary"&gt;NEU&lt;/x-badge&gt;
&lt;x-card head="Titel"&gt;&lt;p&gt;Body-Text&lt;/p&gt;&lt;/x-card&gt;</code></pre>
				<p class="text-muted mt-md">Der Inhalt zwischen den Tags wird als <code>{{{ slot }}}</code> in die Komponente injiziert (unescaped).</p>
			</div></div>

			<h3>Structural Component — <code>{% component %} / {% slot %}</code></h3>
			<div class="card mb-lg"><div class="card-body">
				<pre><code>{% component "card" %}
  {% slot head %}Mein Titel{% endslot %}
  {% slot body %}
    {% each items %}
      &lt;p&gt;{{ name }}&lt;/p&gt;
    {% endeach %}
  {% endslot %}
  {% slot foot %}
    &lt;button class="btn btn-primary"&gt;Speichern&lt;/button&gt;
  {% endslot %}
{% endcomponent %}</code></pre>
				<p class="text-muted mt-md">Named Slots stehen in der Komponente als <code>{{{ _slots.head }}}</code>, <code>{{{ _slots.body }}}</code>, <code>{{{ _slots.foot }}}</code> zur Verfügung. Mit <code>{% if _slots.foot %}</code> lässt sich prüfen, ob ein Slot befüllt wurde.</p>
			</div></div>

			<h3>Eigene Komponenten erstellen</h3>
			<div class="card mb-lg"><div class="card-body">
				<pre><code>&lt;!-- views/partials/my-component.galdr.html --&gt;
&lt;div class="my-widget{% if class %} {{ class }}{% endif %}"&gt;
  {% if _slots.head %}
  &lt;header&gt;{{{ _slots.head }}}&lt;/header&gt;
  {% endif %}
  &lt;div class="my-widget__body"&gt;{{{ slot }}}{{{ _slots.body }}}&lt;/div&gt;
&lt;/div&gt;</code></pre>
				<p class="text-muted mt-md">Alle Attribute des Tags (z. B. <code>type</code>, <code>class</code>, <code>id</code>) sind direkt als Template-Variablen verfügbar. <code>{{{ slot }}}</code> bindet immer den nicht zugeordneten Standardinhalt.</p>
			</div></div>
		</section>

	</div>
</div>
{% endlayout %}
`,

		'mvc/views/docs.galdr.html': `{% layout "base" %}
<section>
	<h1>Doku</h1>
	<p class="text-lg text-muted">Hier entsteht die Dokumentation.</p>
	<hr>
	<p>Bifröst ist ein eigenständiges Node.js-Framework ohne externe Abhängigkeiten für den Server-Kern.</p>
</section>
{% endlayout %}
`,

		'mvc/views/impressum.galdr.html': `{% layout "base" %}
<section>
	<h1>Impressum</h1>
	<p class="text-muted">Angaben gemäß § 5 TMG</p>
	<hr>
	<address>
		<strong>Vorname Nachname</strong><br>
		Musterstraße 1<br>
		12345 Musterstadt
	</address>
	<h2 class="mt-lg">Kontakt</h2>
	<p>E-Mail: <a href="mailto:mail@example.com">mail@example.com</a></p>
</section>
{% endlayout %}
`,

		'mvc/views/datenschutz.galdr.html': `{% layout "base" %}
<section>
	<h1>Datenschutz</h1>
	<p class="text-muted">Datenschutzerklärung</p>
	<hr>
	<p>Hier folgt der Text für den Datenschutz...</p>
</section>
{% endlayout %}
`,

		'mvc/views/cookies.galdr.html': `{% layout "base" %}
<section>
	<h1>Cookies</h1>
	<p class="text-muted">Cookie-Richtlinie</p>
	<hr>
	<p>Hier folgt der Text für die Cookie-Richtlinie...</p>
</section>
{% endlayout %}
`,

		'mvc/views/spa-index.galdr.html': `<!DOCTYPE html>
<html lang="de">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	
	<!-- Dynamische Meta-Tags aus dem Controller -->
	<title>{{ $title }}</title>
	<meta name="description" content="{{ $description }}">
	
	<!-- Open Graph (für schicke Previews auf Social Media, WhatsApp, etc.) -->
	<meta property="og:title" content="{{ $title }}">
	<meta property="og:description" content="{{ $description }}">
	<meta property="og:type" content="{{ $ogType }}">
	
	<!-- BBController generiert praktischerweise schon eine Canonical URL für uns -->
	<link rel="canonical" href="{{ $canonical }}">

	<!-- Hier lädst du deine tatsächliche Frontend-App (React, Vue, Svelte...) -->
	<script type="module" src="/assets/main.js"></script>
</head>
<body>
	<!-- Root-Container für dein Frontend-Framework -->
	<div id="app"></div>
</body>
</html>
`,

		// ── Controllers ──────────────────────────────────────────────────────

		'mvc/controllers/HomeController.js': `import { BBController } from 'bifrost';

export default class HomeController extends BBController {
	static path    = '/';
	static methods = ['get'];
	static menu    = [{ main: 1, lang: 'nav.home' }];

	title       = 'Bifröst';
	description = 'Bifröst — Lightweight Node.js Framework';

	async get() {
		await this.render('home');
	}
}
`,

		'mvc/controllers/DocsController.js': `import { BBController } from 'bifrost';

export default class DocsController extends BBController {
	static path    = '/docs';
	static methods = ['get'];
	static menu    = [{ main: 2, lang: 'nav.docs' }];

	title       = 'Docs — Bifröst';
	description = 'Bifröst Dokumentation';

	async get() {
		await this.render('docs');
	}
}
`,

		'mvc/controllers/FeaturesController.js': `import { BBController } from 'bifrost';

const FEATURES = [
	{ name: 'Layouts',   desc: 'Wiederverwendbare Basis-Layouts mit <code>{% layout "base" %}</code>' },
	{ name: 'Partials',  desc: 'Einbindbare Schnipsel mit <code>{% partial name %}</code>' },
	{ name: 'Include',   desc: 'Partials mit eigenem Kontext: <code>{% include "x" with $obj %}</code>' },
	{ name: 'Filter',    desc: 'Pipes: <code>{{ val | upper | truncate:80 }}</code>' },
	{ name: 'if/elseif', desc: 'Volle Bedingungslogik inkl. elseif-Ketten' },
	{ name: 'each',      desc: 'Schleifen über Arrays und Objekte mit <code>{% each $items %}</code>' },
	{ name: 'set',       desc: 'Template-lokale Variablen mit <code>{% set $x = ... %}</code>' },
	{ name: 'Components',desc: 'Named Slots via <code>{% component "name" %}</code>' },
];

export default class FeaturesController extends BBController {
	static path    = '/features';
	static methods = ['get'];
	static menu    = [{ main: 3, lang: 'nav.features' }];

	title       = 'Features — Bifröst';
	description = 'Bifröst Framework — Features überblick';

	async get() {
		await this.render('features', { features: FEATURES });
	}
}
`,

		'mvc/controllers/GaldrController.js': `import { BBController } from 'bifrost';

const FEATURES = [
	{ name: 'Layouts',   desc: 'Wiederverwendbare Basis-Layouts mit <code>{% layout "base" %}</code>' },
	{ name: 'Partials',  desc: 'Einbindbare Schnipsel mit <code>{% partial name %}</code>' },
	{ name: 'Include',   desc: 'Partials mit eigenem Kontext: <code>{% include "x" with $obj %}</code>' },
	{ name: 'Filter',    desc: 'Pipes: <code>{{ val | upper | truncate:80 }}</code>' },
	{ name: 'if/elseif', desc: 'Volle Bedingungslogik inkl. elseif-Ketten' },
	{ name: 'each',      desc: 'Schleifen über Arrays und Objekte mit <code>{% each $items %}</code>' },
	{ name: 'set',       desc: 'Template-lokale Variablen mit <code>{% set $x = ... %}</code>' },
	{ name: 'Components',desc: 'Named Slots via <code>{% component "name" %}</code>' },
];

export default class GaldrController extends BBController {
	static path    = '/galdr';
	static methods = ['get'];
	static menu    = [{ main: 4, lang: 'nav.galdr' }];

	title       = 'Galdr — Template-Engine';
	description = 'Galdr Template-Engine Dokumentation';

	async get() {
		await this.render('galdr', { features: FEATURES });
	}
}
`,

		'mvc/controllers/ImpressumController.js': `import { BBController } from 'bifrost';

export default class ImpressumController extends BBController {
	static path    = '/imprint';
	static methods = ['get'];
	static menu    = [{ footerlegal: 1, lang: 'nav.impressum' }];

	title       = 'Impressum — Bifröst';
	description = 'Impressum';

	async get() {
		await this.render('impressum');
	}
}
`,

		'mvc/controllers/DatenschutzController.js': `import { BBController } from 'bifrost';

export default class DatenschutzController extends BBController {
	static path    = '/privacy';
	static methods = ['get'];
	static menu    = [{ footerlegal: 2, lang: 'nav.datenschutz' }];

	title       = 'Privacy — Bifröst';
	description = 'Datenschutzerklärung';

	async get() {
		await this.render('datenschutz');
	}
}
`,

		'mvc/controllers/CookiesController.js': `import { BBController } from 'bifrost';

export default class CookiesController extends BBController {
	static path    = '/cookies';
	static methods = ['get'];
	static menu    = [{ footerlegal: 3, lang: 'nav.cookies' }];

	title       = 'Cookies — Bifröst';
	description = 'Cookie-Richtlinie';

	async get() {
		await this.render('cookies');
	}
}
`,

		'mvc/controllers/LangController.js': `import { BBController } from 'bifrost';

const SUPPORTED = ['de', 'en', 'fr', 'es', 'it', 'pt', 'ru'];

export default class LangController extends BBController {
	static path    = '/lang/:code';
	static methods = ['get'];

	async get() {
		const code = this.params.code?.toLowerCase();

		if (!SUPPORTED.includes(code)) {
			return this.redirect('/');
		}

		const back = this.req.headers.referer ?? '/';
		const isHttps = this.req.socket?.encrypted || this.req.headers['x-forwarded-proto']?.split(',')[0].trim() === 'https';
		this.res.setHeader('Set-Cookie',
			\`locale=\${code}; Path=/; Max-Age=31536000; SameSite=Lax\${isHttps ? '; Secure' : ''}\`
		);
		this.redirect(back);
	}
}
`,

		'mvc/controllers/SpaController.js': `import { BBController } from 'bifrost';

export default class SpaController extends BBController {
	// Wildcard-Route: Fängt alle Anfragen ab (z.B. /profile/123)
	static path = '/*';
	static methods = ['get'];

	async get() {
		// Die Wildcard-Gruppe gibt uns den genauen Pfad nach dem '/' zurück
		const requestedPath = this.params.wildcard_0 || '';

		// Standard Meta-Daten für die SPA
		let pageTitle = 'Meine großartige SPA';
		let pageDesc = 'Willkommen in meiner Single Page Application.';

		// Einfaches Beispiel: Dynamische Daten anhand des Pfades ermitteln
		if (requestedPath.startsWith('profile/')) {
			pageTitle = 'Benutzerprofil | Meine SPA';
			pageDesc = 'Sieh dir dieses Benutzerprofil an.';
		} else if (requestedPath === 'settings') {
			pageTitle = 'Einstellungen | Meine SPA';
		}

		// Galdr rendern und Meta-Daten übergeben
		await this.render('spa-index', {
			title: pageTitle,
			description: pageDesc,
			ogType: 'website'
		});
	}
}
`,

		'mvc/controllers/StreamUploadController.js': `import fs from 'node:fs';
import { BBController } from 'bifrost';

export default class StreamUploadController extends BBController {
	static path = '/api/upload-stream';
	static methods = ['put'];

	async put() {
		const totalBytes = parseInt(this.req.headers['content-length'] || '0', 10);
		let receivedBytes = 0;

		const stream = fs.createWriteStream('./gigantic-upload.tmp');
		
		this.req.on('data', (chunk) => {
			receivedBytes += chunk.length;
			if (totalBytes > 0) {
				const progress = ((receivedBytes / totalBytes) * 100).toFixed(2);
				console.log(\`Fortschritt: \${progress}%\`);
			}
		});
		
		this.req.pipe(stream);
		
		await new Promise(resolve => stream.on('finish', resolve));
		this.json({ success: true, message: 'Upload abgeschlossen!' });
	}
}
`,

		// ── i18n ─────────────────────────────────────────────────────────────

		'i18n/de/common.json': `{
	"nav": {
		"home": "Home",
		"blog": "Blog",
		"projects": "Projekte",
		"impressum": "Impressum",
		"datenschutz": "Datenschutz",
		"cookies": "Cookies",
		"docs": "Doku",
		"features": "Features",
		"galdr": "Galdr Engine"
	}
}
`,
		'i18n/en/common.json': `{
	"nav": {
		"home": "Home",
		"blog": "Blog",
		"projects": "Projects",
		"impressum": "Imprint",
		"datenschutz": "Privacy",
		"cookies": "Cookies",
		"docs": "Docs",
		"features": "Features",
		"galdr": "Galdr Engine"
	}
}
`,
		'i18n/fr/common.json': `{
	"nav": {
		"home": "Home",
		"blog": "Blog",
		"projects": "Projets",
		"impressum": "Mentions légales",
		"datenschutz": "Confidentialité",
		"cookies": "Cookies",
		"docs": "Docs",
		"features": "Fonctionnalités",
		"galdr": "Galdr Engine"
	}
}
`,
		'i18n/es/common.json': `{
	"nav": {
		"home": "Home",
		"blog": "Blog",
		"projects": "Proyectos",
		"impressum": "Aviso legal",
		"datenschutz": "Privacidad",
		"cookies": "Cookies",
		"docs": "Docs",
		"features": "Características",
		"galdr": "Galdr Engine"
	}
}
`,
		'i18n/it/common.json': `{
	"nav": {
		"home": "Home",
		"blog": "Blog",
		"projects": "Progetti",
		"impressum": "Note legali",
		"datenschutz": "Privacy",
		"cookies": "Cookie",
		"docs": "Docs",
		"features": "Funzionalità",
		"galdr": "Galdr Engine"
	}
}
`,

		// ── Static Assets ─────────────────────────────────────────────────────

		'public/css/sz.css': `/* ============================================================
   SZ CSS-Framework
   Füge hier den Inhalt deiner sz.css ein!
   ============================================================ */
`,

		'public/css/szicons.css': `/* ============================================================
   SZ Icons
   Füge hier den Inhalt deiner szicons.css ein!
   ============================================================ */
`,

		'public/css/bifrost-ui.css': `/* ============================================================
   Bifröst UI — Eigenständiges CSS-Framework (Optional)
   Optimiert für Galdr-Layouts: .container, .nav, .hero,
   .card, .btn, .form-group, .flash, .badge, .table, .footer
   ============================================================ */

/* ── CSS Custom Properties ───────────────────────────────── */
:root {
	/* Farben */
	--color-primary:        #5c6bc0;
	--color-primary-dark:   #3949ab;
	--color-primary-light:  #7986cb;
	--color-secondary:      #26a69a;
	--color-success:        #4caf75;
	--color-danger:         #ef5350;
	--color-warning:        #ffa726;
	--color-info:           #42a5f5;

	/* Neutrals */
	--color-bg:             #f4f5f7;
	--color-surface:        #ffffff;
	--color-border:         #dde1e7;
	--color-text:           #1d2129;
	--color-text-muted:     #6b7280;
	--color-heading:        #111827;

	/* Navigation */
	--nav-bg:               #1a1a2e;
	--nav-link:             #9ca8b8;
	--nav-link-hover:       #ffffff;

	/* Spacing */
	--sp-xs:   0.25rem;
	--sp-sm:   0.5rem;
	--sp-md:   1rem;
	--sp-lg:   1.5rem;
	--sp-xl:   2rem;
	--sp-2xl:  3rem;
	--sp-3xl:  4.5rem;

	/* Typografie */
	--font-sans: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
	--font-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
	--line-height: 1.65;

	/* Borders & Radien */
	--radius-sm: 4px;
	--radius:    6px;
	--radius-lg: 10px;
	--radius-xl: 16px;
	--radius-full: 9999px;

	/* Schatten */
	--shadow-sm: 0 1px 3px rgba(0,0,0,.07);
	--shadow:    0 2px 8px rgba(0,0,0,.11);
	--shadow-lg: 0 6px 24px rgba(0,0,0,.13);

	/* Übergänge */
	--transition: 160ms ease;

	/* Container */
	--container-max: 1100px;
	--container-pad: 1.5rem;
}

/* ── Reset ───────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }

body {
	font-family: var(--font-sans);
	font-size: 1rem;
	line-height: var(--line-height);
	color: var(--color-text);
	background: var(--color-bg);
	-webkit-font-smoothing: antialiased;
	min-height: 100dvh;
	display: flex;
	flex-direction: column;
}

img, video, svg { max-width: 100%; display: block; }

a {
	color: var(--color-primary);
	text-decoration: none;
	transition: color var(--transition);
}
a:hover { color: var(--color-primary-dark); text-decoration: underline; }

/* ── Typografie ──────────────────────────────────────────── */
h1, h2, h3, h4, h5, h6 {
	color: var(--color-heading);
	line-height: 1.25;
	margin-bottom: var(--sp-md);
	font-weight: 700;
	letter-spacing: -0.01em;
}
h1 { font-size: clamp(1.75rem, 4vw, 2.5rem); }
h2 { font-size: clamp(1.375rem, 3vw, 1.875rem); }
h3 { font-size: 1.375rem; }
h4 { font-size: 1.125rem; font-weight: 600; }
h5 { font-size: 1rem;     font-weight: 600; }
h6 { font-size: 0.875rem; font-weight: 600; }

p { margin-bottom: var(--sp-md); }
p:last-child { margin-bottom: 0; }

small  { font-size: 0.875em; }
strong { font-weight: 700; }

hr {
	border: none;
	border-top: 1px solid var(--color-border);
	margin: var(--sp-xl) 0;
}

code {
	font-family: var(--font-mono);
	font-size: 0.875em;
	background: #eef0f4;
	padding: .15em .45em;
	border-radius: var(--radius-sm);
	color: var(--color-primary-dark);
}

pre {
	font-family: var(--font-mono);
	font-size: 0.875rem;
	background: #1a1a2e;
	color: #d4d8e8;
	padding: var(--sp-lg);
	border-radius: var(--radius);
	overflow-x: auto;
	margin-bottom: var(--sp-md);
	line-height: 1.6;
}
pre code { background: none; padding: 0; color: inherit; font-size: inherit; }

ul, ol { padding-left: var(--sp-xl); margin-bottom: var(--sp-md); }
li { margin-bottom: var(--sp-xs); }

blockquote {
	border-left: 4px solid var(--color-primary);
	padding: var(--sp-sm) var(--sp-lg);
	color: var(--color-text-muted);
	background: #f8f9fc;
	border-radius: 0 var(--radius) var(--radius) 0;
	margin-bottom: var(--sp-md);
}

address { font-style: normal; line-height: 1.8; }

/* ── Layout ──────────────────────────────────────────────── */
.container {
	width: 100%;
	max-width: var(--container-max);
	margin: 0 auto;
	padding: var(--sp-2xl) var(--container-pad);
}
.container--sm   { --container-max: 720px; }
.container--lg   { --container-max: 1400px; }
.container--fluid { max-width: none; }

.grid         { display: grid; gap: var(--sp-lg); }
.grid--2      { grid-template-columns: repeat(2, 1fr); }
.grid--3      { grid-template-columns: repeat(3, 1fr); }
.grid--4      { grid-template-columns: repeat(4, 1fr); }
.grid--auto   { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }

.flex         { display: flex; }
.flex-col     { flex-direction: column; }
.flex-wrap    { flex-wrap: wrap; }
.items-center { align-items: center; }
.items-start  { align-items: flex-start; }
.items-end    { align-items: flex-end; }
.justify-between { justify-content: space-between; }
.justify-center  { justify-content: center; }
.justify-end     { justify-content: flex-end; }
.gap-sm { gap: var(--sp-sm); }
.gap-md { gap: var(--sp-md); }
.gap-lg { gap: var(--sp-lg); }

.section { padding: var(--sp-3xl) 0; }

main { flex: 1; }

/* ── Navigation ──────────────────────────────────────────── */
.nav {
	display: flex;
	align-items: center;
	gap: var(--sp-sm);
	padding: 0 var(--sp-xl);
	height: 62px;
	background: var(--nav-bg);
	position: sticky;
	top: 0;
	z-index: 100;
	box-shadow: 0 1px 0 rgba(255,255,255,.06), var(--shadow);
}

.nav-brand {
	font-weight: 800;
	font-size: 1.15rem;
	color: #fff;
	text-decoration: none;
	margin-right: auto;
	letter-spacing: 0.015em;
}
.nav-brand:hover { color: var(--color-primary-light); text-decoration: none; }

.nav-links {
	list-style: none;
	display: flex;
	align-items: center;
	gap: 2px;
	margin-bottom: 0;
}

.nav-links a {
	color: var(--nav-link);
	text-decoration: none;
	padding: .4rem .9rem;
	border-radius: var(--radius);
	transition: color var(--transition), background var(--transition);
	font-size: 0.9rem;
	font-weight: 500;
}
.nav-links a:hover,
.nav-links a.active {
	color: var(--nav-link-hover);
	background: rgba(255,255,255,.1);
	text-decoration: none;
}

/* ── Hero ────────────────────────────────────────────────── */
.hero {
	padding: var(--sp-3xl) var(--container-pad);
	text-align: center;
	background: linear-gradient(135deg, #12122a 0%, #1a1a3e 50%, #0f2d5e 100%);
	color: #fff;
}
.hero h1 {
	color: #fff;
	font-size: clamp(2rem, 5vw, 3.25rem);
	margin-bottom: var(--sp-md);
}
.hero p {
	color: rgba(255,255,255,.7);
	font-size: 1.15rem;
	max-width: 580px;
	margin: 0 auto var(--sp-xl);
}
.hero code { background: rgba(255,255,255,.15); color: #c5cfff; }
.hero--sm  { padding: var(--sp-2xl) var(--container-pad); }
.hero--sm h1 { font-size: clamp(1.5rem, 3vw, 2rem); }

/* ── Cards ───────────────────────────────────────────────── */
.card {
	background: var(--color-surface);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-sm);
	transition: box-shadow var(--transition), transform var(--transition);
}
.card:hover { box-shadow: var(--shadow); }
.card-header {
	padding: var(--sp-md) var(--sp-lg);
	border-bottom: 1px solid var(--color-border);
	font-weight: 600;
	font-size: 0.9rem;
	border-radius: var(--radius-lg) var(--radius-lg) 0 0;
	overflow: hidden;
	color: var(--color-text-muted);
	background: #f8f9fb;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	font-size: 0.78rem;
}
.card-body   { padding: var(--sp-lg); }
.card-footer {
	padding: var(--sp-md) var(--sp-lg);
	border-top: 1px solid var(--color-border);
	background: #f8f9fb;
}

/* ── Buttons ─────────────────────────────────────────────── */
.btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: var(--sp-xs);
	padding: .5rem 1.25rem;
	border-radius: var(--radius);
	border: 1px solid transparent;
	font-family: inherit;
	font-size: .9375rem;
	font-weight: 500;
	line-height: 1.4;
	cursor: pointer;
	text-decoration: none;
	transition: background var(--transition), color var(--transition),
	            border-color var(--transition), box-shadow var(--transition);
	white-space: nowrap;
	user-select: none;
}
.btn:hover { text-decoration: none; }
.btn:disabled, .btn.disabled { opacity: .5; pointer-events: none; }

/* Varianten */
.btn-primary       { background: var(--color-primary);   color: #fff; border-color: var(--color-primary); }
.btn-primary:hover { background: var(--color-primary-dark); border-color: var(--color-primary-dark); color: #fff; }

.btn-secondary       { background: #6c757d; color: #fff; border-color: #6c757d; }
.btn-secondary:hover { background: #5a6268; color: #fff; }

.btn-success       { background: var(--color-success); color: #fff; border-color: var(--color-success); }
.btn-success:hover { background: #3d9960; color: #fff; }

.btn-danger       { background: var(--color-danger); color: #fff; border-color: var(--color-danger); }
.btn-danger:hover { background: #d32f2f; color: #fff; }

.btn-outline       { background: transparent; color: var(--color-primary); border-color: var(--color-primary); }
.btn-outline:hover { background: var(--color-primary); color: #fff; }

.btn-outline-light       { background: transparent; color: #fff; border-color: rgba(255,255,255,.5); }
.btn-outline-light:hover { background: rgba(255,255,255,.12); border-color: #fff; color: #fff; }

.btn-ghost       { background: transparent; color: var(--color-text); border-color: transparent; }
.btn-ghost:hover { background: #eef0f4; }

.btn-sm    { padding: .3rem .9rem;  font-size: .825rem; }
.btn-lg    { padding: .7rem 1.75rem; font-size: 1.05rem; }
.btn-block { width: 100%; }

/* ── Formulare ───────────────────────────────────────────── */
.form-group { margin-bottom: var(--sp-lg); }

label {
	display: block;
	margin-bottom: .375rem;
	font-weight: 500;
	font-size: .9rem;
}

input[type="text"],
input[type="email"],
input[type="password"],
input[type="number"],
input[type="tel"],
input[type="url"],
input[type="search"],
input[type="date"],
input[type="time"],
select,
textarea {
	display: block;
	width: 100%;
	padding: .5rem .875rem;
	font-family: inherit;
	font-size: .9375rem;
	color: var(--color-text);
	background: var(--color-surface);
	border: 1px solid var(--color-border);
	border-radius: var(--radius);
	transition: border-color var(--transition), box-shadow var(--transition);
	appearance: none;
	line-height: 1.5;
}
input:focus, select:focus, textarea:focus {
	outline: none;
	border-color: var(--color-primary);
	box-shadow: 0 0 0 3px rgba(92,107,192,.2);
}
textarea { resize: vertical; min-height: 100px; }

.form-hint  { margin-top: .3rem; font-size: .825rem; color: var(--color-text-muted); }
.form-error { margin-top: .3rem; font-size: .825rem; color: var(--color-danger); }
.is-error   { border-color: var(--color-danger) !important; box-shadow: 0 0 0 3px rgba(239,83,80,.2) !important; }

input[type="checkbox"],
input[type="radio"] { width: auto; margin-right: .375rem; accent-color: var(--color-primary); }

/* ── Tabellen ────────────────────────────────────────────── */
.table-wrap { overflow-x: auto; }

table, .table {
	width: 100%;
	border-collapse: collapse;
	font-size: .9rem;
	margin-bottom: var(--sp-lg);
}
th, td {
	padding: .7rem 1rem;
	text-align: left;
	border-bottom: 1px solid var(--color-border);
}
th {
	font-weight: 600;
	background: #f3f4f6;
	color: var(--color-text-muted);
	font-size: .75rem;
	text-transform: uppercase;
	letter-spacing: .06em;
}
tr:hover td { background: #fafbfd; }
tr:last-child td { border-bottom: none; }

/* ── Flash / Alerts ──────────────────────────────────────── */
.flash, .alert {
	display: flex;
	align-items: flex-start;
	gap: var(--sp-sm);
	padding: var(--sp-md) var(--sp-lg);
	border-radius: var(--radius);
	border: 1px solid transparent;
	margin-bottom: var(--sp-lg);
}
.flash--success, .alert--success { background: #d4f4e2; color: #166534; border-color: #a7f0c0; }
.flash--error,   .alert--error,
.flash--danger,  .alert--danger  { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }
.flash--warning, .alert--warning { background: #fef3c7; color: #92400e; border-color: #fde68a; }
.flash--info,    .alert--info    { background: #dbeafe; color: #1e40af; border-color: #93c5fd; }

/* ── Badges ──────────────────────────────────────────────── */
.badge {
	display: inline-block;
	padding: .35em .65em;
	font-size: .72rem;
	font-weight: 600;
	border-radius: var(--radius-full);
	line-height: 1;
	white-space: nowrap;
}
.badge--primary { background: var(--color-primary);  color: #fff; }
.badge--success { background: var(--color-success);  color: #fff; }
.badge--danger  { background: var(--color-danger);   color: #fff; }
.badge--warning { background: var(--color-warning);  color: #fff; }
.badge--info    { background: var(--color-info);     color: #fff; }
.badge--neutral { background: #e5e7eb; color: #374151; }

/* ── Footer ──────────────────────────────────────────────── */
.footer {
	background: var(--nav-bg);
	color: rgba(255,255,255,.4);
	font-size: .875rem;
	padding: var(--sp-lg) var(--sp-xl);
	margin-top: auto;
}
.footer-inner {
	max-width: var(--container-max);
	margin: 0 auto;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--sp-md);
}
.footer a { color: rgba(255,255,255,.5); }
.footer a:hover { color: #fff; text-decoration: none; }
.footer-links {
	list-style: none;
	display: flex;
	gap: var(--sp-lg);
}

/* ── Utilities ───────────────────────────────────────────── */
.text-left    { text-align: left; }
.text-center  { text-align: center; }
.text-right   { text-align: right; }
.text-muted   { color: var(--color-text-muted); }
.text-primary { color: var(--color-primary); }
.text-success { color: var(--color-success); }
.text-danger  { color: var(--color-danger); }
.text-warning { color: var(--color-warning); }
.text-info    { color: var(--color-info); }
.text-sm      { font-size: .875rem; }
.text-lg      { font-size: 1.125rem; }
.text-bold    { font-weight: 700; }
.font-normal  { font-weight: 400; }

.mt-auto { margin-top: auto; }
.mt-sm   { margin-top: var(--sp-sm); }  .mb-sm   { margin-bottom: var(--sp-sm); }
.mt-md   { margin-top: var(--sp-md); }  .mb-md   { margin-bottom: var(--sp-md); }
.mt-lg   { margin-top: var(--sp-lg); }  .mb-lg   { margin-bottom: var(--sp-lg); }
.mt-xl   { margin-top: var(--sp-xl); }  .mb-xl   { margin-bottom: var(--sp-xl); }
.mt-0    { margin-top: 0; }             .mb-0    { margin-bottom: 0; }

.p-sm  { padding: var(--sp-sm); }
.p-md  { padding: var(--sp-md); }
.p-lg  { padding: var(--sp-lg); }
.px-md { padding-left: var(--sp-md); padding-right: var(--sp-md); }
.py-md { padding-top:  var(--sp-md); padding-bottom: var(--sp-md); }

.hidden  { display: none; }
.sr-only { position: absolute; width: 1px; height: 1px; clip: rect(0,0,0,0); overflow: hidden; }

.rounded      { border-radius: var(--radius); }
.rounded-lg   { border-radius: var(--radius-lg); }
.rounded-full { border-radius: var(--radius-full); }
.shadow       { box-shadow: var(--shadow); }
.shadow-sm    { box-shadow: var(--shadow-sm); }
.shadow-lg    { box-shadow: var(--shadow-lg); }
.shadow-none  { box-shadow: none; }

.static   { position: static; }
.relative { position: relative; }
.absolute { position: absolute; }

.divider {
	border: none;
	border-top: 1px solid var(--color-border);
	margin: var(--sp-xl) 0;
}

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 768px) {
	.grid--2,
	.grid--3,
	.grid--4 { grid-template-columns: 1fr; }

	.nav {
		padding: var(--sp-sm) var(--sp-md);
		height: auto;
		min-height: 56px;
		flex-wrap: wrap;
		gap: var(--sp-sm);
	}
	.nav-links { flex-wrap: wrap; gap: 2px; width: 100%; }

	.container { padding: var(--sp-lg) var(--sp-md); }

	.footer-inner { flex-direction: column; text-align: center; }
	.footer-links { justify-content: center; }
}

@media (max-width: 480px) {
	.hero { padding: var(--sp-2xl) var(--sp-md); }
	.btn-lg { padding: .6rem 1.25rem; font-size: .95rem; }
}

/* ── Breadcrumb ──────────────────────────────────────────── */
.breadcrumb {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: .25rem;
	list-style: none;
	padding: var(--sp-sm) 0;
	font-size: .875rem;
	color: var(--color-text-muted);
}
.breadcrumb-item + .breadcrumb-item::before {
	content: '/';
	margin-right: .25rem;
	color: var(--color-border);
}
.breadcrumb-item a { color: var(--color-primary); }
.breadcrumb-item a:hover { text-decoration: underline; }
.breadcrumb-item.active { color: var(--color-text-muted); }

/* ── Pagination ──────────────────────────────────────────── */
.pagination {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: .25rem;
	list-style: none;
}
.page-item a,
.page-item span {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 2.25rem;
	height: 2.25rem;
	padding: 0 .6rem;
	border: 1px solid var(--color-border);
	border-radius: var(--radius);
	font-size: .875rem;
	color: var(--color-primary);
	background: var(--color-surface);
	text-decoration: none;
	transition: background var(--transition), color var(--transition);
}
.page-item a:hover { background: var(--color-primary); color: #fff; border-color: var(--color-primary); text-decoration: none; }
.page-item.active span { background: var(--color-primary); color: #fff; border-color: var(--color-primary); font-weight: 600; }
.page-item.disabled span { color: var(--color-text-muted); pointer-events: none; background: #f3f4f6; }

/* ── Tabs ────────────────────────────────────────────────── */
.tabs {
	border-bottom: 2px solid var(--color-border);
	display: flex;
	gap: .25rem;
	list-style: none;
	margin-bottom: var(--sp-lg);
	overflow-x: auto;
}
.tab-item a,
.tab-btn {
	display: inline-block;
	padding: .55rem 1.1rem;
	border-radius: var(--radius) var(--radius) 0 0;
	font-size: .9rem;
	font-weight: 500;
	color: var(--color-text-muted);
	text-decoration: none;
	cursor: pointer;
	border: none;
	background: transparent;
	font-family: inherit;
	border-bottom: 2px solid transparent;
	margin-bottom: -2px;
	transition: color var(--transition), border-color var(--transition);
}
.tab-item a:hover,
.tab-btn:hover { color: var(--color-primary); text-decoration: none; }
.tab-item.active a,
.tab-btn.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }

.tab-panels > .tab-panel { display: none; }
.tab-panels > .tab-panel.active { display: block; }

/* ── Dropdown ────────────────────────────────────────────── */
.dropdown {
	position: relative;
	display: inline-block;
}
.dropdown-menu {
	display: none;
	position: absolute;
	top: calc(100% + 4px);
	left: 0;
	z-index: 200;
	min-width: 180px;
	background: var(--color-surface);
	border: 1px solid var(--color-border);
	border-radius: var(--radius);
	box-shadow: var(--shadow-lg);
	padding: .35rem 0;
	list-style: none;
}
.dropdown-menu.open { display: block; }
.dropdown-menu li a,
.dropdown-menu .dropdown-item {
	display: block;
	padding: .45rem 1rem;
	font-size: .9rem;
	color: var(--color-text);
	text-decoration: none;
	transition: background var(--transition);
	cursor: pointer;
	border: none;
	background: transparent;
	width: 100%;
	text-align: left;
	font-family: inherit;
}
.dropdown-menu li a:hover,
.dropdown-menu .dropdown-item:hover { background: #f3f4f6; text-decoration: none; }
.dropdown-divider { border: none; border-top: 1px solid var(--color-border); margin: .35rem 0; }

/* ── Sidebar ─────────────────────────────────────────────── */
.layout-with-sidebar {
	display: grid;
	grid-template-columns: 240px 1fr;
	gap: var(--sp-xl);
	align-items: start;
}
.layout-with-sidebar--right {
	grid-template-columns: 1fr 240px;
}

.sidebar {
	background: var(--color-surface);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	padding: var(--sp-md) 0;
	position: sticky;
	top: 80px;
}
.sidebar-header {
	padding: var(--sp-sm) var(--sp-lg);
	font-size: .7rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: .08em;
	color: var(--color-text-muted);
}
.sidebar-nav {
	list-style: none;
}
.sidebar-nav a,
.sidebar-nav .sidebar-item {
	display: block;
	padding: .45rem var(--sp-lg);
	font-size: .9rem;
	color: var(--color-text);
	text-decoration: none;
	transition: background var(--transition), color var(--transition);
	border-left: 3px solid transparent;
}
.sidebar-nav a:hover,
.sidebar-nav .sidebar-item:hover { background: #f3f4f6; text-decoration: none; }
.sidebar-nav a.active,
.sidebar-nav .sidebar-item.active { color: var(--color-primary); border-left-color: var(--color-primary); background: #eef0fb; }
.sidebar-divider { border: none; border-top: 1px solid var(--color-border); margin: var(--sp-sm) 0; }

/* ── Accordion / Panel ───────────────────────────────────── */
.accordion {
	border: 1px solid var(--color-border);
	border-radius: var(--radius-lg);
	overflow: hidden;
}
.accordion + .accordion { margin-top: var(--sp-sm); }

.accordion-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: var(--sp-md) var(--sp-lg);
	background: #f8f9fb;
	border: none;
	font-family: inherit;
	font-size: .95rem;
	font-weight: 600;
	color: var(--color-text);
	cursor: pointer;
	text-align: left;
	transition: background var(--transition);
}
.accordion-header:hover { background: #eef0f4; }
.accordion-header::after {
	content: '▾';
	font-size: .8rem;
	transition: transform var(--transition);
	flex-shrink: 0;
}
.accordion-header.open::after { transform: rotate(-180deg); }

.accordion-body {
	display: none;
	padding: var(--sp-lg);
	border-top: 1px solid var(--color-border);
	background: var(--color-surface);
}
.accordion-body.open { display: block; }

/* ── Modal ───────────────────────────────────────────────── */
.modal-overlay {
	display: none;
	position: fixed;
	inset: 0;
	background: rgba(0,0,0,.45);
	z-index: 500;
	align-items: center;
	justify-content: center;
	padding: var(--sp-lg);
}
.modal-overlay.open { display: flex; }

.modal {
	background: var(--color-surface);
	border-radius: var(--radius-xl);
	box-shadow: var(--shadow-lg);
	width: 100%;
	max-width: 520px;
	max-height: 90dvh;
	display: flex;
	flex-direction: column;
	animation: modal-in .18s ease;
}
.modal--sm { max-width: 380px; }
.modal--lg { max-width: 780px; }

@keyframes modal-in {
	from { opacity: 0; transform: translateY(-12px) scale(.97); }
	to   { opacity: 1; transform: none; }
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: var(--sp-lg);
	border-bottom: 1px solid var(--color-border);
	font-weight: 700;
	font-size: 1.05rem;
}
.modal-close {
	background: none;
	border: none;
	font-size: 1.3rem;
	cursor: pointer;
	color: var(--color-text-muted);
	line-height: 1;
	padding: .2rem .4rem;
	border-radius: var(--radius-sm);
	transition: color var(--transition), background var(--transition);
}
.modal-close:hover { color: var(--color-text); background: #f3f4f6; }
.modal-body   { padding: var(--sp-lg); overflow-y: auto; flex: 1; }
.modal-footer {
	padding: var(--sp-md) var(--sp-lg);
	border-top: 1px solid var(--color-border);
	display: flex;
	justify-content: flex-end;
	gap: var(--sp-sm);
	background: #f8f9fb;
	border-radius: 0 0 var(--radius-xl) var(--radius-xl);
}

/* ── Tooltip ─────────────────────────────────────────────── */
[data-tooltip] {
	position: relative;
	cursor: default;
}
[data-tooltip]::before {
	content: attr(data-tooltip);
	position: absolute;
	bottom: calc(100% + 6px);
	left: 50%;
	transform: translateX(-50%);
	background: #1a1a2e;
	color: #fff;
	font-size: .78rem;
	padding: .3rem .65rem;
	border-radius: var(--radius-sm);
	white-space: nowrap;
	pointer-events: none;
	opacity: 0;
	transition: opacity var(--transition);
	z-index: 300;
}
[data-tooltip]::after {
	content: '';
	position: absolute;
	bottom: calc(100% + 1px);
	left: 50%;
	transform: translateX(-50%);
	border: 5px solid transparent;
	border-top-color: #1a1a2e;
	pointer-events: none;
	opacity: 0;
	transition: opacity var(--transition);
}
[data-tooltip]:hover::before,
[data-tooltip]:hover::after { opacity: 1; }

/* ── Spinner / Loader ────────────────────────────────────── */
.spinner {
	display: inline-block;
	width: 1.5rem;
	height: 1.5rem;
	border: 3px solid var(--color-border);
	border-top-color: var(--color-primary);
	border-radius: 50%;
	animation: spin .7s linear infinite;
	flex-shrink: 0;
}
.spinner--sm { width: 1rem;  height: 1rem;  border-width: 2px; }
.spinner--lg { width: 2.5rem; height: 2.5rem; border-width: 4px; }
.spinner-center {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: var(--sp-2xl);
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Docs / Features-Seite ──────────────────────────────── */
.docs-content .docs-section { padding: var(--sp-2xl) 0; border-bottom: 1px solid var(--color-border); }
.docs-content .docs-section:last-child { border-bottom: none; }
.docs-content h2 { margin-bottom: var(--sp-lg); }

/* ── Theme-Toggle-Button ─────────────────────────────────── */
.btn-theme {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	background: rgba(255,255,255,.1);
	border: 1px solid rgba(255,255,255,.15);
	border-radius: var(--radius);
	cursor: pointer;
	font-size: 1rem;
	line-height: 1;
	transition: background var(--transition);
	padding: 0;
	margin-left: var(--sp-sm);
	color: #fff;
}
.btn-theme:hover { background: rgba(255,255,255,.2); }

/* ── Lang-Switcher ───────────────────────────────────────── */
.nav-lang {
	display: flex;
	align-items: center;
	gap: 4px;
	margin-left: var(--sp-sm);
}
.nav-lang-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.75rem;
	height: 1.75rem;
	border-radius: var(--radius);
	transition: background var(--transition), transform var(--transition);
	text-decoration: none;
	opacity: .75;
}
.nav-lang-btn:hover {
	background: rgba(255,255,255,.15);
	opacity: 1;
	transform: scale(1.1);
	text-decoration: none;
}
.nav-lang-btn .flag { font-size: 1.1rem; }

/* ── Dark Mode ───────────────────────────────────────────── */
@media (prefers-color-scheme: dark) {
	:root:not([data-theme="light"]) {
		--color-bg:             #0f0f1a;
		--color-surface:        #1a1a2e;
		--color-border:         #2a2a45;
		--color-text:           #dde2f0;
		--color-text-muted:     #8892a8;
		--color-heading:        #f0f4ff;
		--color-primary:        #7986cb;
		--color-primary-dark:   #9fa8da;
		--color-primary-light:  #c5cae9;
		--nav-bg:               #0a0a16;
		--shadow-sm: 0 1px 3px rgba(0,0,0,.4);
		--shadow:    0 2px 8px rgba(0,0,0,.5);
		--shadow-lg: 0 6px 24px rgba(0,0,0,.6);
	}
}
[data-theme="dark"] {
	--color-bg:             #0f0f1a;
	--color-surface:        #1a1a2e;
	--color-border:         #2a2a45;
	--color-text:           #dde2f0;
	--color-text-muted:     #8892a8;
	--color-heading:        #f0f4ff;
	--color-primary:        #7986cb;
	--color-primary-dark:   #9fa8da;
	--color-primary-light:  #c5cae9;
	--nav-bg:               #0a0a16;
	--shadow-sm: 0 1px 3px rgba(0,0,0,.4);
	--shadow:    0 2px 8px rgba(0,0,0,.5);
	--shadow-lg: 0 6px 24px rgba(0,0,0,.6);
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) code { background: #1e2040; color: var(--color-primary-light); } }
[data-theme="dark"] code { background: #1e2040; color: var(--color-primary-light); }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) blockquote { background: #141428; } }
[data-theme="dark"] blockquote { background: #141428; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) th { background: #1e1e35; } }
[data-theme="dark"] th { background: #1e1e35; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) tr:hover td { background: #1a1a30; } }
[data-theme="dark"] tr:hover td { background: #1a1a30; }
@media (prefers-color-scheme: dark) {
	:root:not([data-theme="light"]) .badge--neutral { background: #2a2a45; color: #a8b0c8; }
	:root:not([data-theme="light"]) .flash--success, :root:not([data-theme="light"]) .alert--success { background: #0d2e1a; color: #86efac; border-color: #166534; }
	:root:not([data-theme="light"]) .flash--danger,  :root:not([data-theme="light"]) .alert--danger,
	:root:not([data-theme="light"]) .flash--error,   :root:not([data-theme="light"]) .alert--error   { background: #2d0d0d; color: #fca5a5; border-color: #991b1b; }
	:root:not([data-theme="light"]) .flash--warning, :root:not([data-theme="light"]) .alert--warning { background: #2d1f00; color: #fde68a; border-color: #92400e; }
	:root:not([data-theme="light"]) .flash--info,    :root:not([data-theme="light"]) .alert--info    { background: #0d1f3d; color: #93c5fd; border-color: #1e40af; }
	:root:not([data-theme="light"]) .accordion-header { background: #1e1e35; color: var(--color-text); }
	:root:not([data-theme="light"]) .accordion-header:hover { background: #252542; }
	:root:not([data-theme="light"]) .card-header,
	:root:not([data-theme="light"]) .card-footer { background: #1e1e35; color: var(--color-text-muted); }
	:root:not([data-theme="light"]) .page-item.disabled span { background: #1a1a2e; color: var(--color-text-muted); border-color: var(--color-border); }
}
[data-theme="dark"] .badge--neutral { background: #2a2a45; color: #a8b0c8; }
[data-theme="dark"] .flash--success, [data-theme="dark"] .alert--success { background: #0d2e1a; color: #86efac; border-color: #166534; }
[data-theme="dark"] .flash--danger,  [data-theme="dark"] .alert--danger,
[data-theme="dark"] .flash--error,   [data-theme="dark"] .alert--error   { background: #2d0d0d; color: #fca5a5; border-color: #991b1b; }
[data-theme="dark"] .flash--warning, [data-theme="dark"] .alert--warning { background: #2d1f00; color: #fde68a; border-color: #92400e; }
[data-theme="dark"] .flash--info,    [data-theme="dark"] .alert--info    { background: #0d1f3d; color: #93c5fd; border-color: #1e40af; }
[data-theme="dark"] .accordion-header { background: #1e1e35; color: var(--color-text); }
[data-theme="dark"] .accordion-header:hover { background: #252542; }
[data-theme="dark"] .card-header,
[data-theme="dark"] .card-footer { background: #1e1e35; color: var(--color-text-muted); }
[data-theme="dark"] .page-item.disabled span { background: #1a1a2e; color: var(--color-text-muted); border-color: var(--color-border); }

/* ── Responsive Ergänzungen ──────────────────────────────── */
@media (max-width: 900px) {
	.layout-with-sidebar,
	.layout-with-sidebar--right { grid-template-columns: 1fr; }
	.sidebar { position: static; }
}

/* ── Flags ───────────────────────────────────────────────── */
/*
 * Verwendung: <span class="flag flag--de" aria-label="Deutsch"></span>
 * Sprachdateien generieren: npx bifrost flags
 * oder: npx bifrost flags --codes de,en,fr,es --out public/css/flags.css
 */
.flag {
	display: inline-block;
	width: 1.333em;
	height: 1em;
	background: no-repeat center / contain;
	vertical-align: middle;
	border-radius: 2px;
	overflow: hidden;
	flex-shrink: 0;
}
`,

		'public/js/app.js': `/* ============================================================
   Bifröst UI — Vanilla JS für interaktive Komponenten
   Keine externen Abhängigkeiten | ESM-fähig
   ============================================================ */

/* ── Tabs ────────────────────────────────────────────────── */
document.querySelectorAll('[data-tabs]').forEach(($root) => {
	const tabBtns   = $root.querySelectorAll('.tab-btn, .tab-item a');
	const tabPanels = $root.querySelectorAll('.tab-panel');

	const activate = ($btn) => {
		const target = $btn.dataset.tab || $btn.getAttribute('href')?.replace('#', '');
		tabBtns.forEach($b => {
			$b.classList.remove('active');
			$b.closest('li')?.classList.remove('active');
		});
		$btn.classList.add('active');
		$btn.closest('li')?.classList.add('active');
		tabPanels.forEach($p => $p.classList.toggle('active', $p.id === target));
	};

	tabBtns.forEach($btn => {
		$btn.addEventListener('click', ($e) => {
			$e.preventDefault();
			activate($btn);
		});
	});

	if (tabBtns[0]) activate(tabBtns[0]);
});

/* ── Dropdown ────────────────────────────────────────────── */
document.querySelectorAll('[data-dropdown]').forEach(($trigger) => {
	const $menu = $trigger.nextElementSibling;
	if (!$menu?.classList.contains('dropdown-menu')) return;

	$trigger.addEventListener('click', ($e) => {
		$e.stopPropagation();
		const isOpen = $menu.classList.toggle('open');
		$trigger.setAttribute('aria-expanded', isOpen);
	});
});

document.addEventListener('click', () => {
	document.querySelectorAll('.dropdown-menu.open').forEach($m => {
		$m.classList.remove('open');
		$m.previousElementSibling?.setAttribute('aria-expanded', 'false');
	});
});

/* ── Background Canvas (Cursor Glow) ─────────────────── */
(function () {
	const canvas = document.getElementById('bg-canvas');
	if (!canvas) return;
	const ctx = canvas.getContext('2d');

	const EASE      = 0.08;
	const GLOW_R    = 380;
	const isTouchOnly = window.matchMedia('(pointer: coarse)').matches;

	let W = 0, H = 0;
	let mx = -9999, my = -9999, cx = -9999, cy = -9999;

	function isDark() {
		return document.documentElement.dataset.theme === 'dark'
			|| (document.documentElement.dataset.theme !== 'light'
				&& window.matchMedia('(prefers-color-scheme: dark)').matches);
	}

	function resize() {
		const dpr = window.devicePixelRatio || 1;
		W = window.innerWidth;
		H = window.innerHeight;
		canvas.width  = W * dpr;
		canvas.height = H * dpr;
		ctx.scale(dpr, dpr);
	}

	function draw() {
		ctx.clearRect(0, 0, W, H);

		if (cx > -1000) {
			const glowColor = isDark() ? 'rgba(121,134,203,0.22)' : 'rgba(99,102,241,0.13)';
			const glowFade  = isDark() ? 'rgba(121,134,203,0.04)' : 'rgba(99,102,241,0.02)';
			const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, GLOW_R);
			grad.addColorStop(0,   glowColor);
			grad.addColorStop(0.5, glowFade);
			grad.addColorStop(1,   'transparent');
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, W, H);
		}

		cx += (mx - cx) * EASE;
		cy += (my - cy) * EASE;

		requestAnimationFrame(draw);
	}

	resize();
	window.addEventListener('resize', resize, { passive: true });

	if (!isTouchOnly) {
		document.addEventListener('mousemove', ($e) => {
			mx = $e.clientX;
			my = $e.clientY;
		}, { passive: true });
	}

	draw();

	// Muster wechseln: BifrostPattern.set('grid') | 'dots' | 'scanlines' | 'diamond' | 'mychg' | 'none'
	window.BifrostPattern = {
		set($name) {
			const el = document.getElementById('bg-pattern');
			if (el) el.className = \`pattern--\${$name}\`;
		},
	};
}());

/* ── Accordion ───────────────────────────────────────────── */
document.querySelectorAll('.accordion-header').forEach(($btn) => {
	$btn.addEventListener('click', () => {
		const $body = $btn.nextElementSibling;
		const isOpen = $body.classList.toggle('open');
		$btn.classList.toggle('open', isOpen);
		$btn.setAttribute('aria-expanded', isOpen);
	});
});

/* ── Modal ───────────────────────────────────────────────── */
const openModal = ($id) => {
	const $overlay = document.querySelector(\`[data-modal="\${$id}"]\`);
	if (!$overlay) return;
	$overlay.classList.add('open');
	document.body.style.overflow = 'hidden';
	$overlay.querySelector('.modal-close, [data-modal-close]')
		?.focus();
};

const closeModal = ($id) => {
	const $overlay = document.querySelector(\`[data-modal="\${$id}"]\`);
	if (!$overlay) return;
	$overlay.classList.remove('open');
	document.body.style.overflow = '';
};

/* Trigger: <button data-modal-open="my-modal"> */
document.querySelectorAll('[data-modal-open]').forEach($btn => {
	$btn.addEventListener('click', () => openModal($btn.dataset.modalOpen));
});

/* Schließen via .modal-close oder Klick auf Overlay */
document.querySelectorAll('.modal-overlay').forEach($overlay => {
	$overlay.addEventListener('click', ($e) => {
		if ($e.target === $overlay) closeModal($overlay.dataset.modal);
	});
	$overlay.querySelector('.modal-close, [data-modal-close]')
		?.addEventListener('click', () => closeModal($overlay.dataset.modal));
});

/* Escape-Taste schließt offene Modals */
document.addEventListener('keydown', ($e) => {
	if ($e.key !== 'Escape') return;
	document.querySelectorAll('.modal-overlay.open').forEach($o => {
		closeModal($o.dataset.modal);
	});
});

/* ── Treeview ────────────────────────────────────────────── */
document.querySelectorAll('.treeview-caret').forEach($caret => {
	$caret.addEventListener('click', () => {
		$caret.classList.toggle('open');
		$caret.nextElementSibling?.classList.toggle('open');
	});
});

/* ── Slideshow / Carousel ────────────────────────────────── */
const nextSlide = ($btn) => {
	const $slideshow = $btn.closest('.slideshow');
	const $slides = $slideshow.querySelectorAll('.slide');
	let activeIdx = Array.from($slides).findIndex(s => s.classList.contains('active'));
	if(activeIdx === -1) return;
	$slides[activeIdx].classList.remove('active');
	$slides[activeIdx].classList.add('out');
	setTimeout(() => $slides[activeIdx].classList.remove('out'), 800);
	let nextIdx = (activeIdx + 1) % $slides.length;
	$slides[nextIdx].classList.add('active');
};
const prevSlide = ($btn) => {
	const $slideshow = $btn.closest('.slideshow');
	const $slides = $slideshow.querySelectorAll('.slide');
	let activeIdx = Array.from($slides).findIndex(s => s.classList.contains('active'));
	if(activeIdx === -1) return;
	$slides[activeIdx].classList.remove('active');
	$slides[activeIdx].classList.add('out');
	setTimeout(() => $slides[activeIdx].classList.remove('out'), 800);
	let nextIdx = (activeIdx - 1 + $slides.length) % $slides.length;
	$slides[nextIdx].classList.add('active');
};

document.querySelectorAll('.slideshow-nav--prev').forEach($btn => {
	$btn.addEventListener('click', () => prevSlide($btn));
});
document.querySelectorAll('.slideshow-nav--next').forEach($btn => {
	$btn.addEventListener('click', () => nextSlide($btn));
});

/* Öffentliche API */
window.BifrostUI = { openModal, closeModal, nextSlide, prevSlide };

/* ── Theme Toggle ──────────────────────────────────────────── */
const $themeToggle = document.getElementById('theme-toggle');
if ($themeToggle) {
	const updateIcon = () => {
		const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
			|| (document.documentElement.getAttribute('data-theme') == null
				&& window.matchMedia('(prefers-color-scheme: dark)').matches);
		$themeToggle.textContent = isDark ? '☀️' : '🌙';
	};

	$themeToggle.addEventListener('click', () => {
		const current = document.documentElement.getAttribute('data-theme');
		const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		const isDark = current === 'dark' || (current == null && systemDark);
		const next = isDark ? 'light' : 'dark';
		document.documentElement.setAttribute('data-theme', next);
		localStorage.setItem('bifrost-theme', next);
		updateIcon();
	});

	updateIcon();
}
`,

		'public/js/features.js': `/* ============================================================
   Bifröst Features/Docs — Seiten-spezifisches JS
   Scroll-Spy + Smooth-Scroll für Sidebar-Navigation
   ============================================================ */

/* ── Scroll-Spy ──────────────────────────────────────────── */
const $sections = document.querySelectorAll('.docs-section');
const $navLinks = document.querySelectorAll('.docs-nav a[href^="#"]');

if ($sections.length && $navLinks.length) {
	const spy = new IntersectionObserver(($entries) => {
		$entries.forEach(($e) => {
			if (!$e.isIntersecting) return;
			$navLinks.forEach($l => $l.closest('li')?.classList.remove('active'));
			document.querySelector(\`.docs-nav a[href="#\${$e.target.id}"]\`)
				?.closest('li')?.classList.add('active');
		});
	}, { rootMargin: '-15% 0px -75% 0px' });
	$sections.forEach($s => spy.observe($s));

	/* ── Smooth-Scroll ── */
	$navLinks.forEach(($a) => {
		$a.addEventListener('click', ($e) => {
			$e.preventDefault();
			document.querySelector($a.getAttribute('href'))
				?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	});
}
`,

		'public/js/theme-init.js': `/* ── Bifröst Theme — Early Init (kein defer, kein FOUC) ───── */
(function () {
	const $saved = localStorage.getItem('bifrost-theme');
	if ($saved === 'dark' || $saved === 'light') {
		document.documentElement.setAttribute('data-theme', $saved);
	}
}());
`,

		// ── App-Einstiegspunkt ────────────────────────────────────────────────

		'package.json': `{
	"name": "meine-bifrost-app",
	"version": "0.1.0",
	"type": "module",
	"scripts": {
		"start": "node app.js",
		"dev":   "node --watch app.js"
	},
	"dependencies": {
		"bifrost": "latest"
	}
}
`,

		'app.js': `import { BifrostApp, I18n, NavRegistry } from 'bifrost';
import { fileURLToPath } from 'node:url';
import { join }          from 'node:path';

const __dir = fileURLToPath(new URL('.', import.meta.url));
const app   = new BifrostApp();

BifrostApp.configureViews({
	views:    join(__dir, 'mvc/views'),
	layouts:  join(__dir, 'mvc/views/layouts'),
	partials: join(__dir, 'mvc/views/partials'),
	cache:    process.env.NODE_ENV === 'production',
});

I18n.configure({
	dir:      join(__dir, 'i18n'),
	fallback: 'de',
});

BifrostApp.setLocales(['de', 'en', 'fr', 'es', 'it']);

await app.startup({
	port:            process.env.PORT || 3000,
	static:          'public',
	bodyParser:      true,
	responseHelpers: true,
	securityHeaders: true,
	liveReload:      true, // Auto-Refresh bei Änderungen (node --watch)
	rateLimit:       { points: 100, duration: 60 }, // trustProxy: true hinter nginx/Caddy
});

await app.loadControllers(join(__dir, 'mvc/controllers'));

// NavRegistry — Footer-Links registrieren
NavRegistry.register('footer', { slug: '/imprint', lang: 'nav.imprint', order: 1 });

app.setErrorHandler(404, async ($req, $res) => {
	$res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
	$res.end('<h1>404 — Nicht gefunden</h1>');
});

await app.run();
`,
	},
};