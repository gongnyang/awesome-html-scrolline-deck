let root = null;
let invalid = false;
const node = (tag, className, text = '') => { const el = document.createElement(tag); el.className = className; el.textContent = text; return el; };
export default {
  id: '{{id}}',
  mount(section, ctx) {
    root = section.querySelector('.t') || section;
    invalid = false;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = Array.isArray(copy.lines) ? copy.lines : [];
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    const railHost = root.querySelector('[data-role="rail"]');
    const parsed = lines.map((line) => String(line).split(':').map((part) => part.trim()));
    const errors = [];
    if (lines.length < 2 || lines.length > 4) errors.push('실제 날짜/기간이 있는 이정표 2–4개가 필요합니다.');
    parsed.forEach((parts, i) => { if (parts.length < 3 || !parts[0] || !parts[1] || !parts.slice(2).join(':').trim()) errors.push(`${i + 1}번째 이정표는 '날짜/기간: 이정표: 의미' 형식이어야 합니다.`); });
    const error = root.querySelector('[data-role="error"]');
    if (errors.length) { invalid = true; error.hidden = false; error.textContent = `연대표를 만들 수 없습니다. ${errors.join(' ')}`; railHost.hidden = true; return; }
    error.hidden = true; railHost.hidden = false;
    railHost.style.setProperty('--progress', '0');
    railHost.replaceChildren(...lines.map((line, index) => {
      const parts = parsed[index];
      const event = node('article', 't__event');
      event.append(node('span', 't__date', parts[0] || String(index + 1).padStart(2, '0')));
      event.append(node('h3', '', parts[1] || line));
      event.append(node('p', '', parts.slice(2).join(':').trim()));
      return event;
    }));
  },
  build(tl, ctx) {
    if (invalid) { tl.fromTo(root.querySelector('[data-role="error"]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: .1 }, 0); tl.to(root.querySelector('[data-role="error"]'), { autoAlpha: 0, duration: .1 }, .85); return; }
    // enter — establish the dated progression before revealing its milestones.
    const events = [...root.querySelectorAll('.t__event')];
    tl.fromTo(events, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.13, stagger: 0.06 }, 0.06);
    tl.fromTo(root.querySelector('.t__rail'), { '--progress': 0 }, { '--progress': 1, duration: 0.25 }, 0);
    // hold — keep every date, milestone, and consequence together on screen.
    // exit — leave the completed chronology before the next scene.
    tl.to(root, { autoAlpha: 0, y: -16, duration: 0.13 }, 0.85);
  },
  unmount() { root = null; invalid = false; },
};
