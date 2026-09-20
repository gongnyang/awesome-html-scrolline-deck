#!/usr/bin/env node
/**
 * make-breathe-video.mjs — the six-second clip behind 05-breathe, and its poster.
 *
 * A field of sound lines that flattens and swells once, drawn frame by frame and
 * muxed with ffmpeg. Everything is periodic over the six seconds, so the loop has
 * no seam. Output: public/media/05-breathe/breathe.mp4 (muted, faststart, yuv420p)
 * plus a poster that reads on its own when the video is blocked.
 *
 *   NODE_PATH=/mnt/d/2026-06-site/node_modules node tools/make-breathe-video.mjs
 *   FFMPEG=/path/to/ffmpeg node tools/make-breathe-video.mjs     # if not on PATH
 */
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAL, FONT_MONO, ground, text, line } from './lib/nimbus.mjs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'public', 'media', '05-breathe');
const TMP = path.join(HERE, '.tmp-breathe');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';

const W = 1280;
const H = 720;
const FPS = 24;
const SECONDS = 6;
const COUNT = FPS * SECONDS;
const LINES = 26;

/**
 * One frame. `t` runs 0..1 over the whole clip and every term below is periodic
 * in t, so frame COUNT would be frame 0 again.
 */
function frameSvg(t) {
  const phase = t * Math.PI * 2;
  // the field breathes: wide open, flat, wide open
  const breath = 0.5 - 0.5 * Math.cos(phase);
  let body = '';

  for (let i = 0; i < LINES; i += 1) {
    const u = i / (LINES - 1);
    const y0 = 110 + u * (H - 220);
    const envelope = Math.sin(Math.PI * u); // quiet at the edges, loud in the middle
    const amp = (6 + 58 * envelope) * (0.16 + 0.84 * breath);
    const k = 2.1 + envelope * 1.4;         // waves across the width
    const drift = phase + u * 1.7;
    const pts = [];
    for (let x = 0; x <= 64; x += 1) {
      const px = (x / 64) * W;
      const fade = Math.sin(Math.PI * (x / 64));  // the line dies out at both edges
      const y = y0 + Math.sin((x / 64) * Math.PI * 2 * k + drift) * amp * fade;
      pts.push(`${px.toFixed(1)} ${y.toFixed(1)}`);
    }
    const hot = Math.abs(u - (0.5 + 0.22 * Math.sin(phase))) < 0.06;
    body += `<path d="M ${pts.join(' L ')}" fill="none" stroke="${hot ? PAL.coral : PAL.ink}"`
      + ` stroke-opacity="${(hot ? 0.85 : 0.14 + envelope * 0.2).toFixed(3)}"`
      + ` stroke-width="${hot ? 2.6 : 1.4}" stroke-linecap="round" />`;
  }

  // a horizon that stays put while the field moves around it
  body += line(0, H / 2, W, H / 2, { stroke: PAL.hairlineStrong, width: 1, opacity: 0.5, dash: '1 14' });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${ground(W, H, 'br')}
  ${body}
  ${text(150, 84, 'ANC ON', { family: FONT_MONO, size: 18, fill: PAL.inkSubtle, ls: 4 })}
  ${text(W - 150, 84, '소음이 내려앉는다', { family: FONT_MONO, size: 18, fill: PAL.inkSubtle, ls: 2, anchor: 'end' })}
</svg>`;
}

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit' });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(`${cmd} exited ${res.status}`);
}

async function main() {
  await rm(TMP, { recursive: true, force: true });
  await mkdir(TMP, { recursive: true });
  await mkdir(OUT, { recursive: true });

  for (let i = 0; i < COUNT; i += 1) {
    const buf = await sharp(Buffer.from(frameSvg(i / COUNT)))
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();
    await writeFile(path.join(TMP, `b_${String(i + 1).padStart(3, '0')}.jpg`), buf);
  }

  run(FFMPEG, [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-framerate', String(FPS),
    '-i', path.join(TMP, 'b_%03d.jpg'),
    '-an',                                   // the scene plays it muted; ship it silent
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-crf', '30', '-preset', 'slow',
    '-movflags', '+faststart',
    path.join(OUT, 'breathe.mp4'),
  ]);

  const poster = await sharp(Buffer.from(frameSvg(0.5))).webp({ quality: 82 }).toBuffer();
  await writeFile(path.join(OUT, 'poster.webp'), poster);
  await rm(TMP, { recursive: true, force: true });

  const { size } = await import('node:fs/promises').then((fs) => fs.stat(path.join(OUT, 'breathe.mp4')));
  console.log(`05-breathe/breathe.mp4  ${(size / 1024).toFixed(0)} KB · ${SECONDS}s @ ${FPS}fps`);
  console.log(`05-breathe/poster.webp  ${(poster.length / 1024).toFixed(0)} KB`);
}

main().catch((err) => { console.error(err); process.exit(1); });
