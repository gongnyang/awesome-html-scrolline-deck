// parallax-video — scroll scrubs the supplied clip; a stationary reader gets
// a finished held frame, and reduced motion falls back to the poster.
let root = null;
let media = null;
let seekOnMetadata = null;

export default {
  id: '{{id}}',

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
      video.preload = 'metadata';
      video.controls = false;
      video.poster = poster;
      video.setAttribute('aria-hidden', 'true');
      video.setAttribute('tabindex', '-1');
      video.pause();
      source.src = assets.video;
      source.type = 'video/mp4';
      video.append(source);
      host.replaceChildren(video);
      media = host.querySelector('video');
      seekOnMetadata = () => {
        if (media && Number.isFinite(media.duration) && media.duration > 0) {
          media.currentTime = media.duration * 0.68;
          media.pause();
        }
      };
      media.addEventListener('loadedmetadata', seekOnMetadata, { once: true });
      if (media.readyState >= 1) seekOnMetadata();
    } else if (poster) {
      const image = document.createElement('img');
      image.src = poster;
      image.alt = '';
      image.decoding = 'async';
      host.replaceChildren(image);
    }
  },

  build(tl, ctx) {
    const host = root.querySelector('[data-role="media"]');
    const veil = root.querySelector('.pv__veil');
    const copy = root.querySelector('.pv__copy');

    // enter — the unpinned section is a real scroll beat: reveal the media and settle
    // the copy early, then hold the composed claim while the viewer pauses.
    tl.fromTo(host, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1, ease: 'none' }, 0.02);
    tl.fromTo(veil, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: 'none' }, 0.04);
    tl.fromTo(copy, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.14, ease: 'power2.out' }, 0.06);
    // hold — the clip pauses at the exact frame selected by the scroll position.
    if (media && !ctx.reduced) {
      const progress = { value: 0 };
      const seek = () => {
        if (!media || media.readyState < 1 || !Number.isFinite(media.duration)) return;
        const span = Math.max(0, media.duration - 0.08);
        media.currentTime = Math.min(span, Math.max(0, progress.value * span));
        media.pause();
      };
      tl.to(progress, { value: 0.74, duration: 0.7, ease: 'none', onUpdate: seek }, 0.08);
    }
    // exit — the image/video leaves with the section; no animation
    // continues without scroll input.
    tl.to(host, { autoAlpha: 1, duration: 0.12, ease: 'none' }, 0.86);
    tl.to(veil, { autoAlpha: 1, duration: 0.12, ease: 'none' }, 0.86);
    tl.to(copy, { y: -18, autoAlpha: 1, duration: 0.1, ease: 'none' }, 0.88);
  },

  unmount() {
    if (media && seekOnMetadata) media.removeEventListener('loadedmetadata', seekOnMetadata);
    if (media && typeof media.pause === 'function') media.pause();
    seekOnMetadata = null;
    media = null;
    root = null;
  },
};
