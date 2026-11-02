/* ============================================================
   دار الأُمراء — DAR AL-UMARA  |  scripts/serve.js
   خادم ملفات ثابت بسيط للمعاينة المحلية (بدون أي اعتماديات).
   التشغيل:  node scripts/serve.js 8080
   ============================================================ */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = parseInt(process.argv[2], 10) || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8'
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  let file = path.normalize(path.join(ROOT, urlPath));
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    const nf = path.join(ROOT, '404.html');
    if (fs.existsSync(nf)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(nf));
    } else { res.writeHead(404); res.end('Not Found'); }
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log('دار الأُمراء تعمل على: http://localhost:' + PORT);
});
