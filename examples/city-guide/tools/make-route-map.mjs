#!/usr/bin/env node
/**
 * make-route-map.mjs — the route map for 02-route (anatomy-rows).
 *
 * The template pins its annotation marks at fixed percentages of the artwork
 * (`MARKS` in the anatomy-rows scene module), so the map is drawn to those
 * coordinates rather than the other way round. The aspect ratio matches the
 * 44vw × 100svh slot at 1440×900, so `object-fit: cover` crops nothing.
 *
 *   NODE_PATH=<dir with sharp> node tools/make-route-map.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { P, mix, rng, FONT_SANS, FONT_MONO } from './palette.mjs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'public', 'media', '02-route');

const W = 1126;
const H = 1600;

/** The template's mark positions, in percent. Stops are drawn on top of these. */
const STOPS = [
  { p: [24, 31], n: '01', name: '경복궁 돌담길', time: '17:30' },
  { p: [64, 41], n: '02', name: '서촌 골목', time: '18:20' },
  { p: [42, 70], n: '03', name: '인왕산 자락길', time: '19:10' },
  { p: [75, 78], n: '04', name: '광장시장', time: '20:00' },
  { p: [33, 52], n: '05', name: '청계천 하류', time: '20:50' },
];

const px = ([x, y]) => [(x / 100) * W, (y / 100) * H];

/** A hand-drawn-looking street grid: the city under the route, never above it. */
function streets() {
  const r = rng(519);
  const out = [];
  for (let i = 0; i < 16; i += 1) {
    const y = 70 + i * 96 + r() * 26;
    const skew = (r() - 0.5) * 90;
    out.push(`<path d="M -40 ${y.toFixed(0)} L ${W + 40} ${(y + skew).toFixed(0)}" stroke="${P.hairline}" stroke-opacity="${(0.28 + r() * 0.3).toFixed(2)}" stroke-width="1" fill="none"/>`);
  }
  for (let i = 0; i < 11; i += 1) {
    const x = 50 + i * 104 + r() * 30;
    const skew = (r() - 0.5) * 70;
    out.push(`<path d="M ${x.toFixed(0)} -40 L ${(x + skew).toFixed(0)} ${H + 40}" stroke="${P.hairline}" stroke-opacity="${(0.24 + r() * 0.26).toFixed(2)}" stroke-width="1" fill="none"/>`);
  }
  // a few filled blocks, so the grid reads as a city and not as graph paper
  for (let i = 0; i < 26; i += 1) {
    const x = r() * (W - 120);
    const y = r() * (H - 120);
    out.push(`<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${(46 + r() * 74).toFixed(0)}" height="${(34 + r() * 58).toFixed(0)}" fill="${P.surface1}" fill-opacity="${(0.5 + r() * 0.4).toFixed(2)}"/>`);
  }
  return out.join('');
}

/** 인왕산, as contour rings in the top-left quarter. */
function hill() {
  const cx = 132;
  const cy = 452;
  return Array.from({ length: 6 }, (_, i) => {
    const k = 1 - i / 7;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${(300 * k).toFixed(0)}" ry="${(215 * k).toFixed(0)}" fill="none" stroke="${P.teal}" stroke-opacity="${(0.1 + i * 0.045).toFixed(3)}" stroke-width="1.4"/>`;
  }).join('') + `<text x="${cx + 96}" y="${cy - 168}" font-family="${FONT_SANS}" font-size="26" fill="${P.teal}" fill-opacity="0.68" text-anchor="middle">인왕산</text>`;
}

/** 청계천, running low and east, in the deck's teal. */
const RIVER = `M -40 ${H * 0.60} C ${W * 0.22} ${H * 0.575}, ${W * 0.36} ${H * 0.63}, ${W * 0.55} ${H * 0.60} S ${W * 0.86} ${H * 0.545}, ${W + 40} ${H * 0.575}`;

/** The walk: one smooth curve through the five stops, swung wide so the
 *  doubling-back at the end reads as a loop rather than a scribble. */
function routePath() {
  const [a, b, c, d, e] = STOPS.map((s) => px(s.p));
  return [
    `M ${a[0].toFixed(0)} ${a[1].toFixed(0)}`,
    `C ${(a[0] + 150).toFixed(0)} ${(a[1] - 60).toFixed(0)}, ${(b[0] - 60).toFixed(0)} ${(b[1] - 120).toFixed(0)}, ${b[0].toFixed(0)} ${b[1].toFixed(0)}`,
    `C ${(b[0] + 90).toFixed(0)} ${(b[1] + 110).toFixed(0)}, ${(c[0] + 170).toFixed(0)} ${(c[1] - 90).toFixed(0)}, ${c[0].toFixed(0)} ${c[1].toFixed(0)}`,
    `C ${(c[0] + 120).toFixed(0)} ${(c[1] + 96).toFixed(0)}, ${(d[0] - 180).toFixed(0)} ${(d[1] + 44).toFixed(0)}, ${d[0].toFixed(0)} ${d[1].toFixed(0)}`,
    `C ${(d[0] - 190).toFixed(0)} ${(d[1] - 96).toFixed(0)}, ${(e[0] + 216).toFixed(0)} ${(e[1] + 246).toFixed(0)}, ${e[0].toFixed(0)} ${e[1].toFixed(0)}`,
  ].join(' ');
}

