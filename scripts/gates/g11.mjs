/** G11 — every packaged raster/frame decodes at the URL the audience will use. */
import { openPage } from '../lib/browser.mjs';
import { orderedScenes } from './_util.mjs';

export const id = 'G11';
export const title = '배포 경로의 모든 이미지 로드·디코딩';
export const needsBrowser = true;

const framePath = (pattern, n) => String(pattern).replace(/%0(\d)d/, (_, width) => String(n).padStart(Number(width), '0'));

export async function run(ctx) {
  const wanted = [];
  for (const scene of orderedScenes(ctx.deck)) {
    const assets = scene.assets ?? {};
    for (const src of assets.images ?? []) wanted.push({ scene: scene.id, src });
    if (assets.poster) wanted.push({ scene: scene.id, src: assets.poster });
    if (assets.frames && Number.isInteger(assets.count)) {
      for (let n = 1; n <= assets.count; n += 1) wanted.push({ scene: scene.id, src: framePath(assets.frames, n) });
    }
    if (assets.mobileFrames && Number.isInteger(assets.count)) {
      for (let n = 1; n <= assets.count; n += 1) wanted.push({ scene: scene.id, src: framePath(assets.mobileFrames, n) });
    }
  }
  const { page, context } = await openPage(ctx.browser);
  try {
    await page.goto(ctx.baseURL, { waitUntil: 'domcontentloaded' });
    const failures = await page.evaluate(async (items) => {
      const failed = [];
      let cursor = 0;
      const worker = async () => {
        while (cursor < items.length) {
          const item = items[cursor++];
          const url = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(item.src)
            ? item.src : new URL(item.src.replace(/^\/+/, ''), document.baseURI).href;
          const image = new Image();
          image.src = url;
          try {
            await image.decode();
            if (!image.naturalWidth || !image.naturalHeight) throw new Error('zero dimensions');
          } catch {
            failed.push(`${item.scene}: ${url}`);
          }
        }
      };
      await Promise.all(Array.from({ length: Math.min(8, items.length) }, worker));
      return failed;
    }, wanted);
    return {
      ok: failures.length === 0,
      details: `${wanted.length}개 이미지 디코딩 검사 · 실패 ${failures.length}개`,
      items: failures.slice(0, 30),
    };
  } finally {
    await context.close();
  }
}

export default { id, title, needsBrowser, run };
