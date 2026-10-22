import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  validateDeck: vi.fn(),
  plan: vi.fn(),
  build: vi.fn(),
  createStage: vi.fn(),
  computeViewport: vi.fn(),
  createDriver: vi.fn(),
  createPresenter: vi.fn(),
  createA11y: vi.fn(),
  exportPath: vi.fn(),
  exportHolds: vi.fn(),
  buildExport: vi.fn(),
  toExportSeconds: vi.fn(),
}));
vi.mock('./deck-schema.js', () => ({ validateDeck: mocks.validateDeck }));
vi.mock('./timeline.js', () => ({ plan: mocks.plan, build: mocks.build }));
vi.mock('./stage.js', () => ({ createStage: mocks.createStage, computeViewport: mocks.computeViewport }));
vi.mock('./scroll.js', () => ({ createScrollDriver: mocks.createDriver }));
vi.mock('./presenter.js', () => ({ createPresenter: mocks.createPresenter }));
vi.mock('./a11y.js', () => ({ createA11y: mocks.createA11y, prefersReducedMotion: () => false }));
vi.mock('./export.js', () => ({
  exportPath: mocks.exportPath,
  exportHolds: mocks.exportHolds,
  buildExportTimeline: mocks.buildExport,
  toExportSeconds: mocks.toExportSeconds,
}));
vi.mock('./beats/index.js', () => ({ beatTypes: {} }));

import { boot } from './boot.js';

const deck = { id: 'demo', concept: 'smoke', beats: [], sources: [{ id: 's1', title: 'Source one' }] };
const concept = { id: 'smoke' };
const moves = {};
const initialFontsDescriptor = Object.getOwnPropertyDescriptor(document, 'fonts');

function deferred() {
  let resolve;
  const promise = new Promise((done) => (resolve = done));
  return { promise, resolve };
}

function stubFonts(ready) {
  Object.defineProperty(document, 'fonts', { configurable: true, value: { ready } });
}

function built() {
  return { tl: { time: vi.fn(() => 1.25), seek: vi.fn() }, beats: [], destroy: vi.fn() };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();
  if (initialFontsDescriptor) Object.defineProperty(document, 'fonts', initialFontsDescriptor);
  else Reflect.deleteProperty(document, 'fonts');
  Object.defineProperty(document, 'fonts', { configurable: true, value: undefined });
  document.body.innerHTML = '<div id="app"></div>';
  delete window.__deck;
  delete window.__timelines;
  mocks.validateDeck.mockReturnValue({ ok: true, errors: [] });
  mocks.plan.mockReturnValue({ duration: 4, stops: [] });
  mocks.computeViewport.mockReturnValue({ w: 1000, h: 800 });
  mocks.createStage.mockImplementation((host) => {
    const root = document.createElement('div');
    host.append(root);
    return { root, clear: vi.fn(), viewport: {} };
  });
  mocks.build.mockImplementation(async () => built());
  mocks.createDriver.mockImplementation(() => ({
    attach: vi.fn(),
    detach: vi.fn(),
    time: vi.fn(() => 1.25),
    seek: vi.fn(),
    stops: vi.fn(() => []),
  }));
  mocks.createPresenter.mockReturnValue({ destroy: vi.fn(), goto: vi.fn() });
  mocks.createA11y.mockReturnValue({ destroy: vi.fn() });
  mocks.exportPath.mockReturnValue({ duration: 8 });
  mocks.exportHolds.mockReturnValue({});
  mocks.buildExport.mockReturnValue({});
  mocks.toExportSeconds.mockImplementation((path, time) => time);
});
afterEach(() => {
  vi.useRealTimers();
  if (initialFontsDescriptor) Object.defineProperty(document, 'fonts', initialFontsDescriptor);
  else Reflect.deleteProperty(document, 'fonts');
});