function pin(stop, index) {
  const [x, y] = px(stop.p);
  const flip = x > W * 0.62;       // labels turn inward at the right edge
  const lx = flip ? x - 34 : x + 34;
  const anchor = flip ? 'end' : 'start';
  return `<g>
    <circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="46" fill="${P.tang}" fill-opacity="0.13"/>
    <circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="23" fill="${P.canvas}" stroke="${P.tang}" stroke-width="2.6"/>
    <text x="${x.toFixed(0)}" y="${(y + 9).toFixed(0)}" font-family="${FONT_MONO}" font-size="24" font-weight="700" fill="${P.tang}" text-anchor="middle">${index + 1}</text>
    <text x="${lx.toFixed(0)}" y="${(y - 4).toFixed(0)}" font-family="${FONT_SANS}" font-size="31" font-weight="600" fill="${P.canvas}" stroke="${P.canvas}" stroke-width="8" stroke-linejoin="round" text-anchor="${anchor}">${stop.name}</text>
    <text x="${lx.toFixed(0)}" y="${(y - 4).toFixed(0)}" font-family="${FONT_SANS}" font-size="31" font-weight="600" fill="${P.ink}" text-anchor="${anchor}">${stop.name}</text>
    <text x="${lx.toFixed(0)}" y="${(y + 30).toFixed(0)}" font-family="${FONT_MONO}" font-size="23" fill="${P.canvas}" stroke="${P.canvas}" stroke-width="7" stroke-linejoin="round" text-anchor="${anchor}">${stop.time}</text>
    <text x="${lx.toFixed(0)}" y="${(y + 30).toFixed(0)}" font-family="${FONT_MONO}" font-size="23" fill="${P.amber}" text-anchor="${anchor}">${stop.time}</text>
  </g>`;
}

function mapSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="ground" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0%" stop-color="${mix(P.canvas, P.surface2, 0.55)}"/>
      <stop offset="52%" stop-color="${P.canvas}"/>
      <stop offset="100%" stop-color="${P.deep}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#ground)"/>
  <g>${streets()}</g>
  <g>${hill()}</g>
  <path d="${RIVER}" fill="none" stroke="${P.teal}" stroke-opacity="0.5" stroke-width="9" stroke-linecap="round"/>
  <path d="${RIVER}" fill="none" stroke="${P.tealHi}" stroke-opacity="0.25" stroke-width="2" stroke-linecap="round"/>
  <text x="${(W * 0.82).toFixed(0)}" y="${(H * 0.565).toFixed(0)}" font-family="${FONT_SANS}" font-size="24" fill="${P.tealHi}" fill-opacity="0.8">청계천</text>

  <path d="${routePath()}" fill="none" stroke="${P.canvas}" stroke-opacity="0.85" stroke-width="13" stroke-linecap="round"/>
  <path d="${routePath()}" fill="none" stroke="${P.tang}" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="15 13"/>

  <g>${STOPS.map(pin).join('')}</g>

  <g>
    <text x="64" y="90" font-family="${FONT_MONO}" font-size="23" letter-spacing="5" fill="${P.inkSubtle}">SEOUL · 17:30 → 21:00</text>
    <line x1="64" y1="118" x2="${W - 64}" y2="118" stroke="${P.hairline}" stroke-width="1"/>
    <path d="M ${W - 96} 96 L ${W - 96} 44 M ${W - 108} 60 L ${W - 96} 44 L ${W - 84} 60" fill="none" stroke="${P.inkSubtle}" stroke-width="2"/>
    <text x="${W - 96}" y="${118 - 4}" font-family="${FONT_MONO}" font-size="19" fill="${P.inkSubtle}" text-anchor="middle">N</text>

    <line x1="64" y1="${H - 96}" x2="248" y2="${H - 96}" stroke="${P.inkSubtle}" stroke-width="2"/>
    <line x1="64" y1="${H - 106}" x2="64" y2="${H - 86}" stroke="${P.inkSubtle}" stroke-width="2"/>
    <line x1="248" y1="${H - 106}" x2="248" y2="${H - 86}" stroke="${P.inkSubtle}" stroke-width="2"/>
    <text x="64" y="${H - 62}" font-family="${FONT_MONO}" font-size="21" fill="${P.inkSubtle}">0 ——— 1 km</text>
    <text x="${W - 64}" y="${H - 62}" font-family="${FONT_MONO}" font-size="21" fill="${P.inkSubtle}" text-anchor="end">SAMPLE DATA · 5.8 km</text>
  </g>
</svg>`;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const buf = await sharp(Buffer.from(mapSvg())).webp({ quality: 84 }).toBuffer();
  await writeFile(path.join(OUT, 'route.webp'), buf);
  console.log(`route.webp  ${W}x${H}  ${(buf.length / 1024).toFixed(0)} KB`);
}

main().catch((err) => { console.error(err); process.exit(1); });
