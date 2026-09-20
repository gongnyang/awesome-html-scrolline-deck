/**
 * _drive.mjs — 브라우저 게이트가 공유하는 한 번의 주행.
 *
 * G5·G6·G8·G9는 같은 주행에서 나온 기하·캡처·오류를 본다. 게이트마다 크롬을 다시 띄우면
 * 검수가 분 단위로 길어지고, 더 나쁘게는 게이트마다 다른 레이아웃을 보게 된다.
 * ctx.mainDrive()는 한 번만 돌고 결과를 ctx.cache에 남긴다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { openPage } from '../lib/browser.mjs';
import {
  wheelTo, wheelToBottom, wheelHome, sceneRanges, collectEntries, countVisible,
  horizontalOverflow, probeY,
} from '../lib/wheel.mjs';
import { deckPaths, orderedScenes } from './_util.mjs';

export const PROBES = [30, 55, 85];

/** 페이지를 열고 폰트·프리로더가 끝나길 기다린다. */
export async function openDeck(ctx, options = {}) {
  const opened = await openPage(ctx.browser, options);
  await opened.page.goto(ctx.baseURL, { waitUntil: 'networkidle', timeout: 60_000 });
  await opened.page.waitForTimeout(1500);
  return opened;
}

/**
 * 1440x900에서 전 장면을 휠로 굴리며 기하·가시요소·캡처·오류를 한꺼번에 거둔다.
 * @returns {Promise<{ranges, visible:Map, captures:string[], errors:string[], overflow:number, innerHeight:number}>}
 */
export async function mainDrive(ctx) {
  if (ctx.cache.mainDrive) return ctx.cache.mainDrive;

  const { page, context, errors } = await openDeck(ctx, { width: 1440, height: 900 });
  const { qaDir } = deckPaths(ctx.dir);
  fs.mkdirSync(qaDir, { recursive: true });

  const innerHeight = await page.evaluate(() => window.innerHeight);
  let overflow = await horizontalOverflow(page);

  // 핀 스페이서는 ScrollTrigger가 트리거를 만들 때 생긴다. 끝까지 한 번 굴려야 전부 선다.
  await wheelToBottom(page);
  overflow = Math.max(overflow, await horizontalOverflow(page));
  const ranges = await sceneRanges(page);
  await wheelHome(page);

  const visible = new Map();
  const captures = [];
  const ordered = orderedScenes(ctx.deck);
  const byId = new Map(ranges.map((r) => [r.id, r]));

  for (const scene of ordered) {
    const range = byId.get(scene.id);
    if (!range) continue;
    for (const probe of PROBES) {
      await wheelTo(page, probeY(range, probe / 100, innerHeight));
      overflow = Math.max(overflow, await horizontalOverflow(page));
      if (probe === 55) {
        const entries = await collectEntries(page, scene.id);
        visible.set(scene.id, countVisible(entries, { width: 1440, height: 900 }));
      }
      const file = path.join(qaDir, `${scene.id}-${probe}.jpg`);
      try {
        await page.screenshot({ path: file, type: 'jpeg', quality: 60 });
        captures.push(file);
      } catch (err) {
        errors.push(`capture: ${scene.id}-${probe} ${String(err?.message ?? err).split('\n')[0]}`);
      }
    }
  }

  const result = { ranges, visible, captures, errors, overflow, innerHeight, page, context };
  ctx.cache.mainDrive = result;
  ctx.cleanups.push(async () => { try { await context.close(); } catch { /* 무시 */ } });
  return result;
}
