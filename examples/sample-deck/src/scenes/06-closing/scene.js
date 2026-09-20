// closing-qr — the frame the room photographs. The QR comes from an SVG in
// assets.images[0]; without one the URL is printed instead.
let root = null;
let onRestart = null;

const chars = (text) => [...String(text)]
  .map((ch) => `<span class="cq__char" aria-hidden="true">${ch === ' ' ? '&nbsp;' : ch}</span>`)
  .join('');

export default {
  id: '06-closing',

  mount(section, ctx) {
    root = section.querySelector('.cq') || section;
    const scene = ctx.data.scene || {};
    const deck = ctx.data.deck || {};
    const copy = scene.copy || {};
    const assets = scene.assets || {};
    const images = assets.images || [];
    const site = (copy.lines || [])[0] || (deck.links && deck.links.site) || '';

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    const thanks = root.querySelector('[data-role="title"]');
    thanks.setAttribute('aria-label', copy.title || '');
    thanks.innerHTML = chars(copy.title || '');
    root.querySelector('[data-role="url"]').textContent = site;

    const mascot = images[1];
    if (mascot) root.querySelector('[data-role="mascot"]').setAttribute('src', mascot);

    const qr = root.querySelector('[data-role="qr"]');
    const svg = images[0];
    if (svg && /\.svg(\?|$)/.test(svg) && typeof fetch === 'function') {
      fetch(svg)
        .then((response) => (response.ok ? response.text() : ''))
        .then((markup) => {
          if (!root || !markup) return;
          qr.insertAdjacentHTML('afterbegin', markup);
          qr.querySelectorAll('path').forEach((path) => path.setAttribute('pathLength', '1'));
        })
        .catch(() => {});
    }

    const restart = root.querySelector('[data-role="restart"]');
    restart.textContent = assets.restartLabel || (deck.lang === 'ko' ? '처음부터 다시' : 'Start over');
    onRestart = () => {
      if (ctx.lenis) ctx.lenis.scrollTo(0, { immediate: !!ctx.reduced });
      else if (typeof document !== 'undefined' && document.scrollingElement) document.scrollingElement.scrollTop = 0;
    };
    restart.addEventListener('click', onRestart);
  },

  build(tl, ctx) {
    const bloom = root.querySelector('.cq__bloom');
    const lead = root.querySelector('.cq__lead');
    const letters = [...root.querySelectorAll('.cq__char')];
    const qr = root.querySelector('[data-role="qr"]');
    const url = root.querySelector('.cq__url');
    const mascot = root.querySelector('[data-role="mascot"]');
    const restart = root.querySelector('.cq__restart');

    ctx.gsap.set(qr, { '--draw': 0 });

    // enter — 0 .. 0.30. The bloom opens and the thanks set themselves.
    tl.fromTo(bloom, { '--r': 14, autoAlpha: 0 }, { '--r': 70, autoAlpha: 0.8, duration: 0.14, ease: 'power2.out' }, 0);
    tl.fromTo(lead, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1, ease: 'power3.out' }, 0.1);
    if (letters.length) {
      tl.fromTo(letters, { yPercent: 72, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.12, stagger: 0.008, ease: 'power3.out' }, 0.14);
    }

    // hold — 0.30 .. 0.75. The QR draws, the URL types, the room photographs it.
    tl.to(qr, { '--draw': 1, duration: 0.16, ease: 'none' }, 0.3);
    // A clip wipe, not a width tween: "ch" is the width of a zero, so a long
    // URL in a proportional stack stays clipped at the final state.
    tl.fromTo(url, { '--type': 0 }, { '--type': 1, duration: 0.12, ease: 'none' }, 0.3);
    // Everything is standing by .48 — the keyboard lands at .35, the 55% capture
    // (and the room's photo) must show the finished frame even with scrub lag.
    tl.fromTo(mascot, { x: 40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.12, ease: 'power3.out' }, 0.36);
    tl.fromTo(restart, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.08, ease: 'power2.out' }, 0.4);

    // exit — 0.75 .. 1.00. Nothing leaves; the bloom only breathes out.
    tl.to(bloom, { '--r': 86, autoAlpha: 0.55, duration: 0.18, ease: 'power2.out' }, 0.8);
  },

  unmount() {
    const restart = root && root.querySelector('[data-role="restart"]');
    if (restart && onRestart) restart.removeEventListener('click', onRestart);
    onRestart = null;
    root = null;
  },
};
