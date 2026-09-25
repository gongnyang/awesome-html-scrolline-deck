let root = null;
let invalid = false;
const el = (tag, cls, text = '') => { const n = document.createElement(tag); n.className = cls; n.textContent = text; return n; };
export default {
  id: '{{id}}',
  mount(section, ctx) {
    root = section.querySelector('.p') || section;
    invalid = false;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = Array.isArray(copy.lines) ? copy.lines : [];
    const errors = [];
    if (lines.length < 2 || lines.length > 4) errors.push('발표 구간 2–4개가 필요합니다.');
    const segments = lines.map((line) => { const [name, promise = ''] = String(line).split(/:(.*)/s).slice(0, 2); return { name: name.trim(), promise: promise.trim() }; });
    segments.forEach((s, i) => { if (!s.name || !s.promise) errors.push(`${i + 1}번째 구간은 '구간명: 청중이 알게 될 내용' 형식이어야 합니다.`); });
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    const error = root.querySelector('[data-role="error"]');
    const host = root.querySelector('[data-role="route"]');
    if (errors.length) { invalid = true; error.hidden = false; error.textContent = `발표 의제 경로를 만들 수 없습니다. ${errors.join(' ')}`; host.hidden = true; return; }
    error.hidden = true; host.hidden = false;
    host.style.setProperty('--stops', String(segments.length)); host.style.setProperty('--route', '0');
    host.replaceChildren(...segments.map((s, i) => {
      const item = el('article', 'p__stop'); item.dataset.stop = String(i);
      item.append(el('span', 'p__index', String(i + 1).padStart(2, '0')), el('h3', '', s.name), el('p', '', s.promise));
      return item;
    }));
  },
  build(tl) {
    if (invalid) { tl.fromTo(root.querySelector('[data-role="error"]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: .1 }, 0); tl.to(root.querySelector('[data-role="error"]'), { autoAlpha: 1, duration: .1 }, .85); return; }
    const stops = [...root.querySelectorAll('.p__stop')];
    const route = root.querySelector('.p__route');
    const activate = (i) => stops.forEach((s, j) => s.classList.toggle('is-active', i === j));
    // enter — orient the audience to the sequence and its first promised takeaway.
    tl.fromTo(root.querySelector('.p__head'), { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .12 }, 0);
    tl.fromTo(stops, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .12, stagger: .04 }, .04);
    tl.fromTo(route, { '--route': 0 }, { '--route': 1, duration: .25, ease: 'none' }, .04);
    // hold — the whole agenda stays legible while focus moves through the section promises.
    stops.forEach((_, i) => tl.call(activate, [i], .34 + i * .08));
    // exit — dismiss the agenda after the final section is introduced.
    tl.to(root, { y: -12, autoAlpha: 1, duration: .13 }, .85);
  },
  unmount() { root = null; invalid = false; },
};
