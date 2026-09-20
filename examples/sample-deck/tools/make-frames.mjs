#!/usr/bin/env node
/**
 * make-frames.mjs — generate the hero frame sequence for the sample deck.
 *
 * The real workflow uses `scrolline frames <video.mp4>` (ffmpeg). This example
 * ships no video, so the 120 frames are drawn procedurally from the deck tokens
 * and written straight to public/frames/hero/f_%03d.jpg.
 *
 *   NODE_PATH=<dir with sharp> node tools/make-frames.mjs
 */
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'public', 'frames', 'hero');

const W = 1280;
const H = 720;
const COUNT = 120;

const CANVAS = '#010102';
const ACCENT = '#5e6ad2';
const ACCENT_HI = '#828fff';
const INK = '#f7f8f8';
const SUBTLE = '#8a8f98';

const clamp01 = (n) => Math.min(1, Math.max(0, n));
const smoothstep = (n) => {
  const t = clamp01(n);
  return t * t * (3 - 2 * t);
};

/** One frame of the scroll ribbon: hairlines travelling up, an arc winding open. */
function frameSvg(t) {
  const rows = [];
  const LINES = 46;
  // hairlines drift upward as t advances — the motion reads as scroll, not spin
  for (let i = 0; i < LINES; i += 1) {
    const phase = (i / LINES + t * 0.62) % 1;
    const depth = Math.pow(phase, 1.75); // perspective easing
    const y = 96 + depth * (H + 140) - 120;
    if (y < -20 || y > H + 20) continue;
    const spread = 90 + depth * 560;
    const x1 = W / 2 - spread;
    const x2 = W / 2 + spread;
    const alpha = (0.05 + depth * 0.5) * (1 - Math.pow(phase, 6));
    const width = 0.6 + depth * 1.5;
    const hot = Math.abs(phase - 0.55) < 0.035;
    rows.push(
      `<line x1="${x1.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y.toFixed(1)}" ` +
        `stroke="${hot ? ACCENT_HI : INK}" stroke-opacity="${alpha.toFixed(3)}" stroke-width="${width.toFixed(2)}" />`
    );
  }

  // the scrolline itself: a vertical spine that fills with progress
  const spineX = W / 2;
  const spineTop = 110;
  const spineBottom = H - 110;
  const fill = spineTop + (spineBottom - spineTop) * smoothstep(t);

  // arc: 0 → 320 degrees, drawn as a dashed circle so it winds open with scroll
  const R = 196;
  const circ = 2 * Math.PI * R;
  const arc = circ * (0.06 + 0.82 * smoothstep(t));

  // glow follows the fill head
  const glowY = fill;
  const bloom = 0.26 + 0.34 * Math.sin(Math.PI * clamp01(t));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="${(38 + t * 18).toFixed(1)}%" r="72%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="${(0.19 * bloom * 3).toFixed(3)}" />
      <stop offset="58%" stop-color="${ACCENT}" stop-opacity="0.04" />
      <stop offset="100%" stop-color="${CANVAS}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="spine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${ACCENT_HI}" stop-opacity="0.15" />
      <stop offset="70%" stop-color="${ACCENT_HI}" stop-opacity="0.95" />
      <stop offset="100%" stop-color="${INK}" stop-opacity="1" />
    </linearGradient>
    <radialGradient id="head" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${INK}" stop-opacity="0.95" />
      <stop offset="35%" stop-color="${ACCENT_HI}" stop-opacity="0.45" />
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${CANVAS}" />
  <rect width="${W}" height="${H}" fill="url(#bg)" />
  <g>${rows.join('')}</g>
  <circle cx="${spineX}" cy="${H / 2}" r="${R}" fill="none" stroke="${SUBTLE}" stroke-opacity="0.12" stroke-width="1" />
  <circle cx="${spineX}" cy="${H / 2}" r="${R}" fill="none" stroke="${ACCENT_HI}" stroke-opacity="0.85"
          stroke-width="2" stroke-linecap="round"
          stroke-dasharray="${arc.toFixed(1)} ${(circ - arc).toFixed(1)}"
          transform="rotate(-90 ${spineX} ${H / 2})" />
  <line x1="${spineX}" y1="${spineTop}" x2="${spineX}" y2="${spineBottom}"
        stroke="${SUBTLE}" stroke-opacity="0.18" stroke-width="1" />
  <line x1="${spineX}" y1="${spineTop}" x2="${spineX}" y2="${fill.toFixed(1)}"
        stroke="url(#spine)" stroke-width="2.4" stroke-linecap="round" />
  <circle cx="${spineX}" cy="${glowY.toFixed(1)}" r="${(76 * bloom + 22).toFixed(1)}" fill="url(#head)" />
  <circle cx="${spineX}" cy="${glowY.toFixed(1)}" r="3.4" fill="${INK}" />
</svg>`;
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  let bytes = 0;
  for (let i = 1; i <= COUNT; i += 1) {
    const t = (i - 1) / (COUNT - 1);
    const svg = frameSvg(t);
    const file = path.join(OUT, `f_${String(i).padStart(3, '0')}.jpg`);
    const buf = await sharp(Buffer.from(svg))
      .jpeg({ quality: 68, mozjpeg: true, chromaSubsampling: '4:2:0' })
      .toBuffer();
    await writeFile(file, buf);
    bytes += buf.length;
  }

  // poster = the frame the deck shows before the sequence is decoded
  const poster = await sharp(Buffer.from(frameSvg(0.55)))
    .jpeg({ quality: 76, mozjpeg: true })
    .toBuffer();
  await writeFile(path.join(OUT, 'poster.jpg'), poster);

  console.log(`frames: ${COUNT} · ${(bytes / 1024 / 1024).toFixed(2)} MB · poster ${(poster.length / 1024).toFixed(0)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
