// odometer-stats — exact declared values, definitions and provenance stay
// together in the speaking hold. Integer values can use the digit reels.
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
  id: '{{id}}',

  mount(section, ctx) {
    root = section.querySelector('.od') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const supplied = Array.isArray(scene.assets?.stats) ? scene.assets.stats.slice(0, 2) : [];
    const statsData = supplied.length ? supplied : (copy.lines || []).slice(0, 2).map((line) => {
      const parsed = parseStat(line);
      return { value: `${parsed.digits}${parsed.suffix}`, label: parsed.label, definition: '' };
    });

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';

    const stats = root.querySelector('[data-role="stats"]');
    stats.style.setProperty('--cols', String(Math.max(1, statsData.length)));
    stats.replaceChildren(...statsData.map((stat, index) => {
      const value = String(stat.value ?? '').trim();
      const exactInteger = /^\d{1,6}$/.test(value);
      const card = el('div', 'od__stat');
      card.setAttribute('data-accent', String((index % 3) + 1));
      const definition = el('dd', 'od__odo');
      definition.setAttribute('aria-label', `${value} ${stat.unit || ''}`.trim());
      if (exactInteger) {
        const reels = el('span', 'od__reels');
        for (const digit of value) {
          const reel = el('span', 'od__reel');
          reel.dataset.target = digit;
          reel.style.setProperty('--y', digit);
          const strip = el('span', 'od__strip');
          strip.innerHTML = STRIP;
          reel.append(strip);
          reels.append(reel);
        }
        definition.append(reels);
        if (stat.unit) definition.append(el('span', 'od__suffix', stat.unit));
      } else if (value) {
        definition.append(el('span', 'od__plain', value));
        if (stat.unit) definition.append(el('span', 'od__suffix', stat.unit));
      } else {
        definition.append(el('span', 'od__empty', '값 필요'));
      }
      card.append(definition, el('dt', 'od__unit', stat.label || '지표 이름 필요'));
      if (stat.definition || stat.period || stat.denominator) card.append(el('p', 'od__definition', [stat.definition, stat.denominator, stat.period].filter(Boolean).join(' · ')));
      return card;
    }));
    root.querySelector('[data-role="source"]').textContent = scene.assets?.source || scene.source || '출처 또는 가상 설계 목표 표기 필요';
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
    tl.to(root, { yPercent: -8, autoAlpha: 1, duration: 0.18, ease: 'power2.in' }, 0.8);
  },

  unmount() { root = null; },
};
