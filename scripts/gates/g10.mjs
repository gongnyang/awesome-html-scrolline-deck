/**
 * G10 — 모션 축소(prefers-reduced-motion: reduce)에서 핀이 하나도 걸리지 않고,
 *       각 장면이 완성된 정지 화면으로 읽힌다(가시 요소 ≥3).
 *
 * 엔진은 reduced일 때 안무를 만들지 않고 최종 상태로 둔다. 그래서 "CSS 정지 상태 = 완성 프레임"이
 * 지켜지지 않은 장면은 여기서 빈 화면으로 드러난다.
 */
import { orderedScenes } from './_util.mjs';
import { pinSpacerCount, sceneRanges, wheelTo, collectEntries, countVisible } from '../lib/wheel.mjs';
import { openDeck } from './_drive.mjs';

export const id = 'G10';
export const title = '모션 축소: 핀 0 · 장면마다 정지 프레임 완성';
export const needsBrowser = true;
export const MIN_VISIBLE = 3;

export async function run(ctx) {
  const { page, context, errors } = await openDeck(ctx, { width: 1440, height: 900, reducedMotion: 'reduce' });
  ctx.cleanups.push(async () => { try { await context.close(); } catch { /* 무시 */ } });

  const problems = [];
  const pins = await pinSpacerCount(page);
  if (pins !== 0) problems.push(`모션 축소인데 pin-spacer가 ${pins}개 생겼습니다`);

  const innerHeight = await page.evaluate(() => window.innerHeight);
  const ranges = new Map((await sceneRanges(page)).map((r) => [r.id, r]));
  const counts = [];

  for (const scene of orderedScenes(ctx.deck)) {
    const range = ranges.get(scene.id);
    if (!range) { problems.push(`${scene.id}: 섹션을 찾지 못했습니다`); continue; }
    // 핀이 없으므로 섹션 한가운데가 화면에 오도록 세운다.
    await wheelTo(page, Math.max(0, Math.round(range.start + range.height / 2 - innerHeight / 2)));
    const visible = countVisible(await collectEntries(page, scene.id), { width: 1440, height: 900 });
    counts.push({ id: scene.id, visible });
    if (visible < MIN_VISIBLE) {
      problems.push(`${scene.id}: 정지 화면의 가시 요소가 ${visible}개입니다 (최소 ${MIN_VISIBLE})`);
    }
  }

  const unique = [...new Set(errors)];
  if (unique.length) problems.push(...unique.slice(0, 6).map((e) => `모션 축소 주행 중 오류 — ${e}`));

  return {
    ok: problems.length === 0,
    details: problems.length === 0
      ? `핀 0개 · 장면 ${counts.length}개 정지 프레임 완성`
      : `모션 축소 문제 ${problems.length}건`,
    items: problems,
    counts,
  };
}

export default { id, title, needsBrowser, run };
