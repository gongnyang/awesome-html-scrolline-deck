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
const wordNode = (word) => {
  const span = document.createElement('span');
  span.className = 'relay__word';
  span.textContent = word;
  return span;
};

export default {
  id: '{{id}}',

  mount(section, ctx) {
    root = section.querySelector('.relay') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    const sequence = parts(copy.title);
    const wordHost = root.querySelector('[data-role="words"]');
    wordHost.setAttribute('aria-label', copy.title || '');
    wordHost.replaceChildren(...sequence.map(wordNode));
    root.querySelector('[data-role="sequence"]').textContent = ctx.reduced
      ? `전체 · ${String(sequence.length).padStart(2, '0')}개`
      : `${String(1).padStart(2, '0')} / ${String(sequence.length).padStart(2, '0')}`;
    root.querySelector('[data-role="lines"]').replaceChildren(...(copy.lines || []).map((line) => {
      const p = document.createElement('p');
      p.textContent = line;
      return p;
    }));
  },

  build(tl, ctx) {
    const words = [...root.querySelectorAll('.relay__word')];
    const kicker = root.querySelector('.relay__kicker');
    const lines = root.querySelector('.relay__lines');
    const reveal = root.querySelector('.relay__reveal');
    const progress = root.querySelector('.relay__progress');
    const sequence = root.querySelector('[data-role="sequence"]');
    ctx.gsap.set(progress, { '--progress': 0 });
    const span = 0.56;
    const step = span / Math.max(1, words.length);

    // enter — 0 .. 0.30. Kicker settles, the first word arrives from the right.
    tl.fromTo(kicker, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12, ease: 'power2.out' }, 0);
    tl.fromTo(lines, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12, ease: 'power2.out' }, 0.16);

    // hold — 0.30 .. 0.75. Each word takes the stage, then hands it over.
    words.forEach((word, index) => {
      const at = 0.14 + index * step;
      const last = index === words.length - 1;
      tl.fromTo(word,
        { xPercent: 70, autoAlpha: 0 },
        { xPercent: 0, autoAlpha: 1, duration: step * 0.72, ease: 'power3.out' }, at);
      if (!last) {
        tl.to(word, { xPercent: -55, autoAlpha: 0, duration: step * 0.6, ease: 'power2.in' }, at + step * 0.85);
      }
      tl.call(() => { sequence.textContent = `${String(index + 1).padStart(2, '0')} / ${String(words.length).padStart(2, '0')}`; }, [], at);
      tl.to(progress, { '--progress': (index + 1) / Math.max(1, words.length), duration: step * 0.7 }, at);
    });
    if (words.length) tl.to(words[words.length - 1], { scale: 1.08, duration: 0.08, ease: 'power2.out' }, 0.68);

    // exit — 0.75 .. 1.00. A centre wipe closes over the last word.
    tl.fromTo(reveal,
      { clipPath: 'inset(50% 50% 50% 50%)', autoAlpha: 0 },
      { clipPath: 'inset(0% 0% 0% 0%)', autoAlpha: 1, duration: 0.14, ease: 'power2.inOut' }, 0.8);
    tl.to(root, { autoAlpha: 0, duration: 0.12, ease: 'none' }, 0.86);
  },

  unmount() { root = null; },
};
