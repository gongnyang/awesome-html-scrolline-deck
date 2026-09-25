let root = null;
const node = (tag, className, text = '') => { const el = document.createElement(tag); el.className = className; el.textContent = text; return el; };
export default {
  id: '09-packing',
  mount(section, ctx) {
    root = section.querySelector('.s') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = (copy.lines || []).slice(0, 4);
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    const stepsHost = root.querySelector('[data-role="steps"]');
    stepsHost.replaceChildren(...lines.map((line, index) => {
      const parts = String(line).split(':');
      const step = node('article', 's__step');
      step.append(node('span', 's__num', String(index + 1).padStart(2, '0')));
      step.append(node('h3', '', parts[0] || line));
      step.append(node('p', '', parts.slice(1).join(':').trim()));
      return step;
    }));
  },
  build(tl, ctx) {
        // enter — 0 .. 0.30
        const cards = [...root.querySelectorAll('.s__step')];
    tl.fromTo(cards, { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.14, stagger: 0.055 }, 0.04);
    tl.fromTo(root.querySelector('.s__steps'), { '--flow': 0 }, { '--flow': 1, duration: 0.24 }, 0);
    tl.to(root, { autoAlpha: 0, x: 24, duration: 0.16 }, 0.82);
    // hold — 0.30 .. 0.75
    // Keep the composed state readable while the presenter speaks.
    // exit — 0.75 .. 1.00
  },
  unmount() { root = null; },
};
