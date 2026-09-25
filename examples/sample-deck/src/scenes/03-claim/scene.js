let root = null;
export default {
  id: '03-claim',
  mount(section, ctx) {
    root = section.querySelector('.kt');
    const copy = ctx.data.scene?.copy || {};
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
  },
  build(tl, ctx) {
    if (ctx?.reduced) return;
    tl.fromTo(root.querySelector('.kt__head-copy'), { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .14 }, 0);
    tl.fromTo(root.querySelector('.kt__case'), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .16 }, .12);
  },
  unmount() { root = null; },
};
