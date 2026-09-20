#!/usr/bin/env node
/**
 * make-hero-plate.mjs — the 900×1200 exploded view for 03-hero (tilt-card).
 *
 * tilt-card crops its plate hard: the element is 56vw wide, object-fit cover,
 * and the left 31% is masked away. So every part of the drawing lives right of
 * x≈320 and inside y 120–1090, which is the band that survives the crop on a
 * 1440×900 projector.
 *
 *   NODE_PATH=/mnt/d/2026-06-site/node_modules node tools/make-hero-plate.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAL, FONT_MONO, FONT_DISPLAY, ground, text, line } from './lib/nimbus.mjs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'public', 'media', '03-hero');

const W = 900;
const H = 1200;
const AXIS = 440;   // the assembly axis
const RX = 104;     // half-width of a layer
const RY = 36;      // how much each layer is tilted away from us
const LABEL_X = 610;

/** One disc of the stack, seen from slightly above. */
function layer(y, o = {}) {
  const {
    fill = PAL.ink, thickness = 16, stroke = null, inner = null, opacity = 1, rx = RX,
  } = o;
  const body = `<path d="M ${AXIS - rx} ${y} L ${AXIS - rx} ${y + thickness}`
    + ` A ${rx} ${RY} 0 0 0 ${AXIS + rx} ${y + thickness}`
    + ` L ${AXIS + rx} ${y} Z" fill="${fill}" fill-opacity="${opacity * 0.82}" />`;
  const top = `<ellipse cx="${AXIS}" cy="${y}" rx="${rx}" ry="${RY}" fill="${fill}" fill-opacity="${opacity}" />`;
  const ring = stroke
    ? `<ellipse cx="${AXIS}" cy="${y}" rx="${rx * 0.66}" ry="${RY * 0.66}" fill="none" stroke="${stroke}" stroke-width="3" />`
    : '';
  const core = inner
    ? `<ellipse cx="${AXIS}" cy="${y}" rx="${rx * 0.3}" ry="${RY * 0.3}" fill="${inner}" />`
    : '';
  return body + top + ring + core;
}

/** A leader from the layer out to its label, with the part number on the elbow. */
function leader(y, n) {
  return line(AXIS + RX + 12, y, LABEL_X - 26, y, { stroke: PAL.hairlineStrong, width: 1, dash: '3 6' })
    + `<circle cx="${AXIS + RX + 12}" cy="${y}" r="4" fill="${PAL.coral}" />`
    + text(LABEL_X - 22, y - 26, n, { family: FONT_MONO, size: 15, fill: PAL.coral, ls: 2 });
}

const PARTS = [
  {
    y: 268, n: '01', label: '알루미늄 이어컵', spec: 'CNC 1-PIECE · 42g',
    draw: layer(268, { fill: PAL.ink, thickness: 20 }),
  },
  {
    y: 434, n: '02', label: '40mm 드라이버', spec: 'LCP 진동판 · 20–40kHz',
    draw: layer(434, { fill: PAL.inkMuted, thickness: 14, stroke: PAL.coral, inner: PAL.coral }),
  },
  {
    y: 600, n: '03', label: '1,200mAh 셀', spec: 'USB-C 3분 = 5시간',
    draw: layer(600, { fill: PAL.surface3, thickness: 22, stroke: PAL.cobalt, rx: RX * 0.82 }),
  },
  {
    y: 766, n: '04', label: 'ANC 마이크 6개', spec: 'FF 4 · FB 2 · 빔포밍',
    draw: layer(766, { fill: PAL.surface2, thickness: 10, rx: RX * 0.72 })
      + Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 + 0.4;
        const cx = AXIS + Math.cos(a) * RX * 0.54;
        const cy = 766 + Math.sin(a) * RY * 0.54;
        return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="6" fill="${PAL.cobalt}" />`;
      }).join(''),
  },
  {
    y: 940, n: '05', label: '메모리폼 이어패드', spec: '교체형 · 단백질 가죽',
    draw: `<ellipse cx="${AXIS}" cy="940" rx="${RX}" ry="${RY}" fill="${PAL.inkMuted}" />`
      + `<path d="M ${AXIS - RX} 940 L ${AXIS - RX} 968 A ${RX} ${RY} 0 0 0 ${AXIS + RX} 968 L ${AXIS + RX} 940 Z" fill="${PAL.inkMuted}" fill-opacity="0.8" />`
      + `<ellipse cx="${AXIS}" cy="940" rx="${RX * 0.5}" ry="${RY * 0.5}" fill="${PAL.canvas}" />`,
  },
];

function plate() {
  const parts = PARTS.map((p) => p.draw).join('');
  const leaders = PARTS.map((p) => leader(p.y, p.n)).join('');
  const labels = PARTS.map((p) =>
    text(LABEL_X, p.y + 2, p.label, { size: 25, weight: 700, fill: PAL.ink, family: FONT_DISPLAY })
    + text(LABEL_X, p.y + 28, p.spec, { size: 13, fill: PAL.inkSubtle, family: FONT_MONO, ls: 1 })).join('');

  // the assembly axis, and a bracket that says "this is one cup"
  const axis = line(AXIS, 190, AXIS, 1010, { stroke: PAL.hairlineStrong, width: 1, dash: '2 10' })
    + line(312, 250, 312, 980, { stroke: PAL.coral, width: 2, opacity: 0.5 })
    + line(312, 250, 336, 250, { stroke: PAL.coral, width: 2, opacity: 0.5 })
    + line(312, 980, 336, 980, { stroke: PAL.coral, width: 2, opacity: 0.5 })
    + `<text x="312" y="625" font-family="${FONT_MONO}" font-size="15" fill="${PAL.coral}"`
    + ` letter-spacing="3" transform="rotate(-90 312 625)" text-anchor="middle">EAR CUP · 5 LAYERS</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${ground(W, H, 'hero')}
  ${line(312, 150, W - 40, 150, { stroke: PAL.hairline, width: 1 })}
  ${text(312, 136, 'EXPLODED VIEW', { family: FONT_MONO, size: 17, fill: PAL.inkSubtle, ls: 4 })}
  ${text(W - 40, 136, 'NB-01', { family: FONT_MONO, size: 17, fill: PAL.coral, ls: 3, anchor: 'end' })}
  ${axis}
  ${parts}
  ${leaders}
  ${labels}
  ${line(312, 1062, W - 40, 1062, { stroke: PAL.hairline, width: 1 })}
  ${text(312, 1094, '가상의 제품입니다 · 수치는 예시', { size: 18, fill: PAL.inkSubtle })}
</svg>`;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const buf = await sharp(Buffer.from(plate())).webp({ quality: 86 }).toBuffer();
  await writeFile(path.join(OUT, 'exploded.webp'), buf);
  console.log(`03-hero/exploded.webp  ${(buf.length / 1024).toFixed(0)} KB`);
}

main().catch((err) => { console.error(err); process.exit(1); });
