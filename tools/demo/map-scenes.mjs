/**
 * map-scenes.mjs — report每 deck's scroll geometry so the shot list can be written
 * in scene-relative terms (scene 3 at 55% of its pin) instead of raw pixels.
 *
 *   node tools/demo/map-scenes.mjs
 */
import pw from '/home/seunghyeong/.npm-global/lib/node_modules/playwright/index.js';
import { serveDir } from './serve.mjs';
import { DECKS, VIEWPORT } from './shots.mjs';

const { chromium } = pw;

/** Read the pin-spacer anchors the runtime itself navigates by (deck.js `startPx`). */
export async function mapScenes(page) {
  return page.evaluate(() => {
    const sections = [...document.querySelectorAll('#deck > *')];
    const out = [];
    for (const node of sections) {
      const section = node.classList.contains('pin-spacer') ? node.firstElementChild : node;
      if (!section) continue;
      const anchor = node;
      out.push({
        id: section.id || section.dataset.scene || section.className,
        start: Math.round(anchor.getBoundingClientRect().top + window.scrollY),
        height: Math.round(anchor.getBoundingClientRect().height),
      });
    }
    return {
      maxScroll: document.documentElement.scrollHeight - window.innerHeight,
      innerHeight: window.innerHeight,
      scenes: out,
    };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const browser = await chromium.launch();
  for (const deck of DECKS) {
    await serveDir(deck.dist, deck.port);
    const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${deck.port}/`, { waitUntil: 'load' });
    await page.waitForTimeout(3500);
    const info = await mapScenes(page);
    console.log(`\n=== ${deck.name} === maxScroll=${info.maxScroll} vh=${info.innerHeight}`);
    info.scenes.forEach((s, i) => console.log(`  [${i}] ${s.id}  start=${s.start} height=${s.height}`));
    await page.close();
  }
  await browser.close();
  process.exit(0);
}
