// Server statis kecil tanpa dependensi, dengan URL bersih (tanpa .html).
// Jalankan: npm start  →  http://localhost:3000
//   /            → index.html
//   /dashboard   → dashboard/index.html (dialihkan ke /dashboard/ agar path relatif aman)
//   /x.html      → dialihkan ke /x

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
};

const isFile = (f) => fs.existsSync(f) && fs.statSync(f).isFile();

http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const p = decodeURIComponent(pathname);

  // Alihkan URL lama .html ke URL bersih
  if (p.endsWith('/index.html')) return redirect(res, p.slice(0, -'index.html'.length));
  if (p.endsWith('.html') && p !== '/') return redirect(res, p.slice(0, -'.html'.length));

  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) return send(res, 403, 'Forbidden');

  // Folder tanpa slash di akhir → alihkan ke versi dengan slash
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!p.endsWith('/')) return redirect(res, p + '/');
    const idx = path.join(file, 'index.html');
    return isFile(idx) ? serve(res, idx) : send(res, 404, 'Not found');
  }

  const hit = [file, file + '.html'].find(isFile); // fallback: /dashboard → dashboard.html
  return hit ? serve(res, hit) : send(res, 404, 'Not found');
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));

function redirect(res, location) {
  res.writeHead(301, { Location: location || '/' });
  res.end();
}
function send(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(body);
}
function serve(res, file) {
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}
