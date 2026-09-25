let root = null;
const node = (tag, className, text = '') => { const el = document.createElement(tag); el.className = className; el.textContent = text; return el; };
export default {
  id: '07-quarters',
  mount(section, ctx) {
    root = section.querySelector('.t') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = (copy.lines || []).slice(0, 4);
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    const railHost = root.querySelector('[data-role="rail"]');
    railHost.replaceChildren(...lines.map((line, index) => {
      const parts = String(line).split(':');
      const event = node('article', 't__event');
      event.append(node('span', 't__date', parts[0] || String(index + 1).padStart(2, '0')));
      event.append(node('h3', '', parts[1] || line));
      event.append(node('p', '', parts.slice(2).join(':').trim()));
      return event;
    }));
  },
  build(tl, ctx) {
        // enter — 0 .. 0.30
        const events = [...root.querySelectorAll('.t__event')];
    tl.fromTo(events, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.13, stagger: 0.06 }, 0.06);
    tl.fromTo(root.querySelector('.t__rail'), { '--progress': 0 }, { '--progress': 1, duration: 0.25 }, 0);
    tl.to(root, { autoAlpha: 0, y: -24, duration: 0.16 }, 0.82);
    // hold — 0.30 .. 0.75
    // Keep the composed state readable while the presenter speaks.
    // exit — 0.75 .. 1.00
  },
  unmount() { root = null; },
};
