// wipe-transform — three surfaces, one diagonal wipe. assets.images[0] is the
// first surface, assets.video (or images[1]) the second, the rest the third.
// copy.lines[0..2] are the three captions.
let root = null;

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
    root.querySelector('[data-role="steps"]').replaceChildren(...lines.slice(0, 3).map((line, index) => {
      const item = document.createElement('li');
      const number = document.createElement('span');
      const text = document.createElement('span');
      number.className = 'wt__step-number';
      number.textContent = `0${index + 1}`;
      text.className = 'wt__step-text';
      text.textContent = line;
      item.append(number, text);
      return item;
    }));

    const one = root.querySelector('[data-role="one"]');
    if (images[0]) {
      const image = document.createElement('img'); image.src = images[0]; image.alt = lines[0] || ''; image.decoding = 'async'; one.replaceChildren(image);
    }

    const two = root.querySelector('[data-role="two"]');
    if (images[1]) {
      const image = document.createElement('img'); image.src = images[1]; image.alt = lines[1] || ''; image.decoding = 'async'; two.replaceChildren(image);
    }

    const last = images[2];
    if (last) {
      const image = document.createElement('img'); image.src = last; image.alt = lines[2] || ''; image.decoding = 'async';
      root.querySelector('[data-role="three"]').replaceChildren(image);
    }
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

    ctx.gsap.set(sheets, { '--rise': 110, '--tilt': 12 });

    // enter — 0 .. 0.30. The first surface sharpens, the wipe crosses it.
    tl.fromTo(one, { '--scale': 1.15, '--blur': 12 }, { '--scale': 1, '--blur': 0, duration: 0.1, ease: 'power2.out' }, 0);
    tl.fromTo(caption, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1 }, 0);
    tl.fromTo(two, { '--wipe': 0 }, { '--wipe': 120, duration: 0.18, ease: 'power3.inOut' }, 0.1);
    tl.fromTo(scan, { '--x': -8, '--scan': 1 }, { '--x': 108, '--scan': 0, duration: 0.18, ease: 'none' }, 0.1);

    // hold — 0.30 .. 0.75. Caption swaps as the third surface rises.
    // At the keyboard landing (35%) state two is already fully visible and named.
    // Calls preserve literal leading zeroes and also restore the prior state on reverse.
    const label = (n, text) => () => { num.textContent = n; step.textContent = text; };
    tl.call(label('02', lines[1] || ''), null, 0.29);
    tl.fromTo(two, { '--dim': 1 }, { '--dim': 0.7, duration: 0.1 }, 0.46);
    sheets.forEach((sheet, index) => {
      tl.to(sheet, { '--rise': 0, '--tilt': 0, duration: 0.16, ease: 'power3.out' }, 0.46 + index * 0.04);
    });
    tl.call(label('03', lines[2] || ''), null, 0.63);

    // exit — 0.75 .. 1.00. The finished surface pushes out of frame.
    tl.to(root, { scale: 1.05, autoAlpha: 1, duration: 0.18, ease: 'power2.in' }, 0.8);
  },

  unmount() { root = null; },
};
