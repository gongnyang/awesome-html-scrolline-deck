import gsap from 'gsap';

/** 닫는 장면. 다시 처음으로 돌아가는 이동은 lenis.scrollTo만 쓴다. */
export default {
  id: '02-closing',

  mount(section, ctx) {
    this.section = section;
    this.title = section.querySelector('.closing__title');
    this.line = section.querySelector('.closing__line');
    this.qr = section.querySelector('.closing__qr');
    this.lenis = ctx.lenis;
  },

  build(tl) {
    tl.fromTo(this.title, { autoAlpha: 0, yPercent: 40 }, { autoAlpha: 1, yPercent: 0, duration: 0.2 }, 0)
      .fromTo(this.qr, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.2 }, 0.1)
      .fromTo(this.line, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, 0.2);
    tl.to(this.qr, { rotation: 0.4, duration: 0.45 }, 0.3);
    tl.to(this.line, { autoAlpha: 0.6, duration: 0.2 }, 0.78);
  },

  unmount() {
    gsap.killTweensOf([this.title, this.line, this.qr]);
  },
};
