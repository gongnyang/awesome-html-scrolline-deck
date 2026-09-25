let root = null;
let hasError = false;

export default {
  id: '{{id}}',
  mount(section, ctx) {
    root = section.querySelector('.dp') || section;
    hasError = false;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    const assets = scene.assets || {};
    const images = Array.isArray(assets.images) ? assets.images : [];
    const alts = Array.isArray(assets.imageAlt) ? assets.imageAlt : [];
    const marks = Array.isArray(assets.marks) ? assets.marks : [];
    const mark = marks[0];
    const lines = Array.isArray(copy.lines) ? copy.lines : [];
    const problems = [];
    if (images.length !== 2 || images.some((url) => typeof url !== 'string' || !url.trim())) problems.push('assets.images에는 같은 원본에서 가져온 전체 페이지 이미지와 해당 인용부 확대 crop 두 장이 필요합니다.');
    if (alts.length !== 2 || alts.some((alt) => typeof alt !== 'string' || !alt.trim())) problems.push('두 이미지 각각의 대체 텍스트가 필요합니다.');
    if (!Array.isArray(mark) || mark.length !== 2 || mark.some((n) => !Number.isFinite(n) || n < 0 || n > 100)) problems.push('전체 페이지에서 인용부 위치를 가리키는 [x,y] 좌표(0–100)가 필요합니다.');
    if (lines.length < 2 || !lines[0]?.trim() || !lines[1]?.trim()) problems.push('copy.lines[0]에 원문 인용, copy.lines[1]에 주장과 연결되는 해석이 필요합니다.');
    if (!scene.source?.trim()) problems.push('scene.source에 저자/기관·문서명·발행일을 표시해야 합니다.');
    if (!scene.evidence?.trim()) problems.push('scene.evidence에 페이지/절/단락 등 재확인 가능한 원문 위치가 필요합니다.');
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    if (problems.length) {
      hasError = true;
      const error = root.querySelector('[data-role="error"]');
      error.hidden = false;
      error.textContent = `문서 근거 장면을 만들 수 없습니다. ${problems.join(' ')}`;
      root.querySelector('[data-role="proof"]').hidden = true;
      return;
    }
    root.querySelector('[data-role="proof"]').hidden = false;
    const page = root.querySelector('[data-role="page"]');
    page.src = images[0];
    page.alt = alts[0];
    page.decoding = 'async';
    const crop = root.querySelector('[data-role="crop"]');
    crop.src = images[1];
    crop.alt = alts[1];
    crop.decoding = 'async';
    root.querySelector('[data-role="quote"]').textContent = `“${lines[0]}”`;
    root.querySelector('[data-role="context"]').textContent = lines[1];
    root.querySelector('[data-role="source"]').textContent = `출처 · ${scene.source}`;
    root.querySelector('[data-role="locator"]').textContent = scene.evidence;
    root.querySelector('[data-role="crop-alt"]').textContent = `원문 위치 확대 · ${scene.evidence}`;
    const anchor = root.querySelector('[data-role="anchor"]');
    anchor.style.setProperty('--anchor-x', String(mark[0]));
    anchor.style.setProperty('--anchor-y', String(mark[1]));
  },
  build(tl) {
    if (hasError) {
      tl.fromTo(root.querySelector('[data-role="error"]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0);
      tl.to(root.querySelector('[data-role="error"]'), { autoAlpha: 1, duration: 0.1 }, 0.85);
      return;
    }
    const page = root.querySelector('.dp__page');
    const crop = root.querySelector('.dp__crop');
    const quote = root.querySelector('.dp__quote');
    const source = root.querySelector('.dp__source');
    // enter — establish the source page and guide the viewer to its exact cited location.
    tl.fromTo(root.querySelector('.dp__head'), { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12 }, 0);
    tl.fromTo(page, { x: -18, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.14 }, 0.03);
    tl.fromTo(root.querySelector('.dp__anchor'), { scale: 0.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.1 }, 0.16);
    tl.fromTo(crop, { scale: 0.94, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.16 }, 0.18);
    tl.fromTo(quote, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12 }, 0.25);
    tl.fromTo(source, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0.28);
    // hold — locator, full page anchor, legible crop, exact quote, context, and citation stay together.
    // exit — move on after the audience has seen the cited passage in context.
    tl.to(root.querySelector('.dp__proof'), { y: -12, autoAlpha: 1, duration: 0.13 }, 0.85);
    tl.to(root.querySelector('.dp__head'), { autoAlpha: 1, duration: 0.1 }, 0.87);
  },
  unmount() { root = null; hasError = false; },
};
