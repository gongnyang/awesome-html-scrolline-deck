/** Continuous, seekable timeline planning and construction (CONTRACTS C6). */
import { ENGINE_TIMING_DEFAULTS, REDUCE_FALLBACK, STOP_PREFIX } from './constants.js';
import { resolveParams } from './util/schema.js';
import { measure, anchorOf } from './handoff.js';
import { createRng, hashSeed } from './util/rng.js';
import { textMask } from './media.js';

const field = (value, doc) => ({ type: 'number', default: value, min: 0, doc });
const allParts = (beat) => Object.values(beat.parts).flat();
const stateOf = (node) => node.closest?.('[data-state]')?.dataset.state;
const visibleParts = (ctx) =>
  allParts(ctx.beat).filter(
    (node) =>
      !ctx.skipParts.includes(node.dataset?.part) &&
      !ctx.skipNodes.includes(node) &&
      (!stateOf(node) || stateOf(node) === 'base'),
  );
const fadeIn = (tl, ctx, p) => {
  if (ctx.role === 'step' && ctx.step) {
    const states = allParts(ctx.beat).filter((node) => stateOf(node));
    const next = states.filter((node) => stateOf(node) === ctx.step.name && !ctx.skipNodes.includes(node));
    const other = states.filter((node) => stateOf(node) !== ctx.step.name && !ctx.skipNodes.includes(node));
    if (!next.length && !other.length) return;
    ctx.initial(next, { autoAlpha: 0 });
    tl.to(other, { autoAlpha: 0, duration: p.duration }, 0);
    tl.to(next, { autoAlpha: 1, duration: p.duration }, 0);
    return;
  }
  const nodes = visibleParts(ctx);
  if (!nodes.length) return;
  ctx.initial(nodes, { autoAlpha: 0 });
  tl.to(nodes, { autoAlpha: 1, duration: p.duration }, 0);
};
// 나가는 beat의 move overlay(차트 주석·waffle canvas 등)도 같이 접는다. 안 그러면 span 끝에서 한 프레임에 사라진다.
const leaving = (ctx, beat) => [...allParts(beat), ...(ctx.overlaysOf?.(beat) ?? [])];
const fadeOut = (tl, ctx, p) => tl.to(leaving(ctx, ctx.beat), { autoAlpha: 0, duration: p.duration }, 0);
const crossfade = (tl, ctx, p) => {
  const to = allParts(ctx.beat);
  ctx.initial(to, { autoAlpha: 0 });
  const n = Math.min(p.duration * 0.4, 0.15);
  tl.to(leaving(ctx, ctx.from), { autoAlpha: 0, duration: p.duration - n }, 0);
  tl.to(to, { autoAlpha: 1, duration: n }, p.duration - n);
};
export const ENGINE_MOVE_DEFS = Object.freeze([
  {
    id: 'engine:fade-in',
    family: 'engine',
    role: 'enter',
    accepts: ['*'],
    sources: ['engine-fade'],
    reduce: 'self',
    params: { duration: field(0.4, 'Fade duration') },
    timing: (p) => ({ duration: p.duration, stops: [] }),
    build: fadeIn,
  },
  {
    id: 'engine:fade-out',
    family: 'engine',
    role: 'exit',
    accepts: ['*'],
    sources: ['engine-fade'],
    reduce: 'self',
    params: { duration: field(0.4, 'Fade duration') },
    timing: (p) => ({ duration: p.duration, stops: [] }),
    build: fadeOut,
  },
  {
    id: 'engine:crossfade',
    family: 'engine',
    role: 'link',
    accepts: ['*'],
    sources: ['engine-crossfade'],
    reduce: 'self',
    params: { duration: field(0.4, 'Crossfade duration') },
    timing: (p) => ({ duration: p.duration, stops: [] }),
    build: crossfade,
  },
  {
    id: 'engine:none',
    family: 'engine',
    role: 'ambient',
    accepts: ['*'],
    sources: ['engine-none'],
    reduce: 'self',
    params: { duration: field(0, 'No operation duration') },
    timing: () => ({ duration: 0, stops: [] }),
    build: () => {},
  },
]);
export function resolveTiming(conceptTiming = {}, deckTiming = {}) {
  return { ...ENGINE_TIMING_DEFAULTS, ...conceptTiming, ...deckTiming };
}
function defaultRef(b, role, concept, isLast = false) {
  if (b[role]) return b[role];
  if (role === 'exit' && isLast) return null;
  const id = concept.defaults?.byType?.[b.type]?.[role] ?? concept.defaults?.[role];
  return id
    ? { move: id }
    : role === 'enter'
      ? { move: 'engine:fade-in' }
      : role === 'exit'
        ? { move: 'engine:fade-out' }
        : null;
}
function resolve(registry, ref, concept) {
  if (!ref) return null;
  const move = registry.get(ref.move);
  const preset = concept.moves?.params?.[move.id] ?? {};
  return { move, params: resolveParams(move.params, { ...preset, ...(ref.params ?? {}) }), at: ref.at ?? 0 };
}
function timing(move, params, data) {
  const x = move.timing(params, data) ?? {};
  if (typeof x.duration !== 'number' || x.duration < 0) throw new Error(`Invalid timing from ${move.id}`);
  return { duration: x.duration, stops: x.stops ?? [] };
}
function add(entry, role, r, start, end) {
  entry.spans.push({ role, move: r.move.id, start, end, params: r.params });
}

