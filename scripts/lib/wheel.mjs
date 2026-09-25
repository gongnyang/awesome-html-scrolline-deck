/**
 * wheel.mjs — 휠 입력으로만 덱을 굴리고 기하를 읽는다.
 *
 * 왜 휠인가: 스크롤 위치를 코드로 직접 옮기면 lenis와 ScrollTrigger의 실제 입력 경로를 건너뛴다.
 * 핀이 안 걸려도, 스크럽이 멎어도 통과해 버린다. 그래서 검수는 마우스 휠 틱만 쓴다(G4가 강제).
 *
 * 순수 함수(브라우저 없이 단위 테스트 가능)와 페이지 조작 함수를 함께 둔다.
 */

export const TICK = 240;          // 휠 한 칸(px). fc-astra 실측에서 lenis가 따라오는 크기.
export const TICK_WAIT = 50;      // 틱 사이 대기(ms). lenis 보간이 한 프레임 이상 돌게 한다.
export const SETTLE = 700;        // 목표 도달 후 정착 대기(ms). Lenis 보간과 브라우저 페인트가 끝날 시간을 준다.
export const HOLD_RATIO = 0.35;   // 키 이동 착지 지점 = 핀 거리의 35%(엔진 goTo와 같은 값).
export const MIN_AREA = 400;      // 가시 판정 최소 면적(px²).
export const MIN_OPACITY = 0.05;  // 가시 판정 최소 불투명도.

/* ------------------------------ 순수 계산 ------------------------------ */

/**
 * pin-spacer 기하 → 장면 구간.
 * 핀이 걸린 장면은 spacer 높이에서 실제 section 높이를 뺀 만큼이 핀 거리다.
 * 문구가 줄바꿈되어 section이 뷰포트보다 커져도 핀 길이는 그대로여야 한다.
 * 핀이 없는 장면은 제자리를 지나가므로 핀 거리 0으로 본다.
 */
export function computeRange({ top, height, scrollY = 0, innerHeight = 900, sectionHeight = innerHeight, pinned = true }) {
  const start = Math.round(top + scrollY);
  const pinDistance = pinned ? Math.max(0, Math.round(height - sectionHeight)) : 0;
  return { start, pinDistance, end: start + pinDistance, height: Math.round(height), pinned: Boolean(pinned) };
}

/** deck.json의 pinVh가 뜻하는 픽셀 핀 거리. 엔진은 이 뷰포트 기준 거리를 ScrollTrigger에 전달한다. */
export function expectedPinDistance(pinVh, innerHeight) {
  return (Number(pinVh) / 100) * Number(innerHeight);
}

/** Resolve v2 pacing without changing the geometry of legacy decks. */
export function scenePace(scene) {
  return {
    mode: scene.pace?.mode ?? (scene.pin === false ? 'pass' : 'scrub'),
    scrollVh: Number(scene.pace?.scrollVh ?? scene.pinVh ?? 0),
    cues: Array.isArray(scene.pace?.cueStates) && scene.pace.cueStates.length
      ? scene.pace.cueStates.map((cue) => cue.at)
      : Array.isArray(scene.cues) && scene.cues.length ? scene.cues : [HOLD_RATIO],
  };
}

/** 장면 진행률 p(0..1) 지점의 문서 좌표. */
export function progressY(range, p) {
  return Math.round(range.start + range.pinDistance * Math.min(1, Math.max(0, p)));
}

/**
 * 장면 진행률 p를 문서 좌표로. 핀이 없는 장면은 `top bottom`→`bottom top` 구간을 쓰므로
 * 섹션 높이와 뷰포트 높이를 합친 범위로 환산한다.
 */
export function probeY(range, p, innerHeight = 900) {
  const clamped = Math.min(1, Math.max(0, p));
  if (range.pinDistance > 0) return Math.round(range.start + range.pinDistance * clamped);
  const span = range.height + innerHeight;
  return Math.max(0, Math.round(range.start - innerHeight + span * clamped));
}

/** A final unpinned scene stays fully in view at the document end; it has no exit into a following scene. */
export function reachableProbeY(range, p, innerHeight, maxY, terminal = false) {
  const target = probeY(range, p, innerHeight);
  return terminal && range.pinDistance === 0 ? Math.min(target, maxY) : target;
}

