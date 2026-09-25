/** Check all eight production-shaped deck URLs and every image in a browser. */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPlaywright, launchChromium, openPage } from '../lib/browser.mjs';
import assetGate from '../gates/g11.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const site = path.join(root, 'site');
const prefix = '/awesome-html-scrolline-deck/';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };

async function localSite() {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith(prefix)) { res.writeHead(404); res.end(); return; }
    const relative = pathname.slice(prefix.length);
    const file = path.resolve(site, relative, pathname.endsWith('/') ? 'index.html' : '');
    if (!file.startsWith(site + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end(); return;
    }
    res.setHeader('content-type', mime[path.extname(file)] ?? 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { base: `http://127.0.0.1:${server.address().port}${prefix}`, close: (callback) => server.close(callback) };
}

const remote = process.argv[2];
const local = remote ? null : await localSite();
const base = remote ? `${remote.replace(/\/?$/, '/')}` : local.base;
const found = await loadPlaywright();
if (!found) throw new Error('Playwright is required for site smoke testing');
const browser = await launchChromium(found.pw);
try {
  const names = fs.readdirSync(path.join(root, 'examples')).filter((name) =>
    fs.existsSync(path.join(root, 'examples', name, 'data', 'deck.json'))).sort();
  if (names.length !== 8) throw new Error(`Expected eight decks, found ${names.length}`);
  const gallery = await openPage(browser);
  try {
    const response = await gallery.page.goto(base, { waitUntil: 'networkidle', timeout: 60_000 });
    const cards = await gallery.page.locator('section.deck').count();
    const videos = await gallery.page.locator('video').count();
    if (!response?.ok() || cards !== 8 || videos !== 3 || gallery.errors.length) {
      throw new Error(`Gallery failed: HTTP ${response?.status()}, ${cards} cards, ${videos} videos, ${gallery.errors.join(' | ')}`);
    }
    for (const slug of ['01-promo-shorts', '02-real-case-cheonggyecheon', '03-education-scene-design']) {
      for (const ext of ['mp4', 'jpg', 'srt']) {
        const mediaResponse = await gallery.page.request.get(`${base}videos/${slug}.${ext}`);
        if (!mediaResponse.ok()) throw new Error(`Video asset failed: ${mediaResponse.status()} videos/${slug}.${ext}`);
      }
    }
    console.log(`PASS ${base} (8 deck cards, 3 playable video sources)`);
  } finally {
    await gallery.context.close();
  }
  for (const name of names) {
    const dir = path.join(root, 'examples', name);
    const deck = JSON.parse(fs.readFileSync(path.join(dir, 'data', 'deck.json'), 'utf8'));
    const baseURL = `${base}${name}/`;
    const { page, context, errors } = await openPage(browser);
    page.on('response', (response) => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    try {
      const response = await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 60_000 });
      if (!response?.ok()) errors.push(`deck returned ${response?.status()}: ${baseURL}`);
      const sceneCount = await page.locator('section.scene').count();
      if (sceneCount !== deck.scenes.length) errors.push(`rendered ${sceneCount}/${deck.scenes.length} scenes`);
      const unmountedMedia = await page.evaluate((scenes) => scenes.filter((scene) => {
        const assets = scene.assets ?? {};
        if (!(assets.poster || assets.frames || assets.video || assets.images?.length)) return false;
        return !document.querySelector(`[data-scene="${scene.id}"] img, [data-scene="${scene.id}"] canvas, [data-scene="${scene.id}"] video`);
      }).map((scene) => scene.id), deck.scenes);
      if (unmountedMedia.length) errors.push(`media not mounted: ${unmountedMedia.join(', ')}`);
      const assetResult = await assetGate.run({ dir, deck, baseURL, browser });
      if (!assetResult.ok) errors.push(...assetResult.items);
      if (errors.length) throw new Error(`${name}: ${errors.slice(0, 12).join(' | ')}`);
      console.log(`PASS ${baseURL} (${sceneCount} scenes, ${assetResult.details})`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
  if (local) await new Promise((resolve) => local.close(resolve));
}
