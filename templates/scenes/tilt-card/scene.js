// tilt-card — a sourced speaker's statement, checked against photos of their actual work.
let root = null;

const cuePositions = (count, supplied = []) => {
  const values = Array.from({ length: count }, (_, index) => Number(supplied[index]))
    .map((value) => Number.isFinite(value) ? Math.min(.86, Math.max(.08, value)) : NaN);
  const valid = values.every(Number.isFinite) && values.every((value, index) => index === 0 || value > values[index - 1]);
  return valid ? values : Array.from({ length: count }, (_, index) => count === 1 ? .28 : .22 + index * (.52 / (count - 1)));
};

export default {
  id: '{{id}}',

  mount(section, ctx) {
    root = section.querySelector('.voice') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const assets = scene.assets || {};
    const imagePaths = (assets.images || []).slice(0, 3);
    const alts = assets.imageAlts || [];
    const figure = root.querySelector('[data-role="figure"]');
    const stage = root.querySelector('[data-role="images"]');
    const frameCount = root.querySelector('[data-role="frame-count"]');
    const lineList = root.querySelector('[data-role="lines"]');
    const cues = cuePositions(Math.max((copy.lines || []).length, imagePaths.length), scene.cues || []);

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="caption"]').textContent = [assets.caption, assets.source].filter(Boolean).join(' · ');
    lineList.replaceChildren(...(copy.lines || []).slice(0, 4).map((line, index) => {
      const item = document.createElement('li');
      item.dataset.cue = String(cues[index]);
      const number = document.createElement('b');
      number.textContent = String(index + 1).padStart(2, '0');
      number.setAttribute('aria-hidden', 'true');
      const text = document.createElement('span');
      text.textContent = line;
      item.append(number, text);
      return item;
    }));

    const images = imagePaths.map((src, index) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = alts[index] || `발언자가 실제로 참여한 작업 현장, 장면 ${index + 1}`;
      img.decoding = 'async';
      img.loading = index === 0 ? 'eager' : 'lazy';
      img.className = index === 0 ? 'is-current' : '';
      img.dataset.cue = String(cues[index] ?? cues.at(-1) ?? .4);
      stage.append(img);
      return img;
    });
    if (!imagePaths.length) figure.dataset.mediaMissing = 'true';
    frameCount.textContent = ctx.reduced
      ? '정지 사진 · 01 / 01'
      : `01 / ${String(Math.max(1, images.length)).padStart(2, '0')}`;
    root._voiceCues = cues;
    root._voiceImages = images;
  },

  build(tl) {
    const copy = root.querySelector('.voice__copy');
    const figure = root.querySelector('.voice__figure');
    const kicker = root.querySelector('.voice__kicker');
    const title = root.querySelector('.voice__title');
    const items = [...root.querySelectorAll('.voice__observations li')];
    const images = root._voiceImages || [];
    const cues = root._voiceCues || [];
    const frameCount = root.querySelector('[data-role="frame-count"]');
    const current = { image: 0, cue: 0, tilt: -1.2 };

    // enter — establish a traceable speaker and their working context together.
    tl.fromTo(figure, { autoAlpha: 0, scale: .985 }, { autoAlpha: 1, scale: 1, duration: .16, ease: 'power2.out' }, 0);
    tl.fromTo([kicker, title], { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .12, stagger: .035, ease: 'power2.out' }, .05);
    items.forEach((item, index) => {
      const at = cues[index] ?? (.26 + index * .13);
      tl.fromTo(item, { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .075, ease: 'power2.out' }, at);
    });
    images.forEach((image, index) => {
      const at = cues[index] ?? (.22 + index * .24);
      if (index > 0) tl.fromTo(image, { autoAlpha: 0, scale: 1.035 }, { autoAlpha: 1, scale: 1, duration: .10, ease: 'power1.out' }, at);
      if (index > 0) tl.to(images[index - 1], { autoAlpha: 0, duration: .06 }, at + .02);
    });
    // hold — the small angle change marks the shift from speaker to the work they describe.
    tl.fromTo(current, { tilt: -1.2 }, { tilt: 1.2, duration: .74, ease: 'none', onUpdate: () => {
      figure.style.setProperty('--voice-tilt', String(current.tilt));
      figure.style.setProperty('--voice-shift', String(current.tilt * -3));
      const cueIndex = cues.reduce((active, cue, index) => current.tilt >= -1.2 + (cue * 3.2) ? index : active, 0);
      items.forEach((item, index) => {
        if (index === cueIndex) item.setAttribute('aria-current', 'step');
        else item.removeAttribute('aria-current');
      });
      const imageIndex = images.reduce((active, image, index) => current.tilt >= -1.2 + (Number(image.dataset.cue) * 3.2) ? index : active, 0);
      images.forEach((image, index) => image.classList.toggle('is-current', index === imageIndex));
      frameCount.textContent = `${String(imageIndex + 1).padStart(2, '0')} / ${String(Math.max(1, images.length)).padStart(2, '0')}`;
    } }, .12);
    // exit — clear the copy only as the pin leaves the complete evidence frame.
    tl.to(copy, { y: -8, autoAlpha: 1, duration: .08, ease: 'power2.in' }, .91);
  },

  unmount() { root = null; },
};
