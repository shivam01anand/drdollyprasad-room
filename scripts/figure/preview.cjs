// Local-only review. Serve only the cleaned scan and the installed viewer modules.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const files = new Map([
  ['/', [path.join(__dirname, 'preview.html'), 'text/html; charset=utf-8']],
  ['/dolly.splat', [path.join(root, 'public/art/figure/dolly-124.splat'), 'application/octet-stream']],
  ['/vendor/three.module.js', [path.join(root, 'node_modules/three/build/three.module.js'), 'text/javascript']],
  ['/vendor/gaussian-splats-3d.module.js', [path.join(root, 'node_modules/@mkkellogg/gaussian-splats-3d/build/gaussian-splats-3d.module.js'), 'text/javascript']],
]);
if (process.argv[2]) files.set('/dolly.ply', [path.resolve(process.argv[2]), 'application/octet-stream']);
http.createServer((request, response) => {
  const file = files.get(new URL(request.url, 'http://localhost').pathname);
  if (!file || !fs.existsSync(file[0])) { response.writeHead(404); response.end('Not found'); return; }
  response.writeHead(200, { 'Content-Type': file[1], 'Content-Length': fs.statSync(file[0]).size, 'Cache-Control': 'no-store' });
  fs.createReadStream(file[0]).pipe(response);
}).listen(3842, '127.0.0.1', () => console.log('Clean scan preview: http://127.0.0.1:3842'));
