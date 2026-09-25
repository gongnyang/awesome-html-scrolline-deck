// A single presenter-facing action remains on screen through the final cue.
let root = null;

export default {
  id: '10-close',
  mount(section, ctx) {
    root = section.querySelector('.close-action') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="claim"]').textContent = scene.claim || '';
    root.querySelector('[data-role="support"]').textContent = (copy.lines || [])[0] || '';
  },
  build(tl) {
    tl.fromTo(root.querySelector('.close-action__kicker'), { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .1 }, 0);
    tl.fromTo(root.querySelector('.close-action__title'), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .12 }, .04);
    tl.fromTo(root.querySelector('.close-action__claim'), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .14 }, .12);
    tl.fromTo(root.querySelector('.close-action__support'), { autoAlpha: 0 }, { autoAlpha: 1, duration: .1 }, .28);
  },
  unmount() { root = null; },
};
