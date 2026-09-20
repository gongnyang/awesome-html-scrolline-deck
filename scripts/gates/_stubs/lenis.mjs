/** lenis 대역. 스크롤은 브라우저 게이트에서만 실재한다. */
export default class Lenis {
  constructor(options = {}) {
    this.options = options;
    this.scroll = 0;
    this.limit = 0;
    this.velocity = 0;
    this.isScrolling = false;
    this.isStopped = false;
  }
  raf() {}
  on() {}
  off() {}
  emit() {}
  start() {}
  stop() {}
  resize() {}
  destroy() {}
  scrollTo() {}
}
export { Lenis };
