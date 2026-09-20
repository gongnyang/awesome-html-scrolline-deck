// wipe-transform — three surfaces, one diagonal wipe. assets.images[0] is the
// first surface, assets.video (or images[1]) the second, the rest the third.
// copy.lines[0..2] are the three captions.
let root = null;
let media = null;

export default {
  id: '05-shift',

  mount(section, ctx) {
    root = section.querySelector('.wt') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const assets = scene.assets || {};
    const images = assets.images || [];
    const lines = copy.lines || [];

    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="step"]').textContent = lines[0] || '';

    const one = root.querySelector('[data-role="one"]');
    if (images[0]) one.innerHTML = `<img src="${images[0]}" alt="" decoding="async" />`;

    const two = root.querySelector('[data-role="two"]');
    if (assets.video && !ctx.reduced) {
      two.innerHTML = `<video muted playsinline loop preload="metadata" poster="${assets.poster || ''}" aria-hidden="true"><source src="${assets.video}" type="video/mp4" /></video>`;
      media = two.querySelector('video');
      const play = media && media.play();
      if (play && typeof play.catch === 'function') play.catch(() => {});
    } else if (assets.poster || images[1]) {
      two.innerHTML = `<img src="${assets.poster || images[1]}" alt="" decoding="async" />`;
    }

    const rest = images.slice(assets.video ? 1 : 2);
    root.querySelector('[data-role="three"]').innerHTML = rest.slice(0, 3)
      .map((src) => `<img src="${src}" alt="" decoding="async" />`).join('');
  },

  build(tl, ctx) {
    const scene = ctx.data.scene || {};
    const lines = (scene.copy || {}).lines || [];
    const one = root.querySelector('[data-role="one"]');
    const two = root.querySelector('[data-role="two"]');
    const sheets = [...root.querySelectorAll('[data-role="three"] img')];
    const scan = root.querySelector('.wt__scan');
    const caption = root.querySelector('.wt__caption');
    const num = root.querySelector('[data-role="num"]');
    const step = root.querySelector('[data-role="step"]');
    const title = root.querySelector('[data-role="title"]');

    ctx.gsap.set(sheets, { '--rise': 110, '--tilt': 12 });
    ctx.gsap.set(title, { autoAlpha: 0 });

    // enter — 0 .. 0.30. The first surface sharpens, the wipe crosses it.
    // 흐림 대신 크기와 투명도로 들어온다 — 이 장면의 판에는 filter 를 걸지 않는다(scene.css 주석).
    // 두 판 모두 항등 변환(scale 1)으로는 서 있지 않게 한다. 전체 화면 이미지를 담은
    // 레이어가 완전히 정지하면 다시 칠해지지 않는 브라우저가 있다(scene.css 주석 참고).
    tl.fromTo(one, { scale: 1.14, autoAlpha: 0 }, { scale: 1.012, autoAlpha: 1, duration: 0.1, ease: 'power2.out' }, 0);
    tl.fromTo(two, { scale: 1.012 }, { scale: 1.05, duration: 0.7, ease: 'none' }, 0.05);
    // 캔버스 베일을 장면 내내 아주 조금씩 걷는다. 그림이 도착하는 느낌을 주는 동시에,
    // 칠할 거리가 계속 생겨 큰 판이 한 번도 안 칠해진 채 서 있는 일이 없다.
    tl.fromTo([one, two], { '--dim': 0.82 }, { '--dim': 1, duration: 0.42, ease: 'none' }, 0);
    tl.fromTo(caption, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1 }, 0);
    // 와이프는 캡션이 02 로 바뀌기 직전(0.32)에 닿는다. 30% 지점이 '넘어가는 중'이 되도록.
    tl.fromTo(two, { '--wipe': 0 }, { '--wipe': 120, duration: 0.2, ease: 'power3.inOut' }, 0.12);
    tl.fromTo(scan, { '--x': -8, '--scan': 1 }, { '--x': 108, '--scan': 0, duration: 0.2, ease: 'none' }, 0.12);

    // hold — 0.30 .. 0.75. Caption swaps as the third surface rises.
    // 첫 판도 홀드 내내 같은 속도로 따라 민다.
    tl.to(one, { scale: 1.05, duration: 0.45, ease: 'none' }, 0.3);
    tl.to(caption, { autoAlpha: 0, duration: 0.04 }, 0.32);
    // gsap 은 set 값을 숫자로 파싱해서 '02' 를 2 로 적어 넣는다. 앞의 0 을 지키려면
    // 문자열을 직접 넣어야 한다 — 캡션 번호는 01·02·03 으로 읽혀야 한다.
    // call 은 되감을 때도 지나가는 순서대로 불린다. 바로 앞에 복귀용 call 을 하나씩
    // 두어야 위로 굴렸을 때 번호가 01 로 되돌아온다.
    tl.call(() => { num.textContent = '01'; }, null, 0.35);
    tl.call(() => { num.textContent = '02'; }, null, 0.36);
    tl.set(step, { textContent: lines[1] || '' }, 0.36);
    tl.to(caption, { autoAlpha: 1, duration: 0.08 }, 0.36);
    tl.to(two, { '--dim': 0.74, duration: 0.29, ease: 'none' }, 0.46);
    sheets.forEach((sheet, index) => {
      tl.to(sheet, { '--rise': 0, '--tilt': 0, duration: 0.16, ease: 'power3.out' }, 0.46 + index * 0.04);
    });
    tl.to(caption, { autoAlpha: 0, duration: 0.04 }, 0.62);
    tl.call(() => { num.textContent = '02'; }, null, 0.65);
    tl.call(() => { num.textContent = '03'; }, null, 0.66);
    tl.set(step, { textContent: lines[2] || '' }, 0.66);
    tl.to([caption, title], { autoAlpha: 1, duration: 0.08 }, 0.66);

    // exit — 0.75 .. 1.00. The finished surface pushes out of frame.
    tl.to(root, { scale: 1.05, autoAlpha: 0, duration: 0.18, ease: 'power2.in' }, 0.8);
  },

  unmount() {
    if (media && typeof media.pause === 'function') media.pause();
    media = null;
    root = null;
  },
};
