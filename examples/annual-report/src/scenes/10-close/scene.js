let root = null;
const node = (tag, className, text = '') => { const el = document.createElement(tag); el.className = className; el.textContent = text; return el; };
export default {
  id: '10-close',
  mount(section, ctx) {
    root = section.querySelector('.o') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = (copy.lines || []).slice(0, 4);
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    const matrix = scene.assets?.matrix || {};
    const options = (matrix.options || lines.slice(0, 3).map(line => String(line).split(':')[0])).slice(0, 3);
    const criteriaLine = lines[3] || '';
    const criteria = (matrix.criteria || criteriaLine.split(':')[1]?.split(/[·,|]/).map(s => s.trim()).filter(Boolean) || ['기준 1', '기준 2']).slice(0, 3);
    const values = Array.isArray(matrix.values) ? matrix.values : [];
    const recommended = Number.isInteger(matrix.recommendedIndex) ? matrix.recommendedIndex : -1;
    const table = root.querySelector('.o__table');
    table.style.setProperty('--matrix-columns', String(options.length + 1));
    const cells = [node('div', 'o__cell o__head', '기준')];
    options.forEach((option, col) => {
      const head = node('div', `o__cell o__head${col === recommended ? ' o__cell--recommended' : ''}`, option);
      if (col === recommended) head.setAttribute('aria-label', `${option}, 추천안`);
      cells.push(head);
    });
    criteria.forEach((criterion, row) => {
      cells.push(node('div', 'o__cell o__criterion', criterion));
      options.forEach((_, col) => {
        const value = values[row]?.[col];
        cells.push(node('div', `o__cell${col === recommended ? ' o__cell--recommended' : ''}`, value == null ? '—' : String(value)));
      });
    });
    table.replaceChildren(...cells);
  },
  build(tl, ctx) {
        // enter — 0 .. 0.30
        const cells = [...root.querySelectorAll('.o__cell')];
    tl.fromTo(cells, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1, stagger: 0.012 }, 0.04);
    tl.fromTo(root.querySelector('.o__title'), { x: -20, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.13 }, 0);
    tl.to(root, { autoAlpha: 0, y: -20, duration: 0.16 }, 0.82);
    // hold — 0.30 .. 0.75
    // Keep the composed state readable while the presenter speaks.
    // exit — 0.75 .. 1.00
  },
  unmount() { root = null; },
};
