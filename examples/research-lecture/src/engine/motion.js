/**
 * motion.js — device capability and accessibility probes.
 * Every scene module reads its quality tier from here instead of sniffing on its own.
 * No bundler APIs: this file runs as-is in any ESM environment.
 */

/** Has the viewer asked for reduced motion? */
export function reduced() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Narrow screen or coarse pointer. */
export function isMobile() {
  if (typeof matchMedia !== 'function') return false;
  return matchMedia('(max-width: 767px)').matches || matchMedia('(pointer: coarse)').matches;
}

/** A precise pointer exists (gate for hover and pointer parallax). */
export function hasFinePointer() {
  return typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches;
}

let _tier = null;

/**
 * GPU / device class -> 'low' | 'mid' | 'high'. Combines DPR, cores, memory and the
 * WebGL renderer string, then caches the verdict for the rest of the session.
 */
export function gpuTier() {
  if (_tier) return _tier;
  if (typeof navigator === 'undefined' || typeof document === 'undefined') return 'mid';

  const cores = navigator.hardwareConcurrency || 4;
  const dpr = window.devicePixelRatio || 1;
  const mem = navigator.deviceMemory || 4;
  let renderer = '';

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) { _tier = 'low'; return _tier; }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
  } catch {
    _tier = 'low';
    return _tier;
  }

  const r = renderer.toLowerCase();
  if (/swiftshader|llvmpipe|software|basic render|microsoft basic/.test(r)) { _tier = 'low'; return _tier; }
  if (/intel/.test(r) && !/arc|iris xe/.test(r)) { _tier = 'low'; return _tier; }

  if (isMobile() || cores <= 4 || mem <= 4) { _tier = 'mid'; return _tier; }
  if (/apple m\d|rtx|radeon rx|geforce|arc a/.test(r) && cores >= 8 && dpr <= 3) { _tier = 'high'; return _tier; }

  _tier = cores >= 8 ? 'high' : 'mid';
  return _tier;
}

/** Force the verdict (debug flags, URL parameters, tests). */
export function setTier(tier) {
  if (['low', 'mid', 'high'].includes(tier)) _tier = tier;
}

/**
 * fpsProbe — counts real frames for `seconds`, then reports the average.
 * Below 30fps it drops one tier and reports `downgrade: true`.
 * @returns {() => void} cancel function
 */
export function fpsProbe(seconds = 2, onResult = () => {}) {
  if (reduced()) { onResult({ fps: 60, tier: gpuTier(), downgrade: false }); return () => {}; }

  let frames = 0;
  let raf = 0;
  let stopped = false;
  const t0 = performance.now();

  const tick = () => {
    if (stopped) return;
    frames += 1;
    const elapsed = performance.now() - t0;
    if (elapsed >= seconds * 1000) {
      const fps = Math.round((frames / elapsed) * 1000);
      const current = gpuTier();
      const downgrade = fps < 30;
      const next = downgrade ? (current === 'high' ? 'mid' : 'low') : current;
      if (downgrade) setTier(next);
      onResult({ fps, tier: next, downgrade });
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return () => { stopped = true; cancelAnimationFrame(raf); };
}

/** 0..1 range helpers — scene modules use these to slice scrub progress. */
export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const smoothstep = (edge0, edge1, x) => {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1));
  return t * t * (3 - 2 * t);
};
