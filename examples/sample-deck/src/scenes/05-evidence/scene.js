let root = null;
let hasError = false;

const fmt = (value, unit) => `${new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value)}${unit ? ` ${unit}` : ''}`;
const make = (tag, cls, text = '') => {
  const node = document.createElement(tag);
  node.className = cls;
  node.textContent = text;
  return node;
};

export default {
  id: '05-evidence',
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
    if (!Array.isArray(labels) || labels.length !== values?.length || labels.some((v) => typeof v !== 'string' || !v.trim())) problems.push('xLabels 개수는 series와 같아야 하며, 각 시점/범주 라벨이 필요합니다.');
    if (typeof unit !== 'string' || !unit.trim()) problems.push('assets.unit에 값의 단위가 필요합니다.');
    if (!Number.isInteger(index) || index < 0 || index >= (values?.length || 0)) problems.push('annotationIndex는 설명할 실제 데이터 점의 유효한 0 기반 위치여야 합니다.');
    if (typeof scene.source !== 'string' || !scene.source.trim()) problems.push('scene.source에 데이터 출처 또는 가상/예시 자료임을 표시해야 합니다.');
    if (!copy.lines?.[0]?.trim()) problems.push('copy.lines[0]에 선택한 점의 의미를 설명하는 주석이 필요합니다.');

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    if (problems.length) {
      hasError = true;
      const error = root.querySelector('[data-role="error"]');
      error.hidden = false;
      error.textContent = `차트 장면을 만들 수 없습니다. ${problems.join(' ')}`;
      root.querySelector('.ac__figure').hidden = true;
      return;
    }

    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const pad = (hi - lo) * 0.12 || Math.max(Math.abs(hi) * 0.12, 1);
    const min = lo - pad;
    const max = hi + pad;
    const y = (v) => 360 - ((v - min) / (max - min)) * 360;
    const x = (i) => 22 + i / (values.length - 1) * 956;
    const ticks = Array.from({ length: 4 }, (_, i) => max - (max - min) * i / 3);
    root.querySelector('[data-role="yaxis"]').replaceChildren(...ticks.map((value) => make('span', 'ac__tick', fmt(value))));
    root.querySelector('[data-role="xaxis"]').replaceChildren(...labels.map((label) => make('span', 'ac__xlabel', label)));
    root.querySelector('[data-role="unit"]').textContent = `Y축 단위 · ${unit}`;
    root.querySelector('[data-role="source"]').textContent = `출처 · ${scene.source}`;

    const points = values.map((value, i) => [x(i), y(value)]);
    const d = points.map(([px, py], i) => `${i ? 'L' : 'M'} ${px.toFixed(2)} ${py.toFixed(2)}`).join(' ');
    const svg = root.querySelector('[data-role="svg"]');
    const grid = ticks.map((value, i) => `<line class="ac__grid" x1="0" x2="1000" y1="${(i / 3 * 360).toFixed(2)}" y2="${(i / 3 * 360).toFixed(2)}"/>`).join('');
    const circles = points.map(([px, py], i) => `<circle class="ac__point${i === index ? ' is-target' : ''}" cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${i === index ? 9 : 5}"/>`).join('');
    svg.innerHTML = `${grid}<path class="ac__line" d="${d}"/><line class="ac__guide" x1="${points[index][0]}" x2="${points[index][0]}" y1="0" y2="360"/>${circles}`;
    const path = svg.querySelector('.ac__line');
    // Keep the evidence line complete throughout the scene. A partially drawn
    // line made the final point look detached at the presenter hold.
    path.style.strokeDasharray = 'none';
    path.style.strokeDashoffset = '0';
    root.querySelector('[data-role="plot"]').setAttribute('aria-label', `${labels.map((label, i) => `${label}: ${fmt(values[i], unit)}`).join('; ')}. ${copy.lines[0]}`);
    const callout = root.querySelector('[data-role="callout"]');
    callout.textContent = copy.lines[0];
  },
  build(tl) {
    const figure = root.querySelector('.ac__figure');
    const callout = root.querySelector('.ac__callout');
    const target = root.querySelector('.ac__point.is-target');
    const error = root.querySelector('[data-role="error"]');
    if (hasError) {
      tl.fromTo(error, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0);
      return;
    }
    // enter — identify one supplied event on the complete labelled series.
    tl.fromTo(target, { scale: 0.5, transformOrigin: 'center', autoAlpha: 0.5 }, { scale: 1, autoAlpha: 1, duration: 0.12 }, 0.22);
    tl.fromTo(callout, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12 }, 0.24);
    tl.fromTo(root.querySelector('.ac__head'), { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12 }, 0);
    // hold — the full labelled series, source, unit, event mark, and interpretation remain composed.
    // exit — dismiss the completed evidence together.
    tl.to(figure, { y: -14, autoAlpha: 0, duration: 0.14 }, 0.84);
    tl.to(root.querySelector('.ac__head'), { y: -10, autoAlpha: 0, duration: 0.1 }, 0.86);
  },
  unmount() { root = null; hasError = false; },
};
