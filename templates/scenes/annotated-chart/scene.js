let root = null;
let hasError = false;
let revealRect = null;

const fmt = (value, unit) => `${new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value)}${unit ? ` ${unit}` : ''}`;
const make = (tag, cls, text = '') => { const n = document.createElement(tag); n.className = cls; n.textContent = text; return n; };

export default {
  id: '{{id}}',
  mount(section, ctx) {
    root = section.querySelector('.ac') || section;
    hasError = false;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const assets = scene.assets || {};
    const values = assets.series;
    const labels = assets.xLabels;
    const unit = assets.unit;
    const index = assets.annotationIndex;
    const problems = [];
    if (!Array.isArray(values) || values.length < 2 || values.length > 20 || values.some((v) => !Number.isFinite(v))) problems.push('series에는 유한한 실제 값 2–20개가 필요합니다.');
    if (!Array.isArray(labels) || labels.length !== values?.length || labels.some((v) => typeof v !== 'string' || !v.trim())) problems.push('xLabels 개수는 series와 같아야 하며 모든 시점/범주 라벨이 필요합니다. 축 단위가 필요하면 라벨 안에 함께 표시합니다.');
    if (typeof unit !== 'string' || !unit.trim()) problems.push('assets.unit에 y축 값의 단위가 필요합니다.');
    if (!Number.isInteger(index) || index < 0 || index >= (values?.length || 0)) problems.push('annotationIndex는 설명할 데이터 점의 유효한 0 기반 위치여야 합니다.');
    if (typeof scene.source !== 'string' || !scene.source.trim()) problems.push('scene.source에 자료 출처나 가상 목표임을 밝혀야 합니다.');
    if (typeof scene.evidence !== 'string' || !scene.evidence.trim()) problems.push('scene.evidence에 측정 조건·자료 범위·가상 설계 목표 여부를 표시해야 합니다.');
    if (!Array.isArray(copy.lines) || copy.lines.length < 1 || copy.lines.length > 4 || copy.lines.some((line) => typeof line !== 'string' || !line.trim())) problems.push('copy.lines에는 선택점 해석과 필요한 보충 문장 1–4개를 넣어야 합니다.');

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="interpretation"]').replaceChildren(...(copy.lines || []).map((line, i) => make('p', i === 0 ? 'ac__interpretation-primary' : 'ac__interpretation-support', line)));
    if (problems.length) {
      hasError = true;
      const error = root.querySelector('[data-role="error"]');
      error.hidden = false;
      error.textContent = `차트 장면을 만들 수 없습니다. ${problems.join(' ')}`;
      root.querySelector('.ac__figure').hidden = true;
      root.querySelector('[data-role="metric"]').hidden = true;
      return;
    }

    const value = values[index];
    const isMaximum = value === Math.max(...values);
    root.querySelector('[data-role="metric-value"]').textContent = new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);
    root.querySelector('[data-role="metric-unit"]').textContent = unit;
    root.querySelector('[data-role="metric-relation"]').textContent = isMaximum ? 'PEAK ·' : 'SELECTED ·';
    root.querySelector('[data-role="metric-label"]').textContent = labels[index];
    root.querySelector('[data-role="metric"]').setAttribute('aria-label', `${fmt(value, unit)} at ${labels[index]}${isMaximum ? ', highest supplied value' : ''}`);
    root.querySelector('[data-role="caveat"]').textContent = scene.evidence;
    root.querySelector('[data-role="source"]').textContent = `출처 · ${scene.source}`;

    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const pad = (hi - lo) * 0.12 || Math.max(Math.abs(hi) * 0.12, 1);
    const min = lo - pad;
    const max = hi + pad;
    const y = (v) => 360 - ((v - min) / (max - min)) * 360;
    const x = (i) => (i + .5) / values.length * 1000;
    const ticks = Array.from({ length: 4 }, (_, i) => max - (max - min) * i / 3);
    root.querySelector('[data-role="yaxis"]').replaceChildren(...ticks.map((tick) => make('span', 'ac__tick', fmt(tick, unit))));
    root.querySelector('[data-role="xaxis"]').replaceChildren(...labels.map((label) => make('span', 'ac__xlabel', label)));

    const points = values.map((v, i) => [x(i), y(v)]);
    const pathD = points.map(([px, py], i) => `${i ? 'L' : 'M'} ${px.toFixed(2)} ${py.toFixed(2)}`).join(' ');
    const svg = root.querySelector('[data-role="svg"]');
    const clipId = `${String(scene.id || 'chart').replace(/[^a-zA-Z0-9_-]/g, '-')}-trace-clip`;
    const grid = ticks.map((_, i) => `<line class="ac__grid" x1="0" x2="1000" y1="${(i / 3 * 360).toFixed(2)}" y2="${(i / 3 * 360).toFixed(2)}"/>`).join('');
    const dots = points.map(([px, py], i) => `<circle class="ac__point${i === index ? ' is-target' : ''}" data-index="${i}" cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${i === index ? 10 : 5}"/>`).join('');
    svg.innerHTML = `<defs><clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><rect class="ac__clip" x="0" y="0" width="${ctx.reduced ? 1000 : 0}" height="360"/></clipPath></defs>${grid}<path class="ac__line" d="${pathD}" clip-path="url(#${clipId})"/><line class="ac__guide" x1="${points[index][0]}" x2="${points[index][0]}" y1="0" y2="360"/><g class="ac__points">${dots}</g>`;
    revealRect = svg.querySelector('.ac__clip');
    root.querySelector('[data-role="plot"]').setAttribute('aria-label', `${labels.map((label, i) => `${label}: ${fmt(values[i], unit)}`).join('; ')}. ${copy.lines[0]}. ${scene.evidence}`);
  },
  build(tl, ctx) {
    const figure = root.querySelector('.ac__figure');
    const metric = root.querySelector('[data-role="metric"]');
    const guide = root.querySelector('.ac__guide');
    const dots = [...root.querySelectorAll('.ac__point')];
    const target = root.querySelector('.ac__point.is-target');
    const error = root.querySelector('[data-role="error"]');
    if (hasError) {
      tl.fromTo(error, { autoAlpha: 0 }, { autoAlpha: 1, duration: .1 }, 0);
      tl.to(error, { autoAlpha: 0, duration: .1 }, .85);
      return;
    }
    if (ctx?.reduced) return;
    const scene = ctx?.data?.scene || {};
    const index = scene.assets?.annotationIndex ?? 0;
    const targetX = (index + .5) / dots.length * 1000;
    // enter — the selected value is the hook; the truthful series rises to the marked point.
    tl.fromTo(root.querySelector('.ac__head'), { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .12 }, 0);
    tl.fromTo(metric, { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .12 }, .02);
    tl.fromTo(revealRect, { attr: { width: 0 } }, { attr: { width: targetX }, duration: .18, ease: 'none' }, .04);
    tl.fromTo(guide, { autoAlpha: 0 }, { autoAlpha: 1, duration: .06 }, .20);
    tl.fromTo(target, { scale: .55, transformOrigin: 'center', autoAlpha: .45 }, { scale: 1, autoAlpha: 1, duration: .1 }, .21);
    tl.to(revealRect, { attr: { width: 1000 }, duration: .16, ease: 'none' }, .27);
    tl.fromTo(dots.filter((dot) => dot !== target), { autoAlpha: 0 }, { autoAlpha: .8, duration: .08, stagger: .02 }, .40);
    // hold — complete series, peak/selected value, exact axes, interpretation, source, and caveat remain together.
    // exit — release the chart and its claim as one composed scene.
    tl.to(figure, { y: -10, autoAlpha: 0, duration: .12 }, .85);
    tl.to(root.querySelector('.ac__head'), { y: -8, autoAlpha: 0, duration: .1 }, .87);
  },
  unmount() { root = null; hasError = false; revealRect = null; },
};
