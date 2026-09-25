import { resolveAssetURL } from './engine/asset-url.js';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const text = (value) => escapeHtml(value);
const asset = (value) => text(resolveAssetURL(value,
  document.baseURI.startsWith('about:') ? 'http://localhost/' : document.baseURI));
const lineAt = (copy, index) => text(copy.lines?.[index] || '');

function render(scene) {
  const { id, assets = {}, copy = {} } = scene;
  const lines = copy.lines || [];
  const kicker = text(copy.kicker);
  const title = text(copy.title);
  const poster = text(assets.poster);
  const heading = `<header class="story-head"><p class="story-kicker">${kicker}</p><h1 class="story-title">${title}</h1><p class="story-deck">${lineAt(copy, 0)}</p></header>`;

  if (id === '01-hero') {
    const stops = [['17:30', '강변'], ['19:10', '시장'], ['20:00', '물길']];
    return `<div class="story-hero"><div class="story-hero__media" data-media style="background-image:url('${poster}')"></div><img class="story-hero__poster" src="${poster}" alt="서울 저녁 산책 콘셉트 풍경"><div class="story-hero__veil"></div><header class="story-head story-head--hero"><p class="story-kicker">${kicker}</p><h1 class="story-title">${title}</h1><p class="story-deck">${lineAt(copy, 0)}</p><p class="story-note">${lineAt(copy, 1)}</p></header><div class="hero-sequence">${stops.map(([time, name], index) => `<div class="hero-sequence__item" data-step="${index}"><b>${time}</b><span>${name}</span></div>`).join('')}</div><div class="story-scroll">SCROLL TO FOLLOW THE STORY</div></div>`;
  }

  if (id === '02-route') {
    const stops = [
      ['17:30', '여의나루', '강변에서 걷기 시작', '도보'],
      ['18:20', '서촌', '한옥 골목을 천천히 걷기', '대중교통 연결'],
      ['19:10', '광장시장', '저녁을 먹고 쉬어가기', '대중교통 연결'],
      ['20:00', '청계천', '물길 구간으로 마무리', '도보'],
    ];
    const routeHeading = `<header class="story-head"><p class="story-kicker">${kicker}</p><h1 class="story-title">${title}</h1><p class="story-deck">네 장소를 잇는 순서 제안 · 시각은 예시</p></header>`;
    const photos = [
      ['/media/city-guide/04-postcards/image-05.webp', '여의나루 강변의 노을 콘셉트 장면'],
      ['/media/city-guide/04-postcards/image-03.webp', '서촌 한옥 골목의 저녁 콘셉트 장면'],
      ['/media/city-guide/04-postcards/image-04.webp', '광장시장 식사 장면 콘셉트 이미지'],
      ['/media/city-guide/04-postcards/image-02.webp', '청계천 물길의 저녁 콘셉트 장면'],
    ];
    const routePhoto = `<figure class="route-feature">${photos.map(([src, alt], index) => `<img data-route-photo="${index}" src="${asset(src)}" alt="${alt}" decoding="async" ${index ? 'loading="lazy"' : 'fetchpriority="high"'}>`).join('')}<figcaption class="route-feature__caption"><time data-route-time>17:30</time><strong data-route-place>여의나루</strong><span data-route-purpose>강변에서 걷기 시작</span></figcaption><span class="route-feature__credit">AI 콘셉트 이미지</span></figure>`;
    return `<div class="story-panel city-route">${routeHeading}<div class="route-layout">${routePhoto}<div class="route-readout" aria-label="산책 제안 순서">${stops.map(([time, name, detail, mode], index) => `<article class="route-stop" data-route-stop="${index}" data-step="${index}"><span class="route-time">${time}</span><div><h2>${name}</h2><p>${detail}</p></div><span class="route-mode">${mode}</span></article>`).join('')}</div></div><p class="story-source">장소 순서와 시각은 제안 예시입니다. 실제 환승·운영 시간·귀가 교통은 출발 전에 확인하세요.</p></div>`;
  }

  if (id === '03-stops') {
    const images = (assets.images || []).slice(0, 4);
    const captions = [
      ['17:30', '강변', '한강 위로 마지막 노을이 내려옵니다.'],
      ['18:20', '서촌', '골목의 불빛을 따라 걸음을 늦춥니다.'],
      ['19:10', '광장시장', '식사와 쉼을 저녁의 중심에 둡니다.'],
      ['20:00', '청계천', '물길을 따라 걸으며 하루를 마칩니다.'],
    ];
    return `<div class="story-panel city-stops">${heading}<div class="stop-story"><div class="stop-image-stack">${images.map((src, index) => `<img data-step="${index}" src="${text(src)}" alt="${text(assets.imageAlt?.[index] || captions[index][1])}" decoding="async" loading="${index ? 'lazy' : 'eager'}">`).join('')}<span class="stop-image-index">SEOUL · DUSK WALK</span></div><div class="stop-caption-stack">${captions.map(([time, name, detail], index) => `<article data-step="${index}"><time>${time}</time><h2>${name}</h2><p>${detail}</p></article>`).join('')}</div></div><p class="story-source">${text(scene.source || 'AI 제작 콘셉트 이미지 · 산책 설계 예시')}</p></div>`;
  }

  if (id === '07-choices') {
    const alternatives = [
      ['강변만 걷기', '한 구간', '노을과 물길을 천천히 보고 일찍 마칩니다.', '/media/city-guide/04-postcards/image-05.webp', '노을이 비치는 강변 산책 콘셉트 이미지'],
      ['시장에 머물기', '저녁 중심', '식사와 휴식에 시간을 쓰고 이동 지점을 줄입니다.', '/media/city-guide/04-postcards/image-04.webp', '저녁 시장 음식 준비 콘셉트 이미지'],
    ];
    return `<div class="story-panel city-options">${heading}<div class="option-stage"><figure class="option-feature" data-step="0"><img src="${asset('/media/city-guide/02-route/image.webp')}" alt="물길과 골목의 저녁을 걷는 사람들, AI 콘셉트 이미지"><figcaption><span>긴 저녁 · 전체 구성</span><h2>네 장소 잇기</h2><strong>강변 → 골목 → 시장 → 물길</strong><p>저녁의 풍경을 차례로 바꾸며 걷습니다. 장소 사이는 대중교통 연결을 확인하세요.</p></figcaption></figure><div class="option-alternatives">${alternatives.map(([name, scale, detail, src, alt], index) => `<article data-step="${index + 1}"><img src="${asset(src)}" alt="${alt}" loading="lazy"><div><span>${scale} · 짧은 선택</span><h3>${name}</h3><p>${detail}</p></div></article>`).join('')}</div></div><p class="story-source">거리·소요 시간은 제시하지 않습니다. 컨디션과 당일 교통·운영 시간에 맞춰 구간을 고르세요.</p></div>`;
  }

  if (id === '10-close') {
    return `<div class="city-end" style="--end-poster:url('${poster}')"><img class="city-end__image" src="${poster}" alt="서울 저녁 산책 콘셉트 풍경"><div class="city-end__wash"></div>${heading}<div class="end-checks">${lines.map((line, index) => `<p data-step="${index}"><span>0${index + 1}</span>${text(line)}</p>`).join('')}</div><b class="end-signoff">좋은 저녁 산책 되세요.</b><p class="story-source">${text(scene.source || '산책 설계 예시')}</p></div>`;
  }

  return `<div class="story-panel">${heading}<ul class="story-list">${lines.map((line, index) => `<li data-step="${index}">${text(line)}</li>`).join('')}</ul></div>`;
}

