#!/usr/bin/env node
/**
 * make-compare.mjs — three plates for 06-compare (wipe-transform).
 *
 * The same chart three times, with a different mode of transport lit each time,
 * so the diagonal wipe reads as one surface becoming the next rather than as
 * three unrelated slides. images[0] and images[1] are the two full-bleed
 * surfaces; images[2] is the sheet that rises at the third step.
 *
 * Layout note: the template owns the lower left (its numbered caption and the
 * scene title) and the lower right (the sheet that rises at step three). A
 * 1600×1000 plate maps 1:1 onto a 1440×900 stage, so everything the plate has to
 * say is kept above y≈600 and the footnote goes to the far bottom right.
 *
 *   NODE_PATH=<dir with sharp> node tools/make-compare.mjs
 */
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { P, mix, FONT_SANS, FONT_MONO, FONT_SERIF } from './palette.mjs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'public', 'media', '06-compare');

const W = 1600;
const H = 1000;

/** Sample figures for one 5.8 km evening loop. Not fares anyone should budget on. */
const MODES = [
  { key: 'transit', name: '대중교통', en: 'TRANSIT', cost: 1700, mins: 52 },
  { key: 'walk', name: '도보', en: 'ON FOOT', cost: 0, mins: 100 },
  { key: 'taxi', name: '택시', en: 'TAXI', cost: 14800, mins: 31 },
];

const MAXCOST = 14800;
const MAXMINS = 100;
const ROWS = [364, 446, 528];
const BAR = 34;

const won = (n) => (n === 0 ? '0원' : `${n.toLocaleString('en-US')}원`);
const mins = (n) => (n >= 60 ? `${Math.floor(n / 60)}시간 ${n % 60}분` : `${n}분`);

function panel({ x, labelW, barMax, title, unit, scale, value, format, active }) {
  const head = `<text x="${x}" y="296" font-family="${FONT_SANS}" font-size="32" font-weight="600" fill="${P.ink}">${title}</text>
    <text x="${x + labelW + barMax}" y="296" font-family="${FONT_MONO}" font-size="21" fill="${P.inkSubtle}" text-anchor="end">${unit}</text>
    <line x1="${x}" y1="320" x2="${x + labelW + barMax}" y2="320" stroke="${P.hairline}" stroke-width="1.5"/>`;
  const rows = MODES.map((m, i) => {
    const y = ROWS[i];
    const on = m.key === active;
    const w = Math.max(5, (value(m) / scale) * barMax);
    return `<g>
      <text x="${x}" y="${y + BAR - 8}" font-family="${FONT_SANS}" font-size="27" font-weight="${on ? 700 : 400}" fill="${on ? P.ink : P.inkSubtle}">${m.name}</text>
      <rect x="${x + labelW}" y="${y}" width="${w.toFixed(0)}" height="${BAR}" rx="4" fill="${on ? P.tang : mix(P.surface3, P.teal, 0.22)}" fill-opacity="${on ? 0.95 : 0.55}"/>
      <text x="${(x + labelW + w + 16).toFixed(0)}" y="${y + BAR - 7}" font-family="${FONT_MONO}" font-size="26" font-weight="${on ? 700 : 400}" fill="${on ? P.amber : P.inkSubtle}">${format(m)}</text>
    </g>`;
  }).join('');
  return head + rows;
}

function plateSvg(mode, index) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0.05" y1="0" x2="0.95" y2="1">
      <stop offset="0%" stop-color="${mix(P.surface2, P.tang, 0.05 + index * 0.05)}"/>
      <stop offset="50%" stop-color="${P.canvas}"/>
      <stop offset="100%" stop-color="${P.deep}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${P.tang}" stop-opacity="0.14"/>
      <stop offset="55%" stop-color="${P.tang}" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="${P.tang}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="${1560 - index * 60}" cy="${58 + index * 30}" r="300" fill="url(#glow)"/>

  <text x="110" y="108" font-family="${FONT_MONO}" font-size="23" letter-spacing="6" fill="${P.inkSubtle}">0${index + 1} / 03 · ${mode.en}</text>
  <text x="110" y="204" font-family="${FONT_SERIF}" font-size="78" font-weight="700" fill="${P.ink}">${mode.name}</text>
  <text x="${W - 110}" y="204" font-family="${FONT_MONO}" font-size="32" fill="${P.tang}" text-anchor="end">${won(mode.cost)} · ${mins(mode.mins)}</text>
  <line x1="110" y1="238" x2="${W - 110}" y2="238" stroke="${P.hairline}" stroke-width="2"/>

  ${panel({ x: 110, labelW: 150, barMax: 400, title: '요금', unit: '원', scale: MAXCOST, active: mode.key, value: (m) => m.cost, format: (m) => won(m.cost) })}
  ${panel({ x: 900, labelW: 150, barMax: 320, title: '걸리는 시간', unit: '분', scale: MAXMINS, active: mode.key, value: (m) => m.mins, format: (m) => mins(m.mins) })}

  <text x="${W - 110}" y="968" font-family="${FONT_MONO}" font-size="21" letter-spacing="3" fill="${P.inkSubtle}" text-anchor="end">SAMPLE DATA · 5.8 km 기준 예시 수치</text>
</svg>`;
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  for (const [i, mode] of MODES.entries()) {
    const buf = await sharp(Buffer.from(plateSvg(mode, i))).webp({ quality: 84 }).toBuffer();
    await writeFile(path.join(OUT, `mode-0${i + 1}-${mode.key}.webp`), buf);
    console.log(`mode-0${i + 1}-${mode.key}.webp  ${(buf.length / 1024).toFixed(0)} KB`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