/** 키 이동(ArrowRight) 착지 지점. 진입 애니메이션이 아니라 첫 홀드 프레임에 선다. */
export function landingY(range, ratio = HOLD_RATIO) {
  return Math.round(range.start + range.pinDistance * ratio);
}

/**
 * 가시 판정. 뷰포트와 겹치는 면적 ≥400px², 누적 불투명도 >.05,
 * 그리고 글자·이미지·캔버스·영상·svg 중 하나일 것.
 */
export function isVisibleEntry(entry, view = { width: 1440, height: 900 }) {
  if (!entry || !entry.rect) return false;
  if (entry.kind === 'other') return false;
  if (!(Number(entry.opacity) > MIN_OPACITY)) return false;
  if (entry.hidden) return false;
  const { rect } = entry;
  const left = Math.max(0, rect.left);
  const top = Math.max(0, rect.top);
  const right = Math.min(view.width, rect.right);
  const bottom = Math.min(view.height, rect.bottom);
  const width = right - left;
  const height = bottom - top;
  if (width <= 0 || height <= 0) return false;
  return width * height >= MIN_AREA;
}

export function countVisible(entries, view) {
  return (entries ?? []).filter((e) => isVisibleEntry(e, view)).length;
}

/* ------------------------------ 페이지 조작 ------------------------------ */

const y = (page) => page.evaluate(() => window.scrollY);

/** 휠 커서를 본문 한가운데 둔다. 일부 장면은 가로 스크롤 영역 위에서 휠을 먹는다. */
export async function primeWheel(page) {
  const size = page.viewportSize() ?? { width: 1440, height: 900 };
  await page.mouse.move(Math.round(size.width / 2), Math.round(size.height / 2));
}

/**
 * 휠 틱만으로 targetY까지 내려간다(또는 올라간다).
 * @returns {Promise<{reached:boolean, y:number, ticks:number}>}
 */
export async function wheelTo(page, targetY, { tick = TICK, wait = TICK_WAIT, maxTicks = 600, tolerance = 8 } = {}) {
  await primeWheel(page);
  let current = await y(page);
  let ticks = 0;
  let stalled = 0;

  while (ticks < maxTicks) {
    const remaining = targetY - current;
    if (Math.abs(remaining) <= tolerance) break;
    const step = Math.sign(remaining) * Math.min(tick, Math.max(8, Math.abs(remaining)));
    await page.mouse.wheel(0, step);
    await page.waitForTimeout(wait);
    ticks += 1;
    const next = await y(page);
    if (Math.abs(next - current) < 1) {
      stalled += 1;
      if (stalled >= 8) break; // 문서 끝이거나 휠을 먹는 영역이다
    } else {
      stalled = 0;
    }
    current = next;
  }

  // Lenis can still travel after the last wheel tick. Let it settle, then
  // correct that residual with small real wheel input before a QA capture.
  for (let correction = 0; correction < 5; correction += 1) {
    await page.waitForTimeout(SETTLE);
    current = await y(page);
    const remaining = targetY - current;
    if (Math.abs(remaining) <= tolerance) break;
    await page.mouse.wheel(0, Math.sign(remaining) * Math.min(120, Math.abs(remaining)));
    ticks += 1;
  }
  await page.waitForTimeout(SETTLE);
  current = await y(page);
  return { reached: Math.abs(current - targetY) <= tolerance, y: current, ticks };
}

/** 문서 끝까지 굴린다. 핀 스페이서가 전부 생성되어야 기하를 읽을 수 있다. */
export async function wheelToBottom(page, { tick = TICK, wait = TICK_WAIT, maxTicks = 900 } = {}) {
  await primeWheel(page);
  let previous = -1;
  let ticks = 0;
  let stalled = 0;
  while (ticks < maxTicks) {
    await page.mouse.wheel(0, tick);
    await page.waitForTimeout(wait);
    ticks += 1;
    const current = await y(page);
    if (current <= previous + 1) {
      stalled += 1;
      if (stalled >= 10) break;
    } else {
      stalled = 0;
    }
    previous = current;
  }
  await page.waitForTimeout(SETTLE);
  return { y: await y(page), ticks };
}

