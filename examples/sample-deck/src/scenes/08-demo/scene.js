// frame-scrub-video — the wheel is the play head; the lines land one by one.
let root = null;
let scrub = null;

export default {
  id: '08-demo',

  mount(section, ctx) {
    root = section.querySelector('.fsv') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const assets = scene.assets || {};

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="lines"]').replaceChildren(...(copy.lines || []).map((line, index) => {
      const item = document.createElement('li');
      const number = document.createElement('b');
      number.textContent = String(index + 1).padStart(2, '0');
      const text = document.createElement('span');
      text.textContent = line;
      item.append(number, text);
      return item;
    }));

    const sequence = root.querySelector('[data-role="sequence"]');
    sequence.replaceChildren(...(assets.images || []).map((src, index) => {
      const figure = document.createElement('figure');
      figure.className = 'fsv__state';
      const img = document.createElement('img');
      img.src = src;
      img.alt = assets.imageAlt?.[index] || ['변화 전', '변화 중', '변화 후'][index];
      const caption = document.createElement('figcaption');
      caption.textContent = ['변화 전', '변화 중', '변화 후'][index];
      figure.append(img, caption);
      return figure;
    }));
  },

  build(tl) {
    const copy = root.querySelector('.fsv__copy');
    const lines = [...root.querySelectorAll('.fsv__lines li')];
    const states = [...root.querySelectorAll('.fsv__state')];

    // Reveal a real, recognizable subject in three clear stages.
    tl.fromTo(copy, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1, ease: 'power2.out' }, 0);
    tl.fromTo(states, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .14, stagger: .09 }, .06);
    lines.forEach((line, index) => {
      tl.fromTo(line, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.09, ease: 'power2.out' }, 0.36 + index * .08);
    });

    // Keep the three-state explanation with the recognizable subject through the exit.
  },

  unmount() {
    if (scrub && typeof scrub.destroy === 'function') scrub.destroy();
    scrub = null;
    root = null;
  },
};
