/**
 * record.mjs — capture every frame the demo film is cut from.
 *
 * Three kinds of segment come out of here, all as numbered JPEGs:
 *   • deck passes   — a real wheel event per frame, following the programme in shots.mjs
 *   • the presenter beat — no wheel, just ArrowRight and N
 *   • title cards   — painted by window.__seek(p), one frame at a time
 *
 * Why a wheel event per frame rather than a screen recording: the deck is scroll-driven,
 * so the only honest way to scrub it is to scroll it. Lenis settles a small wheel delta
 * inside a single captured frame (measured: 26px steps land with 0.34px of jitter), which
 * makes the motion smooth and the capture reproducible.
 *
 *   node tools/demo/record.mjs [segment ...]     # default: everything
 */
import pw from '/home/seunghyeong/.npm-global/lib/node_modules/playwright/index.js';
import { mkdir, rm, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { serveDir } from './serve.mjs';
import { CARDS, DECKS, PASSES, PRESENTER, VIEWPORT, deckByName, planPass } from './shots.mjs';

const { chromium } = pw;
const HERE = dirname(fileURLToPath(import.meta.url));
export const SCRATCH = process.env.DEMO_SCRATCH
  ?? '/tmp/claude-1000/-home-seunghyeong/5a368c9d-2934-46d9-a7ee-fd39df4aef46/scratchpad/demo';
const FRAMES = `${SCRATCH}/frames`;
const CARD_PORT = 5330;

const pad = (n) => String(n).padStart(5, '0');
const shotPath = (dir, i) => `${dir}/f_${pad(i)}.jpg`;

async function freshDir(path) {
  await rm(path, { recursive: true, force: true });
  await mkdir(path, { recursive: true });
  return path;
}

/** Open a deck, wait out the preloader, and report its scroll geometry. */
async function openDeck(browser, deck) {
  const page = await browser.newPage({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto(`http://127.0.0.1:${deck.port}/`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('preloader')?.hidden !== false, null, { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500);   // let ScrollTrigger's post-layout refresh land

  const geometry = await page.evaluate(() => {
    const out = [];
    for (const node of document.querySelectorAll('#deck > *')) {
      const section = node.classList.contains('pin-spacer') ? node.firstElementChild : node;
      if (!section) continue;
      const box = node.getBoundingClientRect();
      out.push({ id: section.id || section.className, start: box.top + window.scrollY, height: box.height });
    }
    return { maxScroll: document.documentElement.scrollHeight - window.innerHeight, vh: window.innerHeight, scenes: out };
  });

  /** scene index + progress -> absolute scroll pixels, the anchor maths deck.js navigates by. */
  const toPixels = (scene, progress) => {
    const s = geometry.scenes[scene];
    if (!s) throw new Error(`${deck.name}: no scene at index ${scene}`);
    const pinDistance = Math.max(0, s.height - geometry.vh);
    return Math.min(geometry.maxScroll, s.start + pinDistance * progress);
  };

  return { page, geometry, toPixels, errors };
}

/** Advance by one real wheel tick and wait for the paint that follows it. */
async function step(page, delta) {
  if (delta !== 0) await page.mouse.wheel(0, delta);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

/**
 * Travel to a scroll position without filming the journey.
 *
 * Still real wheel events — the deck is never told to scroll — but sent in coarse
 * chunks and then left alone until both Lenis and the ScrollTrigger scrub have caught
 * up. Everything between two scenes happens here, off camera, which is the whole point:
 * the gaps are where the empty frames were.
 */
async function jumpTo(page, from, to) {
  const CHUNK = 500;
  for (let sent = 0; sent < Math.abs(to - from); sent += CHUNK) {
    const remaining = Math.abs(to - from) - sent;
    await page.mouse.wheel(0, Math.sign(to - from) * Math.min(CHUNK, remaining));
  }
  // Lenis lerps to the target; poll rather than guess at how long that takes.
  await page.waitForFunction(
    (target) => Math.abs(window.scrollY - target) <= 1.5,
    Math.round(to),
    { timeout: 8000 },
  ).catch(() => {});
  // The scrub is a 0.6s tween behind the scroll, so give it its time before shooting.
  await page.waitForTimeout(1100);
}

async function recordPass(browser, name) {
  const deck = deckByName(name);
  const dir = await freshDir(`${FRAMES}/${name}`);
  const { page, toPixels, errors } = await openDeck(browser, deck);

  const steps = planPass(PASSES[name], toPixels);
  const started = Date.now();
  let previous = 0;
  let frame = 0;
  let jumps = 0;

  for (const stepPlan of steps) {
    if (stepPlan.jump !== undefined) {
      const target = Math.round(stepPlan.jump);
      await jumpTo(page, previous, target);
      previous = target;
      jumps += 1;
      continue;
    }
    const want = Math.round(stepPlan.at);
    await step(page, want - previous);
    previous = want;
    await page.screenshot({ path: shotPath(dir, frame), type: 'jpeg', quality: 95 });
    frame += 1;
  }

  console.log(
    `  ${name}: ${frame} frames · ${jumps} scene visits · ${((Date.now() - started) / 1000).toFixed(0)}s` +
    (errors.length ? ` · ${errors.length} console errors` : ''),
  );
  if (errors.length) console.log('   ', errors.slice(0, 3).join(' | '));
  await page.close();
  return frame;
}

/** The keystroke pill. It is drawn at capture time and belongs to the film, not the deck. */
const BADGE_CSS = `
#demo-key {
  /* Top centre: the HUD owns the bottom right and the notes panel the bottom centre. */
  position: fixed; left: 50%; top: 64px; transform: translateX(-50%) translateY(-14px);
  display: flex; align-items: center; gap: 14px;
  padding: 16px 30px; border-radius: 9999px;
  background: rgba(8, 9, 10, 0.82); border: 1px solid rgba(148, 156, 178, 0.35);
  backdrop-filter: blur(10px);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 30px; font-weight: 500; color: #f4f5f6; letter-spacing: 1px;
  opacity: 0; transition: opacity 90ms linear, transform 90ms linear;
  z-index: 99999; pointer-events: none;
}
#demo-key[data-on="1"] { opacity: 1; transform: translateX(-50%) translateY(0); }
#demo-key .cap { font-size: 20px; color: #868b94; letter-spacing: 2.4px; text-transform: uppercase; }
`;

async function recordPresenter(browser) {
  const deck = deckByName(PRESENTER.deck);
  const dir = await freshDir(`${FRAMES}/presenter`);
  const { page, toPixels, errors } = await openDeck(browser, deck);

  // Park on the starting scene off camera, exactly as a deck visit would.
  await jumpTo(page, 0, Math.round(toPixels(PRESENTER.start.scene, PRESENTER.start.progress)));

  await page.addStyleTag({ content: BADGE_CSS });
  await page.evaluate(() => {
    const el = document.createElement('div');
    el.id = 'demo-key';
    el.innerHTML = '<span class="cap">key</span><span id="demo-key-glyph"></span>';
    document.body.appendChild(el);
  });

  const showBadge = (glyph) => page.evaluate((g) => {
    const el = document.getElementById('demo-key');
    document.getElementById('demo-key-glyph').textContent = g;
    el.dataset.on = '1';
  }, glyph);
  const hideBadge = () => page.evaluate(() => { document.getElementById('demo-key').dataset.on = '0'; });

  const started = Date.now();
  for (let f = 0; f < PRESENTER.frames; f++) {
    const hit = PRESENTER.keys.find((k) => k.frame === f);
    if (hit) { await showBadge(hit.badge); await page.keyboard.press(hit.key); }
    // The pill stays up for about three quarters of a second after each press — long
    // enough to read at speed, short enough not to sit on top of the landing.
    const recent = PRESENTER.keys.some((k) => f > k.frame && f <= k.frame + 22);
    if (!hit && !recent) await hideBadge();
    await page.screenshot({ path: shotPath(dir, f), type: 'jpeg', quality: 95 });
  }
  console.log(`  presenter: ${PRESENTER.frames} frames in ${((Date.now() - started) / 1000).toFixed(0)}s` +
    (errors.length ? ` · ${errors.length} console errors` : ''));
  await page.close();
  return PRESENTER.frames;
}

async function recordCard(browser, key) {
  const { file, frames } = CARDS[key];
  const dir = await freshDir(`${FRAMES}/card-${key}`);
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${CARD_PORT}/${file}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);

  for (let f = 0; f < frames; f++) {
    await page.evaluate((p) => window.__seek(p), f / (frames - 1));
    await page.screenshot({ path: shotPath(dir, f), type: 'jpeg', quality: 95 });
  }
  console.log(`  card-${key}: ${frames} frames` + (errors.length ? ` · ERRORS ${errors.join(' | ')}` : ''));
  await page.close();
  return frames;
}

async function main() {
  const want = process.argv.slice(2);
  const wanted = (name) => want.length === 0 || want.includes(name);

  await mkdir(FRAMES, { recursive: true });
  const servers = [];
  for (const deck of DECKS) servers.push(await serveDir(deck.dist, deck.port));
  servers.push(await serveDir(`${HERE}/cards`, CARD_PORT));

  const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--disable-lcd-text'] });
  console.log(`recording into ${FRAMES}`);

  for (const key of Object.keys(CARDS)) if (wanted(`card-${key}`)) await recordCard(browser, key);
  for (const deck of DECKS) if (wanted(deck.name)) await recordPass(browser, deck.name);
  if (wanted('presenter')) await recordPresenter(browser);

  await browser.close();
  servers.forEach((s) => s.close());
}

// Guarded: process.argv[1] is undefined when these modules are imported rather than run.
const isMain = process.argv[1] && import.meta.url === `file://${resolve(process.argv[1])}`;
if (isMain) {
  await main();
  process.exit(0);
}
