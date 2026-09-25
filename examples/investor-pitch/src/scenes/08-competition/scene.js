let root = null;
const node = (tag, className, text = '') => { const el = document.createElement(tag); el.className = className; el.textContent = text; return el; };
export default {
  id: '08-competition',
  mount(section, ctx) {
    root = section.querySelector('.o') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = (copy.lines || []).slice(0, 4);
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="source"]').textContent = copy.source || scene.source || '';
    const matrix = scene.assets?.matrix || {};
    const options = (matrix.options || lines.slice(0, 3).map(line => String(line).split(':')[0])).slice(0, 3);
    const criteriaLine = lines[3] || '';
    const criteria = (matrix.criteria || criteriaLine.split(':')[1]?.split(/[·,|]/).map(s => s.trim()).filter(Boolean) || ['기준 1', '기준 2']).slice(0, 3);
    const values = Array.isArray(matrix.values) ? matrix.values : [];
    const recommended = Number.isInteger(matrix.recommendedIndex) ? matrix.recommendedIndex : -1;
    const table = root.querySelector('.o__table');
    table.classList.add('o__decision');
    const decision = [
      { label: '지도 검색', value: '장소는 찾지만 당일 빈 좌석 예약은 연결하지 않음' },
      { label: '쿠폰 앱', value: '할인은 제공하지만 좌석 시간과 예약 확정은 다루지 않음' },
      { label: '모아 · 제안', value: '가게가 공개한 당일 좌석을 고객의 예약으로 연결' },
    ];
    const rows = decision.map((item, index) => {
      const row = node('article', `o__decision-row${index === 2 ? ' o__decision-row--focus' : ''}`);
      row.dataset.step = String(index);
      row.append(node('span', 'o__decision-index', `0${index + 1}`));
      row.append(node('h2', 'o__decision-label', item.label));
      row.append(node('p', 'o__decision-value', item.value));
      return row;
    });
    table.replaceChildren(...rows);
  },
  build(tl, ctx) {
        // enter — 0 .. 0.30
    const cells = [...root.querySelectorAll('.o__decision-row')];
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      tl.set([...cells, root.querySelector('.o__title'), root.querySelector('.o__source')], { autoAlpha: 1, x: 0, y: 0 });
      return;
    }
    tl.fromTo(cells, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1, stagger: 0.012 }, 0.04);
    tl.fromTo(root.querySelector('.o__title'), { x: -20, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.13 }, 0);
    tl.to(root, { y: -8, duration: 0.16 }, 0.82);
    // hold — 0.30 .. 0.75
    // Keep the composed state readable while the presenter speaks.
    // exit — 0.75 .. 1.00
  },
  unmount() { root = null; },
};
