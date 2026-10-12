const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 3000;
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

// Trigger build once on start
console.log('Building site before starting dev server...');
execSync('node scripts/build.js', { stdio: 'inherit' });

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath.endsWith('/')) {
    reqPath += 'index.html';
  } else if (!path.extname(reqPath)) {
    // Check if folder exists
    const checkDir = path.join(DIST_DIR, reqPath);
    if (fs.existsSync(checkDir) && fs.statSync(checkDir).isDirectory()) {
      res.writeHead(301, { Location: reqPath + '/' });
      res.end();
      return;
    }
    reqPath += '/index.html';
  }

  const filePath = path.join(DIST_DIR, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // 404 fallback
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>404 Not Found</h1><p>The path <code>${reqPath}</code> does not exist.</p><p><a href="/">Return to Homepage</a></p>`);
  }
});

server.listen(PORT, () => {
  console.log(`\n🎉 Development server running at: http://localhost:${PORT}`);
  console.log(`   Press Ctrl+C to stop.`);
});