/** 맨 위로 되돌린다. 역시 휠만 쓴다. */
export async function wheelHome(page, options = {}) {
  return wheelTo(page, 0, { maxTicks: 900, tolerance: 4, ...options });
}

/**
 * 장면별 구간을 읽는다. 핀이 걸린 장면은 부모 .pin-spacer가 레이아웃 앵커다.
 * @returns {Promise<Array<{id,start,pinDistance,end,height,pinned}>>}
 */
export async function sceneRanges(page) {
  const raw = await page.evaluate(() => {
    const out = [];
    for (const section of document.querySelectorAll('[data-scene]')) {
      const parent = section.parentElement;
      const spacer = parent && parent.classList.contains('pin-spacer') ? parent : null;
      const anchor = spacer ?? section;
      const rect = anchor.getBoundingClientRect();
      out.push({
        id: section.dataset.scene,
        technique: section.dataset.technique ?? '',
        top: rect.top,
        height: rect.height,
        sectionHeight: section.getBoundingClientRect().height,
        pinned: Boolean(spacer),
        scrollY: window.scrollY,
        innerHeight: window.innerHeight,
      });
    }
    return out;
  });
  return raw.map((r) => ({ id: r.id, technique: r.technique, ...computeRange(r) }));
}

/** .pin-spacer 개수. 모션 축소에서는 0이어야 한다(G10). */
export function pinSpacerCount(page) {
  return page.evaluate(() => document.querySelectorAll('.pin-spacer').length);
}

/** 가로 넘침(px). 0을 넘으면 발표 화면에 가로 스크롤바가 생긴다. */
export function horizontalOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return Math.max(0, Math.round(Math.max(doc.scrollWidth, document.body.scrollWidth) - doc.clientWidth));
  });
}

/**
 * 한 장면 섹션 안에서 "보이는 후보" 목록을 뽑는다. 판정은 Node 쪽 isVisibleEntry가 한다
 * (같은 규칙을 브라우저와 테스트가 나눠 쓰게 하려고 수집과 판정을 분리했다).
 */
export async function collectEntries(page, sceneId) {
  return page.evaluate((sel) => {
    const section = document.querySelector(`[data-scene="${sel}"]`);
    if (!section) return [];
    const MEDIA = new Set(['IMG', 'CANVAS', 'VIDEO', 'SVG', 'PICTURE']);
    const out = [];
    const all = section.querySelectorAll('*');
    for (const el of all) {
      if (out.length >= 400) break;
      const style = window.getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') continue;

      // 조상까지 누적한 불투명도. GSAP은 부모에 opacity를 걸어 자식을 통째로 감추곤 한다.
      let opacity = 1;
      let node = el;
      while (node && node !== document.documentElement) {
        const o = Number(window.getComputedStyle(node).opacity);
        if (Number.isFinite(o)) opacity *= o;
        if (opacity <= 0.001) break;
        node = node.parentElement;
      }

      const tag = el.tagName.toUpperCase();
      let kind = 'other';
      if (MEDIA.has(tag)) kind = tag.toLowerCase();
      else {
        const hasOwnText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
        if (hasOwnText) kind = 'text';
      }
      if (kind === 'other') continue;

      const r = el.getBoundingClientRect();
      out.push({
        kind,
        opacity,
        tag,
        loaded: tag === 'IMG' ? el.naturalWidth > 0
          : tag === 'CANVAS' ? el.width > 0 && el.height > 0
          : tag === 'VIDEO' ? el.readyState >= 2 || Boolean(el.poster)
          : true,
        rect: { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
      });
    }
    return out;
  }, sceneId);
}

/** 장면 하나의 가시 요소 수. */
export async function visibleCount(page, sceneId) {
  const entries = await collectEntries(page, sceneId);
  const view = page.viewportSize() ?? { width: 1440, height: 900 };
  return countVisible(entries, view);
}

/** 화면에 실제로 남은 미디어 수. 조상 opacity까지 반영한다. */
export async function visibleMediaCount(page, sceneId) {
  const entries = await collectEntries(page, sceneId);
  const view = page.viewportSize() ?? { width: 1440, height: 900 };
  return countVisible(entries.filter((entry) => entry.loaded && ['img', 'canvas', 'video'].includes(entry.kind)), view);
}
