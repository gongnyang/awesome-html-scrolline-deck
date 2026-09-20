#!/usr/bin/env node
/**
 * wire-assets.mjs — 구워 놓은 인포그래픽을 deck.json 에 물린다.
 *
 * 실전 덱이라면 `scrolline media <file> --scene <id>` 가 같은 필드를 채운다.
 * 이 덱은 그림을 직접 만들기 때문에 파일명 규칙대로 한 번에 등록한다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DECK = path.join(HERE, '..');
const deckFile = path.join(DECK, 'data/deck.json');
const deck = JSON.parse(fs.readFileSync(deckFile, 'utf8'));
const byId = Object.fromEntries(deck.scenes.map((scene) => [scene.id, scene]));

const mediaOf = (id) => fs
  .readdirSync(path.join(DECK, 'public/media', id))
  .filter((file) => file.endsWith('.webp'))
  .sort()
  .map((file) => `/media/${id}/${file}`);

const FALLBACKS = {
  '01-open': '두 구절을 가로로 나란히 세운 정지 화면.',
  '02-anatomy': '차트 한 장과 행 네 개를 연결선 없이 위아래로 쌓는다.',
  '03-numbers': '네 숫자를 최종값 상태로 세운다.',
  '04-stack': '부속 보고서 여섯 장을 3열 그리드로 정지 배치한다.',
  '05-shift': '2025 구조도와 2026 구조도를 위아래로 나란히 둔다.',
  '06-close': 'QR과 주소를 정지 상태로 함께 띄운다.',
};

byId['02-anatomy'].assets = { images: mediaOf('02-anatomy') };
byId['04-stack'].assets = { images: mediaOf('04-stack') };
byId['05-shift'].assets = {
  images: [
    '/media/05-shift/plate-2025.webp',
    '/media/05-shift/plate-2026.webp',
    '/media/05-shift/plate-delta.webp',
  ],
  video: null,
  poster: null,
};

for (const [id, text] of Object.entries(FALLBACKS)) {
  if (byId[id]) byId[id].fallback = text;
}

fs.writeFileSync(deckFile, `${JSON.stringify(deck, null, 2)}\n`);
console.log(`wired: 차트 ${byId['02-anatomy'].assets.images.length}장 · 부속 ${byId['04-stack'].assets.images.length}장 · 구조도 ${byId['05-shift'].assets.images.length}장`);
