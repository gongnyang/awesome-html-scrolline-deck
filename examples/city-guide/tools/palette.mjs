/**
 * palette.mjs — the twilight palette, in one place.
 *
 * These literals are the JavaScript twin of `src/tokens.css`. Scene CSS never
 * names a colour (gate L1), but the drawings have to, so the two files are kept
 * in step by hand: change a token, change the entry with the same name here.
 */
export const P = {
  canvas: '#141026',
  deep: '#0b0817',
  surface1: '#1d1733',
  surface2: '#261d41',
  surface3: '#32264f',
  hairline: '#3c3059',
  ink: '#f7f1e8',
  inkMuted: '#cec2dc',
  inkSubtle: '#9c8eb2',
  teal: '#3fc7b4',
  tealHi: '#7ee8d6',
  tang: '#ff8a4c',
  tangHi: '#ffb184',
  amber: '#ffc06b',
};

/** The sky, sampled at dusk, at the blue hour and at night. */
export const SKY = [
  { at: 0.0, top: '#5d80b4', mid: '#e79f63', low: '#ffd7a4' },
  { at: 0.45, top: '#33386e', mid: '#9a5480', low: '#ff9257' },
  { at: 0.75, top: '#1a1538', mid: '#3c2456', low: '#8a3f62' },
  { at: 1.0, top: '#0b0817', mid: '#141026', low: '#2a1f45' },
];

export const clamp01 = (n) => Math.min(1, Math.max(0, n));
export const smooth = (n) => { const t = clamp01(n); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const pad = (n) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');

/** Mix two hex colours. */
export const mix = (a, b, t) => {
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  return `#${pad(lerp(r1, r2, t))}${pad(lerp(g1, g2, t))}${pad(lerp(b1, b2, t))}`;
};

/** Sample the SKY ramp at t, returning { top, mid, low }. */
export function skyAt(t) {
  const x = clamp01(t);
  let i = 0;
  while (i < SKY.length - 2 && x > SKY[i + 1].at) i += 1;
  const a = SKY[i];
  const b = SKY[i + 1];
  const k = (x - a.at) / (b.at - a.at);
  return { top: mix(a.top, b.top, k), mid: mix(a.mid, b.mid, k), low: mix(a.low, b.low, k) };
}

/** Deterministic PRNG — the drawings must be byte-identical on every machine. */
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const FONT_SERIF = "'Noto Serif KR','Noto Serif CJK KR',serif";
export const FONT_SANS = "'Pretendard Variable','Pretendard','Noto Sans CJK KR',sans-serif";
export const FONT_MONO = "'Noto Sans Mono CJK KR','Noto Sans Mono',monospace";