/** DOM-free deterministic C6 algorithm. */
export function plan(deck, env) {
  const T = resolveTiming(env.concept.timing, deck.timing);
  const beats = [];
  const stops = [];
  let prev;
  for (let i = 0; i < deck.beats.length; i += 1) {
    const b = deck.beats[i];
    const linkIn = prev?.link;
    let s = i === 0 ? 0 : linkIn ? prev.holdEnd + (b.at ?? 0) : prev.exitStart + (b.at ?? T.overlap);
    s = Math.max(s, prev?.start ?? 0);
    let t = s;
    const entry = { id: b.id, type: b.type, start: s, stop: s, end: s, spans: [] };
    if (linkIn) {
      const r = resolve(env.registry, linkIn, env.concept);
      const l = timing(r.move, r.params, { from: prev.data, to: b });
      add(entry, 'link', r, s, s + l.duration);
      prev.entry.end = s + l.duration;
      prev.entry.spans
        .filter((x) => x.role === 'ambient' && x.end === null)
        .forEach((x) => {
          x.end = s + l.duration;
        });
      t = s + l.duration;
    }
    const sequence = b.type === 'sequence' ? env.sequences?.[b.use] : null;
    const enter = sequence
      ? { move: { id: `seq:${b.use}`, timing: () => sequence.timing(b.data) }, params: {}, at: 0 }
      : resolve(env.registry, defaultRef(b, 'enter', env.concept), env.concept);
    if (enter) {
      const e = timing(enter.move, enter.params, b);
      const es = Math.max(s, t + enter.at);
      add(entry, 'enter', enter, es, es + e.duration);
      e.stops.forEach((x) =>
        stops.push({
          name: `${b.id}/${x.name}`,
          label: `${STOP_PREFIX}${b.id}/${x.name}`,
          t: es + x.at,
          beat: b.id,
        }),
      );
      entry.stop = es + e.duration;
    } else entry.stop = t;
    const camera = resolve(env.registry, b.camera, env.concept);
    if (camera) {
      const c = timing(camera.move, camera.params, b);
      add(entry, 'camera', camera, s, s + c.duration);
      entry.stop = Math.max(entry.stop, s + c.duration);
    }
    if (b.stop !== false)
      stops.push({ name: b.id, label: `${STOP_PREFIX}${b.id}`, t: entry.stop, beat: b.id });
    let holdEnd = entry.stop + (b.hold ?? T.hold);
    for (let k = 0; k < (b.steps ?? []).length; k += 1) {
      const step = b.steps[k];
      const r = resolve(env.registry, step, env.concept);
      const d = timing(r.move, r.params, b);
      add(entry, 'step', r, holdEnd, holdEnd + d.duration);
      stops.push({
        name: `${b.id}/${step.name ?? k + 1}`,
        label: `${STOP_PREFIX}${b.id}/${step.name ?? k + 1}`,
        t: holdEnd + d.duration,
        beat: b.id,
      });
      holdEnd += d.duration + (step.hold ?? T.hold);
    }
    entry.end = holdEnd;
    if (!b.link) {
      const exit = resolve(
        env.registry,
        defaultRef(b, 'exit', env.concept, i === deck.beats.length - 1),
        env.concept,
      );
      if (exit) {
        const x = timing(exit.move, exit.params, b);
        add(entry, 'exit', exit, holdEnd, holdEnd + x.duration);
        entry.end = holdEnd + x.duration;
      }
    }
    for (const ref of b.ambient ?? []) {
      const r = resolve(env.registry, ref, env.concept);
      const a = r.move.timing(r.params, b);
      add(entry, 'ambient', r, s, a.duration === 'fill' ? (b.link ? null : entry.end) : s + a.duration);
    }
    beats.push(entry);
    prev = { data: b, entry, start: s, holdEnd, exitStart: holdEnd, link: b.link };
  }
  for (const b of beats)
    b.spans
      .filter((x) => x.end === null)
      .forEach((x) => {
        x.end = b.end;
      });
  stops.sort((a, b) => a.t - b.t);
  const max = Math.max(0, ...beats.flatMap((b) => b.spans.map((x) => x.end)), ...stops.map((x) => x.t));
  return {
    version: 1,
    deck: deck.id,
    concept: env.concept.id,
    duration: max + T.tail,
    unit: T.unit,
    stops,
    beats,
  };
}

