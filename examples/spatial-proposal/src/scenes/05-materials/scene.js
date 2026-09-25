let root = null;
const node = (tag, className, text = '') => {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
};

export default {
  id: '05-materials',

  mount(section, ctx) {
    root = section.querySelector('.materials') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const assets = scene.assets || {};
    const materials = copy.materials || [];
    const images = assets.images || [];
    const alts = assets.imageAlt || [];

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="note"]').textContent = copy.note || '';
    const board = root.querySelector('[data-role="materials"]');
    board.replaceChildren(...materials.slice(0, 4).map((material, index) => {
      const item = node('li', 'materials__item');
      const figure = node('figure', 'materials__figure');
      const image = node('img', 'materials__image');
      image.src = images[index] || '';
      image.alt = alts[index] || `${material.name || '마감재'} 표면 이미지`;
      image.loading = index === 0 ? 'eager' : 'lazy';
      image.decoding = 'async';
      figure.append(image);

      const copyBlock = node('div', 'materials__copy');
      copyBlock.append(node('span', 'materials__number', String(material.number || String(index + 1).padStart(2, '0'))));
      copyBlock.append(node('h3', 'materials__name', material.name || ''));
      copyBlock.append(node('p', 'materials__reason', material.reason || ''));
      item.append(figure, copyBlock);
      return item;
    }));
  },

  build(tl) {
    const items = [...root.querySelectorAll('.materials__item')];
    const images = [...root.querySelectorAll('.materials__image')];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      tl.set(items, { autoAlpha: 1, y: 0 });
      tl.set(images, { scale: 1 });
      return;
    }

    items.forEach((item, index) => {
      const start = 0.035 + index * 0.075;
      const image = item.querySelector('.materials__image');
      tl.fromTo(item,
        { y: 28, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.13, ease: 'power2.out' }, start);
      tl.fromTo(image,
        { scale: 1.08 },
        { scale: 1, duration: 0.2, ease: 'power2.out' }, start);
    });
    tl.to(root, { autoAlpha: 0, y: -18, duration: 0.14, ease: 'none' }, 0.86);
  },

  unmount() { root = null; },
};
