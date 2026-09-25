let root = null;
export default {
  id: '07-annotation',
  mount(section, ctx) {
    root = section.querySelector('.a') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = (copy.lines || []).slice(0, 4);
    const times = Array.isArray(scene.assets?.times) ? scene.assets.times : [];
    const timeHost = root.querySelector('[data-role="times"]');
    timeHost.replaceChildren(...times.map((time) => {
      const tick = document.createElement('span');
      tick.textContent = `${time}시`;
      return tick;
    }));
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="unit"]').textContent = scene.assets?.unit || '';
    const svg = root.querySelector('.a__line');
    const dots = root.querySelector('[data-role="dots"]');
    const empty = root.querySelector('[data-role="empty"]');
    const values = Array.isArray(scene.assets?.series) ? scene.assets.series.map(Number) : [];
    const valid = values.length >= 2 && values.length <= 20 && values.every((value) => Number.isFinite(value) && value >= 0 && value <= 100);
    if (valid) {
      empty.hidden = true;
      const points = values.map((value, index) => [index / (values.length - 1) * 100, 100 - value]);
      const d = points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
      const area = `${d} L100 100 L0 100 Z`;
      svg.innerHTML = `<defs><linearGradient id="annotation-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".18"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs><path d="${area}" fill="url(#annotation-shade)"/><path d="${d}" fill="none" stroke="var(--accent)" stroke-width="3" vector-effect="non-scaling-stroke"/>`;
      dots.innerHTML = points.map(([x, y], index) => `<i style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%"${index === 0 ? ' class="is-selected"' : ''}></i>`).join('');
    } else {
      empty.hidden = false;
      empty.textContent = '데이터 계열을 assets.series에 입력하면 곡선이 나타납니다.';
    }
    root.querySelector('.a__callout').textContent = valid ? (lines[0] || copy.title || '') : '';
    root.querySelector('[data-role="source"]').textContent = valid ? lines.slice(1, 3).filter(Boolean).join(' · ') : '';
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
    const empty = root.querySelector('.a__empty');
    if (!empty.hidden) tl.fromTo(empty, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, 0.12);
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
