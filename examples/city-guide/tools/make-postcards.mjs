#!/usr/bin/env node
/**
 * make-postcards.mjs — six 16:9 postcards for 03-postcards (paper-assembly).
 *
 * One card per stop, plus the ride home. Each card is a flat vector scene in the
 * deck palette with a perforated stamp and the timestamp of that stop.
 *
 * The fan geometry is fixed by the template: six sheets spread across 94% of one
 * sheet's width, so every card but the last shows only its left ~19%. That strip
 * is therefore drawn as a spine carrying the stop number and the time, and the
 * fan reads as a numbered day even where the pictures are covered. The template
 * crops its sheets to 16/9, which is why the cards are drawn at that ratio.
 *
 *   NODE_PATH=<dir with sharp> node tools/make-postcards.mjs
 */
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { P, mix, rng, FONT_SANS, FONT_MONO, FONT_SERIF } from './palette.mjs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'public', 'media', '03-postcards');

const W = 1200;
const H = 675;
const FLOOR = 512;         // where every scene stands
const CAPTION = 560;       // the caption rule

/* ---------- six scenes ---------- */

/** 01 · 경복궁 돌담길 — a stone wall, a tiled roof, the last of the sun. */
function palace(sky) {
  const r = rng(11);
  const stones = Array.from({ length: 70 }, (_, i) => {
    const row = Math.floor(i / 14);
    const x = 40 + (i % 14) * 82 + (row % 2 ? 40 : 0);
    const y = FLOOR - 128 + row * 26;
    return `<rect x="${x}" y="${y}" width="${(60 + r() * 16).toFixed(0)}" height="20" rx="3" fill="${mix(P.surface2, P.tang, 0.12 + r() * 0.1)}" fill-opacity="${(0.5 + r() * 0.4).toFixed(2)}"/>`;
  }).join('');
  return `
    <circle cx="880" cy="300" r="62" fill="${P.amber}" fill-opacity="0.9"/>
    <circle cx="880" cy="300" r="150" fill="${P.amber}" fill-opacity="0.1"/>
    <path d="M 0 ${FLOOR - 150} L 1200 ${FLOOR - 150} L 1200 ${FLOOR} L 0 ${FLOOR} Z" fill="${mix(sky, P.deep, 0.62)}"/>
    <g>${stones}</g>
    <path d="M -20 ${FLOOR - 150} L 240 ${FLOOR - 196} L 620 ${FLOOR - 182} L 1220 ${FLOOR - 154} L 1220 ${FLOOR - 138} L -20 ${FLOOR - 134} Z" fill="${P.deep}"/>
    <rect x="470" y="${FLOOR - 134}" width="150" height="134" fill="${P.deep}"/>
    <rect x="496" y="${FLOOR - 110}" width="98" height="110" rx="49" fill="${P.tang}" fill-opacity="0.28"/>
    <rect x="0" y="${FLOOR}" width="${W}" height="${H - FLOOR}" fill="${P.deep}"/>`;
}

/** 02 · 서촌 골목 — an alley of signs, one window already lit. */
function alley(sky) {
  const r = rng(23);
  const signs = Array.from({ length: 9 }, (_, i) => {
    const x = 90 + i * 124;
    const y = 188 + r() * 120;
    const w = 26 + r() * 20;
    const h = 96 + r() * 96;
    const lit = i % 3 === 1;
    return `<g><line x1="${x + w / 2}" y1="0" x2="${x + w / 2}" y2="${y}" stroke="${P.hairline}" stroke-width="2"/>`
      + `<rect x="${x}" y="${y}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${lit ? P.tang : mix(sky, P.deep, 0.5)}" fill-opacity="${lit ? 0.88 : 0.75}"/></g>`;
  }).join('');
  const windows = Array.from({ length: 16 }, (_, i) => {
    const x = 60 + (i % 8) * 142;
    const y = FLOOR - 118 + Math.floor(i / 8) * 56;
    const on = r() > 0.45;
    return `<rect x="${x}" y="${y}" width="46" height="34" fill="${on ? P.amber : P.surface3}" fill-opacity="${on ? 0.85 : 0.6}"/>`;
  }).join('');
  return `
    <path d="M 0 ${FLOOR - 236} L 1200 ${FLOOR - 236} L 1200 ${FLOOR} L 0 ${FLOOR} Z" fill="${mix(sky, P.deep, 0.7)}"/>
    <g>${windows}</g>
    <g>${signs}</g>
    <rect x="0" y="${FLOOR}" width="${W}" height="${H - FLOOR}" fill="${P.deep}"/>
    <path d="M 420 ${FLOOR} L 560 ${H} L 640 ${H} L 700 ${FLOOR} Z" fill="${P.amber}" fill-opacity="0.16"/>`;
}

