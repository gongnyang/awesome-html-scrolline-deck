/**
 * G9 — 가로 넘침 0 (1440 데스크톱 · 390 모바일).
 * 수평 갤러리·와이프 장면이 컨테이너 밖으로 밀리면 발표 화면 아래에 가로 스크롤바가 생긴다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { horizontalOverflow, wheelToBottom, wheelTo, sceneRanges, probeY } from '../lib/wheel.mjs';
import { openDeck, mainDrive } from './_drive.mjs';
import { deckPaths, orderedScenes } from './_util.mjs';

export const id = 'G9';
export const title = '가로 넘침 0 (1440 · 390)';
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
  for (const scene of orderedScenes(ctx.deck)) {
    const range = ranges.get(scene.id);
    if (!range) { problems.push(`${scene.id}: 모바일 장면 범위를 찾지 못했습니다`); continue; }
    const cue = Array.isArray(scene.cues) && scene.cues.length
      ? scene.cues.reduce((best, value) => Math.abs(value - .55) < Math.abs(best - .55) ? value : best, scene.cues[0])
      : .55;
    await wheelTo(page, probeY(range, cue, 844), { tick: 700 });
    mobile = Math.max(mobile, await horizontalOverflow(page));
    const file = path.join(qaDir, `${scene.id}-mobile.jpg`);
    try { await page.screenshot({ path: file, type: 'jpeg', quality: 80 }); captures += 1; }
    catch (error) { problems.push(`${scene.id}: 모바일 캡처 실패 — ${String(error?.message ?? error).split('\n')[0]}`); }
  }
  if (mobile > 0 && !problems.some((item) => item.startsWith('390 뷰포트'))) problems.push(`390 뷰포트에서 가로 넘침 ${mobile}px`);

  return {
    ok: problems.length === 0,
    details: problems.length === 0 ? `가로 넘침 없음 (1440 · 390) · 모바일 캡처 ${captures}장` : `모바일 검증 문제 ${problems.length}건`,
    items: problems,
    measured: { desktop: drive.overflow, mobile },
  };
}

export default { id, title, needsBrowser, run };
