// paper-assembly — assets.images fly in from off-stage and settle into a fan.
let root = null;

// Both layouts are derived from the sheet count, so 3 or 8 images both work.
const scatterFor = (index) => ({
  x: `${index % 2 ? 42 : -42}vw`,
  y: `${((index % 3) - 1) * 14}vh`,
  r: (index % 2 ? 13 : -15) + (index % 3) * 2,
});

const fanFor = (index, total) => {
  const t = total > 1 ? index / (total - 1) : 0.5;
  const x = -47 + t * 94;
  return { x, y: -7 + (Math.abs(x) / 47) * 9, r: x * 0.32 };
};

export default {
  id: '{{id}}',

  mount(section, ctx) {
    root = section.querySelector('.pa') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const images = (scene.assets || {}).images || [];

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="line"]').textContent = (copy.lines || [])[0] || '';
    root.querySelector('[data-role="stage"]').innerHTML = images
      .map((src, index) => `<img class="pa__sheet" src="${src}" alt="${copy.title || ''} ${index + 1}" decoding="async" />`)
      .join('');
  },

  build(tl) {
    const stage = root.querySelector('[data-role="stage"]');
    const sheets = [...root.querySelectorAll('.pa__sheet')];
    const copy = root.querySelector('.pa__copy');
    const line = root.querySelector('.pa__line');
    const total = sheets.length;

    // enter — 0 .. 0.30. Pages arrive from off-stage, one after another.
    tl.fromTo(copy, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.08, ease: 'power2.out' }, 0);
    sheets.forEach((sheet, index) => {
      const from = scatterFor(index);
      tl.fromTo(sheet,
        { x: from.x, y: from.y, rotation: from.r, autoAlpha: 0 },
        { x: 0, y: 0, rotation: 0, autoAlpha: 1, duration: 0.18, ease: 'power2.out' }, index * 0.015);
    });

    // hold — 0.30 .. 0.75. The stack opens into a fan you can count.
    sheets.forEach((sheet, index) => {
      const to = fanFor(index, total);
      tl.to(sheet, { xPercent: to.x, yPercent: to.y, rotation: to.r, duration: 0.22, ease: 'power2.inOut' }, 0.34);
    });
    tl.fromTo(line, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1, ease: 'power2.out' }, 0.5);

    // exit — 0.75 .. 1.00. The whole set files away into the corner.
    tl.to(stage, { xPercent: 42, yPercent: 44, scale: 0.2, autoAlpha: 0, duration: 0.18, ease: 'power2.in' }, 0.8);
    tl.to([copy, line], { autoAlpha: 0, duration: 0.12, ease: 'none' }, 0.84);
  },

  unmount() { root = null; },
};
