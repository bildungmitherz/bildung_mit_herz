# Cloudflare Pages Deployment Guide — bildung-mit-herz

**Datum:** 12. Oktober 2026  
**Hosting-Plattform:** Cloudflare Pages (Free Tier: €0/Monat)  
**Git-Integration:** GitHub Native Integration  

---

## 1. Hosting-Parameter & Free-Tier Limits

| Parameter | Cloudflare Pages Limit | Projektbedarf Bildung mit Herz | Status |
|---|---|---|---|
| **Kosten** | €0 / Monat | €0 / Monat | Konform |
| **Builds pro Monat** | 500 Builds | ca. 10–30 Builds | Weit unter Limit |
| **Dateien pro Site** | 20.000 Dateien | < 200 Dateien | Weit unter Limit |
| **Max. Dateigröße** | 25 MiB pro Asset | Größtes Asset < 2 MiB | Weit unter Limit |
| **Bandbreite & Requests** | Unbegrenzt (Free Plan) | Statische Auslieferung | Optimal |
| **Custom Domains** | Bis zu 100 Domains | 2 Domains (`www` & Apex) | Voll abgedeckt |

---

## 2. Cloudflare Pages Konfigurationseinstellungen

Wenn das GitHub-Repository mit Cloudflare Pages verknüpft wird, sind folgende Build-Einstellungen im Dashboard einzutragen:

- **Project Name:** `bildung-mit-herz`
- **Production Branch:** `main`
- **Framework Preset:** `None` / `Node.js`
- **Build Command:** `npm run build`
- **Build Output Directory:** `dist`
- **Root Directory:** `/` (Standard)
- **Environment Variables:**
  - `NODE_VERSION`: `20` (oder `22` für maximale Stabilität in der Cloudflare Linux Build-Umgebung)

---

## 3. Deployment Flow

```text
Lokale Entwicklung (Mac)
         │  git commit
         ▼
Lokaler Feature- oder Main-Branch
         │  git push
         ▼
GitHub Repository (philippmikio/bildung_mit_herz)
         │  Automatischer Webhook
         ▼
Cloudflare Pages Build Runner
         │  npm run build (< 2 Sekunden)
         ▼
Verifikation: dist/ mit HTML, CSS, Bildern, _redirects, sitemap.xml
         │  Automatisches Edge-Deployment
         ▼
Cloudflare Staging URL (https://bildung-mit-herz.pages.dev)
         │  Manuelle finale Freigabe
         ▼
Produktionsdomains:
https://www.bildung-mit-herz.org
https://bildung-mit-herz.org
```

---

## 4. Rollback und Wiederherstellung

- **Sofortiges Rollback über Cloudflare:** Jeder Git-Push erzeugt ein eigenständiges Deployment mit permanenter Vorschau-URL. Ein Rollback auf ein früheres Deployment ist im Cloudflare Pages Dashboard mit einem Klick auf *„Rollback to this deployment“* ohne neuen Build in Millisekunden möglich.
