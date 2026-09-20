/**
 * _tl-recorder.mjs — gsap 타임라인 대역. 안무를 실행하지 않고 "언제 시작해 얼마나 걸리는지"만 적는다.
 *
 * 엔진은 장면 타임라인을 0..1 구간에 두고 ScrollTrigger가 scrub으로 끌어간다(references/contract.md).
 * 총 길이가 1을 넘으면 GSAP이 전체를 1/duration으로 눌러 진입·홀드·퇴장 비율이 통째로 어긋난다.
 * G2는 그 총 길이를 여기서 계산한다.
 *
 * 구현 범위
 *  - to / from / fromTo / set / call / add / addLabel / addPause / then 체인
 *  - position 파라미터: 숫자, '+=n', '-=n', '<', '>', '<+=n', '>-=n', 라벨, '라벨+=n'
 *  - duration 기본값 0.5, delay, repeat, repeatDelay, stagger(숫자 · {each} · {amount})
 *  - 중첩 타임라인은 자식의 duration()을 그대로 쓴다
 *
 * 한계
 *  - yoyo·repeat:-1은 1회 길이로 본다(무한 반복은 스크럽 타임라인에서 의미가 없다).
 *  - 타깃이 문자열 선택자면 개수를 알 수 없어 3개로 가정한다(_fake-dom과 같은 가정).
 *  - keyframes 배열 안무는 vars.duration만 본다.
 */

const DEFAULT_DURATION = 0.5;
const ASSUMED_TARGETS = 3;

function countTargets(targets) {
  if (targets == null) return 1;
  if (typeof targets === 'string') return ASSUMED_TARGETS;
  if (Array.isArray(targets)) return Math.max(1, targets.length);
  if (typeof targets === 'object' && typeof targets.length === 'number' && !targets.tagName) {
    return Math.max(1, targets.length);
  }
  return 1;
}

function staggerSpan(stagger, n) {
  if (stagger == null) return 0;
  if (typeof stagger === 'number') return Math.abs(stagger) * Math.max(0, n - 1);
  if (typeof stagger === 'object') {
    if (stagger.amount != null) return Math.abs(Number(stagger.amount) || 0);
    if (stagger.each != null) return Math.abs(Number(stagger.each) || 0) * Math.max(0, n - 1);
  }
  return 0;
}

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** vars에서 {delay, span}을 뽑는다. span은 stagger까지 포함한 실제 점유 길이다. */
function measure(vars, targetCount, { zeroDuration = false } = {}) {
  const v = vars && typeof vars === 'object' ? vars : {};
  let base = zeroDuration ? 0 : v.duration != null ? num(v.duration, DEFAULT_DURATION) : DEFAULT_DURATION;
  if (base < 0) base = 0;
  const repeat = num(v.repeat, 0);
  const repeatDelay = num(v.repeatDelay, 0);
  let span = base;
  if (repeat > 0) span = base * (repeat + 1) + repeatDelay * repeat;
  span += staggerSpan(v.stagger, targetCount);
  return { delay: Math.max(0, num(v.delay, 0)), span };
}

export class TimelineRecorder {
  constructor(vars = {}) {
    this.vars = vars && typeof vars === 'object' ? vars : {};
    this.entries = [];
    this.labels = new Map();
    this._end = 0;
    this._lastStart = 0;
    this._lastEnd = 0;
    this._forcedDuration = null;
    this._children = [];
  }

