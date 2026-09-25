/** G14 — projector-width captures and exit visibility through real wheel input. */
import fs from 'node:fs';
import path from 'node:path';
import { deckPaths, orderedScenes } from './_util.mjs';
import { openDeck, PROBES } from './_drive.mjs';
import { wheelTo, wheelToBottom, wheelHome, sceneRanges, reachableProbeY, visibleCount, visibleMediaCount } from '../lib/wheel.mjs';
import { auditTextGeometry } from '../lib/layout-audit.mjs';

export const id = 'G14';
export const title = '1920×1080 진입·정지·퇴장 및 글자 기하';
export const needsBrowser = true;

export async function run(ctx) {
  const { page, context, errors } = await openDeck(ctx, { width: 1920, height: 1080 });
  ctx.cleanups.push(async () => { try { await context.close(); } catch { /* closed */ } });
  const qaDir = deckPaths(ctx.dir).qaDir;
  fs.mkdirSync(qaDir, { recursive: true });
  for (const file of fs.readdirSync(qaDir)) {
    if (/-\d{2}-1920\.jpg$/.test(file)) fs.rmSync(path.join(qaDir, file));
  }
  await wheelToBottom(page, { tick: 520, wait: 35 });
  const ranges = new Map((await sceneRanges(page)).map((range) => [range.id, range]));
  const maxY = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - innerHeight));
  await wheelHome(page, { tick: 520, wait: 35 });

  const problems = [];
  let captures = 0;
  const scenes = orderedScenes(ctx.deck);
  for (const scene of scenes) {
    const range = ranges.get(scene.id);
    if (!range) { problems.push(`${scene.id}: 1920px 장면 구간 없음`); continue; }
    for (const percent of PROBES) {
      const target = reachableProbeY(range, percent / 100, 1080, maxY, scene === scenes.at(-1));
      const moved = await wheelTo(page, target, { tick: 240, wait: 50, maxTicks: 600, tolerance: 12 });
      if (!moved.reached) problems.push(`${scene.id} ${percent}%: 1920px 휠 위치 ${moved.y}px, 목표 ${target}px`);
      await page.screenshot({ path: path.join(qaDir, `${scene.id}-${percent}-1920.jpg`), type: 'jpeg', quality: 88 });
      captures += 1;
      if (percent === 55) {
        for (const issue of await auditTextGeometry(page, scene.id)) problems.push(`${scene.id} 1920px 55%: ${issue}`);
      }
      if (range.pinDistance > 0 && percent >= 96 && await visibleCount(page, scene.id) < 1) {
        problems.push(`${scene.id} ${percent}%: 1920px 퇴장 화면이 비었습니다`);
      }
      if (range.pinDistance === 0 && percent >= 85) {
        const next = scenes[scenes.indexOf(scene) + 1];
        const content = await visibleCount(page, scene.id) + (next ? await visibleCount(page, next.id) : 0);
        if (content < 1) problems.push(`${scene.id} ${percent}%: 통과 장면과 다음 장면 사이가 비었습니다`);
      }
      if (range.pinDistance > 0 && percent === 85 && hasMedia(scene) && await visibleMediaCount(page, scene.id) < 1) {
        problems.push(`${scene.id} 1920px 85%: 이미지 장면에서 시각 근거가 사라졌습니다`);
      }
    }
  }
  for (const error of [...new Set(errors)].slice(0, 6)) problems.push(`1920px 오류 — ${error}`);
  return {
    ok: problems.length === 0,
    details: problems.length ? `1920px 문제 ${problems.length}건` : `1920×1080 캡처 ${captures}장 · 96/99% 퇴장 · 글자 기하 확인`,
    items: problems,
  };
}

function hasMedia(scene) {
  const assets = scene.assets ?? {};
  return Boolean(assets.poster || assets.frames || assets.video || assets.images?.length || assets.photos?.length);
}

export default { id, title, needsBrowser, run };
