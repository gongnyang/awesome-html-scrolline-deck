let root = null;
const node = (tag, className, text = '') => { const el = document.createElement(tag); el.className = className; el.textContent = text; return el; };
export default {
  id: '07-quarters',
  mount(section, ctx) {
    root = section.querySelector('.t') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = (copy.lines || []).slice(0, 4);
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    const railHost = root.querySelector('[data-role="rail"]');
    railHost.replaceChildren(...lines.map((line, index) => {
      const parts = String(line).split(':');
      const event = node('article', 't__event');
      event.append(node('span', 't__date', parts[0] || String(index + 1).padStart(2, '0')));
      event.append(node('h3', '', parts[1] || line));
      event.append(node('p', '', parts.slice(2).join(':').trim()));
      return event;
    }));
  },
  build(tl, ctx) {
    const events = [...root.querySelectorAll('.t__event')];
    const cues = (ctx.data.scene && ctx.data.scene.cues) || [];
    // Each cue completes one quarter. The fourth settles by .45, leaving the
    // center of the pin as a full, still chart for the speaker.
    events.forEach((event, index) => {
      const cue = Number(cues[index]);
      const finish = Number.isFinite(cue) ? Math.min(0.45, Math.max(0.18, cue)) : 0.18 + index * 0.09;
      const start = Math.max(0.04, finish - 0.10);
      tl.fromTo(event, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: finish - start, ease: 'power2.out' }, start);
    });
    const lastCue = Number(cues[events.length - 1]);
    const railEnd = Number.isFinite(lastCue) ? Math.min(0.45, Math.max(0.18, lastCue)) : 0.45;
    tl.fromTo(root.querySelector('.t__rail'), { '--progress': 0 }, { '--progress': 1, duration: railEnd, ease: 'none' }, 0);
    tl.to(root, { autoAlpha: 0, y: -24, duration: 0.16 }, 0.82);
  },
  unmount() { root = null; },
};
