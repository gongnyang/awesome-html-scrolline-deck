/**
 * qc.mjs — the checks that decide whether a render ships.
 *
 * Two things a promo film fails on that are invisible while you are making it:
 * frames that are effectively black (a scene gap caught mid-transition) and frames
 * that repeat (a stall in the capture, which reads as stutter). Both are measurable,
 * so they are measured rather than eyeballed.
 *
 *   node tools/demo/qc.mjs <video-or-frame-dir> [...]
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';

const run = promisify(execFile);
const FFMPEG = '/home/seunghyeong/.local/bin/ffmpeg';

/** Frame directory or video file, as ffmpeg input arguments. */
const sourceArgs = (input) => (input.includes('.mp4') || input.includes('.gif')
  ? ['-i', input]
  : ['-framerate', '30', '-start_number', '0', '-i', `${input.replace(/\/$/, '')}/f_%05d.jpg`]);

/**
 * Mean luma and the 90th-percentile luma for every frame.
 *
 * YAVG alone cannot tell a dark scene from an empty one — city-guide's night
 * cityscape averages 14 out of 255 and is one of the best frames in the film. YHIGH is
 * the discriminator: a composed frame, however dark, has something bright in it, and a
 * frame caught between two scenes has a YHIGH of 0.
 */
export async function lumaSeries(input) {
  const { stderr } = await run(FFMPEG, [
    '-hide_banner', '-loglevel', 'info', '-nostats', ...sourceArgs(input),
    '-vf', 'signalstats,metadata=print', '-f', 'null', '-',
  ], { maxBuffer: 1 << 28 });

  const frames = [];
  let current = {};
  for (const line of stderr.split('\n')) {
    const m = /lavfi\.signalstats\.(\w+)=([\d.]+)/.exec(line);
    if (!m) continue;
    const [, key, value] = m;
    if (key in current) { frames.push(current); current = {}; }
    current[key] = Number(value);
  }
  if (Object.keys(current).length) frames.push(current);
  return frames.map((f) => ({ avg: f.YAVG, high: f.YHIGH, max: f.YMAX }));
}

/**
 * Frames whose content is identical to the one before — i.e. the picture stalled.
 * mpdecimate drops them, so what it reports as dropped is what would read as stutter.
 */
export async function duplicateFrames(input) {
  const { stderr } = await run(FFMPEG, [
    '-hide_banner', '-loglevel', 'info', ...sourceArgs(input),
    '-vf', 'mpdecimate', '-an', '-f', 'null', '-',
  ], { maxBuffer: 1 << 28 });
  // mpdecimate drops frames that repeat the one before, so the shortfall between the
  // frames that went in and the frames that came out is the stutter.
  const kept = [...stderr.matchAll(/frame=\s*(\d+)/g)].pop();
  return kept ? Number(kept[1]) : null;
}

/** The longest run of consecutive near-identical frames, which is what reads as a freeze. */
export function longestStall(luma) {
  let best = 1, run = 1;
  for (let i = 1; i < luma.length; i++) {
    if (Math.abs(luma[i] - luma[i - 1]) < 0.02) { run += 1; best = Math.max(best, run); }
    else run = 1;
  }
  return best;
}

/**
 * The emptiness check: how much of the film is a screen with almost nothing on it.
 *
 * Sample at 5fps, shrink to 96x54 greyscale, and take each frame's standard deviation.
 * A composed frame — however dark — has structure and scores well above 6; a frame
 * caught in the gap between two pinned scenes is close to uniform and scores below it.
 * This is the measure the film is cut against: under 3% overall, and no run of 0.3s
 * or longer.
 */
export async function emptiness(input, { threshold = 6, fps = 5, w = 96, h = 54 } = {}) {
  const { stdout } = await run(FFMPEG, [
    '-hide_banner', '-loglevel', 'error', ...sourceArgs(input),
    '-vf', `fps=${fps},scale=${w}:${h},format=gray`, '-f', 'rawvideo', '-',
  ], { maxBuffer: 1 << 28, encoding: 'buffer' });

  const size = w * h;
  const count = Math.floor(stdout.length / size);
  const flags = [];
  for (let i = 0; i < count; i++) {
    const frame = stdout.subarray(i * size, (i + 1) * size);
    let sum = 0;
    for (const v of frame) sum += v;
    const mean = sum / size;
    let variance = 0;
    for (const v of frame) variance += (v - mean) ** 2;
    flags.push(Math.sqrt(variance / size) < threshold);
  }

  const runs = [];
  let start = 0;
  while (start < count) {
    let end = start;
    while (end < count && flags[end] === flags[start]) end += 1;
    if (flags[start]) runs.push({ at: start / fps, length: (end - start) / fps });
    start = end;
  }
  return {
    fraction: flags.filter(Boolean).length / count,
    runs: runs.filter((r) => r.length >= 0.3),
    samples: count,
  };
}

/** A frame with nothing on it: nine tenths of it is essentially pure black. */
const isEmpty = (f, highFloor) => f.high <= highFloor;

export async function report(input, { highFloor = 3 } = {}) {
  const frames = await lumaSeries(input);
  const avg = frames.map((f) => f.avg);
  const empty = frames.map((f, i) => [i, f]).filter(([, f]) => isEmpty(f, highFloor));
  const kept = await duplicateFrames(input);
  const blank = await emptiness(input);
  return {
    input,
    frames: frames.length,
    minAvg: Math.min(...avg),
    minHigh: Math.min(...frames.map((f) => f.high)),
    empty,
    kept,
    duplicates: kept === null ? null : frames.length - kept,
    stall: longestStall(avg),
    blank,
  };
}

// Guarded: process.argv[1] is undefined when these modules are imported rather than run.
const isMain = process.argv[1] && import.meta.url === `file://${resolve(process.argv[1])}`;
if (isMain) {
  for (const input of process.argv.slice(2)) {
    const r = await report(input);
    console.log(
      `${input}\n  ${r.frames} frames · YAVG min ${r.minAvg.toFixed(1)} · YHIGH min ${r.minHigh.toFixed(0)} · ` +
      `empty ${r.empty.length} · duplicates ${r.duplicates} · ` +
      `longest stall ${r.stall}f (${(r.stall / 30).toFixed(2)}s)`,
    );
    console.log(
      `  emptiness ${(r.blank.fraction * 100).toFixed(1)}% · runs >=0.3s: ${r.blank.runs.length}` +
      (r.blank.runs.length ? ` -> ${r.blank.runs.map((x) => `${x.at.toFixed(1)}s/${x.length.toFixed(1)}s`).join(' ')}` : ''),
    );
    if (r.empty.length) console.log('  black at:', r.empty.map(([i]) => i).join(', '));
  }
  process.exit(0);
}
