let root = null;
const node = (tag, className, text = '') => {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
};

export default {
  id: '05-solution',
  mount(section, ctx) {
    root = section.querySelector('.solution') || section;
    const copy = ctx.data.scene?.copy || {};
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';

    const keep = root.querySelector('[data-role="keep"]');
    const [lead, rest] = String(copy.keep || '').split('|');
    keep.replaceChildren();
    if (lead) keep.append(node('strong', '', lead.trim()));
    if (rest) keep.append(document.createTextNode(` ${rest.trim()}`));

    const steps = (copy.steps || []).slice(0, 3);
    const list = root.querySelector('[data-role="steps"]');
    list.setAttribute('aria-label', '고객 접수부터 현장 안내까지의 운영 흐름');
    list.replaceChildren(...steps.map((step, index) => {
      const item = node('li', 'solution__step');
      item.append(node('span', 'solution__number', String(step.number || String(index + 1).padStart(2, '0'))));
      item.append(node('h3', 'solution__step-title', step.title || ''));
      item.append(node('p', 'solution__detail', step.detail || ''));
      return item;
    }));
  },
  build(tl) {
    const fill = root.querySelector('.solution__fill');
    const steps = [...root.querySelectorAll('.solution__step')];
    const mobile = window.matchMedia('(max-width: 720px)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      tl.set(root.querySelector('.solution__flow'), { autoAlpha: 1 });
      tl.set(steps, { autoAlpha: 1, y: 0 });
    } else {
      const axis = mobile ? { scaleY: 0 } : { scaleX: 0 };
      const done = mobile ? { scaleY: 1 } : { scaleX: 1 };
      tl.fromTo(fill, axis, { ...done, duration: 0.4, ease: 'power2.out' }, 0.03);
      tl.fromTo(steps, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.14, stagger: 0.1, ease: 'power2.out' }, 0.08);
    }
    tl.to(root, { autoAlpha: 0, y: -18, duration: 0.14 }, 0.86);
  },
  unmount() { root = null; },
};
