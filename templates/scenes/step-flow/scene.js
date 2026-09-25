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
  const name = parts.shift()?.trim() || '';
  const detail = parts.join(':').split('→').map((value) => value.trim());
  return { name, input: detail[0] || '', action: detail[1] || '', result: detail[2] || '' };
}

export default {
  id: '{{id}}',
  mount(section, ctx) {
    root = section.querySelector('.sf') || section;
    hasError = false;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = Array.isArray(copy.lines) ? copy.lines : [];
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    const steps = lines.map(parse);
    const errors = [];
    if (steps.length < 2 || steps.length > 4) errors.push('실제 인과 단계 2–4개가 필요합니다.');
    steps.forEach((step, i) => {
      if (!step.name || !step.input || !step.action || !step.result) errors.push(`${i + 1}단계는 이름: 입력 → 행동 → 결과 형식이어야 합니다.`);
    });
    const host = root.querySelector('[data-role="steps"]');
    if (errors.length) {
      hasError = true;
      const alert = root.querySelector('[data-role="error"]');
      alert.hidden = false;
      alert.textContent = `절차 장면을 만들 수 없습니다. ${errors.join(' ')}`;
      host.hidden = true;
      return;
    }
    host.hidden = false;
    host.style.setProperty('--step-count', String(steps.length));
    host.style.setProperty('--progress', '0');
    host.replaceChildren(...steps.map((step, index) => {
      const item = make('li', `sf__step${index === 0 ? ' is-active' : ''}`);
      const number = make('span', 'sf__number', String(index + 1).padStart(2, '0'));
      const title = make('h3', 'sf__name', step.name);
      const detail = make('dl', 'sf__detail');
      for (const [label, value] of [['입력', step.input], ['행동', step.action], ['결과', step.result]]) {
        const pair = make('div', '');
        pair.append(make('dt', '', label), make('dd', '', value));
        detail.append(pair);
      }
      item.append(number, title, detail);
      return item;
    }));
  },
  build(tl) {
    if (hasError) {
      tl.fromTo(root.querySelector('[data-role="error"]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0);
      tl.to(root.querySelector('[data-role="error"]'), { autoAlpha: 0, duration: 0.1 }, 0.85);
      return;
    }
    const steps = [...root.querySelectorAll('.sf__step')];
    const host = root.querySelector('[data-role="steps"]');
    const setActive = (index) => {
      steps.forEach((step, i) => step.classList.toggle('is-active', i === index));
      host.style.setProperty('--progress', String(index / Math.max(1, steps.length - 1)));
    };
    // enter — establish the causal path and bring each complete input/change/result unit into view.
    tl.fromTo(root.querySelector('.sf__head'), { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12 }, 0);
    tl.fromTo(steps, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12, stagger: 0.035 }, 0.04);
    tl.fromTo(host, { '--progress': 0 }, { '--progress': 1, duration: 0.26, ease: 'none' }, 0.04);
    // hold — scroll moves the active point through a complete causal chain; all inputs/results remain visible.
    steps.forEach((_, index) => tl.call(setActive, [index], 0.32 + index * 0.075));
    // exit — dismiss the completed process as the next claim enters.
    tl.to(root, { y: -14, autoAlpha: 0, duration: 0.14 }, 0.84);
  },
  unmount() { root = null; hasError = false; },
};
