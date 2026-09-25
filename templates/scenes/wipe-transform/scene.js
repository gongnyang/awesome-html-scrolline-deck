// wipe-transform — three surfaces, one diagonal wipe. assets.images[0] is the
// first surface, assets.video (or images[1]) the second, the rest the third.
// copy.lines[0..2] are the three captions.
let root = null;
let media = null;

export default {
  id: '{{id}}',

  mount(section, ctx) {
    root = section.querySelector('.wt') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const assets = scene.assets || {};
    const images = assets.images || [];
    const lines = copy.lines || [];

    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="step"]').textContent = lines[0] || '';

    const one = root.querySelector('[data-role="one"]');
    if (images[0]) {
      const image = document.createElement('img'); image.src = images[0]; image.alt = ''; image.decoding = 'async'; one.replaceChildren(image);
    }

    const two = root.querySelector('[data-role="two"]');
    if (assets.video && !ctx.reduced) {
      const video = document.createElement('video');
      const source = document.createElement('source');
      video.muted = true; video.playsInline = true; video.loop = true; video.preload = 'metadata';
      video.poster = assets.poster || ''; video.setAttribute('aria-hidden', 'true');
      source.src = assets.video; source.type = 'video/mp4'; video.append(source); two.replaceChildren(video);
      media = two.querySelector('video');
      const play = media && media.play();
      if (play && typeof play.catch === 'function') play.catch(() => {});
    } else if (assets.poster || images[1]) {
      const image = document.createElement('img'); image.src = assets.poster || images[1]; image.alt = ''; image.decoding = 'async'; two.replaceChildren(image);
    }

    const rest = images.slice(assets.video ? 1 : 2);
    root.querySelector('[data-role="three"]').replaceChildren(...rest.slice(0, 3).map((src) => {
      const image = document.createElement('img'); image.src = src; image.alt = ''; image.decoding = 'async'; return image;
    }));
  },

  build(tl, ctx) {
    const scene = ctx.data.scene || {};
    const lines = (scene.copy || {}).lines || [];
    const one = root.querySelector('[data-role="one"]');
    const two = root.querySelector('[data-role="two"]');
    const sheets = [...root.querySelectorAll('[data-role="three"] img')];
    const scan = root.querySelector('.wt__scan');
    const caption = root.querySelector('.wt__caption');
    const num = root.querySelector('[data-role="num"]');
    const step = root.querySelector('[data-role="step"]');
    const title = root.querySelector('[data-role="title"]');

    ctx.gsap.set(sheets, { '--rise': 110, '--tilt': 12 });
    ctx.gsap.set(title, { autoAlpha: 0 });

    // enter — 0 .. 0.30. The first surface sharpens, the wipe crosses it.
    tl.fromTo(one, { '--scale': 1.15, '--blur': 12 }, { '--scale': 1, '--blur': 0, duration: 0.1, ease: 'power2.out' }, 0);
    tl.fromTo(caption, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1 }, 0);
    tl.fromTo(two, { '--wipe': 0 }, { '--wipe': 120, duration: 0.18, ease: 'power3.inOut' }, 0.1);
    tl.fromTo(scan, { '--x': -8, '--scan': 1 }, { '--x': 108, '--scan': 0, duration: 0.18, ease: 'none' }, 0.1);

    // hold — 0.30 .. 0.75. Caption swaps as the third surface rises.
    tl.to(caption, { autoAlpha: 0, duration: 0.04 }, 0.32);
    // tl.set(el, { textContent: '02' }) prints 2 (GSAP parses the string as a
    // number). Calls keep the text, and the earlier call restores it on reverse.
    const label = (n, text) => () => { num.textContent = n; step.textContent = text; };
    tl.call(label('01', lines[0] || ''), null, 0.355);
    tl.call(label('02', lines[1] || ''), null, 0.36);
    tl.to(caption, { autoAlpha: 1, duration: 0.08 }, 0.36);
    tl.to(two, { '--dim': 0.7, duration: 0.1 }, 0.46);
    sheets.forEach((sheet, index) => {
      tl.to(sheet, { '--rise': 0, '--tilt': 0, duration: 0.16, ease: 'power3.out' }, 0.46 + index * 0.04);
    });
    tl.to(caption, { autoAlpha: 0, duration: 0.04 }, 0.62);
    tl.call(label('02', lines[1] || ''), null, 0.655);
    tl.call(label('03', lines[2] || ''), null, 0.66);
    tl.to([caption, title], { autoAlpha: 1, duration: 0.08 }, 0.66);

    // exit — 0.75 .. 1.00. The finished surface pushes out of frame.
    tl.to(root, { scale: 1.05, autoAlpha: 0, duration: 0.18, ease: 'power2.in' }, 0.8);
  },

  unmount() {
    if (media && typeof media.pause === 'function') media.pause();
    media = null;
    root = null;
  },
};