/** 03 · 인왕산 자락길 — two hundred steps, the city turning orange below. */
function stairs(sky) {
  const steps = Array.from({ length: 13 }, (_, i) => {
    const y = FLOOR - i * 27;
    const inset = 300 + i * 26;
    return `<path d="M ${inset} ${y} L ${1200 - inset} ${y} L ${1200 - inset - 22} ${y - 18} L ${inset + 22} ${y - 18} Z" fill="${mix(P.surface2, P.tang, 0.05 + i * 0.045)}"/>`;
  }).join('');
  return `
    <path d="M -40 ${FLOOR - 40} C 220 ${FLOOR - 250}, 420 ${FLOOR - 330}, 600 ${FLOOR - 340} C 800 ${FLOOR - 330}, 1000 ${FLOOR - 240}, 1240 ${FLOOR - 40} Z" fill="${mix(sky, P.deep, 0.55)}"/>
    <path d="M -40 ${FLOOR - 10} C 260 ${FLOOR - 170}, 460 ${FLOOR - 230}, 600 ${FLOOR - 238} C 780 ${FLOOR - 228}, 980 ${FLOOR - 160}, 1240 ${FLOOR - 10} Z" fill="${mix(sky, P.deep, 0.75)}"/>
    <g>${steps}</g>
    <ellipse cx="60" cy="${FLOOR - 10}" rx="340" ry="150" fill="${P.tang}" fill-opacity="0.16"/>
    <ellipse cx="1140" cy="${FLOOR - 10}" rx="340" ry="150" fill="${P.amber}" fill-opacity="0.14"/>
    <g>${Array.from({ length: 22 }, (_, i) => {
      const side = i % 2 === 0;
      const k = Math.floor(i / 2);
      const x = side ? 26 + k * 24 : 1174 - k * 24;
      const h = 10 + ((i * 37) % 26);
      const y = FLOOR - 26 - k * 13;
      return `<rect x="${x}" y="${y - h}" width="8" height="${h}" fill="${side ? P.tang : P.amber}" fill-opacity="0.62"/>`;
    }).join('')}</g>
    <rect x="0" y="${FLOOR}" width="${W}" height="${H - FLOOR}" fill="${P.deep}"/>`;
}

/** 04 · 광장시장 — a stall, a row of bulbs, one bowl. */
function market(sky) {
  const bulbs = Array.from({ length: 11 }, (_, i) => {
    const x = 120 + i * 96;
    const y = 176 + Math.sin(i * 0.9) * 22;
    return `<g><line x1="${x}" y1="${y - 40}" x2="${x}" y2="${y}" stroke="${P.hairline}" stroke-width="2"/>`
      + `<circle cx="${x}" cy="${y + 10}" r="11" fill="${P.amber}"/><circle cx="${x}" cy="${y + 10}" r="30" fill="${P.amber}" fill-opacity="0.16"/></g>`;
  }).join('');
  return `
    <path d="M 60 ${176} C 400 ${128}, 800 ${128}, 1140 ${176}" fill="none" stroke="${P.hairline}" stroke-width="2"/>
    <g>${bulbs}</g>
    <path d="M 120 ${FLOOR - 220} L 1080 ${FLOOR - 220} L 1010 ${FLOOR - 166} L 190 ${FLOOR - 166} Z" fill="${P.tang}" fill-opacity="0.75"/>
    <rect x="190" y="${FLOOR - 166}" width="820" height="166" fill="${mix(sky, P.deep, 0.66)}"/>
    <g>${Array.from({ length: 7 }, (_, i) =>
      `<rect x="${236 + i * 108}" y="${FLOOR - 120}" width="72" height="18" rx="9" fill="${P.amber}" fill-opacity="${(0.4 + (i % 3) * 0.2).toFixed(2)}"/>`).join('')}</g>
    <ellipse cx="600" cy="${FLOOR - 52}" rx="96" ry="30" fill="${P.ink}" fill-opacity="0.9"/>
    <ellipse cx="600" cy="${FLOOR - 58}" rx="78" ry="21" fill="${P.tang}" fill-opacity="0.6"/>
    <rect x="0" y="${FLOOR}" width="${W}" height="${H - FLOOR}" fill="${P.deep}"/>`;
}

