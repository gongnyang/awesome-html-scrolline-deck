import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { run as checkAssets } from '../scripts/gates/s00.mjs';
import { createFrameScrub } from '../engine/frame-scrub.js';

test('asset gate resolves every schema-supported frame number width', async (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scrolline-frames-'));
  t.after(() => {
    if (tmp.startsWith(os.tmpdir() + path.sep)) fs.rmSync(tmp, { recursive: true, force: true });
  });
  fs.mkdirSync(path.join(tmp, 'data'));
  fs.mkdirSync(path.join(tmp, 'public', 'frames'), { recursive: true });
  for (const width of [2, 3, 4]) {
    for (const number of [1, 2]) {
      fs.writeFileSync(path.join(tmp, 'public', 'frames', `f${width}_${String(number).padStart(width, '0')}.jpg`), 'test frame');
    }
  }
  const deck = {
    title: '프레임 검사',
    scenes: [2, 3, 4].map((width, index) => ({
      id: `0${index + 1}-frames`, order: index + 1, technique: 'process-film', pinVh: 100,
      notes: '프레임 경로 검증', assets: { frames: `/frames/f${width}_%0${width}d.jpg`, count: 2 },
    })),
  };
  for (const scene of deck.scenes) {
    const dir = path.join(tmp, 'src', 'scenes', scene.id);
    fs.mkdirSync(dir, { recursive: true });
    for (const file of ['scene.html', 'scene.css', 'scene.js']) fs.writeFileSync(path.join(dir, file), '');
  }
  fs.writeFileSync(path.join(tmp, 'data', 'deck.json'), JSON.stringify(deck));
  const result = await checkAssets({ dir: tmp });
  assert.equal(result.ok, true, result.items?.join('\n'));
});

test('reduced motion and mobile use the first sequence frame when no poster exists', (t) => {
  const requests = [];
  const previous = {
    document: globalThis.document,
    window: globalThis.window,
    matchMedia: globalThis.matchMedia,
    Image: globalThis.Image,
  };
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  });
  const canvas = {
    className: '', width: 0, height: 0,
    getContext: () => ({ fillRect() {}, drawImage() {}, set fillStyle(_value) {} }),
    remove() {},
  };
  globalThis.document = { createElement: () => canvas };
  globalThis.window = {
    devicePixelRatio: 1,
    addEventListener() {}, removeEventListener() {},
  };
  globalThis.matchMedia = (query) => ({ matches: query.includes('prefers-reduced-motion') });
  globalThis.Image = class {
    set src(value) { requests.push(value); this._src = value; }
    get src() { return this._src; }
  };
  const host = {
    appendChild() {},
    getBoundingClientRect: () => ({ width: 100, height: 100 }),
  };
  const controller = createFrameScrub(host, { pattern: '/frames/f_%02d.jpg', count: 2 });
  assert.deepEqual(requests, ['/frames/f_01.jpg']);
  controller.destroy();
  globalThis.matchMedia = (query) => ({ matches: query.includes('max-width') });
  const mobile = createFrameScrub(host, { pattern: '/frames/f_%02d.jpg', count: 2 });
  assert.deepEqual(requests, ['/frames/f_01.jpg', '/frames/f_01.jpg']);
  mobile.destroy();
});
