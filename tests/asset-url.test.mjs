import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAssetURL, resolveAssets } from '../engine/asset-url.js';

test('public assets resolve within a deployed deck subpath', () => {
  const base = 'https://gongnyang.github.io/awesome-html-scrolline-deck/sample-deck/';
  assert.equal(resolveAssetURL('/media/hero.webp', base), `${base}media/hero.webp`);
  assert.equal(resolveAssetURL('frames/open/f_%03d.jpg', base), `${base}frames/open/f_%03d.jpg`);
  assert.equal(resolveAssetURL('https://example.com/logo.svg', base), 'https://example.com/logo.svg');
  assert.deepEqual(resolveAssets({ images: ['/media/a.webp'], poster: '/media/poster.webp' }, base).images,
    [`${base}media/a.webp`]);
});
