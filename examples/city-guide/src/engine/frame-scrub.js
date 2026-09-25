/**
 * frame-scrub.js — paints an image sequence onto a canvas at a given progress.
 * Under reduced motion (and on mobile without a mobile sequence) a still is drawn.
 */
import { isMobile, reduced } from './motion.js';

const mediaFallback = new URL('./media-fallback.svg', import.meta.url).href;

const framePath = (pattern, n) =>
  String(pattern).replace(/%0(\d)d/, (_, w) => String(n).padStart(Number(w), '0'));

/**
 * @param {HTMLElement} host element the canvas is appended to
 * @param {{pattern: string, count: number, critical?: number[], poster?: string,
 *          fit?: 'cover'|'contain-top'|'contain', mobilePattern?: string}} opts
 *        pattern example: '/frames/hero/f_%03d.jpg' -> f_001.jpg … f_NNN.jpg
 * @returns {{ canvas: HTMLCanvasElement, setProgress(p: number): void, destroy(): void }}
 */
export function createFrameScrub(host, opts = {}) {
  const { pattern, count = 0, critical = [], poster, fit = 'cover', mobilePattern } = opts;

  const canvas = document.createElement('canvas');
  canvas.className = 'frame-scrub';
  host.appendChild(canvas);
  const ctx2d = canvas.getContext('2d', { alpha: false });

  const mobile = isMobile();
  const activePattern = mobile && mobilePattern ? mobilePattern : pattern;
  // Still-only mode: reduced motion, no sequence at all, or mobile without a light sequence.
  const lite = reduced() || !activePattern || count < 2 || (mobile && !mobilePattern);
  const total = lite ? 1 : count;
  const frames = new Array(total);
  let current = -1;

  const load = (i) => {
    if (frames[i]) return frames[i];
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { if (i === current) draw(img); };
    img.onerror = () => {
      console.error(`[scrolline] frame failed to load: ${img.src}`);
      if (i === current) {
        const still = new Image();
        still.onload = () => draw(still);
        still.onerror = () => { if (still.src !== mediaFallback) still.src = mediaFallback; };
        still.src = !lite && poster ? poster : mediaFallback;
      }
    };
    img.src = lite ? (poster || (activePattern && count > 0 ? framePath(activePattern, 1) : mediaFallback))
      : framePath(activePattern, i + 1);
    frames[i] = img;
    return img;
  };

  /** cover by default; a tall mobile hero is drawn top-aligned contain. */
  function draw(img) {
    if (!img?.naturalWidth || !ctx2d) return;
    const { width: w, height: h } = canvas;
    const scale = fit === 'cover'
      ? Math.max(w / img.naturalWidth, h / img.naturalHeight)
      : Math.min(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx2d.fillStyle = getComputedStyle(host).backgroundColor || '#000';
    ctx2d.fillRect(0, 0, w, h);
    ctx2d.drawImage(img, (w - dw) / 2, fit === 'contain-top' ? 0 : (h - dh) / 2, dw, dh);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = host.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    if (current >= 0) draw(frames[current]);
  }

  function setProgress(p) {
    const value = Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
    const i = Math.min(total - 1, Math.max(0, Math.round(value * (total - 1))));
    if (i === current) return;
    current = i;
    draw(load(i));
    if (!lite) { load(Math.min(total - 1, i + 1)); load(Math.max(0, i - 1)); }
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  setProgress(0);

  // Guarantee the frames the opening needs, then backfill the rest off the input path.
  if (!lite) {
    [...new Set(critical.map((n) => n - 1).filter((i) => i >= 0 && i < total))].forEach(load);
    const idle = window.requestIdleCallback ?? ((fn) => window.setTimeout(fn, 160));
    idle(() => { for (let i = 0; i < total; i += 1) load(i); });
  }

  return {
    canvas,
    setProgress,
    destroy() { window.removeEventListener('resize', resize); canvas.remove(); },
  };
}
