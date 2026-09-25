let root = null;

const node = (tag, className, text = '') => {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
};

const splitLine = (line) => {
  const [label, ...rest] = String(line).split('//');
  return { label: label.trim(), detail: rest.join('//').trim() };
};

export default {
  id: '02-challenge',
  mount(section, ctx) {
    root = section.querySelector('.q') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = (copy.lines || []).slice(0, 3);
    const image = root.querySelector('[data-role="image"]');

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="minutes"]').textContent = copy.metric || '08';
    if (scene.assets?.poster) {
      image.src = scene.assets.poster;
      image.alt = '피크 시간대 서점 계산대에서 기다리는 고객들. 가상 사례를 위한 AI 재구성 이미지.';
      image.fetchPriority = 'high';
      image.decoding = 'async';
    } else {
      image.removeAttribute('src');
    }

    const route = root.querySelector('[data-role="answers"]');
    route.replaceChildren(...lines.map((line, index) => {
      const item = node('article', 'q__item');
      item.setAttribute('data-step', '');
      item.setAttribute('data-index', String(index + 1));
      const copyParts = splitLine(line);
      item.append(node('span', 'q__index', `0${index + 1}`));
      item.append(node('h3', 'q__label', copyParts.label));
      item.append(node('p', 'q__detail', copyParts.detail));
      return item;
    }));
  },
  build(tl) {
    // enter — the queue image and threshold claim take the stage first.
    const image = root.querySelector('.q__photo');
    const head = root.querySelector('.q__head');
    const time = root.querySelector('.q__time');
    const items = [...root.querySelectorAll('.q__item')];
    const route = root.querySelector('.q__route');
    tl.fromTo(image, { scale: 1.12, autoAlpha: 0.48 }, { scale: 1, autoAlpha: 1, duration: 0.34, ease: 'power2.out' }, 0);
    tl.fromTo(head, { x: -30, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.18, ease: 'power2.out' }, 0.04);
    tl.fromTo(time, { scale: 0.72, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.2, ease: 'back.out(1.8)' }, 0.16);
    tl.fromTo(route, { '--route': 0 }, { '--route': 1, duration: 0.2, ease: 'power2.out' }, 0.36);
    tl.fromTo(items, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12, stagger: 0.045 }, 0.4);
    // hold — let the presenter explain why the eight-minute boundary is a hypothesis.
    // exit — fade the scene before the measured evidence arrives.
    tl.to(root, { autoAlpha: 0, scale: 0.985, duration: 0.16, ease: 'power1.in' }, 0.84);
  },
  unmount() { root = null; },
};
