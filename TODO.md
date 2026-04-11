# Bifröst v1.0.0 Release — Checkliste

Diese Liste führt dich durch den Test-Prozess deines eigenen CSS-Frameworks, bevor wir Version 1.0.0 veröffentlichen.

## 1. Eigene CSS-Dateien in Bifröst einbauen
- [ ] Wechsle per SSH in dein mycoder-Verzeichnis: `cd /home/mycoder/web/mycoder.eu/public/css/`
- [ ] Kopiere den Inhalt von `sz.css` und `szicons.css`.
- [ ] Wechsle zurück in das Bifröst-Verzeichnis: `cd /home/mycoder/web/bifrost/`
- [ ] Öffne die CLI-Datei `bin/bifrost.js`.
- [ ] Suche nach den Platzhaltern für `public/css/sz.css` und `public/css/szicons.css` (ca. bei Zeile 744).
- [ ] Ersetze den Platzhalter-Kommentar mit deinem kopierten CSS-Code.

## 2. Das neue CMS-Projekt zum Testen aufsetzen
- [ ] Erstelle einen neuen Ordner für dein neues CMS-Projekt: `mkdir /home/mycoder/web/bifrost-cms`
- [ ] Wechsle in den neuen Ordner: `cd /home/mycoder/web/bifrost-cms`
- [ ] Führe das Bifröst-CLI lokal aus, um das Projekt zu generieren:
      `node ../bifrost/bin/bifrost.js init`
- [ ] Prüfe, ob die Dateien `public/css/sz.css` und `public/css/szicons.css` korrekt generiert wurden.

## 3. Testen & Anpassen der Galdr-Templates
- [ ] Starte den Test-Server im CMS-Verzeichnis: `npm install bifrost` (oder den lokalen Pfad verlinken) und dann `node --watch app.js`.
- [ ] Öffne die Seite im Browser und prüfe das Design.
- [ ] **Optional:** Wenn Klassen nicht ganz passen, passe die Scaffolding-Templates (`home.galdr.html` etc.) in der `bin/bifrost.js` an deine SZ-Klassen an.

## 4. Finale (NPM Publish)
- [ ] Sobald dein CMS-Test einwandfrei läuft, ist Bifröst offiziell produktionsbereit.
- [ ] Kehre zurück zum Chat (oder öffne einen neuen) und frage nach den **Schritten für den NPM Publish**, um Version `1.0.0` weltweit verfügbar zu machen!