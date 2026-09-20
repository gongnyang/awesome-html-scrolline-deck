/**
 * G7 — ArrowRight 착지: 다음 장면의 첫 홀드 프레임(핀 거리의 35%)에 ±4px로 선다.
 *      착지한 화면은 구성이 끝나 있어야 한다(가시 요소 ≥3).
 *
 * 키로 넘겼는데 진입 애니메이션 한가운데 서면 발표자가 "반쯤 날아든 글자"를 띄운 채 말하게 된다.
 * 엔진 goTo는 startPx + pinDistance × 0.35로 이동한다. 그 값과 실제 scrollY를 맞대본다.
 *
 * 구간은 mainDrive가 같은 뷰포트(1440x900)에서 이미 실측한 값을 쓴다. 키 주행은 휠 주행과
 * 섞이면 안 되므로(휠 입력이 발표자 자동 진행을 멈추고 위치를 흔든다) 페이지는 새로 연다.
 */
import { orderedScenes } from './_util.mjs';
import { expectedPinDistance, collectEntries, countVisible, HOLD_RATIO } from '../lib/wheel.mjs';
import { openDeck, mainDrive } from './_drive.mjs';

export const id = 'G7';
export const title = 'ArrowRight 착지 오차 ≤4px · 착지 화면 구성 완료';
export const needsBrowser = true;
export const TOLERANCE = 4;
export const MIN_VISIBLE = 3;

export async function run(ctx) {
  const drive = await mainDrive(ctx);
  const ranges = new Map(drive.ranges.map((r) => [r.id, r]));

  const { page, context, errors } = await openDeck(ctx, { width: 1440, height: 900 });
  ctx.cleanups.push(async () => { try { await context.close(); } catch { /* 무시 */ } });

  const problems = [];
  const landings = [];
  const scenes = orderedScenes(ctx.deck);
  const innerHeight = await page.evaluate(() => window.innerHeight);

  for (let i = 1; i < scenes.length; i += 1) {
    const scene = scenes[i];
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1800); // lenis 기본 1.2초 + 여유

    const range = ranges.get(scene.id);
    if (!range) { problems.push(`${scene.id}: 구간을 읽지 못했습니다`); continue; }

    const pinDistance = scene.pin !== false && Number(scene.pinVh) > 0
      ? expectedPinDistance(scene.pinVh, innerHeight)
      : 0;
    const expected = Math.round(range.start + pinDistance * HOLD_RATIO);
    const actual = await page.evaluate(() => Math.round(window.scrollY));
    const delta = actual - expected;
    landings.push({ id: scene.id, expected, actual, delta });

    if (Math.abs(delta) > TOLERANCE) {
      problems.push(`${scene.id}: 착지 ${actual}px, 기대 ${expected}px — 오차 ${delta}px`);
    }
    const visible = countVisible(await collectEntries(page, scene.id), { width: 1440, height: 900 });
    if (visible < MIN_VISIBLE) {
      problems.push(`${scene.id}: 착지 화면의 가시 요소가 ${visible}개입니다 (최소 ${MIN_VISIBLE})`);
    }
  }

  for (const error of [...new Set(errors)].slice(0, 6)) problems.push(`키 이동 중 오류 — ${error}`);

  const worst = landings.reduce((max, l) => (max === null || Math.abs(l.delta) > Math.abs(max.delta) ? l : max), null);
  return {
    ok: problems.length === 0,
    details: problems.length === 0
      ? `키 착지 ${landings.length}회 · 최대 오차 ${worst ? Math.abs(worst.delta) : 0}px`
      : `착지 문제 ${problems.length}건`,
    items: problems,
    landings,
  };
}

export default { id, title, needsBrowser, run };
