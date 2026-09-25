let root = null;
export default {
  id: '05-evidence',
  mount(section, ctx) {
    root = section.querySelector('.hold-demo');
    const scene = ctx.data.scene || {};
    root.querySelector('[data-role="kicker"]').textContent = scene.copy?.kicker || '';
    root.querySelector('[data-role="title"]').textContent = scene.copy?.title || '';
    root.querySelector('[data-role="source"]').textContent = scene.source || '';
    root.querySelector('[data-role="phases"]').replaceChildren(...(scene.assets?.phases || []).map((text, i) => {
      const el = document.createElement('div');
      el.className = 'hold-demo__phase';
      el.innerHTML = `<b>0${i + 1}</b><span>${text}</span>`;
      return el;
    }));
  },
  build(tl, ctx) {
    if (ctx?.reduced) return;
    const phases = [...root.querySelectorAll('.hold-demo__phase')];
    tl.fromTo(root.querySelector('.hold-demo__head'), { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .12 }, 0);
    tl.fromTo(root.querySelector('.hold-demo__screen'), { scale: .98, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .16 }, .08);
    tl.fromTo(phases, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: .04, duration: .1 }, .18);
    // Keep the claim, on-screen evidence, presenter phases and source through the exit.
  },
  unmount() { root = null; },
};
