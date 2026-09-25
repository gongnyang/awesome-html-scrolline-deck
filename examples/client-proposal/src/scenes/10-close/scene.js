let root = null;

export default {
  id: '10-close',
  mount(section, ctx) {
    root = section.querySelector('.commit');
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="source"]').textContent = scene.source || '';
    const asks = (copy.lines || []).slice(0, 3).map((line, index) => {
      const [label, ...rest] = String(line).split(':');
      const row = document.createElement('div');
      row.className = 'commit__ask';
      row.dataset.step = String(index);
      const title = document.createElement('strong');
      title.textContent = label || `0${index + 1}`;
      const detail = document.createElement('p');
      detail.textContent = rest.join(':').trim();
      row.append(title, detail);
      return row;
    });
    root.querySelector('[data-role="asks"]').replaceChildren(...asks);
  },
  build(tl) {
    tl.fromTo(root.querySelector('.commit__head'), { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .18, ease: 'power2.out' }, .02);
    tl.fromTo(root.querySelector('.commit__giant'), { scale: 1.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .25, ease: 'power3.out' }, .08);
    [...root.querySelectorAll('.commit__ask')].forEach((item, i) => tl.fromTo(item, { x: 64, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: .09, ease: 'power2.out' }, .17 + i * .1));
    tl.fromTo(root.querySelector('.commit__sign'), { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .1 }, .46);
    tl.to(root, { autoAlpha: 0, y: -22, duration: .12 }, .87);
  },
  unmount() { root = null; },
};
