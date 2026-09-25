let root = null;
const make = (tag, cls, text = '') => { const node = document.createElement(tag); node.className = cls; node.textContent = text; return node; };
export default {
  id: '07-economics',
  mount(section, ctx) {
    root = section.querySelector('.channels') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="intro"]').textContent = copy.intro || '';
    root.querySelector('[data-role="source"]').textContent = copy.source || scene.source || '';
    const cards = (copy.channels || []).map((channel, index) => {
      const card = make('article', 'channels__card');
      card.dataset.step = String(index);
      card.append(make('span', 'channels__number', channel.number || `0${index + 1}`));
      const statement = make('div', 'channels__statement');
      statement.append(make('h3', 'channels__name', channel.name || ''));
      statement.append(make('p', 'channels__description', channel.description || ''));
      card.append(statement);
      card.append(make('p', 'channels__measure', channel.measure || ''));
      return card;
    });
    root.querySelector('[data-role="channels"]').replaceChildren(...cards);
  },
  build(tl, ctx) {
    const cards = [...root.querySelectorAll('.channels__card')];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { tl.set(cards, { autoAlpha: 1, y: 0 }); return; }
    tl.fromTo(root.querySelector('.channels__head'), { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12, ease: 'power2.out' }, 0);
    tl.fromTo(cards, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1, stagger: 0.045, ease: 'power2.out' }, 0.15);
  },
  unmount() { root = null; },
};
