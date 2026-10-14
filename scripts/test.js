const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const ROOT_DIR = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}`);
  }
}

console.log('🧪 Starting Quality Assurance Test Suite for Bildung mit Herz...\n');

// 1. Run Build
console.log('Test Group 1: Production Build Execution');
try {
  execSync('node scripts/build.js', { stdio: 'pipe' });
  assert(fs.existsSync(DIST_DIR), 'dist directory was generated');
  assert(fs.existsSync(path.join(DIST_DIR, 'index.html')), 'dist/index.html exists');
  assert(fs.existsSync(path.join(DIST_DIR, 'sitemap.xml')), 'dist/sitemap.xml exists');
  assert(fs.existsSync(path.join(DIST_DIR, 'robots.txt')), 'dist/robots.txt exists');
  assert(fs.existsSync(path.join(DIST_DIR, '_redirects')), 'dist/_redirects exists');
} catch (e) {
  assert(false, `Build failed: ${e.message}`);
}

// 2. Discover all HTML files
function getAllHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllHtmlFiles(full));
    } else if (file.endsWith('.html')) {
      results.push(full);
    }
  });
  return results;
}

const htmlFiles = getAllHtmlFiles(DIST_DIR);
console.log(`\nTest Group 2: HTML Semantic & SEO Checks (${htmlFiles.length} pages found)`);
assert(htmlFiles.length >= 20, `Generated comprehensive page set (found ${htmlFiles.length} pages)`);

let allInternalLinks = [];
let allImageSrcs = [];
let allDocLinks = [];

htmlFiles.forEach(file => {
  const relPath = path.relative(DIST_DIR, file);
  const content = fs.readFileSync(file, 'utf8');

  assert(content.includes('<!DOCTYPE html>'), `[${relPath}] Has HTML5 Doctype`);
  assert(content.includes('<meta name="viewport"'), `[${relPath}] Has responsive viewport tag`);
  assert(content.includes('<title>'), `[${relPath}] Has document title`);
  assert(content.includes('<link rel="canonical"'), `[${relPath}] Has canonical URL`);
  assert(content.includes('application/ld+json'), `[${relPath}] Has JSON-LD structured data`);

  // Extract internal links
  const hrefMatches = content.match(/href="([^"#:]+)"/g) || [];
  hrefMatches.forEach(m => {
    const url = m.replace('href="', '').replace('"', '');
    if (url.startsWith('/')) {
      allInternalLinks.push({ from: relPath, to: url });
    }
  });

  // Extract images
  const imgMatches = content.match(/<img[^>]+>/g) || [];
  imgMatches.forEach(img => {
    const srcM = img.match(/src="([^"]+)"/);
    const altM = img.match(/alt="([^"]*)"/);
    if (srcM) {
      allImageSrcs.push({ from: relPath, src: srcM[1], hasAlt: !!altM });
    }
  });

  // Extract JSON-LD and validate
  const jsonLdMatch = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (jsonLdMatch) {
    try {
      const parsed = JSON.parse(jsonLdMatch[1]);
      assert(parsed['@context'] === 'https://schema.org', `[${relPath}] JSON-LD has valid schema.org context`);
      assert(parsed['@type'] === 'NGO', `[${relPath}] JSON-LD declares NGO entity`);
    } catch (err) {
      assert(false, `[${relPath}] JSON-LD parsing error: ${err.message}`);
    }
  }
});

// 3. Link Integrity
console.log(`\nTest Group 3: Link Integrity & Asset Existence`);
allInternalLinks.forEach(({ from, to }) => {
  let target = to.split('#')[0].split('?')[0];
  if (target.endsWith('/')) target += 'index.html';
  else if (!path.extname(target)) target += '/index.html';

  const fullTarget = path.join(DIST_DIR, target);
  assert(fs.existsSync(fullTarget), `Link from [${from}] to [${to}] resolves to disk (${target})`);
});

// 4. Image Assets & Accessibility
console.log(`\nTest Group 4: Image Existence & WCAG Alt Text`);
allImageSrcs.forEach(({ from, src, hasAlt }) => {
  if (src.startsWith('http://') || src.startsWith('https://')) {
    assert(src.startsWith('https://'), `External image [${src}] on [${from}] uses secure HTTPS`);
  } else {
    const target = path.join(DIST_DIR, src.split('?')[0]);
    assert(fs.existsSync(target), `Image [${src}] on [${from}] exists`);
  }
  assert(hasAlt, `Image [${src}] on [${from}] has alt attribute`);
});

// 5. Financial Data Consistency
console.log(`\nTest Group 5: Financial Data Consistency & Traceability`);
const projects = [
  JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'content', 'projects', 'mafabaneh.json'), 'utf8')),
  JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'content', 'projects', 'mamoru.json'), 'utf8'))
];

projects.forEach(p => {
  const fin = p.finances;
  assert(fin.totalEstimatedBudget.amount > 0, `[${p.id}] Total estimated budget is positive`);
  assert(fin.securedFunding.amount >= 0, `[${p.id}] Secured funding is non-negative`);
  assert(fin.outstandingNeed.amount >= 0, `[${p.id}] Outstanding need is non-negative`);
  assert(!!fin.totalEstimatedBudget.sourceNote, `[${p.id}] Budget has source traceability note`);
  assert(!!fin.securedFunding.sourceNote, `[${p.id}] Secured funding has source traceability note`);
});

// 6. Organization & Banking Data Check
console.log(`\nTest Group 6: Organization, Legal & Bank Verification`);
const org = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'content', 'organization.json'), 'utf8'));
assert(org.banking.iban === 'DE55100500000191572900', 'IBAN DE55100500000191572900 matches verified bank record');
assert(org.banking.accountHolder === 'Make Them Smile e.V.', 'Bank account holder is Make Them Smile e.V.');
assert(org.registration.number === 'VR 41272 B', 'Register court number matches VR 41272 B');
assert(fs.existsSync(path.join(DIST_DIR, 'assets', 'documents', 'WelfareAlert.pdf')), 'WelfareAlert.pdf is present in dist');
assert(fs.existsSync(path.join(DIST_DIR, 'assets', 'documents', 'KapprYoniGlobalLearningHub.pdf')), 'KapprYoniGlobalLearningHub.pdf is present in dist');

console.log(`\n========================================`);
console.log(`Test Results: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log(`========================================`);

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 All automated tests passed successfully!');
  process.exit(0);
}
