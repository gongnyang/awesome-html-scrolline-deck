let root = null;
export default {
  id: '10-operations',
  mount(section, ctx) {
    root = section.querySelector('.plan') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const assets = scene.assets || {};
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="steps"]').replaceChildren(...(assets.milestones || []).slice(0, 3).map((step) => {
      const li = document.createElement('li');
      li.className = 'plan__step';
      const days = document.createElement('span'); days.className = 'plan__days'; days.textContent = step.days || '';
      const title = document.createElement('strong'); title.className = 'plan__step-title'; title.textContent = step.title || '';
      const detail = document.createElement('span'); detail.className = 'plan__detail'; detail.textContent = step.detail || '';
      li.append(days, title, detail);
      return li;
    }));
    const image = root.querySelector('[data-role="image"]');
    image.src = (assets.images || [])[0] || '';
    image.alt = (assets.imageAlt || [])[0] || copy.title || '';
    root.querySelector('[data-role="caption"]').textContent = assets.caption || (copy.lines || [])[0] || '';
    root.querySelector('[data-role="source"]').textContent = scene.source || '';
  },
  build(tl) {
    // enter — route and architectural image assemble into a complete 90-day decision frame.
    tl.fromTo(root.querySelector('.plan__title'), { y: 58, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .1 }, 0);
    tl.fromTo(root.querySelector('.plan__media'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: .13 }, .01);
    tl.fromTo(root.querySelector('.plan__rail-fill'), { scaleY: 0 }, { scaleY: 1, duration: .09 }, .01);
    tl.fromTo(root.querySelector('.plan__steps'), { y: 28 }, { y: 0, duration: .06 }, .02);
    // hold — every milestone and source is available by the speaker's central stop.
    // exit — the final state remains legible until the next scene takes over.
  },
  unmount() { root = null; },
};
