import { describe, expect, it, vi } from 'vitest';
vi.mock('./handoff.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, anchorOf: vi.fn(actual.anchorOf) };
});
import simple from './__fixtures__/decks/simple.json';
import linked from './__fixtures__/decks/link.json';
import rich from './__fixtures__/decks/steps-camera-ambient.json';
import { build, plan } from './timeline.js';
import { createRegistry } from './registry.js';
import { gsap } from 'gsap';
import { anchorOf } from './handoff.js';
import { SchemaError } from './util/schema.js';

const move = (id, role, duration = 1, stops = []) => ({
  id,
  family: 'reveal',
  role,
  accepts: ['*'],
  sources: ['test'],
  reduce: 'self',
  params: { duration: { type: 'number', default: duration, doc: 'duration' } },
  timing: (p) => ({ duration: p.duration, stops }),
  build: () => {},
});
const registry = createRegistry([
  move('enter', 'enter'),
  move('exit', 'exit'),
  move('link', 'link'),
  move('step', 'step', 0.5),
  move('camera', 'camera', 2),
  { ...move('ambient', 'ambient'), timing: () => ({ duration: 'fill' }) },
]);
const concept = { id: 'test', timing: {}, defaults: { enter: 'enter', exit: 'exit' }, tokens: {}, eases: {} };
const env = { registry, concept, beatTypes: {} };

