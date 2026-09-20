#!/usr/bin/env node
/**
 * make-guide.mjs — the 900×1200 plate for 05-guide (tilt-card).
 *
 * The template wants a portrait; there is no photography in this example, so the
 * guide is an abstract figure and the rest of the plate is the day itself as a
 * vertical timeline. The tilt-card slot is 56vw × 100svh and masks its own left
 * edge, so nothing that has to be read is placed left of x≈320 or outside
 * y 100–1100 (that band is what survives `object-fit: cover` at 1440×900).
 *
 *   NODE_PATH=<dir with sharp> node tools/make-guide.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { P, mix, FONT_SANS, FONT_MONO } from './palette.mjs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'public', 'media', '05-guide');

const W = 900;
const H = 1200;
const AXIS = 452;   // the timeline's spine

const STOPS = [
  { time: '17:30', name: '경복궁 돌담길', walk: 0, tag: '출발' },
  { time: '18:20', name: '서촌 골목', walk: 18 },
  { time: '19:10', name: '인왕산 자락길', walk: 24 },
  { time: '20:00', name: '광장시장', walk: 31 },
  { time: '20:50', name: '청계천 하류', walk: 15 },
  { time: '21:20', name: '집으로', walk: 12, tag: '해산' },
];

const TOP = 604;
const STEP = 82;
const MAXWALK = 31;

function avatar() {
  const cx = 620;
  const cy = 320;
  return `
  <circle cx="${cx}" cy="${cy}" r="178" fill="${P.tang}" fill-opacity="0.08"/>
  <circle cx="${cx}" cy="${cy}" r="150" fill="none" stroke="${P.teal}" stroke-opacity="0.28" stroke-width="1.6" stroke-dasharray="4 9"/>
  <path d="M ${cx - 150} ${cy} A 150 150 0 0 1 ${cx + 150} ${cy}" fill="none" stroke="${P.amber}" stroke-opacity="0.55" stroke-width="2"/>
  <circle cx="${cx - 150}" cy="${cy}" r="12" fill="${P.amber}"/>
  <circle cx="${cx + 150}" cy="${cy}" r="10" fill="${P.ink}" fill-opacity="0.88"/>
  <path d="M ${cx - 126} 474 C ${cx - 122} 350, ${cx + 122} 350, ${cx + 126} 474 Z" fill="url(#body)"/>
  <path d="M ${cx - 36} 364 L ${cx} 412 L ${cx + 36} 364" fill="none" stroke="${P.tang}" stroke-width="10" stroke-linejoin="round" stroke-linecap="round" opacity="0.92"/>
  <line x1="${cx}" y1="412" x2="${cx}" y2="474" stroke="${P.hairline}" stroke-width="2"/>
  <circle cx="${cx}" cy="${cy - 26}" r="74" fill="url(#head)"/>
  <path d="M ${cx + 22} ${cy - 98} A 74 74 0 0 1 ${cx + 22} ${cy + 46}" fill="none" stroke="${P.tang}" stroke-width="11" stroke-linecap="round" opacity="0.9"/>
  <path d="M ${cx - 71} ${cy - 44} A 74 74 0 0 1 ${cx - 12} ${cy - 98}" fill="none" stroke="${P.tealHi}" stroke-opacity="0.6" stroke-width="4" stroke-linecap="round"/>
  <line x1="${cx - 126}" y1="474" x2="${cx + 126}" y2="474" stroke="${P.hairline}" stroke-width="2"/>`;
}

function node(stop, i) {
  const y = TOP + i * STEP;
  const barW = stop.walk ? 26 + (stop.walk / MAXWALK) * 250 : 0;
  const accent = i === 0 || i === STOPS.length - 1;
  return `<g>
    <circle cx="${AXIS}" cy="${y}" r="${accent ? 13 : 9}" fill="${accent ? P.tang : P.canvas}" stroke="${accent ? P.tang : P.tealHi}" stroke-width="3"/>
    <text x="${AXIS - 32}" y="${y + 9}" font-family="${FONT_MONO}" font-size="27" fill="${P.amber}" text-anchor="end">${stop.time}</text>
    <text x="${AXIS + 34}" y="${y - 4}" font-family="${FONT_SANS}" font-size="31" font-weight="600" fill="${P.ink}">${stop.name}</text>
    ${stop.walk
      ? `<rect x="${AXIS + 34}" y="${y + 12}" width="${barW.toFixed(0)}" height="9" rx="4.5" fill="${P.teal}" fill-opacity="0.8"/>
         <text x="${(AXIS + 46 + barW).toFixed(0)}" y="${y + 22}" font-family="${FONT_MONO}" font-size="20" fill="${P.inkSubtle}">걸어서 ${stop.walk}분</text>`
      : `<text x="${AXIS + 34}" y="${y + 22}" font-family="${FONT_MONO}" font-size="20" letter-spacing="2" fill="${P.tang}">${stop.tag}</text>`}
  </g>`;
}

function plateSvg() {
  const lastY = TOP + (STOPS.length - 1) * STEP;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0.2" y1="0" x2="0.9" y2="1">
      <stop offset="0%" stop-color="${mix(P.surface2, P.tang, 0.1)}"/>
      <stop offset="46%" stop-color="${P.canvas}"/>
      <stop offset="100%" stop-color="${P.deep}"/>
    </linearGradient>
    <radialGradient id="head" cx="40%" cy="34%" r="82%">
      <stop offset="0%" stop-color="${mix(P.teal, P.ink, 0.14)}"/>
      <stop offset="100%" stop-color="${mix(P.teal, P.deep, 0.42)}"/>
    </radialGradient>
    <linearGradient id="body" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="${mix(P.surface3, P.teal, 0.2)}"/>
      <stop offset="100%" stop-color="${P.surface1}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <text x="${AXIS - 32}" y="140" font-family="${FONT_MONO}" font-size="21" letter-spacing="5" fill="${P.inkSubtle}">SEOUL · TWILIGHT LOOP</text>
  <line x1="${AXIS - 32}" y1="164" x2="${W - 56}" y2="164" stroke="${P.hairline}" stroke-width="1"/>

  ${avatar()}

  <text x="${AXIS - 32}" y="536" font-family="${FONT_SANS}" font-size="30" font-weight="600" fill="${P.ink}">오늘의 시간표</text>
  <text x="${W - 56}" y="536" font-family="${FONT_MONO}" font-size="20" fill="${P.inkSubtle}" text-anchor="end">5.8 km · 1 h 40 m</text>
  <line x1="${AXIS - 32}" y1="556" x2="${W - 56}" y2="556" stroke="${P.hairline}" stroke-width="1"/>

  <line x1="${AXIS}" y1="${TOP}" x2="${AXIS}" y2="${lastY}" stroke="${P.hairline}" stroke-width="2"/>
  ${STOPS.map(node).join('')}

  <text x="${AXIS - 32}" y="1086" font-family="${FONT_MONO}" font-size="19" letter-spacing="3" fill="${P.inkSubtle}">SAMPLE DATA · 예시 일정</text>
</svg>`;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const buf = await sharp(Buffer.from(plateSvg())).webp({ quality: 84 }).toBuffer();
  await writeFile(path.join(OUT, 'guide.webp'), buf);
  console.log(`guide.webp  ${W}x${H}  ${(buf.length / 1024).toFixed(0)} KB`);
}

main().catch((err) => { console.error(err); process.exit(1); });
