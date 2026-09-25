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
  '.png': 'image/png', '.mp4': 'video/mp4', '.vtt': 'text/vtt', '.srt': 'text/plain', '.woff2': 'font/woff2' };

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
    const cards = await gallery.page.locator('.deck-spread').count();
    const videos = await gallery.page.locator('video').count();
    const templates = await gallery.page.locator('.template-card').count();
    if (!response?.ok() || cards !== 8 || videos !== 3 || gallery.errors.length) {
      throw new Error(`Gallery failed: HTTP ${response?.status()}, ${cards} decks, ${templates} templates, ${videos} videos, ${gallery.errors.join(' | ')}`);
    }
    const brokenPreviews = await gallery.page.evaluate(async () => {
      const urls = [...document.querySelectorAll('.template-card img')].map((img) => img.getAttribute('src'));
      return (await Promise.all(urls.map(async (url) => {
        const img = new Image(); img.src = url;
        try { await img.decode(); return null; } catch { return url; }
      }))).filter(Boolean);
    });
    if (brokenPreviews.length) throw new Error(`Template previews failed to decode: ${brokenPreviews.join(', ')}`);
    await gallery.page.setViewportSize({ width: 390, height: 844 });
    const mobileLayout = await gallery.page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    if (mobileLayout.document > mobileLayout.viewport || mobileLayout.body > mobileLayout.viewport) {
      throw new Error(`Gallery overflows at 390px: ${JSON.stringify(mobileLayout)}`);
    }
    await gallery.page.setViewportSize({ width: 1440, height: 900 });
    for (const slug of ['01-promo-shorts', '02-real-case-cheonggyecheon', '03-education-scene-design']) {
      for (const ext of ['mp4', 'jpg', 'srt', 'vtt']) {
        const mediaResponse = await gallery.page.request.get(`${base}videos/${slug}.${ext}`);
        if (!mediaResponse.ok()) throw new Error(`Video asset failed: ${mediaResponse.status()} videos/${slug}.${ext}`);
      }
    }
    console.log(`PASS ${base} (8 decks, ${templates} template previews, 3 playable video sources, mobile ${mobileLayout.viewport}px)`);
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
        if (!(assets.poster || assets.frames || assets.video || assets.images?.length || assets.photos?.length)) return false;
        return !document.querySelector(`[data-scene="${scene.id}"] img, [data-scene="${scene.id}"] canvas, [data-scene="${scene.id}"] video`);
      }).map((scene) => scene.id), deck.scenes);
      if (unmountedMedia.length) errors.push(`media not mounted: ${unmountedMedia.join(', ')}`);
      const assetResult = await assetGate.run({ dir, deck, baseURL, browser });
      if (!assetResult.ok) errors.push(...assetResult.items);
      if (name === 'sample-deck') {
        const targetId = '07-templates';
        const targetIndex = [...deck.scenes].sort((a, b) => a.order - b.order)
          .findIndex((scene) => scene.id === targetId);
        if (targetIndex < 0) errors.push(`deep-link target missing: ${targetId}`);
        else {
          await page.goto(`${baseURL}?scene=${targetId}`, { waitUntil: 'networkidle', timeout: 60_000 });
          const expected = `${String(targetIndex + 1).padStart(2, '0')} /`;
          try {
            await page.waitForFunction((label) =>
              document.querySelector('#hud')?.textContent?.trim().startsWith(label), expected, { timeout: 12_000 });
          } catch {
            const actual = await page.locator('#hud').textContent().catch(() => 'missing');
            const scrollY = await page.evaluate(() => window.scrollY);
            errors.push(`deep-link ${targetId} did not land on presenter hold (expected HUD ${expected}, actual ${String(actual).trim()}, scrollY ${Math.round(scrollY)})`);
          }
        }
      }
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
