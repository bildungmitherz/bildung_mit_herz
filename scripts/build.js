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
const sierraLeone = loadJson('sierra_leone.json');

// Active projects and archived projects
const activeProjects = [
  loadJson('projects/mafabaneh.json'),
  loadJson('projects/mamoru.json')
];
const archivedProjects = [
  loadJson('projects/madina.json')
];
const allProjects = [...activeProjects, ...archivedProjects];
const projects = activeProjects;

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
    '/bildungsreisen/reiseberichte/': '/en/travel/report/',
    '/sierra-leone/': '/en/sierra-leone/',
    '/faq/': '/en/faq/',
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
            const itemDate = typeof item.date === 'object' ? item.date[lang] : item.date;
            const isExternal = itemLink.startsWith('http');
            return `
              <article class="news-card">
                <img src="${item.image}" alt="${item.title[lang]}" class="news-card-img">
                <div class="news-card-body">
                  <div class="news-card-meta">
                    <span class="news-card-pill">${item.category[lang]}</span>
                    <span class="news-card-date">${itemDate}</span>
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

// Reusable Packing List Generator
function renderPackingList(lang = 'de') {
  const categories = {};
  travel.packingList.forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item.item);
  });

  const categoryTranslations = {
    'Wesentlich': { de: 'Wesentliche Dokumente & Finanzen', en: 'Essential Documents & Cash' },
    'Kleidung': { de: 'Kleidung & Schuhe', en: 'Clothing & Footwear' },
    'Gesundheit & Apotheke': { de: 'Gesundheit, Apotheke & Hygiene', en: 'Health, First Aid & Sanitation' },
    'Schutz & Sonne': { de: 'Sonnenschutz & Insektenschutz', en: 'Sun & Insect Protection' },
    'Elektronik': { de: 'Elektronik & Strom (Inselnetze)', en: 'Electronics & Off-Grid Power' },
    'Hygiene': { de: 'Körperpflege & Hygiene', en: 'Personal Care & Hygiene' },
    'Praktisches': { de: 'Praktisches für unterwegs', en: 'Practical Gear & Travel Daypack' },
    'Freigepäck & Spenden': { de: 'Freigepäck & Spendenmitnahme', en: 'Luggage Allowance & Donations' }
  };

  return `
    <div class="packing-grid">
      ${Object.entries(categories).map(([cat, items]) => {
        const title = categoryTranslations[cat] ? categoryTranslations[cat][lang] : cat;
        return `
          <div class="packing-category-card">
            <div class="packing-category-title">
              <span>✓</span>
              <span>${title}</span>
            </div>
            <ul class="packing-items-list">
              ${items.map(it => `
                <li class="packing-item-row">
                  <span class="packing-item-check">•</span>
                  <span>${it}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Reusable Video Card with Horizontal Theater Mode Expansion
function renderVideoCard(v, lang = 'de') {
  const isDe = lang === 'de';
  const title = v.title[lang] || v.title.de || '';
  const desc = v.desc ? (v.desc[lang] || v.desc.de || '') : '';
  const coverImg = v.coverImage || `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`;
  const escapedTitle = title.replace(/'/g, "\\'");
  return `
    <div class="video-card">
      <button type="button" class="video-theater-badge" aria-label="${isDe ? 'Theater-Modus beenden' : 'Exit theater mode'}">
        <span>⤡</span>
        <span>${isDe ? 'Theater-Modus' : 'Theater Mode'}</span>
      </button>
      <div class="video-cover-facade" data-video-id="${v.id}" onclick="const card=this.closest('.video-card'); if(card){card.classList.add('is-expanded');} this.innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0\\' title=\\'${escapedTitle}\\' style=\\'width:100%; height:100%; border:0;\\' allow=\\'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\\' allowfullscreen></iframe>'">
        <img src="${coverImg}" alt="${title}" class="video-cover-img" loading="lazy">
        <div class="video-play-btn" aria-label="${isDe ? 'Video abspielen: ' : 'Play video: '}${title}">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        </div>
        <div class="video-play-hint">
          <span>▶ ${isDe ? 'Video abspielen (Theater-Modus)' : 'Play Video (Theater Mode)'}</span>
          <span>YouTube HD</span>
        </div>
      </div>
      <div class="video-card-body">
        <div class="video-card-title">${title}</div>
        ${desc ? `<div class="video-card-desc">${desc}</div>` : ''}
      </div>
    </div>
  `;
}

// Reusable Video Gallery Generator
function renderVideoGallery(lang = 'de') {
  const isDe = lang === 'de';
  const filtered = travel.videos.filter(v => {
    // "Die Gesamtdokumentation kann weg" (from overview page, stays on full report page)
    if (v.id === '6LH_RUZlGhk' || v.showInOverview === false) return false;
    // German page only gets German documentary + shared videos; English page only gets English documentary + shared videos
    if (isDe && v.langScope === 'en') return false;
    if (!isDe && v.langScope === 'de') return false;
    return true;
  });

  return `
    <div class="videos-grid">
      ${filtered.map(v => renderVideoCard(v, lang)).join('')}
    </div>
  `;
}

// Reusable Homepage Social Media Footprint Component (Instagram & YouTube)
function renderHomeSocialFootprint(lang = 'de') {
  const isDe = lang === 'de';
  const featVidId = isDe ? '5cqYvInke7I' : 'jBt4hURaXig';
  const featVideo = travel.videos.find(v => v.id === featVidId) || {
    id: featVidId,
    title: {
      de: 'Dokumentarfilm: Bildungsreise Sierra Leone 2026',
      en: 'Field Documentary: Sierra Leone Educational Journey 2026'
    },
    desc: {
      de: '25-minütige Gesamtdokumentation unserer Reise: Begegnungen in Mafabaneh und Mamoru, der Schulbau und kulturelle Höhepunkte.',
      en: '25-minute comprehensive documentary of our journey: community encounters in Mafabaneh and Mamoru, school builds, and cultural immersion.'
    },
    coverImage: `https://img.youtube.com/vi/${featVidId}/hqdefault.jpg`
  };

  return `
    <section class="section" style="background:var(--color-surface); border-top:1px solid var(--color-border); border-bottom:1px solid var(--color-border);">
      <div class="container">
        <div class="section-header text-center">
          <div class="section-tag" style="background:#fdf2f8; color:#be185d; border:1px solid #fbcfe8;">
            ${isDe ? 'Social Media & Video-Einblicke' : 'Social Media & Field Insights'}
          </div>
          <h2>${isDe ? 'Direkt aus Sierra Leone: Folgen Sie uns online' : 'Direct from Sierra Leone: Follow Our Journey Online'}</h2>
          <p class="lead" style="max-width:760px; margin-left:auto; margin-right:auto;">
            ${isDe 
              ? 'Erleben Sie Schulbau, Handwerker und Dorfgemeinschaften in Echtzeit. Auf Instagram und YouTube teilen wir regelmäßige Reels, Vor-Ort-Interviews und ungefilterte Baudokumentationen.' 
              : 'Experience school construction, local craftspeople, and rural communities in real time. We publish frequent reels, on-site interviews, and uncut building logs on Instagram and YouTube.'}
          </p>
        </div>

        <div class="social-footprint-grid">
          <!-- Instagram Channel Card -->
          <div class="social-footprint-card instagram-card">
            <span class="social-card-badge instagram">
              <span>📸</span>
              <span>Instagram • @bildung.mit.herz</span>
            </span>
            <h3 class="social-card-title">
              ${isDe ? 'Tägliche Storys, Reels & Fotos aus den Dörfern' : 'Daily Stories, Reels & Field Photos from the Villages'}
            </h3>
            <p class="social-card-desc">
              ${isDe 
                ? 'Begleiten Sie unsere Projektleiter Philipp Herzberg und Yoni Sesay direkt vor Ort. Kurze Video-Reels zeigen das Pressen der Lehmziegel in Mafabaneh, Schreinerarbeiten für Mamoru und spontane Dorffeste.' 
                : 'Follow project leaders Philipp Herzberg and Yoni Sesay on the ground. Quick video reels document earth brick compression in Mafabaneh, carpentry in Mamoru, and spontaneous village celebrations.'}
            </p>
            <ul class="social-card-features">
              <li class="social-card-feature-item">
                <span class="social-card-feature-bullet">✓</span>
                <span>${isDe ? 'Authentische Einblicke ohne PR-Filter' : 'Authentic field updates with zero PR filters'}</span>
              </li>
              <li class="social-card-feature-item">
                <span class="social-card-feature-bullet">✓</span>
                <span>${isDe ? 'Reels aus Mafabaneh, Mamoru, Makeni & Freetown' : 'Reels from Mafabaneh, Mamoru, Makeni & Freetown'}</span>
              </li>
              <li class="social-card-feature-item">
                <span class="social-card-feature-bullet">✓</span>
                <span>${isDe ? 'Direkter Austausch mit den Gründern & Freiwilligen' : 'Direct engagement with founders and volunteers'}</span>
              </li>
            </ul>
            <div style="margin-top:auto;">
              <a href="${org.socialLinks.instagram}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="width:100%; justify-content:center; gap:0.5rem; background:linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); border:0;">
                <span>📸</span>
                <span>${isDe ? '@bildung.mit.herz auf Instagram öffnen ↗' : 'Open @bildung.mit.herz on Instagram ↗'}</span>
              </a>
            </div>
          </div>

          <!-- YouTube Channel Card -->
          <div class="social-footprint-card youtube-card">
            <span class="social-card-badge youtube">
              <span>▶</span>
              <span>YouTube • @bildung-mit-herz-sierra-leone</span>
            </span>
            <h3 class="social-card-title">
              ${isDe ? 'Ausführliche Baudokumentationen & Reisefilme' : 'In-Depth Building Logs & Documentary Films'}
            </h3>
            <p class="social-card-desc">
              ${isDe 
                ? 'Auf unserem YouTube-Kanal veröffentlichen wir detaillierte Berichte: von der rituellen Grundsteinlegung mit Dorfvorstehern über Drohnenaufnahmen der Schulanlagen bis zum 25-minütigen Bildungsreise-Dokumentarfilm.' 
                : 'Our YouTube channel hosts full documentaries: from the traditional cornerstone ceremony with village elders to aerial drone surveys of the building plots and the 25-minute travel documentary.'}
            </p>
            <ul class="social-card-features">
              <li class="social-card-feature-item">
                <span class="social-card-feature-bullet">✓</span>
                <span>${isDe ? 'Drohnenaufnahmen des Baufelds in Mafabaneh' : 'Aerial drone footage of the Mafabaneh building site'}</span>
              </li>
              <li class="social-card-feature-item">
                <span class="social-card-feature-bullet">✓</span>
                <span>${isDe ? 'Grundsteinlegung & Bautagebuch Mamoru' : 'Mamoru cornerstone ceremony and building progress'}</span>
              </li>
              <li class="social-card-feature-item">
                <span class="social-card-feature-bullet">✓</span>
                <span>${isDe ? 'Offizielle Dokumentarfilme in HD' : 'Official high-definition documentary films'}</span>
              </li>
            </ul>
            <div style="margin-top:auto;">
              <a href="${org.socialLinks.youtube}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="width:100%; justify-content:center; gap:0.5rem; border-color:#dc2626; color:#dc2626;">
                <span>▶</span>
                <span>${isDe ? 'YouTube-Kanal besuchen & abonnieren ↗' : 'Visit & Subscribe on YouTube ↗'}</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Featured Documentary Video with Theater Mode on Home -->
        <div style="margin-top:3rem;">
          <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h3 style="font-size:1.2rem; color:var(--color-slate-dark); margin:0;">
              🎬 ${isDe ? 'Ausgewählter Videobericht: Klicken zum Abspielen im Theater-Modus' : 'Featured Video: Click to Play in Theater Mode'}
            </h3>
            <span style="font-size:0.85rem; color:var(--color-text-muted);">
              ${isDe ? 'Klick vergrößert das Video horizontal' : 'Click expands video horizontally'}
            </span>
          </div>
          <div class="videos-grid" style="margin:0;">
            ${renderVideoCard(featVideo, lang)}
          </div>
        </div>
      </div>
    </section>
  `;
}

// Reusable Strategic Vision Generator
function renderStrategicVision(lang = 'de') {
  return `
    <div class="vision-grid">
      ${transparency.strategicVision.map(v => `
        <div class="vision-card">
          <h3 style="color:var(--color-terracotta);">${v.pillar[lang]}</h3>
          <p>${v.desc[lang]}</p>
        </div>
      `).join('')}
    </div>
  `;
}

// Reusable Instagram Field Location Showcase
function renderInstagramLocationShowcase(lang = 'de') {
  const isDe = lang === 'de';
  const locs = travel.fieldLocationsInstagram2026 || [];
  return `
    <section class="section" style="padding-top:2.5rem; padding-bottom:3rem;">
      <div class="container">
        <div class="section-header" style="margin-bottom:2rem;">
          <div class="section-tag" style="background:#fdf2f8; color:#be185d; border:1px solid #fbcfe8;">
            📸 Instagram @bildung.mit.herz
          </div>
          <h2>${isDe ? 'Eindrücke aus Sierra Leone: Videos & Fotos vor Ort' : 'Field Impressions from Sierra Leone: Reels & Photos'}</h2>
          <p class="lead" style="max-width:760px;">
            ${isDe 
              ? 'Für jeden Ort, den wir 2026 in Sierra Leone besucht haben, teilen wir authentische Videos, Stories und Fotodokumentationen auf unserem offiziellen Instagram-Kanal <strong>@bildung.mit.herz</strong>:' 
              : 'For every single location visited across Sierra Leone in 2026, we share authentic reels, stories and photo documentation on our official Instagram channel <strong>@bildung.mit.herz</strong>:'}
          </p>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.25rem;">
          ${locs.map(loc => `
            <div style="background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-lg); padding:1.5rem; display:flex; flex-direction:column; justify-content:space-between; box-shadow:var(--shadow-sm);">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:0.5rem; gap:0.5rem; flex-wrap:wrap;">
                  <span style="font-size:0.75rem; font-weight:700; color:var(--color-terracotta); text-transform:uppercase; letter-spacing:0.04em;">
                    📍 ${loc.location}
                  </span>
                  <span style="font-size:0.75rem; background:var(--color-surface-muted); color:var(--color-text-muted); padding:0.15rem 0.5rem; border-radius:3px;">
                    ${loc.category[lang]}
                  </span>
                </div>
                <h3 style="font-size:1.15rem; color:var(--color-slate-dark); margin-bottom:0.6rem; line-height:1.35;">
                  ${loc.title[lang]}
                </h3>
                <p style="font-size:0.88rem; color:var(--color-text-muted); line-height:1.55; margin-bottom:1.25rem;">
                  ${loc.desc[lang]}
                </p>
              </div>
              <div>
                <a href="${loc.instagramUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="width:100%; justify-content:center; gap:0.4rem;">
                  <span>📸</span>
                  <span>${isDe ? `Reels & Fotos aus ${loc.location} ↗` : `View Reels from ${loc.location} ↗`}</span>
                </a>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="margin-top:2.5rem; text-align:center; background:linear-gradient(135deg, #fdf2f8 0%, #fff1f2 100%); border:1px solid #fbcfe8; border-radius:var(--radius-lg); padding:1.75rem;">
          <h3 style="margin-top:0; margin-bottom:0.35rem; color:#9d174d;">
            📱 ${isDe ? 'Folgen Sie @bildung.mit.herz auf Instagram' : 'Follow @bildung.mit.herz on Instagram'}
          </h3>
          <p style="color:#831843; font-size:0.92rem; max-width:620px; margin:0 auto 1.25rem;">
            ${isDe 
              ? 'Begleiten Sie unsere Projektfortschritte, Handwerker und Reisegruppen in Echtzeit. Regelmäßige Reels, Stories und Einblicke direkt aus den Dörfern.' 
              : 'Experience our ongoing project milestones, local craftspeople, and educational cohorts in real time. Regular reels and stories direct from Sierra Leone.'}
          </p>
          <a href="${org.socialLinks.instagram}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
            ${isDe ? 'Offiziellen Instagram-Account öffnen ↗' : 'Open Official Instagram Account ↗'}
          </a>
        </div>
      </div>
    </section>
  `;
}

// Reusable Categorized FAQ Component
function renderCategorizedFaq(lang = 'de') {
  const isDe = lang === 'de';
  const categories = {};
  travel.faq.forEach(item => {
    const catName = item.category ? item.category[lang] : (isDe ? 'Allgemeine Fragen' : 'General Questions');
    if (!categories[catName]) {
      categories[catName] = [];
    }
    categories[catName].push(item);
  });

  return `
    <div class="faq-container">
      ${Object.entries(categories).map(([catName, items]) => `
        <div class="faq-category-section">
          <h3 class="faq-category-title">
            <span>📌</span>
            <span>${catName}</span>
          </h3>
          <div class="faq-grid">
            ${items.map(item => `
              <div class="faq-card">
                <div class="faq-q">
                  <span class="faq-q-icon">?</span>
                  <span>${item.q[lang]}</span>
                </div>
                <p class="faq-a">${item.a[lang]}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Standalone FAQ Page Renderer
function renderFaqStandalonePage(lang = 'de') {
  const isDe = lang === 'de';

  return `
    <section class="section">
      <div class="container container-narrow">
        <div class="section-header">
          <div class="section-tag">${isDe ? 'Fragen & Antworten' : 'Questions & Answers'}</div>
          <h1>${isDe ? 'Häufige Fragen zu Bildungsreisen & Vorbereitung' : 'Frequently Asked Questions & Trip Preparation'}</h1>
          <p class="lead">
            ${isDe 
              ? 'Wichtige Antworten zu Impfpflichten, Visum, Malariaprophylaxe, Reisesicherheit, SIM-Karten und dem Alltag vor Ort.' 
              : 'Detailed answers on vaccinations, visas, malaria prophylaxis, safety, SIM cards, and on-the-ground routines.'}
          </p>
        </div>

        <div style="background:var(--color-surface-muted); padding:1.25rem 1.75rem; border-radius:var(--radius-md); border:1px solid var(--color-border); margin-bottom:2.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
          <div>
            <strong>${isDe ? 'Persönliche Beratung & Vorbereitungsgespräche' : 'Personal Guidance & Preparation Briefings'}</strong>
            <p style="font-size:0.88rem; color:var(--color-text-muted); margin-bottom:0;">
              ${isDe ? 'Philipp Herzberg beantwortet Ihre individuellen Fragen gerne persönlich per Mail oder Telefon.' : 'Philipp Herzberg answers individual questions directly by email or phone.'}
            </p>
          </div>
          <button type="button" class="btn btn-secondary btn-sm copy-btn" data-copy="${travel.contactPerson.email}">
            ${isDe ? 'E-Mail kopieren' : 'Copy Email'}
          </button>
        </div>

        ${renderCategorizedFaq(lang)}

        <div style="margin-top:3.5rem; text-align:center;">
          <a href="${isDe ? '/bildungsreisen/' : '/en/travel/'}" class="btn btn-primary">
            ${isDe ? '← Zur Übersicht Bildungsreisen' : '← Back to Educational Trips Overview'}
          </a>
        </div>
      </div>
    </section>
  `;
}

// Sierra Leone Country Page Renderer
function renderSierraLeonePage(lang = 'de') {
  const isDe = lang === 'de';
  const sl = sierraLeone;

  return `
    <section class="section">
      <div class="container container-narrow">
        <div class="section-header">
          <div class="sl-hero-badge">
            <span>⭐</span>
            <span>${isDe ? 'Länderporträt & Wirkungskontext' : 'Country Profile & Impact Context'}</span>
          </div>
          <h1>${sl.title[lang]}</h1>
          <p class="lead">${sl.tagline[lang]}</p>
        </div>

        <img src="/assets/images/hero-home.jpg" alt="Sierra Leone Land und Leute" style="border-radius:var(--radius-lg); margin-bottom:2.5rem; width:100%; object-fit:cover; max-height:460px; box-shadow:var(--shadow-md);">

        <p style="font-size:1.05rem; line-height:1.75; color:var(--color-text-main);">
          ${sl.summary[lang]}
        </p>

        <!-- Key Metrics Grid -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin:2.5rem 0;">
          ${sl.demographicsAndRuralReality.metrics.map(m => `
            <div style="background:var(--color-surface); padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-md); text-align:center;">
              <div style="font-size:2rem; font-weight:800; color:var(--color-terracotta); line-height:1.1; margin-bottom:0.25rem;">${m.val}</div>
              <div style="font-weight:700; font-size:0.9rem; color:var(--color-slate-dark);">${m.label[lang]}</div>
              <div style="font-size:0.78rem; color:var(--color-text-muted); margin-top:0.2rem;">${m.sub[lang]}</div>
            </div>
          `).join('')}
        </div>

        <!-- Section 1: Governance Highlights (IIAG) -->
        <div style="margin:3.5rem 0;">
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
            <span style="font-size:1.5rem;">🏆</span>
            <span class="section-tag" style="margin-bottom:0;">${isDe ? 'Reformdynamik' : 'Reform Momentum'}</span>
          </div>
          <h2>${sl.governance.title[lang]}</h2>
          <p class="lead" style="margin-bottom:1.5rem;">
            ${isDe 
              ? 'Wissenschaftlich belegt: Sierra Leone hebt sich durch konsequente Reformschritte und messbare Bildungsfortschritte im afrikanischen Vergleich deutlich ab.' 
              : 'Empirically verified: Sierra Leone stands out through rigorous governance reforms and historic education milestones.'}
          </p>

          <div class="sl-gov-grid">
            ${sl.governance.highlights.map(h => `
              <div class="sl-gov-card">
                <span class="sl-gov-badge">${h.badge[lang]}</span>
                <div class="sl-gov-metric">${h.metric}</div>
                <h3 class="sl-gov-title">${h.title[lang]}</h3>
                <p class="sl-gov-desc">${h.desc[lang]}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Section 2: Rural Reality & Income Comparison for Donors -->
        <div style="background:var(--color-surface); padding:2.25rem; border:2px solid var(--color-border); border-radius:var(--radius-lg); margin:3.5rem 0;">
          <h2 style="margin-top:0; color:var(--color-slate-dark);">${sl.demographicsAndRuralReality.incomeAndLivelihoods.title[lang]}</h2>
          ${sl.demographicsAndRuralReality.incomeAndLivelihoods.paragraphs[lang].map(p => `
            <p style="font-size:0.95rem; color:var(--color-text-main); line-height:1.7; margin-bottom:1rem;">${p}</p>
          `).join('')}
        </div>

        <!-- Section 3: Continental Comparison -->
        <div style="margin:3.5rem 0;">
          <h2>${sl.continentalComparison.title[lang]}</h2>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:1.25rem; margin:1.5rem 0;">
            ${sl.continentalComparison.cards.map(c => `
              <div style="background:var(--color-surface); padding:1.5rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
                <h3 style="font-size:1.1rem; color:var(--color-terracotta); margin-bottom:0.5rem;">${c.title[lang]}</h3>
                <p style="font-size:0.9rem; color:var(--color-text-muted); line-height:1.55; margin-bottom:0;">${c.desc[lang]}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Section 4: Information for Travelers (Safety, Roads, Climate, Currency) -->
        <div style="margin:3.5rem 0;">
          <h2>${sl.travelerInfo.title[lang]}</h2>
          <p class="lead" style="margin-bottom:1.5rem;">
            ${isDe 
              ? 'Wichtige Orientierung für Teilnehmende unserer Bildungsreisen und Gäste vor Ort:' 
              : 'Essential guidance for participants of our educational journeys and visitors:'}
          </p>

          <!-- Auswärtiges Amt Safety Box -->
          <div style="background:linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border:2px solid #86efac; border-radius:var(--radius-lg); padding:1.75rem; margin-bottom:1.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.75rem;">
              <span style="font-size:1.35rem;">🛡️</span>
              <h3 style="margin:0; font-size:1.15rem; color:#166534;">${sl.travelerInfo.safetyAuswaertigesAmt.title[lang]}</h3>
            </div>
            ${sl.travelerInfo.safetyAuswaertigesAmt.paragraphs[lang].map(p => `
              <p style="font-size:0.92rem; color:#166534; line-height:1.6; margin-bottom:0.75rem;">${p}</p>
            `).join('')}
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.25rem;">
            <div class="sl-travel-card">
              <h4>🚗 ${sl.travelerInfo.roadsAndMobility.title[lang]}</h4>
              <p>${sl.travelerInfo.roadsAndMobility.desc[lang]}</p>
            </div>
            <div class="sl-travel-card">
              <h4>☀️ ${sl.travelerInfo.climateAndSeason.title[lang]}</h4>
              <p>${sl.travelerInfo.climateAndSeason.desc[lang]}</p>
            </div>
            <div class="sl-travel-card">
              <h4>💶 ${sl.travelerInfo.currencyAndPayment.title[lang]}</h4>
              <p>${sl.travelerInfo.currencyAndPayment.desc[lang]}</p>
            </div>
          </div>
        </div>

        <!-- Actions / Navigation helper -->
        <div style="background:var(--color-surface-muted); padding:2rem; border-radius:var(--radius-lg); border:1px solid var(--color-border); text-align:center; margin-top:3.5rem;">
          <h3>${isDe ? 'Möchten Sie Sierra Leone selbst erleben oder unterstützen?' : 'Experience or Support Sierra Leone'}</h3>
          <p style="color:var(--color-text-muted); max-width:600px; margin:0.5rem auto 1.5rem;">
            ${isDe 
              ? 'Erfahren Sie mehr über unsere Bildungsreisen auf Augenhöhe oder unterstützen Sie konkrete Schulbauprojekte vor Ort.' 
              : 'Learn more about our educational journeys or support grassroots school construction directly.'}
          </p>
          <div style="display:flex; justify-content:center; gap:1rem; flex-wrap:wrap;">
            <a href="${isDe ? '/bildungsreisen/' : '/en/travel/'}" class="btn btn-primary">${isDe ? 'Zu den Bildungsreisen' : 'View Educational Trips'}</a>
            <a href="${isDe ? '/faq/' : '/en/faq/'}" class="btn btn-secondary">${isDe ? 'Häufige Fragen (FAQ)' : 'Read FAQ'}</a>
            <a href="${isDe ? '/spenden/' : '/en/donate/'}" class="btn btn-outline">${isDe ? 'Schulbau unterstützen' : 'Donate'}</a>
          </div>
        </div>
      </div>
    </section>
  `;
}

// In-Depth Travel Report Renderer (10 Thematic Chapters)
function renderTravelReportPage(lang = 'de') {
  const isDe = lang === 'de';
  const rep = travel.detailedReport2026;

  return `
    <section class="section">
      <div class="container container-narrow">
        <a href="${isDe ? '/bildungsreisen/' : '/en/travel/'}" class="btn btn-secondary btn-sm" style="margin-bottom:1.5rem;">
          ${isDe ? '← Zurück zu Bildungsreisen' : '← Back to Educational Trips'}
        </a>

        <div class="section-header">
          <div class="section-tag">${isDe ? 'Ausführlicher Reisebericht • Januar 2026' : 'In-Depth Travel Report • January 2026'}</div>
          <h1>${rep.title[lang]}</h1>
          <p class="lead">
            ${isDe 
              ? 'Ein umfassender Erfahrungs- und Reflexionsbericht von Philipp Herzberg über die Bildungsreise 2026 durch Sierra Leone: Vom dörflichen Alltag in Masingbi über Schulbaustellen bis zum diplomatischen Austausch in Freetown.' 
              : 'A comprehensive pedagogical and reflective account by Philipp Herzberg following the 2026 educational expedition through Sierra Leone: from village immersion in Masingbi to school construction and diplomatic dialogue in Freetown.'}
          </p>
        </div>

        <img src="/assets/images/hero-home.jpg" alt="${isDe ? 'Teilnehmende der Bildungsreise 2026 in Sierra Leone' : 'Participants of the 2026 Educational Journey in Sierra Leone'}" style="border-radius:var(--radius-lg); margin-bottom:2.5rem; width:100%; object-fit:cover; max-height:480px; box-shadow:var(--shadow-md);">

        <!-- Featured Documentary Video -->
        <div style="background:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius-lg); padding:2rem; margin-bottom:3rem;">
          <h3 style="margin-top:0; color:var(--color-slate-dark);">
            🎬 ${isDe ? 'Dokumentarfilm zur Bildungsreise 2026' : 'Documentary Film: Educational Journey 2026'}
          </h3>
          <p style="font-size:0.95rem; color:var(--color-text-muted); margin-bottom:1.25rem;">
            ${isDe 
              ? 'Erleben Sie die Reise in bewegten Bildern: Authentische Momentaufnahmen von Schulbauten, Straßen, Dörfern und Begegnungen vor Ort.' 
              : 'Experience the journey in motion: authentic footage of school builds, rural roads, village encounters, and cultural exchange.'}
          </p>
          <div class="video-responsive" style="margin-bottom:0;">
            <iframe src="https://www.youtube-nocookie.com/embed/${rep.leadVideo}" title="Sierra Leone Bildungsreise 2026 Film" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
          </div>
        </div>

        <!-- 10 Detailed Report Chapters -->
        <div class="travel-report-body" style="font-size:1.02rem; line-height:1.75; color:var(--color-text-main);">
          ${rep.sections.map((s, idx) => `
            <article id="${s.id}" style="margin-bottom:3.5rem; padding-bottom:2.5rem; border-bottom:1px solid var(--color-border);">
              <h2 style="font-size:1.45rem; color:var(--color-slate-dark); margin-bottom:1rem;">
                ${s.title[lang]}
              </h2>

              ${s.content ? `<p style="margin-bottom:1.5rem;">${s.content[lang]}</p>` : ''}

              ${s.pillars ? `
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:1.25rem; margin:1.75rem 0;">
                  ${s.pillars.map(p => `
                    <div style="background:var(--color-surface); padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
                      <h4 style="font-size:1.02rem; color:var(--color-terracotta); margin-bottom:0.4rem;">${p.name[lang]}</h4>
                      <p style="font-size:0.88rem; color:var(--color-text-muted); margin-bottom:0; line-height:1.5;">${p.desc[lang]}</p>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              ${s.videos && s.videos.length > 0 ? `
                <div style="margin-top:1.5rem;" class="videos-grid">
                  ${s.videos.map(vidId => {
                    const vObj = travel.videos.find(v => v.id === vidId);
                    if (!vObj) return '';
                    return renderVideoCard(vObj, lang);
                  }).join('')}
                </div>
              ` : ''}
            </article>
          `).join('')}
        </div>

        <!-- Instagram Field Showcase across Visited Locations -->
        ${renderInstagramLocationShowcase(lang)}

        <!-- Substack Box -->
        <div style="margin-top:3rem; padding:2rem; background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-lg); text-align:center;">
          <h3 style="margin-top:0;">${isDe ? 'Laufende Reiseberichte auf Substack' : 'Ongoing Travel Journals on Substack'}</h3>
          <p style="color:var(--color-text-muted); max-width:540px; margin:0 auto 1.25rem;">
            ${isDe 
              ? 'Philipp Herzberg veröffentlicht regelmäßig persönliche Tagebucheinträge und Hintergrundberichte während der Reisen auf unserem Substack-Kanal.' 
              : 'Philipp Herzberg publishes regular field journals and reflective background essays during expeditions on our Substack channel.'}
          </p>
          <a href="${org.socialLinks.substack}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">
            ${isDe ? 'Substack-Publikation lesen ↗' : 'Read Substack Publication ↗'}
          </a>
        </div>
      </div>
    </section>
  `;
}

// 100% Symmetrical Project Detail Page Renderer
function renderProjectDetailPage(p, lang = 'de') {
  const isDe = lang === 'de';
  const isMafabaneh = p.id === 'mafabaneh';

  if (p.status === 'archived') {
    return `
    <section class="section">
      <div class="container container-narrow">
        <a href="${isDe ? '/projekte/' : '/en/projects/'}" class="btn btn-secondary btn-sm" style="margin-bottom:1.5rem;">
          ${isDe ? '← Zurück zur Projektübersicht' : '← Back to Projects Overview'}
        </a>
        
        <div style="margin-bottom:1rem; display:flex; align-items:center; gap:0.75rem;">
          <span class="status-badge" style="background:#fee2e2; color:#991b1b; border:1px solid #f87171;">
            ${p.statusLabel[lang]}
          </span>
          <span style="font-size:0.9rem; color:var(--color-text-muted);">📍 ${p.location}</span>
        </div>

        <h1 style="margin-bottom:0.75rem;">${p.title[lang]}</h1>
        <p class="lead" style="margin-bottom:2rem;">${p.tagline[lang]}</p>

        <!-- Archived Project Alert Banner -->
        <div style="background:#fef2f2; border:2px solid #f87171; border-radius:var(--radius-lg); padding:1.75rem; margin-bottom:2.5rem; box-shadow:var(--shadow-sm);">
          <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem; flex-wrap:wrap;">
            <span style="font-size:1.5rem;">⚠️</span>
            <span style="background:#dc2626; color:#ffffff; font-weight:800; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; padding:0.25rem 0.65rem; border-radius:var(--radius-full);">
              ${isDe ? 'Archiviertes Projekt' : 'Archived Project'}
            </span>
            <strong style="font-size:1.15rem; color:#991b1b;">
              ${isDe ? 'Dieses Projekt wird derzeit nicht aktiv unterstützt' : 'This project is currently not actively supported'}
            </strong>
          </div>
          <p style="color:#7f1d1d; font-size:0.95rem; line-height:1.6; margin-bottom:0;">
            ${p.archivedNotice[lang]}
          </p>
        </div>

        <img src="${p.leadImage}" alt="${p.title[lang]}" style="border-radius:var(--radius-lg); margin-bottom:2rem; box-shadow:var(--shadow-md); width:100%; object-fit:cover; max-height:480px;">

        <!-- Honest History & Lessons Learned -->
        <div style="background:var(--color-surface); padding:2rem; border:1px solid var(--color-border); border-radius:var(--radius-lg); margin:2.5rem 0;">
          <h2 style="margin-top:0; color:var(--color-slate-dark);">
            ${isDe ? 'Hintergrund & Wichtige Lehren aus der Anfangszeit' : 'Background & Fundamental Lessons Learned'}
          </h2>
          <p style="font-size:1rem; line-height:1.7; color:var(--color-text-main); margin-bottom:0;">
            ${p.honestHistory[lang]}
          </p>
        </div>

        <!-- Structural Engineering Standards Adopted -->
        <h2 style="margin-top:3rem;">${isDe ? 'Konsequenzen & Vereinskriterien für nachhaltigen Bau' : 'Structural Standards & Association Criteria'}</h2>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:1.25rem; margin:1.5rem 0;">
          ${(p.engineeringStandard || []).map(s => `
            <div style="background:var(--color-surface); padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h4 style="margin-bottom:0.35rem; color:var(--color-terracotta);">${s.title[lang]}</h4>
              <p style="font-size:0.9rem; margin-bottom:0; color:var(--color-text-muted);">${s.desc[lang]}</p>
            </div>
          `).join('')}
        </div>

        <!-- Milestones Timeline -->
        <h2 style="margin-top:3rem;">${isDe ? 'Chronologie & Projektschritte' : 'Chronology & Project History'}</h2>
        <div style="margin:1.5rem 0;">
          ${p.milestones.map(m => `
            <div class="chronology-step">
              <div class="chronology-step-content" style="width:100%;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem; flex-wrap:wrap; gap:0.5rem;">
                  <span style="font-weight:700; color:var(--color-terracotta); font-size:0.95rem;">${m.date}</span>
                  <span style="font-size:0.75rem; background:#fee2e2; color:#991b1b; padding:0.15rem 0.5rem; border-radius:3px; font-weight:600;">
                    ${isDe ? 'Dokumentiert' : 'Archived'}
                  </span>
                </div>
                <h4 style="margin-bottom:0.35rem; font-size:1.1rem;">${m.title[lang]}</h4>
                <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0.5rem;">${m.desc[lang]}</p>
                <div style="font-size:0.78rem; color:#78716c;">
                  <strong>${isDe ? 'Quelle' : 'Source'}:</strong> ${m.source}
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Active Projects Link Box -->
        <div style="margin-top:3.5rem; padding:2rem; background:linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border:1px solid #86efac; border-radius:var(--radius-lg); text-align:center;">
          <h3 style="margin-top:0; color:#166534;">
            ${isDe ? 'Unterstützen Sie unsere aktiven Schulbauprojekte' : 'Support Our Active School Construction Projects'}
          </h3>
          <p style="color:#15803d; font-size:0.95rem; max-width:620px; margin:0 auto 1.5rem;">
            ${isDe 
              ? 'Unsere gesamte Energie fließt aktuell in die Fertigstellung der 5 Klassenräume in Mamoru und den Bau des Mafabaneh Learning Hubs.' 
              : 'Our entire collective focus is currently directed toward completing five classrooms in Mamoru and constructing the Mafabaneh Learning Hub.'}
          </p>
          <div style="display:flex; justify-content:center; gap:1rem; flex-wrap:wrap;">
            <a href="${isDe ? '/projekte/mamoru/' : '/en/projects/mamoru/'}" class="btn btn-primary btn-sm">
              ${isDe ? 'Grundschule Mamoru ansehen →' : 'View Mamoru Primary →'}
            </a>
            <a href="${isDe ? '/projekte/mafabaneh/' : '/en/projects/mafabaneh/'}" class="btn btn-secondary btn-sm">
              ${isDe ? 'Mafabaneh Learning Hub ansehen →' : 'View Mafabaneh Hub →'}
            </a>
          </div>
        </div>
      </div>
    </section>
    `;
  }

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

        ${p.crowdfunding ? `
          <!-- GoFundMe Crowdfunding Alternative Notice -->
          <div style="background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-md); padding:1rem 1.25rem; margin-top:1rem; margin-bottom:2rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
            <div style="font-size:0.88rem; color:var(--color-text-muted); max-width:680px;">
              <strong>💳 ${isDe ? 'Spenden aus dem Ausland oder per Kreditkarte?' : 'International Donors or Credit Card?'}</strong>
              <span style="display:block; margin-top:0.2rem;">${p.crowdfunding.note[lang]}</span>
            </div>
            <a href="${p.crowdfunding.campaignUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="white-space:nowrap;">
              ${isDe ? 'GoFundMe-Kampagne ↗' : 'GoFundMe Campaign ↗'}
            </a>
          </div>
        ` : ''}

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
            <p style="background:var(--color-surface-muted); padding:0.75rem 1rem; border-radius:var(--radius-sm); font-size:0.9rem; margin-bottom:1rem;">
              <strong>${isDe ? 'Persönlicher Einsatz' : 'Personal Contribution'}:</strong> 
              ${isDe ? 'Sergei Tchoban bringt persönlich 14.000 USD privater Mittel in den Bau des Learning Hubs ein.' : 'Sergei Tchoban is contributing $14,000 USD of his own private funds into the learning hub.'}
            </p>
            <p style="margin-bottom:1.5rem;">
              <em>${p.architect.siteVisit[lang]}</em>
            </p>
            <p>
              <strong>${isDe ? 'Lokale Trägerschaft' : 'Local Leadership'}:</strong> ${p.localPartner.organization} (${p.localPartner.leader}, geboren in Mafabaneh).
            </p>
            <a href="${p.localPartner.strategicPlanDocument}" class="btn btn-secondary btn-sm" download>
              📄 ${isDe ? 'Strategieplan 2025–2030 herunterladen (PDF, 508 KB)' : 'Download Strategic Plan 2025-2030 (PDF, 508 KB)'}
            </a>
          ` : `
            <p>
              <strong>${p.localPartner.organization} (${p.localPartner.leader}):</strong> 
              ${isDe 
                ? 'Juliet Fornah setzt sich seit über zehn Jahren in Makeni für Kinderrechte ein und leitet die Bauaufsicht vor Ort.' 
                : 'Juliet Fornah has advocated for child welfare in Makeni for over a decade and leads construction oversight on site.'}
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

        ${!isMafabaneh ? `
          <!-- Mamoru School Operations & Academic Milestones -->
          <div style="background:var(--color-surface); padding:2rem; border:2px solid var(--color-border); border-radius:var(--radius-lg); margin:2.5rem 0;">
            <h3 style="margin-bottom:1rem; color:var(--color-slate-dark);">
              ${isDe ? 'Schulbetrieb, Bildungssystem & Meilensteine' : 'School Operations, Academic System & Milestones'}
            </h3>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
              <div style="background:var(--color-surface-muted); padding:1rem; border-radius:var(--radius-md);">
                <div style="font-size:1.75rem; font-weight:800; color:var(--color-terracotta);">85</div>
                <div style="font-weight:700; font-size:0.9rem;">${isDe ? 'Schüler:innen' : 'Pupils Enrolled'}</div>
                <div style="font-size:0.8rem; color:var(--color-text-muted);">${isDe ? 'Aktuelle School Roll' : 'Active school roll'}</div>
              </div>
              <div style="background:var(--color-surface-muted); padding:1rem; border-radius:var(--radius-md);">
                <div style="font-size:1.75rem; font-weight:800; color:var(--color-terracotta);">5</div>
                <div style="font-weight:700; font-size:0.9rem;">${isDe ? 'Aktive Lehrkräfte' : 'Active Teachers'}</div>
                <div style="font-size:0.8rem; color:var(--color-text-muted);">${isDe ? '12 Monate Gehälter gesichert' : '12-month salaries secured'}</div>
              </div>
              <div style="background:var(--color-surface-muted); padding:1rem; border-radius:var(--radius-md);">
                <div style="font-size:1.75rem; font-weight:800; color:var(--color-terracotta);">Mai 2027</div>
                <div style="font-weight:700; font-size:0.9rem;">${isDe ? 'NPSE-Prüfungsziel' : 'NPSE Exam Target'}</div>
                <div style="font-size:0.8rem; color:var(--color-text-muted);">${isDe ? 'National Primary School Exam' : 'Primary graduation cohort'}</div>
              </div>
              <div style="background:var(--color-surface-muted); padding:1rem; border-radius:var(--radius-md);">
                <div style="font-size:1.75rem; font-weight:800; color:var(--color-terracotta);">10 NLE</div>
                <div style="font-weight:700; font-size:0.9rem;">${isDe ? 'Monatl. Elternbeitrag' : 'Monthly Parent Fee'}</div>
                <div style="font-size:0.8rem; color:var(--color-text-muted);">${isDe ? 'Lokale Eigenverantwortung' : 'Local community ownership'}</div>
              </div>
            </div>
            <p style="font-size:0.92rem; color:var(--color-text-muted); margin-bottom:0;">
              ${isDe 
                ? 'Die Grundschule Mamoru unterrichtet nach dem staatlichen <strong>6-3-3-4-System</strong> Sierra Leones (6 Jahre Grundschule). Ein restrukturiertes lokales <em>Education Committee</em> sichert die transparente operative Begleitung vor Ort. Um die letzten Arbeiten (Wandverputz, Zementestrich und Außentüren) abzuschließen, fehlen noch exakt <strong>6.000 USD (ca. 5.500 €)</strong>.' 
                : 'Mamoru Primary operates under Sierra Leone’s national <strong>6-3-3-4 educational framework</strong> (6 years of primary schooling). A restructured local <em>Education Committee</em> oversees daily operations. To conclude protective plastering, concrete screed floors and security doors, an exact remaining sum of <strong>$6,000 USD (approx. €5,500)</strong> is required.'}
            </p>
          </div>
        ` : ''}

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

        <!-- Project Videos Section -->
        ${p.videos && p.videos.length > 0 ? `
          <h2 style="margin-top:3.5rem;">${isDe ? (isMafabaneh ? 'Drohnenaufnahme & Baufeld' : 'Videodokumentation: Von der Grundsteinlegung bis zur Ausstattung') : (isMafabaneh ? 'Drone Aerial Footage & Site' : 'Video Documentation: From Cornerstone to Furnishing')}</h2>
          <p class="lead">${isDe ? (isMafabaneh ? 'Erleben Sie das Dorf Mafabaneh und das Baufeld des Learning Hubs aus der Vogelperspektive:' : 'Erleben Sie die entscheidenden Momente des Schulbaus in Mamoru in Bild und Ton:') : (isMafabaneh ? 'Experience the village of Mafabaneh and the building site from an aerial perspective:' : 'Experience pivotal moments of the school construction in Mamoru through original video footage:')}</p>
          <div class="videos-grid">
            ${p.videos.map(v => renderVideoCard(v, lang)).join('')}
          </div>
        ` : ''}

        <!-- Mamoru 2025 Photo Construction Diary (Sequential 13-step evolution) -->
        ${p.constructionDiary2025 && p.constructionDiary2025.length > 0 ? `
          <div style="margin-top:3.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:0.5rem;">
              <h2>${isDe ? 'Bautagebuch 2025: Die fünf Klassenräume Schritt für Schritt' : '2025 Construction Diary: Five Classrooms Built Step by Step'}</h2>
              <span style="font-size:0.85rem; background:var(--color-terracotta); color:#ffffff; padding:0.25rem 0.65rem; border-radius:var(--radius-full); font-weight:700;">
                ${isDe ? '13 Bauphasen im Bild' : '13 Sequential Field Photos'}
              </span>
            </div>
            <p class="lead" style="margin-bottom:1rem;">
              ${isDe 
                ? 'Originale Bilddokumentation von den ersten Fundamentgräben im Februar bis zum regendichten Rohbau im Juni 2025:' 
                : 'Original photo sequence documenting all 13 construction phases from foundation trench excavation in February to the monsoon-proof shell in June 2025:'}
            </p>
            
            <div class="construction-diary-grid">
              ${p.constructionDiary2025.map(item => `
                <div class="construction-diary-card">
                  <img src="${item.image}" alt="${item.title[lang]} - Grundschule Mamoru (${item.date})" class="construction-diary-img" loading="lazy">
                  <div class="construction-diary-body">
                    <div class="construction-diary-meta">
                      <span class="construction-diary-step">${isDe ? `Schritt ${item.step} von 13` : `Step ${item.step} of 13`}</span>
                      <span class="construction-diary-date">📅 ${item.date}</span>
                    </div>
                    <div class="construction-diary-title">${item.title[lang]}</div>
                    <p class="construction-diary-desc">${item.desc[lang]}</p>
                  </div>
                </div>
              `).join('')}
            </div>
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

    <!-- Social Media Footprint (Instagram & YouTube) -->
    ${renderHomeSocialFootprint('de')}

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
    description: 'Übersicht über unsere aktiven, nachhaltigen Schulbauprojekte in Sierra Leone: Mafabaneh und Mamoru.',
    canonicalPath: '/projekte/',
    content: projectsOverviewDe
  }));

  // ==========================================
  // 3. PROJEKT DETAILSEITEN (DEUTSCH)
  // ==========================================
  activeProjects.forEach(p => {
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
                <h3 style="font-size:1.35rem; color:var(--color-terracotta);">${m.tier.de}</h3>
                <span style="font-size:1.25rem; font-weight:800; color:var(--color-slate-dark);">${m.amount.de}</span>
              </div>
              <p style="font-weight:600; font-size:0.95rem; margin-bottom:0.5rem;">Zielprojekt: ${m.targetProject.de}</p>
              <p style="color:var(--color-text-muted); font-size:0.9rem; margin-bottom:1rem;">${m.impact.de}</p>
              
              <div style="background:var(--color-surface-muted); padding:1rem; border-radius:var(--radius-sm); font-size:0.85rem;">
                <strong>Was Ihr Unternehmen erhält:</strong>
                <ul style="margin-left:1.25rem; margin-top:0.35rem; color:var(--color-text-muted);">
                  ${m.deliverables.de.map(d => `<li>${d}</li>`).join('')}
                </ul>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="callout" style="margin-top:3rem;">
          <div class="callout-title">Erfolgsbeispiel: AcadeMedia Education GmbH</div>
          <p>${corporate.existingSuccessStory.quote.de}</p>
          ${corporate.existingSuccessStory.video ? `
            <div class="video-responsive" style="margin:1.25rem 0 0.5rem;">
              <iframe src="${corporate.existingSuccessStory.video}" title="AcadeMedia Schulausstattung Mamoru" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
            </div>
            <p style="font-size:0.85rem; color:var(--color-text-muted); font-style:italic; margin-top:0.25rem; margin-bottom:0;">
              Dokumentation vor Ort: Die durch AcadeMedia finanzierten Tische und Holzbänke in allen fünf Klassenräumen der Grundschule Mamoru.
            </p>
          ` : ''}
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
                <h4 style="margin-bottom:0.25rem;">${doc.title.de}</h4>
                <p style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:0;">${doc.subtitle.de}</p>
              </div>
              <a href="${doc.url}" class="btn btn-secondary btn-sm" download>Download (${doc.format}, ${doc.size})</a>
            </div>
          `).join('')}
        </div>

        <h2 style="margin-top:3rem;">Jahresübersichten der Mittelverwendung</h2>
        
        <div style="margin:1.5rem 0; padding:1.25rem 1.5rem; background:#f8fafc; border:1px solid var(--color-border); border-radius:var(--radius-md); font-size:0.92rem; line-height:1.6; color:var(--color-text-main);">
          <div style="font-weight:700; color:var(--color-slate-dark); margin-bottom:0.35rem; display:flex; align-items:center; gap:0.4rem;">
            <span>ℹ️</span>
            <span>Rechtliche Transparenz zur Gründungsphase 2025</span>
          </div>
          <p style="margin:0; font-size:0.88rem; color:var(--color-text-muted);">
            Der Verein befand sich 2025 in der formellen Eintragungs- und Anerkennungsphase. Bis zur Erteilung der steuerlichen Gemeinnützigkeit flossen aus haftungs- und vereinsrechtlichen Gründen bewusst <strong>keinerlei Gelder über das Vereinskonto</strong> (0 € Vereinskontoumsatz). Sämtliche Projektkosten vor Ort in Mamoru wurden zu 100 % von den Gründern aus privaten Mitteln getragen.
          </p>
        </div>

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
                  <td style="padding:0.75rem 1rem;">${row.totalDonations === 0 ? '0 €' : row.totalDonations.toLocaleString('de-DE') + ' €'}</td>
                  <td style="padding:0.75rem 1rem; color:#15803d; font-weight:600;">${row.projectDisbursements === 0 ? '0 €' : row.projectDisbursements.toLocaleString('de-DE') + ' €'}</td>
                  <td style="padding:0.75rem 1rem;">0 € (ehrenamtlich)</td>
                  <td style="padding:0.75rem 1rem; font-size:0.85rem; color:var(--color-text-muted);">${row.sourceNote.de}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <h2 style="margin-top:3.5rem;">Langfristige Vision & Technologie</h2>
        <p class="lead" style="max-width:720px;">
          Bildung als Motor für lokale Wirtschaftskraft: Wir schaffen Zukunftsperspektiven vor Ort durch nachhaltige Schulinfrastruktur und Digital Leapfrogging.
        </p>
        ${renderStrategicVision('de')}

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
          Yoni Sesay und Philipp Herzberg lernten sich als Lehrerkollegen an einer Schule in London kennen. 
          Yoni stammt aus Sierra Leone und nahm Philipp eines Sommers mit in seine Heimat. Sie reisten gemeinsam durch das Land, 
          schliefen in kleinen Dörfern und besuchten Schulen, die unter einfachsten Bedingungen unterrichteten.
        </p>
        <p>
          Diese intensive Erfahrung prägte beide nachhaltig. Aus dem Wunsch heraus, den Menschen nicht als anonyme Hilfsorganisation, 
          sondern als verlässliche Freunde auf Augenhöhe beizustehen, gründeten sie die Initiative <em>Bildung mit Herz Sierra Leone e.V.</em>
        </p>

        <h2 style="margin-top:2.5rem;">Der Vorstand & Initiatoren</h2>
        <div style="display:grid; gap:1.5rem; margin:1.5rem 0;">
          ${org.board.map(b => `
            <div style="background:var(--color-surface); padding:1.75rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.25rem;">
                <h3 style="margin-bottom:0; font-size:1.3rem;">${b.name}</h3>
                <span style="color:var(--color-terracotta); font-weight:700; font-size:0.88rem;">${b.role.de}</span>
              </div>
              <p style="color:var(--color-text-muted); font-weight:600; font-size:0.9rem; margin-bottom:0.75rem;">${b.profession.de}</p>
              <p style="font-size:0.92rem; color:var(--color-text-main); line-height:1.6; margin-bottom:0;">${b.bio.de}</p>
            </div>
          `).join('')}

          ${org.coFounders.map(c => `
            <div style="background:var(--color-surface); padding:1.75rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.25rem;">
                <h3 style="margin-bottom:0; font-size:1.3rem;">${c.name}</h3>
                <span style="color:var(--color-terracotta); font-weight:700; font-size:0.88rem;">${c.role.de}</span>
              </div>
              <p style="color:var(--color-text-muted); font-weight:600; font-size:0.9rem; margin-bottom:0.25rem;">${c.profession.de}</p>
              <p style="color:var(--color-text-muted); font-size:0.85rem; margin-bottom:0.75rem;"><em>📍 ${c.origin.de}</em></p>
              <p style="font-size:0.92rem; color:var(--color-text-main); line-height:1.6; margin-bottom:0;">${c.bio.de}</p>
            </div>
          `).join('')}
        </div>

        <div style="background:var(--color-surface-muted); padding:1.25rem 1.5rem; border-radius:var(--radius-md); border:1px solid var(--color-border); margin:2rem 0;">
          <strong>Gründungsmitglieder:</strong> ${org.foundingCircle.de}
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

        <h2>Unser Reiseansatz: Horizonterweiterung durch Kontrast</h2>
        <p>${travel.philosophy.de}</p>

        <!-- Upcoming Trip Application Box (Strictly Open Call without 2026/27 alliance/dates) -->
        <div style="background:linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%); border:2px solid #fde68a; border-radius:var(--radius-lg); padding:2rem; margin:2.5rem 0; box-shadow:var(--shadow-sm);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
            <h3 style="margin:0; color:#78350f;">${travel.upcomingTrip.title.de}</h3>
            <span style="font-size:0.8rem; background:#92400e; color:#ffffff; padding:0.25rem 0.65rem; border-radius:var(--radius-full); font-weight:700;">
              ${travel.upcomingTrip.status.de}
            </span>
          </div>
          <p style="color:#78350f; line-height:1.6; margin-bottom:1.25rem;">
            ${travel.upcomingTrip.desc.de}
          </p>
          <div style="display:flex; gap:1rem; flex-wrap:wrap; align-items:center;">
            <a href="mailto:${travel.contactPerson.email}?subject=Bewerbung%20Bildungsreise%20Sierra%20Leone" class="btn btn-primary btn-sm">
              ${travel.upcomingTrip.ctaText.de}
            </a>
            <button type="button" class="btn btn-secondary btn-sm copy-btn" data-copy="${travel.contactPerson.email}">
              E-Mail kopieren
            </button>
          </div>
        </div>

        <!-- Information Presentation Deck Link -->
        <div style="background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-md); padding:1.25rem 1.5rem; margin:2rem 0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
          <div>
            <h4 style="margin-bottom:0.25rem;">📊 ${travel.presentationDeck.title.de}</h4>
            <p style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:0;">Detaillierte Präsentation zu Vorbereitung, Programm, Kostenkalkulation und Verhaltensleitlinien.</p>
          </div>
          <a href="${travel.presentationDeck.url}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">Präsentation öffnen ↗</a>
        </div>

        <!-- Video Documentary Section (7 Videos) -->
        <div style="margin:3rem 0;">
          <h2>Video-Dokumentationen unserer Bildungsreisen</h2>
          <p class="lead" style="margin-bottom:1rem;">
            Erleben Sie authentische Eindrücke unserer Reisen: Vom Schulbau und Ziegelpressen über Schulbesuche bis hin zu den Begegnungen in den Dörfern.
          </p>
          ${renderVideoGallery('de')}
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
                <div style="font-size:0.82rem; font-weight:700; color:var(--color-terracotta); margin-bottom:0.5rem;">
                  👥 ${trip.participants.de}
                </div>
                <p class="trip-card-desc">${trip.desc.de}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Activities Section -->
        <h2 style="margin-top:3.5rem;">Aktivitäten & Alltag vor Ort</h2>
        <p class="lead">Das Reiseprogramm wird in enger Absprache mit Yoni Sesay und den Dorfgemeinschaften gestaltet:</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:1.25rem; margin:1.5rem 0;">
          ${travel.activities.map(act => `
            <div style="background:var(--color-surface); padding:1.5rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h3 style="font-size:1.1rem; color:var(--color-terracotta); margin-bottom:0.5rem;">${act.title.de}</h3>
              <p style="font-size:0.9rem; color:var(--color-text-muted); line-height:1.55; margin-bottom:0;">${act.desc.de}</p>
            </div>
          `).join('')}
        </div>

        <!-- Safety, Health & Supervision -->
        <div style="background:var(--color-surface); padding:2rem; border:2px solid var(--color-border); border-radius:var(--radius-lg); margin:3rem 0;">
          <h2 style="margin-top:0;">Sicherheit, Gesundheit & Organisation</h2>
          <p class="lead" style="margin-bottom:1.5rem;">
            Maximale Sicherheit durch vertraute lokale Netzwerke, offizielle Genehmigungen und klare Protokolle:
          </p>

          <div style="display:grid; gap:1rem;">
            <div style="background:var(--color-surface-muted); padding:1rem 1.25rem; border-radius:var(--radius-md);">
              <strong>👑 Paramout Chief & Polizeiregistrierung:</strong>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0; margin-top:0.25rem;">${travel.safetyAndHealth.approvals.de}</p>
            </div>
            <div style="background:var(--color-surface-muted); padding:1rem 1.25rem; border-radius:var(--radius-md);">
              <strong>🚌 Eigener Reisebus & Transport:</strong>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0; margin-top:0.25rem;">${travel.safetyAndHealth.transport.de}</p>
            </div>
            <div style="background:var(--color-surface-muted); padding:1rem 1.25rem; border-radius:var(--radius-md);">
              <strong>🏨 Sichere Unterkünfte & Mückenschutz:</strong>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0; margin-top:0.25rem;">${travel.safetyAndHealth.accommodations.de}</p>
            </div>
            <div style="background:var(--color-surface-muted); padding:1rem 1.25rem; border-radius:var(--radius-md);">
              <strong>🏥 Medizinische Nähe & Notfallapotheke:</strong>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0; margin-top:0.25rem;">${travel.safetyAndHealth.medicalProximity.de}</p>
            </div>
            <div style="background:var(--color-surface-muted); padding:1rem 1.25rem; border-radius:var(--radius-md);">
              <strong>🧑‍🏫 Betreuungsquote:</strong>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0; margin-top:0.25rem;">${travel.safetyAndHealth.supervisionRatio.de}</p>
            </div>
            <div style="background:var(--color-surface-muted); padding:1rem 1.25rem; border-radius:var(--radius-md);">
              <strong>💉 Impfungen & Tropenmedizin:</strong>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0; margin-top:0.25rem;">${travel.safetyAndHealth.vaccinations.de}</p>
            </div>
          </div>
        </div>

        <!-- Travel Funding & Zero-Donation Guarantee -->
        <div style="background:var(--color-surface); padding:2rem; border:1px solid var(--color-border); border-radius:var(--radius-lg); margin:3rem 0;">
          <h2 style="margin-top:0;">Reisekosten & 100% Direkt-Garantie</h2>
          <p style="font-size:0.95rem; color:var(--color-text-main); margin-bottom:1rem;">
            <strong>Gesamtkosten:</strong> ${travel.travelFunding.totalCost.de}
          </p>
          <ul style="color:var(--color-text-muted); font-size:0.9rem; margin-left:1.25rem; margin-bottom:1.5rem; line-height:1.6;">
            <li><strong>Flugkosten:</strong> ${travel.travelFunding.flightCost.de}</li>
            <li><strong>Kosten vor Ort:</strong> ${travel.travelFunding.localCosts.de}</li>
            <li><strong>Begleiter & Guides:</strong> ${travel.travelFunding.localSupport.de}</li>
            <li><strong>Versicherungen:</strong> ${travel.travelFunding.insurance.de}</li>
          </ul>
          <div style="background:linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border:1px solid #86efac; border-radius:var(--radius-md); padding:1.25rem;">
            <strong style="color:#166534;">🛡️ Keine Spendengelder für Reisen:</strong>
            <p style="font-size:0.9rem; color:#166534; margin-bottom:0; margin-top:0.25rem;">
              ${travel.travelFunding.zeroDonationGuarantee.de}
            </p>
          </div>
        </div>

        <!-- Packing List Section -->
        <h2 style="margin-top:3.5rem;">Packliste für Sierra Leone</h2>
        <p class="lead">Erprobte Ausrüstungs- und Bekleidungsliste für das Landesinnere von Sierra Leone:</p>
        ${renderPackingList('de')}

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

        <!-- Instagram Field Showcase across Visited Locations -->
        ${renderInstagramLocationShowcase('de')}

        <div style="text-align:center; margin:2.5rem 0; padding:2rem; background:var(--color-surface-muted); border-radius:var(--radius-md); border:1px solid var(--color-border);">
          <h3>Ausführlicher Reisebericht 2026</h3>
          <p style="color:var(--color-text-muted); font-size:0.95rem; margin-bottom:1.25rem;">Lesen Sie den vollständigen Erfahrungsbericht von Philipp Herzberg über Trommeln in Makoma und Grundsteine in Mafabaneh.</p>
          <a href="/bildungsreisen/reiseberichte/" class="btn btn-primary">Zum Reisebericht 2026 →</a>
        </div>

        <h2 style="margin-top:3.5rem;">Häufige Fragen (FAQ) & Reisevorbereitung</h2>
        <p class="lead" style="margin-bottom:1.5rem;">
          Wichtige Antworten zu Impfpflichten, Visum, Malariaprophylaxe, Reisesicherheit, SIM-Karten und dem Alltag vor Ort:
        </p>
        ${renderCategorizedFaq('de')}
        <div style="text-align:center; margin-top:2.5rem;">
          <a href="/faq/" class="btn btn-secondary btn-sm">Alle Fragen auf der FAQ-Übersichtsseite ansehen →</a>
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
  writeRoute('/bildungsreisen/reiseberichte', renderHtmlPage({
    lang: 'de',
    title: 'Ausführlicher Bildungsreisebericht 2026: Pädagogische Tiefe, Begegnungen & Meilensteine',
    description: 'Erfahrungs- und Reflexionsbericht der Bildungsreise 2026 nach Sierra Leone von Philipp Herzberg: Von Masingbi und Mamoru bis Freetown.',
    canonicalPath: '/bildungsreisen/reiseberichte/',
    content: renderTravelReportPage('de')
  }));

  // ==========================================
  // 7.2 HÄUFIGE FRAGEN (FAQ) (DEUTSCH)
  // ==========================================
  writeRoute('/faq', renderHtmlPage({
    lang: 'de',
    title: 'Häufige Fragen zu Bildungsreisen & Vorbereitung (FAQ)',
    description: 'Antworten zu Impfpflichten (Gelbfieber), Visum, Malariaprophylaxe, Reisesicherheit, SIM-Karten und Reiseorganisation nach Sierra Leone.',
    canonicalPath: '/faq/',
    content: renderFaqStandalonePage('de')
  }));

  // ==========================================
  // 7.3 ÜBER SIERRA LEONE (DEUTSCH)
  // ==========================================
  writeRoute('/sierra-leone', renderHtmlPage({
    lang: 'de',
    title: 'Sierra Leone im Überblick: Fakten, Reformen & Reisesicherheit',
    description: 'Objektive Länderinformationen: Ibrahim Index of African Governance (IIAG), Bildungsreformen, ländliche Einkommen und Sicherheitshinweise.',
    canonicalPath: '/sierra-leone/',
    content: renderSierraLeonePage('de')
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
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">Um Gebührenabzüge durch Zahlungsdienstleister von bis zu 3 % zu vermeiden und sicherzustellen, dass 100 % in Sierra Leone ankommen, empfehlen wir die direkte SEPA-Banküberweisung. Für Unterstützerinnen und Unterstützer ohne europäisches Bankkonto oder bei gewünschter Zahlung via Kreditkarte/Apple Pay besteht zusätzlich die Möglichkeit, unsere verifizierte GoFundMe-Kampagne zu nutzen: <a href="https://www.gofundme.com/f/wir-bauen-schulen-in-sierra-leone-mach-mit" target="_blank" rel="noopener noreferrer" style="color:var(--color-primary-dark); font-weight:600; text-decoration:underline;">GoFundMe: Wir bauen Schulen in Sierra Leone</a> (bitte beachten Sie, dass GoFundMe Abwicklungsgebühren einbehält und keine deutschen Zuwendungsbestätigungen ausstellen kann).</p>
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

    <!-- Social Media Footprint (Instagram & YouTube) -->
    ${renderHomeSocialFootprint('en')}

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

    <!-- Corporate Teaser -->
    <section class="section section-muted">
      <div class="container" style="background:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius-lg); padding:3.5rem 2.5rem; display:grid; grid-template-columns:1fr; gap:2.5rem; align-items:center;">
        <div>
          <span class="hero-tagline" style="margin-bottom:0.75rem;">For Corporations & Foundations</span>
          <h2>Sponsor School Infrastructure with Verifiable Impact</h2>
          <p class="lead" style="margin-bottom:1.5rem;">
            Invest targeted funds into rural education: from classroom furniture sets to full classroom blocks or annual teacher salaries. We provide comprehensive photo and receipt documentation for your CSR reporting.
          </p>
          <div style="display:flex; gap:1rem; flex-wrap:wrap;">
            <a href="/en/corporate/" class="btn btn-primary">Review Partnership Models</a>
            <button type="button" class="btn btn-secondary copy-btn" data-copy="${org.contacts.email}">
              Copy Email Address
            </button>
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

                <div class="funding-bar-wrap">
                  <div class="funding-bar-labels">
                    <span>Secured: ${p.finances.securedFunding.amount.toLocaleString('en-US')} €</span>
                    <span>Need: ${p.finances.outstandingNeed.amount.toLocaleString('en-US')} €</span>
                  </div>
                  <div class="funding-progress">
                    <div class="funding-progress-fill" style="width: ${Math.round((p.finances.securedFunding.amount / p.finances.totalEstimatedBudget.amount) * 100)}%;"></div>
                  </div>
                </div>

                <div style="margin-top:auto; display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:0.85rem; color:var(--color-text-muted);">${p.location.split(',')[0]}</span>
                  <a href="/en/projects/${p.slug}/" class="btn btn-secondary btn-sm">View Project →</a>
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
    description: 'Overview of our active, sustainable educational infrastructure projects in Sierra Leone: Mafabaneh and Mamoru.',
    canonicalPath: '/en/projects/',
    content: projectsEn
  }));

  // 12.3 & 12.4 PROJECT DETAIL PAGES (EN)
  activeProjects.forEach(p => {
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
                <h3 style="font-size:1.35rem; color:var(--color-terracotta);">${m.tier.en}</h3>
                <span style="font-size:1.25rem; font-weight:800; color:var(--color-slate-dark);">${m.amount.en}</span>
              </div>
              <p style="font-weight:600; font-size:0.95rem; margin-bottom:0.5rem;">Target Project: ${m.targetProject.en}</p>
              <p style="color:var(--color-text-muted); font-size:0.9rem; margin-bottom:1rem;">${m.impact.en}</p>
              <div style="background:var(--color-surface-muted); padding:1rem; border-radius:var(--radius-sm); font-size:0.85rem;">
                <strong>Deliverables for your company:</strong>
                <ul style="margin-left:1.25rem; margin-top:0.35rem; color:var(--color-text-muted);">
                  ${m.deliverables.en.map(d => `<li>${d}</li>`).join('')}
                </ul>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="callout" style="margin-top:3rem;">
          <div class="callout-title">Success Story: AcadeMedia Education GmbH</div>
          <p>${corporate.existingSuccessStory.quote.en}</p>
          ${corporate.existingSuccessStory.video ? `
            <div class="video-responsive" style="margin:1.25rem 0 0.5rem;">
              <iframe src="${corporate.existingSuccessStory.video}" title="AcadeMedia Classroom Desks Mamoru" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
            </div>
            <p style="font-size:0.85rem; color:var(--color-text-muted); font-style:italic; margin-top:0.25rem; margin-bottom:0;">
              On-site field verification: custom-made wooden desks and benches funded by AcadeMedia across all five classrooms of Mamoru Primary.
            </p>
          ` : ''}
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
                <h4 style="margin-bottom:0.25rem;">${doc.title.en}</h4>
                <p style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:0;">${doc.subtitle.en}</p>
              </div>
              <a href="${doc.url}" class="btn btn-secondary btn-sm" download>Download (${doc.format}, ${doc.size})</a>
            </div>
          `).join('')}
        </div>

        <h2 style="margin-top:3rem;">Annual Fund Utilization Overviews</h2>
        
        <div style="margin:1.5rem 0; padding:1.25rem 1.5rem; background:#f8fafc; border:1px solid var(--color-border); border-radius:var(--radius-md); font-size:0.92rem; line-height:1.6; color:var(--color-text-main);">
          <div style="font-weight:700; color:var(--color-slate-dark); margin-bottom:0.35rem; display:flex; align-items:center; gap:0.4rem;">
            <span>ℹ️</span>
            <span>Regulatory Transparency on the 2025 Founding Phase</span>
          </div>
          <p style="margin:0; font-size:0.88rem; color:var(--color-text-muted);">
            During 2025, the association was in its formal court registration phase. Prior to official tax-exempt charity recognition, <strong>zero donation funds were routed through the institutional bank account</strong> (0 € institutional turnover). 100% of construction and site expenditures in Mamoru were funded directly and privately by the founders.
          </p>
        </div>

        <div style="overflow-x:auto; margin:1.5rem 0;">
          <table style="width:100%; border-collapse:collapse; background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-md);">
            <thead>
              <tr style="background:var(--color-surface-muted); text-align:left; border-bottom:1px solid var(--color-border);">
                <th style="padding:0.75rem 1rem;">Year</th>
                <th style="padding:0.75rem 1rem;">Donations Received</th>
                <th style="padding:0.75rem 1rem;">Invested in Projects</th>
                <th style="padding:0.75rem 1rem;">Admin Overhead</th>
                <th style="padding:0.75rem 1rem;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${transparency.annualFinancialOverview.map(row => `
                <tr style="border-bottom:1px solid var(--color-border);">
                  <td style="padding:0.75rem 1rem; font-weight:700;">${row.year}</td>
                  <td style="padding:0.75rem 1rem;">${row.totalDonations === 0 ? '0 €' : row.totalDonations.toLocaleString('en-US') + ' €'}</td>
                  <td style="padding:0.75rem 1rem; color:#15803d; font-weight:600;">${row.projectDisbursements === 0 ? '0 €' : row.projectDisbursements.toLocaleString('en-US') + ' €'}</td>
                  <td style="padding:0.75rem 1rem;">0 € (100% honorary)</td>
                  <td style="padding:0.75rem 1rem; font-size:0.85rem; color:var(--color-text-muted);">${row.sourceNote.en}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <h2 style="margin-top:3.5rem;">Strategic Vision & Technology</h2>
        <p class="lead" style="max-width:720px;">
          Education as a catalyst for local economic vitality: Fostering sustainable school infrastructure and digital leapfrogging.
        </p>
        ${renderStrategicVision('en')}

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

        <h2 style="margin-top:2.5rem;">Board of Directors & Initiators</h2>
        <div style="display:grid; gap:1.5rem; margin:1.5rem 0;">
          ${org.board.map(b => `
            <div style="background:var(--color-surface); padding:1.75rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.25rem;">
                <h3 style="margin-bottom:0; font-size:1.3rem;">${b.name}</h3>
                <span style="color:var(--color-terracotta); font-weight:700; font-size:0.88rem;">${b.role.en}</span>
              </div>
              <p style="color:var(--color-text-muted); font-weight:600; font-size:0.9rem; margin-bottom:0.75rem;">${b.profession.en}</p>
              <p style="font-size:0.92rem; color:var(--color-text-main); line-height:1.6; margin-bottom:0;">${b.bio.en}</p>
            </div>
          `).join('')}

          ${org.coFounders.map(c => `
            <div style="background:var(--color-surface); padding:1.75rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.25rem;">
                <h3 style="margin-bottom:0; font-size:1.3rem;">${c.name}</h3>
                <span style="color:var(--color-terracotta); font-weight:700; font-size:0.88rem;">${c.role.en}</span>
              </div>
              <p style="color:var(--color-text-muted); font-weight:600; font-size:0.9rem; margin-bottom:0.25rem;">${c.profession.en}</p>
              <p style="color:var(--color-text-muted); font-size:0.85rem; margin-bottom:0.75rem;"><em>📍 ${c.origin.en}</em></p>
              <p style="font-size:0.92rem; color:var(--color-text-main); line-height:1.6; margin-bottom:0;">${c.bio.en}</p>
            </div>
          `).join('')}
        </div>

        <div style="background:var(--color-surface-muted); padding:1.25rem 1.5rem; border-radius:var(--radius-md); border:1px solid var(--color-border); margin:2rem 0;">
          <strong>Founding Circle:</strong> ${org.foundingCircle.en}
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
        
        <h2>Our Educational Approach: Widening Horizons Through Contrast</h2>
        <p>${travel.philosophy.en}</p>

        <!-- Upcoming Trip Application Box (Strictly Open Call without 2026/27 alliance/dates) -->
        <div style="background:linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%); border:2px solid #fde68a; border-radius:var(--radius-lg); padding:2rem; margin:2.5rem 0; box-shadow:var(--shadow-sm);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
            <h3 style="margin:0; color:#78350f;">${travel.upcomingTrip.title.en}</h3>
            <span style="font-size:0.8rem; background:#92400e; color:#ffffff; padding:0.25rem 0.65rem; border-radius:var(--radius-full); font-weight:700;">
              ${travel.upcomingTrip.status.en}
            </span>
          </div>
          <p style="color:#78350f; line-height:1.6; margin-bottom:1.25rem;">
            ${travel.upcomingTrip.desc.en}
          </p>
          <div style="display:flex; gap:1rem; flex-wrap:wrap; align-items:center;">
            <a href="mailto:${travel.contactPerson.email}?subject=Application%20Educational%20Trip%20Sierra%20Leone" class="btn btn-primary btn-sm">
              ${travel.upcomingTrip.ctaText.en}
            </a>
            <button type="button" class="btn btn-secondary btn-sm copy-btn" data-copy="${travel.contactPerson.email}">
              Copy Email
            </button>
          </div>
        </div>

        <!-- Information Presentation Deck Link -->
        <div style="background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-md); padding:1.25rem 1.5rem; margin:2rem 0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
          <div>
            <h4 style="margin-bottom:0.25rem;">📊 ${travel.presentationDeck.title.en}</h4>
            <p style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:0;">Comprehensive presentation on travel preparation, route, cost breakdown and guidelines.</p>
          </div>
          <a href="${travel.presentationDeck.url}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">Open Presentation Deck ↗</a>
        </div>

        <!-- Video Documentary Section (7 Videos) -->
        <div style="margin:3rem 0;">
          <h2>Video Documentary of Our Journeys</h2>
          <p class="lead" style="margin-bottom:1rem;">
            Experience genuine impressions from our field journeys: from school construction and brick-making to classroom visits and village life.
          </p>
          ${renderVideoGallery('en')}
        </div>

        <!-- 3 Expeditions Overview -->
        <h2 style="margin-top:3.5rem;">Past Educational Expeditions</h2>
        <p class="lead">Three journeys that forged enduring bonds of mutual trust:</p>
        
        <div class="trips-grid">
          ${travel.trips.map(trip => `
            <div class="trip-card">
              <img src="${trip.image}" alt="${trip.title.en}" class="trip-card-img">
              <div class="trip-card-body">
                <span class="trip-card-badge">${trip.year} • ${trip.location}</span>
                <h3 class="trip-card-title">${trip.title.en}</h3>
                <div style="font-size:0.82rem; font-weight:700; color:var(--color-terracotta); margin-bottom:0.5rem;">
                  👥 ${trip.participants.en}
                </div>
                <p class="trip-card-desc">${trip.desc.en}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Activities Section -->
        <h2 style="margin-top:3.5rem;">Field Activities & Village Routines</h2>
        <p class="lead">Our travel itinerary is planned in close collaboration with Yoni Sesay and the village communities:</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:1.25rem; margin:1.5rem 0;">
          ${travel.activities.map(act => `
            <div style="background:var(--color-surface); padding:1.5rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
              <h3 style="font-size:1.1rem; color:var(--color-terracotta); margin-bottom:0.5rem;">${act.title.en}</h3>
              <p style="font-size:0.9rem; color:var(--color-text-muted); line-height:1.55; margin-bottom:0;">${act.desc.en}</p>
            </div>
          `).join('')}
        </div>

        <!-- Safety, Health & Supervision -->
        <div style="background:var(--color-surface); padding:2rem; border:2px solid var(--color-border); border-radius:var(--radius-lg); margin:3rem 0;">
          <h2 style="margin-top:0;">Safety, Health & Field Protocols</h2>
          <p class="lead" style="margin-bottom:1.5rem;">
            Prioritizing participant well-being through trusted local networks, official permits, and established medical channels:
          </p>

          <div style="display:grid; gap:1rem;">
            <div style="background:var(--color-surface-muted); padding:1rem 1.25rem; border-radius:var(--radius-md);">
              <strong>👑 Paramount Chief & Police Registration:</strong>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0; margin-top:0.25rem;">${travel.safetyAndHealth.approvals.en}</p>
            </div>
            <div style="background:var(--color-surface-muted); padding:1rem 1.25rem; border-radius:var(--radius-md);">
              <strong>🚌 Private Chartered Coach:</strong>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0; margin-top:0.25rem;">${travel.safetyAndHealth.transport.en}</p>
            </div>
            <div style="background:var(--color-surface-muted); padding:1rem 1.25rem; border-radius:var(--radius-md);">
              <strong>🏨 Vetted Lodging & Mosquito Netting:</strong>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0; margin-top:0.25rem;">${travel.safetyAndHealth.accommodations.en}</p>
            </div>
            <div style="background:var(--color-surface-muted); padding:1rem 1.25rem; border-radius:var(--radius-md);">
              <strong>🏥 Medical Proximity & First-Aid Trauma Kit:</strong>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0; margin-top:0.25rem;">${travel.safetyAndHealth.medicalProximity.en}</p>
            </div>
            <div style="background:var(--color-surface-muted); padding:1rem 1.25rem; border-radius:var(--radius-md);">
              <strong>🧑‍🏫 Chaperone Supervision Ratio:</strong>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0; margin-top:0.25rem;">${travel.safetyAndHealth.supervisionRatio.en}</p>
            </div>
            <div style="background:var(--color-surface-muted); padding:1rem 1.25rem; border-radius:var(--radius-md);">
              <strong>💉 Immunizations & Medical Consultation:</strong>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0; margin-top:0.25rem;">${travel.safetyAndHealth.vaccinations.en}</p>
            </div>
          </div>
        </div>

        <!-- Travel Funding & Zero-Donation Guarantee -->
        <div style="background:var(--color-surface); padding:2rem; border:1px solid var(--color-border); border-radius:var(--radius-lg); margin:3rem 0;">
          <h2 style="margin-top:0;">Travel Costs & 100% Self-Funded Guarantee</h2>
          <p style="font-size:0.95rem; color:var(--color-text-main); margin-bottom:1rem;">
            <strong>Estimated Total Cost:</strong> ${travel.travelFunding.totalCost.en}
          </p>
          <ul style="color:var(--color-text-muted); font-size:0.9rem; margin-left:1.25rem; margin-bottom:1.5rem; line-height:1.6;">
            <li><strong>International Flights:</strong> ${travel.travelFunding.flightCost.en}</li>
            <li><strong>On-the-ground Expenses:</strong> ${travel.travelFunding.localCosts.en}</li>
            <li><strong>Local Guides & Logistics:</strong> ${travel.travelFunding.localSupport.en}</li>
            <li><strong>Travel Insurance:</strong> ${travel.travelFunding.insurance.en}</li>
          </ul>
          <div style="background:linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border:1px solid #86efac; border-radius:var(--radius-md); padding:1.25rem;">
            <strong style="color:#166534;">🛡️ Zero Donations Used for Travel:</strong>
            <p style="font-size:0.9rem; color:#166534; margin-bottom:0; margin-top:0.25rem;">
              ${travel.travelFunding.zeroDonationGuarantee.en}
            </p>
          </div>
        </div>

        <!-- Packing List Section -->
        <h2 style="margin-top:3.5rem;">Packing Checklist for Sierra Leone</h2>
        <p class="lead">Field-tested gear, health essentials and clothing list for rural Sierra Leone:</p>
        ${renderPackingList('en')}

        <!-- Contact Box for Philipp Herzberg -->
        <div style="background:linear-gradient(135deg, #fcf9f5 0%, #f7f0e6 100%); border:2px solid var(--color-terracotta); border-radius:var(--radius-lg); padding:2.25rem; text-align:center; margin:3rem 0;">
          <h3 style="margin-bottom:0.5rem; color:var(--color-slate-dark);">Interested in Joining an Educational Journey?</h3>
          <p style="max-width:580px; margin:0 auto 1.25rem; color:var(--color-text-muted); font-size:0.95rem;">
            ${travel.contactPerson.note.en}
          </p>
          <div style="display:inline-flex; align-items:center; gap:0.75rem; background:#ffffff; padding:0.75rem 1.25rem; border-radius:var(--radius-md); border:1px solid var(--color-border); flex-wrap:wrap; justify-content:center;">
            <span><strong>${travel.contactPerson.name}</strong> (${travel.contactPerson.role.en}):</span>
            <code style="font-size:1.05rem; font-weight:700;">${travel.contactPerson.email}</code>
            <button type="button" class="copy-btn" data-copy="${travel.contactPerson.email}">
              Copy Email
            </button>
          </div>
        </div>

        <!-- Instagram Field Showcase across Visited Locations -->
        ${renderInstagramLocationShowcase('en')}

        <div style="text-align:center; margin:2.5rem 0; padding:2rem; background:var(--color-surface-muted); border-radius:var(--radius-md); border:1px solid var(--color-border);">
          <h3>In-Depth Educational Travel Report 2026</h3>
          <p style="color:var(--color-text-muted); font-size:0.95rem; margin-bottom:1.25rem;">Read Philipp Herzberg’s full 10-chapter pedagogical field account, reflecting on community immersion, school development, and intercultural learning in Sierra Leone.</p>
          <a href="/en/travel/report/" class="btn btn-primary">Read Full 2026 Travel Report →</a>
        </div>

        <h2 style="margin-top:3.5rem;">Frequently Asked Questions (FAQ)</h2>
        <p class="lead" style="margin-bottom:1.5rem;">
          Important information on mandatory immunizations, visas, malaria prophylaxis, connectivity, and field safety:
        </p>
        ${renderCategorizedFaq('en')}
        <div style="text-align:center; margin-top:2.5rem;">
          <a href="/en/faq/" class="btn btn-secondary btn-sm">View Standalone FAQ Page →</a>
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

  // 12.8.0 TRAVEL REPORT (EN)
  writeRoute('/en/travel/report', renderHtmlPage({
    lang: 'en',
    title: 'In-Depth Educational Travel Report 2026: Encounters & Educational Milestones',
    description: 'Comprehensive pedagogical and field report on the 2026 educational expedition across Sierra Leone by Philipp Herzberg.',
    canonicalPath: '/en/travel/report/',
    content: renderTravelReportPage('en')
  }));

  // 12.8.1 FAQ (EN)
  writeRoute('/en/faq', renderHtmlPage({
    lang: 'en',
    title: 'Frequently Asked Questions (FAQ)',
    description: 'Comprehensive answers on vaccinations, visas, malaria prevention, safety, SIM cards and daily routine in Sierra Leone.',
    canonicalPath: '/en/faq/',
    content: renderFaqStandalonePage('en')
  }));

  // 12.8.2 SIERRA LEONE (EN)
  writeRoute('/en/sierra-leone', renderHtmlPage({
    lang: 'en',
    title: 'Spotlight on Sierra Leone: Governance, Facts & Travel Advice',
    description: 'Objective overview of Sierra Leone: Ibrahim Index of African Governance (IIAG), educational momentum, rural livelihoods and safety.',
    canonicalPath: '/en/sierra-leone/',
    content: renderSierraLeonePage('en')
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
              <h4>Can I donate via credit card or international platforms?</h4>
              <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:0;">To guarantee that 100% of donations reach schools without 2–3% transaction fee deductions, we prioritize direct bank transfers (SEPA / IBAN). For international supporters who prefer card payments or Apple Pay, we also maintain a verified GoFundMe campaign: <a href="https://www.gofundme.com/f/wir-bauen-schulen-in-sierra-leone-mach-mit" target="_blank" rel="noopener noreferrer" style="color:var(--color-primary-dark); font-weight:600; text-decoration:underline;">GoFundMe: Building Schools in Sierra Leone</a> (note that GoFundMe retains payment processing fees and cannot issue German tax receipts).</p>
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

# Archived Project Redirects (Graceful fallback)
/projekte/madina          /projekte/ 302
/projekte/madina/         /projekte/ 302
/projekte/madina/*        /projekte/ 302
/en/projects/madina       /en/projects/ 302
/en/projects/madina/      /en/projects/ 302
/en/projects/madina/*     /en/projects/ 302

# Clean URLs & Trailing Slashes
/projekte/kappr-yoni/     /projekte/mafabaneh/ 301
/projekte/kappr-yoni      /projekte/mafabaneh/ 301
/fuer-unternehmen         /fuer-unternehmen/ 301
/transparenz              /transparenz/ 301
/ueber-uns                /ueber-uns/ 301
/bildungsreisen           /bildungsreisen/ 301
/sierra-leone             /sierra-leone/ 301
/faq                      /faq/ 301
/spenden                  /spenden/ 301
/impressum                /impressum/ 301
/datenschutz              /datenschutz/ 301
/widerruf                 /widerruf/ 301
/en/sierra-leone          /en/sierra-leone/ 301
/en/faq                   /en/faq/ 301
/en/travel/report         /en/travel/report/ 301
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
    '/sierra-leone/',
    '/faq/',
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
    '/en/travel/report/',
    '/en/sierra-leone/',
    '/en/faq/',
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
