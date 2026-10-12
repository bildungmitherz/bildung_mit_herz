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
const news = loadJson('news.json');
const materials = loadJson('materials.json');

// Only active projects (Madina removed per instruction)
const projects = [
  loadJson('projects/mafabaneh.json'),
  loadJson('projects/mamoru.json')
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

  <!-- Client-side Scripts -->
  <script src="/assets/js/main.js" defer></script>

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
    ${JSON.stringify(finalSchema, null, 2)}
  </script>
</head>
<body>
  <!-- Header -->
  <header class="site-header">
    <div class="container header-inner">
      <a href="${lang === 'de' ? '/' : '/en/'}" class="brand-link" aria-label="${lang === 'de' ? 'Zur Startseite' : 'To Homepage'}">
        <img src="/assets/images/logo.png" alt="Bildung mit Herz Logo" class="brand-logo" width="44" height="44">
        <div>
          <div class="brand-title">${currentNav.brand}</div>
          <div class="brand-subtitle">${currentNav.subBrand}</div>
        </div>
      </a>

      <!-- Desktop Navigation -->
      <nav class="nav-desktop" aria-label="${lang === 'de' ? 'Hauptnavigation' : 'Main Navigation'}">
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
          <a href="${dePath}" class="lang-btn ${lang === 'de' ? 'active' : ''}" aria-label="Deutsche Version">DE</a>
          <a href="${enPath}" class="lang-btn ${lang === 'en' ? 'active' : ''}" aria-label="English version">EN</a>
        </div>

        <!-- Donate CTA -->
        <a href="${currentNav.cta.url}" class="btn btn-primary btn-sm">${currentNav.cta.title}</a>
      </nav>

      <!-- Mobile Hamburger Button -->
      <button class="nav-toggle" aria-label="Menü öffnen" aria-expanded="false">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </header>

  <!-- Mobile Drawer -->
  <div class="nav-overlay" aria-hidden="true"></div>
  <nav class="nav-mobile" aria-label="Mobiles Menü">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid var(--color-border); padding-bottom:1rem;">
      <span style="font-weight:700; color:var(--color-slate-dark);">${currentNav.brand}</span>
      <div class="lang-switch">
        <a href="${dePath}" class="lang-btn ${lang === 'de' ? 'active' : ''}">DE</a>
        <a href="${enPath}" class="lang-btn ${lang === 'en' ? 'active' : ''}">EN</a>
      </div>
    </div>
    
    <div style="display:flex; flex-direction:column; gap:0.75rem;">
      <a href="${lang === 'de' ? '/' : '/en/'}" class="nav-link" style="font-size:1.05rem;">${lang === 'de' ? 'Startseite' : 'Home'}</a>
      ${currentNav.links.map(link => {
        if (link.children) {
          return `
            <div style="margin:0.25rem 0;">
              <div style="font-weight:700; font-size:0.85rem; text-transform:uppercase; color:var(--color-terracotta); margin-bottom:0.35rem;">${link.title}</div>
              <div style="display:flex; flex-direction:column; gap:0.5rem; padding-left:0.75rem;">
                ${link.children.map(c => `
                  <a href="${c.url}" class="nav-link" style="font-size:0.95rem;">${c.title}</a>
                `).join('')}
              </div>
            </div>
          `;
        }
        return `<a href="${link.url}" class="nav-link" style="font-size:1.05rem;">${link.title}</a>`;
      }).join('')}
    </div>

    <div style="margin-top:2rem;">
      <a href="${currentNav.cta.url}" class="btn btn-primary" style="width:100%; text-align:center;">${currentNav.cta.title}</a>
    </div>
  </nav>

  <!-- Main Content -->
  <main id="main-content">
    ${content}
  </main>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <div class="footer-title">${currentNav.brand}</div>
        <p class="footer-desc">
          ${lang === 'de' 
            ? 'Gemeinnütziger Verein zur Förderung von Bildungsinfrastruktur und nachhaltigem Schulbau in Sierra Leone. Eingetragen beim Amtsgericht Berlin (VR 41272 B).' 
            : 'Registered German charity advancing rural educational infrastructure and sustainable school construction in Sierra Leone (VR 41272 B).'}
        </p>
        <div style="font-size:0.85rem; color:#a8a29e; line-height:1.6;">
          <strong>${lang === 'de' ? 'Spendenkonto' : 'Bank Account'}:</strong> Berliner Sparkasse<br>
          <strong>IBAN:</strong> ${org.banking.iban}<br>
          <strong>BIC:</strong> ${org.banking.bic}<br>
          <strong>${lang === 'de' ? 'Inhaber' : 'Holder'}:</strong> ${org.banking.accountHolder}
        </div>
      </div>

      <div>
        <div class="footer-col-title">${lang === 'de' ? 'Projekte' : 'Projects'}</div>
        <ul class="footer-links">
          <li><a href="${lang === 'de' ? '/projekte/' : '/en/projects/'}">${lang === 'de' ? 'Alle Projekte' : 'All Projects'}</a></li>
          <li><a href="${lang === 'de' ? '/projekte/mafabaneh/' : '/en/projects/mafabaneh/'}">Mafabaneh Learning Hub</a></li>
          <li><a href="${lang === 'de' ? '/projekte/mamoru/' : '/en/projects/mamoru/'}">${lang === 'de' ? 'Grundschule Mamoru' : 'Mamoru Primary School'}</a></li>
        </ul>
      </div>

      <div>
        <div class="footer-col-title">${lang === 'de' ? 'Organisation' : 'Organization'}</div>
        <ul class="footer-links">
          <li><a href="${lang === 'de' ? '/ueber-uns/' : '/en/about/'}">${lang === 'de' ? 'Über uns & Partner' : 'About Us & Partners'}</a></li>
          <li><a href="${lang === 'de' ? '/bildungsreisen/' : '/en/travel/'}">${lang === 'de' ? 'Bildungsreisen' : 'Educational Trips'}</a></li>
          <li><a href="${lang === 'de' ? '/transparenz/' : '/en/transparency/'}">${lang === 'de' ? 'Transparenz & Finanzen' : 'Financial Transparency'}</a></li>
          <li><a href="${lang === 'de' ? '/fuer-unternehmen/' : '/en/corporate/'}">${lang === 'de' ? 'Für Unternehmen' : 'Corporate Partnerships'}</a></li>
          <li><a href="${lang === 'de' ? '/spenden/' : '/en/donate/'}">${lang === 'de' ? 'Spenden' : 'Donate'}</a></li>
        </ul>
      </div>

      <div>
        <div class="footer-col-title">${lang === 'de' ? 'Rechtliches' : 'Legal'}</div>
        <ul class="footer-links">
          ${currentNav.footerLegal.map(item => `
            <li><a href="${item.url}">${item.title}</a></li>
          `).join('')}
        </ul>
      </div>
    </div>

    <div class="container footer-bottom">
      <div>
        © ${new Date().getFullYear()} ${org.legalName}. ${lang === 'de' ? 'Alle Rechte vorbehalten.' : 'All rights reserved.'}
      </div>
      <div class="social-links-row">
        <a href="${org.socialLinks.instagram}" target="_blank" rel="noopener" class="social-icon-link">Instagram</a>
        <a href="${org.socialLinks.linkedin}" target="_blank" rel="noopener" class="social-icon-link">LinkedIn</a>
        <a href="${org.socialLinks.youtube}" target="_blank" rel="noopener" class="social-icon-link">YouTube</a>
        <a href="${org.socialLinks.substack}" target="_blank" rel="noopener" class="social-icon-link">Substack</a>
      </div>
    </div>
  </footer>

  <!-- German Design Award 2027 Announcement Modal -->
  <div id="award-modal" class="modal-backdrop" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="award-modal-title">
    <div class="modal-dialog">
      <button class="modal-close" aria-label="${lang === 'de' ? 'Modal schließen' : 'Close modal'}">&times;</button>
      <div class="modal-content">
        <div class="award-header-badge">
          <span class="award-trophy">🏆</span>
          <span class="award-badge-text">German Design Award 2027 • Winner</span>
        </div>
        <h3 id="award-modal-title" class="award-title">
          ${lang === 'de' 
            ? 'Auszeichnung für den Mafabaneh Learning Hub!' 
            : 'Mafabaneh Learning Hub Wins German Design Award 2027!'}
        </h3>
        <div class="award-category">
          ${lang === 'de'
            ? 'Kategorie: Excellent Architecture – Conceptual Architecture'
            : 'Category: Excellent Architecture – Conceptual Architecture'}
        </div>
        <p class="award-body-text">
          ${lang === 'de'
            ? 'Wir freuen uns riesig: Das visionäre, nachhaltige Schulbaukonzept der <strong>Mafabaneh Village School</strong> in Sierra Leone wurde vom Rat für Formgebung mit dem renommierten <strong>German Design Award 2027</strong> ausgezeichnet! Der Entwurf stammt ehrenamtlich von <strong>Tchoban Voss Architekten (Sergei Tchoban)</strong> in enger Zusammenarbeit mit unserem Verein.'
            : 'We are thrilled to share: The visionary, sustainable school concept for the <strong>Mafabaneh Village School</strong> in Sierra Leone has been awarded the prestigious <strong>German Design Award 2027</strong> by the German Design Council! The design was created pro bono by <strong>Tchoban Voss Architekten (Sergei Tchoban)</strong> in close partnership with our association.'}
        </p>
        <div class="award-actions">
          <a href="https://www.german-design-award.com/en/gallery/detail/conceptual-architecture/mafabane-village-school-sierra-leone" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
            ${lang === 'de' ? 'Offizielle Jury-Würdigung ansehen ↗' : 'View Official Award Entry ↗'}
          </a>
          <a href="${lang === 'de' ? '/projekte/mafabaneh/' : '/en/projects/mafabaneh/'}" class="btn btn-secondary btn-sm">
            ${lang === 'de' ? 'Zum Projekt Mafabaneh →' : 'Explore Mafabaneh Project →'}
          </a>
        </div>
      </div>
    </div>
  </div>
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
            <div class="metric-value">2</div>
            <div class="metric-label">${lang === 'de' ? 'Kernprojekte' : 'Core Projects'}</div>
            <div class="metric-sub">Mafabaneh • Mamoru</div>
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

// Prominent High-Visibility Bank Account Quick Card
function renderBankQuickCard(lang = 'de', specificProject = '') {
  const isDe = lang === 'de';
  const memoText = specificProject 
    ? (isDe ? `Spende ${specificProject} + Anschrift` : `Donation ${specificProject} + Address`)
    : (isDe ? 'Spende [Projektname] + Anschrift' : 'Donation [Project] + Address');

  return `
    <div class="bank-quick-card">
      <div class="bank-quick-card-header">
        <div>
          <h3 class="bank-quick-card-title">💳 ${isDe ? 'Direkte Banküberweisung auf unser Spendenkonto' : 'Direct Bank Transfer to Donation Account'}</h3>
          <p style="color:var(--color-text-muted); font-size:0.88rem; margin:0.25rem 0 0;">
            ${isDe ? '100 % Ihrer Spende fließt direkt in Baumaterial und Handwerkerlöhne vor Ort.' : '100% of your donation flows directly into local building materials and labor.'}
          </p>
        </div>
        <span class="badge-verified" style="white-space:nowrap;">✓ ${isDe ? 'Gemeinnützig anerkannt' : 'Tax Deductible'}</span>
      </div>

      <div class="bank-quick-data-grid">
        <div class="bank-data-item">
          <div class="bank-data-label">${isDe ? 'Kontoinhaber / Empfänger' : 'Account Holder / Recipient'}</div>
          <div class="bank-data-value">${org.banking.accountHolder}</div>
        </div>
        <div class="bank-data-item">
          <div class="bank-data-label">IBAN</div>
          <div class="bank-data-value" style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem;">
            <span>${org.banking.iban}</span>
            <button type="button" class="copy-btn" data-copy="${org.banking.iban}">
              ${isDe ? 'Kopieren' : 'Copy'}
            </button>
          </div>
        </div>
        <div class="bank-data-item">
          <div class="bank-data-label">BIC / SWIFT</div>
          <div class="bank-data-value">${org.banking.bic}</div>
        </div>
        <div class="bank-data-item">
          <div class="bank-data-label">${isDe ? 'Bankinstitut' : 'Banking Institution'}</div>
          <div class="bank-data-value">${org.banking.bankName}</div>
        </div>
      </div>

      <div style="background:#ffffff; padding:0.75rem 1rem; border-radius:var(--radius-md); border:1px solid var(--color-border); font-size:0.88rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
        <div>
          <span style="font-weight:700; color:var(--color-slate-dark);">${isDe ? 'Verwendungszweck' : 'Transfer Memo'}:</span>
          <code style="background:var(--color-surface-muted); padding:0.2rem 0.5rem; border-radius:3px; margin-left:0.35rem; font-weight:600;">${memoText}</code>
        </div>
        <span style="font-size:0.8rem; color:var(--color-text-muted);">${isDe ? 'Für Spendenquittung bitte Postadresse im Zweck angeben' : 'Please include address for tax deduction receipt'}</span>
      </div>

      <div class="callout" style="margin-top:1rem; margin-bottom:0; padding:1rem; font-size:0.85rem;">
        <strong style="color:var(--color-slate-dark);">${isDe ? 'Hinweis zum Kontoinhaber' : 'Account Holder Note'}:</strong>
        ${org.renamingNotice[lang] || org.renamingNotice.de}
      </div>
    </div>
  `;
}

// Reusable Donation Box (Detailed)
function renderDonationBox(lang = 'de') {
  return renderBankQuickCard(lang);
}

// Recent Developments & News Section for Homepage
function renderNewsSection(lang = 'de') {
  const isDe = lang === 'de';
  return `
    <section class="section" style="padding-top:2rem;">
      <div class="container">
        <div class="section-header">
          <div class="section-tag">${isDe ? 'Aktuelles & Neuigkeiten' : 'Recent Developments & News'}</div>
          <h2>${isDe ? 'Neues aus Sierra Leone & Vereinsarbeit' : 'Latest Field News & Association Updates'}</h2>
          <p class="lead" style="max-width:720px;">
            ${isDe 
              ? 'Transparente Einblicke in Baufortschritte, Bildungsreisen und unsere Partnerschaften vor Ort.' 
              : 'Transparent updates on construction progress, field journeys and on-the-ground partnerships.'}
          </p>
        </div>

        <div class="news-grid">
          ${news.map(item => {
            const itemLink = typeof item.link === 'object' ? item.link[lang] : item.link;
            const isExternal = itemLink.startsWith('http');
            return `
              <article class="news-card">
                <img src="${item.image}" alt="${item.title[lang]}" class="news-card-img">
                <div class="news-card-body">
                  <div class="news-card-meta">
                    <span class="news-card-pill">${item.category[lang]}</span>
                    <span class="news-card-date">${item.date}</span>
                  </div>
                  <h3 class="news-card-title">${item.title[lang]}</h3>
                  <p class="news-card-summary">${item.summary[lang]}</p>
                  <div style="margin-top:auto;">
                    <a href="${itemLink}" ${isExternal ? 'target="_blank" rel="noopener"' : ''} class="btn btn-secondary btn-sm">${isDe ? 'Mehr erfahren →' : 'Read more →'}</a>
                  </div>
                </div>
              </article>
            `;
          }).join('')}
        </div>
      </div>
    </section>
  `;
}

// Material & Cost Transparency Table / Grid for Donation Page
function renderMaterialsGrid(lang = 'de') {
  const isDe = lang === 'de';
  return `
    <div style="margin:3rem 0;">
      <div style="margin-bottom:1.5rem;">
        <h2>${isDe ? 'Was Ihre Spende konkret bewirkt' : 'What Your Donation Concretely Funds'}</h2>
        <p class="lead" style="margin-bottom:0;">
          ${isDe 
            ? 'Transparente Kostentabelle: So werden Spendengelder in handfeste Baumaterialien und Bildungsausstattung umgesetzt.' 
            : 'Transparent cost overview: How donations are converted into real building materials and educational resources.'}
        </p>
      </div>

      <div class="material-grid">
        ${materials.map(m => `
          <div class="material-card">
            <img src="${m.image}" alt="${m.name[lang]}" class="material-card-img">
            <div class="material-card-body">
              <div class="material-card-header">
                <h4 class="material-card-title">${m.name[lang]}</h4>
                <span class="material-card-price">${m.amountEur} €</span>
              </div>
              <p class="material-card-desc">${m.desc[lang]}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Official German Charity Governance Documents
function renderGovernanceDocsSection(lang = 'de') {
  const isDe = lang === 'de';
  return `
    <div style="margin:3.5rem 0;">
      <h2>${isDe ? 'Offizielle Vereinsdokumente & Gemeinnützigkeitsnachweise' : 'Official Legal & Charity Governance Documents'}</h2>
      <p class="lead">
        ${isDe 
          ? 'Als eingetragener gemeinnütziger Verein veröffentlichen wir unsere grundlegenden Rechts- und Finanzdokumente zur lückenlosen Nachprüfbarkeit.' 
          : 'As a registered charity in Germany, we publish our core legal and financial governance documents for complete transparency.'}
      </p>

      <div class="doc-grid">
        ${org.governanceDocuments.map(doc => `
          <div class="doc-card">
            <div class="doc-card-icon">📄</div>
            <div style="flex-grow:1;">
              <h4 class="doc-card-title">${doc.title[lang]}</h4>
              <p class="doc-card-subtitle">${doc.subtitle[lang]}</p>
              <div class="doc-card-meta">
                <span><strong>${isDe ? 'Aussteller' : 'Issuer'}:</strong> ${doc.issuer}</span> • 
                <span>${doc.format}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// 100% Symmetrical Project Detail Page Renderer
function renderProjectDetailPage(p, lang = 'de') {
  const isDe = lang === 'de';
  const isMafabaneh = p.id === 'mafabaneh';

  return `
    <section class="section">
      <div class="container container-narrow">
        <a href="${isDe ? '/projekte/' : '/en/projects/'}" class="btn btn-secondary btn-sm" style="margin-bottom:1.5rem;">
          ${isDe ? '← Zurück zur Projektübersicht' : '← Back to Projects Overview'}
        </a>
        
        <div style="margin-bottom:1rem; display:flex; align-items:center; gap:0.75rem;">
          <span class="status-badge ${p.status}">${p.statusLabel[lang]}</span>
          <span style="font-size:0.9rem; color:var(--color-text-muted);">📍 ${p.location}</span>
        </div>

        <h1 style="margin-bottom:0.75rem;">${p.title[lang]}</h1>
        <p class="lead" style="margin-bottom:2rem;">${p.tagline[lang]}</p>

        <img src="${p.leadImage}" alt="${p.title[lang]}" style="border-radius:var(--radius-lg); margin-bottom:2rem; box-shadow:var(--shadow-md); width:100%; object-fit:cover; max-height:480px;">

        ${isMafabaneh ? `
          <!-- German Design Award 2027 Feature Box -->
          <div style="background:linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%); border:2px solid #fde68a; border-radius:var(--radius-lg); padding:1.75rem; margin-bottom:2rem; box-shadow:var(--shadow-sm);">
            <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem; flex-wrap:wrap;">
              <span style="font-size:1.75rem;">🏆</span>
              <span style="background:#92400e; color:#ffffff; font-weight:800; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; padding:0.25rem 0.65rem; border-radius:var(--radius-full);">
                Winner 2027
              </span>
              <strong style="font-size:1.15rem; color:#78350f;">
                German Design Award 2027
              </strong>
            </div>
            <div style="font-weight:700; color:#92400e; margin-bottom:0.5rem; font-size:0.95rem;">
              ${isDe ? 'Auszeichnung für Excellent Architecture – Conceptual Architecture' : 'Winner: Excellent Architecture – Conceptual Architecture'}
            </div>
            <p style="font-size:0.9rem; color:#78350f; line-height:1.55; margin-bottom:1rem;">
              ${isDe
                ? 'Das visionäre Architekturkonzept der Mafabaneh Village School, ehrenamtlich entworfen von <strong>Tchoban Voss Architekten (Sergei Tchoban)</strong> in Partnerschaft mit <strong>Bildung mit Herz Sierra Leone e.V.</strong>, wurde vom Rat für Formgebung mit dem angesehenen German Design Award 2027 prämiert.'
                : 'The visionary architecture of the Mafabaneh Village School, designed pro bono by <strong>Tchoban Voss Architekten (Sergei Tchoban)</strong> in partnership with <strong>Bildung mit Herz Sierra Leone e.V.</strong>, has been honored with the renowned German Design Award 2027 by the German Design Council.'}
            </p>
            <a href="https://www.german-design-award.com/en/gallery/detail/conceptual-architecture/mafabane-village-school-sierra-leone" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
              ${isDe ? 'Offizielle Jury-Begründung im German Design Award Katalog ansehen ↗' : 'View Official Jury Entry in German Design Award Gallery ↗'}
            </a>
          </div>
        ` : ''}

        <!-- Prominent Bank Info Quick Card Right Near Top -->
        ${renderBankQuickCard(lang, p.title[lang])}

        <!-- Project Story & Impact -->
        <div style="margin:2.5rem 0;">
          <h2>${isDe ? (isMafabaneh ? 'Architektur als Symbol des Friedens' : 'Ausgangslage & Reale Transformation') : (isMafabaneh ? 'Architecture as a Living Peace Covenant' : 'Impact & Real Transformation')}</h2>
          <p>${isMafabaneh ? p.reconciliationStory[lang] : p.impactSummary[lang]}</p>
        </div>

        <!-- Partner & Leadership Spotlight -->
        <div style="background:var(--color-surface); padding:2rem; border:1px solid var(--color-border); border-radius:var(--radius-lg); margin:2.5rem 0;">
          <h3 style="margin-bottom:1rem; color:var(--color-slate-dark);">
            ${isDe ? 'Partner vor Ort & Konzeption' : 'Local Partner & Leadership'}
          </h3>
          ${isMafabaneh ? `
            <p>
              <strong>${p.architect.name} (${p.architect.leadArchitect}):</strong> ${p.architect.notableDetails[lang]}
            </p>
            <p style="margin-bottom:1.5rem;">
              <em>${p.architect.siteVisit[lang]}</em>
            </p>
            <p>
              <strong>${isDe ? 'Lokale Trägerschaft' : 'Local Leadership'}:</strong> ${p.localPartner.organization} (${p.localPartner.leader}).
            </p>
            <a href="${p.localPartner.strategicPlanDocument}" class="btn btn-secondary btn-sm" download>
              📄 ${isDe ? 'Strategieplan 2025–2030 herunterladen (PDF, 508 KB)' : 'Download Strategic Plan 2025-2030 (PDF, 508 KB)'}
            </a>
          ` : `
            <p>
              <strong>${p.localPartner.organization} (${p.localPartner.leader}):</strong> 
              ${isDe 
                ? 'Juliet Fornah setzt sich seit Jahren in Makeni für Kinderrechte ein und leitet die Bauaufsicht vor Ort.' 
                : 'Juliet Fornah advocates tirelessly for child welfare in Makeni and leads construction oversight on site.'}
            </p>
            <p style="margin-bottom:1.5rem;">
              <strong>${p.corporateSponsorship.sponsor}:</strong> 
              ${isDe 
                ? 'Dank der Unterstützung von AcadeMedia konnten alle fünf Klassenräume mit festen Schultischen ausgestattet und fünf Lehrergehälter für ein volles Jahr finanziert werden.' 
                : 'AcadeMedia funded solid wooden desks for all five rooms and secured 12 months of payroll for five teachers.'}
            </p>
            <a href="${p.localPartner.partnerDocument}" class="btn btn-secondary btn-sm" download>
              📄 ${isDe ? 'Organisationsprofil Welfare Alert herunterladen (PDF, 715 KB)' : 'Download Welfare Alert Profile (PDF, 715 KB)'}
            </a>
          `}
        </div>

        <!-- Features / Specifics -->
        ${isMafabaneh ? `
          <h2 style="margin-top:3rem;">${isDe ? 'Besondere Konstruktionsmerkmale' : 'Key Architectural Features'}</h2>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:1.25rem; margin:1.5rem 0;">
            ${p.constructionFeatures.map(f => `
              <div style="background:var(--color-surface); padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
                <h4 style="margin-bottom:0.35rem; color:var(--color-terracotta);">${f.title[lang]}</h4>
                <p style="font-size:0.9rem; margin-bottom:0; color:var(--color-text-muted);">${f.desc[lang]}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Chronological Progress & Construction Milestones -->
        <h2 style="margin-top:3rem;">${isDe ? 'Chronologischer Baufortschritt & Meilensteine' : 'Chronological Construction Progress & Milestones'}</h2>
        <div style="margin:1.5rem 0;">
          ${p.milestones.map((m, idx) => `
            <div class="chronology-step">
              ${m.image ? `<img src="${m.image}" alt="${m.title[lang]}" class="chronology-step-img">` : ''}
              <div class="chronology-step-content">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem; flex-wrap:wrap; gap:0.5rem;">
                  <span style="font-weight:700; color:var(--color-terracotta); font-size:0.95rem;">${m.date}</span>
                  <span style="font-size:0.75rem; background:${m.completed ? '#dcfce7' : '#fef3c7'}; color:${m.completed ? '#166534' : '#92400e'}; padding:0.15rem 0.5rem; border-radius:3px; font-weight:600;">
                    ${m.completed ? (isDe ? '✓ Abgeschlossen' : '✓ Completed') : (isDe ? 'In Umsetzung' : 'In Progress')}
                  </span>
                </div>
                <h4 style="margin-bottom:0.35rem; font-size:1.1rem;">${m.title[lang]}</h4>
                ${m.desc ? `<p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0.5rem;">${m.desc[lang]}</p>` : ''}
                <div style="font-size:0.78rem; color:#78716c;">
                  <strong>${isDe ? 'Quelle' : 'Source'}:</strong> ${m.source}
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Financial Overview & Corporate Packages -->
        <div style="background:var(--color-surface); padding:2rem; border:1px solid var(--color-border); border-radius:var(--radius-lg); margin:3rem 0;">
          <h2 style="margin-top:0;">${isDe ? 'Finanzielle Transparenz & Bausteine' : 'Financial Transparency & Funding Packages'}</h2>
          <div class="funding-bar-wrap" style="margin:1.5rem 0;">
            <div class="funding-bar-labels">
              <span>${isDe ? 'Gesichert' : 'Secured'}: ${p.finances.securedFunding.amount.toLocaleString(isDe ? 'de-DE' : 'en-US')} €</span>
              <span>${isDe ? 'Offener Restbedarf' : 'Outstanding Need'}: ${p.finances.outstandingNeed.amount.toLocaleString(isDe ? 'de-DE' : 'en-US')} €</span>
            </div>
            <div class="funding-progress">
              <div class="funding-progress-fill" style="width: ${Math.round((p.finances.securedFunding.amount / p.finances.totalEstimatedBudget.amount) * 100)}%;"></div>
            </div>
            <div style="font-size:0.8rem; color:var(--color-text-muted); margin-top:0.35rem;">
              ${isDe ? 'Gesamtbudget' : 'Total Budget'}: ${p.finances.totalEstimatedBudget.amount.toLocaleString(isDe ? 'de-DE' : 'en-US')} € (${p.finances.totalEstimatedBudget.sourceNote})
            </div>
          </div>

          <h4 style="margin-top:1.75rem; margin-bottom:1rem;">${isDe ? 'Verfügbare Förderbausteine für Unternehmen & Förderer' : 'Available Funding Packages for Sponsors'}</h4>
          <div style="display:grid; gap:1rem;">
            ${p.finances.corporateFundingPackages.map(pkg => `
              <div style="background:var(--color-surface-muted); padding:1rem 1.25rem; border-radius:var(--radius-md); border:1px solid var(--color-border); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                <div>
                  <h5 style="margin-bottom:0.25rem; font-size:1rem;">${pkg.title[lang]}</h5>
                  <p style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:0;">${pkg.description[lang]}</p>
                </div>
                <div style="font-size:1.15rem; font-weight:800; color:var(--color-terracotta); white-space:nowrap;">
                  ${pkg.amount.toLocaleString(isDe ? 'de-DE' : 'en-US')} €
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Rich Project Gallery -->
        <h2 style="margin-top:3rem;">${isDe ? 'Fotoeindrücke von der Baustelle' : 'Field Photography & Impressions'}</h2>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.5rem; margin:1.5rem 0;">
          ${p.galleryImages.map(img => `
            <img src="${img}" alt="${p.title[lang]}" style="width:100%; height:220px; object-fit:cover; border-radius:var(--radius-md); box-shadow:var(--shadow-sm);">
          `).join('')}
        </div>

        <!-- Instagram Video & Live Updates Box -->
        <div class="instagram-feed-box">
          <h3 style="margin-bottom:0.5rem;">📸 ${isDe ? 'Aktuelle Video-Updates auf Instagram' : 'Live Video Updates on Instagram'}</h3>
          <p style="color:var(--color-text-muted); max-width:540px; margin:0 auto 1.25rem;">
            ${isDe 
              ? 'Folgen Sie unserem offiziellen Instagram-Kanal @bildung.mit.herz für laufende Videos direkt von unseren Baustellen in Sierra Leone.' 
              : 'Follow our official Instagram channel @bildung.mit.herz for regular reels and field updates directly from our construction sites.'}
          </p>
          <a href="${org.socialLinks.instagram}" target="_blank" rel="noopener" class="btn btn-secondary">
            ${isDe ? 'Instagram-Kanal ansehen →' : 'View Instagram Channel →'}
          </a>
        </div>
      </div>
    </section>
  `;
}

// Build all pages
function buildSite() {
  console.log('🚀 Starting Static Site Build for Bildung mit Herz Sierra Leone e.V....');
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  ensureDir(DIST_DIR);

  // 1. Copy Public Assets
  copyRecursive(PUBLIC_DIR, DIST_DIR);

  // 2. Copy Stylesheet
  const cssDestDir = path.join(DIST_DIR, 'assets', 'css');
  ensureDir(cssDestDir);
  copyRecursive(STYLES_DIR, cssDestDir);

  function writeRoute(routePath, htmlContent) {
    const targetDir = path.join(DIST_DIR, routePath);
    ensureDir(targetDir);
    fs.writeFileSync(path.join(targetDir, 'index.html'), htmlContent, 'utf8');
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
          <h2>Zwei Kernprojekte. Konkrete Baufortschritte.</h2>
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

    <!-- Prominent Bank Info Quick Card on Home -->
    <section class="section section-muted" style="padding-top:2rem; padding-bottom:2rem;">
      <div class="container container-narrow">
        ${renderBankQuickCard('de')}
      </div>
    </section>

    <!-- News & Recent Developments -->
    ${renderNewsSection('de')}

    <!-- Why Trust Us Section -->
    <section class="section">
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
            <p>Wir initiieren keine Projekte am Reißbrett in Deutschland. Jede Schule entsteht auf direkten Wunsch der Dorfgemeinschaft und wird vor Ort von lokalen Partnern wie <em>Welfare Alert</em> und <em>Kaprr Yoni Hub</em> getragen.</p>
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
    <section class="section section-muted">
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
            <button type="button" class="btn btn-secondary copy-btn" data-copy="${org.contacts.email}">
              E-Mail-Adresse kopieren
            </button>
          </div>
        </div>
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
          <div class="section-tag">Bildungsinfrastruktur</div>
          <h1>Unsere Schulbauprojekte in Sierra Leone</h1>
          <p class="lead" style="max-width:760px;">
            Wir unterstützen ausgewählte Bildungsinitiativen in ländlichen Regionen Sierra Leones. 
            Hier finden Sie detaillierte Baupläne, Finanzierungsdaten und Nachweise für jedes Projekt.
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
                    <span>Bedarf: ${p.finances.outstandingNeed.amount.toLocaleString('de-DE')} €</span>
                  </div>
                  <div class="funding-progress">
                    <div class="funding-progress-fill" style="width: ${Math.round((p.finances.securedFunding.amount / p.finances.totalEstimatedBudget.amount) * 100)}%;"></div>
                  </div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
                  <span style="font-size:0.85rem; color:var(--color-text-muted);">${p.location.split(',')[0]}</span>
                  <a href="/projekte/${p.slug}/" class="btn btn-secondary btn-sm">Projekt ansehen →</a>
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
    description: 'Übersicht über alle aktiven Bau- und Bildungsprojekte in Sierra Leone: Mafabaneh Learning Hub und Grundschule Mamoru.',
    canonicalPath: '/projekte/',
    content: projectsOverviewDe
  }));

  // ==========================================
  // 3. PROJEKT DETAILSEITEN (DEUTSCH)
  // ==========================================
  projects.forEach(p => {
    writeRoute(`/projekte/${p.slug}`, renderHtmlPage({
      lang: 'de',
      title: p.title.de,
      description: p.tagline.de,
      canonicalPath: `/projekte/${p.slug}/`,
      content: renderProjectDetailPage(p, 'de'),
      ogImage: p.leadImage
    }));
  });

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

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.5rem; margin:2.5rem 0;">
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

        <!-- Corporate Contact Card (No weird mailto opening) -->
        <div style="margin-top:3rem; padding:2.5rem; background:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius-lg); text-align:center;">
          <h2>Persönliches Kennenlerngespräch vereinbaren</h2>
          <p class="lead" style="max-width:600px; margin:0.75rem auto 1.5rem;">
            Sprechen Sie direkt mit unserem Vereinsvorsitzenden Philipp Herzberg über maßgeschneiderte Fördermodelle für Ihr Unternehmen.
          </p>
          
          <div style="display:inline-flex; flex-direction:column; align-items:center; gap:0.75rem; background:var(--color-surface-muted); padding:1.25rem 2rem; border-radius:var(--radius-md); border:1px solid var(--color-border);">
            <div style="font-size:0.85rem; color:var(--color-text-muted); font-weight:600; text-transform:uppercase;">Direkte E-Mail für Unternehmensanfragen:</div>
            <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap; justify-content:center;">
              <code style="font-size:1.15rem; font-weight:700; color:var(--color-slate-dark);">${org.contacts.email}</code>
              <button type="button" class="copy-btn" data-copy="${org.contacts.email}">
                E-Mail kopieren
              </button>
            </div>
            <div style="font-size:0.8rem; color:var(--color-text-muted); margin-top:0.25rem;">
              <a href="mailto:${org.contacts.email}?subject=Unternehmenspartnerschaft%20Bildung%20mit%20Herz" style="color:var(--color-terracotta); text-decoration:underline;">
                (oder direkt im E-Mail-Programm öffnen)
              </a>
            </div>
          </div>
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
          <div class="section-tag">Governance & Finanzen</div>
          <h1>${transparency.title.de}</h1>
          <p class="lead">${transparency.tagline.de}</p>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.5rem; margin:2.5rem 0;">
          ${transparency.corePrinciples.map(p => `
            <div style="background:var(--color-surface); padding:1.5rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h3 style="font-size:1.15rem; color:var(--color-terracotta); margin-bottom:0.5rem;">${p.title.de}</h3>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">${p.desc.de}</p>
            </div>
          `).join('')}
        </div>

        <h2 style="margin-top:3rem;">Verifizierte Dokumente zum Download</h2>
        <div style="display:grid; gap:1rem; margin:1.5rem 0;">
          ${transparency.verifiedDocuments.map(doc => `
            <div style="background:var(--color-surface); padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
              <div>
                <h4 style="margin-bottom:0.25rem;">${doc.title}</h4>
                <p style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:0;">${doc.subtitle}</p>
              </div>
              <a href="${doc.url}" class="btn btn-secondary btn-sm" download>Download (${doc.format}, ${doc.size})</a>
            </div>
          `).join('')}
        </div>

        <h2 style="margin-top:3rem;">Jahresübersichten der Mittelverwendung</h2>
        <div style="overflow-x:auto; margin:1.5rem 0;">
          <table style="width:100%; border-collapse:collapse; background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-md);">
            <thead>
              <tr style="background:var(--color-surface-muted); text-align:left; border-bottom:1px solid var(--color-border);">
                <th style="padding:0.75rem 1rem;">Jahr</th>
                <th style="padding:0.75rem 1rem;">Eingegangene Spenden</th>
                <th style="padding:0.75rem 1rem;">In Projekte investiert</th>
                <th style="padding:0.75rem 1rem;">Verwaltungskosten</th>
                <th style="padding:0.75rem 1rem;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${transparency.annualFinancialOverview.map(row => `
                <tr style="border-bottom:1px solid var(--color-border);">
                  <td style="padding:0.75rem 1rem; font-weight:700;">${row.year}</td>
                  <td style="padding:0.75rem 1rem;">${row.totalDonations.toLocaleString('de-DE')} €</td>
                  <td style="padding:0.75rem 1rem; color:#15803d; font-weight:600;">${row.projectDisbursements.toLocaleString('de-DE')} €</td>
                  <td style="padding:0.75rem 1rem;">0 € (ehrenamtlich)</td>
                  <td style="padding:0.75rem 1rem; font-size:0.85rem; color:var(--color-text-muted);">${row.sourceNote}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-top:3rem;">
          ${renderBankQuickCard('de')}
        </div>
      </div>
    </section>
  `;

  writeRoute('/transparenz', renderHtmlPage({
    lang: 'de',
    title: 'Finanzielle Transparenz & Mittelverwendung',
    description: '100% der Spendengelder fließen direkt in Baumaterial und lokale Löhne. Verwaltung und Reisen werden rein privat getragen.',
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

        <img src="/assets/images/about-founders.jpg" alt="Gründer Philipp Herzberg und Yoni Sesay" style="border-radius:var(--radius-lg); margin-bottom:2.5rem; box-shadow:var(--shadow-md); width:100%; object-fit:cover; max-height:480px;">

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
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:1.5rem; margin:1.5rem 0;">
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

        <!-- Official Governance & Legal Documents -->
        ${renderGovernanceDocsSection('de')}
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

        <img src="/assets/images/travel-masingbi.jpg" alt="Teilnehmende der Bildungsreise in Sierra Leone" style="border-radius:var(--radius-lg); margin-bottom:2.5rem; box-shadow:var(--shadow-md); width:100%; object-fit:cover; max-height:480px;">

        <h2>Unser Reiseansatz</h2>
        <p>${travel.philosophy.de}</p>

        <!-- Video Documentary Section (DE & EN) -->
        <div style="margin:3rem 0;">
          <h2>Video-Dokumentation unserer Bildungsreise</h2>
          <p class="lead" style="margin-bottom:1rem;">
            Erleben Sie authentische Eindrücke unserer Bildungsreisen direkt im Video.
          </p>

          <div style="display:grid; grid-template-columns:1fr; gap:2rem;">
            <div>
              <h3 style="font-size:1.15rem; margin-bottom:0.5rem; color:var(--color-terracotta);">${travel.videos.de.title}</h3>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0.75rem;">${travel.videos.de.desc}</p>
              <div class="video-responsive">
                <iframe src="${travel.videos.de.url}" title="${travel.videos.de.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
              </div>
            </div>

            <div>
              <h3 style="font-size:1.15rem; margin-bottom:0.5rem; color:var(--color-terracotta);">${travel.videos.en.title}</h3>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0.75rem;">${travel.videos.en.desc}</p>
              <div class="video-responsive">
                <iframe src="${travel.videos.en.url}" title="${travel.videos.en.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
              </div>
            </div>
          </div>
        </div>

        <!-- 3 Past Expeditions Showcase -->
        <h2 style="margin-top:3.5rem;">Bisherige Bildungsreisen im Überblick</h2>
        <p class="lead">Drei Reisen, die tiefe Spuren des gegenseitigen Vertrauens hinterlassen haben:</p>
        
        <div class="trips-grid">
          ${travel.trips.map(trip => `
            <div class="trip-card">
              <img src="${trip.image}" alt="${trip.title.de}" class="trip-card-img">
              <div class="trip-card-body">
                <span class="trip-card-badge">${trip.year} • ${trip.location}</span>
                <h3 class="trip-card-title">${trip.title.de}</h3>
                <p class="trip-card-desc">${trip.desc.de}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Upcoming 2027 Trip Info -->
        <div style="background:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius-lg); padding:2rem; margin:3rem 0;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
            <h3 style="margin:0; color:var(--color-terracotta);">${travel.upcomingTrip.title.de}</h3>
            <span style="font-size:0.8rem; background:#fef3c7; color:#92400e; padding:0.25rem 0.65rem; border-radius:3px; font-weight:700;">
              ${travel.upcomingTrip.status.de}
            </span>
          </div>
          <p style="color:var(--color-text-muted); line-height:1.55; margin-bottom:0;">
            ${travel.upcomingTrip.desc.de}
          </p>
        </div>

        <!-- Contact Box for Philipp Herzberg -->
        <div style="background:linear-gradient(135deg, #fcf9f5 0%, #f7f0e6 100%); border:2px solid var(--color-terracotta); border-radius:var(--radius-lg); padding:2.25rem; text-align:center; margin:3rem 0;">
          <h3 style="margin-bottom:0.5rem; color:var(--color-slate-dark);">Interesse an einer Bildungsreise?</h3>
          <p style="max-width:580px; margin:0 auto 1.25rem; color:var(--color-text-muted); font-size:0.95rem;">
            ${travel.contactPerson.note.de}
          </p>
          <div style="display:inline-flex; align-items:center; gap:0.75rem; background:#ffffff; padding:0.75rem 1.25rem; border-radius:var(--radius-md); border:1px solid var(--color-border); flex-wrap:wrap; justify-content:center;">
            <span><strong>${travel.contactPerson.name}</strong> (${travel.contactPerson.role.de}):</span>
            <code style="font-size:1.05rem; font-weight:700;">${travel.contactPerson.email}</code>
            <button type="button" class="copy-btn" data-copy="${travel.contactPerson.email}">
              E-Mail kopieren
            </button>
          </div>
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
          <h1>Zurück aus Sierra Leone: Was wir gebaut haben und was bleibt</h1>
          <p class="lead">Ein persönlicher Bericht von Philipp Herzberg über die Bildungsreise im Januar 2026.</p>
        </div>

        <img src="/assets/images/hero-home.jpg" alt="Teilnehmende vor dem Schulbau" style="border-radius:var(--radius-lg); margin-bottom:2.5rem; width:100%; object-fit:cover; max-height:480px;">

        <div style="font-size:1.05rem; line-height:1.75; color:var(--color-text-main);">
          <p>
            Im Januar 2026 reiste unsere bisher größte Gruppe von 26 Personen – bestehend aus Schülerinnen und Schülern, Eltern und Lehrkräften – 
            nach Sierra Leone. Ziel war nicht der klassische Tourismus, sondern der gemeinsame Bau an Bildungsinfrastruktur und das tiefe Verständnis füreinander.
          </p>

          <h3 style="margin-top:2rem;">Grundsteinlegung in Mafabaneh & Friedensschluss</h3>
          <p>
            In Mafabaneh durften wir den Grundstein für den <em>Learning Hub</em> legen. Mehr als 2.000 handgepresste Lehmziegel 
            wurden von Dorfbewohnern und Reisenden gemeinsam gefertigt. Durch das gemeinsame Bauprojekt endete ein jahrzehntelanger Landkonflikt 
            mit dem Nachbardorf Magbashai – die Schule wurde zum Symbol des Friedens.
          </p>

          <h3 style="margin-top:2rem;">5 fertige Klassenräume in Mamoru</h3>
          <p>
            In Mamoru konnten wir die fünf fertig errichteten Klassenräume besichtigen, die wir zusammen mit Juliet Fornah und der Unterstützung 
            der AcadeMedia Education GmbH realisiert haben. Kinder, die zuvor auf dem Lehmboden saßen, lernen nun an festen Tischen.
          </p>

          <h3 style="margin-top:2rem;">Treffen mit der Ministerin für Tourismus</h3>
          <p>
            In Freetown wurden wir von Tourismusministerin Nabeela Tunis und dem deutschen Botschafter Dr. Pascal Richter empfangen. 
            Beide würdigten den respektvollen, partnerschaftlichen Ansatz unserer Reisen.
          </p>
        </div>

        <div style="margin-top:3rem; padding:2rem; background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-md);">
          <p style="margin-bottom:0.75rem;"><strong>Vollständigen Substack-Artikel lesen:</strong></p>
          <a href="${org.socialLinks.substack}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">Originalbericht auf Substack öffnen →</a>
        </div>
      </div>
    </section>
  `;

  writeRoute('/bildungsreisen/reiseberichte', renderHtmlPage({
    lang: 'de',
    title: 'Reisebericht 2026: Was wir gebaut haben',
    description: 'Erfahrungsbericht der Bildungsreise 2026 nach Sierra Leone von Philipp Herzberg.',
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

        <!-- Prominent Bank Info Quick Card at the Very Top -->
        ${renderBankQuickCard('de')}

        <!-- Tangible Materials & Cost Table -->
        ${renderMaterialsGrid('de')}

        <div style="margin-top:3rem;">
          <h2>Häufige Fragen zu Spenden</h2>
          <div style="display:grid; gap:1rem; margin-top:1.5rem;">
            <div style="background:var(--color-surface); padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h4>Erhalte ich eine Spendenquittung?</h4>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">Ja. Für Beträge bis 300 € genügt dem deutschen Finanzamt der vereinfachte Nachweis (Kontoauszug). Für Beträge darüber stellen wir gerne eine offizielle Spendenbescheinigung aus. Bitte geben Sie Ihre Postanschrift im Verwendungszweck an oder senden Sie uns eine kurze E-Mail an bmh.sierraleone@gmail.com.</p>
            </div>
            <div style="background:var(--color-surface); padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h4>Kann ich zweckgebunden für ein bestimmtes Projekt spenden?</h4>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">Ja, absolut! Geben Sie bei der Überweisung einfach im Verwendungszweck das gewünschte Projekt an (z.B. „Spende Mamoru“ oder „Spende Mafabaneh“). Das Geld wird ausschließlich dort eingesetzt.</p>
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
        <div style="margin-top:2rem; line-height:1.7;">
          <h3>Angaben gemäß § 5 TMG</h3>
          <p>
            <strong>${org.legalName}</strong><br>
            ${org.address.street}<br>
            ${org.address.postalCode} ${org.address.city}<br>
            ${org.address.country}
          </p>

          <h3 style="margin-top:1.5rem;">Vertretungsberechtigter Vorstand</h3>
          <p>
            ${org.board.map(b => `${b.name} (${b.role})`).join('<br>')}
          </p>

          <h3 style="margin-top:1.5rem;">Registereintragung</h3>
          <p>
            Registergericht: ${org.registration.court}<br>
            Registernummer: ${org.registration.number}
          </p>

          <h3 style="margin-top:1.5rem;">Gemeinnützigkeit & Steuernummer</h3>
          <p>
            Zuständiges Finanzamt: ${org.registration.taxOffice}<br>
            Steuerbegünstigung: ${org.registration.taxStatus}
          </p>

          <h3 style="margin-top:1.5rem;">Kontakt</h3>
          <p>
            E-Mail: ${org.contacts.email}
          </p>

          <h3 style="margin-top:1.5rem;">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h3>
          <p>
            ${org.editorialResponsible}
          </p>
        </div>
      </div>
    </section>
  `;

  writeRoute('/impressum', renderHtmlPage({
    lang: 'de',
    title: 'Impressum',
    description: 'Gesetzliche Anbieterkennzeichnung von Bildung mit Herz Sierra Leone e.V.',
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
        <div style="margin-top:2rem; line-height:1.7;">
          <h3>1. Datenschutz auf einen Blick</h3>
          <p>
            Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Diese Website wird als rein statische Website 
            ohne Cookies, ohne externe Schriften (Google Fonts) und ohne Tracking-Dienste betrieben.
          </p>

          <h3 style="margin-top:1.5rem;">2. Verantwortliche Stelle</h3>
          <p>
            Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br>
            <strong>${org.legalName}</strong><br>
            ${org.address.street}, ${org.address.postalCode} ${org.address.city}<br>
            E-Mail: ${org.contacts.email}
          </p>

          <h3 style="margin-top:1.5rem;">3. Datenerfassung auf dieser Website</h3>
          <p>
            Beim Aufruf unserer Seiten fallen lediglich technisch notwendige Server-Logfiles beim Hosting-Provider an 
            (IP-Adresse, Datum, Uhrzeit, abgerufene URL). Diese Daten werden nicht mit anderen Datenquellen zusammengeführt.
          </p>

          <h3 style="margin-top:1.5rem;">4. Keine Weitergabe von Daten</h3>
          <p>
            Eine Übermittlung Ihrer persönlichen Daten an Dritte findet nicht statt, es sei denn, wir sind gesetzlich dazu verpflichtet.
          </p>
        </div>
      </div>
    </section>
  `;

  writeRoute('/datenschutz', renderHtmlPage({
    lang: 'de',
    title: 'Datenschutzerklärung',
    description: 'Informationen zur DSGVO-konformen Datenverarbeitung auf www.bildung-mit-herz.org.',
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
        <div style="margin-top:2rem; line-height:1.7;">
          <p>
            Zuwendungen und Spenden an den gemeinnützigen Verein <em>${org.legalName}</em> sind freiwillige Schenkungen 
            im Sinne von § 516 BGB zur Förderung der steuerbegünstigten satzungsgemäßen Zwecke.
          </p>
          <p>
            Ein gesetzliches Widerrufsrecht nach den Vorschriften über Fernabsatzverträge (§ 312g BGB) besteht für freiwillige Spenden 
            grundsätzlich nicht. Sollte Ihnen bei einer Überweisung ein Irrtum unterlaufen sein, kontaktieren Sie uns bitte 
            umgehend unter <strong>${org.contacts.email}</strong>. Wir finden in jedem Fall eine unbürokratische Lösung.
          </p>
        </div>
      </div>
    </section>
  `;

  writeRoute('/widerruf', renderHtmlPage({
    lang: 'de',
    title: 'Widerrufsbelehrung',
    description: 'Hinweise zum Widerrufsrecht bei Spenden an Bildung mit Herz Sierra Leone e.V.',
    canonicalPath: '/widerruf/',
    content: widerrufDe
  }));

  // ==========================================
  // 12. ENGLISCHE SEITEN (INTERNATIONAL AUDIENCE)
  // 100% Identical in depth and structure
  // ==========================================

  // 12.1 HOME (EN)
  const homeEn = `
    <section class="hero">
      <div class="container hero-grid">
        <div>
          <span class="hero-tagline">Education with Heart Sierra Leone e.V.</span>
          <h1 class="hero-title">Building Schools. Enabling Futures.</h1>
          <p class="lead">
            Partnering directly with rural communities to build resilient, sustainable schools in Sierra Leone. 
            Rooted in ecological architecture, genuine friendship, and 100% financial transparency.
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

    <!-- Featured Projects Section -->
    <section class="section">
      <div class="container">
        <div class="section-header">
          <div class="section-tag">Active Projects</div>
          <h2>Two Core Projects. Documented Construction Progress.</h2>
          <p class="lead" style="max-width:720px;">
            We build with reliable on-the-ground partners to create resilient learning spaces that empower generations.
          </p>
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

                <div class="funding-bar-wrap">
                  <div class="funding-bar-labels">
                    <span>Secured: ${p.finances.securedFunding.amount.toLocaleString('en-US')} €</span>
                    <span>Need: ${p.finances.outstandingNeed.amount.toLocaleString('en-US')} €</span>
                  </div>
                  <div class="funding-progress">
                    <div class="funding-progress-fill" style="width: ${Math.round((p.finances.securedFunding.amount / p.finances.totalEstimatedBudget.amount) * 100)}%;"></div>
                  </div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
                  <span style="font-size:0.8rem; color:var(--color-text-muted);">${p.location.split(',')[0]}</span>
                  <a href="/en/projects/${p.slug}/" class="btn btn-secondary btn-sm">View Details →</a>
                </div>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Prominent Bank Info Quick Card on Home -->
    <section class="section section-muted" style="padding-top:2rem; padding-bottom:2rem;">
      <div class="container container-narrow">
        ${renderBankQuickCard('en')}
      </div>
    </section>

    <!-- News & Recent Developments -->
    ${renderNewsSection('en')}

    <!-- Why Trust Us Section -->
    <section class="section">
      <div class="container">
        <div class="section-header text-center">
          <div class="section-tag">Trust & Governance</div>
          <h2>Why Donors and Companies Trust Our Work</h2>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:2rem;">
          <div style="background:var(--color-surface); padding:2rem; border-radius:var(--radius-lg); border:1px solid var(--color-border);">
            <div style="color:var(--color-terracotta); font-size:2rem; margin-bottom:1rem;">🤝</div>
            <h3>Equal Local Partnership</h3>
            <p>Every school is requested and led by the community itself, partnered with verified local nonprofits like <em>Welfare Alert</em> and <em>Kaprr Yoni Hub</em>.</p>
          </div>

          <div style="background:var(--color-surface); padding:2rem; border-radius:var(--radius-lg); border:1px solid var(--color-border);">
            <div style="color:var(--color-terracotta); font-size:2rem; margin-bottom:1rem;">🏛️</div>
            <h3>World-Class Architecture</h3>
            <p>Renowned European architectural firm <strong>Tchoban Voss Architekten</strong> works pro bono for the Mafabaneh Learning Hub with climate-smart earth architecture.</p>
          </div>

          <div style="background:var(--color-surface); padding:2rem; border-radius:var(--radius-lg); border:1px solid var(--color-border);">
            <div style="color:var(--color-terracotta); font-size:2rem; margin-bottom:1rem;">💶</div>
            <h3>Milestone Disbursements</h3>
            <p>Funds are transferred in tranches only after verified photo and receipt proof. 100% of donor money goes directly into materials and fair local craft wages.</p>
          </div>
        </div>
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
    description: 'Overview of all active educational infrastructure projects in Sierra Leone: Mafabaneh Learning Hub and Mamoru Primary School.',
    canonicalPath: '/en/projects/',
    content: projectsEn
  }));

  // 12.3 & 12.4 PROJECT DETAIL PAGES (EN)
  projects.forEach(p => {
    writeRoute(`/en/projects/${p.slug}`, renderHtmlPage({
      lang: 'en',
      title: p.title.en,
      description: p.tagline.en,
      canonicalPath: `/en/projects/${p.slug}/`,
      content: renderProjectDetailPage(p, 'en'),
      ogImage: p.leadImage
    }));
  });

  // 12.5 CORPORATE (EN)
  const corpEn = `
    <section class="section">
      <div class="container container-narrow">
        <div class="section-header">
          <div class="section-tag">Corporate Social Responsibility</div>
          <h1>${corporate.title.en}</h1>
          <p class="lead">${corporate.tagline.en}</p>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.5rem; margin:2rem 0;">
          ${corporate.valueProposition.map(v => `
            <div style="background:var(--color-surface); padding:1.5rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h3 style="font-size:1.15rem; margin-bottom:0.5rem;">${v.title.en}</h3>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">${v.desc.en}</p>
            </div>
          `).join('')}
        </div>

        <h2 style="margin-top:3rem;">Sponsorship Models Overview</h2>
        <div style="display:grid; gap:1.5rem; margin:1.5rem 0;">
          ${corporate.partnershipModels.map(m => `
            <div style="background:var(--color-surface); padding:2rem; border:2px solid var(--color-border); border-radius:var(--radius-lg);">
              <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
                <h3 style="font-size:1.35rem; color:var(--color-terracotta);">${m.tier}</h3>
                <span style="font-size:1.25rem; font-weight:800; color:var(--color-slate-dark);">${m.amount}</span>
              </div>
              <p style="font-weight:600; font-size:0.95rem; margin-bottom:0.5rem;">Target Project: ${m.targetProject}</p>
              <p style="color:var(--color-text-muted); font-size:0.9rem; margin-bottom:1rem;">${m.impact.en}</p>
              <div style="background:var(--color-surface-muted); padding:1rem; border-radius:var(--radius-sm); font-size:0.85rem;">
                <strong>Deliverables for your company:</strong>
                <ul style="margin-left:1.25rem; margin-top:0.35rem; color:var(--color-text-muted);">
                  ${m.deliverables.map(d => `<li>${d}</li>`).join('')}
                </ul>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="margin-top:3rem; padding:2.5rem; background:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius-lg); text-align:center;">
          <h2>Schedule an Executive Briefing</h2>
          <p class="lead" style="max-width:600px; margin:0.75rem auto 1.5rem;">Connect directly with co-founder and school principal Philipp Herzberg for tailored corporate partnership options.</p>
          
          <div style="display:inline-flex; flex-direction:column; align-items:center; gap:0.75rem; background:var(--color-surface-muted); padding:1.25rem 2rem; border-radius:var(--radius-md); border:1px solid var(--color-border);">
            <div style="font-size:0.85rem; color:var(--color-text-muted); font-weight:600; text-transform:uppercase;">Corporate Partnership Inquiry:</div>
            <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap; justify-content:center;">
              <code style="font-size:1.15rem; font-weight:700; color:var(--color-slate-dark);">${org.contacts.email}</code>
              <button type="button" class="copy-btn" data-copy="${org.contacts.email}">
                Copy Email
              </button>
            </div>
          </div>
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

  // 12.6 TRANSPARENCY (EN)
  const transpEn = `
    <section class="section">
      <div class="container container-narrow">
        <div class="section-header">
          <div class="section-tag">Governance & Audit</div>
          <h1>${transparency.title.en}</h1>
          <p class="lead">${transparency.tagline.en}</p>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.5rem; margin:2rem 0;">
          ${transparency.corePrinciples.map(p => `
            <div style="background:var(--color-surface); padding:1.5rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h3 style="font-size:1.15rem; color:var(--color-terracotta); margin-bottom:0.5rem;">${p.title.en}</h3>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">${p.desc.en}</p>
            </div>
          `).join('')}
        </div>

        <h2 style="margin-top:3rem;">Verified Documents for Download</h2>
        <div style="display:grid; gap:1rem; margin:1.5rem 0;">
          ${transparency.verifiedDocuments.map(doc => `
            <div style="background:var(--color-surface); padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
              <div>
                <h4 style="margin-bottom:0.25rem;">${doc.title}</h4>
                <p style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:0;">${doc.subtitle}</p>
              </div>
              <a href="${doc.url}" class="btn btn-secondary btn-sm" download>Download (${doc.format}, ${doc.size})</a>
            </div>
          `).join('')}
        </div>

        <div style="margin-top:3rem;">
          ${renderBankQuickCard('en')}
        </div>
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

  // 12.7 ABOUT (EN)
  const aboutEn = `
    <section class="section">
      <div class="container container-narrow">
        <div class="section-header">
          <div class="section-tag">Our Story</div>
          <h1>About Education with Heart Sierra Leone e.V.</h1>
          <p class="lead">Founded on a genuine friendship between two teachers in London.</p>
        </div>
        <img src="/assets/images/about-founders.jpg" alt="Philipp Herzberg and Yoni Sesay" style="border-radius:var(--radius-lg); margin-bottom:2.5rem; width:100%; object-fit:cover; max-height:480px;">
        
        <h2>History & Motivation</h2>
        <p>Philipp Herzberg and Yoni Sesay met while teaching together at a school in London. That summer, Yoni invited Philipp to visit his home country, Sierra Leone. Traveling through rural villages and witnessing community resilience inspired them to create an association built on mutual dignity and long-term partnership.</p>

        <h2 style="margin-top:2.5rem;">Board of Directors</h2>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:1.5rem; margin:1.5rem 0;">
          ${org.board.map(b => `
            <div style="background:var(--color-surface); padding:1.5rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h3 style="margin-bottom:0.25rem; font-size:1.25rem;">${b.name}</h3>
              <p style="color:var(--color-terracotta); font-weight:600; font-size:0.85rem; margin-bottom:0.5rem;">${b.role}</p>
              <p style="color:var(--color-text-muted); font-size:0.9rem; margin-bottom:0;">${b.title}</p>
            </div>
          `).join('')}
        </div>

        <h2 style="margin-top:2.5rem;">Our Local Partners</h2>
        <div style="display:grid; gap:1.25rem; margin:1.5rem 0;">
          <div style="background:var(--color-surface); padding:1.5rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
            <h4 style="margin-bottom:0.25rem;">Juliet Jeneba Fornah & Welfare Alert Sierra Leone</h4>
            <p style="color:var(--color-terracotta); font-size:0.85rem; font-weight:600;">Partner for Mamoru Primary School • Makeni</p>
            <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">Leading child welfare advocacy and school construction oversight in the Bombali district since 2015.</p>
          </div>
          <div style="background:var(--color-surface); padding:1.5rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
            <h4 style="margin-bottom:0.25rem;">Yoni Sesay & Kaprr Yoni Global Learning Hub</h4>
            <p style="color:var(--color-terracotta); font-size:0.85rem; font-weight:600;">Partner for Mafabaneh Learning Hub & Field Journeys</p>
            <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">Native to Mafabaneh, coordinating educational programs and inter-community peace accords.</p>
          </div>
        </div>

        <!-- Official Governance & Legal Documents -->
        ${renderGovernanceDocsSection('en')}
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

  // 12.8 TRAVEL (EN)
  const travelEn = `
    <section class="section">
      <div class="container container-narrow">
        <div class="section-header">
          <div class="section-tag">Intercultural Exchange</div>
          <h1>${travel.title.en}</h1>
          <p class="lead">${travel.tagline.en}</p>
        </div>
        <img src="/assets/images/travel-masingbi.jpg" alt="Educational Journey Participants in Sierra Leone" style="border-radius:var(--radius-lg); margin-bottom:2.5rem; width:100%; object-fit:cover; max-height:480px;">
        <p>${travel.philosophy.en}</p>

        <!-- Video Documentary Section -->
        <div style="margin:3rem 0;">
          <h2>Video Documentary of Our Journeys</h2>
          <div style="display:grid; grid-template-columns:1fr; gap:2rem;">
            <div>
              <h3 style="font-size:1.15rem; margin-bottom:0.5rem; color:var(--color-terracotta);">${travel.videos.en.title}</h3>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0.75rem;">${travel.videos.en.desc}</p>
              <div class="video-responsive">
                <iframe src="${travel.videos.en.url}" title="${travel.videos.en.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
              </div>
            </div>
            <div>
              <h3 style="font-size:1.15rem; margin-bottom:0.5rem; color:var(--color-terracotta);">${travel.videos.de.title}</h3>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0.75rem;">${travel.videos.de.desc}</p>
              <div class="video-responsive">
                <iframe src="${travel.videos.de.url}" title="${travel.videos.de.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
              </div>
            </div>
          </div>
        </div>

        <!-- 3 Expeditions Overview -->
        <h2 style="margin-top:3.5rem;">Past Educational Expeditions</h2>
        <div class="trips-grid">
          ${travel.trips.map(trip => `
            <div class="trip-card">
              <img src="${trip.image}" alt="${trip.title.en}" class="trip-card-img">
              <div class="trip-card-body">
                <span class="trip-card-badge">${trip.year} • ${trip.location}</span>
                <h3 class="trip-card-title">${trip.title.en}</h3>
                <p class="trip-card-desc">${trip.desc.en}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Upcoming 2027 Journey Box -->
        <div style="background:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius-lg); padding:2rem; margin:3rem 0;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
            <h3 style="margin:0; color:var(--color-terracotta);">${travel.upcomingTrip.title.en}</h3>
            <span style="font-size:0.8rem; background:#fef3c7; color:#92400e; padding:0.25rem 0.65rem; border-radius:3px; font-weight:700;">
              ${travel.upcomingTrip.status.en}
            </span>
          </div>
          <p style="color:var(--color-text-muted); line-height:1.55; margin-bottom:0;">
            ${travel.upcomingTrip.desc.en}
          </p>
        </div>

        <!-- Contact Box for Philipp Herzberg -->
        <div style="background:linear-gradient(135deg, #fcf9f5 0%, #f7f0e6 100%); border:2px solid var(--color-terracotta); border-radius:var(--radius-lg); padding:2.25rem; text-align:center; margin:3rem 0;">
          <h3 style="margin-bottom:0.5rem; color:var(--color-slate-dark);">Interested in Joining an Educational Journey?</h3>
          <p style="max-width:580px; margin:0 auto 1.25rem; color:var(--color-text-muted); font-size:0.95rem;">
            ${travel.contactPerson.note.en}
          </p>
          <div style="display:inline-flex; align-items:center; gap:0.75rem; background:#ffffff; padding:0.75rem 1.25rem; border-radius:var(--radius-md); border:1px solid var(--color-border); flex-wrap:wrap; justify-content:center;">
            <span><strong>${travel.contactPerson.name}</strong>:</span>
            <code style="font-size:1.05rem; font-weight:700;">${travel.contactPerson.email}</code>
            <button type="button" class="copy-btn" data-copy="${travel.contactPerson.email}">
              Copy Email
            </button>
          </div>
        </div>

        <h2 style="margin-top:3rem;">Frequently Asked Questions (FAQ)</h2>
        <div style="display:grid; gap:1rem; margin:1.5rem 0;">
          ${travel.faq.map(item => `
            <div style="background:var(--color-surface); padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h4 style="margin-bottom:0.35rem;">${item.q.en}</h4>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">${item.a.en}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  writeRoute('/en/travel', renderHtmlPage({
    lang: 'en',
    title: 'Educational Trips & Intercultural Exchange',
    description: 'Immersive educational travel to rural Sierra Leone for students and teachers on an equal footing.',
    canonicalPath: '/en/travel/',
    content: travelEn
  }));

  // 12.9 DONATE (EN)
  const donateEn = `
    <section class="section">
      <div class="container container-narrow">
        <div class="section-header text-center">
          <div class="section-tag">Direct Contribution</div>
          <h1>Your Support Transforms Real Lives</h1>
          <p class="lead">Support school construction, renovation and educational equipment in Sierra Leone.</p>
        </div>

        <!-- Prominent Bank Info Quick Card at the Very Top -->
        ${renderBankQuickCard('en')}

        <!-- Tangible Materials & Cost Table -->
        ${renderMaterialsGrid('en')}

        <div style="margin-top:3rem;">
          <h2>Frequently Asked Questions on Donations</h2>
          <div style="display:grid; gap:1rem; margin-top:1.5rem;">
            <div style="background:var(--color-surface); padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h4>Do I receive a tax deduction receipt?</h4>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">Yes. Under German tax law, donations up to €300 are tax-deductible with your bank statement. For larger amounts, we gladly issue an official donation receipt. Please include your address in the transfer memo.</p>
            </div>
            <div style="background:var(--color-surface); padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h4>Can I earmark my donation for a specific school project?</h4>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">Yes! Simply specify the target project in your transfer memo (e.g. "Donation Mamoru" or "Donation Mafabaneh"). Funds will be deployed strictly for that project.</p>
            </div>
            <div style="background:var(--color-surface); padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h4>Why SEPA bank transfer instead of credit card or PayPal?</h4>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">To avoid 2–3% transaction fees charged by payment processors, we prioritize direct bank transfers. That way, 100% of your gift reaches Sierra Leone without deductions.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  writeRoute('/en/donate', renderHtmlPage({
    lang: 'en',
    title: 'Donate to School Projects in Sierra Leone',
    description: 'Bank transfer donation details for Bildung mit Herz Sierra Leone e.V. (Make Them Smile e.V.). 100% direct project funding.',
    canonicalPath: '/en/donate/',
    content: donateEn
  }));

  // ==========================================
  // 13. CLOUDFLARE PAGES _REDIRECTS
  // ==========================================
  const redirectsContent = `
# Canonical domain redirects
https://bildung-mit-herz.org/* https://www.bildung-mit-herz.org/:splat 301!

# Legacy Jimdo 301 redirects
/unsere-projekte/         /projekte/ 301
/unsere-projekte          /projekte/ 301
/wir-über-uns/            /ueber-uns/ 301
/wir-über-uns             /ueber-uns/ 301
/kontakt/                 /ueber-uns/ 301
/kontakt                  /ueber-uns/ 301
/bildungsreise/           /bildungsreisen/ 301
/bildungsreise            /bildungsreisen/ 301
/unterstützen/            /spenden/ 301
/unterstützen             /spenden/ 301

# Removed project redirects (Madina -> /projekte/)
/projekte/madina/         /projekte/ 301
/projekte/madina          /projekte/ 301
/en/projects/madina/      /en/projects/ 301
/en/projects/madina       /en/projects/ 301

# Clean URLs
/projekte/kappr-yoni/     /projekte/mafabaneh/ 301
/projekte/kappr-yoni      /projekte/mafabaneh/ 301
/fuer-unternehmen         /fuer-unternehmen/ 301
/transparenz              /transparenz/ 301
/ueber-uns                /ueber-uns/ 301
/bildungsreisen           /bildungsreisen/ 301
/spenden                  /spenden/ 301
/impressum                /impressum/ 301
/datenschutz              /datenschutz/ 301
/widerruf                 /widerruf/ 301
`;

  fs.writeFileSync(path.join(DIST_DIR, '_redirects'), redirectsContent.trim() + '\n', 'utf8');

  // ==========================================
  // 14. SITEMAP.XML & ROBOTS.TXT
  // ==========================================
  const allRoutes = [
    '/',
    '/projekte/',
    '/projekte/mafabaneh/',
    '/projekte/mamoru/',
    '/fuer-unternehmen/',
    '/transparenz/',
    '/ueber-uns/',
    '/bildungsreisen/',
    '/bildungsreisen/reiseberichte/',
    '/spenden/',
    '/impressum/',
    '/datenschutz/',
    '/widerruf/',
    '/en/',
    '/en/projects/',
    '/en/projects/mafabaneh/',
    '/en/projects/mamoru/',
    '/en/corporate/',
    '/en/transparency/',
    '/en/about/',
    '/en/travel/',
    '/en/donate/'
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => `  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route === '/' || route === '/en/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${route === '/' || route === '/en/' ? '1.0' : (route.startsWith('/projekte/') || route.startsWith('/en/projects/') ? '0.9' : '0.8')}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml, 'utf8');

  const robotsTxt = `User-agent: *
Allow: /
Sitemap: ${BASE_URL}/sitemap.xml
`;
  fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robotsTxt, 'utf8');

  console.log(`✅ Build Complete!`);
  console.log(`   Generated ${allRoutes.length} static routes in ${DIST_DIR}`);
  console.log(`   Generated sitemap.xml, robots.txt, and _redirects`);
}

buildSite();
