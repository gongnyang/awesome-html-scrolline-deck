// horizontal-gallery — assets.images pan sideways while the pin holds.
let root = null;
let captions = [];

const pad = (n) => String(n).padStart(2, '0');

export default {
  id: '04-gallery',

  mount(section, ctx) {
    root = section.querySelector('.gal') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const images = (scene.assets || {}).images || [];

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    const alt = (scene.assets || {}).imageAlt || [];
    captions = images.map((_, index) => scene.assets?.imageCaptions?.[index] || {
      title: alt[index] || copy.title || '', line: (copy.lines || [])[0] || '',
    });
    root.querySelector('[data-role="series"]').textContent = copy.title || '';
    root.querySelector('[data-role="title"]').textContent = captions[0]?.title || '';
    root.querySelector('[data-role="line"]').textContent = captions[0]?.line || '';
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
      const label = document.createElement('figcaption');
      label.className = 'gal__item-label';
      label.textContent = captions[index]?.title || alt[index] || '';
      figure.append(label);
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
    const title = root.querySelector('[data-role="title"]');
    const line = root.querySelector('[data-role="line"]');
    let shown = 0;

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
        if (index !== shown) {
          shown = index;
          title.textContent = captions[index]?.title || '';
          line.textContent = captions[index]?.line || '';
        }
        count.textContent = `${pad(index + 1)} / ${pad(total)}`;
      },
    }, 0.16);

    // exit — 0.75 .. 1.00. Dim into the next scene.
    tl.to(root.querySelector('.gal__dim'), { opacity: 0.28, duration: 0.07 }, 0.93);
  },

  unmount() { root = null; captions = []; },
};