/** 05 · 청계천 하류 — water, stepping stones, signs read twice. */
function stream(sky) {
  const r = rng(51);
  const ripples = Array.from({ length: 16 }, (_, i) => {
    const y = FLOOR - 150 + i * 16;
    return `<line x1="${(40 + r() * 200).toFixed(0)}" y1="${y}" x2="${(700 + r() * 440).toFixed(0)}" y2="${y}" stroke="${P.tealHi}" stroke-opacity="${(0.06 + r() * 0.16).toFixed(2)}" stroke-width="2"/>`;
  }).join('');
  const marks = Array.from({ length: 7 }, (_, i) =>
    `<rect x="${150 + i * 140}" y="${FLOOR - 128}" width="16" height="${(40 + r() * 70).toFixed(0)}" fill="${i % 2 ? P.tang : P.amber}" fill-opacity="0.45"/>`).join('');
  const stones = Array.from({ length: 6 }, (_, i) =>
    `<ellipse cx="${190 + i * 166}" cy="${FLOOR - 46 + (i % 2 ? 12 : 0)}" rx="44" ry="13" fill="${mix(P.surface3, P.teal, 0.32)}" fill-opacity="0.9"/>`).join('');
  return `
    <rect x="0" y="0" width="${W}" height="${FLOOR - 176}" fill="${mix(sky, P.deep, 0.35)}"/>
    <g>${Array.from({ length: 9 }, (_, i) =>
      `<rect x="${60 + i * 132}" y="${FLOOR - 176 - (60 + ((i * 53) % 110))}" width="86" height="${60 + ((i * 53) % 110)}" fill="${P.deep}"/>`).join('')}</g>
    <g>${Array.from({ length: 18 }, (_, i) =>
      `<rect x="${78 + (i % 9) * 132}" y="${FLOOR - 220 + Math.floor(i / 9) * 26}" width="14" height="14" fill="${P.amber}" fill-opacity="0.8"/>`).join('')}</g>
    <rect x="0" y="${FLOOR - 176}" width="${W}" height="${H - FLOOR + 176}" fill="${mix(P.teal, P.deep, 0.78)}"/>
    <g>${marks}</g>
    <g>${ripples}</g>
    <g>${stones}</g>`;
}

/** 06 · 집으로 — the city runs past a train window, and the moon keeps up. */
function ride(sky) {
  const blocks = Array.from({ length: 22 }, (_, i) => {
    const h = 40 + ((i * 71) % 150);
    return `<rect x="${(i * 58) - 10}" y="${FLOOR - 120 - h}" width="42" height="${h}" fill="${P.deep}"/>`;
  }).join('');
  const streaks = Array.from({ length: 12 }, (_, i) =>
    `<rect x="${60 + i * 96}" y="${300 + ((i * 47) % 130)}" width="${120 + ((i * 29) % 90)}" height="4" rx="2" fill="${P.amber}" fill-opacity="${(0.2 + (i % 4) * 0.14).toFixed(2)}"/>`).join('');
  return `
    <rect x="0" y="0" width="${W}" height="${H}" fill="${mix(sky, P.deep, 0.42)}"/>
    <circle cx="700" cy="188" r="42" fill="${P.ink}" fill-opacity="0.9"/>
    <circle cx="718" cy="178" r="36" fill="${mix(sky, P.deep, 0.42)}"/>
    <g>${blocks}</g>
    <g>${streaks}</g>
    <rect x="0" y="${FLOOR - 120}" width="${W}" height="${H - FLOOR + 120}" fill="${P.deep}"/>
    <rect x="86" y="86" width="${W - 172}" height="${FLOOR - 40}" rx="46" fill="none" stroke="${P.surface3}" stroke-width="58"/>
    <rect x="86" y="86" width="${W - 172}" height="${FLOOR - 40}" rx="46" fill="none" stroke="${P.hairline}" stroke-width="3"/>`;
}

const CARDS = [
  { id: '01', time: '17:30', name: '경복궁 돌담길', note: '서십자각에서 영추문까지, 해는 아직 지붕 위에', sky: '#e79f63', draw: palace },
  { id: '02', time: '18:20', name: '서촌 골목', note: '간판에 불이 먼저 들어오는 시간', sky: '#c56f77', draw: alley },
  { id: '03', time: '19:10', name: '인왕산 자락길', note: '계단 200개, 도시가 발밑에서 주황으로', sky: '#9a5480', draw: stairs },
  { id: '04', time: '20:00', name: '광장시장', note: '빈대떡 한 장, 국수 한 그릇, 가장 오래 앉는 자리', sky: '#6d3f76', draw: market },
  { id: '05', time: '20:50', name: '청계천 하류', note: '물 위로 간판이 한 번 더 보인다', sky: '#3a2a62', draw: stream },
  { id: '06', time: '21:20', name: '집으로', note: '창밖으로 오늘 걸은 길이 거꾸로 지나간다', sky: '#241c48', draw: ride },
];

