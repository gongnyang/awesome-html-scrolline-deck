// horizontal-gallery — assets.images pan sideways while the pin holds.
let root = null;

const pad = (n) => String(n).padStart(2, '0');

export default {
  id: '04-postcards',

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
    root.querySelector('[data-role="count"]').textContent = `${pad(1)} / ${pad(images.length)}`;
  },

  build(tl) {
    const track = root.querySelector('[data-role="track"]');
    const count = root.querySelector('[data-role="count"]');
    const caption = root.querySelector('.gal__caption');
    const first = root.querySelector('.gal__item');
    const total = root.querySelectorAll('.gal__item').length;
    const pan = { p: 0 };

    // enter — 0 .. 0.30. The first frame opens and the caption settles.
    if (first) tl.fromTo(first, { '--clip': 18 }, { '--clip': 0, duration: 0.18, ease: 'power2.out' }, 0);
    tl.fromTo(caption, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.14, ease: 'power2.out' }, 0);

    // hold — 0.30 .. 0.75. The pan is the scene; the counter reads along.
    tl.fromTo(track, { xPercent: 0 }, { xPercent: -((total - 1) * 100), duration: 0.6, ease: 'none' }, 0.16);
    tl.fromTo(pan, { p: 0 }, {
      p: 1,
      duration: 0.6,
      ease: 'none',
      onUpdate: () => {
        const index = Math.min(total - 1, Math.round(pan.p * (total - 1)));
        count.textContent = `${pad(index + 1)} / ${pad(total)}`;
      },
    }, 0.16);

    // exit — 0.75 .. 1.00. Dim into the next scene.
    tl.to(root.querySelector('.gal__dim'), { opacity: 0.72, duration: 0.18 }, 0.8);
  },

  unmount() { root = null; },
};
