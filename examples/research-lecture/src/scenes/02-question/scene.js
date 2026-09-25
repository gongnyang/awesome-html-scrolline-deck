let root = null;
export default {
  id: '02-question',
  mount(section, ctx) {
    root = section.querySelector('.q') || section;
    const scene = ctx.data.scene || {};
    const copy = scene.copy || {};
    root.querySelector('[data-role="kicker"]').textContent = copy.kicker || '';
    root.querySelector('[data-role="title"]').textContent = copy.title || '';
    root.querySelector('.q__measure strong').textContent = copy.measure || '시간대별 그늘의 위치와 면적';
    root.querySelector('.q__measure small').textContent = copy.measureNote || '같은 보행로를 같은 기준으로 나누어 관찰';
    root.querySelector('.q__unknown strong').textContent = copy.unknown || '사람이 실제로 느낀 열 노출';
    root.querySelector('.q__unknown small').textContent = copy.unknownNote || '기온 · 체류 시간 · 개인의 이동 경험';
    root.querySelector('.q__prompt').textContent = copy.prompt || '이 차이가 누구의 하루와 겹치는지, 현장에서 어떻게 확인할까요?';
  },
  build(tl, ctx) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pieces = [root.querySelector('.q__head'), root.querySelector('.q__measure'), root.querySelector('.q__not-equal'), root.querySelector('.q__unknown'), root.querySelector('.q__prompt')];
    if (reduced) { tl.set(pieces, { autoAlpha: 1, y: 0, x: 0 }); return; }
    tl.fromTo(pieces[0], { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12, ease: 'power2.out' }, 0);
    tl.fromTo(pieces.slice(1, 4), { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1, stagger: 0.035, ease: 'power2.out' }, 0.16);
    tl.fromTo(pieces[4], { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1, ease: 'power2.out' }, 0.38);
  },
  unmount() { root = null; },
};
