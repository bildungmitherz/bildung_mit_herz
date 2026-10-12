# Launch Checklist: Jimdo → Cloudflare Pages Migration

This checklist provides a structured, step-by-step verification protocol for the production launch of **Bildung mit Herz Sierra Leone e.V.** on Cloudflare Pages.

---

## Phase 1: Pre-Launch Content & Legal Verification

- [ ] **Bank Account Details:**
  - Verify IBAN `DE55 1005 0000 0191 5729 00` against current Sparkasse Berlin bank statement.
  - Verify account holder name: `Make Them Smile e.V.` (clear disclaimer on site explains pending name harmonization).
- [ ] ** Vereinsregister & Impressum:**
  - Registered name: *Make them smile / Bildung mit Herz Sierra Leone e. V.*
  - Register court: *Amtsgericht Charlottenburg (Berlin)*
  - Register number: *VR 41272 B*
  - Board representation (*Vertretungsberechtigter Vorstand*): Philipp Herzberg, Julian Götz, and team verified.
- [ ] **Tax Exemption Notice (*Gemeinnützigkeit*):**
  - Verify wording on donation receipts (*Zuwendungsbestätigungen*): Donations under €300 deductible with bank statement (*vereinfachter Zuwendungsnachweis*).
- [ ] **Partner Verification:**
  - Local partner attribution: Juliet Jeneba Fornah, Welfare Alert Sierra Leone (WA-SL), Makeni.
  - Architectural partner: Tchoban Voss Architekten (TVA Berlin) referenced accurately.
- [ ] **GDPR / DSGVO Compliance:**
  - Privacy policy (*Datenschutzerklärung*) accurately reflects zero-tracker, zero-cookie, zero-external-CDN static hosting.
  - Server log retention policy documented (Cloudflare edge minimal standard logging).

---

## Phase 2: Technical & Performance Verification

- [ ] **Automated Test Suite:**
  - Run `npm test` locally — confirm all **1,359 test assertions pass with 0 failures**.
- [ ] **Build Output:**
  - Run `npm run build` — confirm clean compilation in `dist/` in under 1 second.
- [ ] **Asset Integrity:**
  - All 32 project photographs load with 200 OK status.
  - Official project PDFs present in `dist/assets/documents/`:
    - `WelfareAlert.pdf` (WA-SL profile)
    - `KapprYoniGlobalLearningHub.pdf` (Strategic Plan 2025–2030)
- [ ] **Responsive Design & Accessibility:**
  - Tested across viewports: 320px (iPhone SE), 375px (standard mobile), 768px (tablet), 1024px, 1440px (desktop).
  - Navigation toggle functions smoothly with keyboard navigation (`Esc` key closes drawer).
  - Color contrast meets WCAG 2.2 AA standards (all text exceeds 4.5:1 ratio).
- [ ] **SEO & Metadata:**
  - JSON-LD structured data (`NGO` and `BreadcrumbList`) present on all pages.
  - OpenGraph social sharing meta tags configured.
  - `sitemap.xml` and `robots.txt` generated and accessible at root.

---

## Phase 3: Cloudflare Pages Staging Deployment

- [ ] **Connect GitHub to Cloudflare Pages:**
  - Repository: `philippmikio/bildung_mit_herz` (branch: `main`).
  - Build command: `npm run build`.
  - Build output directory: `dist`.
- [ ] **Verify Staging Preview:**
  - Access `https://<project-name>.pages.dev`.
  - Verify all 14 German routes and 10 English routes navigate without 404 errors.
  - Test legacy redirect handling in `dist/_redirects` on preview URL.

---

## Phase 4: Production DNS Cutover

> **Safety Reminder:** The apex domain `bildung-mit-herz.org` is already managed inside Cloudflare DNS. No registrar transfer is required.

- [ ] **Step 1: Set Custom Domains in Cloudflare Pages:**
  - In Cloudflare Pages project settings, add custom domain: `www.bildung-mit-herz.org`.
  - Add custom domain: `bildung-mit-herz.org`.
- [ ] **Step 2: Update DNS CNAME Record:**
  - In Cloudflare DNS for `bildung-mit-herz.org`:
  - Locate existing `CNAME` for `www` (currently pointing to `bildung-mit-herz-sierra-leone-3.jimdosite.com`).
  - Update target to: `<project-name>.pages.dev`.
  - Ensure Proxy Status is **Proxied (Orange Cloud)**.
- [ ] **Step 3: Configure Apex to www Redirect:**
  - Ensure root `@` points via CNAME flattening or Page Rule redirect to `https://www.bildung-mit-herz.org/`.
- [ ] **Step 4: Verify SSL/TLS Configuration:**
  - In Cloudflare SSL/TLS settings, ensure mode is **Full** or **Strict**.
  - Universal SSL certificate will be issued automatically within 5 minutes.

---

## Phase 5: Post-Launch Smoke Tests

- [ ] **Live DNS Resolution:**
  - Run `dig +short www.bildung-mit-herz.org` — confirm resolution to Cloudflare Anycast IPs.
- [ ] **Live HTTPS Navigation:**
  - Open `https://www.bildung-mit-herz.org/` in incognito browser.
  - Verify TLS certificate is active and valid.
- [ ] **Legacy Jimdo URL Redirects:**
  - Test `https://www.bildung-mit-herz.org/wir-über-uns/` → redirects to `https://www.bildung-mit-herz.org/ueber-uns/` (301).
  - Test `https://www.bildung-mit-herz.org/unsere-projekte/` → redirects to `https://www.bildung-mit-herz.org/projekte/` (301).
  - Test `https://www.bildung-mit-herz.org/bildungsreise/` → redirects to `https://www.bildung-mit-herz.org/bildungsreise/` (200).
- [ ] **Email Verification:**
  - Send test email to `bmh.sierraleone@gmail.com` to confirm zero disruption to organizational communications.

---

## Phase 6: Post-Launch Decommissioning & Cleanup

- [ ] **Monitoring Period:**
  - Monitor website traffic and error rates for 7 days post-cutover.
  - Keep Jimdo account active (dormant) during the 7-day observation window.
- [ ] **Jimdo Subscription Cancellation:**
  - Once live operations are completely stable, log in to Jimdo.
  - Export/download any remaining historical invoices or user data.
  - Cancel Jimdo subscription to permanently stop ongoing monthly/annual builder charges.
