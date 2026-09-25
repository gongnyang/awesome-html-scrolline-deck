let root = null;
const node = (tag, className, text = '') => { const el = document.createElement(tag); el.className = className; el.textContent = text; return el; };
export default {
  id: '10-close',
  mount(section, ctx) {
    root = section.querySelector('.s') || section;
    section.id = '10-close';
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = ['핵심 장면 다시 체험: 제품 사용 장면으로 돌아가 소음이 줄어드는 설계 의도를 확인하세요.'];
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    const stepsHost = root.querySelector('[data-role="steps"]');
    stepsHost.replaceChildren(...lines.map((line, index) => {
      const parts = String(line).split(':');
      const step = index === 0 ? document.createElement('a') : node('article', 's__step');
      step.classList.add('s__step');
      if (index === 0) { step.href = '#03-promise'; step.setAttribute('aria-label', '제품 사용 장면 다시 보기'); }
      step.append(node('span', 's__num', index === 0 ? '↗' : String(index + 1).padStart(2, '0')));
      step.append(node('h3', '', parts[0] || line));
      step.append(node('p', '', parts.slice(1).join(':').trim()));
      return step;
    }));
  },
  build(tl, ctx) {
        // enter — 0 .. 0.30
        const cards = [...root.querySelectorAll('.s__step')];
    tl.fromTo(cards, { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.14, stagger: 0.055 }, 0.04);
    tl.fromTo(root.querySelector('.s__steps'), { '--flow': 0 }, { '--flow': 1, duration: 0.24 }, 0);
    // Keep the action link present until the next scene enters.
    // hold — 0.30 .. 0.75
    // Keep the composed state readable while the presenter speaks.
    // exit — 0.75 .. 1.00
  },
  unmount() { root = null; },
};
