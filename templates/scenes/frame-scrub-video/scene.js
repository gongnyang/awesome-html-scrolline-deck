// frame-scrub-video — the scroll position is the playhead for a real, attributable process clip.
let root = null;
let scrub = null;

const cuesFor = (count, cues = []) => {
  const supplied = Array.from({ length: count }, (_, index) => Number(cues[index]))
    .map((value) => Number.isFinite(value) ? Math.min(.84, Math.max(0, value)) : NaN);
  const usable = supplied.every(Number.isFinite) && supplied.every((value, index) => index === 0 || value > supplied[index - 1]);
  if (usable) return supplied;
  return Array.from({ length: count }, (_, index) => count === 1 ? .42 : .22 + index * (.56 / (count - 1)));
};

export default {
  id: '{{id}}',

  mount(section, ctx) {
    root = section.querySelector('.fsv') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const assets = scene.assets || {};
    const lines = (copy.lines || []).slice(0, 4);
    const cues = cuesFor(lines.length, scene.cues || []);

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    const list = root.querySelector('[data-role="lines"]');
    list.replaceChildren(...lines.map((line, index) => {
      const item = document.createElement('li');
      item.dataset.cue = String(cues[index]);
      const number = document.createElement('b');
      number.setAttribute('aria-hidden', 'true');
      number.textContent = String(index + 1).padStart(2, '0');
      const text = document.createElement('span');
      text.textContent = line;
      item.append(number, text);
      return item;
    }));

    const host = root.querySelector('[data-role="scrub-host"]');
    const meter = root.querySelector('[data-role="progress"]');
    const status = root.querySelector('[data-role="frame-status"]');
    if (ctx.reduced) {
      meter.hidden = true;
      status.textContent = `정지 · 전체 ${String(Math.max(1, lines.length)).padStart(2, '0')}단계`;
    }
    if ((assets.frames || assets.poster) && typeof ctx.frameScrub === 'function') {
      scrub = ctx.frameScrub(host, {
        pattern: assets.frames,
        mobilePattern: assets.mobileFrames,
        count: assets.count,
        critical: assets.critical,
        poster: assets.poster,
        fit: ctx.mobile ? 'contain-top' : 'cover',
      });
    }
    root._frameScrubCues = cues;
  },

  build(tl) {
    const copy = root.querySelector('.fsv__copy');
    const lines = [...root.querySelectorAll('.fsv__lines li')];
    const meter = root.querySelector('[data-role="progress"]');
    const meterFill = meter.querySelector('i');
    const status = root.querySelector('[data-role="frame-status"]');
    const cues = root._frameScrubCues || [];
    const film = { value: 0 };

    const updateFilm = () => {
      const progress = Math.min(1, Math.max(0, film.value));
      if (scrub) scrub.setProgress(progress);
      const percent = Math.round(progress * 100);
      meter.setAttribute('aria-valuenow', String(percent));
      meterFill.style.transform = `scaleX(${progress})`;
      const active = lines.reduce((current, line, index) => progress >= cues[index] ? index : current, -1);
      lines.forEach((line, index) => {
        if (index === active) line.setAttribute('aria-current', 'step');
        else line.removeAttribute('aria-current');
      });
      status.textContent = `${String(Math.max(1, active + 1)).padStart(2, '0')} / ${String(Math.max(1, lines.length)).padStart(2, '0')}`;
    };

    // enter — settle the title and the first aligned observation.
    tl.fromTo(copy, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .12, ease: 'power2.out' }, 0);
    // hold — the frame sequence is scrubbed continuously; cue rows arrive at their labeled frames.
    tl.to(film, { value: 1, duration: .96, ease: 'none', onUpdate: updateFilm }, .02);
    lines.forEach((line, index) => {
      const cue = cues[index] ?? (.22 + index * .14);
      tl.fromTo(line, { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .065, ease: 'power2.out' }, cue);
    });
    // exit — leave the concluding frame visible until the final part of the pin.
    tl.to(copy, { y: -10, autoAlpha: 0, duration: .08, ease: 'power2.in' }, .92);
  },

  unmount() {
    if (scrub && typeof scrub.destroy === 'function') scrub.destroy();
    scrub = null;
    root = null;
  },
};
