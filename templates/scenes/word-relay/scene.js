// word-relay — meaningful phrases accumulate until the full claim is visible.
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
    root.querySelector('[data-role="sequence"]').textContent = `주장 완성 · ${String(sequence.length).padStart(2, '0')}단계`;
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
    ctx.gsap.set(progress, { '--progress': 0 });
    const span = 0.48;
    const step = span / Math.max(1, words.length);

    // enter — 0 .. 0.30. Kicker settles, the first word arrives from the right.
    tl.fromTo(kicker, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12, ease: 'power2.out' }, 0);
    tl.fromTo(lines, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12, ease: 'power2.out' }, 0.16);

    // hold — each phrase stays in place; the completed assertion is the speaking hold.
    words.forEach((word, index) => {
      const at = 0.12 + index * step;
      tl.fromTo(word,
        { yPercent: 45, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: Math.min(.1, step * .8), ease: 'power3.out' }, at);
      tl.to(progress, { '--progress': (index + 1) / Math.max(1, words.length), duration: step * .7 }, at);
    });

    // exit — retain the complete claim through the speaking hold.
    tl.fromTo(reveal,
      { clipPath: 'inset(50% 50% 50% 50%)', autoAlpha: 0 },
      { clipPath: 'inset(0% 0% 0% 0%)', autoAlpha: 1, duration: 0.14, ease: 'power2.inOut' }, 0.8);
    tl.to(root, { autoAlpha: 0, duration: 0.12, ease: 'none' }, 0.86);
  },

  unmount() { root = null; },
};
