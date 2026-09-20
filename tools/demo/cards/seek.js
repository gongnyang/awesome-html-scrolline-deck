/**
 * seek.js — the deterministic clock the title cards run on.
 *
 * The cards are captured one frame at a time, so they must never animate on their
 * own: nothing here reads the wall clock or requestAnimationFrame. record.mjs calls
 * window.__seek(p) with p from 0 to 1 and screenshots whatever that paints, which
 * makes every card frame reproducible.
 */
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Smoothstep with a slight overshoot-free ease-out bias — reads as "settled", not "sprung". */
function ease(t) {
  const s = clamp01(t);
  return 1 - Math.pow(1 - s, 3);
}

/** Progress of `p` through the window [a, b]. */
export function win(p, a, b) {
  return ease((p - a) / (b - a));
}

/** Split an element's text into per-character spans so it can be revealed letter by letter. */
export function letters(el) {
  const text = el.textContent;
  el.textContent = '';
  return [...text].map((c) => {
    const span = document.createElement('span');
    span.className = 'ch';
    span.textContent = c;
    el.appendChild(span);
    return span;
  });
}

/** opacity + a small rise, the house move for every card element. */
export function rise(el, t, distance = 26) {
  el.style.opacity = String(t);
  el.style.transform = `translateY(${((1 - t) * distance).toFixed(2)}px)`;
}

/**
 * Register a card. `paint(p)` must be a pure function of p.
 * Exposes window.__seek and paints frame 0 immediately.
 */
export function card(paint) {
  window.__seek = (p) => paint(clamp01(Number(p)));
  window.__ready = true;
  window.__seek(0);
}
