/**
 * shots.mjs — the edit, as data.
 *
 * Everything the demo film is made of lives here: which decks are recorded, which
 * scenes are visited, how fast the wheel crosses each one, how long it rests on the
 * composed frame, and how the segments are cut together. record.mjs and build.mjs read
 * this file and hold no editorial decisions of their own — change the film here.
 */
import { resolve } from 'node:path';

export const REPO = resolve(new URL('../..', import.meta.url).pathname);
export const FPS = 30;
export const VIEWPORT = { width: 1920, height: 1080 };

const example = (name) => `${REPO}/examples/${name}`;

/** The four gate-verified example decks, each on its own origin (deck assets use absolute paths). */
export const DECKS = [
  { name: 'sample-deck',    dist: `${example('sample-deck')}/dist`,    port: 5321 },
  { name: 'product-launch', dist: `${example('product-launch')}/dist`, port: 5322 },
  { name: 'annual-report',  dist: `${example('annual-report')}/dist`,  port: 5323 },
  { name: 'city-guide',     dist: `${example('city-guide')}/dist`,     port: 5324 },
];

export const deckByName = (name) => DECKS.find((d) => d.name === name);

/* ------------------------------------------------------------------ *
 * The wheel programme
 *
 * A deck is not scrolled end to end. Scrolling through a deck means scrolling through
 * the gaps between its pinned scenes, and a gap is an empty screen: measured on the
 * first cut, 11% of the film was a frame with almost nothing on it, in ten runs of
 * half a second. A trailer cannot afford that.
 *
 * So each deck is a list of visits instead. A visit jumps straight to a scene — the
 * jump itself is never captured — ramps across the composed part of its pin, rests on
 * the 55% frame, then ramps out and cuts. The gaps are never filmed.
 *
 * The windows come from the gate's own QA captures, which shoot every scene at 30%,
 * 55% and 85% of its pin. Measured the way the emptiness check measures (96x54 grey,
 * standard deviation), every scene clears the threshold comfortably at 30% and 55%.
 * A few thin out by 85%, and those carry an explicit `exit`.
 * ------------------------------------------------------------------ */

/**
 * One scene visit. Progress is measured through that scene's pin.
 * The defaults are the window every scene is known to be composed in.
 */
const visit = (scene, opts = {}) => ({
  scene,
  enter: opts.enter ?? 0.30,
  hold: opts.hold ?? 0.55,
  exit: opts.exit ?? 0.78,
});

export const PASSES = {
  // The skill's own deck, given the most room to breathe.
  'sample-deck': {
    tempo: { in: 12, dwell: 52, out: 10 },
    visits: [
      visit(0),                  // 01-hero — the frame-scrub opener
      visit(1),                  // 02-relay — 장면 진행률 한 칸
      visit(2, { exit: 0.74 }),  // 03-arc — 진입 · 홀드 · 퇴장 (thins out by 85%)
      visit(4),                  // 05-numbers — 네 숫자로 요약된다
      visit(5),                  // 06-closing — the QR
    ],
  },

  // The light deck, and the briskest tempo in the film.
  'product-launch': {
    tempo: { in: 10, dwell: 44, out: 9 },
    visits: [
      visit(0),  // 01-open — 우리가 지운 세 가지
      visit(1),  // 02-turn — the headphone rotation
      visit(3),  // 04-features — 뜯어 보면 네 층
      visit(5),  // 06-specs — 네 숫자로 끝낸다
      visit(6),  // 07-close
    ],
  },

  // The data deck. Longest dwell, because the charts have to be read.
  'annual-report': {
    tempo: { in: 13, dwell: 56, out: 11 },
    visits: [
      visit(1),  // 02-anatomy — 여덟 분기를 한 장으로
      visit(2),  // 03-numbers
      visit(3),  // 04-stack — the fanned reports
      visit(4),  // 05-shift — 세 갈래로 나뉘었다
      visit(5),  // 06-close
    ],
  },

  // The atmospheric one.
  'city-guide': {
    tempo: { in: 12, dwell: 48, out: 10 },
    visits: [
      visit(0),                  // 01-hero — the sunset skyline
      visit(1),                  // 02-route — the walking route
      visit(2, { exit: 0.70 }),  // 03-postcards — thins out by 85%
      visit(3, { exit: 0.70 }),  // 04-drift — the night cityscape, same
      visit(4),                  // 05-guide — 안내는 사람이 한다
    ],
  },
};

