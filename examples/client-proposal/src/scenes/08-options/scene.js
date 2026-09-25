let root = null;

const node = (tag, className, text = '') => {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
};

export default {
  id: '08-options',
  mount(section, ctx) {
    root = section.querySelector('.o') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const matrix = scene.assets?.matrix || {};
    const options = (matrix.options || ['라이트', '표준', '확장']).slice(0, 3);
    const criteria = (matrix.criteria || ['점포 수', '현장 지원', '시스템 연결']).slice(0, 3);
    const values = Array.isArray(matrix.values) ? matrix.values : [];
    const recommendedIndex = Number.isInteger(matrix.recommendedIndex) ? matrix.recommendedIndex : 1;

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '파일럿 범위 선택';
    root.querySelector('[data-role="title"]').textContent = copy.title || '세 점포에서 검증할 범위를 고릅니다';
    root.querySelector('[data-role="decision-kicker"]').textContent = '권고 범위';
    root.querySelector('[data-role="standard"]').textContent = options[recommendedIndex] || '표준';
    root.querySelector('[data-role="reason"]').textContent = matrix.recommendation || '';

    const compare = root.querySelector('[data-role="compare"]');
    compare.replaceChildren(...options.map((option, index) => {
      const item = node('div', `o__choice${index === recommendedIndex ? ' o__choice--recommended' : ''}`);
      const name = node('span', 'o__choice-name', option);
      const summary = node('span', 'o__choice-summary', criteria.map((_, row) => values[row]?.[index] || '협의').join(' · '));
      item.append(name, summary);
      if (index === recommendedIndex) item.setAttribute('aria-current', 'true');
      return item;
    }));

    const evidence = root.querySelector('[data-role="evidence"]');
    evidence.replaceChildren(...criteria.map((criterion, row) => {
      const fact = node('div', 'o__metric');
      fact.append(node('dt', '', criterion));
      fact.append(node('dd', '', values[row]?.[recommendedIndex] || '협의'));
      return fact;
    }));

    const alternatives = root.querySelector('[data-role="alternatives"]');
    alternatives.replaceChildren(...options.flatMap((option, index) => {
      if (index === recommendedIndex) return [];
      const item = node('p', 'o__alternative');
      item.append(node('strong', '', option));
      item.append(document.createTextNode(`  ${criteria.map((_, row) => values[row]?.[index] || '협의').join(' · ')}`));
      return [item];
    }));

    root.querySelector('[data-role="source"]').textContent = scene.source || '출처 또는 가상 사례 표시 필요';
  },
  build(tl) {
    const compare = root.querySelector('.o__compare');
    const decision = root.querySelector('.o__decision');
    const metrics = [...root.querySelectorAll('.o__metric')];
    const alternatives = [...root.querySelectorAll('.o__alternative')];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      tl.set(compare, { autoAlpha: 1, y: 0 });
      tl.set(decision, { autoAlpha: 1, y: 0, scale: 1 });
      tl.set([...metrics, ...alternatives], { autoAlpha: 1, y: 0 });
      return;
    }

    tl.fromTo(root.querySelector('.o__title'), { y: 34, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12, ease: 'power3.out' }, 0.01);
    tl.fromTo(compare, { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.14, ease: 'power2.out' }, 0.06);
    tl.to(compare, {
      y: -22, autoAlpha: 0, height: 0, paddingTop: 0, paddingBottom: 0,
      borderTopWidth: 0, borderBottomWidth: 0, duration: 0.12, ease: 'power2.in',
    }, 0.24);
    tl.fromTo(decision, { y: 74, autoAlpha: 0, scale: 0.97, transformOrigin: '50% 100%' }, {
      y: 0, autoAlpha: 1, scale: 1, duration: 0.22, ease: 'power3.out',
    }, 0.27);
    tl.fromTo(metrics, { y: 22, autoAlpha: 0 }, {
      y: 0, autoAlpha: 1, duration: 0.1, stagger: 0.03, ease: 'power2.out',
    }, 0.31);
    tl.fromTo(alternatives, { autoAlpha: 0, y: 12 }, {
      autoAlpha: 1, y: 0, duration: 0.08, stagger: 0.03, ease: 'power2.out',
    }, 0.41);
    tl.fromTo(root.querySelector('.o__source'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, 0.42);
    tl.to(root, { autoAlpha: 0, y: -16, duration: 0.1 }, 0.89);
  },
  unmount() { root = null; },
};
