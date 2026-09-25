let root = null;
const node = (tag, className, text = '') => { const el = document.createElement(tag); el.className = className; el.textContent = text; return el; };
export default {
  id: '06-route-proof',
  mount(section, ctx) {
    root = section.querySelector('.p') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = (copy.lines || []).slice(0, 4);
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    const routeHost = root.querySelector('[data-role="route"]');
    routeHost.style.setProperty('--stops', String(Math.max(1, lines.length)));
    routeHost.replaceChildren(...lines.map((line, index) => {
      const parts = String(line).split(':');
      const stop = node('div', 'p__stop');
      stop.append(node('span', 'p__index', String(index + 1).padStart(2, '0')));
      stop.append(node('h3', '', parts[0] || line));
      stop.append(node('p', '', parts.slice(1).join(':').trim()));
      return stop;
    }));
  },
  build(tl, ctx) {
        // enter — 0 .. 0.30
        const stops = [...root.querySelectorAll('.p__stop')];
    // The route facts stay readable as this scene enters. Motion adds a small
    // positional cue; it must not hide the evidence at the previous boundary.
    tl.fromTo(stops, { y: 18 }, { y: 0, duration: 0.12, stagger: 0.06 }, 0.04);
    tl.fromTo(root.querySelector('.p__route'), { '--route': 0 }, { '--route': 1, duration: 0.22 }, 0.05);
    // hold — 0.30 .. 0.75
    // Keep the composed state readable while the presenter speaks.
    // exit — 0.75 .. 1.00
  },
  unmount() { root = null; },
};