describe('plan', () => {
  it('matches hand calculated fixture stops', () => {
    expect(plan(simple, env).stops.map((x) => [x.name, x.t])).toEqual([
      ['open', 1],
      ['close', 2.8],
    ]);
    expect(plan(linked, env).stops.map((x) => [x.name, x.t])).toEqual([
      ['one', 1],
      ['two', 3.6],
    ]);
    expect(plan(rich, env).stops.map((x) => [x.name, x.t])).toEqual([
      ['one', 2],
      ['one/more', 3.1],
      ['two', 4.9],
    ]);
  });
  it('maintains C6 map invariants and is input deterministic', () => {
    const map = plan(rich, env);
    expect(map).toEqual(plan(rich, env));
    expect(map.stops.map((x) => x.t)).toEqual([...map.stops.map((x) => x.t)].sort((a, b) => a - b));
    expect(new Set(map.stops.map((x) => x.name)).size).toBe(map.stops.length);
    expect(map.beats.every((b, i) => !i || b.start >= map.beats[i - 1].start)).toBe(true);
    expect(map.beats.flatMap((b) => b.spans).every((s) => s.start <= s.end)).toBe(true);
  });
  it('keeps planning unchanged for reduce fallback and rejects an overlong local timeline', () => {
    const fade = { ...move('fade', 'enter'), reduce: 'fade' };
    const bad = { ...move('bad', 'enter'), build: (tl) => tl.to({}, { duration: 2 }) };
    const r = createRegistry([fade, bad, move('leave', 'exit')]);
    const d = {
      ...simple,
      beats: [{ id: 'open', type: 'text', enter: { move: 'fade' }, exit: { move: 'leave' } }],
    };
    const map = plan(d, { ...env, registry: r });
    expect(JSON.stringify(map)).toBe(JSON.stringify(plan(d, { ...env, registry: r })));
    const root = document.createElement('div');
    const stage = {
      root,
      viewport: {},
      placeBeat: (node) => root.append(node),
      overlayFor: () => document.createElement('div'),
    };
    const beatTypes = {
      text: {
        primary: 'block',
        render: () => {
          const node = document.createElement('section');
          const part = document.createElement('span');
          part.dataset.part = 'block';
          node.append(part);
          return { root: node, parts: { block: [part] } };
        },
      },
    };
    expect(() =>
      build(map, {
        stage,
        deck: d,
        registry: r,
        concept,
        beatTypes,
        reduce: true,
        gsap,
        measureFn: () => ({ x: 0, y: 0, w: 1, h: 1 }),
      }),
    ).not.toThrow();
    const badDeck = { ...d, beats: [{ ...d.beats[0], enter: { move: 'bad' } }] };
    const badMap = plan(badDeck, { ...env, registry: r });
    expect(() =>
      build(badMap, {
        stage,
        deck: badDeck,
        registry: r,
        concept,
        beatTypes,
        reduce: false,
        gsap,
        measureFn: () => ({ x: 0, y: 0, w: 1, h: 1 }),
      }),
    ).toThrow(/exceeds/);
  });

  it('plans sequence enter spans and does not add a default exit to the final beat', () => {
    const sequence = {
      primary: 'ground',
      timing: (data) => ({ duration: data.duration, stops: [{ name: 'inside', at: 0.25 }] }),
      render: () => ({
        root: document.createElement('section'),
        parts: { ground: [document.createElement('i')] },
      }),
      build: () => {},
    };
    const deck = {
      id: 'sequence',
      lang: 'en',
      beats: [{ id: 'atlas', type: 'sequence', use: 'atlas', data: { duration: 1 } }],
    };
    const map = plan(deck, { ...env, sequences: { atlas: sequence } });
    expect(map.beats[0].spans).toEqual([{ role: 'enter', move: 'seq:atlas', start: 0, end: 1, params: {} }]);
    expect(map.stops.map((stop) => stop.name)).toEqual(['atlas/inside', 'atlas']);
  });

  it('resolves concept presets before beat params for both plan and build', () => {
    const calls = [];
    const preset = {
      ...move('preset', 'enter'),
      params: {
        duration: { type: 'number', default: 1, doc: 'duration' },
        amount: { type: 'number', default: 2, doc: 'amount' },
      },
      build: (_tl, _ctx, params) => calls.push(params),
    };
    const r = createRegistry([preset]);
    const deck = {
      id: 'presets',
      lang: 'en',
      beats: [{ id: 'a', type: 'text', text: 'Preset', enter: { move: 'preset' } }],
    };
    const presetConcept = {
      ...concept,
      moves: { params: { preset: { duration: 0.25, amount: 4 } } },
    };
    const presetOnly = plan(deck, { ...env, registry: r, concept: presetConcept });
    expect(presetOnly.beats[0].spans[0].params).toEqual({ duration: 0.25, amount: 4 });
    const overrideDeck = {
      ...deck,
      beats: [{ ...deck.beats[0], enter: { move: 'preset', params: { amount: 9 } } }],
    };
    const map = plan(overrideDeck, { ...env, registry: r, concept: presetConcept });
    expect(map.beats[0].spans[0].params).toEqual({ duration: 0.25, amount: 9 });
    const root = document.createElement('div');
    const stage = {
      root,
      viewport: {},
      placeBeat: (node) => root.append(node),
      overlayFor: () => document.createElement('div'),
    };
    build(map, {
      stage,
      deck: overrideDeck,
      registry: r,
      concept: presetConcept,
      beatTypes: {
        text: {
          primary: 'block',
          render: () => {
            const node = document.createElement('section');
            const part = document.createElement('span');
            part.dataset.part = 'block';
            node.append(part);
            return { root: node, parts: { block: [part] } };
          },
        },
      },
      gsap,
      measureFn: () => ({ x: 0, y: 0, w: 1, h: 1 }),
    });
    expect(calls).toEqual([{ duration: 0.25, amount: 9 }]);
  });

  it('rejects unknown keys in a concept move preset', () => {
    const deck = {
      id: 'bad-preset',
      lang: 'en',
      beats: [{ id: 'a', type: 'text', enter: { move: 'enter' } }],
    };
    const badConcept = { ...concept, moves: { params: { enter: { unknown: true } } } };
    expect(() => plan(deck, { ...env, concept: badConcept })).toThrow(SchemaError);
  });

  it('reads computed colors for each beat after tone is applied', () => {
    const calls = [];
    const colorMove = { ...move('colors', 'enter'), build: (_tl, ctx) => calls.push(ctx.colors) };
    const r = createRegistry([colorMove, move('exit', 'exit')]);
    const deck = {
      id: 'colors',
      lang: 'en',
      beats: [
        { id: 'light', type: 'text', text: 'Light', enter: { move: 'colors' } },
        { id: 'dark', type: 'text', text: 'Dark', tone: 2, enter: { move: 'colors' } },
      ],
    };
    const map = plan(deck, { ...env, registry: r });
    const root = document.createElement('div');
    document.body.append(root);
    const stage = {
      root,
      viewport: {},
      placeBeat: (node) => {
        node.style.setProperty('--sl-bg', node.dataset.tone === '2' ? 'rgb(2, 2, 2)' : 'rgb(1, 1, 1)');
        node.style.setProperty('--sl-accent', node.dataset.tone === '2' ? 'cyan' : 'orange');
        root.append(node);
      },
      overlayFor: () => document.createElement('div'),
    };
    build(map, {
      stage,
      deck,
      registry: r,
      concept,
      beatTypes: {
        text: {
          primary: 'block',
          render: () => {
            const node = document.createElement('section');
            const part = document.createElement('span');
            part.dataset.part = 'block';
            node.append(part);
            return { root: node, parts: { block: [part] } };
          },
        },
      },
      gsap,
      measureFn: () => ({ x: 0, y: 0, w: 1, h: 1 }),
    });
    expect(calls).toEqual([
      { bg: 'rgb(1, 1, 1)', accent: 'orange' },
      { bg: 'rgb(2, 2, 2)', accent: 'cyan' },
    ]);
    root.remove();
  });

  it('build supplies v2 view, handoff, camera, overlay, and persist behavior', () => {
    const calls = [];
    const handoff = {
      ...move('handoff', 'link'),
      handoff: () => ({ from: { part: 'block', index: 1 }, to: { part: 'block', index: 1 } }),
      build: (_tl, ctx) => calls.push(ctx),
    };
    const entering = { ...move('enter-v2', 'enter'), build: (_tl, ctx) => calls.push(ctx) };
    const stepping = { ...move('step-v2', 'step'), build: (_tl, ctx) => calls.push(ctx) };
    const camera = { ...move('camera', 'camera'), build: (_tl, ctx) => calls.push(ctx) };
    const leaving = move('exit-v2', 'exit');
    const r = createRegistry([handoff, entering, stepping, leaving, camera]);
    const deck = {
      id: 'v2',
      lang: 'en',
      sources: [{ id: 's1', title: 'Source' }],
      beats: [
        {
          id: 'a',
          type: 'text',
          place: { world: { x: 2, y: 1, s: 0.5 } },
          persist: true,
          enter: { move: 'engine:none' },
          camera: { move: 'camera' },
          link: { move: 'handoff' },
        },
        {
          id: 'b',
          type: 'text',
          tone: 2,
          enter: { move: 'enter-v2' },
          steps: [{ name: 'next', move: 'step-v2' }],
        },
      ],
    };
    const map = plan(deck, { ...env, registry: r });
    const root = document.createElement('div');
    const overlays = [];
    const stage = {
      root,
      viewport: { w: 100, h: 100 },
      placeBeat: (node) => root.append(node),
      overlayFor: (key) => {
        const node = document.createElement('div');
        node.dataset.overlay = key;
        overlays.push(node);
        return node;
      },
    };
    const beatTypes = {
      text: {
        primary: 'block',
        render: (_data, rc) => {
          const node = document.createElement('section');
          const parts = { block: [document.createElement('span'), document.createElement('span')] };
          parts.block.forEach((part) => node.append(part));
          expect(rc.sources.s1.title).toBe('Source');
          expect(rc.mode).toBe('live');
          return { root: node, parts, media: { seq: { fake: true } } };
        },
      },
    };
    const built = build(map, {
      stage,
      deck,
      registry: r,
      concept,
      beatTypes,
      gsap,
      measureFn: () => ({ x: 0, y: 0, w: 1, h: 1 }),
    });
    expect(built.byId.get('b').root.dataset.tone).toBe('2');
    expect(built.byId.get('a').media.seq.fake).toBe(true);
    expect(built.byId.get('b').part('block')[0].className).toContain('sl-text__block');
    const enterCtx = calls.find((ctx) => ctx.role === 'enter');
    expect(enterCtx.skipParts).toEqual([]);
    expect(enterCtx.skipNodes).toEqual([built.byId.get('b').part('block')[1]]);
    expect(anchorOf).toHaveBeenCalledWith(expect.anything(), 'block', expect.any(Map), 'block', 1);
    expect(enterCtx.prev.id).toBe('a');
    expect(enterCtx.camera).toBeUndefined();
    expect(calls.find((ctx) => ctx.role === 'step').step).toEqual({ name: 'next', index: 0 });
    expect(calls.find((ctx) => ctx.role === 'camera').camera).toEqual({
      x: 2.25,
      y: 1.25,
      s: 2,
      rx: 0,
      ry: 0,
    });
    expect(overlays.map((node) => node.dataset.overlay)).toEqual(
      expect.arrayContaining(['b:step:0:step-v2']),
    );
    built.tl.pause(map.beats[0].end + 0.001);
    expect(Number(gsap.getProperty(built.byId.get('a').root, 'opacity'))).toBe(1);
  });

  it('destroys beat media, kills the master timeline, then removes roots once', () => {
    const events = [];
    const seq = { destroy: vi.fn(() => events.push('seq')) };
    const clip = { destroy: vi.fn(() => events.push('clip')) };
    const deck = {
      id: 'destroy',
      lang: 'en',
      beats: [{ id: 'one', type: 'text', text: 'Cleanup', enter: { move: 'enter' } }],
    };
    const map = plan(deck, env);
    const stageRoot = document.createElement('div');
    let beatRoot;
    const built = build(map, {
      stage: {
        root: stageRoot,
        viewport: { w: 100, h: 100 },
        placeBeat: (node) => stageRoot.append(node),
        overlayFor: () => document.createElement('div'),
      },
      deck,
      registry,
      concept,
      beatTypes: {
        text: {
          primary: 'block',
          render: () => {
            beatRoot = document.createElement('section');
            const part = document.createElement('span');
            beatRoot.append(part);
            const remove = beatRoot.remove.bind(beatRoot);
            vi.spyOn(beatRoot, 'remove').mockImplementation(() => {
              events.push('root');
              remove();
            });
            return { root: beatRoot, parts: { block: [part] }, media: { seq, clip } };
          },
        },
      },
      gsap,
      measureFn: () => ({ x: 0, y: 0, w: 1, h: 1 }),
    });
    const kill = built.tl.kill.bind(built.tl);
    vi.spyOn(built.tl, 'kill').mockImplementation((...args) => {
      events.push('kill');
      return kill(...args);
    });

    built.destroy();
    expect(events).toEqual(['seq', 'clip', 'kill', 'root']);
    expect(beatRoot.isConnected).toBe(false);

    built.destroy();
    expect(events).toEqual(['seq', 'clip', 'kill', 'root']);
    expect(seq.destroy).toHaveBeenCalledOnce();
    expect(clip.destroy).toHaveBeenCalledOnce();
    expect(built.tl.kill).toHaveBeenCalledOnce();
  });
});
