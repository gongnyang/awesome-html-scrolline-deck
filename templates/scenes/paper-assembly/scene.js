// paper-assembly — the lead source is readable at the held frame; supporting
// pages gather around it so their evidence relationship is visible at a glance.
let root = null;

const placements = (index, total, mobile) => {
  if (mobile) return { x: 0, y: 0, rotation: 0 };
  if (index === 0) return { x: '0vw', y: '0vh', rotation: 0 };
  const slots = [
    { x: '-27vw', y: '-10vh', rotation: -8 },
    { x: '27vw', y: '-10vh', rotation: 8 },
    { x: '-31vw', y: '16vh', rotation: -10 },
    { x: '31vw', y: '16vh', rotation: 10 },
  ];
  return slots[(index - 1) % slots.length];
};

export default {
  id: '{{id}}',
  mount(section, ctx) {
    root = section.querySelector('.pa') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const assets = scene.assets || {};
    const images = assets.images || [];
    const labels = assets.imageAlt || [];

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="line"]').textContent = (copy.lines || [])[0] || '';
    root.querySelector('[data-role="stage"]').replaceChildren(...images.map((src, index) => {
      const figure = document.createElement('figure');
      figure.className = `pa__sheet${index === 0 ? ' pa__sheet--lead' : ' pa__sheet--support'}`;
      figure.dataset.index = String(index);
      const image = document.createElement('img');
      image.src = src;
      image.alt = labels[index] || `${copy.title || '자료'} · ${index + 1}`;
      image.decoding = 'async';
      const caption = document.createElement('figcaption');
      caption.textContent = labels[index] || `자료 ${String(index + 1).padStart(2, '0')}`;
      figure.append(image, caption);
      return figure;
    }));
  },
  build(tl, ctx) {
    const copy = root.querySelector('.pa__copy');
    const line = root.querySelector('.pa__line');
    const sheets = [...root.querySelectorAll('.pa__sheet')];
    const cues = ctx.data.scene.cues || [];
    const mobile = !!ctx.mobile;

    if (ctx.reduced) {
      ctx.gsap.set([copy, line, ...sheets], { autoAlpha: 1, x: 0, y: 0, rotation: 0, scale: 1 });
      return;
    }

    // enter — the lead page appears first, followed by the supporting pages.
    tl.fromTo(copy, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1, ease: 'power2.out' }, 0.02);
    sheets.forEach((sheet, index) => {
      const fallbackCue = 0.18 + 0.27 * ((index + 1) / Math.max(sheets.length, 1));
      const start = Math.max(0.03, Math.min(0.36, Number(cues[index] ?? fallbackCue) - 0.09));
      const target = placements(index, sheets.length, mobile);
      const lead = index === 0;
      tl.fromTo(sheet,
        { x: index % 2 ? '50vw' : '-50vw', y: '24vh', rotation: index % 2 ? 13 : -13, autoAlpha: 0 },
        { x: target.x, y: target.y, rotation: target.rotation, autoAlpha: 1, duration: 0.09, ease: 'power2.out' },
        start);
      if (lead) tl.fromTo(sheet, { scale: 0.94 }, { scale: 1, duration: 0.12, ease: 'power2.out' }, start + 0.1);
    });
    // hold — the claim and all labels stay readable for the presenter.
    tl.fromTo(line, { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1, ease: 'power2.out' }, 0.42);
    // exit — the assembled page set leaves as one composition.
    tl.to([copy, line, ...sheets], { autoAlpha: 1, duration: 0.1, ease: 'none' }, 0.9);
  },
  unmount() { root = null; },
};
