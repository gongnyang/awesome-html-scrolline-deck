#!/usr/bin/env node
/**
 * make-rotation.mjs — 90 frames of the Nimbus turning once on its axis,
 * plus the poster the scene shows before the sequence decodes.
 *
 * The real workflow is `scrolline frames turntable.mp4 --scene 02-turn`. There is
 * no footage here, so each frame is drawn at its own angle and written straight
 * to public/frames/turn/f_%03d.jpg. Frame 1 and frame 91 would be the same
 * picture, so the loop stops one step short of a full turn.
 *
 *   NODE_PATH=/mnt/d/2026-06-site/node_modules node tools/make-rotation.mjs
 */
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAL, FONT_MONO, headphone, ground, slate, line, text } from './lib/nimbus.mjs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'public', 'frames', 'turn');

const W = 1280;
const H = 720;
const COUNT = 90;
const CX = 792;
const CY = 300;
const SCALE = 0.95;
const START = Math.PI * 0.16; // open on a three-quarter view, not a flat side

const deg = (rad) => Math.round(((rad * 180) / Math.PI) % 360);

/**
 * A ruler under the product: the turn reads as measurement, not as a spin.
 * It starts under the product because the scene's own copy owns the left side.
 */
function floor(y) {
  const x0 = 520;
  const x1 = W - 150;
  let out = line(x0, y, x1, y, { stroke: PAL.hairlineStrong, width: 1, opacity: 0.55 });
  for (let i = 0; i <= 16; i += 1) {
    const x = x0 + ((x1 - x0) / 16) * i;
    const tall = i % 4 === 0;
    out += line(x, y, x, y + (tall ? 13 : 6), { stroke: PAL.hairlineStrong, width: 1, opacity: tall ? 0.7 : 0.4 });
  }
  return out;
}

function frameSvg(t) {
  const angle = START + t * Math.PI * 2;
  const floorY = CY + 216 * SCALE + 26;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${ground(W, H, 'turn')}
  ${slate(W, 74, 'NIMBUS  NB-01  OVER-EAR', `ROTATION ${String(deg(angle)).padStart(3, '0')}°`, { x: 150 })}
  ${floor(floorY)}
  ${line(CX, 118, CX, floorY, { stroke: PAL.hairline, width: 1, dash: '2 9', opacity: 0.8 })}
  ${headphone({ angle, cx: CX, cy: CY, scale: SCALE, idPrefix: 'turn' })}
  ${text(W - 150, floorY + 40, '가상 제품 · NB-01', { size: 17, fill: PAL.inkSubtle, family: FONT_MONO, ls: 2, anchor: 'end' })}
</svg>`;
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  let bytes = 0;
  for (let i = 1; i <= COUNT; i += 1) {
    const buf = await sharp(Buffer.from(frameSvg((i - 1) / COUNT)))
      .jpeg({ quality: 72, mozjpeg: true, chromaSubsampling: '4:2:0' })
      .toBuffer();
    await writeFile(path.join(OUT, `f_${String(i).padStart(3, '0')}.jpg`), buf);
    bytes += buf.length;
  }

  const poster = await sharp(Buffer.from(frameSvg(0.32)))
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
  await writeFile(path.join(OUT, 'poster.jpg'), poster);

  console.log(`turn: ${COUNT} frames · ${(bytes / 1048576).toFixed(2)} MB · poster ${(poster.length / 1024).toFixed(0)} KB`);
}

main().catch((err) => { console.error(err); process.exit(1); });
