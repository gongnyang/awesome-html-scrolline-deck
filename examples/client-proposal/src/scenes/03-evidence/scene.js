let root = null;
export default {
  id: '03-evidence',
  mount(section, ctx) {
    root = section.querySelector('.a') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = (copy.lines || []).slice(0, 4);
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    const svg = root.querySelector('.a__line');
    const values = Array.isArray(scene.assets?.series) ? scene.assets.series.map(Number) : [];
    const valid = values.length >= 2 && values.length <= 20 && values.every((value) => Number.isFinite(value) && value >= 0 && value <= 100);
    if (valid) {
      const points = values.map((value, index) => [index / (values.length - 1) * 100, 100 - value]);
      const d = points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
      svg.innerHTML = `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/><circle cx="${points.at(-1)[0].toFixed(2)}" cy="${points.at(-1)[1].toFixed(2)}" r="2" fill="currentColor"/>`;
    } else {
      root.querySelector('[data-role="empty"]').textContent = '데이터 계열을 assets.series에 입력하면 곡선이 나타납니다.';
    }
    root.querySelector('.a__callout').textContent = valid ? (lines[0] || copy.title || '') : '';
    root.querySelector('[data-role="source"]').textContent = valid ? (lines[1] || '') : '';
    if (valid) {
      const peak = values.indexOf(Math.max(...values));
      root.querySelector('.a__callout').style.setProperty('--callout-x', String(peak / (values.length - 1) * 100));
      root.querySelector('.a__callout').style.setProperty('--callout-y', String(100 - values[peak]));
    }
  },
  build(tl, ctx) {
    // enter — 0 .. 0.30
    const line = root.querySelector('.a__line');
    if (line.querySelector('path')) tl.fromTo(line, { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 0.25, ease: 'power2.out' }, 0.02);
    tl.fromTo(root.querySelector('.a__empty'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, 0.12);
    tl.fromTo(root.querySelector('.a__callout'), { x: 24, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.14 }, 0.25);
    tl.fromTo(root.querySelector('.a__source'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0.26);
    tl.fromTo(root.querySelector('.a__title'), { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12 }, 0);
    tl.to(root, { autoAlpha: 0, duration: 0.15 }, 0.84);
    // hold — 0.30 .. 0.75
    // Keep the composed state readable while the presenter speaks.
    // exit — 0.75 .. 1.00
  },
  unmount() { root = null; },
};