export function createStoryScene(id) {
  let root = null;
  let scrub = null;

  return {
    id,
    mount(section, ctx) {
      const scene = ctx.data.scene || {};
      section.querySelector('.story-mount').innerHTML = render(scene);
      root = section.querySelector('.story-mount').firstElementChild;
      const media = root?.querySelector('[data-media]');
      if (media && scene.assets?.frames) {
        scrub = ctx.frameScrub(media, {
          pattern: scene.assets.frames,
          count: scene.assets.count,
          critical: scene.assets.critical,
          poster: scene.assets.poster,
          fit: 'cover',
        });
      }
    },
    build(tl, ctx) {
      if (!root) {
        tl.fromTo({}, { autoAlpha: 0 }, { autoAlpha: 1, duration: .01 }, 0);
        return;
      }
      const scene = ctx.data.scene || {};
      const cues = scene.pace?.cueStates?.map((cue) => cue.at) || scene.cues || [];
      const heading = root.querySelector('.story-head');
      if (heading) tl.fromTo(heading, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .14, ease: 'power2.out' }, .02);

      if (id === '03-stops') {
        const images = [...root.querySelectorAll('.stop-image-stack img')];
        const captions = [...root.querySelectorAll('.stop-caption-stack article')];
        tl.set([...images, ...captions], { autoAlpha: 0 }, 0);
        images.forEach((image, index) => {
          const at = Math.max(.04, Number(cues[index] ?? (.24 + index * .18)));
          if (index) tl.set([images[index - 1], captions[index - 1]], { autoAlpha: 0 }, at);
          tl.fromTo([image, captions[index]], { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .08, ease: 'power2.out' }, at);
          tl.fromTo(image, { scale: 1.035 }, { scale: 1, duration: .16, ease: 'power1.out' }, at);
        });
      } else {
        root.querySelectorAll('[data-step]').forEach((element) => {
          const index = Number(element.dataset.step) || 0;
          const at = Math.max(.03, Number(cues[index] ?? (.30 + Math.min(index, 4) * .12)));
          tl.fromTo(element, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .07, ease: 'power2.out' }, at);
        });
      }

      if (id === '02-route') {
        const stops = [
          ['17:30', '여의나루', '강변에서 걷기 시작'],
          ['18:20', '서촌', '한옥 골목을 천천히 걷기'],
          ['19:10', '광장시장', '저녁을 먹고 쉬어가기'],
          ['20:00', '청계천', '물길 구간으로 마무리'],
        ];
        const photos = [...root.querySelectorAll('[data-route-photo]')];
        const rows = [...root.querySelectorAll('[data-route-stop]')];
        const activeTime = root.querySelector('[data-route-time]');
        const activePlace = root.querySelector('[data-route-place]');
        const activePurpose = root.querySelector('[data-route-purpose]');
        tl.set(photos, { autoAlpha: 0 }, 0);
        photos.forEach((photo, index) => {
          const at = Math.max(.08, Number(cues[index] ?? (.2 + index * .16)));
          if (index) tl.set(photos[index - 1], { autoAlpha: 0 }, at);
          tl.fromTo(photo, { scale: 1.04, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .10, ease: 'power2.out' }, at);
          tl.call(() => {
            rows.forEach((row, rowIndex) => row.classList.toggle('is-active', rowIndex === index));
            activeTime.textContent = stops[index][0];
            activePlace.textContent = stops[index][1];
            activePurpose.textContent = stops[index][2];
          }, [], at);
        });
      }

      const media = root.querySelector('[data-media]');
      if (media && scrub) {
        const playhead = { value: 0 };
        tl.to(playhead, { value: 1, duration: .84, ease: 'none', onUpdate: () => scrub?.setProgress(playhead.value) }, .02);
        tl.fromTo(media, { scale: 1.025 }, { scale: 1.1, duration: .9, ease: 'none' }, 0);
      }
    },
    unmount() {
      scrub?.destroy?.();
      scrub = null;
      root = null;
    },
  };
}
