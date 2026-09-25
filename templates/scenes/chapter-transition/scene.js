// chapter-transition — carry a chapter marker into the concrete questions the
// new section will answer. The scroll builds the agenda, then leaves it held.
let root = null;

export default {
  id: '{{id}}',
  mount(section, ctx) {
    root = section.querySelector('.c') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const kicker = copy.kicker || '';
    const number = kicker.match(/\d+/)?.[0] || '01';
    root.querySelector('[data-role="kicker"]').textContent = kicker;
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('.c__number').textContent = number.padStart(2, '0');
    const list = root.querySelector('[data-role="steps"]');
    list.replaceChildren(...(copy.lines || []).slice(0, 4).map((line, index) => {
      const item = document.createElement('li');
      item.className = 'c__step';
      item.dataset.step = String(index);
      const indexLabel = document.createElement('span');
      indexLabel.className = 'c__step-index';
      indexLabel.textContent = String(index + 1).padStart(2, '0');
      const text = document.createElement('span');
      text.className = 'c__step-text';
      text.textContent = line;
      item.append(indexLabel, text);
      return item;
    }));
  },
  build(tl, ctx) {
    const number = root.querySelector('.c__number');
    const field = root.querySelector('.c__field');
    const heading = root.querySelector('.c__head');
    const steps = [...root.querySelectorAll('.c__step')];
    const cues = ctx.data.scene.cues || [];

    if (ctx.reduced) {
      ctx.gsap.set([number, field, heading, ...steps], { autoAlpha: 1, x: 0, y: 0, scale: 1, scaleX: 1 });
      return;
    }

    // enter — the chapter marker and first question establish the new section.
    tl.fromTo(number, { scale: 1.22, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.16, ease: 'power3.out' }, 0.02);
    tl.fromTo(field, { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 0.24, ease: 'power2.inOut' }, 0.08);
    tl.fromTo(heading, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12, ease: 'power2.out' }, 0.12);
    // hold — the ordered speaking beats settle by the central presentation stop.
    steps.forEach((step, index) => {
      const fallbackCue = 0.18 + 0.27 * ((index + 1) / Math.max(steps.length, 1));
      const at = Math.max(0.16, Math.min(0.425, Number(cues[index] ?? fallbackCue) - 0.025));
      tl.fromTo(step, { x: 24, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.04, ease: 'power2.out' }, at);
    });
    // exit — clear the section transition before the next evidence scene.
    tl.to(field, { scaleX: 0, transformOrigin: 'right center', duration: 0.12, ease: 'none' }, 0.86);
    tl.to(root, { autoAlpha: 1, duration: 0.1, ease: 'none' }, 0.9);
  },
  unmount() { root = null; },
};
