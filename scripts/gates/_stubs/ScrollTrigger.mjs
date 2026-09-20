/** gsap/ScrollTrigger 대역. 핀·스크럽은 만들지 않고 호출만 삼킨다. */
function instance() {
  const api = {
    kill: () => {}, refresh: () => {}, disable: () => {}, enable: () => {}, update: () => {},
    scroll: () => 0, getVelocity: () => 0, labelToScroll: () => 0,
    progress: 0, direction: 1, isActive: false, start: 0, end: 0, pin: null, animation: null, vars: {},
  };
  return api;
}

const ScrollTrigger = {
  create: () => instance(),
  refresh: () => {},
  update: () => {},
  getAll: () => [],
  getById: () => null,
  killAll: () => {},
  register: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  batch: () => [],
  matchMedia: () => {},
  config: () => {},
  defaults: () => {},
  scrollerProxy: () => {},
  normalizeScroll: () => null,
  clearScrollMemory: () => {},
  sort: () => [],
  saveStyles: () => {},
  revert: () => {},
  maxScroll: () => 0,
  isInViewport: () => true,
  positionInViewport: () => 0.5,
  observe: () => ({ kill: () => {}, disable: () => {}, enable: () => {} }),
};

export default ScrollTrigger;
export { ScrollTrigger };
