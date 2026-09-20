// tilt-card — a portrait (assets.images[0]) holds one side of the frame while
// copy.lines read as hairline-ruled rows on the other.
let root = null;

export default {
  id: '03-hero',

  mount(section, ctx) {
    root = section.querySelector('.tc') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const assets = scene.assets || {};
    const image = (assets.images || [])[0];

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="lines"]').innerHTML = (copy.lines || [])
      .map((line) => `<li>${line}</li>`).join('');

    // Optional credit under the portrait, e.g. "assets": { "caption": "Photo: ..." }.
    root.querySelector('[data-role="caption"]').textContent = assets.caption || '';
    if (image) {
      root.querySelector('[data-role="portrait"]')
        .insertAdjacentHTML('afterbegin', `<img src="${image}" alt="${copy.title || ''}" decoding="async" />`);
    }
  },

  build(tl) {
    const portrait = root.querySelector('[data-role="portrait"]');
    const kicker = root.querySelector('.tc__kicker');
    const title = root.querySelector('.tc__title');
    const items = [...root.querySelectorAll('.tc__list li')];

    // enter — 0 .. 0.30. The portrait slides in, then the rows stack up.
    tl.fromTo(portrait, { xPercent: 14, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.2, ease: 'power2.out' }, 0);
    tl.fromTo([kicker, title], { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12, stagger: 0.04, ease: 'power2.out' }, 0.04);
    if (items.length) {
      tl.fromTo(items, { x: -20, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.12, stagger: 0.04, ease: 'power2.out' }, 0.12);
    }

    // hold — 0.30 .. 0.75. A slow tilt keeps the frame alive while you talk.
    tl.fromTo(portrait, { '--tilt': -1.6, '--shift': 1.2 }, { '--tilt': 1.6, '--shift': -1.2, duration: 0.42, ease: 'none' }, 0.32);

    // exit — 0.75 .. 1.00. The whole frame drops away.
    tl.to(root, { yPercent: 14, autoAlpha: 0, duration: 0.18, ease: 'power2.in' }, 0.8);
  },

  unmount() { root = null; },
};
