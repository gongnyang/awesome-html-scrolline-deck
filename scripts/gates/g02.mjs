/**
 * G2 — 장면 타임라인 총 길이 ≤ 1.001, 그리고 deck.json의 order 정합성.
 *
 * 엔진은 tl을 0..1 구간으로 보고 scrub한다. 1을 넘으면 GSAP이 전체를 1/duration으로 눌러
 * 진입(0–.30)·홀드(.30–.75)·퇴장(.75–1) 비율이 통째로 어긋난다.
 *
 * 측정 방식: 진짜 gsap 대신 TimelineRecorder를, 진짜 DOM 대신 _fake-dom의 섹션 대역을 넘겨
 * mount(section, ctx) → build(tl, ctx)를 돌리고 tl.duration()을 읽는다.
 *
 * 한계
 *  - querySelectorAll이 항상 3개를 돌려준다. stagger를 '숫자 each'로 쓰면 실제 요소 수가
 *    3보다 많을 때 과소 추정된다. 템플릿은 stagger:{amount} 를 쓰는 편이 안전하다.
 *  - 레이아웃(폭·높이) 의존 duration은 고정값 400x300 기준으로 계산된다.
 *  - 이 한계 때문에 G2는 "넘지 않음"을 보증하지 않고 "명백히 넘음"을 잡는다. 실측은 G5~G7.
 */
import { readDeck, sceneFolders, orderedScenes, exists } from './_util.mjs';
import { loadSceneModule } from './_load-scene.mjs';
import { installFakeGlobals, restoreGlobals, makeSection, makeElement } from './_fake-dom.mjs';
import { TimelineRecorder } from './_tl-recorder.mjs';
import gsapStub from './_stubs/gsap.mjs';
import ScrollTriggerStub from './_stubs/ScrollTrigger.mjs';
import Lenis from './_stubs/lenis.mjs';

export const id = 'G2';
export const title = '타임라인 총 길이 ≤ 1.001 · order 정합';
export const needsBrowser = false;

export const MAX_DURATION = 1.001;

function makeCtx(deck, scene) {
  return {
    gsap: gsapStub,
    ScrollTrigger: ScrollTriggerStub,
    lenis: new Lenis(),
    data: { deck, scene },
    reduced: false,
    mobile: false,
    tier: 'high',
    frameScrub: () => ({
      setProgress: () => {},
      destroy: () => {},
      canvas: makeElement('canvas'),
      ready: Promise.resolve(),
    }),
  };
}

/** deck.json의 order가 0/1부터 빠짐없이 이어지는지, 중복은 없는지 본다. */
function checkOrder(deck) {
  const scenes = orderedScenes(deck);
  const problems = [];
  const orders = scenes.map((s) => s?.order);
  if (orders.some((o) => !Number.isInteger(o))) problems.push('order가 정수가 아닌 장면이 있습니다');
  const unique = new Set(orders);
  if (unique.size !== orders.length) problems.push('order가 중복된 장면이 있습니다');
  const sorted = [...unique].filter(Number.isInteger).sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i] - sorted[i - 1] !== 1) {
      problems.push(`order가 이어지지 않습니다: ${sorted[i - 1]} 다음이 ${sorted[i]}`);
      break;
    }
  }
  return problems;
}

export async function run(ctx) {
  const { deck } = readDeck(ctx.dir);
  const folders = sceneFolders(ctx.dir, deck);
  const problems = checkOrder(deck);
  const measured = [];

  installFakeGlobals();
  try {
    for (const folder of folders) {
      if (!folder.onDisk || !folder.js || !exists(folder.js)) continue;

      let mod = ctx.cache?.scenes?.get(folder.id);
      if (!mod) {
        const loaded = await loadSceneModule(folder.js);
        if (!loaded.ok) { problems.push(`${folder.id}: scene.js 로드 실패 — ${loaded.error}`); continue; }
        mod = loaded.module?.default;
      }
      if (!mod || typeof mod.build !== 'function') continue; // 계약 위반은 G1이 본다

      const scene = folder.scene ?? { id: folder.id, technique: 'unknown', pinVh: 180 };
      const section = makeSection(folder.id, scene.technique ?? 'unknown');
      const sceneCtx = makeCtx(deck, scene);
      const tl = new TimelineRecorder();

      try { mod.mount?.(section, sceneCtx); }
      catch (err) { problems.push(`${folder.id}: mount()가 예외를 던졌습니다 — ${String(err?.message ?? err).split('\n')[0]}`); continue; }

      try { mod.build(tl, sceneCtx); }
      catch (err) { problems.push(`${folder.id}: build()가 예외를 던졌습니다 — ${String(err?.message ?? err).split('\n')[0]}`); continue; }

      try { mod.unmount?.(); } catch { /* 정리 실패는 여기서 따지지 않는다 */ }

      const duration = Number(tl.duration());
      measured.push({ id: folder.id, duration, entries: tl.entries.length });
      if (!Number.isFinite(duration)) {
        problems.push(`${folder.id}: 타임라인 길이를 계산할 수 없습니다`);
      } else if (duration > MAX_DURATION) {
        const worst = tl.worst();
        const where = worst ? ` (가장 늦게 끝나는 항목: ${worst.kind} ${worst.start.toFixed(3)}→${worst.end.toFixed(3)})` : '';
        problems.push(`${folder.id}: 타임라인 길이 ${duration.toFixed(3)} > 1.001${where}`);
      } else if (tl.entries.length === 0) {
        problems.push(`${folder.id}: build()가 타임라인에 아무것도 얹지 않았습니다`);
      }
    }
  } finally {
    restoreGlobals();
  }

  const longest = measured.reduce((max, m) => (m.duration > max ? m.duration : max), 0);
  return {
    ok: problems.length === 0,
    details: problems.length === 0
      ? `장면 ${measured.length}개 · 최장 타임라인 ${longest.toFixed(3)}`
      : `문제 ${problems.length}건 (측정한 장면 ${measured.length}개)`,
    items: problems,
    measured,
  };
}

export default { id, title, needsBrowser, run };
