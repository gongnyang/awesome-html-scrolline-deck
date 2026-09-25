// frame-scrub-hero — the opening frame sequence scrubs while the title stands.
// Author edits belong inside the // enter, // hold and // exit blocks of build().
let root = null;
let scrub = null;

const titleNodes = (text) => String(text).split(/(\s+)/).filter(Boolean).map((word) => {
  const span = document.createElement('span');
  span.textContent = /^\s+$/.test(word) ? '\u00a0' : word;
  return span;
});

export default {
  id: '{{id}}',

  mount(section, ctx) {
    root = section.querySelector('.hero') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const assets = scene.assets || {};
    const lines = copy.lines || [];

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    const title = root.querySelector('[data-role="title"]');
    title.setAttribute('aria-label', copy.title || '');
    title.replaceChildren(...titleNodes(copy.title || ''));
    root.querySelector('[data-role="line"]').textContent = lines[0] || '';
    root.querySelector('[data-role="meta"]').textContent = lines[1] || '';

    // A poster is a complete still frame and must go through the same canvas
    // path as a sequence so poster-only decks never expose an empty black host.
    if ((assets.frames || assets.poster) && typeof ctx.frameScrub === 'function') {
      scrub = ctx.frameScrub(root.querySelector('[data-role="scrub-host"]'), {
        pattern: assets.frames,
        mobilePattern: assets.mobileFrames,
        count: assets.count,
        critical: assets.critical,
        poster: assets.poster,
        fit: ctx.mobile ? 'contain-top' : 'cover',
      });
    }
  },

  build(tl, ctx) {
    const media = root.querySelector('.hero__media');
    const copy = root.querySelector('.hero__copy');
    const veil = root.querySelector('.hero__veil');
    const titleWords = root.querySelectorAll('.hero__title span');
    const film = { value: 0 };

    // enter — 0 .. 0.30. The copy is legible at frame 0, so it only settles.
    tl.fromTo(media, { scale: 1.04 }, { scale: 1, duration: 0.2, ease: 'power2.out' }, 0);
    if (!ctx.mobile) {
      tl.fromTo(titleWords,
        { yPercent: 14, autoAlpha: 1 },
        { yPercent: 0, autoAlpha: 1, duration: 0.14, stagger: 0.02, ease: 'power3.out' }, 0.04);
      tl.fromTo(copy.querySelectorAll('.hero__kicker, .hero__line, .hero__meta'),
        { y: 10, autoAlpha: 1 },
        { y: 0, autoAlpha: 1, duration: 0.12, stagger: 0.03, ease: 'power2.out' }, 0.1);
    }

    // hold — 0.30 .. 0.75. The film advances under a still title.
    tl.to(film, {
      value: 1,
      duration: 0.98,
      ease: 'none',
      onUpdate: () => scrub && scrub.setProgress(film.value),
    }, 0);

    // exit — 0.75 .. 1.00. Push into the frame and wash out.
    tl.to(media, { scale: 1.09, duration: 0.18, ease: 'power2.in' }, 0.8);
    tl.to(copy, { scale: 1.06, autoAlpha: 0, duration: 0.18, ease: 'power2.in' }, 0.8);
    tl.to(veil, { autoAlpha: 1, duration: 0.16 }, 0.82);
  },

  unmount() {
    if (scrub && typeof scrub.destroy === 'function') scrub.destroy();
    scrub = null;
    root = null;
  },
};
