let root = null;

export default {
  id: '09-governance',
  mount(section, ctx) {
    root = section.querySelector('.go');
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    const image = root.querySelector('.go__image');
    image.src = scene.assets?.images?.[0] || '';
    image.alt = '운영 기준을 함께 검토하는 가상 현장 콘셉트 이미지';
    const steps = [['관찰', '혼잡 시간대'], ['익명화', '식별 정보 제외'], ['집계', '대기·상품군']];
    root.querySelector('[data-role="flow"]').replaceChildren(...steps.map(([name, detail], i) => {
      const item = document.createElement('p');
      item.className = 'go__step';
      item.dataset.step = String(i);
      item.append(document.createTextNode(name));
      const small = document.createElement('small');
      small.textContent = detail;
      item.append(small);
      return item;
    }));
    root.querySelector('[data-role="rule"]').textContent = copy.lines?.[1] || '';
    root.querySelector('[data-role="source"]').textContent = scene.source || '';
  },
  build(tl) {
    const visual = root.querySelector('.go__visual');
    const head = root.querySelector('.go__head');
    const zero = root.querySelector('.go__zero');
    const steps = [...root.querySelectorAll('.go__step')];
    tl.fromTo(visual, { scale: 1.08, autoAlpha: .35 }, { scale: 1, autoAlpha: 1, duration: .34, ease: 'power2.out' }, 0);
    tl.fromTo(head, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .16 }, .04);
    tl.fromTo(zero, { y: 78, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .18, ease: 'power3.out' }, .16);
    steps.forEach((step, i) => tl.fromTo(step, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .06 }, .28 + i * .07));
    tl.fromTo(root.querySelector('.go__rule'), { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .08 }, .45);
    tl.to(root, { autoAlpha: 0, y: -22, duration: .12 }, .86);
  },
  unmount() { root = null; },
};
