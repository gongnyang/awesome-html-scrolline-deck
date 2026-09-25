// kinetic-titles — each copy.lines entry becomes a numbered block on a
// diagonal. Write a line as "Title // bullet · bullet" to add bullets.
let root = null;

const VB = { w: 1000, h: 700 };

const element = (tag, className, text = '') => {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
};

const words = (text) => String(text).split(/(\s+)/).filter(Boolean).map((word) =>
  element('span', 'kt__word', /^\s+$/.test(word) ? '\u00a0' : word));

// "Title // bullet · bullet" adds bullets under a block. Prefer "//": the CLI
// splits its own `--lines` value on "|", so a pipe never survives the round trip.
const parse = (line) => {
  const text = String(line);
  // "//" has to be surrounded by spaces so a URL in a title survives.
  const sep = text.match(/\s\/\/\s|\s*\|\s*/);
  if (!sep) return { title: text.trim(), bullets: [] };
  const bullets = text.slice(sep.index + sep[0].length)
    .split(/\s*[·;]\s*/).map((item) => item.trim()).filter(Boolean);
  return { title: text.slice(0, sep.index).trim(), bullets };
};

// Blocks march down the diagonal. Keep the first anchor below a two-line
// heading at projection size; four anchors still fit in the viewport.
const spot = (index, total) => {
  const t = total > 1 ? index / (total - 1) : 0.5;
  return { x: 4 + t * 52, y: 36 + t * 42 };
};

// The light runs a rail, not a straight diagonal: down each block's left
// margin, then across the gap to the next number. A straight line through the
// staircase would cut through the titles themselves.
const RAIL_GAP = 2.4; // % of width, left of the block's text edge
const railPoints = (blocksEl, total) => {
  const stageH = Number(blocksEl && blocksEl.offsetHeight) || 0;
  const blocks = blocksEl && blocksEl.querySelectorAll ? Array.from(blocksEl.querySelectorAll('.kt__block')) : [];
  const points = [];
  for (let index = 0; index < total; index += 1) {
    const at = spot(index, total);
    const el = blocks[index];
    const hPct = stageH && el && Number(el.offsetHeight) ? (Number(el.offsetHeight) / stageH) * 100 : 18;
    const rail = at.x - RAIL_GAP;
    points.push([rail, at.y + 1.2]);
    points.push([rail, Math.min(at.y + hPct, 96)]);
  }
  return points;
};

export default {
  id: '{{id}}',

  mount(section, ctx) {
    root = section.querySelector('.kt') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = (copy.lines || []).slice(0, 4);

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    const blocks = lines.map((line, index) => {
      const item = parse(line);
      const at = spot(index, lines.length);
      const block = element('article', 'kt__block');
      block.setAttribute('data-accent', String((index % 3) + 1));
      block.style.setProperty('--bx', String(at.x));
      block.style.setProperty('--by', String(at.y));
      block.append(element('p', 'kt__num', String(index + 1).padStart(2, '0')));
      const title = element('h3', 'kt__title');
      title.replaceChildren(...words(item.title));
      block.append(title);
      if (item.bullets.length) {
        const list = element('ul', 'kt__bullets');
        list.replaceChildren(...item.bullets.map((bullet) => element('li', '', bullet)));
        block.append(list);
      }
      return block;
    });
    root.querySelector('[data-role="blocks"]').replaceChildren(...blocks);

    const points = railPoints(root.querySelector('[data-role="blocks"]'), lines.length)
      .map(([x, y]) => `${Math.round(x / 100 * VB.w)} ${Math.round(y / 100 * VB.h)}`);
    const d = points.length > 1 ? `M ${points.join(' L ')}` : `M 0 0 L ${VB.w} ${VB.h}`;
    const path = root.querySelector('[data-role="line"]');
    path.setAttribute('d', d);
    path.setAttribute('pathLength', '1');
    root.querySelector('[data-role="head"]').style.offsetPath = `path('${d}')`;
  },

  build(tl, ctx) {
    const grid = root.querySelector('.kt__grid');
    const heading = root.querySelector('.kt__head-copy');
    const line = root.querySelector('[data-role="line"]');
    const head = root.querySelector('[data-role="head"]');
    const blocks = [...root.querySelectorAll('.kt__block')];
    const titles = blocks.map((block) => block.querySelector('.kt__title'));
    const bullets = blocks.map((block) => [...block.querySelectorAll('.kt__bullets li')]).flat();
    const setActive = (index) => blocks.forEach((block, i) => block.classList.toggle('is-active', i === index));

    ctx.gsap.set(grid, { '--grid': 0 });
    ctx.gsap.set(line, { '--draw': 0 });
    ctx.gsap.set(head, { '--head': 0, '--head-on': 0 });
    if (bullets.length) ctx.gsap.set(bullets, { '--reveal': 0 });

    // enter — reveal the named route in reading order, without throwing text across the stage.
    tl.to(grid, { '--grid': 1, duration: 0.06 }, 0);
    tl.fromTo(heading, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.08 }, 0);
    titles.forEach((title, index) => {
      tl.fromTo(title, { y: 22, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.1, ease: 'power2.out' }, 0.05 + index * 0.055);
    });
    tl.to(line, { '--draw': 1, duration: 0.2, ease: 'power2.out' }, 0.06);
    tl.to(head, { '--head': 1, '--head-on': 1, duration: 0.2 }, 0.06);
    if (bullets.length) tl.to(bullets, { '--reveal': 1, duration: 0.06, stagger: 0.015 }, 0.2);

    // hold — 0.30 .. 0.75. The accent walks block to block as you talk.
    blocks.forEach((_, index) => tl.call(setActive, [index], 0.36 + index * 0.1));

    // exit — the full route holds through the spoken transition, then clears together.
    if (bullets.length) tl.to(bullets, { '--reveal': 0, duration: 0.08, stagger: 0.01 }, 0.76);
    blocks.forEach((block) => tl.to(block, { y: -14, autoAlpha: 0, duration: 0.12, ease: 'power2.in' }, 0.84));
    tl.to(line, { '--draw': 0, duration: 0.14 }, 0.82);
    tl.to(head, { '--head-on': 0, duration: 0.14 }, 0.82);
    tl.to(heading, { y: -24, autoAlpha: 0, duration: 0.1 }, 0.88);
  },

  unmount() { root = null; },
};
