# Migration Inventory — Bildung mit Herz Sierra Leone e.V.

**Datum:** 12. Oktober 2026  
**Quelle:** `https://www.bildung-mit-herz.org/` (Jimdo)  
**Ziel:** Cloudflare Pages Static Site  

---

## 1. Übersicht der gesicherten Seiten (Crawl-Ergebnis)

Alle Seiten wurden vollständig lokal im Verzeichnis `migration/raw/pages/` als rohe HTML-Dateien sowie in `migration/normalized-content/` als strukturiertes Markdown gesichert.

| Original-URL auf Jimdo | Lokale Rohdatei | Neuer Pfad | Migrationsstatus |
|---|---|---|---|
| `https://www.bildung-mit-herz.org/` | `home.html` | `/` (Startseite) | Gesichert & normalisiert |
| `https://www.bildung-mit-herz.org/ueber-uns/` | `ueber-uns.html` | `/ueber-uns/` | Gesichert & normalisiert |
| `https://www.bildung-mit-herz.org/projekte/` | `projekte.html` | `/projekte/` | Gesichert & normalisiert |
| `https://www.bildung-mit-herz.org/projekte/mamoru/` | `projekte_mamoru.html` | `/projekte/mamoru/` | Gesichert & normalisiert |
| `https://www.bildung-mit-herz.org/projekte/mafabaneh/` | `projekte_mafabaneh.html` | `/projekte/mafabaneh/` | Gesichert & normalisiert |
| `https://www.bildung-mit-herz.org/projekte/madina/` | `projekte_madina.html` | `/projekte/madina/` | Gesichert & normalisiert |
| `https://www.bildung-mit-herz.org/bildungsreisen/` | `bildungsreisen.html` | `/bildungsreisen/` | Gesichert & normalisiert |
| `https://www.bildung-mit-herz.org/bildungsreisen/reiseberichte/` | `bildungsreisen_reiseberichte.html` | `/bildungsreisen/reiseberichte/` | Gesichert & normalisiert |
| `https://www.bildung-mit-herz.org/spenden/` | `spenden.html` | `/spenden/` | Gesichert & normalisiert |
| `https://www.bildung-mit-herz.org/impressum/` | `impressum.html` | `/impressum/` | Gesichert & normalisiert |
| `https://www.bildung-mit-herz.org/datenschutz/` | `datenschutz.html` | `/datenschutz/` | Gesichert & modernisiert |
| `https://www.bildung-mit-herz.org/widerruf/` | `widerruf.html` | `/widerruf/` | Gesichert |
| `https://www.bildung-mit-herz.org/cookie-einstellungen/` | `cookie-einstellungen.html` | *(entfällt, da keine Cookies gesetzt werden)* | Archiviert |

---

## 2. Inventar der gesicherten Dokumente

Gespeichert unter `migration/raw/documents/` und bereitgestellt in `public/assets/documents/`:

1. **`WelfareAlert.pdf`** (714.724 Bytes)
   - **Titel:** Welfare Alert Sierra Leone (WA-SL) Profile
   - **Partnerin:** Juliet Jeneba Fornah (Mrs.), Director and Founder
   - **Sitz:** 13 Yaide Street, Makeni, Sierra Leone
   - **Registrierung:** Ministry of Gender and Children’s Affairs, Ministry of Basic and Secondary Education, Bombali District Council
   - **Inhalt:** Selbstdarstellung der Partnerorganisation für das Projekt Mamoru.

2. **`KapprYoniGlobalLearningHub.pdf`** (507.535 Bytes)
   - **Titel:** Kaprr Yoni Global Learning Hub — Full Strategic Plan (2025–2030)
   - **Motto:** "Learning Across Borders — Together in Knowledge and Kindness"
   - **Umfang:** 8 Seiten
   - **Inhalt:** Leitbild, Governance, Umweltprogramm ("One Tree Per Participant"), Monitoring- und Evaluierungsrahmen, Finanz- und Risikoplan für das Leuchtturmprojekt in Mafabaneh.

---

## 3. Inventar der gesicherten Bildmedien

32 Originalfotografien wurden aus dem Jimdo-CDN in maximaler Auflösung (bis zu 1600px Breite) heruntergeladen und liegen in `migration/raw/images/`.

### Zuordnung der wichtigsten Motive:
- **Logo:** `544513245_70039751-861f-4091-aad5-b31533bc7676.png` — Offizielles Verbandslogo mit Herz- und Bildungsicon.
- **Mamoru Baufortschritt:**
  - Grundschule Außenansicht (Mauerwerk, Dachstuhl, 5 Klassenzimmer)
  - Schülerinnen und Schüler im Klassenzimmer mit Schulbänken
  - Juliet Fornah und Lehrerteam
- **Mafabaneh Projektvorbereitung:**
  - Traditionelle Ziegelherstellung aus lokalem Lehm (2.000 Ziegel)
  - Versammlung der Ältesten beider Dörfer (Mafabaneh und Magbashai)
  - Lageplan und Baugelände
- **Madina Gelände & Gemeinschaft:**
  - Begrüßung der Reisegruppe durch die Dorfgemeinschaft
  - Schüler vor dem Bauplatz
- **Bildungsreisen & Menschen:**
  - Reiseerlebnisse in Masingbi (Gästehaus der Familie Sesay)
  - Gruppenfotos der Teilnehmenden (Lehrer, Eltern, Schüler)

---

## 4. Externe Links und Kanäle

Folgende verifizierte externe Kanäle wurden auf der aktuellen Website ermittelt:
- **Instagram:** `https://www.instagram.com/bildung.mit.herz/`
- **LinkedIn:** `https://www.linkedin.com/company/bildung-mit-herz-sierra-leone-ev/`
- **YouTube:** `https://www.youtube.com/@bildung-mit-herz-sierra-leone`
- **Facebook:** `https://www.facebook.com/people/Bildung-Mit-Herz-Sierra-Leone-eV/61586834742075/`
- **TikTok:** `https://www.tiktok.com/@bildung.mit.herz`
- **WhatsApp-Kanal:** `https://whatsapp.com/channel/0029VbCQ7Tc6WaKsOkpd120h`
- **Substack (Reiseberichte & Dokumentation):** `https://philippherzberg.substack.com/p/zuruck-aus-sierra-leone-was-wir-gebaut`
- **Linktree:** `https://linktr.ee/bildung.mit.herz`
