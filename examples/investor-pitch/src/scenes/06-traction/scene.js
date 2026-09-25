// odometer-stats — each copy.lines entry is "<number><suffix> <label>", e.g.
// "12 scenes" or "2450vh of pin". The digits spin up on reels.
let root = null;

const STRIP = Array.from({ length: 30 }, (_, index) => `<i>${index % 10}</i>`).join('');
const el = (tag, className, text = '') => {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
};

// "12 scenes" -> 12 + label. "2450vh of pin" -> 2450 + suffix vh + label.
// A suffix has to be attached to the number; anything after a space is a label,
// so "12 \uc7a5\uba74" reads as a bare count with a Korean label.
const parseStat = (line) => {
  const match = String(line).match(/^\s*([\d,]+)(\S*)\s*([\s\S]*)$/);
  if (!match) return { digits: '', suffix: '', label: String(line).trim() };
  return { digits: match[1].replace(/,/g, ''), suffix: match[2] || '', label: (match[3] || '').trim() };
};

export default {
  id: '06-traction',

  mount(section, ctx) {
    root = section.querySelector('.od') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = (copy.lines || []).slice(0, 4);

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="source"]').textContent = copy.source || scene.source || '';

    const stats = root.querySelector('[data-role="stats"]');
    stats.style.setProperty('--cols', String(Math.max(1, lines.length)));
    stats.replaceChildren(...lines.map((line, index) => {
      const stat = parseStat(line);
      const card = el('div', 'od__stat');
      card.setAttribute('data-accent', String((index % 3) + 1));
      const definition = el('dd', 'od__odo');
      definition.setAttribute('aria-label', `${stat.digits}${stat.suffix}`);
      if (stat.digits) {
        const reels = el('span', 'od__reels');
        for (const digit of stat.digits) {
          const reel = el('span', 'od__reel');
          reel.dataset.target = digit;
          reel.style.setProperty('--y', digit);
          const strip = el('span', 'od__strip');
          strip.innerHTML = STRIP;
          reel.append(strip);
          reels.append(reel);
        }
        definition.append(reels);
        if (stat.suffix) definition.append(el('span', 'od__suffix', stat.suffix));
      } else {
        definition.append(el('span', 'od__empty', '—'));
      }
      card.append(definition, el('dt', 'od__unit', stat.label));
      return card;
    }));
  },

  build(tl, ctx) {
    const copy = root.querySelector('.od__copy');
    const horizon = root.querySelector('.od__horizon');
    const reels = [...root.querySelectorAll('.od__reel')];
    const units = [...root.querySelectorAll('.od__unit')];

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ctx.gsap.set(horizon, { '--draw': 1, '--flash': 0, yPercent: 0 });
      ctx.gsap.set(reels, { '--vel': 0, '--y': (index, target) => Number(target.dataset.target) + 20, clearProps: 'filter' });
      ctx.gsap.set(units, { '--unit': 1, clearProps: 'transform,opacity' });
      ctx.gsap.set([copy, ...root.querySelectorAll('.od__source')], { autoAlpha: 1, y: 0 });
      return;
    }

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
    tl.to(root, { yPercent: -3, duration: 0.18, ease: 'power2.in' }, 0.8);
  },

  unmount() { root = null; },
};
