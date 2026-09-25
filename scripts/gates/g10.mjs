/**
 * G10 — 모션 축소(prefers-reduced-motion: reduce)에서 핀이 하나도 걸리지 않고,
 *       각 장면이 완성된 정지 화면으로 읽힌다(가시 요소 ≥3).
 *
 * 엔진은 reduced일 때 안무를 만들지 않고 최종 상태로 둔다. 그래서 "CSS 정지 상태 = 완성 프레임"이
 * 지켜지지 않은 장면은 여기서 빈 화면으로 드러난다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { orderedScenes, deckPaths } from './_util.mjs';
import { pinSpacerCount, sceneRanges, wheelTo, wheelToBottom, wheelHome, collectEntries, countVisible } from '../lib/wheel.mjs';
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
  // Reduced galleries can expand after lazy images decode. Traverse once before
  // measuring, then remeasure each target as we move through the document.
  await wheelToBottom(page, { tick: 700 });
  await wheelHome(page, { tick: 700 });
  const counts = [];
  const { qaDir } = deckPaths(ctx.dir);
  fs.mkdirSync(qaDir, { recursive: true });

  for (const scene of orderedScenes(ctx.deck)) {
    let found = false;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const range = (await sceneRanges(page)).find((r) => r.id === scene.id);
      if (!range) break;
      // 핀이 없으므로 섹션 한가운데가 화면에 오도록 세운다.
      await wheelTo(page, Math.max(0, Math.round(range.start + range.height / 2 - innerHeight / 2)), { tick: 700 });
      const rect = await page.evaluate((id) => {
        const section = document.querySelector(`[data-scene="${id}"]`);
        if (!section) return null;
        const box = section.getBoundingClientRect();
        return { top: box.top, bottom: box.bottom };
      }, scene.id);
      if (rect && rect.top <= innerHeight * .65 && rect.bottom >= innerHeight * .35) { found = true; break; }
    }
    if (!found) { problems.push(`${scene.id}: 모션 축소 화면의 섹션을 중앙에 놓지 못했습니다`); continue; }
    const visible = countVisible(await collectEntries(page, scene.id), { width: 1440, height: 900 });
    counts.push({ id: scene.id, visible });
    if (visible < MIN_VISIBLE) {
      problems.push(`${scene.id}: 정지 화면의 가시 요소가 ${visible}개입니다 (최소 ${MIN_VISIBLE})`);
    }
    // A title and source can satisfy MIN_VISIBLE while the scene's actual
    // gallery/choice states remain opacity:0. At least one authored step must
    // survive as a readable static state when choreography is disabled.
    const stepState = await page.evaluate((id) => {
      const section = document.querySelector(`[data-scene="${id}"]`);
      const steps = [...(section?.querySelectorAll('[data-step]') ?? [])];
      const shown = steps.filter((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2 || rect.right <= 0 || rect.left >= innerWidth || rect.bottom <= 0 || rect.top >= innerHeight) return false;
        for (let node = el; node && node !== section.parentElement; node = node.parentElement) {
          const style = getComputedStyle(node);
          if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) <= .05) return false;
        }
        return true;
      });
      return { total: steps.length, shown: shown.length };
    }, scene.id);
    if (stepState.total > 0 && stepState.shown === 0) {
      problems.push(`${scene.id}: 모션 축소에서 발표 단계 ${stepState.total}개가 모두 숨겨져 있습니다`);
    }
    try { await page.screenshot({ path: path.join(qaDir, `${scene.id}-reduced.jpg`), type: 'jpeg', quality: 80 }); }
    catch (error) { problems.push(`${scene.id}: 모션 감소 캡처 실패 — ${String(error?.message ?? error).split('\n')[0]}`); }
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
