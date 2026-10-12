const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const STYLES_DIR = path.join(ROOT_DIR, 'src', 'styles');

const BASE_URL = 'https://www.bildung-mit-herz.org';

function loadJson(relPath) {
  const p = path.join(CONTENT_DIR, relPath);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const org = loadJson('organization.json');
const nav = loadJson('navigation.json');
const transparency = loadJson('transparency.json');
const corporate = loadJson('corporate.json');
const travel = loadJson('travel.json');

const projects = [
  loadJson('projects/mafabaneh.json'),
  loadJson('projects/mamoru.json'),
  loadJson('projects/madina.json')
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const file of fs.readdirSync(src)) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

// Layout Generator
function renderHtmlPage({
  lang = 'de',
  title,
  description,
  canonicalPath,
  content,
  ogImage = '/assets/images/hero-home.jpg',
  schemaJson = null
}) {
  const currentNav = nav[lang] || nav.de;
  const canonicalUrl = `${BASE_URL}${canonicalPath}`;

  const routePairs = {
    '/': '/en/',
    '/projekte/': '/en/projects/',
    '/projekte/mafabaneh/': '/en/projects/mafabaneh/',
    '/projekte/mamoru/': '/en/projects/mamoru/',
    '/projekte/madina/': '/en/projects/madina/',
    '/fuer-unternehmen/': '/en/corporate/',
    '/transparenz/': '/en/transparency/',
    '/ueber-uns/': '/en/about/',
    '/bildungsreisen/': '/en/travel/',
    '/bildungsreisen/reiseberichte/': '/en/travel/',
    '/spenden/': '/en/donate/',
    '/impressum/': '/impressum/',
    '/datenschutz/': '/datenschutz/',
    '/widerruf/': '/widerruf/'
  };

  // Reverse mapping for English -> German
  const reversePairs = {};
  for (const [deP, enP] of Object.entries(routePairs)) {
    reversePairs[enP] = deP;
  }

  let dePath = lang === 'de' ? canonicalPath : (reversePairs[canonicalPath] || '/');
  let enPath = lang === 'en' ? canonicalPath : (routePairs[canonicalPath] || '/en/');

  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": "NGO",
    "name": org.name,
    "legalName": org.legalName,
    "url": BASE_URL,
    "logo": `${BASE_URL}/assets/images/logo.png`,
    "description": description,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": org.address.street,
      "addressLocality": org.address.city,
      "postalCode": org.address.postalCode,
      "addressCountry": "DE"
    },
    "sameAs": Object.values(org.socialLinks)
  };

  const finalSchema = schemaJson ? { ...defaultSchema, ...schemaJson } : defaultSchema;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | ${org.name}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph / Social Sharing -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${title} | ${org.name}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${BASE_URL}${ogImage}">
  <meta property="og:locale" content="${lang === 'de' ? 'de_DE' : 'en_US'}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title} | ${org.name}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${BASE_URL}${ogImage}">

  <!-- Favicon -->
  <link rel="icon" type="image/png" href="/assets/images/favicon.png">
  <link rel="apple-touch-icon" href="/assets/images/logo.png">

  <!-- Core Stylesheet -->
  <link rel="stylesheet" href="/assets/css/main.css">

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
    ${JSON.stringify(finalSchema, null, 2)}
  </script>
</head>
<body>
  <!-- Header -->
  <header class="site-header">
    <div class="container header-inner">
      <a href="${lang === 'de' ? '/' : '/en/'}" class="brand-link" aria-label="Zur Startseite">
        <img src="/assets/images/logo.png" alt="Bildung mit Herz Logo" class="brand-logo" width="44" height="44">
        <div>
          <div class="brand-title">${currentNav.brand}</div>
          <div class="brand-subtitle">${currentNav.subBrand}</div>
        </div>
      </a>

      <!-- Desktop Navigation -->
      <nav class="nav-desktop" aria-label="Hauptnavigation">
        ${currentNav.links.map(link => {
          if (link.children) {
            const isChildActive = link.children.some(c => c.url === canonicalPath);
            return `
              <div class="nav-item">
                <a href="${link.url}" class="nav-link ${isChildActive ? 'active' : ''}">
                  ${link.title}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
                </a>
                <div class="dropdown-menu">
                  ${link.children.map(c => `
                    <a href="${c.url}" class="dropdown-link">${c.title}</a>
                  `).join('')}
                </div>
              </div>
            `;
          }
          const isActive = link.url === canonicalPath;
          return `
            <div class="nav-item">
              <a href="${link.url}" class="nav-link ${isActive ? 'active' : ''}">${link.title}</a>
            </div>
          `;
        }).join('')}

        <!-- Language Switcher -->
        <div class="lang-switch" role="group" aria-label="Sprachauswahl">
          <a href="${dePath}" class="lang-btn ${lang === 'de' ? 'active' : ''}" aria-label="Deutsch">DE</a>
          <a href="${enPath}" class="lang-btn ${lang === 'en' ? 'active' : ''}" aria-label="English">EN</a>
        </div>

        <a href="${currentNav.cta.url}" class="btn btn-primary btn-sm">${currentNav.cta.title}</a>
      </nav>

      <!-- Mobile Menu Toggle -->
      <button class="mobile-toggle" id="mobileMenuBtn" aria-label="Menü öffnen" aria-expanded="false">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>

    <!-- Mobile Navigation Overlay -->
    <div class="mobile-menu" id="mobileMenu" aria-hidden="true">
      ${currentNav.links.map(link => {
        if (link.children) {
          return `
            <a href="${link.url}" class="mobile-nav-link">${link.title}</a>
            ${link.children.map(c => `<a href="${c.url}" class="mobile-nav-sublink">↳ ${c.title}</a>`).join('')}
          `;
        }
        return `<a href="${link.url}" class="mobile-nav-link">${link.title}</a>`;
      }).join('')}
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.5rem; padding-top:1rem; border-top:1px solid var(--color-border);">
        <div class="lang-switch">
          <a href="${dePath}" class="lang-btn ${lang === 'de' ? 'active' : ''}">DE</a>
          <a href="${enPath}" class="lang-btn ${lang === 'en' ? 'active' : ''}">EN</a>
        </div>
        <a href="${currentNav.cta.url}" class="btn btn-primary btn-sm">${currentNav.cta.title}</a>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main id="main-content">
    ${content}
  </main>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <h3>${org.name}</h3>
          <p>${lang === 'de' ? 'Gemeinnütziger Verein für nachhaltigen Schulbau, Bildungsgerechtigkeit und interkulturellen Austausch in Sierra Leone. Eingetragen beim Amtsgericht Charlottenburg (Berlin) VR 41272 B.' : 'Registered nonprofit supporting sustainable school construction, educational equality and intercultural exchange in Sierra Leone.'}</p>
          <div style="margin-top:1.25rem;">
            <span class="badge-verified">✓ ${lang === 'de' ? 'Gemeinnützig anerkannt' : 'Recognized German Charity'}</span>
          </div>
        </div>

        <div class="footer-col">
          <h4>${lang === 'de' ? 'Projekte' : 'Projects'}</h4>
          <ul class="footer-links">
            <li><a href="${lang === 'de' ? '/projekte/mafabaneh/' : '/en/projects/mafabaneh/'}">Learning Hub Mafabaneh</a></li>
            <li><a href="${lang === 'de' ? '/projekte/mamoru/' : '/en/projects/mamoru/'}">Grundschule Mamoru</a></li>
            <li><a href="${lang === 'de' ? '/projekte/madina/' : '/en/projects/madina/'}">Grundschule Madina</a></li>
            <li><a href="${lang === 'de' ? '/fuer-unternehmen/' : '/en/corporate/'}">${lang === 'de' ? 'Für Unternehmen' : 'Corporate CSR'}</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>${lang === 'de' ? 'Organisation' : 'Organization'}</h4>
          <ul class="footer-links">
            <li><a href="${lang === 'de' ? '/transparenz/' : '/en/transparency/'}">${lang === 'de' ? 'Transparenz & Finanzen' : 'Financial Transparency'}</a></li>
            <li><a href="${lang === 'de' ? '/ueber-uns/' : '/en/about/'}">${lang === 'de' ? 'Über uns & Partner' : 'About & Partners'}</a></li>
            <li><a href="${lang === 'de' ? '/bildungsreisen/' : '/en/travel/'}">${lang === 'de' ? 'Bildungsreisen' : 'Educational Trips'}</a></li>
            <li><a href="${lang === 'de' ? '/spenden/' : '/en/donate/'}">${lang === 'de' ? 'Spendenkonto' : 'Donation Account'}</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>${lang === 'de' ? 'Rechtliches' : 'Legal & Contact'}</h4>
          <ul class="footer-links">
            ${currentNav.footerLegal.map(l => `<li><a href="${l.url}">${l.title}</a></li>`).join('')}
            <li><a href="mailto:${org.contacts.email}">${org.contacts.email}</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <div>
          © ${new Date().getFullYear()} ${org.legalName}. Alle Rechte vorbehalten.
        </div>
        <div class="social-links-row">
          <a href="${org.socialLinks.instagram}" target="_blank" rel="noopener noreferrer" class="social-icon-link" aria-label="Instagram">Instagram</a>
          <a href="${org.socialLinks.linkedin}" target="_blank" rel="noopener noreferrer" class="social-icon-link" aria-label="LinkedIn">LinkedIn</a>
          <a href="${org.socialLinks.youtube}" target="_blank" rel="noopener noreferrer" class="social-icon-link" aria-label="YouTube">YouTube</a>
          <a href="${org.socialLinks.substack}" target="_blank" rel="noopener noreferrer" class="social-icon-link" aria-label="Substack">Substack</a>
        </div>
      </div>
    </div>
  </footer>

  <!-- Simple Mobile Toggle & Copy Helper Scripts -->
  <script>
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    if (btn && menu) {
      btn.addEventListener('click', () => {
        const isOpen = menu.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen);
        menu.setAttribute('aria-hidden', !isOpen);
      });
    }

    function copyToClipboard(text, btnId, successMsg) {
      navigator.clipboard.writeText(text).then(() => {
        const el = document.getElementById(btnId);
        if (el) {
          const orig = el.innerText;
          el.innerText = successMsg || 'Kopiert!';
          setTimeout(() => { el.innerText = orig; }, 2200);
        }
      });
    }
  </script>
