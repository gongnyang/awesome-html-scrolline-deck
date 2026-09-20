/**
 * serve.mjs — a dependency-free static server for one built deck.
 *
 * Each deck's data/deck.json refers to assets with absolute paths (/frames/...),
 * so every deck must be served from its own origin root rather than a subpath.
 *
 *   node tools/demo/serve.mjs <dist-dir> <port>
 */
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

export function serveDir(root, port) {
  const base = resolve(root);
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      let path = join(base, normalize(decodeURIComponent(url.pathname)));
      if (!path.startsWith(base)) { res.writeHead(403).end('forbidden'); return; }
      let info = await stat(path).catch(() => null);
      if (info?.isDirectory()) { path = join(path, 'index.html'); info = await stat(path).catch(() => null); }
      if (!info) { res.writeHead(404).end('not found'); return; }
      res.writeHead(200, {
        'content-type': TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream',
        'content-length': info.size,
        'cache-control': 'no-store',
      });
      createReadStream(path).pipe(res);
    } catch (err) {
      res.writeHead(500).end(String(err));
    }
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [dir, port] = process.argv.slice(2);
  await serveDir(dir, Number(port) || 5199);
  console.log(`serving ${resolve(dir)} on http://127.0.0.1:${port || 5199}`);
}
