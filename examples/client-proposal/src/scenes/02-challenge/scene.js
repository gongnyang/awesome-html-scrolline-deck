let root = null;
const node = (tag, className, text = '') => {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
};
export default {
  id: '02-challenge',
  mount(section, ctx) {
    root = section.querySelector('.q') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = (copy.lines || []).slice(0, 4);
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('.q__title').textContent = copy.title || '';
    const answersHost = root.querySelector('[data-role="answers"]');
    answersHost.replaceChildren(...lines.map((line, index) => {
      const parts = String(line).split(':');
      const item = node('p', 'q__item');
      item.append(node('b', '', String(index + 1).padStart(2, '0')));
      item.append(node('span', '', parts.length > 1 ? parts.slice(1).join(':').trim() : line));
      return item;
    }));
  },
  build(tl, ctx) {
        // enter — 0 .. 0.30
        const items = [...root.querySelectorAll('.q__item')];
    tl.fromTo(root.querySelector('.q__stage'), { y: 32, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.18 }, 0);
    tl.fromTo(items, { x: 28, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.1, stagger: 0.04 }, 0.12);
    tl.to(root.querySelector('.q__title'), { scale: 1.03, duration: 0.1, yoyo: true, repeat: 1 }, 0.42);
    tl.to(root, { autoAlpha: 0, y: -24, duration: 0.16 }, 0.82);
    // hold — 0.30 .. 0.75
    // Keep the composed state readable while the presenter speaks.
    // exit — 0.75 .. 1.00
  },
  unmount() { root = null; },
};
