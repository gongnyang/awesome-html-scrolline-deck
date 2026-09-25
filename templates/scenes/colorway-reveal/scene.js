let root = null;
let hasError = false;

const make = (tag, className, text = '') => {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
};

export default {
  id: '{{id}}',
  mount(section, ctx) {
    root = section.querySelector('.cw') || section;
    hasError = false;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const assets = scene.assets || {};
    const images = assets.images || [];
    const copyLines = copy.lines || [];
    const labels = Array.isArray(assets.colorways) && assets.colorways.length === 3 ? assets.colorways : copyLines;
    const alts = assets.imageAlt || [];
    const visuals = root.querySelector('[data-role="visuals"]');
    const labelHost = root.querySelector('[data-role="labels"]');

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    const equivalence = scene.evidence || (Array.isArray(assets.colorways) && assets.colorways.length === 3 && copyLines.length < 3 ? copyLines[0] : '세 색상과 마감은 기능과 가격이 같습니다.');
    root.querySelector('[data-role="equivalence"]').textContent = equivalence;

    const errors = [];
    if (![1, 3].includes(images.length)) errors.push('assets.images에는 전체 triptych 한 장 또는 개별 시안 세 장이 필요합니다.');
    if (labels.length !== 3 || labels.some((label) => typeof label !== 'string' || !label.trim())) errors.push('색상·마감 라벨을 정확히 세 개 제공해야 합니다.');
    if (errors.length) {
      hasError = true;
      const alert = root.querySelector('[data-role="error"]');
      alert.hidden = false;
      alert.textContent = `컬러웨이 장면을 만들 수 없습니다. ${errors.join(' ')}`;
      visuals.hidden = true;
      labelHost.hidden = true;
      root.querySelector('[data-role="equivalence"]').hidden = true;
      return;
    }
    visuals.hidden = false;
    labelHost.hidden = false;
    root.querySelector('[data-role="equivalence"]').hidden = false;

    if (images.length === 1) {
      visuals.classList.add('is-triptych');
      labelHost.classList.add('is-triptych');
      const zones = labels.map((label, index) => {
        const zone = make('figure', `cw__zone${index === 0 ? ' is-active' : ''}`);
        const image = document.createElement('img');
        image.className = 'cw__triptych-crop';
        image.src = images[0];
        image.alt = alts[0] || `같은 제품의 세 가지 마감. ${label}은(는) ${index + 1}번째 시안.`;
        image.decoding = 'async';
        image.fetchPriority = index === 0 ? 'high' : 'auto';
        image.style.objectPosition = `${index * 50}% center`;
        zone.append(image, make('figcaption', 'cw__visual-label', label));
        zone.dataset.index = String(index);
        return zone;
      });
      visuals.replaceChildren(...zones);
    } else {
      visuals.classList.add('is-individual');
      labelHost.classList.add('is-individual');
      visuals.replaceChildren(...labels.map((label, index) => {
        const panel = make('figure', `cw__visual${index === 0 ? ' is-active' : ''}`);
        const image = document.createElement('img');
        image.src = images[index] || '';
        image.alt = alts[index] || `${label} 색상과 마감`;
        image.decoding = 'async';
        panel.append(image, make('figcaption', 'cw__visual-label', label));
        return panel;
      }));
    }

    labelHost.replaceChildren(...labels.map((label, index) => {
      const item = make('p', `cw__label${index === 0 ? ' is-active' : ''}`, label);
      const number = make('small', '', `0${index + 1}`);
      item.append(number);
      item.dataset.index = String(index);
      return item;
    }));
  },
  build(tl) {
    if (hasError) {
      tl.fromTo(root.querySelector('[data-role="error"]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0);
      return;
    }
    const labels = [...root.querySelectorAll('.cw__label')];
    const panels = [...root.querySelectorAll('.cw__visual, .cw__zone')];
    const all = [...labels, ...panels];
    const setActive = (index) => all.forEach((node) => node.classList.toggle('is-active', node.dataset.index === String(index)));

    // enter — the whole triptych is present; focus begins at the first finish.
    tl.fromTo(root.querySelector('.cw__head'), { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12 }, 0.02);

    // hold — scroll shifts the clear focus across equal options; every label stays visible.
    tl.call(setActive, [0], 0.06);
    tl.call(setActive, [1], 0.40);
    tl.call(setActive, [2], 0.64);

    // exit — leave all finishes visible as the next scene takes the stage.
    tl.to(root, { autoAlpha: 1, y: -16, duration: 0.12 }, 0.86);
  },
  unmount() { root = null; hasError = false; },
};
