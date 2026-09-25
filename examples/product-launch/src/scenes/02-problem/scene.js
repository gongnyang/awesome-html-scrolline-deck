let root = null;

export default {
  id: '02-problem',
  mount(section, ctx) {
    root = section.querySelector('.noise') || section;
    const copy = ctx.data.scene?.copy || {};
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    const lines = copy.lines || [];
    root.querySelector('[data-role="frictions"]').replaceChildren(...lines.map((line, index) => {
      const at = String(line).indexOf(':');
      const li = document.createElement('li');
      li.className = 'noise__friction';
      const n = document.createElement('span');
      n.className = 'noise__num';
      n.textContent = String(index + 1).padStart(2, '0');
      const body = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = at >= 0 ? line.slice(0, at) : line;
      const detail = document.createElement('p');
      detail.textContent = at >= 0 ? line.slice(at + 1).trim() : '';
      body.append(title, detail);
      li.append(n, body);
      return li;
    }));
    root.querySelector('[data-role="wave"]').replaceChildren(...Array.from({ length: 68 }, (_, index) => {
      const bar = document.createElement('i');
      const envelope = .22 + .78 * Math.sin(Math.PI * index / 67);
      const oscillation = Math.abs(Math.sin(index * .63) * Math.cos(index * .19));
      bar.style.setProperty('--bar-height', `${Math.round(7 + 82 * envelope * oscillation)}%`);
      return bar;
    }));
  },
  build(tl) {
    const bars = [...root.querySelectorAll('.noise__wave i')];
    const rows = [...root.querySelectorAll('.noise__friction')];
    const activate = (index) => rows.forEach((row, i) => row.classList.toggle('is-active', i === index));
    tl.fromTo(root.querySelector('.noise__title'), { y: 35, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .17 }, 0);
    tl.fromTo(bars, { scaleY: .12, autoAlpha: 0 }, { scaleY: 1, autoAlpha: 1, duration: .16, stagger: .002 }, .04);
    tl.call(activate, [0], .12);
    tl.call(activate, [1], .38);
    tl.call(activate, [2], .63);
    // Keep the user problem statement visible as the next scene enters.
  },
  unmount() { root = null; },
};
