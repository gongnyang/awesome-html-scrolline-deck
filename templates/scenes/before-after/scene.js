let root = null;

export default {
  id: '{{id}}',
  mount(section, ctx) {
    root = section.querySelector('.b') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = copy.lines || [];
    const assets = scene.assets || {};
    const images = assets.images || [];
    const beforeText = lines[0] || '이전 상태';
    const afterText = lines[1] || '변경 후';

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';

    const beforeImage = root.querySelector('[data-role="before"] img');
    const afterImage = root.querySelector('[data-role="after"] img');
    beforeImage.src = images[0] || assets.poster || '';
    afterImage.src = images[1] || '';
    beforeImage.alt = `${beforeText}. ${copy.title || ''}`.trim();
    afterImage.alt = `${afterText}. ${copy.title || ''}`.trim();
    root.querySelector('[data-role="before-label"]').textContent = beforeText;
    root.querySelector('[data-role="after-label"]').textContent = afterText;
    root.setAttribute('aria-label', `${copy.title || ''}: ${beforeText} / ${afterText}`);
  },
  build(tl) {
    const before = root.querySelector('[data-role="before"]');
    const after = root.querySelector('[data-role="after"]');
    const head = root.querySelector('.b__head');

    // enter — reveal the second state against the same aligned image plane.
    tl.fromTo(after, { '--split': 0 }, { '--split': 50, duration: 0.28, ease: 'power2.inOut' }, 0.02);
    tl.fromTo(head, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12, ease: 'power2.out' }, 0.02);

    // hold — both real states stay visible across the speaking interval.

    // exit — finish on the changed state, carrying the claim into the next scene.
    tl.to(after, { '--split': 100, duration: 0.12, ease: 'power2.inOut' }, 0.82);
    tl.to([before, after, head, root.querySelector('.b__seam')], { autoAlpha: 1, duration: 0.08 }, 0.92);
  },
  unmount() { root = null; },
};