function stamp(card) {
  const x = 1000;
  const y = 44;
  const w = 152;
  const h = 176;
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${P.canvas}" fill-opacity="0.92" stroke="${P.inkSubtle}" stroke-width="2.5" stroke-dasharray="7 7"/>
    <rect x="${x + 14}" y="${y + 14}" width="${w - 28}" height="${h - 62}" fill="${mix(card.sky, P.deep, 0.45)}"/>
    <circle cx="${x + w / 2}" cy="${y + 60}" r="26" fill="${P.amber}" fill-opacity="0.85"/>
    <path d="M ${x + 14} ${y + h - 48} L ${x + 52} ${y + 74} L ${x + 92} ${y + h - 48} Z" fill="${P.deep}"/>
    <path d="M ${x + 62} ${y + h - 48} L ${x + 106} ${y + 92} L ${x + w - 14} ${y + h - 48} Z" fill="${P.deep}" fill-opacity="0.8"/>
    <text x="${x + w / 2}" y="${y + h - 16}" font-family="${FONT_MONO}" font-size="27" font-weight="700" fill="${P.tang}" text-anchor="middle">${card.time}</text>
    <g transform="translate(${x - 46} ${y + h + 6})">
      <circle r="47" fill="${P.canvas}" fill-opacity="0.72"/>
      <circle r="46" fill="none" stroke="${P.tealHi}" stroke-opacity="0.55" stroke-width="2.5"/>
      <circle r="38" fill="none" stroke="${P.tealHi}" stroke-opacity="0.3" stroke-width="1.5"/>
      <text y="-6" font-family="${FONT_MONO}" font-size="16" fill="${P.tealHi}" fill-opacity="0.8" text-anchor="middle">SEOUL</text>
      <text y="16" font-family="${FONT_MONO}" font-size="16" fill="${P.tealHi}" fill-opacity="0.8" text-anchor="middle">${card.id}/06</text>
    </g>
  </g>`;
}

/** The left strip: what the fan shows of every card except the last one. */
function spine(card, index) {
  const w = 196;
  return `<g>
    <rect x="0" y="0" width="${w}" height="${H}" fill="${P.canvas}" fill-opacity="0.86"/>
    <line x1="${w}" y1="0" x2="${w}" y2="${H}" stroke="${P.hairline}" stroke-width="2"/>
    <text x="34" y="128" font-family="${FONT_MONO}" font-size="21" letter-spacing="4" fill="${P.inkSubtle}">0${index + 1}/06</text>
    <text x="30" y="352" font-family="${FONT_SERIF}" font-size="132" font-weight="700" fill="${P.tang}">${card.id}</text>
    <line x1="34" y1="392" x2="${w - 34}" y2="392" stroke="${P.hairline}" stroke-width="2"/>
    <text x="34" y="446" font-family="${FONT_MONO}" font-size="34" fill="${P.amber}">${card.time}</text>
    <text x="34" y="${H - 52}" font-family="${FONT_MONO}" font-size="18" letter-spacing="3" fill="${P.inkSubtle}">SEOUL</text>
  </g>`;
}

function cardSvg(card, index) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${mix(card.sky, P.deep, 0.34)}"/>
      <stop offset="62%" stop-color="${mix(card.sky, P.deep, 0.08)}"/>
      <stop offset="100%" stop-color="${mix(card.sky, P.amber, 0.22)}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${card.draw(card.sky)}
  <rect x="0" y="${CAPTION - 48}" width="${W}" height="${H - CAPTION + 48}" fill="${P.canvas}" fill-opacity="0.9"/>
  <line x1="232" y1="${CAPTION}" x2="${W - 56}" y2="${CAPTION}" stroke="${P.hairline}" stroke-width="1.5"/>
  <text x="232" y="${CAPTION + 56}" font-family="${FONT_SANS}" font-size="46" font-weight="700" fill="${P.ink}">${card.name}</text>
  <text x="232" y="${CAPTION + 96}" font-family="${FONT_SANS}" font-size="25" fill="${P.inkMuted}">${card.note}</text>
  <text x="${W - 56}" y="${CAPTION + 56}" font-family="${FONT_MONO}" font-size="40" fill="${P.tang}" text-anchor="end">${card.time}</text>
  <text x="${W - 56}" y="${CAPTION + 94}" font-family="${FONT_MONO}" font-size="20" letter-spacing="3" fill="${P.inkSubtle}" text-anchor="end">SAMPLE DATA</text>
  ${spine(card, index)}
  ${stamp(card)}
</svg>`;
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  let bytes = 0;
  for (const [index, card] of CARDS.entries()) {
    const buf = await sharp(Buffer.from(cardSvg(card, index))).webp({ quality: 80 }).toBuffer();
    await writeFile(path.join(OUT, `card-${card.id}.webp`), buf);
    bytes += buf.length;
    console.log(`card-${card.id}.webp  ${(buf.length / 1024).toFixed(0)} KB  ${card.name}`);
  }
  console.log(`postcards: ${CARDS.length} · ${(bytes / 1024).toFixed(0)} KB`);
}

main().catch((err) => { console.error(err); process.exit(1); });
