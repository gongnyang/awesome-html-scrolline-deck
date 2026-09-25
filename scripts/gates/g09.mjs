/**
 * G9 — 가로 넘침 0 (1440 데스크톱 · 390 모바일).
 * 수평 갤러리·와이프 장면이 컨테이너 밖으로 밀리면 발표 화면 아래에 가로 스크롤바가 생긴다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { horizontalOverflow, wheelToBottom, wheelTo, sceneRanges, reachableProbeY, scenePace, visibleCount, visibleMediaCount } from '../lib/wheel.mjs';
import { openDeck, mainDrive } from './_drive.mjs';
import { deckPaths, orderedScenes } from './_util.mjs';
import { auditTextGeometry } from '../lib/layout-audit.mjs';

export const id = 'G9';
export const title = '가로 넘침 0 · 모바일 글자 열/충돌';
export const needsBrowser = true;

export async function run(ctx) {
  const drive = await mainDrive(ctx);
  const problems = [];
  if (drive.overflow > 0) problems.push(`1440 뷰포트에서 가로 넘침 ${drive.overflow}px`);

  // 390은 별도 주행. 모바일에서만 깨지는 레이아웃이 실제로 흔하다.
  const { page, context } = await openDeck(ctx, { width: 390, height: 844 });
  ctx.cleanups.push(async () => { try { await context.close(); } catch { /* 무시 */ } });

  let mobile = await horizontalOverflow(page);
  await wheelToBottom(page, { tick: 300 });
  mobile = Math.max(mobile, await horizontalOverflow(page));
  if (mobile > 0) problems.push(`390 뷰포트에서 가로 넘침 ${mobile}px`);

  const { qaDir } = deckPaths(ctx.dir);
  fs.mkdirSync(qaDir, { recursive: true });
  const ranges = new Map((await sceneRanges(page)).map((range) => [range.id, range]));
  let captures = 0;
  const scenes = orderedScenes(ctx.deck);
  for (const scene of scenes) {
    const range = ranges.get(scene.id);
    if (!range) { problems.push(`${scene.id}: 모바일 장면 범위를 찾지 못했습니다`); continue; }
    const cues = scenePace(scene).cues;
    const cue = cues.reduce((best, value) => Math.abs(value - .55) < Math.abs(best - .55) ? value : best, cues[0]);
    for (const percent of [30, 55, 85, 96, 99]) {
      const maxY = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - innerHeight));
      const target = reachableProbeY(range, percent / 100, 844, maxY, scene === scenes.at(-1));
      const moved = await wheelTo(page, target, { tick: 240, wait: 50, maxTicks: 600, tolerance: 12 });
      if (!moved.reached) problems.push(`${scene.id} 모바일 ${percent}%: 휠 위치 ${moved.y}px, 목표 ${target}px`);
      mobile = Math.max(mobile, await horizontalOverflow(page));
      const file = path.join(qaDir, `${scene.id}-${percent}-mobile.jpg`);
      try { await page.screenshot({ path: file, type: 'jpeg', quality: 80 }); captures += 1; }
      catch (error) { problems.push(`${scene.id} 모바일 ${percent}%: 캡처 실패 — ${String(error?.message ?? error).split('\n')[0]}`); }
      if (percent === 55) {
        for (const issue of await auditTextGeometry(page, scene.id)) problems.push(`${scene.id} 모바일 55%: ${issue}`);
      }
      if (range.pinDistance > 0 && percent >= 96 && await visibleCount(page, scene.id) < 1) {
        problems.push(`${scene.id} 모바일 ${percent}%: 퇴장 화면이 비었습니다`);
      }
      if (range.pinDistance === 0 && percent >= 85) {
        const next = scenes[scenes.indexOf(scene) + 1];
        const content = await visibleCount(page, scene.id) + (next ? await visibleCount(page, next.id) : 0);
        if (content < 1) problems.push(`${scene.id} 모바일 ${percent}%: 통과 장면과 다음 장면 사이가 비었습니다`);
      }
      if (range.pinDistance > 0 && percent === 85 && hasMedia(scene) && await visibleMediaCount(page, scene.id) < 1) {
        problems.push(`${scene.id} 모바일 85%: 이미지 장면에서 시각 근거가 사라졌습니다`);
      }
    }
    const cueMax = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - innerHeight));
    const reachableCue = reachableProbeY(range, cue, 844, cueMax, scene === scenes.at(-1));
    await wheelTo(page, reachableCue, { tick: 240, wait: 50, maxTicks: 600, tolerance: 12 });
    try { await page.screenshot({ path: path.join(qaDir, `${scene.id}-mobile.jpg`), type: 'jpeg', quality: 80 }); }
    catch (error) { problems.push(`${scene.id}: 모바일 정지 캡처 실패 — ${String(error?.message ?? error).split('\n')[0]}`); }
  }
  if (mobile > 0 && !problems.some((item) => item.startsWith('390 뷰포트'))) problems.push(`390 뷰포트에서 가로 넘침 ${mobile}px`);

  return {
    ok: problems.length === 0,
    details: problems.length === 0 ? `가로 넘침 없음 (1440 · 390) · 모바일 글자 기하 통과 · 캡처 ${captures}장` : `모바일 검증 문제 ${problems.length}건`,
    items: problems,
    measured: { desktop: drive.overflow, mobile },
  };
}

function hasMedia(scene) {
  const assets = scene.assets ?? {};
  return Boolean(assets.poster || assets.frames || assets.video || assets.images?.length || assets.photos?.length);
}

export default { id, title, needsBrowser, run };
