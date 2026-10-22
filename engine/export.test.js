import { describe, expect, it } from 'vitest';
import { buildExportTimeline, exportHolds, exportPath, toExportSeconds } from './export.js';

const map = {
  duration: 10,
  stops: [
    { name: 'open', t: 0, label: 'stop:open', beat: 'open' },
    { name: 'middle', t: 4, label: 'stop:middle', beat: 'middle' },
    { name: 'end', t: 8, label: 'stop:end', beat: 'end' },
  ],
};

describe('exportPath', () => {
  it('creates continuous segments whose total is the advertised duration', () => {
    const path = exportPath(map, { lead: 0.4, tail: 1.2 }, { middle: 2 });
    expect(path.segments[0]).toMatchObject({ kind: 'lead', from: 0, to: 0, start: 0, end: 0.4 });
    for (let index = 1; index < path.segments.length; index += 1) {
      expect(path.segments[index].start).toBe(path.segments[index - 1].end);
    }
    expect(path.segments.at(-1).end).toBe(path.duration);
    expect(path.stopAt.open).toBeCloseTo(1.2);
    expect(path.stopAt.middle).toBeCloseTo(5.0);
    expect(path.stopAt.end).toBeCloseTo(8.8);
    expect(path.segments.reduce((sum, segment) => sum + segment.end - segment.start, 0)).toBeCloseTo(
      path.duration,
    );
  });

  it('clamps travel, includes the final run to map end, and honors stop holds', () => {
    const path = exportPath(
      map,
      { secondsPerUnit: 1, travelMin: 1, travelMax: 2, lead: 0, tail: 0 },
      { end: 3 },
    );
    expect(
      path.segments
        .filter((segment) => segment.kind === 'travel')
        .map((segment) => segment.end - segment.start),
    ).toEqual([2, 2, 2]);
    expect(path.stopAt.end).toBe(8.7);
  });
});

describe('buildExportTimeline', () => {
  it('seeks the master deterministically through travel segments and preserves export duration', () => {
    const master = {
      time: 0,
      tweenFromTo(from, to, vars) {
        return { from, to, duration: vars.duration };
      },
    };
    const gsap = {
      timeline() {
        const children = [];
        return {
          add(child, start) {
            children.push({ child, start });
            return this;
          },
          duration() {
            return Math.max(...children.map(({ child, start }) => start + child.duration), 0);
          },
          seek(time) {
            for (const { child, start } of children) {
              if (time < start || time > start + child.duration) continue;
              const progress = (time - start) / child.duration;
              master.time = child.from + (child.to - child.from) * progress;
            }
            return this;
          },
        };
      },
    };
    const path = exportPath(map, { lead: 0.4, tail: 1.2 });
    const wrapper = buildExportTimeline(master, path, gsap);
    wrapper.seek(2.4);
    const first = master.time;
    wrapper.seek(7.7);
    wrapper.seek(2.4);
    expect(master.time).toBeCloseTo(first);
    expect(wrapper.duration()).toBeCloseTo(path.duration);
  });
});

describe('exportHolds', () => {
  it('maps every stop of a beat to that beat exportHold and skips beats without one', () => {
    const deck = { beats: [{ id: 'a', exportHold: 2.4 }, { id: 'b' }] };
    const stops = [
      { name: 'a', beat: 'a', t: 1 },
      { name: 'a/step', beat: 'a', t: 2 },
      { name: 'b', beat: 'b', t: 3 },
    ];
    expect(exportHolds(deck, { duration: 4, stops })).toEqual({ a: 2.4, 'a/step': 2.4 });
  });
});

describe('toExportSeconds', () => {
  it('is monotonic and maps a held timeline point to the hold start', () => {
    const path = exportPath(map);
    const times = Array.from({ length: 101 }, (_, index) => toExportSeconds(path, index / 10));
    for (let index = 1; index < times.length; index += 1)
      expect(times[index]).toBeGreaterThanOrEqual(times[index - 1]);
    const hold = path.segments.find((segment) => segment.kind === 'hold' && segment.from === 4);
    expect(toExportSeconds(path, 4)).toBe(hold.start);
  });
});
