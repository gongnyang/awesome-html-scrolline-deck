#!/usr/bin/env node
/**
 * make-drift.mjs — the six-second muted clip for 04-drift (parallax-video).
 *
 * 청계천 after dark: cloud streaks crossing a fixed moon, and the water below
 * carrying the signs. Every motion is periodic over the six seconds, so the
 * template's `loop` attribute has nothing to stitch. Frames are drawn as SVG,
 * rasterised with sharp and encoded by ffmpeg; the intermediate frames are
 * deleted afterwards.
 *
 *   NODE_PATH=<dir with sharp> node tools/make-drift.mjs
 *   FFMPEG=/path/to/ffmpeg node tools/make-drift.mjs      # if ffmpeg is not on PATH
 */
import { mkdir, writeFile, rm, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { P, mix, rng } from './palette.mjs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'public', 'media', '04-drift');
const TMP = path.join(os.tmpdir(), 'city-guide-drift');

const W = 1280;
const H = 720;
const FPS = 24;
const SECONDS = 6;
const COUNT = FPS * SECONDS;
const WATER = 372;

const FFMPEG = process.env.FFMPEG
  || [path.join(os.homedir(), '.local/bin/ffmpeg'), 'ffmpeg'].find((bin) => {
    const probe = spawnSync(bin, ['-version'], { stdio: 'ignore' });
    return !probe.error && probe.status === 0;
  });

const TAU = Math.PI * 2;

/* ---------- the fixed part of the picture ---------- */

const SKYLINE = (() => {
  const r = rng(414);
  const out = [];
  let x = -30;
  while (x < W + 30) {
    const w = 46 + Math.round(r() * 74);
    const h = 46 + Math.round(r() * 132);
    const lights = [];
    const cols = Math.max(1, Math.floor((w - 16) / 20));
    const rows = Math.max(1, Math.floor((h - 16) / 24));
    for (let c = 0; c < cols; c += 1) {
      for (let k = 0; k < rows; k += 1) {
        if (r() > 0.42) continue;
        lights.push({ x: x + 10 + c * 20, y: WATER - h + 10 + k * 24, warm: r() });
      }
    }
    out.push({ x, w, h, lights });
    x += w + 4 + Math.round(r() * 14);
  }
  return out;
})();

const STARS = Array.from({ length: 58 }, (_, i) => {
  const r = rng(90 + i * 13);
  return { x: r() * W, y: 18 + r() * 250, s: 0.7 + r() * 1.4, phase: r() };
});

const STREAKS = Array.from({ length: 12 }, (_, i) => {
  const r = rng(320 + i * 29);
  return {
    band: i % 3,
    slot: Math.floor(i / 3),
    y: 52 + (i % 3) * 84 + r() * 26,
    rx: 120 + r() * 150,
    ry: 11 + r() * 12,
    a: 0.05 + r() * 0.09,
  };
});

const RIPPLES = Array.from({ length: 26 }, (_, i) => {
  const r = rng(660 + i * 17);
  return { y: WATER + 14 + i * 13, x: r() * W, w: 120 + r() * 420, a: 0.04 + r() * 0.12, phase: r() };
});

/* ---------- one frame ---------- */

function frameSvg(t) {
  const streaks = STREAKS.map((s) => {
    const period = 420 + s.band * 160;
    const speed = [1, 0.66, 0.42][s.band];
    const x = ((s.slot * period + t * period * speed) % (W + period * 2)) - period;
    return `<g fill="${P.inkSubtle}" fill-opacity="${(s.a * 0.62).toFixed(3)}">`
      + `<ellipse cx="${x.toFixed(1)}" cy="${s.y.toFixed(0)}" rx="${s.rx.toFixed(0)}" ry="${(s.ry * 0.7).toFixed(0)}"/>`
      + `<ellipse cx="${(x - s.rx * 0.5).toFixed(1)}" cy="${(s.y + s.ry * 0.5).toFixed(0)}" rx="${(s.rx * 0.62).toFixed(0)}" ry="${(s.ry * 0.5).toFixed(0)}"/>`
      + `<ellipse cx="${(x + s.rx * 0.46).toFixed(1)}" cy="${(s.y - s.ry * 0.34).toFixed(0)}" rx="${(s.rx * 0.5).toFixed(0)}" ry="${(s.ry * 0.42).toFixed(0)}"/></g>`;
  }).join('');

  const stars = STARS.map((s) => {
    const a = 0.35 + 0.45 * Math.abs(Math.sin(TAU * (t + s.phase)));
    return `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${s.s.toFixed(2)}" fill="${P.ink}" fill-opacity="${a.toFixed(3)}"/>`;
  }).join('');

  const city = SKYLINE.map((b) => {
    const lights = b.lights.map((l) =>
      `<rect x="${l.x}" y="${l.y}" width="7" height="12" fill="${mix(P.amber, P.tang, l.warm)}" fill-opacity="0.9"/>`).join('');
    return `<g><rect x="${b.x}" y="${WATER - b.h}" width="${b.w}" height="${b.h}" fill="${P.deep}"/>${lights}</g>`;
  }).join('');

  // the signs, read a second time on the water: each column breathes on its own
  const mirrors = SKYLINE.flatMap((b) => b.lights.slice(0, 2).map((l, k) => {
    const wob = Math.sin(TAU * t + l.x * 0.03 + k) * 7;
    const height = 84 + Math.sin(TAU * t + l.x * 0.017) * 26;
    return `<rect x="${(l.x + wob).toFixed(1)}" y="${WATER + 4}" width="5" height="${height.toFixed(0)}" fill="${mix(P.amber, P.tang, l.warm)}" fill-opacity="0.3"/>`;
  })).join('');

  const ripples = RIPPLES.map((r) => {
    const x = r.x + Math.sin(TAU * t + r.phase * TAU) * 34;
    return `<rect x="${x.toFixed(1)}" y="${r.y}" width="${r.w.toFixed(0)}" height="2" rx="1" fill="${P.tealHi}" fill-opacity="${(r.a * (0.6 + 0.4 * Math.sin(TAU * t + r.phase * 6))).toFixed(3)}"/>`;
  }).join('');

  const moonY = 138 + Math.sin(TAU * t) * 3;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${P.deep}"/>
      <stop offset="62%" stop-color="${P.canvas}"/>
      <stop offset="100%" stop-color="${mix(P.canvas, P.tang, 0.16)}"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${P.ink}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${P.ink}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${mix(P.teal, P.deep, 0.66)}"/>
      <stop offset="34%" stop-color="${mix(P.teal, P.deep, 0.86)}"/>
      <stop offset="100%" stop-color="${P.deep}"/>
    </linearGradient>
    <linearGradient id="depth" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${P.deep}" stop-opacity="0"/>
      <stop offset="20%" stop-color="${P.deep}" stop-opacity="0.55"/>
      <stop offset="56%" stop-color="${P.deep}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${P.deep}" stop-opacity="1"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <g>${stars}</g>
  <circle cx="${W * 0.72}" cy="${moonY.toFixed(1)}" r="128" fill="url(#halo)"/>
  <circle cx="${W * 0.72}" cy="${moonY.toFixed(1)}" r="26" fill="${P.ink}" fill-opacity="0.92"/>
  <circle cx="${W * 0.72 + 10}" cy="${(moonY - 6).toFixed(1)}" r="22" fill="${P.canvas}" fill-opacity="0.88"/>
  <g>${streaks}</g>
  <g>${city}</g>
  <rect x="0" y="${WATER}" width="${W}" height="${H - WATER}" fill="url(#water)"/>
  <g>${mirrors}</g>
  <rect x="0" y="${WATER + 2}" width="${W}" height="${H - WATER - 2}" fill="url(#depth)"/>
  <g>${ripples}</g>
  <line x1="0" y1="${WATER}" x2="${W}" y2="${WATER}" stroke="${P.tealHi}" stroke-opacity="0.22" stroke-width="1"/>
</svg>`;
}

async function main() {
  if (!FFMPEG) {
    console.error('make-drift: ffmpeg was not found. Set FFMPEG=/path/to/ffmpeg and run again.');
    process.exit(2);
  }
  await mkdir(OUT, { recursive: true });
  await rm(TMP, { recursive: true, force: true });
  await mkdir(TMP, { recursive: true });

  for (let i = 0; i < COUNT; i += 1) {
    const t = i / COUNT; // open interval, so frame 0 and frame COUNT would coincide
    const buf = await sharp(Buffer.from(frameSvg(t))).jpeg({ quality: 94 }).toBuffer();
    await writeFile(path.join(TMP, `f_${String(i + 1).padStart(4, '0')}.jpg`), buf);
  }

  const mp4 = path.join(OUT, 'drift.mp4');
  const args = [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-framerate', String(FPS),
    '-i', path.join(TMP, 'f_%04d.jpg'),
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-crf', '24', '-preset', 'slow', '-g', String(FPS * 2),
    '-an', '-movflags', '+faststart',
    mp4,
  ];
  const run = spawnSync(FFMPEG, args, { stdio: 'inherit' });
  if (run.status !== 0) { console.error(`make-drift: ffmpeg exited ${run.status}`); process.exit(1); }

  const poster = await sharp(Buffer.from(frameSvg(0.5))).webp({ quality: 82 }).toBuffer();
  await writeFile(path.join(OUT, 'poster.webp'), poster);

  await rm(TMP, { recursive: true, force: true });
  const size = (await stat(mp4)).size;
  console.log(`drift.mp4  ${COUNT} frames @ ${FPS}fps  ${(size / 1024).toFixed(0)} KB · poster ${(poster.length / 1024).toFixed(0)} KB`);
}

main().catch((err) => { console.error(err); process.exit(1); });
