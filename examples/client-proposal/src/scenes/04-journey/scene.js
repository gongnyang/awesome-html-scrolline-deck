let root = null;

const node = (tag, className, text = '') => {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
};

const splitLine = (line) => {
  const [title, ...rest] = String(line).split(':');
  return { title: title.trim(), detail: rest.join(':').trim() };
};

export default {
  id: '04-journey',
  mount(section, ctx) {
    root = section.querySelector('.s') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const lines = (copy.lines || []).slice(0, 3);
    const images = scene.assets?.images || [];
    const track = root.querySelector('[data-role="track"]');
    const route = root.querySelector('[data-role="route"]');

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="total"]').textContent = String(lines.length).padStart(2, '0');
    route.replaceChildren(...lines.map((line, index) => {
      const { title } = splitLine(line);
      const item = node('li', 's__route-label', title);
      item.setAttribute('data-index', String(index));
      return item;
    }));

    const frames = lines.map((line, index) => {
      const { title, detail } = splitLine(line);
      const frame = node('figure', 's__frame');
      frame.setAttribute('data-step', '');
      frame.setAttribute('data-index', String(index));
      frame.setAttribute('aria-label', `${index + 1}단계, ${title}`);
      const image = node('img', 's__image');
      image.src = images[index] || '';
      image.alt = `${title} 단계의 고객 행동을 보여 주는 가상 사례용 AI 재구성 이미지`;
      image.loading = 'eager';
      image.decoding = 'async';
      image.draggable = false;
      const shade = node('span', 's__shade');
      shade.setAttribute('aria-hidden', 'true');
      const caption = node('figcaption', 's__caption');
      caption.append(node('span', 's__step', `0${index + 1}`));
      caption.append(node('h3', 's__frame-title', title));
      caption.append(node('p', 's__detail', detail));
      frame.append(image, shade, caption);
      return frame;
    });
    track.replaceChildren(...frames);
    track.style.width = `${frames.length * 100}%`;
    frames.forEach((frame) => { frame.style.flexBasis = `${100 / frames.length}%`; });
    root.querySelector('[data-role="marker"]').style.left = '0%';
  },
  build(tl, ctx) {
    // enter — establish the first customer moment, then move through the route.
    const track = root.querySelector('.s__track');
    const frames = [...root.querySelectorAll('.s__frame')];
    const images = frames.map((frame) => frame.querySelector('.s__image'));
    const captions = frames.map((frame) => frame.querySelector('.s__caption'));
    const marker = root.querySelector('.s__route-marker');
    const fill = root.querySelector('.s__route-fill');
    const current = root.querySelector('[data-role="current"]');
    const labels = [...root.querySelectorAll('.s__route-label')];
    const setActive = (index) => {
      current.textContent = String(index + 1).padStart(2, '0');
      marker.style.left = `${frames.length > 1 ? (index / (frames.length - 1)) * 100 : 0}%`;
      frames.forEach((frame, i) => frame.setAttribute('aria-hidden', String(i !== index)));
      labels.forEach((label, i) => label.classList.toggle('is-active', i === index));
    };

    ctx.gsap.set(track, { xPercent: 0 });
    ctx.gsap.set(fill, { '--fill': 0 });
    frames.forEach((frame, index) => {
      ctx.gsap.set(frame, { autoAlpha: index === 0 ? 1 : 0 });
      ctx.gsap.set(images[index], { scale: 1.08 });
      ctx.gsap.set(captions[index], { y: 28, autoAlpha: 0 });
    });
    setActive(0);

    frames.forEach((frame, index) => {
      const start = 0.06 + index * 0.28;
      if (index > 0) {
        tl.to(track, { xPercent: -(index / frames.length) * 100, duration: 0.18, ease: 'power2.inOut' }, start);
        tl.fromTo(frame, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, start + 0.03);
      }
      tl.to(images[index], { scale: 1, duration: 0.26, ease: 'power1.out' }, start);
      tl.fromTo(captions[index], { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12 }, start + 0.04);
      const progress = frames.length > 1 ? index / (frames.length - 1) : 1;
      tl.to(fill, { '--fill': progress, duration: 0.18 }, start);
      tl.to(marker, { left: `${progress * 100}%`, duration: 0.18, ease: 'power2.inOut' }, start);
      tl.call(setActive, [index], start + (index === 0 ? 0.02 : 0.18));
    });
    // hold — each image and caption gets a speaking beat as its section becomes active.
    // exit — leave the last customer moment on screen until the next scene takes over.
    tl.to(root, { autoAlpha: 0, y: -20, duration: 0.14 }, 0.84);
  },
  unmount() { root = null; },
};
