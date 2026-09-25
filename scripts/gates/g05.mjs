/**
 * G5 — 핀 거리 실측: pin-spacer 높이 − 실제 section 높이 = pinVh% × 뷰포트 높이 (±2px).
 *
 * fc-astra에서 ScrollTrigger end를 `+=${pinVh}vh`로 줬다가 핀 거리가 1/9로 줄었다.
 * ScrollTrigger의 상대 `%`도 section 높이에 영향을 받을 수 있다. 그래서 엔진은
 * 뷰포트 픽셀을 전달하고, 이 게이트는 section 자체의 초과 높이를 제외해 측정한다.
 */
import { orderedScenes } from './_util.mjs';
import { expectedPinDistance, scenePace } from '../lib/wheel.mjs';
import { mainDrive } from './_drive.mjs';

export const id = 'G5';
export const title = '핀 거리 = pace.scrollVh% × 뷰포트 (±2px)';
export const needsBrowser = true;
export const TOLERANCE = 2;

export async function run(ctx) {
  const drive = await mainDrive(ctx);
  const byId = new Map(drive.ranges.map((r) => [r.id, r]));
  const problems = [];
  const measured = [];

  for (const scene of orderedScenes(ctx.deck)) {
    const range = byId.get(scene.id);
    if (!range) { problems.push(`${scene.id}: 페이지에서 [data-scene] 섹션을 찾지 못했습니다`); continue; }

    const pace = scenePace(scene);
    const shouldPin = pace.mode !== 'pass' && pace.scrollVh > 0;
    if (!shouldPin) {
      if (range.pinned) problems.push(`${scene.id}: pass 장면인데 pin-spacer가 생겼습니다`);
      continue;
    }
    if (!range.pinned) { problems.push(`${scene.id}: 핀이 걸리지 않았습니다 (pin-spacer 없음)`); continue; }

    const expected = expectedPinDistance(pace.scrollVh, drive.innerHeight);
    const delta = range.pinDistance - expected;
    measured.push({ id: scene.id, expected: Math.round(expected), actual: range.pinDistance, delta: Math.round(delta) });
    if (Math.abs(delta) > TOLERANCE) {
      problems.push(
        `${scene.id}: 핀 거리 ${range.pinDistance}px, 기대 ${Math.round(expected)}px (scrollVh ${pace.scrollVh}) — 차이 ${Math.round(delta)}px`,
      );
    }
  }

  return {
    ok: problems.length === 0,
    details: problems.length === 0
      ? `핀 장면 ${measured.length}개 전부 ±${TOLERANCE}px 이내`
      : `핀 거리 불일치 ${problems.length}건`,
    items: problems,
    measured,
  };
}

export default { id, title, needsBrowser, run };
