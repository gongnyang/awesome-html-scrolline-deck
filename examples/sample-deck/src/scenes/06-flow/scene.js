let root = null;
const STATES = [
  ['진입 · 시선을 모으다', '제목과 시각 단서가 들어옵니다.'],
  ['홀드 · 설명할 시간을 만들다', '움직임을 멈추고 완성 화면에서 말합니다.'],
  ['퇴장 · 질문을 넘기다', '다음 장면을 볼 준비를 시킵니다.'],
];

export default {
  id: '06-flow',
  mount(section, ctx) {
    root = section.querySelector('.rhythm') || section;
    const copy = ctx.data.scene?.copy || {};
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="phases"]').replaceChildren(...(copy.lines || []).map((line, index) => {
      const at = String(line).indexOf(':');
      const item = document.createElement('li');
      item.className = 'rhythm__phase';
      const number = document.createElement('span');
      number.className = 'rhythm__num';
      number.textContent = String(index + 1).padStart(2, '0');
      const title = document.createElement('h3');
      title.textContent = at >= 0 ? line.slice(0, at) : line;
      const detail = document.createElement('p');
      detail.textContent = at >= 0 ? line.slice(at + 1).trim() : '';
      item.append(number, title, detail);
      return item;
    }));
  },
  build(tl) {
    const phases = [...root.querySelectorAll('.rhythm__phase')];
    const state = root.querySelector('[data-role="state"]');
    const explain = root.querySelector('[data-role="explain"]');
    const setPhase = (index) => {
      phases.forEach((phase, i) => phase.classList.toggle('is-active', i === index));
      state.textContent = STATES[index][0];
      explain.textContent = STATES[index][1];
    };
    tl.fromTo(root.querySelector('.rhythm__visual'), { y: 45, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .18 }, 0);
    tl.fromTo(root.querySelector('.rhythm__fill'), { width: '0%' }, { width: '100%', duration: .74, ease: 'none' }, .03);
    tl.call(setPhase, [0], .12);
    tl.call(setPhase, [1], .39);
    tl.call(setPhase, [2], .64);
    tl.to(root, { autoAlpha: 0, duration: .14 }, .86);
  },
  unmount() { root = null; },
};
