let root = null;
export default {
  id: '10-close',
  mount(section, ctx) {
    root = section.querySelector('.close') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    const fields = ['finding', 'findingNote', 'limit', 'limitNote', 'next', 'nextNote', 'source'];
    fields.forEach((key) => {
      const node = root.querySelector(`[data-role="${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}"]`);
      if (node) node.textContent = copy[key] || scene.source || '';
    });
  },
  build(tl) {
    const cards = [...root.querySelectorAll('.close__argument article')];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { tl.set(cards, { autoAlpha: 1, y: 0 }); return; }
    tl.fromTo(root.querySelector('.close__head'), { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12, ease: 'power2.out' }, 0);
    tl.fromTo(cards, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.11, stagger: 0.05, ease: 'power2.out' }, 0.16);
  },
  unmount() { root = null; },
};
