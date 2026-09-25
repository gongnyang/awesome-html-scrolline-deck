let root = null;
let invalid = false;
const el = (tag, cls, text = '') => { const n = document.createElement(tag); n.className = cls; n.textContent = text; return n; };
export default {
  id: '{{id}}',
  mount(section, ctx) {
    root = section.querySelector('.m') || section;
    invalid = false;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = Array.isArray(copy.lines) ? copy.lines : [];
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    const relations = lines.map((line) => {
      const [name, detail = ''] = String(line).split(/:(.*)/s).slice(0, 2);
      return { name: name.trim(), detail: detail.trim() };
    });
    const errors = [];
    if (relations.length < 2 || relations.length > 4) errors.push('중심 요소와 연결되는 실제 구성 요소 2–4개가 필요합니다.');
    relations.forEach((r, i) => { if (!r.name || !r.detail) errors.push(`${i + 1}번째 줄은 '구성 요소: 중심과의 실제 관계' 형식이어야 합니다.`); });
    const error = root.querySelector('[data-role="error"]');
    const map = root.querySelector('.m__map');
    if (errors.length) {
      invalid = true; error.hidden = false; error.textContent = `시스템 관계를 그릴 수 없습니다. ${errors.join(' ')}`; map.hidden = true; return;
    }
    error.hidden = true; map.hidden = false;
    root.querySelector('.m__hub').textContent = copy.title || '중심 요소';
    const host = root.querySelector('.m__nodes');
    host.style.setProperty('--node-count', String(relations.length));
    host.replaceChildren(...relations.map((r, i) => {
      const item = el('article', 'm__node'); item.dataset.node = String(i);
      item.append(el('b', 'm__index', String(i + 1).padStart(2, '0')), el('h3', '', r.name), el('p', 'm__relation', r.detail));
      return item;
    }));
  },
  build(tl) {
    if (invalid) { tl.fromTo(root.querySelector('[data-role="error"]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: .1 }, 0); tl.to(root.querySelector('[data-role="error"]'), { autoAlpha: 0, duration: .1 }, .85); return; }
    const nodes = [...root.querySelectorAll('.m__node')];
    const activate = (i) => nodes.forEach((n, j) => n.classList.toggle('is-active', i === j));
    tl.fromTo(root.querySelector('.m__head'), { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .12 }, 0);
    tl.fromTo(root.querySelector('.m__hub'), { scale: .96, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .14 }, .03);
    tl.fromTo(nodes, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .12, stagger: .045 }, .12);
    // enter — introduce the system title and central service before its relationships.
    // hold — keep the central system and every named relationship visible as focus moves between links.
    nodes.forEach((_, i) => tl.call(activate, [i], .34 + i * .07));
    // exit — leave the assembled relationship map after the explanation.
    tl.to(root, { autoAlpha: 0, duration: .13 }, .85);
  },
  unmount() { root = null; invalid = false; },
};
