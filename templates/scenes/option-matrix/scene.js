let root = null;
const el = (tag, cls, text = '') => { const n = document.createElement(tag); n.className = cls; n.textContent = text; return n; };

export default {
  id: '{{id}}',
  mount(section, ctx) {
    root = section.querySelector('.o') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const matrix = scene.assets?.matrix || {};
    const options = (matrix.options || []).slice(0, 3);
    const criteria = (matrix.criteria || []).slice(0, 4);
    const values = Array.isArray(matrix.values) ? matrix.values : [];
    const recommended = Number.isInteger(matrix.recommendedIndex) ? matrix.recommendedIndex : -1;
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="recommend"]').textContent = recommended >= 0 && options[recommended]
      ? `${options[recommended]} · 추천안` : '세 안을 기준에 따라 비교하세요';
    const stage = root.querySelector('[data-role="stage"]');
    const panels = options.map((option, col) => {
      const panel = el('article', `o__option${col === recommended ? ' o__option--recommended' : ''}`);
      panel.dataset.option = String(col);
      const top = el('div', 'o__option-top');
      top.append(el('span', 'o__index', `0${col + 1}`));
      const title = el('h3', 'o__option-name', option);
      if (col === recommended) title.append(el('span', 'o__badge', '추천'));
      top.append(title);
      const list = el('dl', 'o__option-values');
      criteria.forEach((criterion, row) => {
        const pair = el('div', 'o__option-value');
        pair.dataset.criterion = String(row);
        pair.append(el('dt', '', criterion), el('dd', '', values[row]?.[col] == null ? '자료 없음' : String(values[row][col])));
        list.append(pair);
      });
      panel.append(top, list);
      stage.append(panel);
      return panel;
    });
    const table = root.querySelector('[data-role="table"]');
    table.style.setProperty('--option-columns', String(options.length));
    table.setAttribute('aria-rowcount', String(criteria.length + 1));
    table.setAttribute('aria-colcount', String(options.length + 1));
    const head = el('div', 'o__row o__row--head'); head.setAttribute('role', 'row');
    const first = el('div', 'o__cell o__criterion-head', '판단 기준'); first.setAttribute('role', 'columnheader'); head.append(first);
    options.forEach((option, col) => { const cell = el('div', `o__cell o__column-head${col === recommended ? ' o__cell--recommended' : ''}`, option); cell.setAttribute('role', 'columnheader'); head.append(cell); });
    table.append(head);
    criteria.forEach((criterion, row) => {
      const line = el('div', 'o__row'); line.dataset.criterion = String(row); line.setAttribute('role', 'row');
      const label = el('div', 'o__cell o__criterion', criterion); label.setAttribute('role', 'rowheader'); line.append(label);
      options.forEach((option, col) => { const value = values[row]?.[col]; const cell = el('div', `o__cell${col === recommended ? ' o__cell--recommended' : ''}`, value == null ? '자료 없음' : String(value)); cell.setAttribute('role', 'cell'); cell.setAttribute('aria-label', `${criterion}, ${option}: ${value == null ? '자료 없음' : value}`); line.append(cell); });
      table.append(line);
    });
    const cards = root.querySelector('[data-role="cards"]');
    options.forEach((option, col) => {
      const card = el('article', `o__mobile-card${col === recommended ? ' o__mobile-card--recommended' : ''}`);
      const h = el('h3', '', option); if (col === recommended) h.append(el('span', 'o__badge', '추천'));
      const detail = el('dl', 'o__mobile-values');
      criteria.forEach((criterion, row) => { const pair = el('div', 'o__mobile-pair'); pair.append(el('dt', '', criterion), el('dd', '', values[row]?.[col] == null ? '자료 없음' : String(values[row][col]))); detail.append(pair); });
      card.append(h, detail); cards.append(card);
    });
    const proofs = root.querySelector('[data-role="proofs"]');
    if (recommended >= 0) {
      criteria.slice(0, 3).forEach((criterion, row) => {
        const item = el('li', 'o__proof');
        item.append(el('span', 'o__proof-label', criterion), el('strong', 'o__proof-value', values[row]?.[recommended] == null ? '자료 없음' : String(values[row][recommended])));
        proofs.append(item);
      });
    }
    const alternatives = options.map((option, col) => {
      if (col === recommended) return null;
      const comparison = criteria[0] ? `${criteria[0]} ${values[0]?.[col] == null ? '자료 없음' : values[0][col]}` : '비교 자료 없음';
      return `${option} · ${comparison}`;
    }).filter(Boolean);
    root.querySelector('[data-role="alternatives"]').textContent = alternatives.length
      ? `다른 안: ${alternatives.join('  /  ')}` : '';
    root.querySelector('[data-role="reason"]').textContent = recommended >= 0 && options[recommended]
      ? `${options[recommended]}을 추천합니다. ${matrix.reason || ''}` : (matrix.reason || '각 기준의 차이를 읽고 결정합니다.');
    root.querySelector('[data-role="source"]').textContent = matrix.source || scene.source || '';
    stage._panels = panels;
  },
  build(tl) {
    const panels = root.querySelector('.o__stage')._panels || [];
    const rows = [...root.querySelectorAll('.o__option-value')];
    const decision = root.querySelector('.o__decision');
    // enter — the three choices rise into view, one at a time.
    tl.fromTo(root.querySelector('.o__title'), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .12 }, 0);
    tl.fromTo(panels, { y: 36, autoAlpha: 0, scale: .98 }, { y: 0, autoAlpha: 1, scale: 1, duration: .16, stagger: .055 }, .1);
    // compare — reveal each criterion across the aligned choices in sequence.
    const criteriaCount = panels[0]?.querySelectorAll('.o__option-value').length || 0;
    for (let row = 0; row < criteriaCount; row++) {
      const cells = panels.map(panel => panel.querySelectorAll('.o__option-value')[row]).filter(Boolean);
      const at = .31 + row * .075;
      tl.fromTo(cells, { autoAlpha: .24, x: 14 }, { autoAlpha: 1, x: 0, duration: .09, stagger: .025 }, at);
    }
    // Decide: let the complete comparison occupy the speaking hold.
    tl.to(root.querySelector('.o__stage'), { autoAlpha: 0, y: -12, duration: .08 }, .42);
    tl.fromTo(decision, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: .07 }, .42);
    const finalProofs = [...root.querySelectorAll('.o__proof')];
    tl.fromTo(finalProofs, { autoAlpha: .25, x: 12 }, { autoAlpha: 1, x: 0, duration: .035, stagger: .015 }, .46);
    // hold — .52 .. .91: keep the recommendation, proof and source legible.
    // exit — .91 .. 1.00.
    tl.to(root, { autoAlpha: 1, y: -18, duration: .09 }, .91);
  },
  unmount() { root = null; },
};
