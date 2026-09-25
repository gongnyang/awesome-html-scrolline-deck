// parallax-video — the only unpinned technique: the section scrolls past a
// fixed clip. Use it as a breath between two pinned scenes.
let root = null;
let media = null;

export default {
  id: '05-pause',

  mount(section, ctx) {
    root = section.querySelector('.pv') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const assets = scene.assets || {};

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="line"]').textContent = (copy.lines || [])[0] || '';
    root.querySelector('[data-role="credit"]').textContent = scene.source || '';

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

    // enter — 0 .. 0.30. The clip fades up behind the incoming copy.
    tl.fromTo(host, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1, ease: 'none' }, 0.02);
    tl.fromTo(veil, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: 'none' }, 0.04);

    // hold — 0.30 .. 0.75. The copy drifts at a different rate than the page.
    tl.fromTo(copy, { yPercent: 16 }, { yPercent: -13, duration: 0.8, ease: 'none' }, 0.06);

    // Keep the image composed through the section boundary. The following
    // scene takes over with its own background as the page continues.
    tl.to(host, { autoAlpha: 1, duration: 0.12, ease: 'none' }, 0.86);
    tl.to(veil, { autoAlpha: 1, duration: 0.12, ease: 'none' }, 0.86);
  },

  unmount() {
    if (media && typeof media.pause === 'function') media.pause();
    media = null;
    root = null;
  },
};
