// horizontal-gallery — assets.images pan sideways while the pin holds.
let root = null;

const pad = (n) => String(n).padStart(2, '0');

export default {
  id: '{{id}}',

  mount(section, ctx) {
    root = section.querySelector('.gal') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const images = (scene.assets || {}).images || [];

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="line"]').textContent = (copy.lines || [])[0] || '';
    const alt = (scene.assets || {}).imageAlt || [];
    root.querySelector('[data-role="track"]').replaceChildren(...images.map((src, index) => {
      const figure = document.createElement('figure');
      figure.className = 'gal__item';
      const image = document.createElement('img');
      image.src = src;
      image.alt = alt[index] || `${copy.title || '장면'} ${index + 1}`;
      image.decoding = 'async';
      image.loading = index === 0 ? 'eager' : 'lazy';
      if (index === 0) image.setAttribute('fetchpriority', 'high');
      figure.append(image);
      return figure;
    }));
    root.querySelectorAll('.gal__item').forEach((item, index) => {
      item.style.opacity = index === 0 ? '1' : '0';
    });
    root.querySelector('[data-role="count"]').textContent = `${pad(1)} / ${pad(images.length)}`;
  },

  build(tl) {
    const count = root.querySelector('[data-role="count"]');
    const caption = root.querySelector('.gal__caption');
    const first = root.querySelector('.gal__item');
    const items = [...root.querySelectorAll('.gal__item')];
    const total = items.length;

    // enter — 0 .. 0.30. The first image and the talk's framing statement settle.
    if (first) tl.fromTo(first, { '--clip': 18 }, { '--clip': 0, duration: 0.18, ease: 'power2.out' }, 0);
    tl.fromTo(caption, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.14, ease: 'power2.out' }, 0);

    // hold — each image arrives, fills the stage, and remains still until the next beat.
    const step = total > 1 ? 0.5 / (total - 1) : 0;
    for (let index = 1; index < total; index += 1) {
      const at = 0.18 + (index - 1) * step;
      tl.fromTo(items[index], { autoAlpha: 0, scale: 1.025 }, { autoAlpha: 1, scale: 1, duration: 0.05, ease: 'power2.out' }, at);
      tl.to(items[index - 1], { autoAlpha: 0, duration: 0.04, ease: 'none' }, at + 0.01);
      tl.call(() => { count.textContent = `${pad(index + 1)} / ${pad(total)}`; }, null, at + 0.05);
    }

    // exit — 0.75 .. 1.00. Dim the held final image into the next scene.
    tl.to(root.querySelector('.gal__dim'), { opacity: 0.72, duration: 0.18 }, 0.8);
  },

  unmount() { root = null; },
};
