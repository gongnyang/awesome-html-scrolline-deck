#!/usr/bin/env node
/**
 * make-skyline.mjs — 100 frames of a Seoul skyline going from dusk to night,
 * for the 01-hero frame scrub, plus the poster the deck shows before the
 * sequence decodes.
 *
 * There is no footage in this example, so the sequence is drawn: the sky ramp,
 * the descending sun, the rising moon, the stars and every lit window are all
 * functions of one progress value t. The real workflow cuts frames from a clip
 * instead — `scrolline frames dusk.mp4 --name skyline --scene 01-hero`.
 *
 *   NODE_PATH=<dir with sharp> node tools/make-skyline.mjs
 */
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { P, skyAt, mix, smooth, clamp01, rng } from './palette.mjs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'public', 'frames', 'skyline');

const W = 1280;
const H = 720;
const COUNT = 100;
const GROUND = 585;   // where the far ridge stands
const BASE = 642;     // where the near buildings stand
const WATER = 642;    // the river band starts here

/* ---------- the city is generated once, then drawn 100 times ---------- */

function ridge(seed, { from, to, base, step }) {
  const r = rng(seed);
  const points = [];
  for (let x = -60; x <= W + 60; x += step) {
    const n = r();
    const wave = Math.sin(x * 0.0042 + seed) * 0.5 + 0.5;
    points.push([x, base - (from + (to - from) * (0.42 * n + 0.58 * wave))]);
  }
  return `M -60 ${base + 40} ` + points.map(([x, y]) => `L ${x.toFixed(0)} ${y.toFixed(0)}`).join(' ') + ` L ${W + 60} ${base + 40} Z`;
}

function buildings() {
  const r = rng(20260921);
  const list = [];
  let x = -40;
  while (x < W + 40) {
    const w = 42 + Math.round(r() * 78);
    const isTall = r() > 0.82;
    const h = isTall ? 190 + Math.round(r() * 105) : 68 + Math.round(r() * 118);
    const top = BASE - h;
    const cols = Math.max(2, Math.floor((w - 14) / 17));
    const rows = Math.max(2, Math.floor((h - 18) / 21));
    const windows = [];
    for (let c = 0; c < cols; c += 1) {
      for (let row = 0; row < rows; row += 1) {
        if (r() > 0.78) continue; // dark flats stay dark all night
        windows.push({
          x: x + 9 + c * 17,
          y: top + 12 + row * 21,
          on: 0.14 + r() * 0.78,       // the moment this window lights up
          warm: r(),                    // amber or tangerine
        });
      }
    }
    list.push({ x, w, top, h, windows, shade: 0.5 + r() * 0.5 });
    x += w + 5 + Math.round(r() * 12);
  }
  return list;
}

const CITY = buildings();
const STARS = Array.from({ length: 84 }, (_, i) => {
  const r = rng(700 + i * 37);
  return { x: r() * W, y: 26 + r() * 400, s: 0.7 + r() * 1.5, phase: r(), lit: 0.42 + r() * 0.3 };
});
const RIDGE_FAR = ridge(3.1, { from: 54, to: 128, base: GROUND, step: 46 });
const RIDGE_NEAR = ridge(7.7, { from: 22, to: 74, base: GROUND + 16, step: 34 });

/* ---------- one frame ---------- */

