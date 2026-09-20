import gsap from 'gsap';

/** 여는 장면. 진입 0–.30 · 홀드 .30–.75 · 퇴장 .75–1. */
export default {
  id: '01-hero',

  mount(section) {
    this.kicker = section.querySelector('.hero__kicker');
    this.title = section.querySelector('.hero__title');
    this.line = section.querySelector('.hero__line');
    this.poster = section.querySelector('.hero__poster');
    gsap.set([this.kicker, this.title, this.line], { autoAlpha: 1 });
  },

  build(tl) {
    // 진입
    tl.fromTo(this.kicker, { yPercent: 40, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.12 }, 0)
      .fromTo(this.title, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.18 }, 0.06)
      .fromTo(this.poster, { scale: 1.08, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.2 }, 0.1);
    // 홀드 — 아주 느린 드리프트만 둔다
    tl.to(this.poster, { yPercent: -3, duration: 0.45 }, 0.3);
    // 퇴장
    tl.to([this.kicker, this.title, this.line], { autoAlpha: 0, yPercent: -30, duration: 0.25 }, 0.75);
  },

  unmount() {
    gsap.killTweensOf([this.kicker, this.title, this.line, this.poster]);
  },
};
