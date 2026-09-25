let root = null;
const STATES = [
  ['가상 예약 화면 · 빈자리 발견', '퇴근길에 오늘 이용할 수 있는 공간을 찾습니다.'],
  ['가상 예약 화면 · 조건 확인', '같은 공간의 이용 시간과 조건을 확인합니다.'],
  ['가상 예약 화면 · 예약 완료', '선택한 시간이 예약 완료 상태로 바뀝니다.'],
];
const VIEWS = [
  '<small>오늘 · 성수동</small><strong>조용한 작업 자리</strong><p>이용 가능 · 19:00부터</p><b>01　빈자리 발견</b>',
  '<small>같은 공간 · 조건 확인</small><strong>19:00–21:00</strong><p>1인 이용 · 오늘 예약 가능</p><b>02　이용 시간 선택</b>',
  '<small>선택한 시간 · 예약 완료</small><strong>조용한 작업 자리</strong><p>오늘 19:00 예약이 완료됐습니다.</p><b>03　예약 정보 확인</b>',
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
    const visual = root.querySelector('[data-role="visual"]');
    const setPhase = (index) => {
      phases.forEach((phase, i) => phase.classList.toggle('is-active', i === index));
      state.textContent = STATES[index][0];
      explain.textContent = STATES[index][1];
      visual.innerHTML = VIEWS[index];
    };
    tl.fromTo(root.querySelector('.rhythm__visual'), { y: 45, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .18 }, 0);
    tl.call(setPhase, [0], .12);
    tl.call(setPhase, [1], .39);
    tl.call(setPhase, [2], .64);
    // Leave the completed booking state on screen through the exit boundary.
  },
  unmount() { root = null; },
};
