// odometer-stats — each copy.lines entry is "<number><suffix> <label>", e.g.
// "12 scenes" or "2450vh of pin". The digits spin up on reels.
let root = null;

const STRIP = Array.from({ length: 30 }, (_, index) => `<i>${index % 10}</i>`).join('');

// "12 scenes" -> 12 + label. "2450vh of pin" -> 2450 + suffix vh + label.
// A suffix has to be attached to the number; anything after a space is a label,
// so "12 \uc7a5\uba74" reads as a bare count with a Korean label.
const parseStat = (line) => {
  const match = String(line).match(/^\s*([\d,]+)(\S*)\s*([\s\S]*)$/);
  if (!match) return { digits: '0', suffix: '', label: String(line).trim() };
  return { digits: match[1].replace(/,/g, ''), suffix: match[2] || '', label: (match[3] || '').trim() };
};

export default {
  id: '{{id}}',

  mount(section, ctx) {
    root = section.querySelector('.od') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = (copy.lines || []).slice(0, 4);

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';

    const stats = root.querySelector('[data-role="stats"]');
    stats.style.setProperty('--cols', String(Math.max(1, lines.length)));
    stats.innerHTML = lines.map((line, index) => {
      const stat = parseStat(line);
      const reels = stat.digits.split('').map((digit) =>
        `<span class="od__reel" data-target="${digit}" style="--y:${digit}"><span class="od__strip">${STRIP}</span></span>`).join('');
      return `<div class="od__stat" data-accent="${(index % 3) + 1}">`
        + `<dd class="od__odo" aria-label="${stat.digits}${stat.suffix}">`
        + `<span class="od__reels">${reels}</span>`
        + (stat.suffix ? `<span class="od__suffix">${stat.suffix}</span>` : '')
        + `</dd><dt class="od__unit">${stat.label}</dt></div>`;
    }).join('');
  },

  build(tl, ctx) {
    const copy = root.querySelector('.od__copy');
    const horizon = root.querySelector('.od__horizon');
    const reels = [...root.querySelectorAll('.od__reel')];
    const units = [...root.querySelectorAll('.od__unit')];

    ctx.gsap.set(horizon, { '--draw': 0, yPercent: 30 });
    ctx.gsap.set(reels, { '--y': 0, '--vel': 0 });
    ctx.gsap.set(units, { '--unit': 0 });

    // enter — 0 .. 0.30. Horizon draws, then every reel spins to its digit.
    tl.fromTo(copy, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.08 }, 0);
    tl.to(horizon, { '--draw': 1, yPercent: 0, duration: 0.08 }, 0);
    if (reels.length) {
      tl.to(reels, {
        '--y': (index, target) => Number(target.dataset.target) + 20,
        '--vel': 1,
        duration: 0.14,
        stagger: 0.015,
        ease: 'expo.out',
      }, 0.06);
      tl.to(reels, { '--vel': 0, duration: 0.06, stagger: 0.015 }, 0.2);
    }
    if (units.length) tl.to(units, { '--unit': 1, duration: 0.07, stagger: 0.02 }, 0.18);

    // hold — 0.30 .. 0.75. The horizon pulses once so the numbers land.
    tl.to(horizon, { '--flash': 1, duration: 0.03, yoyo: true, repeat: 1 }, 0.34);

    // exit — 0.75 .. 1.00. The whole board lifts away.
    tl.to(root, { yPercent: -8, autoAlpha: 0, duration: 0.18, ease: 'power2.in' }, 0.8);
  },

  unmount() { root = null; },
};
