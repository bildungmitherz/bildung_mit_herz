# URL Redirect Map — Bildung mit Herz Sierra Leone e.V.

**Datum:** 12. Oktober 2026  
**Zielsystem:** Cloudflare Pages `_redirects` Format  
**Regel:** 301 Permanent Redirects für alle bisherigen Pfade zur Bewahrung des SEO-Rangs  

---

## 1. Weiterleitungs-Mapping (Jimdo → Cloudflare Pages)

| Originale Jimdo-URL | Neuer Pfad auf Cloudflare Pages | HTTP-Status | Grund / Bemerkung |
|---|---|---|---|
| `/` | `/` | 200 | Startseite (unverändert) |
| `/ueber-uns/` | `/ueber-uns/` | 200 / 301 | Über uns Seite erhalten |
| `/projekte/` | `/projekte/` | 200 / 301 | Projektübersicht erhalten |
| `/projekte/mamoru/` | `/projekte/mamoru/` | 200 / 301 | Mamoru Detailseite |
| `/projekte/mafabaneh/` | `/projekte/mafabaneh/` | 200 / 301 | Mafabaneh Detailseite |
| `/projekte/madina/` | `/projekte/madina/` | 200 / 301 | Madina Detailseite |
| `/bildungsreisen/` | `/bildungsreisen/` | 200 / 301 | Bildungsreisen Hauptseite |
| `/bildungsreisen/reiseberichte/` | `/bildungsreisen/reiseberichte/` | 200 / 301 | Reiseberichte Detailseite |
| `/spenden/` | `/spenden/` | 200 / 301 | Spendenübersicht & Bankkonto |
| `/impressum/` | `/impressum/` | 200 / 301 | Rechtliches Impressum |
| `/datenschutz/` | `/datenschutz/` | 200 / 301 | Datenschutzerklärung |
| `/widerruf/` | `/widerruf/` | 200 / 301 | Widerrufsbelehrung |
| `/cookie-einstellungen/` | `/datenschutz/` | 301 | Entfällt (Site setzt keine Tracking-Cookies mehr) |
| `/home/` | `/` | 301 | Normalisierung auf Root |
| `/projekte/kappr-yoni/` | `/projekte/mafabaneh/` | 301 | Alias für Mafabaneh Learning Hub |
| `/fuer-unternehmen/` | `/fuer-unternehmen/` | 200 | Neue Unternehmens-Landingpage |
| `/transparenz/` | `/transparenz/` | 200 | Neue Transparenz-Seite |

---

## 2. Cloudflare Pages `_redirects` Spezifikation

Die Datei `_redirects` wird beim Build automatisch in den Root des Ausgabeverzeichnisses generiert:

```text
# Cloudflare Pages Redirects
/cookie-einstellungen/   /datenschutz/   301
/cookie-einstellungen   /datenschutz/   301
/home/                  /               301
/home                   /               301
/projekte/kappr-yoni/   /projekte/mafabaneh/ 301
/projekte/kappr-yoni    /projekte/mafabaneh/ 301

# Canonical Trailing Slash Normalization
/ueber-uns              /ueber-uns/     301
/projekte               /projekte/      301
/spenden                /spenden/       301
/impressum              /impressum/     301
/datenschutz            /datenschutz/   301
/bildungsreisen         /bildungsreisen/ 301
/fuer-unternehmen       /fuer-unternehmen/ 301
/transparenz            /transparenz/   301
```