</body>
</html>`;
}

// Reusable Components
function renderTrustBar(lang = 'de') {
  return `
    <section class="trust-bar" aria-label="Vereinsfakten & Kennzahlen">
      <div class="container">
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">100 %</div>
            <div class="metric-label">${lang === 'de' ? 'Direkt in die Projekte' : 'Direct to Projects'}</div>
            <div class="metric-sub">${lang === 'de' ? 'Verwaltung privat finanziert' : 'Operations paid out-of-pocket'}</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">3</div>
            <div class="metric-label">${lang === 'de' ? 'Schulbauprojekte' : 'Active School Projects'}</div>
            <div class="metric-sub">Mafabaneh • Mamoru • Madina</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">5</div>
            <div class="metric-label">${lang === 'de' ? 'Klassenräume fertig' : 'Classrooms Built'}</div>
            <div class="metric-sub">${lang === 'de' ? 'Mamoru Grundschule steht' : 'Mamoru structure completed'}</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">VR 41272</div>
            <div class="metric-label">${lang === 'de' ? 'Amtsgericht Berlin' : 'Registered Charity'}</div>
            <div class="metric-sub">${lang === 'de' ? 'Gemeinnützig anerkannt' : 'Tax-deductible in Germany'}</div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderDonationBox(lang = 'de') {
  return `
    <div class="donation-card" id="spendenkonto">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h3 style="margin-bottom:0.25rem;">${lang === 'de' ? 'Offizielles Spendenkonto' : 'Official Donation Bank Account'}</h3>
          <p style="color:var(--color-text-muted); font-size:0.9rem; margin-bottom:0;">${org.banking.bankName} • ${lang === 'de' ? 'Gemeinnütziger Verein' : 'Registered Charity'}</p>
        </div>
        <span class="badge-verified">✓ ${lang === 'de' ? 'Steuerlich absetzbar' : 'Tax Deductible'}</span>
      </div>

      <div class="bank-detail-row">
        <span class="bank-label">${lang === 'de' ? 'Empfänger / Kontoinhaber' : 'Recipient / Account Holder'}:</span>
        <span class="bank-val">
          <strong>${org.banking.accountHolder}</strong>
          <button type="button" class="btn-copy" id="copyHolderBtn" onclick="copyToClipboard('${org.banking.accountHolder}', 'copyHolderBtn', '${lang === 'de' ? 'Kopiert!' : 'Copied!'}')">${lang === 'de' ? 'Kopieren' : 'Copy'}</button>
        </span>
      </div>

      <div class="bank-detail-row">
        <span class="bank-label">IBAN:</span>
        <span class="bank-val">
          <strong>${org.banking.iban}</strong>
          <button type="button" class="btn-copy" id="copyIbanBtn" onclick="copyToClipboard('${org.banking.iban}', 'copyIbanBtn', '${lang === 'de' ? 'Kopiert!' : 'Copied!'}')">${lang === 'de' ? 'IBAN kopieren' : 'Copy IBAN'}</button>
        </span>
      </div>

      <div class="bank-detail-row">
        <span class="bank-label">BIC / SWIFT:</span>
        <span class="bank-val">
          <strong>${org.banking.bic}</strong>
          <button type="button" class="btn-copy" id="copyBicBtn" onclick="copyToClipboard('${org.banking.bic}', 'copyBicBtn', '${lang === 'de' ? 'Kopiert!' : 'Copied!'}')">${lang === 'de' ? 'Kopieren' : 'Copy'}</button>
        </span>
      </div>

      <div class="bank-detail-row">
        <span class="bank-label">${lang === 'de' ? 'Verwendungszweck' : 'Transfer Memo'}:</span>
        <span class="bank-val" style="font-size:0.95rem;">
          <em>${lang === 'de' ? 'Spende [Projektname] + Ihre Anschrift (für Spendenquittung)' : 'Donation [Project Name] + Postal Address (for tax receipt)'}</em>
        </span>
      </div>

      <div class="callout" style="margin-top:1.5rem; margin-bottom:0;">
        <div class="callout-title">ℹ️ ${lang === 'de' ? 'Wichtiger Hinweis zum Kontoinhaber' : 'Important Note on Account Holder'}</div>
        <p style="font-size:0.875rem; color:var(--color-text-muted);">${org.renamingNotice[lang] || org.renamingNotice.de}</p>
      </div>
    </div>
  `;
}

