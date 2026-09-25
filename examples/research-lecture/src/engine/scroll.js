/**
 * scroll.js — the one standard wiring of Lenis + GSAP ScrollTrigger.
 * Never construct `new Lenis()` in a scene; call createScroll once, from the engine.
 */
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { reduced } from './motion.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * @param {{ duration?: number, wrapper?: HTMLElement, content?: HTMLElement }} opts
 * @returns {{ lenis: Lenis|null, gsap: typeof gsap, ScrollTrigger: typeof ScrollTrigger, destroy: () => void }}
 *          Under reduced motion `lenis` is null and native scrolling is used.
 */
export function createScroll(opts = {}) {
  if (reduced()) {
    ScrollTrigger.refresh();
    return { lenis: null, gsap, ScrollTrigger, destroy: () => ScrollTrigger.killAll() };
  }

  const lenis = new Lenis({
    duration: opts.duration ?? 1.2,
    smoothWheel: true,
    // lenis 1.1.0 calls `prevent` as a function; the documented default `false`
    // throws a TypeError on the first wheel event, so pass a function explicitly.
    prevent: () => false,
    wrapper: opts.wrapper,
    content: opts.content,
  });

  lenis.on('scroll', ScrollTrigger.update);

  const ticker = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(ticker);
  gsap.ticker.lagSmoothing(0);

  ScrollTrigger.refresh();

  return {
    lenis,
    gsap,
    ScrollTrigger,
    destroy() {
      gsap.ticker.remove(ticker);
      lenis.destroy();
      ScrollTrigger.killAll();
    },
  };
}

/** Smooth scroll to a pixel offset (native scroll when lenis is null). */
export function scrollToPx(lenis, px, options = {}) {
  if (lenis) lenis.scrollTo(px, { duration: 1.0, ...options });
  else window.scrollTo({ top: px, behavior: 'auto' });
}

export { gsap, ScrollTrigger };
