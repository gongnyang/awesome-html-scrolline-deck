// frame-scrub-video — the wheel is the play head; the lines land one by one.
let root = null;
let scrub = null;

export default {
  id: '{{id}}',

  mount(section, ctx) {
    root = section.querySelector('.fsv') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const assets = scene.assets || {};

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="lines"]').innerHTML = (copy.lines || [])
      .map((line, index) => `<li><b>${String(index + 1).padStart(2, '0')}</b><span>${line}</span></li>`)
      .join('');

    const host = root.querySelector('[data-role="scrub-host"]');
    if (assets.poster) host.style.backgroundImage = `url("${assets.poster}")`;
    if (assets.frames && typeof ctx.frameScrub === 'function') {
      scrub = ctx.frameScrub(host, {
        pattern: assets.frames,
        mobilePattern: assets.mobileFrames,
        count: assets.count,
        critical: assets.critical,
        poster: assets.poster,
        fit: 'cover',
      });
    }
  },

  build(tl) {
    const copy = root.querySelector('.fsv__copy');
    const lines = [...root.querySelectorAll('.fsv__lines li')];
    const film = { value: 0 };
    const step = lines.length > 1 ? 0.44 / (lines.length - 1) : 0;

    // enter — 0 .. 0.30. Copy settles; the first beat of the clip plays.
    tl.fromTo(copy, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1, ease: 'power2.out' }, 0);
    tl.to(film, {
      value: 1,
      duration: 0.98,
      ease: 'none',
      onUpdate: () => scrub && scrub.setProgress(film.value),
    }, 0);

    // hold — 0.30 .. 0.75. One line per beat of the clip.
    lines.forEach((line, index) => {
      tl.fromTo(line, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.09, ease: 'power2.out' }, 0.16 + index * step);
    });

    // exit — 0.75 .. 1.00. Only the copy leaves; the frame stays full-bleed.
    tl.to(copy, { y: -18, autoAlpha: 0, duration: 0.14, ease: 'power2.in' }, 0.82);
  },

  unmount() {
    if (scrub && typeof scrub.destroy === 'function') scrub.destroy();
    scrub = null;
    root = null;
  },
};
