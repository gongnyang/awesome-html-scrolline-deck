let root = null;
let hasError = false;

const make = (tag, className, text = '') => {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
};

function parse(line) {
  const parts = String(line).split(':');
  const label = parts.shift()?.trim() || '';
  const relation = parts.join(':').split('→').map((value) => value.trim());
  return { label, observation: relation[0] || '', inference: relation[1] || '' };
}

export default {
  id: '{{id}}',
  mount(section, ctx) {
    root = section.querySelector('.qr') || section;
    hasError = false;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const assets = scene.assets || {};
    const lines = Array.isArray(copy.lines) ? copy.lines : [];
    const rows = lines.map(parse);
    const image = assets.images?.[0];
    const alt = assets.imageAlt?.[0] || '';
    const marks = Array.isArray(assets.marks) ? assets.marks : [];
    const errors = [];
    if (!copy.title?.trim()) errors.push('청중에게 답을 요구하는 짧은 질문 제목이 필요합니다.');
    if (!image) errors.push('질문의 답을 뒷받침하는 출처 이미지가 필요합니다.');
    if (!alt.trim()) errors.push('assets.imageAlt[0]에 이미지가 보여주는 관찰 대상의 대체 텍스트가 필요합니다.');
    if (rows.length < 2 || rows.length > 4) errors.push('질문에 답하는 관찰 근거를 2–4개 제공해야 합니다.');
    rows.forEach((row, i) => { if (!row.label || !row.observation || !row.inference) errors.push(`${i + 1}번째 근거는 이름: 관찰 사실 → 답에 대한 관계 형식이어야 합니다.`); });
    if (marks.length !== rows.length || marks.some((mark) => !Array.isArray(mark) || mark.length !== 2 || mark.some((n) => !Number.isFinite(n) || n < 0 || n > 100))) errors.push('assets.marks에는 각 근거와 1:1로 대응하는 실제 이미지 위치 [x,y]를 제공해야 합니다.');
    if (!scene.evidence?.trim()) errors.push('scene.evidence에 질문에 대한 짧은 결론을 적어야 합니다.');
    if (!scene.source?.trim()) errors.push('scene.source에 이미지와 관찰 근거의 출처를 표시해야 합니다.');
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '질문';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    if (errors.length) {
      hasError = true;
      const alert = root.querySelector('[data-role="error"]');
      alert.hidden = false;
      alert.textContent = `질문 장면을 만들 수 없습니다. ${errors.join(' ')}`;
      root.querySelector('.qr__body').hidden = true;
      return;
    }
    root.querySelector('.qr__body').hidden = false;
    const img = root.querySelector('[data-role="image"]');
    img.src = image;
    img.alt = alt;
    img.decoding = 'async';
    root.querySelector('[data-role="alt-caption"]').textContent = scene.source;
    root.querySelector('[data-role="answer"] strong').textContent = scene.evidence;
    root.querySelector('[data-role="source"]').textContent = `출처 · ${scene.source}`;
    root.querySelector('[data-role="evidence"]').replaceChildren(...rows.map((row, index) => {
      const item = make('li', `qr__item${index === 0 ? ' is-active' : ''}`);
      item.dataset.index = String(index);
      item.append(make('strong', 'qr__item-label', row.label));
      item.append(make('p', 'qr__observation', row.observation));
      item.append(make('p', 'qr__inference', row.inference));
      return item;
    }));
    root.querySelector('[data-role="marks"]').replaceChildren(...marks.map(([x, y], index) => {
      const mark = make('span', `qr__mark${index === 0 ? ' is-active' : ''}`, String(index + 1).padStart(2, '0'));
      mark.style.setProperty('--mx', String(x));
      mark.style.setProperty('--my', String(y));
      mark.dataset.index = String(index);
      return mark;
    }));
  },
  build(tl) {
    if (hasError) {
      tl.fromTo(root.querySelector('[data-role="error"]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0);
      tl.to(root.querySelector('[data-role="error"]'), { autoAlpha: 1, duration: 0.1 }, 0.85);
      return;
    }
    const rows = [...root.querySelectorAll('.qr__item')];
    const marks = [...root.querySelectorAll('.qr__mark')];
    const answer = root.querySelector('.qr__answer');
    const setActive = (index) => {
      rows.forEach((row, i) => row.classList.toggle('is-active', i === index));
      marks.forEach((mark, i) => mark.classList.toggle('is-active', i === index));
    };
    // enter — pose the question beside its source image and reveal evidence tied to actual locations.
    tl.fromTo(root.querySelector('.qr__head'), { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12 }, 0);
    tl.fromTo(root.querySelector('.qr__figure'), { scale: 1.03, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.14 }, 0.02);
    rows.forEach((row, index) => {
      const at = 0.08 + index * 0.055;
      tl.fromTo(row, { x: 20, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.08 }, at);
      tl.fromTo(marks[index], { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.06 }, at + 0.02);
    });
    // hold — the question, source image, active observation, and its exact image mark remain in frame.
    rows.forEach((_, index) => tl.call(setActive, [index], 0.34 + index * 0.085));
    tl.fromTo(answer, { y: 8, autoAlpha: 0.25 }, { y: 0, autoAlpha: 1, duration: 0.1 }, 0.58);
    tl.call(() => answer.classList.add('is-ready'), null, 0.68);
    // exit — the answered question leaves as the next scene begins.
    tl.to(root, { y: -12, autoAlpha: 1, duration: 0.14 }, 0.85);
  },
  unmount() { root = null; hasError = false; },
};
