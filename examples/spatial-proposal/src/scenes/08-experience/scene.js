// parallax-video — the only unpinned technique: the section scrolls past a
// fixed clip. Use it as a breath between two pinned scenes.
let root = null;
let media = null;

export default {
  id: '08-experience',

  mount(section, ctx) {
    root = section.querySelector('.pv') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const assets = scene.assets || {};

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="line"]').textContent = (copy.lines || [])[0] || '';

    const host = root.querySelector('[data-role="media"]');
    const poster = assets.poster || (assets.images || [])[0] || '';
    if (assets.video && !ctx.reduced) {
      const video = document.createElement('video');
      const source = document.createElement('source');
      video.muted = true;
      video.playsInline = true;
      video.loop = true;
      video.preload = 'metadata';
      video.poster = poster;
      video.setAttribute('aria-hidden', 'true');
      source.src = assets.video;
      source.type = 'video/mp4';
      video.append(source);
      host.replaceChildren(video);
      media = host.querySelector('video');
      const play = media && media.play();
      if (play && typeof play.catch === 'function') play.catch(() => {});
    } else if (poster) {
      const image = document.createElement('img');
      image.src = poster;
      image.alt = '';
      image.decoding = 'async';
      host.replaceChildren(image);
    }
  },

  build(tl) {
    const host = root.querySelector('[data-role="media"]');
    const veil = root.querySelector('.pv__veil');
    const copy = root.querySelector('.pv__copy');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      tl.set([host, veil, copy], { autoAlpha: 1, yPercent: 0 });
      return;
    }
    // Keep the identifying claim and photo in place through the scene boundary.
    tl.fromTo(host, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, ease: 'none' }, 0.02);
    tl.fromTo(veil, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1, ease: 'none' }, 0.04);
    tl.fromTo(copy, { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12, ease: 'power2.out' }, 0.04);
  },

  unmount() {
    if (media && typeof media.pause === 'function') media.pause();
    media = null;
    root = null;
  },
};