/**
 * The presenter beat: no wheel at all. Park on a scene, press ArrowRight to show the
 * deck landing itself in the next one, then N for the speaker notes.
 *
 * Only one ArrowRight, deliberately. A key jump glides across the gap between two
 * pinned sections and for a moment there is nothing on screen but the progress bar.
 * One jump, framed by two composed holds, is the most the beat can carry.
 *
 * Short, too, because this is the one segment where the capture cannot hold real time:
 * a screenshot costs about 45ms, so a one-second glide lands in roughly seven captured
 * frames however many are budgeted, and the rest would be a frozen picture.
 */
export const PRESENTER = {
  deck: 'sample-deck',
  start: { scene: 4, progress: 0.55 },
  frames: 70,
  keys: [
    { frame: 12, key: 'ArrowRight', badge: '→' },
    { frame: 39, key: 'n', badge: 'N' },
  ],
};

/**
 * The three title cards, captured frame by frame through window.__seek().
 * Their reveals are front-loaded: a card has to carry real contrast within about a
 * fifth of a second, or the emptiness check counts its opening as dead screen.
 */
export const CARDS = {
  open: { file: 'open.html', frames: 105 },
  what: { file: 'what.html', frames: 95 },
  end:  { file: 'end.html',  frames: 100 },
};

/**
 * The cut. `source` names a captured frame directory; `xfadeIn` is how this segment
 * arrives from the one before it (the first segment has none).
 *
 * No `fadeblack`: a transition through black is an empty screen by construction. Every
 * cut here dissolves or slides between two composed frames, and none runs long enough
 * for the emptiness check to sample it twice.
 */
export const EDIT = [
  { source: 'card-open',      xfadeIn: null },
  { source: 'sample-deck',    xfadeIn: { transition: 'fade',      duration: 0.25 } },
  { source: 'product-launch', xfadeIn: { transition: 'slideleft', duration: 0.18 } },
  { source: 'card-what',      xfadeIn: { transition: 'fade',      duration: 0.20 } },
  { source: 'presenter',      xfadeIn: { transition: 'fade',      duration: 0.20 } },
  { source: 'annual-report',  xfadeIn: { transition: 'wipeup',    duration: 0.18 } },
  { source: 'city-guide',     xfadeIn: { transition: 'slideleft', duration: 0.18 } },
  { source: 'card-end',       xfadeIn: { transition: 'fade',      duration: 0.30 } },
];

/* ------------------------------------------------------------------ *
 * Turning a pass into frames
 * ------------------------------------------------------------------ */

const clamp01 = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t);
/** Ease in and out — arrives at the hold already settled. */
const smoothstep = (t) => { const s = clamp01(t); return s * s * (3 - 2 * s); };
/** Accelerating — the exit ramp leaves at speed, so the cut lands on movement. */
const easeIn = (t) => { const s = clamp01(t); return s * s; };

/**
 * Expand one deck's visits into the frames to capture.
 *
 * Returns a flat list; each entry is either a jump (position the page, capture
 * nothing) or a frame to shoot at a given scroll position.
 *
 * @param {{tempo: {in: number, dwell: number, out: number}, visits: object[]}} pass
 * @param {(scene: number, progress: number) => number} toPixels
 */
export function planPass(pass, toPixels) {
  const { tempo, visits } = pass;
  const steps = [];

  for (const v of visits) {
    const enter = toPixels(v.scene, v.enter);
    const hold = toPixels(v.scene, v.hold);
    const exit = toPixels(v.scene, v.exit);

    steps.push({ jump: enter });
    for (let f = 1; f <= tempo.in; f++) {
      steps.push({ at: enter + (hold - enter) * smoothstep(f / tempo.in) });
    }
    for (let f = 0; f < tempo.dwell; f++) steps.push({ at: hold });
    for (let f = 1; f <= tempo.out; f++) {
      steps.push({ at: hold + (exit - hold) * easeIn(f / tempo.out) });
    }
  }
  return steps;
}

/** Frame count for a pass, without needing a browser. */
export function passFrames(pass) {
  const { tempo, visits } = pass;
  return visits.length * (tempo.in + tempo.dwell + tempo.out);
}

/**
 * Where each pass rests, as frame ranges — what build.mjs pushes in on so a settled
 * scene is not also a frozen frame.
 */
export function passHolds(pass) {
  const { tempo, visits } = pass;
  const holds = [];
  let cursor = 0;
  for (let i = 0; i < visits.length; i++) {
    holds.push({ start: cursor + tempo.in, end: cursor + tempo.in + tempo.dwell - 1, amount: 0.055 });
    cursor += tempo.in + tempo.dwell + tempo.out;
  }
  return holds;
}