function frameSvg(t) {
  const sky = skyAt(t);
  const night = smooth(clamp01((t - 0.3) / 0.7));
  const ink = mix(P.deep, '#000000', 0.25);

  // sun: slides down behind the ridge and is gone by 0.62
  const sunY = 352 + smooth(clamp01(t / 0.62)) * 236;
  const sunA = clamp01(1 - Math.pow(clamp01(t / 0.62), 2.4));
  const sunC = mix(P.amber, P.tang, clamp01(t / 0.5));

  // moon: comes up on the other side once the sun has gone
  const moonT = clamp01((t - 0.48) / 0.52);
  const moonY = 292 - smooth(moonT) * 126;
  const moonA = smooth(moonT);

  const stars = STARS.map((s) => {
    const a = clamp01((t - s.lit) / 0.22) * (0.45 + 0.55 * Math.abs(Math.sin((t * 5 + s.phase) * Math.PI)));
    if (a <= 0.02) return '';
    return `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${s.s.toFixed(2)}" fill="${P.ink}" fill-opacity="${a.toFixed(3)}"/>`;
  }).join('');

  const blocks = CITY.map((b) => {
    const body = mix(mix(sky.low, ink, 0.62 + 0.3 * night), P.surface1, 0.2 * b.shade);
    const lit = b.windows.map((w) => {
      const a = clamp01((t - w.on) / 0.05);
      if (a <= 0.02) return '';
      const c = mix(P.amber, P.tang, w.warm);
      return `<rect x="${w.x}" y="${w.y}" width="7" height="11" fill="${c}" fill-opacity="${(a * 0.92).toFixed(3)}"/>`;
    }).join('');
    return `<g><rect x="${b.x}" y="${b.top}" width="${b.w}" height="${BASE - b.top + 6}" fill="${body}"/>${lit}</g>`;
  }).join('');

  // the tower on the far ridge — the one landmark that reads as a silhouette
  const towerX = 268;
  const towerBase = GROUND - 96;
  const beacon = clamp01((t - 0.4) / 0.14);

  // the river: a mirrored wash plus a few broken reflections of the lit windows
  const reflections = CITY.filter((_, i) => i % 3 === 0).map((b) => {
    const w = b.windows.find((win) => t > win.on + 0.02);
    if (!w) return '';
    const a = clamp01((t - w.on) / 0.12) * 0.5;
    return `<rect x="${w.x - 3}" y="${(WATER + 16 + ((b.x * 7) % 54)).toFixed(0)}" width="13" height="2.4" fill="${mix(P.amber, P.tang, w.warm)}" fill-opacity="${a.toFixed(3)}"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${sky.top}"/>
      <stop offset="58%" stop-color="${sky.mid}"/>
      <stop offset="100%" stop-color="${sky.low}"/>
    </linearGradient>
    <radialGradient id="sunglow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${sunC}" stop-opacity="${(0.72 * sunA).toFixed(3)}"/>
      <stop offset="42%" stop-color="${sunC}" stop-opacity="${(0.2 * sunA).toFixed(3)}"/>
      <stop offset="100%" stop-color="${sunC}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="moonglow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${P.ink}" stop-opacity="${(0.34 * moonA).toFixed(3)}"/>
      <stop offset="100%" stop-color="${P.ink}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${mix(sky.low, ink, 0.5 + 0.34 * night)}"/>
      <stop offset="100%" stop-color="${mix(ink, P.canvas, 0.35)}"/>
    </linearGradient>
    <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${sky.low}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${sky.low}" stop-opacity="${(0.5 - 0.32 * night).toFixed(3)}"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <g>${stars}</g>
  <circle cx="${(W * 0.735).toFixed(0)}" cy="${moonY.toFixed(0)}" r="150" fill="url(#moonglow)"/>
  <circle cx="${(W * 0.735).toFixed(0)}" cy="${moonY.toFixed(0)}" r="23" fill="${P.ink}" fill-opacity="${(0.94 * moonA).toFixed(3)}"/>
  <circle cx="${(W * 0.735 + 9).toFixed(0)}" cy="${(moonY - 5).toFixed(0)}" r="19" fill="${sky.top}" fill-opacity="${(0.55 * moonA).toFixed(3)}"/>
  <circle cx="${(W * 0.315).toFixed(0)}" cy="${sunY.toFixed(0)}" r="240" fill="url(#sunglow)"/>
  <circle cx="${(W * 0.315).toFixed(0)}" cy="${sunY.toFixed(0)}" r="41" fill="${sunC}" fill-opacity="${(0.96 * sunA).toFixed(3)}"/>

  <path d="${RIDGE_FAR}" fill="${mix(sky.mid, ink, 0.56 + 0.3 * night)}"/>
  <g>
    <rect x="${towerX - 3}" y="${towerBase}" width="6" height="96" fill="${mix(sky.mid, ink, 0.72 + 0.22 * night)}"/>
    <path d="M ${towerX - 15} ${towerBase + 22} L ${towerX + 15} ${towerBase + 22} L ${towerX + 9} ${towerBase + 40} L ${towerX - 9} ${towerBase + 40} Z" fill="${mix(sky.mid, ink, 0.72 + 0.22 * night)}"/>
    <rect x="${towerX - 1}" y="${towerBase - 26}" width="2" height="26" fill="${mix(sky.mid, ink, 0.72 + 0.22 * night)}"/>
    <circle cx="${towerX}" cy="${towerBase - 28}" r="3.4" fill="${P.tealHi}" fill-opacity="${(beacon * 0.95).toFixed(3)}"/>
    <circle cx="${towerX}" cy="${towerBase - 28}" r="13" fill="${P.teal}" fill-opacity="${(beacon * 0.16).toFixed(3)}"/>
  </g>
  <path d="${RIDGE_NEAR}" fill="${mix(sky.low, ink, 0.66 + 0.28 * night)}"/>
  <rect x="0" y="${GROUND - 120}" width="${W}" height="${WATER - GROUND + 120}" fill="url(#haze)"/>

  <g>${blocks}</g>

  <rect x="0" y="${WATER}" width="${W}" height="${H - WATER}" fill="url(#water)"/>
  <g>${reflections}</g>
  <line x1="0" y1="${WATER}" x2="${W}" y2="${WATER}" stroke="${P.hairline}" stroke-opacity="${(0.3 + 0.4 * night).toFixed(2)}" stroke-width="1"/>
</svg>`;
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  let bytes = 0;
  for (let i = 1; i <= COUNT; i += 1) {
    const t = (i - 1) / (COUNT - 1);
    const buf = await sharp(Buffer.from(frameSvg(t)))
      .jpeg({ quality: 60, mozjpeg: true, chromaSubsampling: '4:2:0' })
      .toBuffer();
    await writeFile(path.join(OUT, `f_${String(i).padStart(3, '0')}.jpg`), buf);
    bytes += buf.length;
  }

  const poster = await sharp(Buffer.from(frameSvg(0.52)))
    .jpeg({ quality: 72, mozjpeg: true })
    .toBuffer();
  await writeFile(path.join(OUT, 'poster.jpg'), poster);

  console.log(`skyline: ${COUNT} frames · ${(bytes / 1048576).toFixed(2)} MB · poster ${(poster.length / 1024).toFixed(0)} KB`);
}

main().catch((err) => { console.error(err); process.exit(1); });
