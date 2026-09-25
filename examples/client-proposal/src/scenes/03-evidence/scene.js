let root = null;

export default {
  id: '03-evidence',
  mount(section, ctx) {
    root = section.querySelector('.queue-chart') || section;
    const scene = ctx.data.scene || {};
    const values = Array.isArray(scene.assets?.series) ? scene.assets.series.map(Number) : [];
    const safe = values.length === 6 && values.every((value) => Number.isFinite(value) && value >= 0 && value <= 100)
      ? values
      : [35, 58, 82, 100, 74, 40];
    const centers = [90, 254, 418, 582, 746, 910];
    const bars = root.querySelector('[data-role="bars"]');

    root.querySelector('[data-role="kicker"]').textContent = scene.copy?.kicker || '가상 시나리오 · 시간대별 상대 혼잡 지수';
    root.querySelector('[data-role="title"]').textContent = scene.copy?.title || '';
    root.querySelector('[data-role="source"]').textContent = scene.copy?.lines?.[1] || '가상 관찰 예시 · 실측 자료 아님';
    root.querySelector('[data-role="wait"]').textContent = String(scene.assets?.peakWaitMinutes ?? '8.4');
    bars.replaceChildren(...safe.map((value, index) => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('class', `queue-chart__bar${index === 3 ? ' queue-chart__bar--peak' : ''}`);
      rect.setAttribute('x', String(centers[index] - 42));
      rect.setAttribute('y', String(280 - value * 2.5));
      rect.setAttribute('width', '84');
      rect.setAttribute('height', String(value * 2.5));
      rect.setAttribute('rx', '3');
      rect.setAttribute('data-value', String(value));
      rect.setAttribute('aria-label', `${10 + index}시, 지수 ${value}`);
      return rect;
    }));
    root.querySelector('[data-role="hours"]').replaceChildren(...['10시','11시','12시','13시','14시','15시'].map((label) => {
      const item = document.createElement('span');
      item.textContent = label;
      return item;
    }));
  },
  build(tl) {
    const bars = [...root.querySelectorAll('.queue-chart__bar')];
    const band = root.querySelector('.queue-chart__band');
    const metric = root.querySelector('.queue-chart__metric');
    tl.fromTo(root.querySelector('.queue-chart__title'), { y: 48, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .15, ease: 'power3.out' }, 0);
    tl.fromTo(bars, { scaleY: .02, transformOrigin: 'center bottom' }, { scaleY: 1, duration: .16, stagger: .035, ease: 'power2.out' }, .06);
    tl.fromTo(band, { scaleY: 0, autoAlpha: 0, transformOrigin: 'center bottom' }, { scaleY: 1, autoAlpha: 1, duration: .13 }, .23);
    tl.fromTo(metric, { y: 42, scale: .88, autoAlpha: 0, transformOrigin: 'left bottom' }, { y: 0, scale: 1, autoAlpha: 1, duration: .16, ease: 'power3.out' }, .25);
  },
  unmount() { root = null; },
};
