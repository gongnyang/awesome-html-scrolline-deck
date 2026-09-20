// anatomy-rows — take one artefact apart. Rows come from assets.rows
// ([{label, value}]) or from copy.lines written as "Label: sentence".
let root = null;
let observer = null;
let frame = 0;

const MARKS = [[24, 31], [64, 41], [42, 70], [75, 78], [33, 52], [58, 22]];

const esc = (value) => String(value).replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));

const toRows = (scene) => {
  const assets = scene.assets || {};
  if (Array.isArray(assets.rows) && assets.rows.length) {
    return assets.rows.map((row) => ({ label: row.label || '', value: row.value || '' }));
  }
  return (scene.copy && scene.copy.lines ? scene.copy.lines : []).map((line) => {
    const at = String(line).indexOf(':');
    if (at < 0) return { label: '', value: String(line).trim() };
    return { label: String(line).slice(0, at).trim(), value: String(line).slice(at + 1).trim() };
  });
};

function drawRules() {
  if (!root) return;
  const box = root.getBoundingClientRect();
  if (!box.width) return;
  const svg = root.querySelector('[data-role="rules"]');
  svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
  root.querySelectorAll('.an__row').forEach((row) => {
    const key = row.dataset.slot;
    const mark = root.querySelector(`.an__mark[data-mark="${key}"]`);
    const path = root.querySelector(`path[data-rule="${key}"]`);
    if (!mark || !path) return;
    const from = row.getBoundingClientRect();
    const to = mark.getBoundingClientRect();
    const x1 = from.left - box.left;
    const y1 = from.bottom - box.top;
    const x2 = to.left - box.left + to.width / 2;
    const y2 = to.top - box.top + to.height / 2;
    const bend = (x1 + x2) / 2;
    path.setAttribute('d', `M ${x1} ${y1} C ${bend} ${y1} ${bend} ${y2} ${x2} ${y2}`);
    path.setAttribute('pathLength', '1');
  });
}

const schedule = () => {
  if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame);
  frame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(drawRules) : 0;
};

export default {
  id: '02-anatomy',

  mount(section, ctx) {
    root = section.querySelector('.an') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const assets = scene.assets || {};
    const rows = toRows(scene).slice(0, MARKS.length);
    const image = (assets.images || [])[0];

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';

    const art = root.querySelector('[data-role="art"]');
    art.innerHTML = (image ? `<img src="${image}" alt="${esc(copy.title || '')}" decoding="async" />` : '')
      + rows.map((row, index) => `<i class="an__mark" data-mark="r${index}" style="--ax:${MARKS[index][0]};--ay:${MARKS[index][1]}"></i>`).join('');

    root.querySelector('[data-role="rows"]').innerHTML = rows.map((row, index) =>
      `<div class="an__row" data-slot="r${index}"><span class="an__label">${esc(row.label)}</span><p class="an__value">${esc(row.value)}</p></div>`).join('');

    root.querySelector('[data-role="rules"]').innerHTML = rows
      .map((row, index) => `<path data-rule="r${index}" pathLength="1" />`).join('');

    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(schedule);
      observer.observe(root);
    }
    schedule();
  },

  build(tl, ctx) {
    const art = root.querySelector('[data-role="art"]');
    const copy = root.querySelector('.an__copy');
    const rows = [...root.querySelectorAll('.an__row')];
    const marks = [...root.querySelectorAll('.an__mark')];
    const rules = [...root.querySelectorAll('[data-role="rules"] path')];
    const setActive = (index) => rows.forEach((row, i) => row.classList.toggle('is-active', i === index));

    ctx.gsap.set(rows, { '--line': 0, '--reveal': 0 });

    // enter — 0 .. 0.30. The art wipes in, then each row draws its own rule.
    tl.fromTo(art, { '--clip': 0 }, { '--clip': 1, duration: 0.1, ease: 'power2.out' }, 0);
    tl.fromTo(copy, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1 }, 0);
    rows.forEach((row, index) => {
      const at = 0.04 + index * 0.03;
      tl.to(row, { '--line': 1, '--reveal': 1, duration: 0.09 }, at);
      if (rules[index]) tl.fromTo(rules[index], { '--draw': 0, '--ext': 0 }, { '--draw': 1, '--ext': 1, duration: 0.09 }, at);
      if (marks[index]) tl.fromTo(marks[index], { '--pop': 0, autoAlpha: 0 }, { '--pop': 1, autoAlpha: 1, duration: 0.05 }, at + 0.04);
    });

    // hold — 0.30 .. 0.75. Walk the rows one at a time while you explain them.
    rows.forEach((_, index) => tl.call(setActive, [index], 0.32 + index * 0.075));

    // exit — 0.75 .. 1.00. Rules retract, rows close, the art pushes out.
    if (rules.length) tl.to(rules, { '--draw': 0, duration: 0.1, stagger: 0.015 }, 0.76);
    tl.to(rows, { autoAlpha: 0, duration: 0.1, stagger: 0.015 }, 0.8);
    tl.to(art, { scale: 1.04, autoAlpha: 0, duration: 0.14 }, 0.84);
    tl.to(copy, { autoAlpha: 0, duration: 0.1, ease: 'none' }, 0.86);
  },

  unmount() {
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame);
    if (observer) observer.disconnect();
    observer = null;
    root = null;
  },
};