describe('boot', () => {
  it('renders validation errors and throws before planning', async () => {
    mocks.validateDeck.mockReturnValue({ ok: false, errors: [{ path: 'beats[0]', message: 'bad' }] });
    await expect(
      boot({ host: document.querySelector('#app'), deck, concept, moves, assetBase: '/' }),
    ).rejects.toThrow('validation failed');
    expect(document.querySelector('.sl-error')).not.toBeNull();
    expect(mocks.plan).not.toHaveBeenCalled();
  });

  it('builds the live integrations and exposes window.__deck', async () => {
    const ready = vi.fn();
    window.addEventListener('scrolline:ready', ready);
    const handle = await boot({ host: document.querySelector('#app'), deck, concept, moves, assetBase: '/' });
    expect(mocks.validateDeck).toHaveBeenCalledBefore(mocks.plan);
    expect(mocks.plan).toHaveBeenCalledBefore(mocks.createStage);
    expect(mocks.createDriver).toHaveBeenCalledOnce();
    expect(mocks.createPresenter).toHaveBeenCalledOnce();
    expect(window.__deck.mode).toBe('live');
    expect(ready).toHaveBeenCalledOnce();
    handle.destroy();
    window.removeEventListener('scrolline:ready', ready);
  });

  // 회귀(data 통합): 글꼴 rebuild 뒤에도 __deck.tl이 첫 build의 timeline을 가리켜 smoke seek이 옛 timeline을 돌렸다.
  it('keeps window.__deck.tl on the current build after a rebuild', async () => {
    const first = built();
    const second = built();
    mocks.build.mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    const handle = await boot({ host: document.querySelector('#app'), deck, concept, moves, assetBase: '/' });
    expect(window.__deck.tl).toBe(first.tl);
    await handle.rebuild('fonts');
    expect(window.__deck.tl).toBe(second.tl);
    expect(first.destroy).toHaveBeenCalledOnce();
    handle.destroy();
    handle.destroy();
    expect(second.destroy).toHaveBeenCalledOnce();
  });

  // 문서 대조로 찾은 결함: C12 URL 파라미터 ?t·?stop·?debug=1이 구현돼 있지 않았다(?motion=reduce만).
  it('starts at ?stop or ?t and shows the ?debug=1 HUD', async () => {
    mocks.plan.mockReturnValue({
      duration: 10,
      stops: [{ name: 'two', label: 'stop:two', beat: 'b', t: 6 }],
      beats: [{ id: 'b', start: 5, stop: 6, end: 10, spans: [] }],
    });
    window.history.replaceState(null, '', '/?t=99&debug=1');
    let handle = await boot({ host: document.querySelector('#app'), deck, concept, moves, assetBase: '/' });
    const driver = mocks.createDriver.mock.results[0].value;
    expect(driver.seek).toHaveBeenCalledWith(10, { immediate: true });
    expect(document.querySelector('.sl-debug').textContent).toMatch(/^t 1\.25 · stop - · beat b$/);
    handle.destroy();
    expect(document.querySelector('.sl-debug')).toBeNull();

    window.history.replaceState(null, '', '/?stop=two&t=1');
    handle = await boot({ host: document.querySelector('#app'), deck, concept, moves, assetBase: '/' });
    expect(mocks.createDriver.mock.results[1].value.seek).toHaveBeenCalledWith(6, { immediate: true });
    handle.destroy();
    window.history.replaceState(null, '', '/');
  });

  it('uses export wrapper instead of scroll integrations', async () => {
    const handle = await boot({
      host: document.querySelector('#app'),
      deck,
      concept,
      moves,
      assetBase: '/',
      mode: 'export',
    });
    expect(mocks.createDriver).not.toHaveBeenCalled();
    expect(mocks.createPresenter).not.toHaveBeenCalled();
    expect(mocks.buildExport).toHaveBeenCalledOnce();
    expect(mocks.build).toHaveBeenCalledTimes(2);
    expect(window.__timelines.scrolline).toEqual({});
    handle.destroy();
  });

  it('passes the shared export holds table as the third exportPath argument', async () => {
    const map = { duration: 4, stops: [] };
    const holds = { title: 2.5 };
    const exportDeck = { ...deck, export: { lead: 0.5 }, beats: [{ id: 'title', exportHold: 2.5 }] };
    mocks.plan.mockReturnValue(map);
    mocks.exportHolds.mockReturnValue(holds);
    const handle = await boot({
      host: document.querySelector('#app'),
      deck: exportDeck,
      concept,
      moves,
      assetBase: '/',
      mode: 'export',
    });
    expect(mocks.exportHolds).toHaveBeenCalledWith(exportDeck, map);
    expect(mocks.exportPath).toHaveBeenCalledWith(map, exportDeck.export, holds);
    handle.destroy();
  });

  it('builds before waiting for fonts, then wraps only the final build', async () => {
    const sequence = [];
    const first = built();
    first.destroy.mockImplementation(() => sequence.push('destroy-1'));
    const final = built();
    const fontsReady = deferred();
    const fontsRequested = deferred();
    const wrapper = { final: true };
    const stage = {
      root: document.createElement('div'),
      clear: vi.fn(() => sequence.push('clear')),
      viewport: {},
    };
    mocks.createStage.mockReturnValue(stage);
    mocks.build
      .mockImplementationOnce(async () => {
        sequence.push('build-1');
        return first;
      })
      .mockImplementationOnce(async () => {
        sequence.push('build-2');
        return final;
      });
    mocks.buildExport.mockReturnValue(wrapper);
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      get() {
        sequence.push('fonts-ready');
        fontsRequested.resolve();
        return { ready: fontsReady.promise };
      },
    });

    const pending = boot({
      host: document.querySelector('#app'),
      deck,
      concept,
      moves,
      assetBase: '/',
      mode: 'export',
    });
    await fontsRequested.promise;
    expect(mocks.build).toHaveBeenCalledTimes(1);
    expect(sequence).toEqual(['build-1', 'fonts-ready']);
    expect(stage.clear).not.toHaveBeenCalled();

    fontsReady.resolve();
    const handle = await pending;
    expect(mocks.build).toHaveBeenCalledTimes(2);
    expect(sequence).toEqual(['build-1', 'fonts-ready', 'destroy-1', 'clear', 'build-2']);
    expect(stage.clear).toHaveBeenCalledOnce();
    expect(first.destroy).toHaveBeenCalledOnce();
    expect(handle.built).toBe(final);
    expect(mocks.buildExport).toHaveBeenCalledOnce();
    expect(mocks.buildExport.mock.calls[0][0]).toBe(final.tl);
    expect(window.__timelines.scrolline).toBe(wrapper);

    fontsReady.resolve();
    await Promise.resolve();
    expect(mocks.build).toHaveBeenCalledTimes(2);
    handle.destroy();
  });

  it('rebuilds once when live fonts settle', async () => {
    const fontsReady = deferred();
    const fontsRequested = deferred();
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      get() {
        fontsRequested.resolve();
        return { ready: fontsReady.promise };
      },
    });
    const rebuilt = new Promise((resolve) =>
      window.addEventListener('scrolline:rebuild', resolve, { once: true }),
    );

    const handle = await boot({ host: document.querySelector('#app'), deck, concept, moves, assetBase: '/' });
    await fontsRequested.promise;
    expect(mocks.build).toHaveBeenCalledOnce();

    fontsReady.resolve();
    await rebuilt;
    expect(mocks.build).toHaveBeenCalledTimes(2);
    handle.destroy();
  });

  it('does not rebuild when live fonts settle after disposal', async () => {
    const fontsReady = deferred();
    const fontsRequested = deferred();
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      get() {
        fontsRequested.resolve();
        return { ready: fontsReady.promise };
      },
    });
    const handle = await boot({ host: document.querySelector('#app'), deck, concept, moves, assetBase: '/' });
    await fontsRequested.promise;
    handle.destroy();

    fontsReady.resolve();
    await fontsReady.promise;
    await Promise.resolve();
    expect(mocks.build).toHaveBeenCalledOnce();
  });

  it('clears the export font timeout when fonts are already ready', async () => {
    stubFonts(Promise.resolve());
    const handle = await boot({
      host: document.querySelector('#app'),
      deck,
      concept,
      moves,
      assetBase: '/',
      mode: 'export',
    });

    expect(vi.getTimerCount()).toBe(0);
    handle.destroy();
  });

  it('registers the final export timeline when fonts.ready exceeds the timeout', async () => {
    const final = built();
    const fontsReady = deferred();
    const fontsRequested = deferred();
    const ready = vi.fn();
    mocks.build.mockResolvedValueOnce(built()).mockResolvedValueOnce(final);
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      get() {
        fontsRequested.resolve();
        return { ready: fontsReady.promise };
      },
    });
    window.addEventListener('scrolline:export-ready', ready);

    const pending = boot({
      host: document.querySelector('#app'),
      deck,
      concept,
      moves,
      assetBase: '/',
      mode: 'export',
    });
    await fontsRequested.promise;
    expect(mocks.build).toHaveBeenCalledTimes(1);
    expect(mocks.buildExport).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(8_000);
    const handle = await pending;
    expect(mocks.build).toHaveBeenCalledTimes(2);
    expect(mocks.buildExport).toHaveBeenCalledOnce();
    expect(mocks.buildExport.mock.calls[0][0]).toBe(final.tl);
    expect(window.__timelines.scrolline).toEqual({});
    expect(ready).toHaveBeenCalledOnce();
    expect(ready.mock.calls[0][0].detail).toEqual({ duration: 8 });

    fontsReady.resolve();
    await Promise.resolve();
    expect(mocks.build).toHaveBeenCalledTimes(2);
    handle.destroy();
    window.removeEventListener('scrolline:export-ready', ready);
  });

  it('passes the complete v2 renderer environment to build', async () => {
    const handle = await boot({
      host: document.querySelector('#app'),
      deck,
      concept,
      moves,
      assetBase: '/base/',
    });
    const env = mocks.build.mock.calls[0][1];
    expect(env.asset('assets/a.png')).toBe('/base/assets/a.png');
    expect(env.media.frameSequence).toBeTypeOf('function');
    expect(env.media.videoClip).toBeTypeOf('function');
    expect(env.el).toBeTypeOf('function');
    expect(env.words).toBeTypeOf('function');
    expect(env.chars).toBeTypeOf('function');
    expect(env.sources).toEqual({ s1: { id: 's1', title: 'Source one' } });
    expect(env.mode).toBe('live');
    expect(Object.keys(env.plugins)).toEqual([
      'SplitText',
      'Flip',
      'MorphSVGPlugin',
      'DrawSVGPlugin',
      'CustomEase',
    ]);
    handle.destroy();
  });

  it('emits active transitions once and controls live clips', async () => {
    let time = 0;
    let onUpdate;
    const tl = {
      time: vi.fn(() => time),
      seek: vi.fn(),
      eventCallback: vi.fn((name, callback) => {
        if (callback === undefined) return onUpdate;
        onUpdate = callback;
      }),
    };
    const clip = { activate: vi.fn(), deactivate: vi.fn() };
    mocks.build.mockResolvedValue({
      tl,
      beats: [
        { id: 'normal', span: { start: 1, end: 2 }, media: { clip } },
        { id: 'persist', data: { persist: true }, span: { start: 1, end: 2 }, media: {} },
      ],
      destroy: vi.fn(),
    });
    const active = vi.fn();
    window.addEventListener('scrolline:active', active);
    const handle = await boot({ host: document.querySelector('#app'), deck, concept, moves, assetBase: '/' });
    onUpdate();
    time = 1.5;
    onUpdate();
    onUpdate();
    time = 2;
    onUpdate();
    expect(active.mock.calls.map((call) => call[0].detail)).toEqual([
      { beat: 'normal', phase: 'enter' },
      { beat: 'persist', phase: 'enter' },
      { beat: 'normal', phase: 'leave' },
      { beat: 'persist', phase: 'leave' },
    ]);
    expect(clip.activate).toHaveBeenCalledOnce();
    expect(clip.deactivate).toHaveBeenCalledOnce();
    handle.destroy();
    window.removeEventListener('scrolline:active', active);
  });

  it('binds export clips and waits for every sequence before registering the wrapper', async () => {
    let readyOne;
    let readyTwo;
    const startedOne = deferred();
    const startedTwo = deferred();
    const first = {
      preloadAll: vi.fn(() => {
        startedOne.resolve();
        return new Promise((resolve) => (readyOne = resolve));
      }),
    };
    const second = {
      preloadAll: vi.fn(() => {
        startedTwo.resolve();
        return new Promise((resolve) => (readyTwo = resolve));
      }),
    };
    const clip = { bindExport: vi.fn() };
    stubFonts(Promise.resolve());
    mocks.build.mockResolvedValue({
      tl: { time: vi.fn(() => 0), seek: vi.fn() },
      beats: [
        { id: 'video', span: { start: 1, end: 3 }, media: { clip, seq: first } },
        { id: 'frames', span: { start: 3, end: 4 }, media: { seq: second } },
      ],
      destroy: vi.fn(),
    });
    mocks.toExportSeconds.mockImplementation((path, time) => time * 2);
    const active = vi.fn();
    window.addEventListener('scrolline:active', active);
    const pending = boot({
      host: document.querySelector('#app'),
      deck,
      concept,
      moves,
      assetBase: '/',
      mode: 'export',
    });
    await Promise.all([startedOne.promise, startedTwo.promise]);
    expect(mocks.buildExport).not.toHaveBeenCalled();
    readyOne();
    expect(mocks.buildExport).not.toHaveBeenCalled();
    readyTwo();
    const handle = await pending;
    expect(clip.bindExport).toHaveBeenCalledWith({ start: 2, duration: 4 });
    expect(mocks.buildExport).toHaveBeenCalledOnce();
    expect(active).not.toHaveBeenCalled();
    handle.destroy();
    window.removeEventListener('scrolline:active', active);
  });

  it('ignores small height-only resize but rebuilds and preserves time otherwise', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
    const handle = await boot({ host: document.querySelector('#app'), deck, concept, moves, assetBase: '/' });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 950 });
    window.dispatchEvent(new Event('resize'));
    await vi.advanceTimersByTimeAsync(200);
    expect(mocks.build).toHaveBeenCalledTimes(1);
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1050 });
    window.dispatchEvent(new Event('resize'));
    await vi.advanceTimersByTimeAsync(200);
    expect(mocks.build).toHaveBeenCalledTimes(2);
    expect(handle.driver.seek).toHaveBeenCalledWith(1.25, { immediate: true });
    handle.destroy();
  });
});
