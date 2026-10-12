# Bildung mit Herz Sierra Leone e.V. — Modern Website & Static Platform

Official website and digital transparency platform for **Bildung mit Herz Sierra Leone e.V.** (officially registered as *Make them smile / Bildung mit Herz Sierra Leone e. V.*, VR 41272 B, Amtsgericht Charlottenburg).

Migrated from legacy Jimdo website builder to a zero-cost, high-performance, static-first architecture deployed on **Cloudflare Pages**.

---

## 1. Project Overview & Architectural Vision

- **Target Audience:** Institutional donors, corporate CSR/ESG decision-makers, architectural/construction partners, foundations, and private donors.
- **Strategic Goal:** Maximize donor trust through radical financial and project transparency, authentic field imagery, direct partner attribution (Juliet Jeneba Fornah, Welfare Alert Sierra Leone), and verifiable milestones.
- **Operating Cost:** **€0.00 / month** on Cloudflare Pages free tier (well within 500 builds/month, 20,000 files, and 25 MiB asset limits).
- **Compliance & Privacy:** 100% GDPR/DSGVO compliant. Zero external font calls (system font stack), zero third-party trackers, zero cookies, zero external CDN dependencies.
- **Accessibility:** Built according to WCAG 2.2 AA standards (semantic HTML5, 4.5:1+ text contrast, descriptive alt attributes, keyboard focus states).
- **Internationalization:** Full bilingual support — German (`/`) as primary language, English (`/en/`) as secondary language.

---

## 2. Technology Stack

