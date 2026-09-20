#!/usr/bin/env node
/**
 * make-closing.mjs — the mark that sits beside the QR on 07-close.
 *
 * `closing-qr` puts assets.images[1] in the bottom right under a radial mask,
 * so this is drawn as a loop that fades out towards its own edges: the day's
 * route closed into a circle, five stops on it, the moon over the top.
 *
 *   NODE_PATH=<dir with sharp> node tools/make-closing.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { P, mix, FONT_MONO } from './palette.mjs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'public', 'media', '07-close');

const S = 900;
const CX = S / 2;
const CY = S / 2 + 20;
const R = 268;

const TIMES = ['17:30', '18:20', '19:10', '20:00', '20:50'];

function markSvg() {
  const stops = TIMES.map((_time, i) => {
    const a = (-90 + i * 72) * (Math.PI / 180);
    const x = CX + Math.cos(a) * R;
    const y = CY + Math.sin(a) * R;
    return `<g>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="28" fill="${P.tang}" fill-opacity="0.16"/>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="14" fill="${P.canvas}" stroke="${P.tang}" stroke-width="3.4"/>
    </g>`;
  }).join('');

  // a walker, small, standing on the loop where the day starts
  const wx = CX;
  const wy = CY - R;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <radialGradient id="bloom" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${P.teal}" stop-opacity="0.2"/>
      <stop offset="62%" stop-color="${mix(P.teal, P.canvas, 0.6)}" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="${P.canvas}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="${CX}" cy="${CY}" r="${S / 2}" fill="url(#bloom)"/>
  <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${P.hairline}" stroke-width="10"/>
  <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${P.tang}" stroke-width="3" stroke-linecap="round" stroke-dasharray="15 13"/>
  <circle cx="${CX}" cy="${CY}" r="${R - 74}" fill="none" stroke="${P.teal}" stroke-opacity="0.22" stroke-width="1.5" stroke-dasharray="3 11"/>
  <circle cx="${CX + 92}" cy="${CY - 66}" r="34" fill="${P.ink}" fill-opacity="0.9"/>
  <circle cx="${CX + 104}" cy="${CY - 74}" r="28" fill="${P.canvas}"/>
  <text x="${CX}" y="${CY + 96}" font-family="${FONT_MONO}" font-size="24" letter-spacing="6" fill="${P.inkSubtle}" text-anchor="middle">5.8 KM · 5 STOPS</text>
  <g>${stops}</g>
  <g>
    <circle cx="${wx}" cy="${wy - 34}" r="15" fill="${P.tealHi}"/>
    <path d="M ${wx - 22} ${wy + 4} C ${wx - 20} ${wy - 26}, ${wx + 20} ${wy - 26}, ${wx + 22} ${wy + 4} Z" fill="${P.tealHi}"/>
  </g>
</svg>`;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const buf = await sharp(Buffer.from(markSvg())).webp({ quality: 84 }).toBuffer();
  await writeFile(path.join(OUT, 'loop.webp'), buf);
  console.log(`loop.webp  ${S}x${S}  ${(buf.length / 1024).toFixed(0)} KB`);
}

main().catch((err) => { console.error(err); process.exit(1); });