function typeFor(data, env) {
  return data.type === 'sequence' ? env.sequences?.[data.use] : env.beatTypes[data.type];
}
function addPartClasses(view, data) {
  const prefix = data.type === 'sequence' ? `sl-seq-${data.use}` : `sl-${data.type}`;
  for (const [part, nodes] of Object.entries(view.parts ?? {}))
    for (const node of nodes) node.classList?.add(`${prefix}__${part}`);
}
function cameraTarget(data, previous) {
  const world = data.place?.world;
  if (!world) return previous;
  const scale = world.s ?? 1;
  return { x: world.x + 0.5 * scale, y: world.y + 0.5 * scale, s: 1 / scale, rx: 0, ry: 0 };
}
function fontForMask(beat, rect) {
  const style = globalThis.getComputedStyle?.(beat.root);
  const family = style?.getPropertyValue('--sl-font-display').trim() || style?.fontFamily || 'sans-serif';
  const weight = style?.getPropertyValue('--sl-weight-display').trim() || style?.fontWeight || '700';
  return { family, weight, size: Math.max(1, Math.min(rect.h, rect.w) || 1) };
}
/**
 * ctx.textMask: 컨셉 display 글꼴로 글자 모양 mask URL. 글자 폭은 rect.w × 0.92, 잉크 높이는 rect.h × 0.8을 넘지 않게
 * (짧은 낱말 「AI」가 폭만 맞춰 프레임 위아래로 넘치던 문제). 브라우저에서는 canvas에 그려 PNG로 낸다 — SVG data URL
 * 이미지는 문서 웹폰트(Pretendard 등)를 못 봐 시스템 글꼴로 바뀌었다. canvas가 없으면(테스트 DOM) C13 textMask SVG.
 */