// Build all pages
function buildSite() {
  console.log('🚀 Starting Static Site Build for Bildung mit Herz Sierra Leone e.V....');
  ensureDir(DIST_DIR);
  ensureDir(path.join(DIST_DIR, 'assets', 'css'));

  // 1. Copy Public Assets
  copyRecursive(PUBLIC_DIR, DIST_DIR);

  // 2. Copy Stylesheet
  fs.copyFileSync(path.join(STYLES_DIR, 'main.css'), path.join(DIST_DIR, 'assets', 'css', 'main.css'));

  const generatedUrls = [];

  function writeRoute(routePath, htmlContent) {
    const cleanRoute = routePath.endsWith('/') ? routePath : `${routePath}/`;
    const targetFile = cleanRoute === '/' 
      ? path.join(DIST_DIR, 'index.html') 
      : path.join(DIST_DIR, routePath, 'index.html');

    ensureDir(path.dirname(targetFile));
    fs.writeFileSync(targetFile, htmlContent, 'utf8');
    generatedUrls.push(cleanRoute);
  }

  // ==========================================
  // 1. STARTSEITE (DEUTSCH)
  // ==========================================
  const homeContentDe = `
    <!-- Hero Section -->
    <section class="hero">
      <div class="container hero-grid">
        <div>
          <span class="hero-tagline">Bildung mit Herz Sierra Leone e.V.</span>
          <h1 class="hero-title">Schulräume schaffen. Zukunft ermöglichen.</h1>
          <p class="lead">
            Gemeinsam mit lokalen Dorfgemeinschaften bauen wir sichere, nachhaltige Schulen in Sierra Leone. 
            Auf Augenhöhe, mit ökologischer Architektur und 100%iger Transparenz.
          </p>
          <div class="hero-actions">
            <a href="/projekte/" class="btn btn-primary">Aktuelle Projekte entdecken</a>
            <a href="/fuer-unternehmen/" class="btn btn-secondary">Für Unternehmen & Stiftungen</a>
            <a href="/spenden/" class="btn btn-outline">Jetzt spenden</a>
          </div>
        </div>
        <div class="hero-image-wrap">
          <img src="/assets/images/hero-home.jpg" alt="Schülerinnen und Schüler in Sierra Leone" class="hero-image">
          <div class="hero-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <div>
              <strong>100% Direkt-Garantie:</strong> Alle Verwaltungskosten werden privat getragen.
            </div>
          </div>
        </div>
      </div>
    </section>

    ${renderTrustBar('de')}

    <!-- Featured Projects Section -->
    <section class="section">
      <div class="container">
        <div class="section-header">
          <div class="section-tag">Unsere Bauvorhaben</div>
          <h2>Drei Schulen. Konkrete Baufortschritte.</h2>
          <p class="lead" style="max-width:720px;">
            Wir bauen nicht für Statistiken, sondern schaffen mit verlässlichen Partnern vor Ort Bildungsräume, 
            die über Generationen hinweg Bestand haben.
          </p>
        </div>

        <div class="projects-grid">
          ${projects.map(p => `
            <article class="project-card">
              <div class="project-card-image-wrap">
                <img src="${p.leadImage}" alt="${p.title.de}" class="project-card-image">
                <span class="status-badge ${p.status}">${p.statusLabel.de}</span>
              </div>
              <div class="project-card-body">
                <h3 class="project-card-title">${p.title.de}</h3>
                <p class="project-card-summary">${p.tagline.de}</p>

                <div class="funding-bar-wrap">
                  <div class="funding-bar-labels">
                    <span>Gesichert: ${p.finances.securedFunding.amount.toLocaleString('de-DE')} €</span>
                    <span>Offen: ${p.finances.outstandingNeed.amount.toLocaleString('de-DE')} €</span>
                  </div>
                  <div class="funding-progress" aria-label="Finanzierungsfortschritt">
                    <div class="funding-progress-fill" style="width: ${Math.round((p.finances.securedFunding.amount / (p.finances.totalEstimatedBudget.amount || 1)) * 100)}%;"></div>
                  </div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
                  <span style="font-size:0.8rem; color:var(--color-text-muted);">${p.location.split(',')[0]}</span>
                  <a href="/projekte/${p.slug}/" class="btn btn-secondary btn-sm">Details ansehen →</a>
                </div>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Why Trust Us Section -->
    <section class="section section-muted">
      <div class="container">
        <div class="section-header text-center">
          <div class="section-tag">Verlässlichkeit & Governance</div>
          <h2>Warum Förderer und Unternehmen uns vertrauen</h2>
          <p class="lead" style="max-width:760px; margin-left:auto; margin-right:auto;">
            Erfolgreiche Entwicklungszusammenarbeit erfordert professionelle Partnerschaft, 
            solide Bauplanung und eine lückenlos nachweisbare Mittelverwendung.
          </p>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:2rem;">
          <div style="background:var(--color-surface); padding:2rem; border-radius:var(--radius-lg); border:1px solid var(--color-border);">
            <div style="color:var(--color-terracotta); font-size:2rem; margin-bottom:1rem;">🤝</div>
            <h3>Gleichberechtigte Partnerschaft</h3>
            <p>Wir initiieren keine Projekte am Reißbrett in Deutschland. Jede Schule entsteht auf direkten Wunsch der Dorfgemeinschaft und wird vor Ort von lokalen Fördervereinen wie <em>Welfare Alert</em> und <em>Kaprr Yoni Hub</em> getragen.</p>
          </div>

          <div style="background:var(--color-surface); padding:2rem; border-radius:var(--radius-lg); border:1px solid var(--color-border);">
            <div style="color:var(--color-terracotta); font-size:2rem; margin-bottom:1rem;">🏛️</div>
            <h3>Architektur von Weltklasse</h3>
            <p>Für den Learning Hub in Mafabaneh engagiert sich das renommierte Büro <strong>Tchoban Voss Architekten</strong> ehrenamtlich. Wir setzen auf klimagerechte Lehmbauweise, natürliche Querlüftung und statische Langlebigkeit.</p>
          </div>

          <div style="background:var(--color-surface); padding:2rem; border-radius:var(--radius-lg); border:1px solid var(--color-border);">
            <div style="color:var(--color-terracotta); font-size:2rem; margin-bottom:1rem;">💶</div>
            <h3>Tranchen & Belegprüfung</h3>
            <p>Mittel werden erst nach Beleg- und Fotoprüfung der vorigen Bauphase freigegeben. Reise- und Vereinskosten finanzieren die Initiatoren privat – jeder Spendeneuro geht 1:1 in Material und Handwerkerlöhne.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Corporate Teaser -->
    <section class="section">
      <div class="container" style="background:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius-lg); padding:3.5rem 2.5rem; display:grid; grid-template-columns:1fr; gap:2.5rem; align-items:center;">
        <div>
          <span class="hero-tagline" style="margin-bottom:0.75rem;">Für Unternehmen & Stiftungen</span>
          <h2>Übernehmen Sie eine Baupatenschaft mit messbarer Wirkung</h2>
          <p class="lead" style="margin-bottom:1.5rem;">
            Investieren Sie gezielt in Bildungsinfrastruktur: Ob Schultisch-Sets, ein ganzes Klassenzimmer oder 
            Jahresgehälter für Lehrerinnen und Lehrer. Wir liefern lückenlose Belegnachweise für Ihre CSR- und Nachhaltigkeitsberichte.
          </p>
          <div style="display:flex; gap:1rem; flex-wrap:wrap;">
            <a href="/fuer-unternehmen/" class="btn btn-primary">Partnerschaftsmodelle prüfen</a>
            <a href="mailto:${org.contacts.email}" class="btn btn-secondary">Gespräch mit Vorstand vereinbaren</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Donation Section -->
    <section class="section section-muted">
      <div class="container container-narrow">
        <div class="section-header text-center">
          <div class="section-tag">Spenden & Fördern</div>
          <h2>Ihre Spende schafft sichere Lernorte</h2>
          <p class="lead">
            Unterstützen Sie die Fertigstellung der Grundschule Mamoru oder den Bau des Leuchtturm-Projekts Mafabaneh 
            durch eine direkte Banküberweisung.
          </p>
        </div>
        ${renderDonationBox('de')}
      </div>
    </section>
  `;

  writeRoute('/', renderHtmlPage({
    lang: 'de',
    title: 'Schulräume schaffen. Zukunft ermöglichen.',
    description: 'Bildung mit Herz Sierra Leone e.V. baut und fördert nachhaltige Schulen in Sierra Leone auf Augenhöhe mit lokalen Gemeinden und 100%iger Transparenz.',
    canonicalPath: '/',
    content: homeContentDe
  }));

  // ==========================================
  // 2. PROJEKTE ÜBERSICHT (DEUTSCH)
  // ==========================================
  const projectsOverviewDe = `
    <section class="section">
      <div class="container">
        <div class="section-header">
          <div class="section-tag">Bildungsinfrastruktur vor Ort</div>
          <h1>Unsere Schulprojekte in Sierra Leone</h1>
          <p class="lead" style="max-width:760px;">
            Bildung schafft die Grundlage für Selbstbestimmung. Hier finden Sie alle aktiven und geplanten 
            Schulbauten mit verifizierten Fortschritten, Partnern und Finanzdaten.
          </p>
        </div>

        <div class="projects-grid">
          ${projects.map(p => `
            <article class="project-card">
              <div class="project-card-image-wrap">
                <img src="${p.leadImage}" alt="${p.title.de}" class="project-card-image">
                <span class="status-badge ${p.status}">${p.statusLabel.de}</span>
              </div>
              <div class="project-card-body">
                <h2 class="project-card-title">${p.title.de}</h2>
                <p class="project-card-summary">${p.tagline.de}</p>

                <div class="funding-bar-wrap">
                  <div class="funding-bar-labels">
                    <span>Gesichert: ${p.finances.securedFunding.amount.toLocaleString('de-DE')} €</span>
                    <span>Offen: ${p.finances.outstandingNeed.amount.toLocaleString('de-DE')} €</span>
                  </div>
                  <div class="funding-progress">
                    <div class="funding-progress-fill" style="width: ${Math.round((p.finances.securedFunding.amount / (p.finances.totalEstimatedBudget.amount || 1)) * 100)}%;"></div>
                  </div>
                </div>

                <div style="margin-top:auto; padding-top:1rem; border-top:1px solid var(--color-border-subtle); display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:0.85rem; font-weight:600; color:var(--color-text-muted);">${p.location.split(',')[0]}</span>
                  <a href="/projekte/${p.slug}/" class="btn btn-secondary btn-sm">Projektdetails ansehen →</a>
                </div>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  writeRoute('/projekte', renderHtmlPage({
    lang: 'de',
    title: 'Unsere Schulprojekte in Sierra Leone',
    description: 'Übersicht aller Schulbauprojekte von Bildung mit Herz Sierra Leone e.V.: Mafabaneh, Mamoru und Madina.',
    canonicalPath: '/projekte/',
    content: projectsOverviewDe
  }));

  // ==========================================
  // 3. PROJEKT DETAILSEITEN (DEUTSCH)
  // ==========================================
  // 3.1 MAFABANEH
  const pMafa = projects[0];
  const mafabanehDe = `
    <section class="section">
      <div class="container container-narrow">
        <a href="/projekte/" class="btn btn-secondary btn-sm" style="margin-bottom:1.5rem;">← Zurück zur Projektübersicht</a>
        <div style="margin-bottom:1rem;">
          <span class="status-badge ${pMafa.status}">${pMafa.statusLabel.de}</span>
        </div>
        <h1 style="margin-bottom:0.75rem;">${pMafa.title.de}</h1>
        <p class="lead" style="margin-bottom:2rem;">${pMafa.tagline.de}</p>

        <img src="${pMafa.leadImage}" alt="Entwurf Learning Hub Mafabaneh" style="border-radius:var(--radius-lg); margin-bottom:2.5rem; box-shadow:var(--shadow-md);">

        <h2>Architektur als Symbol des Friedens</h2>
        <p>${pMafa.reconciliationStory.de}</p>

        <h2 style="margin-top:2.5rem;">Architekturkonzept von Sergei Tchoban</h2>
        <p>
          Der international renommierte Architekt <strong>Sergei Tchoban</strong> (Träger des European Prize for Architecture 2018, <em>Tchoban Voss Architekten</em>) 
          hat den Learning Hub ehrenamtlich entworfen. Der Bau orientiert sich an traditionellen Rundbauten und kombiniert handwerkliche Baukunst mit modernem Klimadesign.
        </p>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin:2rem 0;">
          ${pMafa.constructionFeatures.map(f => `
            <div style="background:var(--color-surface); padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h4 style="margin-bottom:0.35rem; color:var(--color-terracotta);">${f.title.de}</h4>
              <p style="font-size:0.9rem; margin-bottom:0; color:var(--color-text-muted);">${f.desc.de}</p>
            </div>
          `).join('')}
        </div>

        <h2 style="margin-top:2.5rem;">Bauabschnitte & Meilensteine</h2>
        <div class="timeline">
          ${pMafa.milestones.map(m => `
            <div class="timeline-item">
              <div class="timeline-dot ${m.completed ? 'completed' : ''}"></div>
              <div class="timeline-date">${m.date} • ${m.completed ? '<span class="badge-verified">✓ Abgeschlossen</span>' : '<span class="badge-estimated">In Arbeit</span>'}</div>
              <div class="timeline-title">${m.title.de}</div>
              <div class="timeline-desc">Quelle: ${m.source}</div>
            </div>
          `).join('')}
        </div>

        <h2 style="margin-top:2.5rem;">Finanzstatus & konkrete Förderbausteine</h2>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Kategorie</th><th>Betrag</th><th>Status</th><th>Bemerkung</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Geschätztes Gesamtbudget</strong></td>
                <td><strong>${pMafa.finances.totalEstimatedBudget.amount.toLocaleString('de-DE')} €</strong></td>
                <td><span class="badge-estimated">Schätzung</span></td>
                <td>${pMafa.finances.totalEstimatedBudget.sourceNote}</td>
              </tr>
              <tr>
                <td>Bereits gesicherte Mittel</td>
                <td>${pMafa.finances.securedFunding.amount.toLocaleString('de-DE')} €</td>
                <td><span class="badge-verified">Verifiziert</span></td>
                <td>${pMafa.finances.securedFunding.sourceNote}</td>
              </tr>
              <tr>
                <td>Offener Finanzierungsbedarf</td>
                <td>${pMafa.finances.outstandingNeed.amount.toLocaleString('de-DE')} €</td>
                <td><span class="badge-estimated">Bedarf</span></td>
                <td>${pMafa.finances.outstandingNeed.sourceNote}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 style="margin-top:2rem;">Sponsoring-Pakete für Unternehmen & Stiftungen:</h3>
        <div style="display:grid; gap:1rem; margin:1.5rem 0;">
          ${pMafa.finances.corporateFundingPackages.map(pkg => `
            <div style="background:var(--color-surface); padding:1.5rem; border:1px solid var(--color-border); border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
              <div>
                <h4 style="margin-bottom:0.25rem;">${pkg.title.de}</h4>
                <p style="font-size:0.875rem; color:var(--color-text-muted); margin-bottom:0;">${pkg.description.de}</p>
              </div>
              <div style="text-align:right;">
                <div style="font-size:1.25rem; font-weight:800; color:var(--color-terracotta);">${pkg.amount.toLocaleString('de-DE')} €</div>
                <a href="/spenden/" class="btn btn-secondary btn-sm" style="margin-top:0.25rem;">Paket fördern</a>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="margin-top:2.5rem; padding:1.5rem; background:var(--color-surface-muted); border-radius:var(--radius-md); border:1px solid var(--color-border);">
          <h4>Offizieller Strategieplan zum Download</h4>
          <p style="font-size:0.9rem; margin-bottom:1rem;">Laden Sie den vollständigen 8-seitigen Strategieplan des <em>Kaprr Yoni Global Learning Hub</em> (2025–2030) herunter:</p>
          <a href="${pMafa.localPartner.strategicPlanDocument}" class="btn btn-secondary btn-sm" download>📄 Strategieplan herunterladen (PDF, 508 KB)</a>
        </div>

        <div style="margin-top:3rem;">
          ${renderDonationBox('de')}
        </div>
      </div>
    </section>
  `;

  writeRoute('/projekte/mafabaneh', renderHtmlPage({
    lang: 'de',
    title: pMafa.title.de,
    description: 'Das Schul- und Gemeinschaftsprojekt Learning Hub in Mafabaneh, entworfen von Sergei Tchoban (Tchoban Voss Architekten).',
    canonicalPath: '/projekte/mafabaneh/',
    content: mafabanehDe,
    ogImage: pMafa.leadImage
  }));

  // 3.2 MAMORU
  const pMamoru = projects[1];
  const mamoruDe = `
    <section class="section">
      <div class="container container-narrow">
        <a href="/projekte/" class="btn btn-secondary btn-sm" style="margin-bottom:1.5rem;">← Zurück zur Projektübersicht</a>
        <div style="margin-bottom:1rem;">
          <span class="status-badge ${pMamoru.status}">${pMamoru.statusLabel.de}</span>
        </div>
        <h1 style="margin-bottom:0.75rem;">${pMamoru.title.de}</h1>
        <p class="lead" style="margin-bottom:2rem;">${pMamoru.tagline.de}</p>

        <img src="${pMamoru.leadImage}" alt="Grundschule Mamoru Außenansicht" style="border-radius:var(--radius-lg); margin-bottom:2.5rem; box-shadow:var(--shadow-md);">

        <h2>Der Beweis, dass Partnerschaft funktioniert</h2>
        <p>${pMamoru.impactSummary.de}</p>
        <p>
          Dieses Projekt ist das direkte Resultat einer jahrelangen, bewährten Zusammenarbeit mit unserer Partnerin 
          <strong>Juliet Jeneba Fornah</strong> und ihrer Organisation <em>Welfare Alert Sierra Leone (WA-SL)</em>. 
          Das stehende Schulgebäude beweist: Spenden kommen ungekürzt und wirksam an.
        </p>

        <div class="callout" style="margin:2rem 0;">
          <div class="callout-title">Unternehmenspartner: AcadeMedia Education GmbH</div>
          <p>
            Im Januar 2026 konnten wir zwei wegweisende Meilensteine feiern: Dank einer Großspende der <strong>AcadeMedia Education GmbH</strong> 
            wurden alle fünf Klassenräume mit festen Tischen und Bänken ausgestattet und die Gehälter von fünf Lehrkräften für volle 12 Monate gesichert.
          </p>
        </div>

        <h2 style="margin-top:2.5rem;">Meilensteine</h2>
        <div class="timeline">
          ${pMamoru.milestones.map(m => `
            <div class="timeline-item">
              <div class="timeline-dot ${m.completed ? 'completed' : ''}"></div>
              <div class="timeline-date">${m.date} • ${m.completed ? '<span class="badge-verified">✓ Abgeschlossen</span>' : '<span class="badge-estimated">Offener Restbedarf</span>'}</div>
              <div class="timeline-title">${m.title.de}</div>
              <div class="timeline-desc">Quelle: ${m.source}</div>
            </div>
          `).join('')}
        </div>

        <h2 style="margin-top:2.5rem;">Restbedarfe zur finalen Fertigstellung</h2>
        <p>
          Der Rohbau und das Dach stehen, die Möbel sind da. Um die Schule vollends schlagregendicht und hygienisch zu machen, 
          fehlen noch der Innen-/Außenverputz, Estrichböden und Holztüren:
        </p>

        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Maßnahme</th><th>Bedarf</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Innen- & Außenverputz</strong></td>
                <td>2.200 €</td>
                <td><span class="badge-verified">Verifizierter KVA</span></td>
              </tr>
              <tr>
                <td><strong>Zementestrich-Böden (5 Räume)</strong></td>
                <td>1.600 €</td>
                <td><span class="badge-verified">Verifizierter KVA</span></td>
              </tr>
              <tr>
                <td><strong>Abschließbare Holztüren & Läden</strong></td>
                <td>1.000 €</td>
                <td><span class="badge-verified">Verifizierter KVA</span></td>
              </tr>
              <tr style="background:var(--color-surface-muted);">
                <td><strong>Gesamter Restbedarf</strong></td>
                <td><strong>${pMamoru.finances.outstandingNeed.amount.toLocaleString('de-DE')} €</strong></td>
                <td><span class="badge-verified">Finanzierungsziel</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top:2.5rem; padding:1.5rem; background:var(--color-surface-muted); border-radius:var(--radius-md); border:1px solid var(--color-border);">
          <h4>Partnerprofil: Welfare Alert Sierra Leone</h4>
          <p style="font-size:0.9rem; margin-bottom:1rem;">Erfahren Sie mehr über die Arbeit und Registrierung von Juliet Fornah in Makeni:</p>
          <a href="${pMamoru.localPartner.partnerDocument}" class="btn btn-secondary btn-sm" download>📄 Partnerprofil herunterladen (PDF, 715 KB)</a>
        </div>

        <div style="margin-top:3rem;">
          ${renderDonationBox('de')}
        </div>
      </div>
    </section>
  `;

  writeRoute('/projekte/mamoru', renderHtmlPage({
    lang: 'de',
    title: pMamoru.title.de,
    description: 'Grundschule Mamoru in Sierra Leone: 5 Klassenzimmer stehen, Möbel und Lehrergehälter gesichert. Unterstützen Sie den finalen Ausbau.',
    canonicalPath: '/projekte/mamoru/',
    content: mamoruDe,
    ogImage: pMamoru.leadImage
  }));

  // 3.3 MADINA
  const pMadina = projects[2];
  const madinaDe = `
    <section class="section">
      <div class="container container-narrow">
        <a href="/projekte/" class="btn btn-secondary btn-sm" style="margin-bottom:1.5rem;">← Zurück zur Projektübersicht</a>
        <div style="margin-bottom:1rem;">
          <span class="status-badge ${pMadina.status}">${pMadina.statusLabel.de}</span>
        </div>
        <h1 style="margin-bottom:0.75rem;">${pMadina.title.de}</h1>
        <p class="lead" style="margin-bottom:2rem;">${pMadina.tagline.de}</p>

        <img src="${pMadina.leadImage}" alt="Gemeinschaft in Madina" style="border-radius:var(--radius-lg); margin-bottom:2.5rem; box-shadow:var(--shadow-md);">

        <h2>Offener Umgang mit unserer Baugeschichte</h2>
        <p>${pMadina.honestHistory.de}</p>

        <h2 style="margin-top:2.5rem;">Der neue Konstruktionsstandard</h2>
        <div style="display:grid; grid-template-columns:1fr; gap:1.25rem; margin:1.5rem 0;">
          ${pMadina.engineeringApproach.map(a => `
            <div style="background:var(--color-surface); padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h4 style="color:var(--color-terracotta); margin-bottom:0.35rem;">${a.title.de}</h4>
              <p style="font-size:0.9rem; margin-bottom:0; color:var(--color-text-muted);">${a.desc.de}</p>
            </div>
          `).join('')}
        </div>

        <h2 style="margin-top:2.5rem;">Projektphasen</h2>
        <div class="timeline">
          ${pMadina.milestones.map(m => `
            <div class="timeline-item">
              <div class="timeline-dot ${m.completed ? 'completed' : ''}"></div>
              <div class="timeline-date">${m.date} • ${m.completed ? '<span class="badge-verified">✓ Abgeschlossen</span>' : '<span class="badge-estimated">Planung</span>'}</div>
              <div class="timeline-title">${m.title.de}</div>
              <div class="timeline-desc">Quelle: ${m.source}</div>
            </div>
          `).join('')}
        </div>

        <h2 style="margin-top:2.5rem;">Finanzierung Phase 1 (6 Klassenräume + Lehrerzimmer)</h2>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Kategorie</th><th>Betrag</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Geschätzte Gesamtbaukosten Phase 1</td>
                <td>${pMadina.finances.totalEstimatedBudget.amount.toLocaleString('de-DE')} €</td>
                <td><span class="badge-estimated">Schätzung</span></td>
              </tr>
              <tr>
                <td>Bereits gewidmete Eigenmittel</td>
                <td>${pMadina.finances.securedFunding.amount.toLocaleString('de-DE')} €</td>
                <td><span class="badge-verified">Verifiziert</span></td>
              </tr>
              <tr>
                <td>Offener Finanzierungsbedarf</td>
                <td><strong>${pMadina.finances.outstandingNeed.amount.toLocaleString('de-DE')} €</strong></td>
                <td><span class="badge-estimated">Spendenbedarf</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top:3rem;">
          ${renderDonationBox('de')}
        </div>
      </div>
    </section>
  `;

  writeRoute('/projekte/madina', renderHtmlPage({
    lang: 'de',
    title: pMadina.title.de,
    description: 'Neustart für die Grundschule Madina: Solide Stahlbetonskelett-Bauweise für sturmsichere und dauerhafte Klassenräume.',
    canonicalPath: '/projekte/madina/',
    content: madinaDe,
    ogImage: pMadina.leadImage
  }));

  // ==========================================
  // 4. FÜR UNTERNEHMEN (DEUTSCH)
  // ==========================================
  const corporateDe = `
    <section class="section">
      <div class="container container-narrow">
        <div class="section-header">
          <div class="section-tag">Corporate Social Responsibility (CSR)</div>
          <h1>${corporate.title.de}</h1>
          <p class="lead">${corporate.tagline.de}</p>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin:2.5rem 0;">
          ${corporate.valueProposition.map(v => `
            <div style="background:var(--color-surface); padding:1.5rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h3 style="font-size:1.15rem; color:var(--color-slate-dark); margin-bottom:0.5rem;">${v.title.de}</h3>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">${v.desc.de}</p>
            </div>
          `).join('')}
        </div>

        <h2 style="margin-top:3rem;">Partnerschaftsmodelle im Überblick</h2>
        <div style="display:grid; gap:1.5rem; margin:1.5rem 0;">
          ${corporate.partnershipModels.map(m => `
            <div style="background:var(--color-surface); padding:2rem; border:2px solid var(--color-border); border-radius:var(--radius-lg);">
              <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
                <h3 style="font-size:1.35rem; color:var(--color-terracotta);">${m.tier}</h3>
                <span style="font-size:1.25rem; font-weight:800; color:var(--color-slate-dark);">${m.amount}</span>
              </div>
              <p style="font-weight:600; font-size:0.95rem; margin-bottom:0.5rem;">Zielprojekt: ${m.targetProject}</p>
              <p style="color:var(--color-text-muted); font-size:0.9rem; margin-bottom:1rem;">${m.impact.de}</p>
              
              <div style="background:var(--color-surface-muted); padding:1rem; border-radius:var(--radius-sm); font-size:0.85rem;">
                <strong>Was Ihr Unternehmen erhält:</strong>
                <ul style="margin-left:1.25rem; margin-top:0.35rem; color:var(--color-text-muted);">
                  ${m.deliverables.map(d => `<li>${d}</li>`).join('')}
                </ul>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="callout" style="margin-top:3rem;">
          <div class="callout-title">Erfolgsbeispiel: AcadeMedia Education GmbH</div>
          <p>${corporate.existingSuccessStory.quote}</p>
        </div>

        <div style="text-align:center; margin-top:3rem; padding:3rem 2rem; background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-lg);">
          <h2>Persönliches Kennenlerngespräch vereinbaren</h2>
          <p class="lead" style="max-width:600px; margin:0.75rem auto 1.75rem;">
            Sprechen Sie direkt mit unserem Vereinsvorsitzenden Philipp Herzberg über individuelle 
            Kooperationsmöglichkeiten für Ihr Unternehmen.
          </p>
          <a href="mailto:${org.contacts.email}?subject=Unternehmenspartnerschaft%20Bildung%20mit%20Herz" class="btn btn-primary">E-Mail an Philipp Herzberg senden</a>
        </div>
      </div>
    </section>
  `;

  writeRoute('/fuer-unternehmen', renderHtmlPage({
    lang: 'de',
    title: 'Partnerschaften für Unternehmen & Stiftungen',
    description: 'Corporate Social Responsibility mit messbarer Hebelwirkung: Bauen Sie Bildungsbauten in Sierra Leone mit lückenloser Belegtransparenz.',
    canonicalPath: '/fuer-unternehmen/',
    content: corporateDe
  }));

  // ==========================================
  // 5. TRANSPARENZ & FINANZEN (DEUTSCH)
  // ==========================================
  const transparencyDe = `
    <section class="section">
      <div class="container container-narrow">
        <div class="section-header">
          <div class="section-tag">Offenlegung & Governance</div>
          <h1>${transparency.title.de}</h1>
          <p class="lead">${transparency.tagline.de}</p>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin:2.5rem 0;">
          ${transparency.corePrinciples.map(p => `
            <div style="background:var(--color-surface); padding:1.5rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h3 style="font-size:1.15rem; color:var(--color-terracotta); margin-bottom:0.5rem;">${p.title.de}</h3>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">${p.desc.de}</p>
            </div>
          `).join('')}
        </div>

        <h2>Jahresübersicht Einnahmen & Ausgaben</h2>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Jahr</th><th>Spendeneingang</th><th>Projektausgaben</th><th>Verwaltungskosten</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${transparency.annualFinancialOverview.map(row => `
                <tr>
                  <td><strong>${row.year}</strong></td>
                  <td>${row.totalDonations.toLocaleString('de-DE')} €</td>
                  <td>${row.projectDisbursements.toLocaleString('de-DE')} €</td>
                  <td><strong>0 € (0%)</strong></td>
                  <td><span class="badge-verified">${row.sourceNote}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <h2 style="margin-top:3rem;">Verifizierte Organisationsdokumente</h2>
        <p>Laden Sie die Originalsatzungen und Projektpläne unserer Partnerschaften herunter:</p>

        <div style="display:grid; gap:1rem; margin:1.5rem 0;">
          ${transparency.verifiedDocuments.map(doc => `
            <div style="background:var(--color-surface); padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
              <div>
                <h4 style="margin-bottom:0.25rem;">${doc.title}</h4>
                <p style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:0;">${doc.subtitle} • Format: ${doc.format} (${doc.size})</p>
              </div>
              <a href="${doc.url}" class="btn btn-secondary btn-sm" download>Herunterladen</a>
            </div>
          `).join('')}
        </div>

        <h2 style="margin-top:3rem;">Rechtlicher Status & Register</h2>
        <ul style="list-style:disc; margin-left:1.5rem; color:var(--color-text-muted); font-size:0.95rem; line-height:1.8;">
          <li><strong>Eingetragener Verein:</strong> ${org.legalName}</li>
          <li><strong>Registergericht:</strong> ${org.registration.court}</li>
          <li><strong>Registernummer:</strong> ${org.registration.number}</li>
          <li><strong>Steuerliche Anerkennung:</strong> ${org.registration.taxStatus} durch das ${org.registration.taxOffice}</li>
        </ul>

        <div style="margin-top:3rem;">
          ${renderDonationBox('de')}
        </div>
      </div>
    </section>
  `;

  writeRoute('/transparenz', renderHtmlPage({
    lang: 'de',
    title: 'Finanzielle Transparenz & Mittelverwendung',
    description: '100% der Spenden fließen direkt in Baumaterial und lokale Handwerker. Alle Verwaltungskosten werden privat getragen.',
    canonicalPath: '/transparenz/',
    content: transparencyDe
  }));

  // ==========================================
  // 6. ÜBER UNS (DEUTSCH)
  // ==========================================
  const aboutDe = `
    <section class="section">
      <div class="container container-narrow">
        <div class="section-header">
          <div class="section-tag">Gemeinschaft & Ursprung</div>
          <h1>Über Bildung mit Herz Sierra Leone e.V.</h1>
          <p class="lead">Unsere Arbeit begann mit einer persönlichen Freundschaft zweier Lehrer in London.</p>
        </div>

        <img src="/assets/images/about-founders.jpg" alt="Gründer Philipp Herzberg und Yoni Sesay" style="border-radius:var(--radius-lg); margin-bottom:2.5rem; box-shadow:var(--shadow-md);">

        <h2>Geschichte & Motivation</h2>
        <p>
          Yoni Sesay und Philipp Herzberg lernten sich als Kollegen an einer Schule in London kennen. 
          Yoni stammt aus Sierra Leone und nahm Philipp eines Sommers mit in seine Heimat. Sie reisten gemeinsam durch das Land, 
          schliefen in kleinen Dörfern und besuchten Schulen, die unter einfachsten Bedingungen unterrichteten.
        </p>
        <p>
          Diese intensive Erfahrung prägte beide nachhaltig. Aus dem Wunsch heraus, den Menschen nicht als anonyme Hilfsorganisation, 
          sondern als verlässliche Freunde auf Augenhöhe beizustehen, gründeten sie die Initiative <em>Bildung mit Herz Sierra Leone e.V.</em>
        </p>

        <h2 style="margin-top:2.5rem;">Der Vorstand</h2>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin:1.5rem 0;">
          ${org.board.map(b => `
            <div style="background:var(--color-surface); padding:1.5rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h3 style="margin-bottom:0.25rem; font-size:1.25rem;">${b.name}</h3>
              <p style="color:var(--color-terracotta); font-weight:600; font-size:0.85rem; margin-bottom:0.5rem;">${b.role}</p>
              <p style="color:var(--color-text-muted); font-size:0.9rem; margin-bottom:0;">${b.title}</p>
            </div>
          `).join('')}
        </div>

        <h2 style="margin-top:2.5rem;">Unsere Partner vor Ort</h2>
        <p>
          Ohne unsere lokalen Partnerinnen und Partner gäbe es kein einziges Projekt. Sie leiten die Bauüberwachung, koordinieren 
          Materialtransporte und genießen das uneingeschränkte Vertrauen der Dorfgemeinschaften:
        </p>

        <div style="display:grid; gap:1.25rem; margin:1.5rem 0;">
          <div style="background:var(--color-surface); padding:1.5rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
            <h4 style="margin-bottom:0.25rem;">Juliet Jeneba Fornah & Welfare Alert Sierra Leone</h4>
            <p style="color:var(--color-terracotta); font-size:0.85rem; font-weight:600;">Partnerin für Projekt Mamoru • Makeni</p>
            <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">Seit 2015 kämpft Juliet Fornah unermüdlich für Kinderrechte und Schulbildung in der Bombali-Region. Gemeinsam haben wir die Grundschule Mamoru von Grund auf erbaut.</p>
          </div>

          <div style="background:var(--color-surface); padding:1.5rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
            <h4 style="margin-bottom:0.25rem;">Yoni Sesay & Kaprr Yoni Global Learning Hub</h4>
            <p style="color:var(--color-terracotta); font-size:0.85rem; font-weight:600;">Partner für Projekt Mafabaneh & Bildungsreisen</p>
            <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">Gebürtig aus Mafabaneh, leitet Yoni die Bildungs- und Kulturprogramme vor Ort und koordinierte die historische Versöhnung der Nachbardörfer.</p>
          </div>
        </div>
      </div>
    </section>
  `;

  writeRoute('/ueber-uns', renderHtmlPage({
    lang: 'de',
    title: 'Über uns & Partner',
    description: 'Die Geschichte von Bildung mit Herz Sierra Leone e.V., gegründet von Philipp Herzberg und Yoni Sesay. Partnerschaft auf Augenhöhe.',
    canonicalPath: '/ueber-uns/',
    content: aboutDe
  }));

  // ==========================================
  // 7. BILDUNGSREISEN & REISEBERICHTE (DEUTSCH)
  // ==========================================
  const travelDe = `
    <section class="section">
      <div class="container container-narrow">
        <div class="section-header">
          <div class="section-tag">Interkultureller Dialog</div>
          <h1>${travel.title.de}</h1>
          <p class="lead">${travel.tagline.de}</p>
        </div>

        <img src="/assets/images/travel-masingbi.jpg" alt="Teilnehmende der Bildungsreise in Sierra Leone" style="border-radius:var(--radius-lg); margin-bottom:2.5rem; box-shadow:var(--shadow-md);">

        <h2>Unser Reiseansatz</h2>
        <p>${travel.philosophy.de}</p>

        <h2 style="margin-top:2.5rem;">Höhepunkte der Reise 2026</h2>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; margin:1.5rem 0;">
          ${travel.highlights2026.map(h => `
            <div style="background:var(--color-surface); padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h4 style="color:var(--color-terracotta); margin-bottom:0.35rem;">${h.title.de}</h4>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">${h.desc.de}</p>
            </div>
          `).join('')}
        </div>

        <div style="text-align:center; margin:2.5rem 0; padding:2rem; background:var(--color-surface-muted); border-radius:var(--radius-md); border:1px solid var(--color-border);">
          <h3>Ausführlicher Reisebericht 2026</h3>
          <p style="color:var(--color-text-muted); font-size:0.95rem; margin-bottom:1.25rem;">Lesen Sie den vollständigen Erfahrungsbericht von Philipp Herzberg über Trommeln in Makoma und Grundsteine in Mafabaneh.</p>
          <a href="/bildungsreisen/reiseberichte/" class="btn btn-primary">Zum Reisebericht 2026 →</a>
        </div>

        <h2 style="margin-top:3rem;">Häufige Fragen (FAQ)</h2>
        <div style="display:grid; gap:1rem; margin:1.5rem 0;">
          ${travel.faq.map(item => `
            <div style="background:var(--color-surface); padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h4 style="margin-bottom:0.35rem;">${item.q.de}</h4>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">${item.a.de}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  writeRoute('/bildungsreisen', renderHtmlPage({
    lang: 'de',
    title: 'Bildungsreisen & Interkultureller Austausch',
    description: 'Interkulturelle Bildungsreisen nach Sierra Leone für Schüler, Eltern und Lehrkräfte. Auf Augenhöhe, mit voller Kostenselbsttragung.',
    canonicalPath: '/bildungsreisen/',
    content: travelDe
  }));

  // 7.1 REISEBERICHT 2026
  const travelReportDe = `
    <section class="section">
      <div class="container container-narrow">
        <a href="/bildungsreisen/" class="btn btn-secondary btn-sm" style="margin-bottom:1.5rem;">← Zurück zu Bildungsreisen</a>
        <div class="section-header">
          <div class="section-tag">Reisebericht • März 2026</div>
          <h1>Zurück aus Sierra Leone: Was wir gebaut haben – und was uns bleibt</h1>
          <p class="lead">Der Abschlussbericht unserer dritten Bildungsreise. Von Philipp Herzberg.</p>
        </div>

        <img src="/assets/images/travel-gathering.jpg" alt="Begegnung in Sierra Leone" style="border-radius:var(--radius-lg); margin-bottom:2.5rem; box-shadow:var(--shadow-md);">

        <div style="font-size:1.05rem; line-height:1.75; color:var(--color-text-main);">
          <p>
            <em>„Wir reisen nicht als Touristen. Und wir reisen erst recht nicht als Retter. Wir reisen als Lernende und als Partner.”</em> 
            Jetzt, nach unserer Rückkehr, kann ich sagen: Diese Worte haben sich bewährt – nicht als Versprechen, sondern als Beschreibung dessen, was wirklich passiert ist.
          </p>
          <p>26 Menschen sind gemeinsam nach Sierra Leone gereist. Lehrer, Schüler, Eltern. Und jeder Einzelne von uns ist verändert zurückgekehrt.</p>

          <h2 style="margin-top:2.5rem;">Makoma: Das Schweigen nach den Trommeln</h2>
          <p>
            Unsere erste Nacht in Makoma werde ich nicht vergessen. Das Dorf hatte noch nie weiße Besucher empfangen. Mit Trommeln und Tänzen wurden wir die Hauptstraße entlanggeführt. Als die Nacht hereinbrach, spielten die Trommler Rhythmen, die direkt in Trance führten. Das ganze Dorf war auf den Beinen. Kinder, die anfangs noch scheu waren, strahlten vor Freude über einen einzigen Fußball, den wir mitgebracht hatten. Seit über einem Jahr hatte es dort keinen Ball gegeben.
          </p>

          <h2 style="margin-top:2.5rem;">Mamoru: Der Beweis, dass es funktioniert</h2>
          <p>
            In Mamoru steht eine Grundschule mit fünf Klassenzimmern. Dort sitzen keine Kinder mehr auf dem Steinboden einer umfunktionierten Kirche. Dort unterrichtet kein Lehrer drei Klassen gleichzeitig an drei verschiedenen Wänden eines einzigen dunklen Raums. Das ist möglich, weil Juliet Fornah seit 2017 dafür gekämpft hat. Dank der <strong>AcadeMedia Education GmbH</strong> konnten wir solide Möbel übergeben und die Gehälter von fünf Lehrkräften für ein ganzes Jahr im Voraus sichern.
          </p>

          <h2 style="margin-top:2.5rem;">Mafabaneh: Ein Grundstein und eine Versöhnung</h2>
          <p>
            In Mafabaneh, Yonis Heimatdorf, warteten 2.000 fertige Lehmziegel auf uns. Wir haben gemeinsam den Grundstein gelegt und die ersten Mauern hochgezogen. Was dabei kaum in Worte zu fassen ist: Dieses Schulprojekt hat einen fast 80 Jahre alten Grenzstreit mit dem Nachbardorf Magbashai beigelegt. Eine Schule als Friedensvertrag.
          </p>

          <h2 style="margin-top:2.5rem;">Diplomatie im Hintergrund</h2>
          <p>
            In Freetown durften wir sowohl die Tourismusministerin von Sierra Leone, Frau Nabeela Farida Tunis, als auch den deutschen Botschafter, Herrn Dr. Pascal Richter, treffen. Beide würdigten unseren Ansatz: Kein Resort-Tourismus, sondern echtes Eintauchen und Partnerschaft auf Augenhöhe.
          </p>
        </div>

        <div style="margin-top:3rem; padding-top:2rem; border-top:1px solid var(--color-border); text-align:center;">
          <a href="/spenden/" class="btn btn-primary">Dieses Projekt jetzt unterstützen</a>
        </div>
      </div>
    </section>
  `;

  writeRoute('/bildungsreisen/reiseberichte', renderHtmlPage({
    lang: 'de',
    title: 'Reisebericht 2026: Was wir gebaut haben',
    description: 'Abschlussbericht der dritten Bildungsreise von Bildung mit Herz Sierra Leone e.V. nach Makoma, Mamoru und Mafabaneh.',
    canonicalPath: '/bildungsreisen/reiseberichte/',
    content: travelReportDe
  }));

  // ==========================================
  // 8. SPENDEN (DEUTSCH)
  // ==========================================
  const spendenDe = `
    <section class="section">
      <div class="container container-narrow">
        <div class="section-header text-center">
          <div class="section-tag">Spenden & Fördern</div>
          <h1>Ihre Unterstützung verändert Leben</h1>
          <p class="lead">
            Mit Ihrer Spende schaffen Sie sichere Lernorte für Kinder in Sierra Leone – durch den Bau, 
            die Renovierung und die Ausstattung von Schulen vor Ort.
          </p>
        </div>

        ${renderDonationBox('de')}

        <div style="margin-top:3rem;">
          <h2>Häufige Fragen zu Spenden</h2>
          <div style="display:grid; gap:1rem; margin-top:1.5rem;">
            <div style="background:var(--color-surface); padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h4>Erhalte ich eine Spendenquittung?</h4>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">Ja. Für Beträge bis 300 € genügt dem deutschen Finanzamt der vereinfachte Nachweis (Kontoauszug). Für Beträge darüber stellen wir gerne eine offizielle Spendenbescheinigung aus. Bitte geben Sie Ihre Postanschrift im Verwendungszweck an oder senden Sie uns eine kurze E-Mail an bmh.sierraleone@gmail.com.</p>
            </div>
            <div style="background:var(--color-surface); padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h4>Kann ich zweckgebunden für ein bestimmtes Projekt spenden?</h4>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">Ja, absolut! Geben Sie bei der Überweisung einfach im Verwendungszweck das gewünschte Projekt an (z.B. „Spende Mamoru“, „Spende Mafabaneh“ oder „Spende Madina“). Das Geld wird ausschließlich dort eingesetzt.</p>
            </div>
            <div style="background:var(--color-surface); padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h4>Gibt es alternative Spendenwege (Kreditkarte, PayPal)?</h4>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">Um Gebührenabzüge durch Zahlungsdienstleister von bis zu 3 % zu vermeiden, setzen wir bewusst auf die direkte SEPA-Banküberweisung. So kommen garantiert 100 % Ihrer Unterstützung in Sierra Leone an.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  writeRoute('/spenden', renderHtmlPage({
    lang: 'de',
    title: 'Spenden für Schulprojekte in Sierra Leone',
    description: 'Spendenkonto von Bildung mit Herz Sierra Leone e.V. (Make Them Smile e.V.). 100% fließen direkt in Baumaterial und lokale Löhne.',
    canonicalPath: '/spenden/',
    content: spendenDe
  }));

  // ==========================================
  // 9. IMPRESSUM (DEUTSCH)
  // ==========================================
  const impressumDe = `
    <section class="section">
      <div class="container container-narrow">
        <h1>Impressum</h1>
        <p class="lead" style="margin-bottom:2rem;">Angaben gemäß § 5 Telemediengesetz (TMG) bzw. DDG</p>

        <div style="background:var(--color-surface); padding:2rem; border:1px solid var(--color-border); border-radius:var(--radius-lg); line-height:1.8;">
          <h3>Diensteanbieter</h3>
          <p>
            <strong>${org.legalName}</strong><br>
            ${org.address.street}<br>
            ${org.address.postalCode} ${org.address.city}<br>
            ${org.address.country}
          </p>

          <h3 style="margin-top:1.5rem;">Vertreten durch den Vorstand</h3>
          <p>
            ${org.board.map(b => `${b.name} (${b.role})`).join('<br>')}<br>
            Redaktionell verantwortlich gemäß § 18 Abs. 2 MStV: ${org.editorialResponsible}
          </p>

          <h3 style="margin-top:1.5rem;">Kontakt</h3>
          <p>
            E-Mail: <a href="mailto:${org.contacts.email}">${org.contacts.email}</a>
          </p>

          <h3 style="margin-top:1.5rem;">Registereintragung</h3>
          <p>
            Eintragung im Vereinsregister.<br>
            Registergericht: ${org.registration.court}<br>
            Registernummer: ${org.registration.number}
          </p>

          <h3 style="margin-top:1.5rem;">Gemeinnützigkeit</h3>
          <p>
            Der Verein ist nach dem letzten Freistellungsbescheid des ${org.registration.taxOffice} als gemeinnützig anerkannt, da er steuerbegünstigten Zwecken (Förderung der Bildung und der Entwicklungszusammenarbeit) dient.
          </p>

          <h3 style="margin-top:1.5rem;">Hinweis zu den Bildungsreisen</h3>
          <p style="font-size:0.9rem; color:var(--color-text-muted);">
            Die auf dieser Website beschriebenen Bildungsreisen dienen der Dokumentation unserer Vereinsarbeit und des interkulturellen Austauschs. 
            Der Verein tritt nicht als gewerblicher Reiseveranstalter im Sinne der §§ 651a ff. BGB auf. Sämtliche Reisen werden privat organisiert.
          </p>

          <h3 style="margin-top:1.5rem;">Haftung für Inhalte und Links</h3>
          <p style="font-size:0.9rem; color:var(--color-text-muted);">
            Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. 
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Für die Inhalte der verlinkten Seiten 
            ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
          </p>
        </div>
      </div>
    </section>
  `;

  writeRoute('/impressum', renderHtmlPage({
    lang: 'de',
    title: 'Impressum',
    description: 'Gesetzliche Anbieterkennzeichnung von Bildung mit Herz Sierra Leone e.V. (Make Them Smile e.V.).',
    canonicalPath: '/impressum/',
    content: impressumDe
  }));

  // ==========================================
  // 10. DATENSCHUTZ (DEUTSCH)
  // ==========================================
  const datenschutzDe = `
    <section class="section">
      <div class="container container-narrow">
        <h1>Datenschutzerklärung</h1>
        <p class="lead" style="margin-bottom:2rem;">Datenschutz nach DSGVO & TTDSG</p>

        <div style="background:var(--color-surface); padding:2rem; border:1px solid var(--color-border); border-radius:var(--radius-lg); line-height:1.8; font-size:0.95rem;">
          <h3>1. Datenschutz auf einen Blick</h3>
          <p>
            Verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:<br>
            <strong>${org.legalName}</strong><br>
            ${org.address.street}, ${org.address.postalCode} ${org.address.city}<br>
            E-Mail: <a href="mailto:${org.contacts.email}">${org.contacts.email}</a>
          </p>

          <h3 style="margin-top:1.5rem;">2. Hosting auf Cloudflare Pages</h3>
          <p>
            Diese Website wird als rein statische Website über Cloudflare Pages (Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, USA) gehostet.
            Zur Bereitstellung der Seiten und Abwehr von Cyberangriffen verarbeitet Cloudflare serverseitig technische Logdaten (IP-Adresse, Datum, Uhrzeit, abgerufene Ressource).
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren und performanten Betrieb).
          </p>

          <h3 style="margin-top:1.5rem;">3. Keine Tracking-Cookies & keine Werbetracker</h3>
          <p>
            Diese Website verwendet <strong>weder Tracking-Cookies noch Werbetracker oder Analyse-Tools</strong> (wie Google Analytics).
            Es werden keine Cookies auf Ihrem Endgerät gespeichert. Ein Cookie-Banner ist daher technisch und rechtlich nicht erforderlich.
          </p>

          <h3 style="margin-top:1.5rem;">4. Lokale Schriften (Keine Google Fonts Weiterleitung)</h3>
          <p>
            Wir binden Schriftarten ausschließlich über Standard-Systemschriftarten Ihres eigenen Endgeräts ein. 
            Es erfolgt keinerlei Abruf von externen Servern von Google oder Drittanbietern.
          </p>

          <h3 style="margin-top:1.5rem;">5. Kontaktaufnahme per E-Mail</h3>
          <p>
            Wenn Sie uns per E-Mail kontaktieren, werden Ihre Angaben (Name, E-Mail-Adresse, Nachrichteninhalt) zwecks Bearbeitung der Anfrage 
            und für den Fall von Anschlussfragen bei uns verarbeitet (Art. 6 Abs. 1 lit. b bzw. lit. f DSGVO). Eine Weitergabe an Dritte erfolgt nicht.
          </p>

          <h3 style="margin-top:1.5rem;">6. Spenden per Banküberweisung</h3>
          <p>
            Bei Spenden per Banküberweisung erhalten wir über den Kontoauszug Ihren Namen, Ihre IBAN und den Verwendungszweck. 
            Diese Daten verarbeiten wir ausschließlich zur ordnungsgemäßen Buchführung und zur Ausstellung von Zuwendungsbestätigungen (Art. 6 Abs. 1 lit. c DSGVO).
          </p>

          <h3 style="margin-top:1.5rem;">7. Ihre Rechte</h3>
          <p>
            Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Berichtigung, 
            Löschung oder Einschränkung der Verarbeitung sowie das Recht auf Datenübertragbarkeit und Beschwerde bei einer Aufsichtsbehörde.
          </p>
        </div>
      </div>
    </section>
  `;

  writeRoute('/datenschutz', renderHtmlPage({
    lang: 'de',
    title: 'Datenschutzerklärung',
    description: 'Datenschutzerklärung von Bildung mit Herz Sierra Leone e.V. Statisches Hosting auf Cloudflare Pages, zero Tracking-Cookies.',
    canonicalPath: '/datenschutz/',
    content: datenschutzDe
  }));

  // ==========================================
  // 11. WIDERRUF (DEUTSCH)
  // ==========================================
  const widerrufDe = `
    <section class="section">
      <div class="container container-narrow">
        <h1>Widerrufsbelehrung</h1>
        <p class="lead" style="margin-bottom:2rem;">Informationen zum Widerrufsrecht bei freiwilligen Zuwendungen</p>

        <div style="background:var(--color-surface); padding:2rem; border:1px solid var(--color-border); border-radius:var(--radius-lg); line-height:1.8;">
          <p>
            Spenden an gemeinnützige Körperschaften sind Schenkungen im Sinne des § 516 BGB. Bei freiwilligen Schenkungen ohne Gegenleistung 
            besteht nach deutschem Recht kein gesetzliches Widerrufsrecht wie im Verbrauchsgüterkauf.
          </p>
          <p>
            Sollte Ihnen bei einer Überweisung ein Irrtum unterlaufen sein (z.B. Tippfehler beim Betrag), wenden Sie sich bitte unverzüglich 
            per E-Mail an uns unter <a href="mailto:${org.contacts.email}">${org.contacts.email}</a>. Wir prüfen jede Anfrage wohlwollend und unbürokratisch.
          </p>
        </div>
      </div>
    </section>
  `;

  writeRoute('/widerruf', renderHtmlPage({
    lang: 'de',
    title: 'Widerrufsbelehrung',
    description: 'Widerrufsbelehrung für freiwillige Spenden an Bildung mit Herz Sierra Leone e.V.',
    canonicalPath: '/widerruf/',
    content: widerrufDe
  }));

  // ==========================================
  // 12. ENGLISCHE SEITEN (INTERNATIONAL AUDIENCE)
  // ==========================================
  // 12.1 HOME (EN)
  const homeEn = `
    <section class="hero">
      <div class="container hero-grid">
        <div>
          <span class="hero-tagline">Education with Heart Sierra Leone e.V.</span>
          <h1 class="hero-title">Building Schools. Enabling Futures.</h1>
          <p class="lead">
            Partnering directly with local rural communities to build resilient educational infrastructure in Sierra Leone. 
            Rooted in sustainable architecture, genuine friendship, and 100% financial transparency.
          </p>
          <div class="hero-actions">
            <a href="/en/projects/" class="btn btn-primary">Explore Projects</a>
            <a href="/en/corporate/" class="btn btn-secondary">Corporate Partnerships</a>
            <a href="/en/donate/" class="btn btn-outline">Donate Now</a>
          </div>
        </div>
        <div class="hero-image-wrap">
          <img src="/assets/images/hero-home.jpg" alt="Students in Sierra Leone" class="hero-image">
          <div class="hero-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <div>
              <strong>100% Direct Guarantee:</strong> All travel & administrative overhead is funded privately.
            </div>
          </div>
        </div>
      </div>
    </section>

    ${renderTrustBar('en')}

    <section class="section">
      <div class="container">
        <div class="section-header">
          <div class="section-tag">Active Projects</div>
          <h2>Documented Construction. Genuine Progress.</h2>
        </div>

        <div class="projects-grid">
          ${projects.map(p => `
            <article class="project-card">
              <div class="project-card-image-wrap">
                <img src="${p.leadImage}" alt="${p.title.en}" class="project-card-image">
                <span class="status-badge ${p.status}">${p.statusLabel.en}</span>
              </div>
              <div class="project-card-body">
                <h3 class="project-card-title">${p.title.en}</h3>
                <p class="project-card-summary">${p.tagline.en}</p>
                <div style="margin-top:auto; display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:0.8rem; color:var(--color-text-muted);">${p.location.split(',')[0]}</span>
                  <a href="/en/projects/${p.slug}/" class="btn btn-secondary btn-sm">View Project →</a>
                </div>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="section section-muted">
      <div class="container container-narrow">
        <div class="section-header text-center">
          <div class="section-tag">Direct Bank Transfer</div>
          <h2>Support Educational Work in Sierra Leone</h2>
        </div>
        ${renderDonationBox('en')}
      </div>
    </section>
  `;

  writeRoute('/en', renderHtmlPage({
    lang: 'en',
    title: 'Building Schools. Enabling Futures.',
    description: 'German registered nonprofit supporting sustainable school construction and education in Sierra Leone with 100% direct financial transparency.',
    canonicalPath: '/en/',
    content: homeEn
  }));

  // 12.2 PROJECTS OVERVIEW (EN)
  const projectsEn = `
    <section class="section">
      <div class="container">
        <div class="section-header">
          <div class="section-tag">Field Infrastructure</div>
          <h1>Our Educational Projects in Sierra Leone</h1>
          <p class="lead" style="max-width:760px;">Explore our school construction initiatives with verifiable documentation, local partners and architectural details.</p>
        </div>

        <div class="projects-grid">
          ${projects.map(p => `
            <article class="project-card">
              <div class="project-card-image-wrap">
                <img src="${p.leadImage}" alt="${p.title.en}" class="project-card-image">
                <span class="status-badge ${p.status}">${p.statusLabel.en}</span>
              </div>
              <div class="project-card-body">
                <h2 class="project-card-title">${p.title.en}</h2>
                <p class="project-card-summary">${p.tagline.en}</p>
                <div style="margin-top:auto; display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:0.85rem; color:var(--color-text-muted);">${p.location.split(',')[0]}</span>
                  <a href="/en/projects/${p.slug}/" class="btn btn-secondary btn-sm">Details →</a>
                </div>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  writeRoute('/en/projects', renderHtmlPage({
    lang: 'en',
    title: 'Our School Projects in Sierra Leone',
    description: 'Overview of all active educational infrastructure projects in Sierra Leone: Mafabaneh, Mamoru, and Madina.',
    canonicalPath: '/en/projects/',
    content: projectsEn
  }));

  // 12.3 MAFABANEH (EN)
  const mafaEn = `
    <section class="section">
      <div class="container container-narrow">
        <a href="/en/projects/" class="btn btn-secondary btn-sm" style="margin-bottom:1.5rem;">← Back to Projects</a>
        <div style="margin-bottom:1rem;"><span class="status-badge ${pMafa.status}">${pMafa.statusLabel.en}</span></div>
        <h1>${pMafa.title.en}</h1>
        <p class="lead" style="margin-bottom:2rem;">${pMafa.tagline.en}</p>
        <img src="${pMafa.leadImage}" alt="Mafabaneh Learning Hub" style="border-radius:var(--radius-lg); margin-bottom:2.5rem;">
        <h2>A Beacon of Sustainable Architecture & Peace</h2>
        <p>${pMafa.reconciliationStory.en}</p>
        <h2 style="margin-top:2.5rem;">Design by Sergei Tchoban (Tchoban Voss Architekten)</h2>
        <p>European Prize for Architecture 2018 laureate Sergei Tchoban created a circular earth-pavilion concept that uses passive airflow cooling without electric grid dependence.</p>
        <div style="margin-top:2.5rem;">
          <a href="${pMafa.localPartner.strategicPlanDocument}" class="btn btn-secondary btn-sm" download>📄 Download Strategic Plan 2025-2030 (PDF, 508 KB)</a>
        </div>
        <div style="margin-top:3rem;">${renderDonationBox('en')}</div>
      </div>
    </section>
  `;

  writeRoute('/en/projects/mafabaneh', renderHtmlPage({
    lang: 'en',
    title: pMafa.title.en,
    description: 'Sustainable circular earth architecture designed by Sergei Tchoban in Mafabaneh, Sierra Leone.',
    canonicalPath: '/en/projects/mafabaneh/',
    content: mafaEn,
    ogImage: pMafa.leadImage
  }));

  // 12.4 MAMORU (EN)
  const mamoruEn = `
    <section class="section">
      <div class="container container-narrow">
        <a href="/en/projects/" class="btn btn-secondary btn-sm" style="margin-bottom:1.5rem;">← Back to Projects</a>
        <div style="margin-bottom:1rem;"><span class="status-badge ${pMamoru.status}">${pMamoru.statusLabel.en}</span></div>
        <h1>${pMamoru.title.en}</h1>
        <p class="lead" style="margin-bottom:2rem;">${pMamoru.tagline.en}</p>
        <img src="${pMamoru.leadImage}" alt="Mamoru School" style="border-radius:var(--radius-lg); margin-bottom:2.5rem;">
        <h2>Five Classrooms Built — Real Transformation</h2>
        <p>${pMamoru.impactSummary.en}</p>
        <p>In partnership with Juliet Jeneba Fornah (Welfare Alert Sierra Leone) and major support from AcadeMedia Education GmbH (furniture and 1-year teacher payroll), five classrooms have been built and are now active.</p>
        <div style="margin-top:2.5rem;">
          <a href="${pMamoru.localPartner.partnerDocument}" class="btn btn-secondary btn-sm" download>📄 Download Partner Profile (PDF, 715 KB)</a>
        </div>
        <div style="margin-top:3rem;">${renderDonationBox('en')}</div>
      </div>
    </section>
  `;

  writeRoute('/en/projects/mamoru', renderHtmlPage({
    lang: 'en',
    title: pMamoru.title.en,
    description: 'Mamoru Primary School: 5 classrooms completed. Partner Welfare Alert Sierra Leone.',
    canonicalPath: '/en/projects/mamoru/',
    content: mamoruEn,
    ogImage: pMamoru.leadImage
  }));

  // 12.5 MADINA (EN)
  const madinaEn = `
    <section class="section">
      <div class="container container-narrow">
        <a href="/en/projects/" class="btn btn-secondary btn-sm" style="margin-bottom:1.5rem;">← Back to Projects</a>
        <div style="margin-bottom:1rem;"><span class="status-badge ${pMadina.status}">${pMadina.statusLabel.en}</span></div>
        <h1>${pMadina.title.en}</h1>
        <p class="lead" style="margin-bottom:2rem;">${pMadina.tagline.en}</p>
        <img src="${pMadina.leadImage}" alt="Madina Community" style="border-radius:var(--radius-lg); margin-bottom:2.5rem;">
        <h2>Lessons in Structural Engineering</h2>
        <p>${pMadina.honestHistory.en}</p>
        <h2 style="margin-top:2.5rem;">Re-engineered with Reinforced Concrete</h2>
        <p>Designed with professional civil engineers from our volunteer network, Phase 1 features 6 classrooms and a staff office built on seismic- and rain-resistant concrete frames.</p>
        <div style="margin-top:3rem;">${renderDonationBox('en')}</div>
      </div>
    </section>
  `;

  writeRoute('/en/projects/madina', renderHtmlPage({
    lang: 'en',
    title: pMadina.title.en,
    description: 'Madina Primary School: Structural re-engineering with reinforced concrete framework.',
    canonicalPath: '/en/projects/madina/',
    content: madinaEn,
    ogImage: pMadina.leadImage
  }));

  // 12.6 CORPORATE (EN)
  const corpEn = `
    <section class="section">
      <div class="container container-narrow">
        <div class="section-header">
          <div class="section-tag">Corporate Social Responsibility</div>
          <h1>${corporate.title.en}</h1>
          <p class="lead">${corporate.tagline.en}</p>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin:2rem 0;">
          ${corporate.valueProposition.map(v => `
            <div style="background:var(--color-surface); padding:1.5rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h3 style="font-size:1.15rem; margin-bottom:0.5rem;">${v.title.en}</h3>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">${v.desc.en}</p>
            </div>
          `).join('')}
        </div>
        <div style="text-align:center; margin-top:3rem; padding:2.5rem; background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-lg);">
          <h2>Schedule an Executive Briefing</h2>
          <p class="lead" style="max-width:600px; margin:0.75rem auto 1.5rem;">Connect directly with co-founder and school principal Philipp Herzberg for corporate partnership options.</p>
          <a href="mailto:${org.contacts.email}?subject=Corporate%20Partnership%20Inquiry" class="btn btn-primary">Email Philipp Herzberg</a>
        </div>
      </div>
    </section>
  `;

  writeRoute('/en/corporate', renderHtmlPage({
    lang: 'en',
    title: 'Corporate Partnerships & CSR',
    description: 'Corporate philanthropy with verifiable due diligence and 100% direct project funding in Sierra Leone.',
    canonicalPath: '/en/corporate/',
    content: corpEn
  }));

  // 12.7 TRANSPARENCY (EN)
  const transpEn = `
    <section class="section">
      <div class="container container-narrow">
        <div class="section-header">
          <div class="section-tag">Governance & Audit</div>
          <h1>${transparency.title.en}</h1>
          <p class="lead">${transparency.tagline.en}</p>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin:2rem 0;">
          ${transparency.corePrinciples.map(p => `
            <div style="background:var(--color-surface); padding:1.5rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h3 style="font-size:1.15rem; color:var(--color-terracotta); margin-bottom:0.5rem;">${p.title.en}</h3>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">${p.desc.en}</p>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:3rem;">${renderDonationBox('en')}</div>
      </div>
    </section>
  `;

  writeRoute('/en/transparency', renderHtmlPage({
    lang: 'en',
    title: 'Financial Transparency & Governance',
    description: '100% of donations are deployed directly into building materials and local labor. All administrative costs are privately covered.',
    canonicalPath: '/en/transparency/',
    content: transpEn
  }));

  // 12.8 ABOUT (EN)
  const aboutEn = `
    <section class="section">
      <div class="container container-narrow">
        <div class="section-header">
          <div class="section-tag">Our Story</div>
          <h1>About Education with Heart Sierra Leone e.V.</h1>
          <p class="lead">Founded on a genuine friendship between two teachers in London.</p>
        </div>
        <img src="/assets/images/about-founders.jpg" alt="Philipp Herzberg and Yoni Sesay" style="border-radius:var(--radius-lg); margin-bottom:2.5rem;">
        <p>Philipp Herzberg and Yoni Sesay met while teaching together at a school in London. That summer, Yoni invited Philipp to visit his home country, Sierra Leone. Traveling through rural villages and witnessing community resilience inspired them to create an association built on mutual dignity and long-term partnership.</p>
      </div>
    </section>
  `;

  writeRoute('/en/about', renderHtmlPage({
    lang: 'en',
    title: 'About Us',
    description: 'The story and founders of Bildung mit Herz Sierra Leone e.V. — Philipp Herzberg and Yoni Sesay.',
    canonicalPath: '/en/about/',
    content: aboutEn
  }));

  // 12.9 TRAVEL (EN)
  const travelEn = `
    <section class="section">
      <div class="container container-narrow">
        <div class="section-header">
          <div class="section-tag">Intercultural Exchange</div>
          <h1>${travel.title.en}</h1>
          <p class="lead">${travel.tagline.en}</p>
        </div>
        <img src="/assets/images/travel-masingbi.jpg" alt="Educational expedition" style="border-radius:var(--radius-lg); margin-bottom:2.5rem;">
        <p>${travel.philosophy.en}</p>
      </div>
    </section>
  `;

  writeRoute('/en/travel', renderHtmlPage({
    lang: 'en',
    title: 'Educational Expeditions',
    description: 'Intercultural learning expeditions connecting students, parents and educators between Germany and Sierra Leone.',
    canonicalPath: '/en/travel/',
    content: travelEn
  }));

  // 12.10 DONATE (EN)
  const donateEn = `
    <section class="section">
      <div class="container container-narrow">
        <div class="section-header text-center">
          <div class="section-tag">Make an Impact</div>
          <h1>Support School Construction in Sierra Leone</h1>
          <p class="lead">Direct SEPA / international bank transfer ensures 100% of your gift reaches school sites without payment gateway fees.</p>
        </div>
        ${renderDonationBox('en')}
      </div>
    </section>
  `;

  writeRoute('/en/donate', renderHtmlPage({
    lang: 'en',
    title: 'Donate to School Projects',
    description: 'Direct donation bank details for Bildung mit Herz Sierra Leone e.V. (Make Them Smile e.V.).',
    canonicalPath: '/en/donate/',
    content: donateEn
  }));

  // ==========================================
  // 13. CLOUDFLARE PAGES _REDIRECTS
  // ==========================================
  const redirectsContent = `# Cloudflare Pages Redirects
# Legacy Jimdo URLs
/cookie-einstellungen/   /datenschutz/   301
/cookie-einstellungen   /datenschutz/   301
/home/                  /               301
/home                   /               301
/projekte/kappr-yoni/   /projekte/mafabaneh/ 301
/projekte/kappr-yoni    /projekte/mafabaneh/ 301

# Canonical Trailing Slash Normalizations
/ueber-uns              /ueber-uns/     301
/projekte               /projekte/      301
/spenden                /spenden/       301
/impressum              /impressum/     301
/datenschutz            /datenschutz/   301
/widerruf               /widerruf/      301
/bildungsreisen         /bildungsreisen/ 301
/fuer-unternehmen       /fuer-unternehmen/ 301
/transparenz            /transparenz/   301
`;
  fs.writeFileSync(path.join(DIST_DIR, '_redirects'), redirectsContent, 'utf8');

  // ==========================================
  // 14. SITEMAP.XML & ROBOTS.TXT
  // ==========================================
  const today = new Date().toISOString().split('T')[0];
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${generatedUrls.map(u => `  <url>
    <loc>${BASE_URL}${u}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${u === '/' ? '1.0' : (u.startsWith('/projekte/') ? '0.9' : '0.8')}</priority>
  </url>`).join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml, 'utf8');

  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;
  fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robotsTxt, 'utf8');

  console.log(`✅ Build Complete!`);
  console.log(`   Generated ${generatedUrls.length} static routes in ${DIST_DIR}`);
  console.log(`   Generated sitemap.xml, robots.txt, and _redirects`);
}

buildSite();
