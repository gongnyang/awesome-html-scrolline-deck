// horizontal-gallery — assets.images pan sideways while the pin holds.
let root = null;
let cards = [];

const pad = (n) => String(n).padStart(2, '0');

export default {
  id: '07-templates',

  mount(section, ctx) {
    root = section.querySelector('.gal') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const images = (scene.assets || {}).images || [];
    const slides = images.length ? images : [null];
    cards = (scene.assets || {}).galleryItems || [];

    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('[data-role="line"]').textContent = (copy.lines || [])[0] || '';
    const alt = (scene.assets || {}).imageAlt || [];
    root.querySelector('[data-role="track"]').replaceChildren(...slides.map((src, index) => {
      const figure = document.createElement('figure');
      figure.className = 'gal__item';
      if (src) {
        const image = document.createElement('img');
        image.src = src;
        image.alt = alt[index] || `${copy.title || '장면'} ${index + 1}`;
        image.decoding = 'async';
        image.loading = index === 0 ? 'eager' : 'lazy';
        if (index === 0) image.setAttribute('fetchpriority', 'high');
        figure.append(image);
      }
      const label = document.createElement('figcaption');
      label.className = 'gal__item-label';
      label.textContent = cards[index]?.title || alt[index] || '';
      figure.append(label);
      if (index === 0) {
        const sample = document.createElement('div');
        sample.className = 'gal__sample-board';
        sample.innerHTML = '<span class="sample-board__label">샘플 발표 화면 · 완성 상태</span><strong>한 장면에는<br>한 가지 주장</strong><div class="sample-board__proof"><article><b>주장</b><p>청중이 기억할 한 문장</p></article><article><b>시각 근거</b><p>설명을 뒷받침하는 예시</p></article><article><b>출처</b><p>근거를 다시 확인할 정보</p></article></div><small>발표 중에도 주장과 근거를 함께 읽을 수 있도록 구성한 화면</small>';
        figure.append(sample);
      }
      return figure;
    }));
    root.querySelector('[data-role="count"]').textContent = `${pad(1)} / ${pad(slides.length)}`;
    const first = cards[0];
    if (first) {
      root.querySelector('[data-role="kicker"]').textContent = first.kicker || copy.kicker || '';
      root.querySelector('[data-role="title"]').textContent = first.title || copy.title || '';
      root.querySelector('[data-role="line"]').textContent = first.line || (copy.lines || [])[0] || '';
    }
  },

  build(tl) {
    const track = root.querySelector('[data-role="track"]');
    const count = root.querySelector('[data-role="count"]');
    const kicker = root.querySelector('[data-role="kicker"]');
    const title = root.querySelector('[data-role="title"]');
    const line = root.querySelector('[data-role="line"]');
    const caption = root.querySelector('.gal__caption');
    const first = root.querySelector('.gal__item');
    const total = root.querySelectorAll('.gal__item').length;
    const pan = { p: 0 };

    // enter — 0 .. 0.30. The first frame opens and the caption settles.
    if (first) tl.fromTo(first, { '--clip': 18 }, { '--clip': 0, duration: 0.18, ease: 'power2.out' }, 0);
    tl.fromTo(caption, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.14, ease: 'power2.out' }, 0);

    // hold — a short move is followed by a full-frame speaking stop for each example.
    // Let the selected native sample read as a complete screen before the
    // gallery moves on to contrasting examples.
    const interval = 0.48 / Math.max(1, total - 1);
    for (let index = 1; index < total; index += 1) {
      const at = 0.3 + (index - 1) * interval;
      const duration = interval * 0.42;
      tl.to(track, { xPercent: -(index * 100), duration, ease: 'power2.inOut' }, at);
      tl.to(pan, {
        p: index / (total - 1), duration, ease: 'none',
        onUpdate: () => {
          const active = Math.min(total - 1, Math.round(pan.p * (total - 1)));
          count.textContent = `${pad(active + 1)} / ${pad(total)}`;
          if (cards[active]) {
            kicker.textContent = cards[active].kicker || '';
            title.textContent = cards[active].title || '';
            line.textContent = cards[active].line || '';
          }
        },
      }, at);
    }

    // Keep the sample board and its selection reason legible through the exit.
  },

  unmount() { root = null; cards = []; },
};
