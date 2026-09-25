let root = null;
let invalid = false;
const el = (tag, cls, text = '') => { const n = document.createElement(tag); n.className = cls; n.textContent = text; return n; };
export default {
  id: '{{id}}',
  mount(section, ctx) {
    root = section.querySelector('.r') || section;
    invalid = false;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const assets = scene.assets || {};
    const lines = Array.isArray(copy.lines) ? copy.lines : [];
    const marks = Array.isArray(assets.marks) ? assets.marks : [];
    const errors = [];
    if (!Array.isArray(assets.images) || assets.images.length !== 1 || !assets.images[0]) errors.push('검증된 베이스맵 이미지 1장이 필요합니다.');
    if (!Array.isArray(assets.imageAlt) || !assets.imageAlt[0]?.trim()) errors.push('베이스맵 설명 대체 텍스트가 필요합니다.');
    if (!scene.source?.trim()) errors.push('지도 데이터/이미지의 출처를 scene.source에 표시해야 합니다.');
    if (lines.length < 2 || lines.length > 4) errors.push('장소 2–4개가 필요합니다.');
    if (marks.length !== lines.length || marks.some((p) => !Array.isArray(p) || p.length !== 2 || p.some((v) => !Number.isFinite(v) || v < 0 || v > 100))) errors.push('각 장소에 베이스맵 좌표 [x,y]를 하나씩 제공해야 합니다.');
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    const error = root.querySelector('[data-role="error"]');
    if (errors.length) { invalid = true; error.hidden = false; error.textContent = `경로 지도를 그릴 수 없습니다. ${errors.join(' ')}`; root.querySelector('.r__map').hidden = true; return; }
    error.hidden = true;
    const map = root.querySelector('.r__map'); map.hidden = false;
    const image = root.querySelector('[data-role="base"]'); image.src = assets.images[0]; image.alt = assets.imageAlt[0]; image.decoding = 'async';
    const points = marks.map(([x, y]) => [Number(x), Number(y)]);
    const d = points.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');
    const svg = root.querySelector('.r__route');
    const markers = points.map(([x, y], i) => `<g class="r__point${i === 0 ? ' is-active' : ''}" data-stop="${i}"><circle cx="${x}" cy="${y}" r="2.2"/><text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central">${String(i + 1).padStart(2, '0')}</text></g>`).join('');
    svg.innerHTML = `<path class="r__path" d="${d}" fill="none" stroke="currentColor" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>${markers}`;
    const stops = root.querySelector('[data-role="stops"]');
    const list = root.querySelector('[data-role="list"]');
    stops.replaceChildren();
    list.replaceChildren(...lines.map((line, i) => {
      const [place, description = ''] = String(line).split(/:(.*)/s).slice(0, 2);
      const item = el('li', 'r__item'); item.dataset.stop = String(i); item.append(el('span', 'r__list-index', String(i + 1).padStart(2, '0')), el('div', 'r__copy', ''));
      item.querySelector('.r__copy').append(el('h3', '', place.trim()), el('p', '', description.trim()));
      return item;
    }));
    root.querySelector('[data-role="caption"]').textContent = `지도·경로 출처 · ${scene.source}`;
  },
  build(tl) {
    if (invalid) { tl.fromTo(root.querySelector('[data-role="error"]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: .1 }, 0); tl.to(root.querySelector('[data-role="error"]'), { autoAlpha: 0, duration: .1 }, .85); return; }
    const path = root.querySelector('.r__route path');
    const len = path.getTotalLength?.() || 1;
    path.style.strokeDasharray = String(len); path.style.strokeDashoffset = String(len);
    const stops = [...root.querySelectorAll('.r__point')];
    const items = [...root.querySelectorAll('.r__item')];
    const activate = (i) => { stops.forEach((s, j) => s.classList.toggle('is-active', i === j)); items.forEach((s, j) => s.classList.toggle('is-active', i === j)); };
    // enter — show the credited base map and draw the supplied, ordered route.
    tl.fromTo(root.querySelector('.r__head'), { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .12 }, 0);
    tl.fromTo(root.querySelector('.r__base'), { scale: 1.02, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .14 }, .02);
    tl.fromTo(path, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: .3, ease: 'none' }, .05);
    tl.fromTo(stops, { scale: .7, autoAlpha: 0, transformOrigin: 'center' }, { scale: 1, autoAlpha: 1, duration: .1, stagger: .06 }, .18);
    // hold — keep full map and all stop labels visible while highlighting the current stop.
    stops.forEach((_, i) => tl.call(activate, [i], .38 + i * .075));
    // exit — release the geographic scene after its route has been explained.
    tl.to(root, { autoAlpha: 0, duration: .12 }, .86);
  },
  unmount() { root = null; invalid = false; },
};
