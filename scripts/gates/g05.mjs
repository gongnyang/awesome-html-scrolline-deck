/**
 * G5 — 핀 거리 실측: pin-spacer 높이 − 뷰포트 높이 = pinVh% × 뷰포트 높이 (±2px).
 *
 * fc-astra에서 ScrollTrigger end를 `+=${pinVh}vh`로 줬다가 핀 거리가 1/9로 줄었다.
 * ScrollTrigger의 end 문자열은 vh를 모른다 — `%`만 뷰포트 높이 기준으로 해석한다.
 * 이 게이트는 그 단위 사고를 실측으로 잡는다.
 */
import { orderedScenes } from './_util.mjs';
import { expectedPinDistance } from '../lib/wheel.mjs';
import { mainDrive } from './_drive.mjs';

export const id = 'G5';
export const title = '핀 거리 = pinVh% × 뷰포트 (±2px)';
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

    const shouldPin = scene.pin !== false && Number(scene.pinVh) > 0;
    if (!shouldPin) {
      if (range.pinned) problems.push(`${scene.id}: pin:false 인데 pin-spacer가 생겼습니다`);
      continue;
    }
    if (!range.pinned) { problems.push(`${scene.id}: 핀이 걸리지 않았습니다 (pin-spacer 없음)`); continue; }

    const expected = expectedPinDistance(scene.pinVh, drive.innerHeight);
    const delta = range.pinDistance - expected;
    measured.push({ id: scene.id, expected: Math.round(expected), actual: range.pinDistance, delta: Math.round(delta) });
    if (Math.abs(delta) > TOLERANCE) {
      problems.push(
        `${scene.id}: 핀 거리 ${range.pinDistance}px, 기대 ${Math.round(expected)}px (pinVh ${scene.pinVh}) — 차이 ${Math.round(delta)}px`,
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
