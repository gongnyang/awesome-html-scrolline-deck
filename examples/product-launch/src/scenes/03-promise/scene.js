// A hypothetical commute demonstrates the product response as one state change.
let root = null;

const MOMENTS = [
  ['주변 소음이 큰 출근길', '열차 소음이 이어지는 상황에서 착용을 시작합니다.'],
  ['노이즈 캔슬링을 켠다', '소음을 줄이는 기능을 켜는 사용 흐름을 보여 줍니다.'],
  ['안내 방송을 들을 때', '주변음 모드로 바꾸는 선택을 제안합니다. 성능은 시험 전입니다.'],
];

export default {
  id: '03-promise',
  mount(section, ctx) {
    section.id = '03-promise';
    root = section.querySelector('.commute') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const image = (scene.assets?.images || [])[0];
    const photo = root.querySelector('[data-role="image"]');
    if (image) photo.src = image;
    photo.alt = scene.assets?.imageAlt || '지하철에서 헤드폰을 착용한 인물 · 제품 사용 장면 콘셉트 이미지';
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="note"]').textContent = '가상 사용 상황 · 소음 감소 및 주변음 성능은 실제 시험 전';
  },
  build(tl) {
    const moment = root.querySelector('[data-role="moment"]');
    const note = root.querySelector('[data-role="note"]');
    const setMoment = (index) => {
      moment.replaceChildren();
      const number = document.createElement('span');
      number.className = 'commute__step';
      number.textContent = `0${index + 1}`;
      const title = document.createElement('strong');
      title.textContent = MOMENTS[index][0];
      const body = document.createElement('p');
      body.textContent = MOMENTS[index][1];
      moment.append(number, title, body);
      note.textContent = index === 2
        ? '가상 사용 상황 · 주변음 기능의 성능은 실제 시험 전'
        : '가상 출퇴근 장면 · 기능 성능을 측정한 자료가 아님';
    };
    tl.fromTo(root.querySelector('.commute__copy'), { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .12 }, 0);
    tl.call(setMoment, [0], .12);
    tl.call(setMoment, [1], .42);
    tl.call(setMoment, [2], .72);
    tl.to(root.querySelector('.commute__shade'), { '--shade': .86, duration: .12 }, .02);
  },
  unmount() { root = null; },
};
