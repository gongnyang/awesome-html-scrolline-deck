let root = null;
const node = (tag, className, text = '') => { const el = document.createElement(tag); el.className = className; el.textContent = text; return el; };
export default {
  id: '06-findings',
  mount(section, ctx) {
    root = section.querySelector('.ch') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = (copy.lines || []).slice(0, 4);
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    const chartHost = root.querySelector('[data-role="chart"]');
    const parsed = lines.map((line) => {
      const parts = String(line).split(':');
      const display = String(parts.slice(1).join(':')).trim();
      const raw = display.replace(/,/g, '');
      const value = raw === '' ? Number.NaN : Number(raw);
      return { label: parts[0].trim(), value: Number.isFinite(value) && value >= 0 ? value : null, display };
    });
    const max = Math.max(1, ...parsed.map(({ value }) => value ?? 0));
    chartHost.replaceChildren(...parsed.map(({ label, value, display }) => {
      const bar = node('div', 'ch__bar');
      bar.style.height = `${value === null ? 0 : Math.max(2, value / max * 100)}%`;
      bar.setAttribute('aria-label', value === null ? `${label}: 값 없음` : `${label}: ${display}`);
      const amount = node('span', '', value === null ? '—' : display);
      bar.append(amount);
      if (value === null) bar.classList.add('is-missing');
      return bar;
    }));
    root.querySelector('.ch__labels').replaceChildren(...parsed.map(({ label }) => node('span', '', label)));
  },
  build(tl, ctx) {
        // enter — 0 .. 0.30
        const bars = [...root.querySelectorAll('.ch__bar')];
    tl.fromTo(bars, { scaleY: 0, autoAlpha: 0 }, { scaleY: 1, autoAlpha: 1, duration: 0.2, stagger: 0.045, ease: 'power2.out' }, 0.04);
    tl.fromTo(root.querySelector('.ch__title'), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12 }, 0);
    tl.to(root, { autoAlpha: 0, y: -28, duration: 0.16 }, 0.82);
    // hold — 0.30 .. 0.75
    // Keep the composed state readable while the presenter speaks.
    // exit — 0.75 .. 1.00
  },
  unmount() { root = null; },
};
