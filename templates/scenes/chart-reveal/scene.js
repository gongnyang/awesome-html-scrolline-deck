let root = null;

const formatNumber = (value) => new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);

function parseLine(line) {
  const text = String(line);
  const divider = text.indexOf(':');
  const label = (divider < 0 ? '' : text.slice(0, divider)).trim();
  const display = (divider < 0 ? '' : text.slice(divider + 1)).trim();
  const numeric = display.replace(/,/g, '').match(/^-?\d+(?:\.\d+)?/);
  const value = numeric ? Number(numeric[0]) : Number.NaN;
  return { label: label || '범주', display: display || '자료 없음', value: Number.isFinite(value) && value >= 0 ? value : null };
}

function make(tag, className, text = '') {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

export default {
  id: '{{id}}',
  mount(section, ctx) {
    root = section.querySelector('.ch') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const data = (copy.lines || []).map(parseLine);
    const plot = root.querySelector('[data-role="plot"]');
    const scale = root.querySelector('[data-role="scale"]');
    const max = Math.max(0, ...data.map((entry) => entry.value ?? 0));
    const high = max || 1;
    const ticks = [high, high * 2 / 3, high / 3, 0];

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="source"]').textContent = scene.source ? `출처 · ${scene.source}` : '';
    scale.replaceChildren(...ticks.map((value) => make('span', 'ch__tick', formatNumber(value))));

    const items = data.map((entry) => {
      const item = make('div', 'ch__item');
      const bar = make('div', `ch__bar${entry.value === null ? ' is-missing' : ''}`);
      const amount = make('span', 'ch__value', entry.value === null ? '—' : entry.display);
      const category = make('span', 'ch__category', entry.label);
      const height = entry.value === null ? 0 : entry.value === 0 ? 0 : Math.max(1, entry.value / high * 82);
      bar.style.setProperty('--bar-height', String(height));
      bar.setAttribute('aria-label', `${entry.label}: ${entry.display}`);
      bar.append(amount);
      item.append(bar, category);
      return item;
    });

    plot.setAttribute('aria-label', data.map(({ label, display }) => `${label}: ${display}`).join('; '));
    plot.replaceChildren(...items);
  },
  build(tl) {
    const bars = [...root.querySelectorAll('.ch__bar')];
    const head = root.querySelector('.ch__head');
    const figure = root.querySelector('.ch__figure');

    // enter — the viewer reads the claim, then each exact value lands at its category.
    tl.fromTo(head, { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12, ease: 'power2.out' }, 0.02);
    tl.fromTo(bars, { scaleY: 0, autoAlpha: 1 }, { scaleY: 1, autoAlpha: 1, duration: 0.16, stagger: 0.055, ease: 'power2.out' }, 0.06);

    // hold — every bar, category, value, zero baseline, and source stay visible.

    // exit — send the completed evidence upward as the next question enters.
    tl.to(figure, { y: -18, autoAlpha: 1, duration: 0.14, ease: 'power2.in' }, 0.84);
    tl.to(head, { y: -10, autoAlpha: 1, duration: 0.1 }, 0.86);
  },
  unmount() { root = null; },
};
