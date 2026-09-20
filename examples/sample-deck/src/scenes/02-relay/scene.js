// word-relay — copy.title is split on an arrow (or on spaces) and the parts
// hand off to each other across the stage. Author edits belong in the blocks.
let root = null;

const SPLIT = /\s*(?:->|=>|→|\/|\|)\s*/;

const parts = (title) => {
  const text = String(title || '').trim();
  if (!text) return [];
  const split = text.split(SPLIT).filter(Boolean);
  return split.length > 1 ? split : text.split(/\s+/).filter(Boolean);
};

export default {
  id: '02-relay',

  mount(section, ctx) {
    root = section.querySelector('.relay') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="words"]').innerHTML = parts(copy.title)
      .map((word) => `<span class="relay__word">${word}</span>`)
      .join('');
    root.querySelector('[data-role="lines"]').innerHTML = (copy.lines || [])
      .map((line) => `<p>${line}</p>`)
      .join('');
  },

  build(tl) {
    const words = [...root.querySelectorAll('.relay__word')];
    const kicker = root.querySelector('.relay__kicker');
    const lines = root.querySelector('.relay__lines');
    const reveal = root.querySelector('.relay__reveal');
    const span = 0.7;
    const step = span / Math.max(1, words.length);

    // enter — 0 .. 0.30. Kicker settles, the first word arrives from the right.
    tl.fromTo(kicker, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12, ease: 'power2.out' }, 0);
    tl.fromTo(lines, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12, ease: 'power2.out' }, 0.16);

    // hold — 0.30 .. 0.75. Each word takes the stage, then hands it over.
    words.forEach((word, index) => {
      const at = index * step;
      const last = index === words.length - 1;
      tl.fromTo(word,
        { xPercent: 70, autoAlpha: 0 },
        { xPercent: 0, autoAlpha: 1, duration: step * 0.72, ease: 'power3.out' }, at);
      if (!last) {
        tl.to(word, { xPercent: -55, autoAlpha: 0, duration: step * 0.6, ease: 'power2.in' }, at + step * 0.85);
      }
    });
    if (words.length) tl.to(words[words.length - 1], { scale: 1.1, duration: 0.08, ease: 'power2.out' }, 0.66);

    // exit — 0.75 .. 1.00. A centre wipe closes over the last word.
    tl.fromTo(reveal,
      { clipPath: 'inset(50% 50% 50% 50%)', autoAlpha: 0 },
      { clipPath: 'inset(0% 0% 0% 0%)', autoAlpha: 1, duration: 0.14, ease: 'power2.inOut' }, 0.8);
    tl.to(root, { autoAlpha: 0, duration: 0.12, ease: 'none' }, 0.86);
  },

  unmount() { root = null; },
};
