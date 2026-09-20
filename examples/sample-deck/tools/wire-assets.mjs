#!/usr/bin/env node
/**
 * wire-assets.mjs — point deck.json at the generated assets.
 *
 * In a real deck `scrolline frames --scene 01-hero` and `scrolline media --scene 04-gallery`
 * write these keys for you. The sample generates its assets instead of cutting them from
 * footage, so this script fills the same fields.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DECK = path.join(HERE, '..');
const deckFile = path.join(DECK, 'data/deck.json');
const deck = JSON.parse(fs.readFileSync(deckFile, 'utf8'));

const byId = Object.fromEntries(deck.scenes.map((s) => [s.id, s]));

const frameCount = fs
  .readdirSync(path.join(DECK, 'public/frames/hero'))
  .filter((f) => /^f_\d{3}\.jpg$/.test(f)).length;

if (byId['01-hero']) {
  byId['01-hero'].assets = {
    frames: '/frames/hero/f_%03d.jpg',
    count: frameCount,
    critical: [1, Math.round(frameCount * 0.25), Math.round(frameCount * 0.5), Math.round(frameCount * 0.75), frameCount],
    poster: '/frames/hero/poster.jpg',
  };
  byId['01-hero'].fallback = '포스터 정지 화면 위에 제목만 페이드인. 모바일은 프레임 시퀀스를 내려받지 않는다.';
}

if (byId['04-gallery']) {
  const plates = fs
    .readdirSync(path.join(DECK, 'public/media/gallery'))
    .filter((f) => f.endsWith('.webp'))
    .sort()
    .map((f) => `/media/gallery/${f}`);
  byId['04-gallery'].assets = { images: plates };
  byId['04-gallery'].fallback = '판 여섯 장을 3열 그리드로 정지 배치한다.';
}

if (byId['06-closing']) {
  byId['06-closing'].assets = { images: ['/media/qr.svg'] };
  byId['06-closing'].qr = undefined;
  byId['06-closing'].fallback = 'QR과 주소를 정지 상태로 함께 띄운다.';
}

if (byId['02-relay']) byId['02-relay'].fallback = '두 문장을 가로로 나란히 세운 정지 화면.';
if (byId['03-arc']) byId['03-arc'].fallback = '세 박자를 세로 목록으로 세운 정지 화면.';
if (byId['05-numbers']) byId['05-numbers'].fallback = '네 숫자를 최종값 상태로 세운다.';

fs.writeFileSync(deckFile, `${JSON.stringify(deck, null, 2)}\n`);
console.log(`wired: hero ${frameCount} frames · gallery ${byId['04-gallery']?.assets?.images?.length ?? 0} plates · closing qr`);
