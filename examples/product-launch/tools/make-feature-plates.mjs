#!/usr/bin/env node
/**
 * make-feature-plates.mjs — the five plates the 04-features rail pans across.
 *
 * Each plate is a chart, not a caption on a photo: a bar comparison, a curve, a
 * column chart, a bitrate ladder and a swatch row. They are 1600×1000 (the 16:10
 * the deck is projected at) so `object-fit: cover` has nothing to crop, and all
 * of the drawing stays above y≈600 because the scene's own caption sits in the
 * bottom-left corner over a scrim.
 *
 *   NODE_PATH=/mnt/d/2026-06-site/node_modules node tools/make-feature-plates.mjs
 */
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAL, FONT_MONO, FONT_DISPLAY, ground, text, line } from './lib/nimbus.mjs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'public', 'media', '04-features');

const W = 1600;
const H = 1000;
const L = 96;           // left margin
const Rt = W - 96;      // right margin
const SAFE_BOTTOM = 612; // the caption owns everything under this, on the left

/** Every plate opens the same way: number, rule, headline, unit. */
function head(n, eyebrow, title, unit) {
  return line(L, 132, Rt, 132, { stroke: PAL.hairline, width: 1 })
    + text(L, 116, `${String(n).padStart(2, '0')} / 05`, { family: FONT_MONO, size: 20, fill: PAL.coral, ls: 4 })
    + text(Rt, 116, eyebrow, { family: FONT_MONO, size: 20, fill: PAL.inkSubtle, ls: 4, anchor: 'end' })
    + text(L, 220, title, { family: FONT_DISPLAY, size: 62, weight: 700, fill: PAL.ink, ls: -2 })
    + text(L, 262, unit, { family: FONT_MONO, size: 19, fill: PAL.inkSubtle, ls: 2 });
}

const foot = (note) => line(L, SAFE_BOTTOM + 44, Rt, SAFE_BOTTOM + 44, { stroke: PAL.hairline, width: 1 })
  + text(Rt, SAFE_BOTTOM + 78, note, { family: FONT_MONO, size: 17, fill: PAL.inkSubtle, ls: 2, anchor: 'end' });

const wrap = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${ground(W, H, 'plate')}
  ${body}
