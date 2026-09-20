#!/usr/bin/env node
/**
 * wire-assets.mjs — point data/deck.json at the drawings under public/.
 *
 * In a deck built from real material these keys are written by the CLI:
 * `scrolline frames dusk.mp4 --scene 01-hero`, `scrolline media shot.png --scene 03-postcards`.
 * This example draws its own assets, so the same fields are filled here — plus
 * the two keys the CLI has no flag for, `assets.rows` (anatomy-rows) and
 * `assets.caption` (tilt-card).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DECK = path.join(HERE, '..');
const deckFile = path.join(DECK, 'data/deck.json');
const deck = JSON.parse(fs.readFileSync(deckFile, 'utf8'));
const byId = Object.fromEntries(deck.scenes.map((s) => [s.id, s]));

/* Deck level: the accent the engine paints the progress bar with is the stream teal. */
deck.theme = { ...(deck.theme ?? {}), style: 'dark', accent: '#3fc7b4' };
deck.presenter = { ...(deck.presenter ?? {}), autoDurationSec: 150 };

const list = (dir, prefix) => fs
  .readdirSync(path.join(DECK, 'public', dir))
  .filter((f) => f.endsWith('.webp'))
  .sort()
  .map((f) => `${prefix}/${f}`);

/* 01-hero — the frame sequence. */
if (byId['01-hero']) {
  const count = fs.readdirSync(path.join(DECK, 'public/frames/skyline'))
    .filter((f) => /^f_\d{3}\.jpg$/.test(f)).length;
  byId['01-hero'].assets = {
    frames: '/frames/skyline/f_%03d.jpg',
    count,
    critical: [1, Math.round(count * 0.25), Math.round(count * 0.5), Math.round(count * 0.75), count],
    poster: '/frames/skyline/poster.jpg',
  };
  byId['01-hero'].fallback = '포스터 한 장(해가 반쯤 내려간 프레임) 위에 제목만. 모바일은 시퀀스를 내려받지 않는다.';
}

/* 02-route — one map, five annotated rows. */
if (byId['02-route']) {
  byId['02-route'].assets = {
    images: ['/media/02-route/route.webp'],
    rows: [
      { label: '17:30', value: '경복궁 돌담길 — 서십자각에서 영추문까지. 해는 아직 지붕 위에 있다.' },
      { label: '18:20', value: '서촌 골목 — 통인시장을 지나 한 블록. 간판에 불이 먼저 들어온다.' },
      { label: '19:10', value: '인왕산 자락길 — 계단 200개. 도시가 발밑에서 주황으로 바뀐다.' },
      { label: '20:00', value: '광장시장 — 빈대떡 한 장과 국수 한 그릇. 가장 오래 앉는 자리.' },
      { label: '20:50', value: '청계천 하류 — 물 위로 간판이 한 번 더 보인다. 여기서 끝낸다.' },
    ],
  };
  byId['02-route'].fallback = '지도 한 장 아래에 다섯 행을 세로 목록으로 세운다. 연결선은 그리지 않는다.';
}

/* 03-postcards — six cards, one per stop plus the ride home. */
if (byId['03-postcards']) {
  byId['03-postcards'].assets = { images: list('media/03-postcards', '/media/03-postcards') };
  byId['03-postcards'].fallback = '엽서 여섯 장을 3열 그리드로 정지 배치한다.';
}

/* 04-drift — the breath between two pinned scenes. */
if (byId['04-drift']) {
  byId['04-drift'].assets = { video: '/media/04-drift/drift.mp4', poster: '/media/04-drift/poster.webp' };
  byId['04-drift'].fallback = '영상이 없으면 포스터 정지 화면 위로 카피만 흘러간다. 모션 축소 설정에서도 같다.';
}

/* 05-guide — the guide, and the day as a timeline. */
if (byId['05-guide']) {
  // No assets.caption: the plate prints its own credit line, and the template's
  // figcaption would land on top of it in the bottom right corner.
  byId['05-guide'].assets = { images: ['/media/05-guide/guide.webp'] };
  byId['05-guide'].fallback = '도판을 오른쪽에 고정하고 세 줄을 괘선으로 끊어 세운다.';
}

/* 06-compare — the same chart, lit three ways. */
if (byId['06-compare']) {
  byId['06-compare'].assets = { images: list('media/06-compare', '/media/06-compare') };
  byId['06-compare'].fallback = '세 판을 차례로 정지 배치하고 캡션 번호만 바꾼다.';
}

/* 07-close — `add --url` already wrote images[0] (the QR) and links.site;
   images[1] is the closing mark the template sets in the bottom right corner. */
if (byId['07-close']) {
  const qr = (byId['07-close'].assets?.images ?? []).filter((p) => p.endsWith('qr.svg'));
  byId['07-close'].assets = { images: [...qr, '/media/07-close/loop.webp'] };
  byId['07-close'].fallback = 'QR과 주소를 정지 상태로 함께 띄운다.';
}

fs.writeFileSync(deckFile, `${JSON.stringify(deck, null, 2)}\n`);
console.log(
  `wired: hero ${byId['01-hero']?.assets?.count ?? 0} frames · route ${byId['02-route']?.assets?.rows?.length ?? 0} rows · `
  + `postcards ${byId['03-postcards']?.assets?.images?.length ?? 0} · compare ${byId['06-compare']?.assets?.images?.length ?? 0} · drift video`,
);
