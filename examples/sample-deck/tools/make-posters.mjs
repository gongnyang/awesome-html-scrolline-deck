#!/usr/bin/env node
/**
 * make-posters.mjs — six typographic plates for the horizontal-gallery scene.
 *
 * Text-only, drawn from the same tokens the deck uses, so the rail stays inside
 * the palette and needs no photography.
 *
 *   NODE_PATH=<dir with sharp> node tools/make-posters.mjs
 */
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'public', 'media', 'gallery');

const W = 900;
const H = 1200;
const CANVAS = '#010102';
const SURFACE = '#0f1011';
const ACCENT = '#5e6ad2';
const ACCENT_HI = '#828fff';
const INK = '#f7f8f8';
const SUBTLE = '#8a8f98';
const HAIR = '#23252a';
const FONT = "'Noto Sans CJK KR','Pretendard Variable',sans-serif";

const PLATES = [
  { n: '01', en: 'FRAME SCRUB', ko: '프레임 스크럽', note: '영상 한 컷을 스크롤에 묶는다', mark: 'strip' },
  { n: '02', en: 'WORD RELAY', ko: '단어 릴레이', note: '한 번에 한 단어만 말한다', mark: 'relay' },
  { n: '03', en: 'KINETIC TITLES', ko: '키네틱 타이틀', note: '차례가 스스로 조립된다', mark: 'kinetic' },
  { n: '04', en: 'HORIZONTAL GALLERY', ko: '수평 갤러리', note: '세로로 굴리면 가로로 흐른다', mark: 'rail' },
  { n: '05', en: 'ODOMETER', ko: '오도미터', note: '숫자가 굴러서 도착한다', mark: 'digits' },
  { n: '06', en: 'CLOSING QR', ko: '클로징 QR', note: '마지막 화면이 곧 링크다', mark: 'grid' },
];

function mark(kind) {
  const cx = W / 2;
  const top = 470;
  if (kind === 'strip') {
    return Array.from({ length: 7 }, (_, i) =>
      `<rect x="${cx - 236 + i * 68}" y="${top}" width="52" height="150" fill="none" stroke="${ACCENT}" stroke-opacity="${(0.25 + i * 0.1).toFixed(2)}" stroke-width="1.5"/>`
    ).join('');
  }
  if (kind === 'relay') {
    return Array.from({ length: 4 }, (_, i) =>
      `<line x1="${cx - 220 + i * 40}" y1="${top + 30 + i * 32}" x2="${cx + 120 + i * 30}" y2="${top + 30 + i * 32}" stroke="${i === 2 ? ACCENT_HI : INK}" stroke-opacity="${i === 2 ? 0.9 : 0.22}" stroke-width="${i === 2 ? 4 : 2}" stroke-linecap="round"/>`
    ).join('');
  }
  if (kind === 'kinetic') {
    return Array.from({ length: 5 }, (_, i) =>
      `<rect x="${cx - 200 + i * 26}" y="${top + i * 28}" width="${330 - i * 30}" height="14" rx="7" fill="${ACCENT}" fill-opacity="${(0.9 - i * 0.16).toFixed(2)}"/>`
    ).join('');
  }
  if (kind === 'rail') {
    return (
      `<line x1="${cx - 280}" y1="${top + 80}" x2="${cx + 280}" y2="${top + 80}" stroke="${HAIR}" stroke-width="1"/>` +
      Array.from({ length: 5 }, (_, i) =>
        `<rect x="${cx - 255 + i * 110}" y="${top + 20 + (i === 2 ? -18 : 0)}" width="86" height="${i === 2 ? 156 : 120}" fill="none" stroke="${i === 2 ? ACCENT_HI : INK}" stroke-opacity="${i === 2 ? 0.85 : 0.2}" stroke-width="1.5"/>`
      ).join('')
    );
  }
  if (kind === 'digits') {
    return Array.from({ length: 4 }, (_, i) =>
      `<g><rect x="${cx - 214 + i * 112}" y="${top}" width="92" height="150" fill="none" stroke="${HAIR}" stroke-width="1"/>` +
      `<text x="${cx - 168 + i * 112}" y="${top + 104}" font-family="${FONT}" font-size="76" font-weight="700" fill="${i === 3 ? ACCENT_HI : INK}" fill-opacity="${i === 3 ? 1 : 0.28}" text-anchor="middle">${[3, 6, 9, 0][i]}</text></g>`
    ).join('');
  }
  return Array.from({ length: 36 }, (_, i) => {
    const r = Math.floor(i / 6);
    const c = i % 6;
    const on = [0, 1, 2, 5, 6, 10, 12, 14, 17, 19, 20, 23, 24, 28, 30, 31, 33, 35].includes(i);
    return `<rect x="${cx - 150 + c * 50}" y="${top + r * 26}" width="42" height="20" fill="${on ? ACCENT : INK}" fill-opacity="${on ? 0.85 : 0.08}"/>`;
  }).join('');
}

function plateSvg(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="wash" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.16"/>
      <stop offset="60%" stop-color="${SURFACE}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${CANVAS}" stop-opacity="1"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${CANVAS}"/>
  <rect width="${W}" height="${H}" fill="url(#wash)"/>
  <line x1="72" y1="150" x2="${W - 72}" y2="150" stroke="${HAIR}" stroke-width="1"/>
  <line x1="72" y1="${H - 150}" x2="${W - 72}" y2="${H - 150}" stroke="${HAIR}" stroke-width="1"/>
  <text x="72" y="118" font-family="${FONT}" font-size="34" font-weight="700" letter-spacing="6" fill="${ACCENT_HI}">${p.n}</text>
  <text x="${W - 72}" y="118" font-family="${FONT}" font-size="22" letter-spacing="5" fill="${SUBTLE}" text-anchor="end">SCROLLINE</text>
  <text x="72" y="268" font-family="${FONT}" font-size="54" font-weight="700" letter-spacing="-1" fill="${INK}">${p.ko}</text>
  <text x="72" y="340" font-family="${FONT}" font-size="26" letter-spacing="4" fill="${SUBTLE}">${p.en}</text>
  <g>${mark(p.mark)}</g>
  <text x="72" y="${H - 190}" font-family="${FONT}" font-size="30" fill="${INK}" fill-opacity="0.72">${p.note}</text>
  <text x="72" y="${H - 92}" font-family="${FONT}" font-size="20" letter-spacing="3" fill="${SUBTLE}">ENTER · HOLD · EXIT</text>
</svg>`;
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  for (const p of PLATES) {
    const buf = await sharp(Buffer.from(plateSvg(p))).webp({ quality: 82 }).toBuffer();
    await writeFile(path.join(OUT, `plate-${p.n}.webp`), buf);
    console.log(`plate-${p.n}.webp  ${(buf.length / 1024).toFixed(0)} KB`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