</svg>`;

/* ------------------------------------------------------------------ *
 * 01 — playback hours, as bars
 * ------------------------------------------------------------------ */
function plateBattery() {
  const rows = [
    { label: 'NIMBUS NB-01', value: 40, mine: true },
    { label: '경쟁 A', value: 30 },
    { label: '경쟁 B', value: 24 },
    { label: '경쟁 C', value: 20 },
  ];
  const x0 = L + 300;
  const span = Rt - x0 - 120;
  const max = 48;
  let body = head(1, 'BATTERY', '40시간, 충전기를 두고 간다', 'ANC ON · 볼륨 50% · 실험실 측정');

  // hour grid
  for (let h = 0; h <= max; h += 12) {
    const x = x0 + (span * h) / max;
    body += line(x, 322, x, 556, { stroke: PAL.hairline, width: 1, opacity: h === 0 ? 1 : 0.7 });
    body += text(x, 582, `${h}h`, { family: FONT_MONO, size: 17, fill: PAL.inkSubtle, anchor: 'middle' });
  }

  rows.forEach((row, i) => {
    const y = 338 + i * 58;
    const w = (span * row.value) / max;
    body += text(x0 - 26, y + 26, row.label, {
      family: row.mine ? FONT_DISPLAY : FONT_MONO,
      size: row.mine ? 25 : 19,
      weight: row.mine ? 700 : 400,
      fill: row.mine ? PAL.ink : PAL.inkSubtle,
      anchor: 'end',
    });
    body += `<rect x="${x0}" y="${y}" width="${w.toFixed(1)}" height="36" fill="${row.mine ? PAL.coral : PAL.surface3}" />`;
    body += text(x0 + w + 18, y + 27, `${row.value}시간`, {
      family: FONT_DISPLAY, size: row.mine ? 30 : 22, weight: 700,
      fill: row.mine ? PAL.coral : PAL.inkSubtle,
    });
  });

  // the 3-minute charge, on its own line under the axis
  body += `<rect x="${x0}" y="606" width="${((span * 5) / max).toFixed(1)}" height="12" fill="${PAL.cobalt}" />`;
  body += text(x0 + (span * 5) / max + 18, 618, '3분 충전 = 5시간 재생', { size: 22, fill: PAL.cobalt, weight: 700, family: FONT_DISPLAY });
  return wrap(body + foot('가상 제품 · 수치는 예시'));
}

/* ------------------------------------------------------------------ *
 * 02 — the noise curve
 * ------------------------------------------------------------------ */
function plateAnc() {
  const x0 = L + 220;
  const x1 = Rt - 60;
  const yTop = 320;
  const yBot = 600;
  const dbToY = (db) => yTop + ((0 - db) / 48) * (yBot - yTop); // 0 dB at the top, −48 at the floor
  const freqs = [20, 100, 500, 2000, 8000, 20000];
  const fx = (f) => x0 + ((Math.log10(f) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20))) * (x1 - x0);
  // a plausible ANC shape: deepest in the low mids, fading out by a few kHz
  const curve = [[20, -30], [60, -39], [120, -42], [300, -38], [700, -29], [1500, -19], [4000, -9], [10000, -4], [20000, -2]];

  let body = head(2, 'ACTIVE NOISE CANCELLING', '−42 dB, 엔진이 공기가 된다', '주파수별 감쇠량 · 1/3 옥타브 평균');

  for (const db of [0, -12, -24, -36, -48]) {
    const y = dbToY(db);
    body += line(x0, y, x1, y, { stroke: PAL.hairline, width: 1, opacity: db === 0 ? 1 : 0.75 });
    body += text(x0 - 22, y + 6, `${db} dB`, { family: FONT_MONO, size: 17, fill: PAL.inkSubtle, anchor: 'end' });
  }
  for (const f of freqs) {
    const x = fx(f);
    body += line(x, yTop, x, yBot, { stroke: PAL.hairline, width: 1, opacity: 0.55, dash: '2 8' });
    const label = f === 20000 ? '20kHz' : (f >= 1000 ? `${f / 1000}k` : String(f));
    body += text(x, yBot + 30, label, { family: FONT_MONO, size: 17, fill: PAL.inkSubtle, anchor: f === 20000 ? 'end' : 'middle' });
  }

  const pts = curve.map(([f, db]) => `${fx(f).toFixed(1)} ${dbToY(db).toFixed(1)}`);
  body += `<path d="M ${pts.join(' L ')}" fill="none" stroke="${PAL.coral}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" />`;
  body += `<path d="M ${fx(20).toFixed(1)} ${dbToY(0)} L ${pts.join(' L ')} L ${fx(20000).toFixed(1)} ${dbToY(0)} Z" fill="${PAL.coral}" fill-opacity="0.09" />`;

  // the deepest point, marked
  const mx = fx(120);
  const my = dbToY(-42);
  body += `<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="9" fill="${PAL.coral}" />`;
  body += line(mx, my - 18, mx, yTop - 26, { stroke: PAL.coral, width: 1, dash: '3 5' });
  body += text(mx + 14, yTop - 30, '−42 dB @ 120 Hz', { family: FONT_DISPLAY, size: 26, weight: 700, fill: PAL.coral });

  // what the passive seal alone does, for contrast
  const passive = [[20, -4], [120, -7], [700, -12], [4000, -22], [20000, -26]];
  const ppts = passive.map(([f, db]) => `${fx(f).toFixed(1)} ${dbToY(db).toFixed(1)}`);
  body += `<path d="M ${ppts.join(' L ')}" fill="none" stroke="${PAL.inkSubtle}" stroke-width="3" stroke-dasharray="8 7" />`;
  body += text(fx(6000), dbToY(-20) - 16, '패시브 차음만', { family: FONT_MONO, size: 18, fill: PAL.inkSubtle });
  return wrap(body + foot('가상 제품 · 수치는 예시'));
}

/* ------------------------------------------------------------------ *
 * 03 — weight, as columns
 * ------------------------------------------------------------------ */
function plateWeight() {
  const rows = [
    { label: 'NB-01', value: 213, mine: true },
    { label: 'A', value: 250 },
    { label: 'B', value: 278 },
    { label: 'C', value: 309 },
  ];
  const base = 588;
  const top = 316;
  const max = 340;
  const x0 = L + 300;
  const gap = 196;
  let body = head(3, 'WEIGHT', '213g, 두 시간 뒤에 잊는다', '헤드밴드·패드 포함 · 케이블 제외');

  body += line(x0 - 60, base, Rt - 80, base, { stroke: PAL.hairlineStrong, width: 1 });
  rows.forEach((row, i) => {
    const h = ((row.value / max) * (base - top));
    const x = x0 + i * gap;
    body += `<rect x="${x}" y="${(base - h).toFixed(1)}" width="104" height="${h.toFixed(1)}" fill="${row.mine ? PAL.coral : PAL.surface3}" />`;
    body += text(x + 52, base - h - 22, `${row.value}g`, {
      family: FONT_DISPLAY, size: row.mine ? 34 : 24, weight: 700,
      fill: row.mine ? PAL.coral : PAL.inkSubtle, anchor: 'middle',
    });
    body += text(x + 52, base + 32, row.label, { family: FONT_MONO, size: 18, fill: row.mine ? PAL.ink : PAL.inkSubtle, anchor: 'middle' });
  });

  // the gap to the lightest rival, drawn as a bracket
  const yTie = base - ((213 / max) * (base - top));
  const lastRight = x0 + 3 * gap + 104;
  body += line(x0, yTie, lastRight, yTie, { stroke: PAL.cobalt, width: 1, dash: '4 6' });
  body += text(lastRight + 28, yTie - 4, '가장 가벼운 경쟁 제품보다', { size: 21, fill: PAL.cobalt, weight: 700, family: FONT_DISPLAY });
  body += text(lastRight + 28, yTie + 28, '37g 가볍다', { size: 21, fill: PAL.cobalt, weight: 700, family: FONT_DISPLAY });
  return wrap(body + foot('가상 제품 · 수치는 예시'));
}

/* ------------------------------------------------------------------ *
 * 04 — codecs, as a bitrate ladder
 * ------------------------------------------------------------------ */
function plateCodec() {
  const rows = [
    { name: 'LDAC', kbps: 990, note: '96kHz / 24bit' },
    { name: 'aptX Adaptive', kbps: 420, note: '가변 · 저지연' },
    { name: 'AAC', kbps: 256, note: 'iOS 기본' },
    { name: 'SBC', kbps: 328, note: '모든 기기' },
  ];
  const x0 = L + 380;
  const span = Rt - x0 - 190;
  const max = 1000;
  let body = head(4, 'CODEC', '네 가지 코덱, 자동으로 고른다', '연결된 기기에 맞춰 전환 · LE Audio 준비');

  rows.forEach((row, i) => {
    const y = 330 + i * 66;
    const w = (span * row.kbps) / max;
    const hot = i === 0;
    body += text(x0 - 28, y + 28, row.name, {
      family: FONT_DISPLAY, size: hot ? 30 : 25, weight: 700,
      fill: hot ? PAL.ink : PAL.inkMuted, anchor: 'end',
    });
    body += `<rect x="${x0}" y="${y}" width="${w.toFixed(1)}" height="38" fill="${hot ? PAL.cobalt : PAL.surface3}" />`;
    body += text(x0 + w + 16, y + 28, `${row.kbps} kbps`, {
      family: FONT_MONO, size: 20, fill: hot ? PAL.cobalt : PAL.inkSubtle,
    });
    body += text(x0 - 28, y + 52, row.note, { family: FONT_MONO, size: 15, fill: PAL.inkSubtle, anchor: 'end' });
  });
  body += line(x0, 318, x0, 330 + 3 * 66 + 46, { stroke: PAL.hairlineStrong, width: 1 });
  body += text(x0, 300, '최대 전송률', { family: FONT_MONO, size: 17, fill: PAL.inkSubtle, ls: 2 });
  return wrap(body + foot('가상 제품 · 수치는 예시'));
}

/* ------------------------------------------------------------------ *
 * 05 — the four finishes
 * ------------------------------------------------------------------ */
function plateColors() {
  const swatches = [
    { name: '샌드', en: 'SAND', fill: PAL.surface3, ring: PAL.hairlineStrong },
    { name: '코랄', en: 'CORAL', fill: PAL.coral, ring: PAL.coral },
    { name: '코발트', en: 'COBALT', fill: PAL.cobalt, ring: PAL.cobalt },
    { name: '먹', en: 'INK', fill: PAL.ink, ring: PAL.ink },
  ];
  let body = head(5, 'FINISH', '네 가지 색, 같은 무게', '아노다이징 · 지문이 남지 않는 마감');

  swatches.forEach((s, i) => {
    const cx = L + 180 + i * 330;
    const cy = 430;
    body += `<circle cx="${cx}" cy="${cy}" r="112" fill="${s.fill}" />`;
    body += `<circle cx="${cx}" cy="${cy}" r="62" fill="none" stroke="${PAL.canvas}" stroke-opacity="0.55" stroke-width="3" />`;
    body += `<circle cx="${cx}" cy="${cy}" r="22" fill="${PAL.canvas}" fill-opacity="0.75" />`;
    body += `<circle cx="${cx}" cy="${cy}" r="120" fill="none" stroke="${s.ring}" stroke-opacity="0.35" stroke-width="1" />`;
    body += text(cx, cy + 178, s.name, { family: FONT_DISPLAY, size: 30, weight: 700, fill: PAL.ink, anchor: 'middle' });
    body += text(cx, cy + 208, s.en, { family: FONT_MONO, size: 17, fill: PAL.inkSubtle, anchor: 'middle', ls: 3 });
  });
  return wrap(body + foot('가상 제품 · 색은 예시'));
}

const PLATES = [
  ['plate-01-battery', plateBattery],
  ['plate-02-anc', plateAnc],
  ['plate-03-weight', plateWeight],
  ['plate-04-codec', plateCodec],
  ['plate-05-color', plateColors],
];

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  for (const [name, make] of PLATES) {
    const buf = await sharp(Buffer.from(make())).webp({ quality: 84 }).toBuffer();
    await writeFile(path.join(OUT, `${name}.webp`), buf);
    console.log(`${name}.webp  ${(buf.length / 1024).toFixed(0)} KB`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
