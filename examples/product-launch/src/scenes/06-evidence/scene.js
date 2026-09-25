let root = null;
export default {
  id: '06-evidence',
  mount(section, ctx) {
    root = section.querySelector('.target-board');
    const scene = ctx.data.scene || {};
    root.querySelector('[data-role="kicker"]').textContent = scene.copy?.kicker || '';
    root.querySelector('[data-role="title"]').textContent = scene.copy?.title || '';
    root.querySelector('[data-role="interpretation"]').textContent = (scene.copy?.lines || []).join(' ');
    root.querySelector('[data-role="caveat"]').textContent = scene.evidence || '';
    root.querySelector('[data-role="source"]').textContent = scene.source || '';
  },
  build(tl, ctx) {
    if (ctx?.reduced) return;
    tl.fromTo(root.querySelector('.target-board__head'), { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .12 }, 0);
    tl.fromTo(root.querySelector('.target-board__lead'), { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .14 }, .08);
    tl.fromTo(root.querySelector('.target-board__support'), { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .12 }, .18);
  },
  unmount() { root = null; },
};
