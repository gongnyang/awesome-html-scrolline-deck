import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VIDEO_DIR = path.join(ROOT, 'videos');
const TYPES = { '.mp4': 'video/mp4', '.vtt': 'text/vtt; charset=utf-8', '.jpg': 'image/jpeg' };
const slugs = ['01-promo-shorts', '02-real-case-cheonggyecheon', '03-education-scene-design'];
const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  const player = url.pathname.match(/^\/player\/([\w-]+)$/);
  if (player) {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(`<!doctype html><html lang="ko"><meta charset="utf-8"><video controls muted playsinline preload="auto"><source src="/${player[1]}.mp4" type="video/mp4"><track kind="captions" srclang="ko" src="/${player[1]}.vtt" default></video>`);
    return;
  }
  const file = path.resolve(VIDEO_DIR, `.${decodeURIComponent(url.pathname)}`);
  if (!file.startsWith(`${VIDEO_DIR}${path.sep}`) || !fs.existsSync(file)) {
    response.writeHead(404).end();
    return;
  }
  const stat = fs.statSync(file);
  const range = request.headers.range;
  if (range && file.endsWith('.mp4')) {
    const [, startText, endText] = range.match(/bytes=(\d+)-(\d*)/) || [];
    const start = Number(startText || 0), end = Math.min(Number(endText || stat.size - 1), stat.size - 1);
    response.writeHead(206, { 'Content-Type': TYPES[path.extname(file)], 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(file, { start, end }).pipe(response);
    return;
  }
  response.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Content-Length': stat.size, 'Accept-Ranges': 'bytes' });
  fs.createReadStream(file).pipe(response);
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const failures = [];
  page.on('console', (message) => { if (message.type() === 'error') failures.push(message.text()); });
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('requestfailed', (request) => failures.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', (response) => { if (!response.ok()) failures.push(`${response.status()} ${response.url()}`); });
  const results = [];
  for (const slug of slugs) {
    await page.goto(`http://127.0.0.1:${port}/player/${slug}`);
    const video = page.locator('video');
    await video.waitFor({ state: 'attached' });
    try { await video.evaluate((element) => new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`metadata timeout currentSrc=${element.currentSrc} networkState=${element.networkState} readyState=${element.readyState} error=${element.error?.code}`)), 15000);
      if (element.readyState >= 1) { clearTimeout(timer); resolve(); return; }
      element.addEventListener('loadedmetadata', () => { clearTimeout(timer); resolve(); }, { once: true });
      element.addEventListener('error', () => { clearTimeout(timer); reject(new Error(`media error ${element.error?.code}`)); }, { once: true });
    })); } catch (error) { throw new Error(`${slug}: ${error.message}; ${failures.join('; ')}`); }
    const before = await video.evaluate((element) => ({ duration: element.duration, width: element.videoWidth, height: element.videoHeight }));
    await video.evaluate((element) => element.play());
    await page.waitForTimeout(1500);
    const after = await video.evaluate((element) => ({ currentTime: element.currentTime, paused: element.paused }));
    if (after.currentTime <= .2 || after.paused) throw new Error(`${slug}: playback did not advance`);
    results.push({ slug, ...before, playbackAdvancedSeconds: Number(after.currentTime.toFixed(2)) });
  }
  if (failures.length) throw new Error(`Browser errors: ${failures.join('; ')}`);
  console.log(JSON.stringify({ status: 'passed', results, browserErrors: failures }, null, 2));
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
