// kinetic-titles — each copy.lines entry becomes a numbered block on a
// diagonal. Write a line as "Title // bullet · bullet" to add bullets.
let root = null;


const element = (tag, className, text = '') => {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
};


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

// Blocks march down the diagonal. y starts at 26% so block 01 clears the
// scene heading (kicker + title end near 18% on a 700px-tall viewport).

export default {
  id: '10-close',

  mount(section, ctx) {
    root = section.querySelector('.kt') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = (copy.lines || []).slice(0, 4);

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="source"]').textContent = scene.source || '투자 검토용 가상 제안 · 실제 성과 수치 없음';
    const blocks = lines.map((line, index) => {
      const item = parse(line);
      const block = element('article', 'kt__block');
      block.setAttribute('data-accent', String((index % 3) + 1));
      block.append(element('p', 'kt__num', String(index + 1).padStart(2, '0')));
      block.append(element('h3', 'kt__title', item.title));
      if (item.bullets.length) {
        const list = element('ul', 'kt__bullets');
        list.replaceChildren(...item.bullets.map((bullet) => element('li', '', bullet)));
        block.append(list);
      }
      return block;
    });
    root.querySelector('[data-role="blocks"]').replaceChildren(...blocks);

  },

  build(tl, ctx) {
    const heading = root.querySelector('.kt__head-copy');
    const blocks = [...root.querySelectorAll('.kt__block')];
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      tl.set([heading, ...blocks], { autoAlpha: 1, x: 0, y: 0 });
      return;
    }
    tl.fromTo(heading, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1 }, 0);
    tl.fromTo(blocks, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1, stagger: 0.04 }, 0.16);
  },

  unmount() { root = null; },
};
