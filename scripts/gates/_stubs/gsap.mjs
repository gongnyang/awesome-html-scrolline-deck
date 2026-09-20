/** gsap 대역. 정적 게이트에서 장면 모듈이 import 하는 gsap을 대신한다. 안무는 기록만 된다. */
import { TimelineRecorder } from '../_tl-recorder.mjs';

function tweenLike() {
  const api = {
    kill: () => api, pause: () => api, play: () => api, resume: () => api, restart: () => api,
    reverse: () => api, seek: () => api, progress: () => api, timeScale: () => api,
    invalidate: () => api, eventCallback: () => api, duration: () => 0.5, totalDuration: () => 0.5,
    isActive: () => false, then: (fn) => { try { fn?.(api); } catch { /* 무시 */ } return Promise.resolve(api); },
    targets: () => [], vars: {},
  };
  return api;
}

const utils = {
  toArray: (target) => {
    if (target == null) return [];
    if (Array.isArray(target)) return target.slice();
    if (typeof target === 'string') return [];
    if (typeof target === 'object' && typeof target.length === 'number' && !target.tagName) return Array.from(target);
    return [target];
  },
  selector: () => () => [],
  clamp: (min, max, value) => (value === undefined ? (v) => Math.min(max, Math.max(min, v)) : Math.min(max, Math.max(min, value))),
  mapRange: (...args) => (args.length >= 5 ? args[4] : () => 0),
  interpolate: (a, b, p) => (p === undefined ? () => a : a),
  normalize: () => () => 0,
  snap: (_snapTo, value) => (value === undefined ? (v) => v : value),
  wrap: (...args) => (args.length >= 3 ? args[2] : () => 0),
  wrapYoyo: (...args) => (args.length >= 3 ? args[2] : () => 0),
  random: (min) => (typeof min === 'number' ? min : 0),
  distribute: () => () => 0,
  shuffle: (arr) => arr,
  pipe: (...fns) => (value) => fns.reduce((acc, fn) => fn(acc), value),
  unitize: (fn) => fn,
  getUnit: () => '',
  splitColor: () => [0, 0, 0],
  checkPrefix: (prop) => prop,
};

const ticker = { add: () => {}, remove: () => {}, lagSmoothing: () => {}, fps: () => {}, time: 0, frame: 0, deltaRatio: () => 1 };

const gsap = {
  version: '3.12.5-stub',
  timeline: (vars) => new TimelineRecorder(vars),
  to: () => tweenLike(),
  from: () => tweenLike(),
  fromTo: () => tweenLike(),
  set: () => tweenLike(),
  delayedCall: () => tweenLike(),
  killTweensOf: () => {},
  getTweensOf: () => [],
  isTweening: () => false,
  registerPlugin: () => {},
  registerEffect: () => {},
  effects: {},
  defaults: () => {},
  config: () => {},
  getProperty: () => 0,
  setProperty: () => {},
  quickSetter: () => () => {},
  quickTo: () => () => tweenLike(),
  parseEase: () => (value) => value,
  exportRoot: () => new TimelineRecorder(),
  updateRoot: () => {},
  globalTimeline: { pause: () => {}, play: () => {}, timeScale: () => {}, clear: () => {} },
  context: (fn) => {
    try { fn?.(); } catch { /* 장면이 context 안에서 터져도 게이트는 계속 본다 */ }
    return { revert: () => {}, kill: () => {}, add: (f) => { try { f?.(); } catch { /* 무시 */ } }, data: [] };
  },
  matchMedia: () => {
    const api = {
      add(_query, fn) { try { fn?.({ conditions: {}, add: () => {} }); } catch { /* 무시 */ } return api; },
      revert: () => {}, kill: () => {},
    };
    return api;
  },
  matchMediaRefresh: () => {},
  ticker,
  utils,
};

export default gsap;
export { gsap };