- **Core Engine:** Lightweight, zero-dependency Node.js Static Site Generator ([scripts/build.js](file:///Users/mikio/Documents/CODING/bildung_mit_herz/scripts/build.js)). Builds in under 500ms with zero runtime dependencies.
- **Styling:** Custom editorial CSS design system ([src/styles/main.css](file:///Users/mikio/Documents/CODING/bildung_mit_herz/src/styles/main.css)) utilizing CSS Custom Properties, flexbox/grid, and fluid typography.
- **Structured Data:** Content managed in clean, decoupled JSON files in `content/` with JSON-LD schema generation (`NGO`, `BreadcrumbList`) on all pages.
- **Testing & QA:** Comprehensive automated test suite ([scripts/test.js](file:///Users/mikio/Documents/CODING/bildung_mit_herz/scripts/test.js)) running 1,359 assertions covering HTML validity, link integrity, image presence, financial math, and banking details.
- **Hosting Target:** Cloudflare Pages with automatic atomic Git deployments via GitHub Actions.

---

## 3. Directory Structure

```text
bildung_mit_herz/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI pipeline (build & test)
├── content/                     # Structured JSON content database
│   ├── corporate.json           # Corporate CSR/ESG sponsorship tiers
│   ├── navigation.json          # Multilingual header & footer navigation
│   ├── organization.json        # Legal entity, register info, bank details, board
│   ├── projects/
│   │   ├── madina.json          # Madina project data & engineering restart
│   │   ├── mafabaneh.json       # Mafabaneh eco-school & Tchoban Voss architecture
│   │   └── mamoru.json          # Mamoru primary school & finishing phase
│   ├── transparency.json        # Financial principles, cost structure, accounting
│   └── travel.json              # Intercultural educational travel dispatches & FAQs
├── docs/                        # Complete technical and migration documentation
│   ├── CLOUDFLARE_DEPLOYMENT.md # Cloudflare Pages setup and CI/CD guide
│   ├── CONTENT_AUDIT.md         # Full audit of legacy Jimdo content
│   ├── CONTENT_EDITING_GUIDE.md # Volunteer guide for editing JSON content & photos
│   ├── DOMAIN_MIGRATION_RUNBOOK.md # DNS investigation and safe cutover runbook
│   ├── FINANCIAL_DATA_REQUIREMENTS.md # Financial transparency data schema
│   ├── INFORMATION_ARCHITECTURE.md # URL routing, sitemap, bilingual structure
│   ├── LAUNCH_CHECKLIST.md      # Pre-launch and post-launch verification checklist
│   ├── MIGRATION_INVENTORY.md   # Inventory of scraped pages, assets, and PDFs
│   ├── OPEN_QUESTIONS.md        # Open factual items for the board/leadership
│   ├── REPOSITORY_AUDIT.md      # Initial repo audit and environment findings
│   └── URL_REDIRECT_MAP.md      # Legacy Jimdo to new static URL redirects (301)
├── migration/                   # Archive of legacy Jimdo crawl and extraction
│   ├── raw/                     # Original scraped HTML pages and images
│   └── normalized-content/      # Extracted clean Markdown copies of all pages
├── public/                      # Static assets copied verbatim to dist/
│   ├── assets/
│   │   ├── documents/           # Official project PDFs (WelfareAlert.pdf, etc.)
│   │   └── images/              # Optimized high-res project photography
│   ├── _redirects               # Cloudflare Pages 301 redirect rules
│   └── robots.txt               # Search engine crawler directives
├── scripts/
│   ├── build.js                 # Zero-dependency Static Site Generator
│   ├── dev.js                   # Local development HTTP server with live rebuild
│   └── test.js                  # Automated test runner (1,359 assertions)
├── src/
│   ├── js/                      # Accessible client-side utilities (mobile nav)
│   └── styles/
│       └── main.css             # Unified editorial design system
├── dist/                        # Compiled production distribution (generated)
├── package.json                 # Project configuration & npm script hooks
└── README.md                    # Project documentation
```

---

## 4. Local Development

### Prerequisites

- **Node.js**: v18.0.0 or later (v20 LTS or v22 LTS recommended).
- **npm**: v9.0.0 or later.
- Zero npm dependencies are required to run, build, or test the project.

### Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts local dev server at `http://localhost:3000` with instant rebuild on save. |
| `npm run build` | Compiles full multilingual static website into `dist/`. |
| `npm test` | Runs comprehensive QA test suite (1,359 validation checks). |
| `npm start` | Alias for `npm run dev`. |

---

## 5. Deployment Workflow (Cloudflare Pages)

1. **GitHub Integration:**
   - Push code to GitHub repository `philippmikio/bildung_mit_herz`.
   - Continuous Integration ([.github/workflows/ci.yml](file:///Users/mikio/Documents/CODING/bildung_mit_herz/.github/workflows/ci.yml)) automatically verifies `npm run build` and `npm test` on every push and pull request.

2. **Cloudflare Pages Configuration:**
   - **Framework Preset:** None (Custom / Static)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (default)
   - **Environment variables:** None required

3. **Atomic Previews:**
   - Every commit and branch automatically receives an isolated preview URL (e.g., `https://<hash>.bildung-mit-herz.pages.dev`).

---

## 6. Domain & DNS Summary

- **Domain:** `bildung-mit-herz.org` / `www.bildung-mit-herz.org`
- **Registrar:** **Already registered with Cloudflare, Inc.** (valid through 2027-03-12).
- **Current Nameservers:** `amalia.ns.cloudflare.com` & `viddy.ns.cloudflare.com`.
- **Email Impact:** **Zero.** No MX records exist on the domain. The organization communicates via Gmail (`bmh.sierraleone@gmail.com`).
- **Safe Cutover:** The live Jimdo site remains untouched until staging verification is complete. The cutover is accomplished by simply updating the `www` CNAME in the Cloudflare DNS dashboard to point to the Cloudflare Pages project. Detailed steps are in [docs/DOMAIN_MIGRATION_RUNBOOK.md](file:///Users/mikio/Documents/CODING/bildung_mit_herz/docs/DOMAIN_MIGRATION_RUNBOOK.md).

---

## 7. Content Management for Volunteers

Volunteers can easily edit text, financial figures, and project milestones without touching HTML or CSS by editing the structured JSON files located in `content/`.

Refer to [docs/CONTENT_EDITING_GUIDE.md](file:///Users/mikio/Documents/CODING/bildung_mit_herz/docs/CONTENT_EDITING_GUIDE.md) for full instructions.

---

## 8. License & Organizational Attribution

- **Organization:** Bildung mit Herz Sierra Leone e.V.
- **Local Partner:** Welfare Alert Sierra Leone (WA-SL), Juliet Jeneba Fornah (Founder & National Director), Makeni, Bombali District.
- **Architectural Partner:** Tchoban Voss Architekten (TVA Berlin / Hamburg / Dresden).
- **Code License:** Proprietary to Bildung mit Herz Sierra Leone e.V. All rights reserved.
