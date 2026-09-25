let root = null;
const node = (tag, className, text = '') => { const el = document.createElement(tag); el.className = className; el.textContent = text; return el; };
export default {
  id: '10-close',
  mount(section, ctx) {
    root = section.querySelector('.r') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = (copy.lines || []).slice(0, 4);
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('.r__route').innerHTML = '<path d="M10 82 C30 82 25 25 50 40 S72 68 92 28" pathLength="1" fill="none" stroke="currentColor" stroke-width=".8" stroke-dasharray="1" stroke-dashoffset="1" vector-effect="non-scaling-stroke"/>';
    root.querySelector('.r__stops').replaceChildren(...lines.slice(0, 3).map((line, index) => {
      const stop = node('div', 'r__stop');
      stop.append(node('span', 'r__pin', String(index + 1)));
      stop.append(node('span', '', String(line).split(':')[0]));
      return stop;
    }));
  },
  build(tl, ctx) {
        // enter — 0 .. 0.30
        const stops = [...root.querySelectorAll('.r__stop')];
    tl.fromTo(root.querySelector('.r__route path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.28 }, 0.04);
    tl.fromTo(stops, { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12, stagger: 0.08 }, 0.2);
    tl.fromTo(root.querySelector('.r__title'), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12 }, 0);
    tl.to(root, { autoAlpha: 0, duration: 0.16 }, 0.82);
    // hold — 0.30 .. 0.75
    // Keep the composed state readable while the presenter speaks.
    // exit — 0.75 .. 1.00
  },
  unmount() { root = null; },
};
