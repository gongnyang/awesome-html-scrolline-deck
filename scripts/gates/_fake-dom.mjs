/**
 * _fake-dom.mjs — 정적 게이트(G1·G2)가 장면 모듈을 브라우저 없이 실행하기 위한 최소 DOM 대역.
 *
 * jsdom을 쓰지 않는다. 장면 모듈은 `mount(section, ctx)`에서 DOM을 만지고
 * `build(tl, ctx)`에서 타임라인만 쌓으므로, 여기서는 "무엇을 물어도 그럴듯한 값을 돌려주는"
 * 요소 대역이면 충분하다.
 *
 * 한계(의도적):
 *  - querySelectorAll은 항상 3개를 돌려준다. stagger 총 길이 계산이 이 개수에 의존하므로
 *    실제 요소 수가 3보다 많으면 G2가 과소 추정할 수 있다(→ 템플릿은 stagger.amount 권장).
 *  - 레이아웃은 400x300 고정. 레이아웃 의존 안무(getBoundingClientRect 기반 거리)는
 *    값만 그럴듯할 뿐 실제와 다르다. 실측은 브라우저 게이트(G5~G10)가 한다.
 *  - 이벤트는 발화하지 않는다. 리스너는 등록만 되고 버려진다.
 */

const MAX_DEPTH = 5;

/** 무엇으로 써도 터지지 않는 만능 값. 알 수 없는 속성 접근의 기본값이다. */
function universal() {
  const fn = function universalValue() { return universal(); };
  return new Proxy(fn, {
    get(_t, key) {
      if (key === Symbol.toPrimitive) return () => 0;
      if (key === Symbol.iterator) return function* () {};
      if (key === Symbol.toStringTag) return 'Universal';
      if (key === 'then') return undefined; // await 대상이 되지 않게
      if (key === 'length') return 0;
      if (key === 'valueOf') return () => 0;
      if (key === 'toString') return () => '';
      return universal();
    },
    set: () => true,
    has: () => true,
    apply: () => universal(),
    construct: () => universal(),
  });
}

function makeStyle() {
  const store = Object.create(null);
  return new Proxy(store, {
    get(t, key) {
      if (key === 'setProperty') return (k, v) => { t[String(k)] = String(v); };
      if (key === 'getPropertyValue') return (k) => t[String(k)] ?? '';
      if (key === 'removeProperty') return (k) => { delete t[String(k)]; };
      if (key === 'item') return () => '';
      if (key === 'length') return Object.keys(t).length;
      if (key === 'cssText') return '';
      if (typeof key !== 'string') return undefined;
      return key in t ? t[key] : '';
    },
    set(t, key, value) { t[String(key)] = value; return true; },
    has: () => true,
  });
}

function makeClassList() {
  const set = new Set();
  return {
    add: (...c) => c.forEach((x) => set.add(x)),
    remove: (...c) => c.forEach((x) => set.delete(x)),
    toggle: (c, force) => { const on = force ?? !set.has(c); if (on) set.add(c); else set.delete(c); return on; },
    contains: (c) => set.has(c),
    replace: () => true,
    get length() { return set.size; },
    item: (i) => [...set][i] ?? null,
    toString: () => [...set].join(' '),
    [Symbol.iterator]: () => set[Symbol.iterator](),
  };
}

function tagFromSelector(selector) {
  const s = String(selector ?? '').toLowerCase();
  for (const tag of ['img', 'video', 'canvas', 'svg', 'path', 'button', 'ul', 'li', 'span', 'p']) {
    if (new RegExp(`(^|[\\s,>+~])${tag}\\b`).test(s) || s.includes(`-${tag}`) || s.includes(`__${tag}`)) return tag;
  }
  return 'div';
}

function rect(width = 400, height = 300) {
  const r = { x: 0, y: 0, top: 0, left: 0, right: width, bottom: height, width, height };
  r.toJSON = () => r;
  return r;
}

