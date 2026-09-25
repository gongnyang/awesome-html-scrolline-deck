let root = null;
export default {
  id: '{{id}}',
  mount(section, ctx) {
    root = section.querySelector('.d') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = (copy.lines || []).slice(0, 4);
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    const images = (scene.assets && scene.assets.images) || [];
    root.querySelector('.d__image').src = images[0] || (scene.assets && scene.assets.poster) || '';
    root.querySelector('.d__image').alt = copy.title || '근거 자료';
    root.querySelector('.d__quote').textContent = lines[0] || copy.title || '';
    const source = root.querySelector('.d__source');
    source.textContent = lines[1] || scene.source || '';
    source.hidden = !source.textContent;
  },
  build(tl, ctx) {
        // enter — 0 .. 0.30
        tl.fromTo(root.querySelector('.d__paper'), { y: 44, rotation: -5, autoAlpha: 0 }, { y: 0, rotation: -1, autoAlpha: 1, duration: 0.2 }, 0.02);
    tl.fromTo(root.querySelector('.d__source'), { x: 24, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.14 }, 0.22);
    tl.to(root, { autoAlpha: 0, y: -20, duration: 0.16 }, 0.83);
    // hold — 0.30 .. 0.75
    // Keep the composed state readable while the presenter speaks.
    // exit — 0.75 .. 1.00
  },
  unmount() { root = null; },
};
