let root = null;
export default {
  id: '{{id}}',
  mount(section, ctx) {
    root = section.querySelector('.c') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = (copy.lines || []).slice(0, 4);
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('.c__number').textContent = (copy.kicker || '01').match(/\d+/)?.[0] || '01';
    root.querySelector('.c__eyebrow').textContent = copy.kicker || '';
  },
  build(tl, ctx) {
        // enter — 0 .. 0.30
        tl.fromTo(root.querySelector('.c__number'), { scale: 1.8, autoAlpha: 0, rotation: -8 }, { scale: 1, autoAlpha: 1, rotation: 0, duration: 0.2, ease: 'power3.out' }, 0);
    tl.fromTo(root.querySelector('.c__title'), { x: 60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.18 }, 0.12);
    tl.to(root, { autoAlpha: 0, scale: 0.96, duration: 0.16 }, 0.82);
    // hold — 0.30 .. 0.75
    // Keep the composed state readable while the presenter speaks.
    // exit — 0.75 .. 1.00
  },
  unmount() { root = null; },
};
