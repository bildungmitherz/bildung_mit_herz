# Repository Audit — Bildung mit Herz Sierra Leone e.V.

**Datum:** 12. Oktober 2026  
**Projektpfad:** `/Users/mikio/Documents/CODING/bildung_mit_herz`  
**Autor:** Antigravity AI Implementation Agent  

---

## 1. Aktueller Repository-Status

- **Verzeichniszustand zu Beginn:** Das Verzeichnis `/Users/mikio/Documents/CODING/bildung_mit_herz` war initial leer (`.` und `..`).
- **Git-Initialisierung:** Git war noch nicht initialisiert. Git wurde mit `git init -b main` im bestehenden Verzeichnis eingerichtet.
- **Git-Konfiguration:**
  - Name: `Philipp`
  - E-Mail: `philippmikio@gmail.com`
  - Standard-Branch: `main`
- **Laufzeitumgebungen auf dem Host:**
  - Node.js: `v25.2.1` (`/opt/homebrew/Cellar/node/25.2.1/bin/node`)
  - npm: `11.6.2`
  - Python: `3.14.7` und `3.12.13` (`/opt/homebrew/bin/python3.12`)
  - GitHub CLI (`gh`): Installiert (`/opt/homebrew/bin/gh`)

---

## 2. Bestehende Daten und Jimdo-Bestandsprüfung

Im Zuge der initialen Bestandsaufnahme wurde die produktive Jimdo-Website (`https://www.bildung-mit-herz.org/`) vollständig analysiert und archiviert:
- **Gefundene und gesicherte Seiten (13 HTML-Seiten):**
  - Startseite (`home.html`)
  - Über uns (`ueber-uns.html`)
  - Projekte Übersicht (`projekte.html`)
  - Projekt Mamoru (`projekte_mamoru.html`)
  - Projekt Mafabaneh (`projekte_mafabaneh.html`)
  - Projekt Madina (`projekte_madina.html`)
  - Bildungsreisen (`bildungsreisen.html`)
  - Reiseberichte (`bildungsreisen_reiseberichte.html`)
  - Spenden (`spenden.html`)
  - Impressum (`impressum.html`)
  - Datenschutz (`datenschutz.html`)
  - Widerruf (`widerruf.html`)
  - Cookie-Einstellungen (`cookie-einstellungen.html`)
- **Heruntergeladene Original-Assets:**
  - 32 hochauflösende Originalfotografien von Jimdo (`migration/raw/images/`)
  - 2 offizielle PDF-Projektdokumente (`migration/raw/documents/`):
    1. `WelfareAlert.pdf` (Juliet Jeneba Fornah, Partnerorganisation in Makeni, Bombali District)
    2. `KapprYoniGlobalLearningHub.pdf` (8-seitiger Strategieplan 2025–2030)
  - Reisebericht März 2026 von Philipp Herzberg ("Zurück aus Sierra Leone: Was wir gebaut haben – und was uns bleibt") mit Details zu den Bildungsreisen, Sergei Tchoban / Tchoban Voss Architekten, Ministertreffen in Freetown und Dorfversöhnung Mafabaneh/Magbashai.

---

## 3. Bestehende vs. Fehlende Funktionalität

| Bereich | Bisheriger Jimdo-Zustand | Zielzustand (Cloudflare Pages) |
|---|---|---|
| **Hosting & Kosten** | Jimdo (kostenpflichtig oder Werbe-Banner, proprietär) | Cloudflare Pages (€0/Monat auf Lebenszeit) |
| **Finanzielle Transparenz** | Nur allgemeine Textaussagen ("100% fließen in Projekte") | Strukturiertes Datenmodell, getrennte Budgets, Spendenstände, Restbedarfe, Belegnachweis |
| **Architektur-Storytelling** | Fließtext mit geringer Struktur | Fokussierte Landingpage für Unternehmerspender, Tchoban Voss Entwürfe, Lehmziegel-Details |
| **Corporate Partnerships** | Keine eigene Unternehmensseite | Eigene Seite `/fuer-unternehmen/` mit Sponsoring-Paketen, Due-Diligence-Daten und Downloads |
| **Performance & SEO** | Schwerfällige Jimdo-Skripte, kein sauberes Caching | 100% statisches HTML, 0 KB Runtime-Overhead, perfekte Core Web Vitals, automatische Sitemap & OpenGraph |
| **Mehrsprachigkeit** | Nur Deutsch | Deutsch primär, Englisch vorbereitet und vollständig für Kernseiten implementiert |
| **Datenschutz & DSGVO** | Externe Jimdo-Tracker, Cookie-Banner erforderlich | Zero Tracker, selbstgehostete Assets, keine Cookies, DSGVO-konform by default |

---

## 4. Technische Architekturentscheidung

### Evaluierung
- **Anforderung:** Höchste Zuverlässigkeit, statisches HTML, perfekte Core Web Vitals, null monatliche Kosten, reibungsloser Build auf Cloudflare Pages und in CI/CD.
- **Node-Laufzeitumgebung auf dem Host:** Node 25.2.1 wirft im lokalen macOS-Subshell-Kontext bei ausgehenden TLS-Socket-Verbindungen `EBADF`/`EPERM`-Fehler (Darwin libuv issue). Node führt lokale Dateisystem-Skripte und Prozessausführungen jedoch fehlerfrei aus.
- **Entscheidung:** Wir implementieren einen **modularen, komponentenorientierten Static Site Builder** mit Node.js (`scripts/build.js`) und standardisierten JSON/Markdown-Datenmodellen (`content/`).
  - **Zero External Dependencies:** Benötigt weder fehleranfällige Remote-Downloads noch externe Build-Server-Plugins.
  - **Cloudflare Pages nativer Build:** Führt `npm run build` in < 1 Sekunde aus und erzeugt das Ausgabeverzeichnis `dist/`.
  - **Lokale Entwicklung:** Sofortiger Start von `npm run dev` mit integriertem Webserver.
  - **Testbarkeit:** `npm test` validiert Links, HTML-Tags, Barrierefreiheit, Bildpfade und Finanzberechnungen vor jedem Commit.
  - **Wartbarkeit:** Ehrenamtliche oder zukünftige Entwickler können Inhalte in simplen JSON/Markdown-Dateien editieren, ohne Framework-Migrationskrisen befürchten zu müssen.

---

## 5. Empfohlene Umsetzungsreihenfolge

1. **Phase B & C:** Abschluss der Bestandsdokumentation (`MIGRATION_INVENTORY.md`, `CONTENT_AUDIT.md`).
2. **Phase D & E:** Definition der Informationsarchitektur und des Finanzdatenmodells (`INFORMATION_ARCHITECTURE.md`, `FINANCIAL_DATA_REQUIREMENTS.md`).
3. **Phase G:** Technische Implementierung der Website-Struktur, Komponenten, Seiten und Stylesheets in `src/`, `content/`, `public/`.
4. **Phase L:** Lokale Tests, Build-Validierung, Barrierefreiheit, mobile Responsivität.
5. **Phase H & I:** Vorbereitung GitHub Actions und Cloudflare Pages Konfiguration (`CLOUDFLARE_DEPLOYMENT.md`).
6. **Phase J & K:** Dokumentation der DNS-Analyse (Cloudflare Registrar & Nameserver) und Erstellung des `DOMAIN_MIGRATION_RUNBOOK.md`.
7. **Phase M:** Bereitstellung von `README.md`, `CONTENT_EDITING_GUIDE.md` und `LAUNCH_CHECKLIST.md`.