/** 요소 대역 하나를 만든다. depth는 querySelector 재귀 폭주를 막는 안전장치다. */
export function makeElement(tag = 'div', depth = 0) {
  const base = {
    tagName: String(tag).toUpperCase(),
    nodeName: String(tag).toUpperCase(),
    localName: String(tag).toLowerCase(),
    nodeType: 1,
    id: '',
    className: '',
    textContent: 'sample',
    innerText: 'sample',
    innerHTML: '',
    outerHTML: '',
    value: '',
    href: '',
    src: '',
    hidden: false,
    isConnected: true,
    children: [],
    childNodes: [],
    firstChild: null,
    firstElementChild: null,
    lastChild: null,
    lastElementChild: null,
    parentNode: null,
    parentElement: null,
    nextElementSibling: null,
    previousElementSibling: null,
    offsetTop: 0,
    offsetLeft: 0,
    offsetWidth: 400,
    offsetHeight: 300,
    clientWidth: 400,
    clientHeight: 300,
    clientTop: 0,
    clientLeft: 0,
    scrollWidth: 400,
    scrollHeight: 300,
    scrollTop: 0,
    scrollLeft: 0,
    naturalWidth: 1600,
    naturalHeight: 900,
    videoWidth: 1280,
    videoHeight: 720,
    currentTime: 0,
    duration: 10,
    paused: true,
    muted: true,
    readyState: 4,
    complete: true,
    dataset: {},
    style: makeStyle(),
    classList: makeClassList(),
    attributes: [],
  };

  base.getBoundingClientRect = () => rect();
  base.getClientRects = () => [rect()];
  base.getAttribute = (name) => (name === 'data-scene' ? base.dataset.scene ?? null : null);
  base.setAttribute = (name, value) => {
    if (String(name).startsWith('data-')) base.dataset[String(name).slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
  };
  base.removeAttribute = () => {};
  base.hasAttribute = () => false;
  base.getAttributeNS = () => null;
  base.setAttributeNS = () => {};
  base.appendChild = (child) => child;
  base.append = () => {};
  base.prepend = () => {};
  base.insertBefore = (child) => child;
  base.removeChild = (child) => child;
  base.remove = () => {};
  base.replaceChildren = () => {};
  base.insertAdjacentHTML = () => {};
  base.cloneNode = () => makeElement(tag, depth);
  base.contains = () => true;
  base.closest = () => (depth >= MAX_DEPTH ? null : makeElement('div', depth + 1));
  base.matches = () => false;
  base.addEventListener = () => {};
  base.removeEventListener = () => {};
  base.dispatchEvent = () => true;
  base.focus = () => {};
  base.blur = () => {};
  base.click = () => {};
  base.play = () => Promise.resolve();
  base.pause = () => {};
  base.load = () => {};
  base.animate = () => ({ cancel() {}, finish() {}, pause() {}, play() {}, reverse() {}, finished: Promise.resolve() });
  base.getTotalLength = () => 100;
  base.getPointAtLength = () => ({ x: 0, y: 0 });
  base.getContext = () => universal();
  base.querySelector = (selector) => (depth >= MAX_DEPTH ? null : makeElement(tagFromSelector(selector), depth + 1));
  base.querySelectorAll = (selector) =>
    depth >= MAX_DEPTH ? [] : Array.from({ length: 3 }, () => makeElement(tagFromSelector(selector), depth + 1));
  base.getElementsByTagName = (t) => base.querySelectorAll(t);
  base.getElementsByClassName = () => base.querySelectorAll('div');

  return new Proxy(base, {
    get(target, key) {
      if (key in target) return target[key];
      if (typeof key === 'symbol') {
        if (key === Symbol.toPrimitive) return () => '';
        return undefined;
      }
      return universal();
    },
    set(target, key, value) { target[key] = value; return true; },
    has: () => true,
  });
}

export function makeDocument() {
  const documentElement = makeElement('html');
  const body = makeElement('body');
  const doc = {
    nodeType: 9,
    documentElement,
    body,
    head: makeElement('head'),
    title: '',
    hidden: false,
    visibilityState: 'visible',
    fullscreenElement: null,
    fonts: { ready: Promise.resolve(), load: () => Promise.resolve(), check: () => true, add: () => {} },
    createElement: (tag) => makeElement(tag),
    createElementNS: (_ns, tag) => makeElement(tag),
    createTextNode: (text) => ({ nodeType: 3, textContent: String(text ?? '') }),
    createDocumentFragment: () => makeElement('fragment'),
    querySelector: (selector) => makeElement(tagFromSelector(selector), 1),
    querySelectorAll: (selector) => Array.from({ length: 3 }, () => makeElement(tagFromSelector(selector), 1)),
    getElementById: () => makeElement('div', 1),
    getElementsByTagName: (t) => Array.from({ length: 3 }, () => makeElement(t, 1)),
    getElementsByClassName: () => Array.from({ length: 3 }, () => makeElement('div', 1)),
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    exitFullscreen: () => Promise.resolve(),
    elementFromPoint: () => makeElement('div', 1),
  };
  return new Proxy(doc, {
    get(target, key) {
      if (key in target) return target[key];
      if (typeof key === 'symbol') return undefined;
      return universal();
    },
    set(target, key, value) { target[key] = value; return true; },
    has: () => true,
  });
}

class FakeObserver {
  constructor(callback) { this.callback = callback; }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}

function makeWindow(document) {
  const win = {
    document,
    innerWidth: 1440,
    innerHeight: 900,
    outerWidth: 1440,
    outerHeight: 900,
    devicePixelRatio: 1,
    scrollX: 0,
    scrollY: 0,
    pageXOffset: 0,
    pageYOffset: 0,
    location: { href: 'http://localhost/', pathname: '/', search: '', hash: '', origin: 'http://localhost' },
    navigator: { userAgent: 'scrolline-gate', maxTouchPoints: 0, hardwareConcurrency: 8, deviceMemory: 8, language: 'ko-KR' },
    matchMedia: (query) => ({
      matches: false,
      media: String(query ?? ''),
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
    }),
    getComputedStyle: () => makeStyle(),
    requestAnimationFrame: (fn) => { void fn; return 1; },
    cancelAnimationFrame: () => {},
    requestIdleCallback: (fn) => { void fn; return 1; },
    cancelIdleCallback: () => {},
    setTimeout: () => 1,
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    performance: { now: () => 0, mark: () => {}, measure: () => {} },
    IntersectionObserver: FakeObserver,
    ResizeObserver: FakeObserver,
    MutationObserver: FakeObserver,
    Image: class FakeImage { constructor() { this.src = ''; this.onload = null; this.onerror = null; } },
    Audio: class FakeAudio { play() { return Promise.resolve(); } pause() {} },
    Element: function Element() {},
    HTMLElement: function HTMLElement() {},
    SVGElement: function SVGElement() {},
    CSS: { supports: () => true, escape: (s) => String(s) },
  };
  return new Proxy(win, {
    get(target, key) {
      if (key in target) return target[key];
      if (typeof key === 'symbol') return undefined;
      return universal();
    },
    set(target, key, value) { target[key] = value; return true; },
    has: () => true,
  });
}

const GLOBAL_KEYS = [
  'window', 'document', 'navigator', 'location', 'matchMedia', 'getComputedStyle',
  'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback', 'cancelIdleCallback',
  'IntersectionObserver', 'ResizeObserver', 'MutationObserver', 'Image', 'Audio',
  'Element', 'HTMLElement', 'SVGElement', 'CSS',
];

let installs = 0;
let saved = null;

/** 장면 모듈을 import 하기 전에 호출한다. 중첩 호출은 카운트로 관리한다. */
export function installFakeGlobals() {
  installs += 1;
  if (installs > 1) return globalThis.window;
  saved = new Map();
  const document = makeDocument();
  const window = makeWindow(document);
  for (const key of GLOBAL_KEYS) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    const value = key === 'window' ? window : key === 'document' ? document : window[key];
    Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
  }
  return window;
}

export function restoreGlobals() {
  installs = Math.max(0, installs - 1);
  if (installs > 0 || !saved) return;
  for (const [key, descriptor] of saved) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
  saved = null;
}

/** 장면 섹션 대역. data-scene을 실제 id로 채워 넘긴다. */
export function makeSection(sceneId, technique = 'unknown') {
  const section = makeElement('section');
  section.className = 'scene';
  section.dataset.scene = sceneId;
  section.dataset.technique = technique;
  return section;
}