export function maskUrl(beat, text, options = {}) {
  const rect = options.rect ?? beat.anchor('media').rect;
  const { family, weight, size } = fontForMask(beat, rect);
  const align = options.align ?? 'center';
  let fontSize = size;
  const canvas = globalThis.document?.createElement?.('canvas');
  const context = canvas?.getContext?.('2d');
  if (context?.measureText) {
    context.font = `${weight} ${fontSize}px ${family}`;
    const m = context.measureText(text);
    const ink = (m.actualBoundingBoxAscent ?? 0) + (m.actualBoundingBoxDescent ?? 0) || fontSize * 0.75;
    if (m.width > 0) fontSize *= Math.min((rect.w * 0.92) / m.width, (rect.h * 0.8) / ink);
  }
  const font = `${weight} ${fontSize}px ${family}`;
  if (context?.fillText && typeof canvas.toDataURL === 'function' && rect.w > 0 && rect.h > 0) {
    const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    canvas.width = Math.round(rect.w * dpr);
    canvas.height = Math.round(rect.h * dpr);
    context.setTransform?.(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, rect.w, rect.h);
    context.font = font;
    context.fillStyle = 'white';
    context.textAlign = align === 'center' ? 'center' : 'left';
    // 잉크 상자 가운데를 rect 가운데에 둔다(middle baseline은 글꼴마다 위로 치우침).
    context.textBaseline = 'alphabetic';
    const m = context.measureText(text);
    const ascent = m.actualBoundingBoxAscent ?? fontSize * 0.72;
    const descent = m.actualBoundingBoxDescent ?? 0;
    context.fillText(text, align === 'center' ? rect.w / 2 : 0, rect.h / 2 + (ascent - descent) / 2);
    const url = canvas.toDataURL('image/png');
    if (url.startsWith('data:image/png')) return url;
  }
  return textMask(text, { font, width: rect.w, height: rect.h, align });
}
const COLOR_NAMES = ['bg', 'fg', 'fg-muted', 'accent', 'accent-2', 'rule', 'scrim'];
function colorsFor(root) {
  const style = globalThis.getComputedStyle?.(root);
  return Object.fromEntries(
    COLOR_NAMES.map((name) => [name, style?.getPropertyValue(`--sl-${name}`).trim()]).filter(
      ([, value]) => value,
    ),
  );
}
/** C6 builder; boot owns the asynchronous font-ready rebuild boundary. */
export function build(map, env) {
  const { stage, deck, gsap } = env;
  const initial = [];
  const beats = [];
  const byId = new Map();
  for (const data of deck.beats) {
    const type = typeFor(data, env);
    if (!type) throw new Error(`Unknown beat type: ${data.type}`);
    const view = type.render(data, {
      viewport: stage.viewport,
      lang: deck.lang,
      asset: env.asset ?? ((p) => p),
      media: env.media ?? {},
      el: env.el,
      words: env.words,
      chars: env.chars,
      sources: env.sources ?? Object.fromEntries((deck.sources ?? []).map((source) => [source.id, source])),
      mode: env.mode ?? 'live',
    });
    view.root.dataset.beat = data.id;
    if (data.tone !== undefined) view.root.dataset.tone = String(data.tone);
    addPartClasses(view, data);
    stage.placeBeat(view.root, data.place ?? { slot: 'center' });
    const m = map.beats.find((x) => x.id === data.id);
    const beat = {
      id: data.id,
      type: data.type,
      data,
      place: data.place,
      root: view.root,
      parts: view.parts,
      part: (name) => view.parts[name] ?? [],
      span: { start: m.start, stop: m.stop, end: m.end },
      media: view.media ?? {},
      colors: colorsFor(view.root),
    };
    beats.push(beat);
    byId.set(beat.id, beat);
  }
  const snapshot = measure(stage.root, beats, env.measureFn);
  for (const b of beats)
    b.anchor = (part, index = 0) => anchorOf(b, part, snapshot, typeFor(b.data, env).primary, index);
  const master = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  const skips = new Map();
  for (let i = 1; i < map.beats.length; i += 1) {
    const m = map.beats[i];
    const link = m.spans.find((span) => span.role === 'link');
    if (!link) continue;
    const from = beats[i - 1],
      beat = beats[i],
      move = env.registry.get(link.move);
    const selected = move.handoff?.(link.params, { from: from.data, to: beat.data }) ?? {};
    const fromChoice = selected.from ?? {};
    const toChoice = selected.to ?? {};
    const handoff = {
      from: from.anchor(fromChoice.part, fromChoice.index),
      to: beat.anchor(toChoice.part, toChoice.index),
    };
    const indexed = toChoice.index !== undefined;
    skips.set(beat.id, {
      handoff,
      skipParts: indexed ? [] : [handoff.to.part],
      skipNodes: indexed ? [handoff.to.node] : beat.part(handoff.to.part),
    });
  }
  let lastCamera = { x: 0.5, y: 0.5, s: 1 };
  const overlaysByBeat = new Map();
  for (const m of map.beats)
    for (const s of m.spans) {
      const beat = byId.get(m.id);
      const index = deck.beats.findIndex((x) => x.id === m.id);
      const sequence = beat.data.type === 'sequence' && s.role === 'enter' ? typeFor(beat.data, env) : null;
      const original = sequence ?? env.registry.get(s.move);
      const fallback = env.reduce && original.reduce === 'fade';
      const move = fallback ? env.registry.get(REDUCE_FALLBACK[s.role]) : original;
      if (s.role === 'camera' && env.reduce && original.reduce !== 'self')
        throw new Error('camera move must reduce itself');
      const local = gsap.timeline();
      const from =
        s.role === 'link' ? byId.get(deck.beats[index - 1]?.id) : s.role === 'exit' ? beat : undefined;
      const skip = skips.get(beat.id);
      const camera = cameraTarget(beat.data, lastCamera);
      if (s.role === 'camera') lastCamera = camera;
      const ordinal = m.spans.filter(
        (span, spanIndex) => spanIndex < m.spans.indexOf(s) && span.role === s.role,
      ).length;
      const overlay = stage.overlayFor(`${m.id}:${s.role}:${ordinal}:${s.move}`);
      const ctx = {
        gsap,
        plugins: env.plugins ?? {},
        role: s.role,
        beat,
        from,
        prev: beats[index - 1],
        next: beats[index + 1],
        camera: s.role === 'camera' ? camera : undefined,
        stage,
        viewport: stage.viewport,
        reduce: !!env.reduce,
        start: s.start,
        duration: s.end - s.start,
        skipParts: s.role === 'enter' || s.role === 'step' ? (skip?.skipParts ?? []) : [],
        skipNodes: s.role === 'enter' || s.role === 'step' ? (skip?.skipNodes ?? []) : [],
        step:
          s.role === 'step'
            ? {
                name:
                  beat.data.steps?.[m.spans.filter((x) => x.role === 'step').indexOf(s)]?.name ?? String(1),
                index: m.spans.filter((x) => x.role === 'step').indexOf(s),
              }
            : undefined,
        overlay,
        tokens: env.concept.tokens ?? {},
        colors: beat.colors,
        ease: (n) => env.concept.eases?.[n] ?? n,
        initial: (nodes, vars) => initial.push([nodes, vars]),
        rng: createRng(hashSeed(`${deck.id}:${beat.id}:${s.role}:${move.id}`)),
        textMask: (text, options) => maskUrl(beat, text, options),
        overlaysOf: (b) => (overlaysByBeat.get(b?.id) ?? []).filter((node) => node !== overlay),
      };
      if (from && s.role === 'link') ctx.handoff = skip?.handoff;
      if (sequence) sequence.build(local, ctx);
      else move.build(local, ctx, fallback ? { duration: ctx.duration } : s.params);
      if (local.duration() > ctx.duration + 0.001)
        throw new Error(`${move.id} local timeline exceeds planned duration`);
      master.add(local, s.start);
      if (!overlaysByBeat.has(m.id)) overlaysByBeat.set(m.id, []);
      overlaysByBeat.get(m.id).push(overlay);
      gsap.set(overlay, { autoAlpha: 0 });
      master.set(overlay, { autoAlpha: 1 }, s.start);
      if (index < beats.length - 1 && !beat.data.persist)
        master.set(overlay, { autoAlpha: 0 }, beat.span.end);
    }
  initial.forEach(([nodes, vars]) => gsap.set(nodes, vars));
  map.stops.forEach((stop) => master.addLabel(stop.label, stop.t));
  beats.forEach((b, i) => {
    gsap.set(b.root, { autoAlpha: 0 });
    master.set(b.root, { autoAlpha: 1 }, b.span.start);
    if (i < beats.length - 1 && !b.data.persist) master.set(b.root, { autoAlpha: 0 }, b.span.end);
  });
  if (master.duration() < map.duration)
    master.to({}, { duration: map.duration - master.duration() }, master.duration());
  let destroyed = false;
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    beats.forEach((beat) => {
      beat.media?.seq?.destroy?.();
      beat.media?.clip?.destroy?.();
    });
    master.kill();
    beats.forEach((beat) => beat.root.remove());
  };
  return { tl: master, map, beats, byId, destroy };
}
