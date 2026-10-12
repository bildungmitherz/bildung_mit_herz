# Domain Migration Runbook — bildung-mit-herz.org

**Datum:** 12. Oktober 2026  
**Status:** Verifiziert & Bereit zur Freigabe  
**Ziel:** Sichere Umschaltung von Jimdo auf Cloudflare Pages ohne Ausfallzeit oder E-Mail-Risiko  

---

## 1. Verifizierter Ist-Zustand (Beweise aus RDAP & DNS)

Durch eine detaillierte technische Analyse der Registrierungs- und DNS-Zonendaten wurden folgende Fakten festgestellt:

1. **Registrar (Domain-Registrierungsstelle):**  
   - **Cloudflare, Inc.** (bereits bei Cloudflare registriert!)
   - Registrierungsdatum: 12. März 2026
   - Ablaufdatum: 12. März 2027
   - Status: `clientTransferProhibited` (Standard-Sicherheitssperre)
2. **Autoritative Nameserver:**  
   - `amalia.ns.cloudflare.com`
   - `viddy.ns.cloudflare.com`
   - **Die DNS-Zone liegt bereits vollumfänglich bei Cloudflare!**
3. **Bestehendes Web-Routing:**  
   - `www.bildung-mit-herz.org` → `CNAME` auf `bildung-mit-herz-sierra-leone-3.jimdosite.com.`
   - `bildung-mit-herz.org` (Apex) → `A`-Records auf `162.159.129.70`, `162.159.128.70` (Cloudflare Proxy / Jimdo Weiterleitung).
4. **E-Mail-Routing (MX & TXT):**  
   - Auf `bildung-mit-herz.org` existieren **keine** MX- oder E-Mail-TXT-Records.
   - Der Verein nutzt die verifizierte Google-Mail-Adresse `bmh.sierraleone@gmail.com`.
   - **Risiko für laufenden E-Mail-Verkehr: 0%.** Es existieren keine verknüpften Mailserver, die durch die Web-Migration gestört werden könnten.

---

## 2. Strategische Entscheidung: Kein Domain-Transfer erforderlich

Da die Domain **bereits bei Cloudflare registriert ist** und die Nameserver bereits auf Cloudflare zeigen:
- **Kein Registrar-Transfer erforderlich.**
- **Keine Nameserver-Änderung erforderlich.**
- **Keine Transfer- oder Migrationsgebühren (€0).**

Die gesamte Migration erfolgt innerhalb des bestehenden Cloudflare-Accounts über das Cloudflare Pages Dashboard.

---

## 3. Schritt-für-Schritt Cutover-Anleitung (Nur nach Freigabe!)

### Phase 1: Staging-Validierung (Vor der Umschaltung)
1. Die neue Website wird auf Cloudflare Pages aus dem GitHub-Repository gebaut.
2. Vorschau-URL aufrufen: `https://bildung-mit-herz.pages.dev`.
3. Vollständige Sicht- und Funktionsprüfung:
   - Alle Projektseiten (Mamoru, Mafabaneh, Madina) aufrufen.
   - Mobile Ansicht auf Smartphone / Responsive Design prüfen.
   - PDF-Downloads (`WelfareAlert.pdf`, `KapprYoniGlobalLearningHub.pdf`) testen.
   - Spenden- und IBAN-Daten überprüfen (`DE55100500000191572900`).
   - Impressum & Datenschutz auf Richtigkeit prüfen.

### Phase 2: Custom Domain in Cloudflare Pages einbinden
1. Im Cloudflare-Dashboard anmelden: `https://dash.cloudflare.com`.
2. Zu **Workers & Pages** navigieren und das Projekt `bildung-mit-herz` auswählen.
3. Den Reiter **Custom domains** aufrufen.
4. Auf **Set up a custom domain** klicken:
   - Domain eingeben: `www.bildung-mit-herz.org`
   - Cloudflare schlägt automatisch vor, den bestehenden Jimdo-CNAME durch den Cloudflare Pages Ziel-Hostname zu ersetzen. Bestätigen.
5. Zweiten Eintrag für die Apex-Domain hinzufügen:
   - Domain eingeben: `bildung-mit-herz.org`
   - Cloudflare richtet automatisch CNAME-Flattening bzw. die Weiterleitung von `bildung-mit-herz.org` auf `www.bildung-mit-herz.org` ein.
6. Das automatische SSL/TLS-Zertifikat wird von Cloudflare innerhalb von 5–15 Minuten ausgestellt.

### Phase 3: Verifikation nach dem Cutover
1. Im Browser `https://www.bildung-mit-herz.org` aufrufen (Cache mit `Cmd+Shift+R` leeren).
2. `https://bildung-mit-herz.org` aufrufen und automatische Weiterleitung auf `https://www.bildung-mit-herz.org` prüfen.
3. Test aller Legacy-Pfade (z.B. `/projekte/mamoru/`, `/spenden/`, `/ueber-uns/`).
4. SSL-Zertifikat im Browser prüfen (Cloudflare Origin / Universal SSL, gültig).

---

## 4. Rollback-Plan (Notfallplan)

Sollte wider Erwarten ein unvorhergesehenes Problem auftreten:
1. Im Cloudflare Dashboard unter **DNS** für `www.bildung-mit-herz.org` den CNAME wieder auf:  
   `bildung-mit-herz-sierra-leone-3.jimdosite.com` setzen.
2. Der Jimdo-Webauftritt ist während der gesamten Testphase unangetastet geblieben und schaltet sofort wieder zurück.
3. Die Jimdo-Kündigung sollte erst 14 Tage nach erfolgreichem, stabilem Betrieb von Cloudflare Pages erfolgen.
