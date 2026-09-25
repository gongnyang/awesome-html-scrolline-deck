let root = null;
const node = (tag, className, text = '') => { const el = document.createElement(tag); el.className = className; el.textContent = text; return el; };
export default {
  id: '04-system',
  mount(section, ctx) {
    root = section.querySelector('.m') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = (copy.lines || []).slice(0, 4);
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('.m__hub').textContent = '중심';
    root.querySelector('.m__nodes').replaceChildren(...lines.map((line, index) => {
      const item = node('div', 'm__node');
      item.setAttribute('data-node', String(index));
      item.append(node('b', '', String(index + 1).padStart(2, '0')));
      item.append(node('span', '', String(line).split(':')[0]));
      return item;
    }));
  },
  build(tl, ctx) {
        // enter — 0 .. 0.30
        const nodes = [...root.querySelectorAll('.m__node')];
    tl.fromTo(root.querySelector('.m__hub'), { scale: 0.7, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.18 }, 0.04);
    tl.fromTo(nodes, { scale: 0.8, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.12, stagger: 0.05 }, 0.15);
    tl.to(root, { scale: 0.99, duration: 0.16 }, 0.82);
    // hold — 0.30 .. 0.75
    // Keep the composed state readable while the presenter speaks.
    // exit — 0.75 .. 1.00
  },
  unmount() { root = null; },
};
