let root = null;

const pointsFor = (values) => values.map((value, index) => {
  const x = 65 + index * 174;
  // The visible 0..100 scale occupies y=280..30 in the SVG viewBox.
  const y = 280 - value * 2.5;
  return [x, y];
});

export default {
  id: '03-evidence',
  mount(section, ctx) {
    root = section.querySelector('.queue-chart') || section;
    const scene = ctx.data.scene || {};
    const values = Array.isArray(scene.assets?.series) ? scene.assets.series.map(Number) : [];
    const safe = values.length === 6 && values.every((value) => Number.isFinite(value) && value >= 0 && value <= 100)
      ? values : [35, 58, 82, 100, 74, 40];
    const points = pointsFor(safe);
    const route = points.map(([x, y], index) => `${index ? 'L' : 'M'} ${x} ${y}`).join(' ');
    root.querySelector('[data-role="kicker"]').textContent = scene.copy?.kicker || '';
    root.querySelector('[data-role="title"]').textContent = scene.copy?.title || '';
    root.querySelector('[data-role="source"]').textContent = scene.copy?.lines?.[1] || '가상 현장 기록 · 관측 자료 아님';
    root.querySelector('[data-role="wait"]').textContent = String(scene.assets?.peakWaitMinutes ?? '8.4');
    root.querySelector('[data-role="area"]').setAttribute('d', `${route} L 935 280 L 65 280 Z`);
    root.querySelector('[data-role="line"]').setAttribute('d', route);
    root.querySelector('[data-role="peak"]').setAttribute('cx', String(points[3][0]));
    root.querySelector('[data-role="peak"]').setAttribute('cy', String(points[3][1]));
    root.querySelector('[data-role="pulse"]').setAttribute('cx', String(points[3][0]));
    root.querySelector('[data-role="pulse"]').setAttribute('cy', String(points[3][1]));
    root.querySelector('[data-role="hours"]').replaceChildren(...['10시','11시','12시','13시','14시','15시'].map((label) => {
      const el = document.createElement('span');
      el.textContent = label;
      return el;
    }));
  },
  build(tl) {
    const area = root.querySelector('.queue-chart__area');
    const reveal = root.querySelector('[data-role="reveal"]');
    const band = root.querySelector('.queue-chart__band');
    const peak = root.querySelector('.queue-chart__peak');
    const pulse = root.querySelector('.queue-chart__pulse');
    const metric = root.querySelector('.queue-chart__metric');
    tl.fromTo(root.querySelector('.queue-chart__title'), { y: 64, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .15, ease:'power3.out' }, 0);
    // A clipping window follows the actual six-point series. Every point and
    // the terminal segment share one path, so the graph cannot stop early.
    tl.fromTo(reveal, { attr: { width: 0 } }, { attr: { width: 1000 }, duration: .25, ease: 'power2.inOut' }, .03);
    tl.fromTo(area, { autoAlpha: 0 }, { autoAlpha: 1, duration: .16 }, .09);
    tl.fromTo(band, { scaleY: 0, autoAlpha: 0, transformOrigin: '50% 100%' }, { scaleY: 1, autoAlpha: 1, duration: .13 }, .24);
    tl.fromTo(peak, { scale: 0, autoAlpha: 0, transformOrigin: 'center center' }, { scale: 1.1, autoAlpha: 1, duration: .08, ease:'back.out(2)' }, .27);
    tl.to(peak, { scale: 1, duration: .05 }, .35);
    tl.fromTo(pulse, { scale: .3, autoAlpha: .8, transformOrigin: 'center center' }, { scale: 2, autoAlpha: 0, duration: .19 }, .27);
    tl.fromTo(metric, { y: 70, scale: .8, autoAlpha: 0, transformOrigin: 'left bottom' }, { y: 0, scale: 1, autoAlpha: 1, duration: .17, ease:'back.out(1.5)' }, .29);
    tl.to(root, { autoAlpha: 0, duration: .14 }, .86);
  },
  unmount() { root = null; },
};
