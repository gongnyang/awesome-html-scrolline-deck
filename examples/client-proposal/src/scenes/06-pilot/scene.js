let root = null;

const node = (tag, className, text = '') => {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
};

const parseLine = (line, index) => {
  const [range = '', phase = '', ...rest] = String(line).split(':');
  const match = range.match(/(\d+)\s*[-–~]\s*(\d+)/);
  const weeks = match ? Number(match[2]) - Number(match[1]) + 1 : 1;
  return {
    range: range.trim() || `${index + 1}주`,
    phase: phase.trim() || range.trim(),
    detail: rest.join(':').trim(),
    weeks: Math.max(1, weeks),
  };
};

export default {
  id: '06-pilot',
  mount(section, ctx) {
    root = section.querySelector('.t') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const phases = (copy.lines || []).slice(0, 3).map(parseLine);
    const ruler = root.querySelector('[data-role="ruler"]');
    const readout = root.querySelector('[data-role="readout"]');
    const totalWeeks = phases.reduce((sum, phase) => sum + phase.weeks, 0);
    let elapsedWeeks = 0;

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="weeks"]').textContent = String(totalWeeks);
    ruler.replaceChildren(...phases.map((phase, index) => {
      const segment = node('div', `t__segment t__segment--${index + 1}`);
      segment.setAttribute('data-step', '');
      segment.setAttribute('data-index', String(index));
      segment.setAttribute('data-weeks', String(phase.weeks));
      segment.setAttribute('data-position', String(((elapsedWeeks + phase.weeks / 2) / totalWeeks) * 100));
      elapsedWeeks += phase.weeks;
      segment.style.flexGrow = String(phase.weeks);
      segment.append(node('span', 't__range', phase.range));
      segment.append(node('span', 't__segment-name', phase.phase));
      return segment;
    }));
    readout.replaceChildren(...phases.map((phase, index) => {
      const article = node('article', 't__phase');
      article.setAttribute('data-step', '');
      article.setAttribute('data-index', String(index));
      article.append(node('span', 't__phase-number', `0${index + 1} / ${phase.range}`));
      article.append(node('h3', 't__phase-title', phase.phase));
      article.append(node('p', 't__phase-detail', phase.detail));
      return article;
    }));
  },
  build(tl, ctx) {
    // enter — draw the real two/eight/two-week proportion before naming the first action.
    const segments = [...root.querySelectorAll('.t__segment')];
    const phases = [...root.querySelectorAll('.t__phase')];
    const marker = root.querySelector('.t__marker');
    const setActive = (index) => {
      root.dataset.active = String(index);
      marker.style.left = `${segments[index].dataset.position}%`;
      segments.forEach((segment, i) => segment.classList.toggle('is-active', i === index));
      phases.forEach((phase, i) => {
        phase.classList.toggle('is-active', i === index);
        phase.setAttribute('aria-hidden', String(i !== index));
      });
    };

    phases.forEach((phase, index) => ctx.gsap.set(phase, { autoAlpha: index === 0 ? 1 : 0, y: 18 }));
    segments.forEach((segment) => ctx.gsap.set(segment, { scaleX: 0 }));
    ctx.gsap.set(marker, { left: '0%' });
    setActive(0);
    tl.fromTo(root.querySelector('.t__head'), { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.14 }, 0);
    segments.forEach((segment, index) => {
      const phase = phases[index];
      const start = 0.08 + index * 0.06;
      tl.to(segment, { scaleX: 1, duration: 0.14, ease: 'power2.out' }, start);
      const phaseStart = 0.1 + index * 0.27;
      if (index > 0) {
        tl.to(phases[index - 1], { autoAlpha: 0, y: -8, duration: 0.08 }, phaseStart);
        tl.fromTo(segment, { scale: 1 }, { scale: 1.025, duration: 0.08, yoyo: true, repeat: 1 }, phaseStart);
      }
      tl.fromTo(phase, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.11, ease: 'power2.out' }, phaseStart + (index ? 0.06 : 0));
      const position = Number(segments[index].dataset.position || 100);
      tl.to(marker, { left: `${position}%`, duration: 0.16, ease: 'power2.inOut' }, phaseStart);
      tl.call(setActive, [index], phaseStart + 0.02);
    });
    // hold — the presenter can explain each phase while the proportional schedule stays in view.
    // exit — clear the timeline for the decision scene.

  },
  unmount() { root = null; },
};
