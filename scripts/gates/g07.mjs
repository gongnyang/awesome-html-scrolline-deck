/**
 * G7 — ArrowRight 착지: 각 장면이 선언한 발표 cue에 ±4px로 선다.
 *      착지한 화면은 구성이 끝나 있어야 한다(가시 요소 ≥3).
 *
 * 키로 넘겼는데 진입 애니메이션 한가운데 서면 발표자가 "반쯤 날아든 글자"를 띄운 채 말하게 된다.
 * 엔진은 startPx + pinDistance × cue.at로 이동한다. 그 값과 실제 scrollY를 맞대본다.
 *
 * 구간은 mainDrive가 같은 뷰포트(1440x900)에서 이미 실측한 값을 쓴다. 키 주행은 휠 주행과
 * 섞이면 안 되므로(휠 입력이 발표자 자동 진행을 멈추고 위치를 흔든다) 페이지는 새로 연다.
 */
import { orderedScenes } from './_util.mjs';
import { expectedPinDistance, collectEntries, countVisible, scenePace } from '../lib/wheel.mjs';
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

  const hasCues = scenes.some((scene) =>
    (Array.isArray(scene.cues) && scene.cues.length) ||
    (Array.isArray(scene.pace?.cueStates) && scene.pace.cueStates.length));
  const stops = scenes.flatMap((scene, index) => {
    if (!hasCues && index === 0) return [];
    const ratios = scenePace(scene).cues;
    return ratios.map((ratio, cueIndex) => ({ scene, ratio, cueIndex }));
  });

  for (const { scene, ratio, cueIndex } of stops) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(hasCues ? 1050 : 1800);

    const range = ranges.get(scene.id);
    if (!range) { problems.push(`${scene.id}: 구간을 읽지 못했습니다`); continue; }

    const pace = scenePace(scene);
    const pinDistance = pace.mode !== 'pass' && pace.scrollVh > 0
      ? expectedPinDistance(pace.scrollVh, innerHeight)
      : 0;
    const expected = Math.round(range.start + pinDistance * ratio);
    const actual = await page.evaluate(() => Math.round(window.scrollY));
    const delta = actual - expected;
    landings.push({ id: scene.id, cueIndex, expected, actual, delta });

    if (Math.abs(delta) > TOLERANCE) {
      problems.push(`${scene.id} cue ${cueIndex + 1}: 착지 ${actual}px, 기대 ${expected}px — 오차 ${delta}px`);
    }
    const visible = countVisible(await collectEntries(page, scene.id), { width: 1440, height: 900 });
    if (visible < MIN_VISIBLE) {
      problems.push(`${scene.id} cue ${cueIndex + 1}: 착지 화면의 가시 요소가 ${visible}개입니다 (최소 ${MIN_VISIBLE})`);
    }
  }

  if (hasCues && stops.length > 1) {
    // Remote controls emit repeated keydown events. One held key must advance
    // exactly one cue, and a deliberate reverse press must return to the prior cue.
    await page.keyboard.press('1');
    await page.waitForTimeout(1200);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowRight', repeat: true, bubbles: true,
    })));
    await page.waitForTimeout(1200);
    const stopY = ({ scene, ratio }) => {
      const range = ranges.get(scene.id);
      const pace = scenePace(scene);
      return Math.round(range.start + (pace.mode === 'pass' ? 0 : expectedPinDistance(pace.scrollVh, innerHeight) * ratio));
    };
    const afterBurst = Math.round(await page.evaluate(() => window.scrollY));
    if (Math.abs(afterBurst - stopY(stops[1])) > TOLERANCE) {
      problems.push(`키 연타/길게 누름: ${afterBurst}px, 다음 cue ${stopY(stops[1])}px 예상`);
    }
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(1200);
    const afterReverse = Math.round(await page.evaluate(() => window.scrollY));
    if (Math.abs(afterReverse - stopY(stops[0])) > TOLERANCE) {
      problems.push(`역방향 키: ${afterReverse}px, 이전 cue ${stopY(stops[0])}px 예상`);
    }

    // A large real wheel input may cross cues; the picture must remain visible
    // and a numeric jump must restore a stable speaking frame afterwards.
    for (const delta of [2400, -2400]) {
      await page.mouse.wheel(0, delta);
      await page.waitForTimeout(1100);
      let visible = 0;
      for (const scene of scenes) {
        visible += countVisible(await collectEntries(page, scene.id), { width: 1440, height: 900 });
      }
      if (visible === 0) problems.push(`큰 휠 입력 ${delta}px 뒤 발표 화면이 비었습니다`);
    }
    await page.keyboard.press('1');
    await page.waitForTimeout(1200);
    const recovered = Math.round(await page.evaluate(() => window.scrollY));
    if (Math.abs(recovered - stopY(stops[0])) > TOLERANCE) {
      problems.push(`큰 휠 입력 후 복구: ${recovered}px, 첫 cue ${stopY(stops[0])}px 예상`);
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