  /** GSAP position 파라미터를 절대 시각으로 푼다. */
  _position(position) {
    if (position == null) return this._end;
    if (typeof position === 'number') return Number.isFinite(position) ? position : this._end;
    const text = String(position).trim();
    if (!text) return this._end;

    let m = /^([<>])\s*(?:([+-]=)\s*([\d.]+))?$/.exec(text);
    if (m) {
      const base = m[1] === '<' ? this._lastStart : this._lastEnd;
      if (!m[2]) return base;
      const delta = num(m[3], 0);
      return m[2] === '+=' ? base + delta : base - delta;
    }
    m = /^([+-]=)\s*([\d.]+)$/.exec(text);
    if (m) {
      const delta = num(m[2], 0);
      return m[1] === '+=' ? this._end + delta : this._end - delta;
    }
    m = /^([^+\-\s]+)\s*([+-]=)\s*([\d.]+)$/.exec(text);
    if (m) {
      const base = this.labels.has(m[1]) ? this.labels.get(m[1]) : this._end;
      const delta = num(m[3], 0);
      return m[2] === '+=' ? base + delta : base - delta;
    }
    if (this.labels.has(text)) return this.labels.get(text);
    this.labels.set(text, this._end); // GSAP은 모르는 라벨을 현재 끝에 만든다
    return this._end;
  }

  _record(kind, start, span, note) {
    const clamped = Math.max(0, start);
    const end = clamped + Math.max(0, span);
    this.entries.push({ kind, start: clamped, end, note });
    this._lastStart = clamped;
    this._lastEnd = end;
    if (end > this._end) this._end = end;
    return this;
  }

  _tween(kind, targets, vars, position, { zeroDuration = false } = {}) {
    const n = countTargets(targets);
    const { delay, span } = measure(vars, n, { zeroDuration });
    return this._record(kind, this._position(position) + delay, span, vars?.__note);
  }

  to(targets, vars, position) { return this._tween('to', targets, vars, position); }
  from(targets, vars, position) { return this._tween('from', targets, vars, position); }

  fromTo(targets, fromVars, toVars, position) {
    // fromTo는 두 번째 vars가 길이를 정한다.
    return this._tween('fromTo', targets, toVars ?? fromVars, position);
  }

  set(targets, vars, position) { return this._tween('set', targets, vars, position, { zeroDuration: true }); }

  call(fn, params, position) { void fn; void params; return this._record('call', this._position(position), 0); }

  addLabel(name, position) { this.labels.set(String(name), this._position(position)); return this; }

  addPause(position) { return this._record('pause', this._position(position), 0); }

  add(child, position) {
    if (typeof child === 'string') return this.addLabel(child, position);
    if (Array.isArray(child)) {
      const start = this._position(position);
      let span = 0;
      for (const item of child) {
        if (item && typeof item.duration === 'function') span = Math.max(span, num(item.duration(), 0));
      }
      return this._record('add', start, span);
    }
    if (child && typeof child.duration === 'function') {
      this._children.push(child);
      return this._record('add', this._position(position), num(child.duration(), 0));
    }
    return this._record('add', this._position(position), 0);
  }

  duration(value) {
    if (value === undefined) return this._forcedDuration ?? this._end;
    this._forcedDuration = num(value, this._end);
    return this;
  }

  totalDuration(value) { return this.duration(value); }

  /** 가장 늦게 끝나는 항목. 무엇이 1을 넘겼는지 보고하려고 쓴다. */
  worst() {
    let worst = null;
    for (const entry of this.entries) if (!worst || entry.end > worst.end) worst = entry;
    return worst;
  }

  // 아래는 전부 체인 유지용 무동작
  timeScale() { return this; }
  progress() { return this; }
  play() { return this; }
  pause() { return this; }
  resume() { return this; }
  reverse() { return this; }
  restart() { return this; }
  seek() { return this; }
  kill() { return this; }
  clear() { this.entries.length = 0; this._end = 0; this._lastStart = 0; this._lastEnd = 0; return this; }
  eventCallback() { return this; }
  invalidate() { return this; }
  time() { return 0; }
  isActive() { return false; }
  getChildren() { return this._children.slice(); }
  then(fn) { try { fn?.(this); } catch { /* 무시 */ } return Promise.resolve(this); }
}

export function createTimelineRecorder(vars) {
  return new TimelineRecorder(vars);
}
