/** 덱 → MP4 발표 경로(CONTRACTS C14). */
import { EXPORT_DEFAULTS } from './constants.js';

const finite = (value, fallback) => (Number.isFinite(value) ? value : fallback);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * 순수. lead → (travel → hold)* → travel → tail.
 * @param {import('./types.js').TimelineMap} map
 * @param {Partial<import('./types.js').ExportOptions>} [opts]
 * @param {Record<string, number>} [holds]  stop 이름 → hold 초(beat.exportHold)
 * @returns {import('./types.js').ExportPath}
 */
export function exportPath(map, opts, holds) {
  if (!map || !Number.isFinite(map.duration) || map.duration < 0 || !Array.isArray(map.stops)) {
    throw new TypeError('exportPath requires a TimelineMap with duration and stops');
  }
  const options = { ...EXPORT_DEFAULTS, ...opts };
  const segments = [];
  const stopAt = {};
  let clock = 0;
  let position = 0;
  const add = (kind, from, to, seconds) => {
    const start = clock;
    const end = start + seconds;
    segments.push({ kind, from, to, start, end });
    clock = end;
  };

  add('lead', 0, 0, Math.max(0, finite(options.lead, EXPORT_DEFAULTS.lead)));
  for (const stop of map.stops) {
    const target = finite(stop.t, position);
    if (target < position) throw new RangeError(`TimelineMap stops must be ascending: ${stop.name}`);
    if (target !== position) {
      const seconds = clamp(
        (target - position) * options.secondsPerUnit,
        options.travelMin,
        options.travelMax,
      );
      add('travel', position, target, seconds);
    }
    const hold = Math.max(0, finite(holds?.[stop.name], options.stopHold));
    stopAt[stop.name] = clock + hold / 2;
    add('hold', target, target, hold);
    position = target;
  }
  if (map.duration !== position) {
    const seconds = clamp(
      Math.abs(map.duration - position) * options.secondsPerUnit,
      options.travelMin,
      options.travelMax,
    );
    add('travel', position, map.duration, seconds);
  }
  add('tail', map.duration, map.duration, Math.max(0, finite(options.tail, EXPORT_DEFAULTS.tail)));
  return { duration: clock, segments, stopAt };
}

/**
 * stop 이름 → hold 초. 각 stop이 속한 beat의 exportHold(유한수일 때만).
 * boot(브라우저 wrapper)와 tools(영상 길이·stopAt)가 같은 표를 써야 시각이 맞는다.
 * @param {{ beats: Array<{ id: string, exportHold?: number }> }} deck
 * @param {import('./types.js').TimelineMap} map
 * @returns {Record<string, number>}
 */
export function exportHolds(deck, map) {
  return Object.fromEntries(
    map.stops
      .map((stop) => [stop.name, deck.beats.find((item) => item.id === stop.beat)?.exportHold])
      .filter(([, hold]) => Number.isFinite(hold)),
  );
}

/**
 * paused wrapper: segment마다 master.tweenFromTo(from, to, { duration, ease })를 start 초에 add.
 * @param {object} master  paused master timeline
 * @param {import('./types.js').ExportPath} path
 * @param {object} gsap
 * @returns {object}
 */
export function buildExportTimeline(master, path, gsap) {
  if (!master?.tweenFromTo || !gsap?.timeline) throw new TypeError('master and gsap timeline are required');
  const wrapper = gsap.timeline({ paused: true });
  for (const segment of path.segments) {
    // Holds are deliberately timeline gaps: an empty tween would make their
    // static state dependent on a synthetic target. Lead/tail are real master
    // tweens at a fixed time, which also makes the wrapper seekable through
    // the path's full advertised duration.
    if (segment.kind === 'hold' || segment.end <= segment.start) continue;
    wrapper.add(
      master.tweenFromTo(segment.from, segment.to, {
        duration: segment.end - segment.start,
        ease: EXPORT_DEFAULTS.ease,
      }),
      segment.start,
    );
  }
  return wrapper;
}

/**
 * timeline 시각 u → 영상 초. 단조 비감소. 한 u가 hold 구간이면 그 hold 시작 초.
 * @param {import('./types.js').ExportPath} path
 * @param {number} t
 * @returns {number}
 */
export function toExportSeconds(path, t) {
  const segments = path?.segments ?? [];
  if (!segments.length) return 0;
  const time = finite(t, 0);
  for (const segment of segments) {
    if (segment.kind === 'hold' && time === segment.from) return segment.start;
    if (segment.kind === 'travel') {
      const lo = Math.min(segment.from, segment.to);
      const hi = Math.max(segment.from, segment.to);
      if (time >= lo && time <= hi) {
        const ratio = segment.from === segment.to ? 0 : (time - segment.from) / (segment.to - segment.from);
        return segment.start + ratio * (segment.end - segment.start);
      }
    }
  }
  if (time <= segments[0].from) return 0;
  return path.duration;
}
