/** 통합 진입(CONTRACTS C12, C15). */
import { EVENTS, RESIZE, VERSION } from './constants.js';
import { createA11y, prefersReducedMotion } from './a11y.js';
import { validateDeck } from './deck-schema.js';
import { buildExportTimeline, exportHolds, exportPath, toExportSeconds } from './export.js';
import { frameSequence, preloadImages, videoClip } from './media.js';
import { createPresenter } from './presenter.js';
import { createScrollDriver } from './scroll.js';
import { computeViewport, createStage } from './stage.js';
import { build, plan } from './timeline.js';
import { chars, el, words } from './util/dom.js';
import { beatTypes } from './beats/index.js';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { Flip } from 'gsap/Flip';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { SplitText } from 'gsap/SplitText';

const eventTarget = () => (typeof window === 'undefined' ? null : window);
const EXPORT_FONTS_TIMEOUT_MS = 8_000;

async function waitForExportFonts() {
  const ready = document.fonts?.ready;
  if (!ready) return;

  let timer;
  try {
    await Promise.race([
      Promise.resolve(ready).catch(() => {}),
      new Promise((resolve) => {
        timer = setTimeout(resolve, EXPORT_FONTS_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function emit(name, detail) {
  const target = eventTarget();
  if (target) target.dispatchEvent(new CustomEvent(name, { detail }));
}

/**
 * C12 URL 파라미터의 시작 시각: `?stop=<name|label>`가 `?t=<u>`보다 우선, 범위는 [0, duration]. 없으면 null.
 * @param {string} search  location.search
 * @param {{ duration: number, stops: Array<{ name: string, label?: string, t: number }> }} map
 */
export function urlStart(search, map) {
  const query = new URLSearchParams(search ?? '');
  const stop = query.get('stop');
  if (stop) {
    const found = map.stops.find((item) => item.name === stop || item.label === stop);
    if (found) return found.t;
  }
  const t = Number.parseFloat(query.get('t') ?? '');
  return Number.isFinite(t) ? Math.max(0, Math.min(map.duration, t)) : null;
}

/** `?debug=1` HUD: 현재 t · 지난 정지점 · 화면 beat. 리허설·캡처 확인용, 매 프레임 갱신. */
function debugHud(host, map, time) {
  const hud = document.createElement('div');
  hud.className = 'sl-debug';
  hud.setAttribute('aria-hidden', 'true');
  host.append(hud);
  let frame = 0;
  const tick = () => {
    const t = time();
    const stop = map.stops.filter((item) => item.t <= t + 1e-6).at(-1);
    const beat = map.beats.find((item) => item.start <= t && t < item.end) ?? map.beats.at(-1);
    hud.textContent = `t ${t.toFixed(2)} · stop ${stop?.name ?? '-'} · beat ${beat?.id ?? '-'}`;
    frame = requestAnimationFrame(tick);
  };
  tick();
  return () => {
    cancelAnimationFrame(frame);
    hud.remove();
  };
}

function errorScreen(host, errors) {
  const box = document.createElement('section');
  box.className = 'sl-error';
  box.setAttribute('role', 'alert');
  const heading = document.createElement('h1');
  heading.textContent = 'Deck validation failed';
  const list = document.createElement('ul');
  for (const issue of errors) {
    const item = document.createElement('li');
    item.textContent =
      typeof issue === 'string' ? issue : `${issue.path ?? 'deck'}: ${issue.message ?? 'invalid'}`;
    list.append(item);
  }
  box.append(heading, list);
  host.replaceChildren(box);
}

function viewportFor(mode) {
  if (mode === 'export') return computeViewport(1920, 1080, 1);
  return computeViewport(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
}

function makeTrack(host) {
  const track = document.createElement('div');
  track.className = 'sl-track';
  track.setAttribute('aria-hidden', 'true');
  host.append(track);
  return track;
}

function assetResolver(assetBase) {
  const base = String(assetBase ?? '').replace(/\/+$/, '');
  return (path) => {
    const relative = String(path ?? '').replace(/^\/+/, '');
    return base ? `${base}/${relative}` : `/${relative}`;
  };
}

function sourceIndex(sources) {
  return Object.fromEntries((sources ?? []).map((source) => [source.id, source]));
}

function registeredPlugins() {
  const plugins = { SplitText, Flip, MorphSVGPlugin, DrawSVGPlugin, CustomEase };
  gsap.registerPlugin(...Object.values(plugins));
  return plugins;
}

function preloadExportMedia(beats) {
  const sequences = beats.flatMap((beat) => (beat.media?.seq ? [beat.media.seq] : []));
  const images = beats
    .flatMap((beat) => [...(beat.root?.querySelectorAll?.('img') ?? [])])
    .map((image) => image.currentSrc || image.src)
    .filter(Boolean);
  return Promise.all([...sequences.map((sequence) => sequence.preloadAll()), preloadImages(images)]);
}

function bindExportClips(beats, path) {
  for (const beat of beats) {
    const clip = beat.media?.clip;
    if (!clip) continue;
    const start = toExportSeconds(path, beat.span.start);
    const end = toExportSeconds(path, beat.span.end);
    clip.bindExport({ start, duration: end - start });
  }
}

function activeTracker(built) {
  const states = new Map(built.beats.map((beat) => [beat.id, false]));
  const update = (time) => {
    for (const beat of built.beats) {
      const active = time >= beat.span.start && time < beat.span.end;
      if (states.get(beat.id) === active) continue;
      states.set(beat.id, active);
      const phase = active ? 'enter' : 'leave';
      if (active) beat.media?.clip?.activate?.();
      else beat.media?.clip?.deactivate?.();
      emit(EVENTS.active, { beat: beat.id, phase });
    }
  };
  const onUpdate = () => update(built.tl.time());
  const previous = built.tl.eventCallback?.('onUpdate');
  built.tl.eventCallback?.('onUpdate', () => {
    previous?.();
    onUpdate();
  });
  return update;
}

/**
 * @param {{ host: HTMLElement, deck: import('./types.js').DeckSpec, concept: import('./types.js').ConceptPack,
 *           moves: import('./types.js').Registry,
 *           sequences?: Record<string, import('./types.js').SequenceDef>,
 *           assetBase: string, mode?: 'live'|'export' }} opts
 * @returns {Promise<import('./types.js').DeckHandle>}
 */
export async function boot(opts) {
  const { host, deck, concept, moves, sequences = {}, assetBase, mode = 'live' } = opts;
  if (!host) throw new TypeError('boot requires host');
  if (mode !== 'live' && mode !== 'export') throw new TypeError(`Unknown boot mode: ${mode}`);

  const validation = validateDeck(deck, { registry: moves, concept, beatTypes, sequences });
  if (!validation.ok) {
    errorScreen(host, validation.errors);
    const error = new Error(`Deck validation failed (${validation.errors.length} errors)`);
    error.errors = validation.errors;
    throw error;
  }

  const map = plan(deck, { registry: moves, concept, beatTypes, sequences });
  let viewport = viewportFor(mode);
  const stage = createStage(host, { viewport, concept, mode });
  const track = mode === 'live' ? makeTrack(host) : null;
  let built;
  let driver;
  let presenter;
  let a11y;
  let resizeTimer;
  let disposed = false;
  let fontsRebuilt = false;
  let removeResize = () => {};
  let syncActive = () => {};
  const asset = assetResolver(assetBase);
  const sources = sourceIndex(deck.sources);
  const plugins = registeredPlugins();

  const destroyBuilt = () => {
    if (!built) return;
    const previous = built;
    built = undefined;
    previous.destroy?.();
  };

  const buildDeck = async () => {
    built = await build(map, {
      stage,
      gsap,
      deck,
      registry: moves,
      concept,
      beatTypes,
      sequences,
      reduce: mode === 'live' && prefersReducedMotion(),
      assetBase,
      asset,
      media: { frameSequence, videoClip },
      el,
      words,
      chars,
      sources,
      mode,
      plugins,
    });
    if (mode === 'live') syncActive = activeTracker(built);
    return built;
  };

  if (mode === 'export') {
    // Build once to put text in the DOM so its font requests can start. Then
    // rebuild after fonts settle (or the bound expires) before making a wrapper.
    await buildDeck();
    await waitForExportFonts();
    destroyBuilt();
    stage.clear();
    await buildDeck();
  } else {
    await buildDeck();
  }

  const rebuild = async (reason = 'resize') => {
    if (disposed) return;
    const time = driver?.time?.() ?? built.tl.time?.() ?? 0;
    driver?.detach?.();
    presenter?.destroy?.();
    a11y?.destroy?.();
    destroyBuilt();
    stage.clear();
    viewport = viewportFor(mode);
    stage.viewport = viewport;
    // The map deliberately remains unchanged: geometry must not alter timing.
    await buildDeck();
    if (mode === 'live') {
      driver = createScrollDriver({ track, tl: built.tl, map, viewport, reduce: prefersReducedMotion() });
      a11y = createA11y({ stage, beats: built.beats });
      driver.attach();
      driver.seek(time, { immediate: true });
      syncActive(time);
      presenter = createPresenter(driver, { reduce: prefersReducedMotion() });
    }
    emit(EVENTS.rebuild, { reason, time });
  };

  if (mode === 'live') {
    const reduce = prefersReducedMotion();
    driver = createScrollDriver({ track, tl: built.tl, map, viewport, reduce });
    a11y = createA11y({ stage, beats: built.beats });
    driver.attach();
    presenter = createPresenter(driver, { reduce });
    let previous = { w: window.innerWidth, h: window.innerHeight };
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const current = { w: window.innerWidth, h: window.innerHeight };
        const heightChange = previous.h ? Math.abs(current.h - previous.h) / previous.h : 1;
        if (current.w === previous.w && heightChange < RESIZE.heightTolerance) return;
        previous = current;
        void rebuild('resize');
      }, RESIZE.debounceMs);
    };
    window.addEventListener('resize', onResize);
    // Keep removal private while preserving the public, contract-defined handle shape.
    removeResize = () => window.removeEventListener('resize', onResize);
  } else {
    const path = exportPath(map, deck.export, exportHolds(deck, map));
    bindExportClips(built.beats, path);
    await preloadExportMedia(built.beats);
    const wrapper = buildExportTimeline(built.tl, path, gsap);
    window.__timelines ??= {};
    window.__timelines.scrolline = wrapper;
    emit(EVENTS.exportReady, { duration: path.duration });
  }

  const api = {
    version: VERSION,
    mode,
    map,
    get tl() {
      return built.tl;
    },
    time: () => driver?.time?.() ?? built.tl.time(),
    seek: (t) => {
      if (driver) driver.seek(t);
      else built.tl.seek(t);
      syncActive(t);
    },
    goto: (name) => {
      if (presenter) return presenter.goto(name);
      const stop = map.stops.find((item) => item.name === name || item.label === name);
      if (stop) built.tl.seek(stop.t);
    },
    stops: () => (driver ? driver.stops() : map.stops),
  };
  window.__deck = api;
  let removeHud = () => {};
  if (mode === 'live') {
    const search = window.location?.search ?? '';
    const start = urlStart(search, map);
    if (start !== null) {
      driver.seek(start, { immediate: true });
      syncActive(start);
    }
    if (new URLSearchParams(search).get('debug') === '1') removeHud = debugHud(host, map, api.time);
  }
  emit(EVENTS.ready, { map, mode });

  // Live fonts can change measured rects once. Do not delay readiness for it.
  if (mode === 'live') {
    document.fonts?.ready?.then(() => {
      if (!fontsRebuilt && !disposed) {
        fontsRebuilt = true;
        void rebuild('fonts');
      }
    });
  }

  return {
    map,
    get built() {
      return built;
    },
    get driver() {
      return driver;
    },
    get presenter() {
      return presenter;
    },
    rebuild,
    destroy() {
      if (disposed) return;
      disposed = true;
      clearTimeout(resizeTimer);
      removeResize();
      removeHud();
      driver?.detach?.();
      presenter?.destroy?.();
      a11y?.destroy?.();
      destroyBuilt();
      track?.remove();
      stage.root?.remove();
      if (window.__deck === api) delete window.__deck;
    },
  };
}
