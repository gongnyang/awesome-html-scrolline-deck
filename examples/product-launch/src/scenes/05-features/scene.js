// Product detail board: one product photo with three adjacent visual crops and labels.
let root = null;

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
  id: '05-features',

  mount(section, ctx) {
    root = section.querySelector('.an') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const assets = scene.assets || {};
    const rows = toRows(scene).slice(0, 3);
    const image = (assets.images || [])[0];

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';

    const art = root.querySelector('[data-role="art"]');
    if (image) {
      const img = document.createElement('img');
      img.src = image;
      img.alt = copy.title || '';
      img.decoding = 'async';
      art.append(img);
      const details = document.createElement('div');
      details.className = 'an__closeups';
      details.replaceChildren(...rows.map((row, index) => {
        const figure = document.createElement('figure');
        figure.className = `an__closeup an__closeup--${index + 1}`;
        const cropFrame = document.createElement('div');
        cropFrame.className = 'an__closeup-image';
        const crop = document.createElement('img');
        crop.src = image;
        crop.alt = '';
        crop.setAttribute('aria-hidden', 'true');
        const caption = document.createElement('figcaption');
        const label = document.createElement('strong');
        label.textContent = row.label;
        const description = document.createElement('span');
        description.textContent = row.value;
        caption.append(label, description);
        cropFrame.append(crop);
        figure.append(cropFrame, caption);
        return figure;
      }));
      art.append(details);
    }

    root.querySelector('[data-role="rows"]').innerHTML = rows.map((row, index) =>
      `<div class="an__row" data-slot="r${index}"><span class="an__label">${esc(row.label)}</span><p class="an__value">${esc(row.value)}</p></div>`).join('');

  },

  build(tl, ctx) {
    const art = root.querySelector('[data-role="art"]');
    const copy = root.querySelector('.an__copy');
    const rows = [...root.querySelectorAll('.an__row')];
    const details = [...root.querySelectorAll('.an__closeup')];

    // Enter: reveal product and its three actual close crops; hold them beside their labels.
    tl.fromTo(art, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12, ease: 'power2.out' }, 0);
    tl.fromTo(copy, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1 }, 0);
    tl.fromTo(details, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1, stagger: 0.03 }, 0.08);
    tl.fromTo(rows, { x: 16, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.1, stagger: 0.03 }, 0.1);

    // Keep the claim, product image and adjacent labels complete through the exit.
  },

  unmount() { root = null; },
};
