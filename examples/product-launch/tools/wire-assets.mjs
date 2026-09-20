#!/usr/bin/env node
/**
 * wire-assets.mjs — point data/deck.json at the generated assets.
 *
 * In a deck built from real material these keys are written by the CLI:
 * `scrolline frames turntable.mp4 --scene 02-turn`, `scrolline media shot.png
 * --scene 04-features`, `scrolline qr --url … --scene 07-close`. This deck draws
 * its assets instead of shooting them, so the same fields are filled here, in the
 * same shape the CLI would leave them.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DECK = path.join(HERE, '..');
const deckFile = path.join(DECK, 'data/deck.json');
const deck = JSON.parse(fs.readFileSync(deckFile, 'utf8'));
const byId = Object.fromEntries(deck.scenes.map((s) => [s.id, s]));

const list = (dir, re) => fs.readdirSync(path.join(DECK, dir)).filter((f) => re.test(f)).sort();

/* the launch colour also drives the progress bar and the HUD */
deck.theme.accent = '#cf4224';

/* 02-turn — the 90-frame turntable */
{
  const frames = list('public/frames/turn', /^f_\d{3}\.jpg$/).length;
  const scene = byId['02-turn'];
  scene.assets = {
    frames: '/frames/turn/f_%03d.jpg',
    count: frames,
    critical: [...new Set([1, Math.round(frames * 0.25), Math.round(frames / 2), Math.round(frames * 0.75), frames])],
    poster: '/frames/turn/poster.jpg',
  };
  scene.fallback = '포스터 한 장(45° 뷰) 위에 카피만 얹는다. 모바일은 시퀀스를 내려받지 않는다.';
}

/* 03-hero — the exploded view */
{
  const scene = byId['03-hero'];
  scene.assets = {
    images: ['/media/03-hero/exploded.webp'],
    // Mono captions stay Latin-only — see README, "Korean in a mono stack".
    caption: 'EXPLODED VIEW · NB-01',
  };
  scene.fallback = '분해도 정지 화면 옆에 네 줄이 그대로 선다.';
}

/* 04-features — the five chart plates */
{
  const plates = list('public/media/04-features', /\.webp$/).map((f) => `/media/04-features/${f}`);
  const scene = byId['04-features'];
  scene.assets = { images: plates };
  scene.fallback = '판 다섯 장을 2열 그리드로 정지 배치하고 캡션을 맨 위로 올린다.';
}

/* 05-breathe — the unpinned clip, with a poster that works on its own */
{
  const scene = byId['05-breathe'];
  scene.assets = {
    video: '/media/05-breathe/breathe.mp4',
    poster: '/media/05-breathe/poster.webp',
    images: [],
  };
  scene.fallback = '영상이 막히면 포스터(파형 정지 화면) 위로 카피만 흐른다.';
}

/* 07-close — the QR the CLI already generated, plus the printed URL */
{
  const scene = byId['07-close'];
  scene.assets = { images: ['/media/07-close/qr.svg'] };
  scene.copy.lines = ['github.com/gongnyang/awesome-html-scrolline-deck'];
  scene.fallback = 'QR과 주소를 정지 상태로 함께 띄운다.';
}

byId['01-open'].fallback = '세 블록을 세로 목록으로 세운 정지 화면.';
byId['06-specs'].fallback = '네 숫자를 최종값 상태로 세운다.';

fs.writeFileSync(deckFile, `${JSON.stringify(deck, null, 2)}\n`);
console.log(
  `wired: turn ${byId['02-turn'].assets.count} frames · hero 1 plate · features ${byId['04-features'].assets.images.length} plates · breathe mp4 + poster · qr`
);
