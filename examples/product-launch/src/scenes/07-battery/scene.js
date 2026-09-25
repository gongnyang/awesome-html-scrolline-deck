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
  id: '07-battery',

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
    const target = Number(String(statsData[0]?.value || '').replace(/[^\d.]/g, ''));
    const dailyHours = 4;
    const days = target ? Math.floor(target / dailyHours) : 0;
    root.querySelector('[data-role="use-case"]').innerHTML = `<div><span>비교 가정</span><strong>하루 ${dailyHours}시간 사용</strong></div><b aria-hidden="true">→</b><div><span>계산상 사용 기간</span><strong>약 ${days}일</strong></div><small>가상 설계 목표 ${target}시간 ÷ 하루 4시간 · 실측 배터리 결과가 아님</small>`;
  },

  build(tl, ctx) {
    const copy = root.querySelector('.od__copy');
    const stats = root.querySelector('[data-role="stats"]');
    const useCase = root.querySelector('[data-role="use-case"]');
    if (ctx?.reduced) return;
    // The declared goal stays complete while its usage assumption appears.
    tl.fromTo(copy, { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .12 }, 0);
    tl.fromTo(stats, { autoAlpha: 0 }, { autoAlpha: 1, duration: .1 }, .06);
    tl.fromTo(useCase, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .12 }, .12);
  },

  unmount() { root = null; },
};
