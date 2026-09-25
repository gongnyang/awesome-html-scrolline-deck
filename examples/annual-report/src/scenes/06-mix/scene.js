let root = null;
export default {
  id: '06-mix',
  mount(section, ctx) {
    root = section.querySelector('.b') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = (copy.lines || []).slice(0, 4);
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    const images = (scene.assets && scene.assets.images) || [];
    root.querySelector('.b__before img').src = images[0] || (scene.assets && scene.assets.poster) || '';
    root.querySelector('.b__after img').src = images[1] || '';
    root.querySelector('.b__before img').alt = (lines[0] || 'Before').split(':')[0];
    root.querySelector('.b__after img').alt = (lines[1] || 'After').split(':')[0];
    root.querySelector('.b__before .b__label').textContent = (lines[0] || '이전').split(':')[0];
    root.querySelector('.b__after .b__label').textContent = (lines[1] || '이후').split(':')[0];
  },
  build(tl, ctx) {
        // enter — 0 .. 0.30
        tl.fromTo(root.querySelector('.b__after'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.28, ease: 'power2.inOut' }, 0.04);
    tl.fromTo(root.querySelector('.b__label'), { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12, stagger: 0.04 }, 0.28);
    tl.fromTo(root.querySelector('.b__title'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, 0);
    tl.to(root, { autoAlpha: 0, scale: 0.98, duration: 0.16 }, 0.82);
    // hold — 0.30 .. 0.75
    // Keep the composed state readable while the presenter speaks.
    // exit — 0.75 .. 1.00
  },
  unmount() { root = null; },
};
