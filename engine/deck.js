/**
 * deck.js — the Scrolline Deck runtime.
 *
 * It does one job: read the deck contract, build one pinned <section> per scene,
 * mount each scene module, wire pin + scrub, and drive the presenting chrome
 * (preloader, progress bar, HUD, keyboard, presenter auto-advance, notes).
 *
 * The runtime is bundler-agnostic: it takes already-collected `modules` and
 * `partials` as arguments and never calls a Vite API. The generated project's
 * src/main.js is the only file that touches import.meta.glob.
 */
import gsap from 'gsap';
import { createScroll, scrollToPx } from './scroll.js';
import { reduced, isMobile, gpuTier } from './motion.js';
import { createFrameScrub } from './frame-scrub.js';

/** '../scenes/04-image-gen/scene.js' -> '04-image-gen' */
const idFromPath = (p) => String(p).split('/').filter(Boolean).at(-2);

/**
 * Accepts a Map, a plain object keyed by scene id, or an import.meta.glob result
 * keyed by path. Values may be a module namespace ({ default }) or the value itself.
 */
function toMap(input) {
  const map = new Map();
  if (!input) return map;
  const entries = input instanceof Map ? [...input.entries()] : Object.entries(input);
  for (const [key, value] of entries) {
    const id = String(key).includes('/') ? idFromPath(key) : key;
    if (!id) continue;
    map.set(id, value && typeof value === 'object' && 'default' in value ? value.default : value);
  }
  return map;
}

const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/** Readable screen from deck.json alone, for scenes whose folder does not exist yet. */
function fallbackHTML(scene) {
  const { kicker, title, lines = [] } = scene.copy ?? {};
  return `
<div class="scene__fallback">
  <p class="scene__kicker t-eyebrow">${esc(kicker)}</p>
  <h2 class="scene__title t-display-md">${esc(title ?? scene.id)}</h2>
  <ul class="scene__lines">${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
  <span class="scene__tag">${esc(scene.id)} · ${esc(scene.technique)} · ${Number(scene.pinVh) || 0}vh</span>
</div>`;
}

const framePath = (pattern, n) =>
  pattern ? String(pattern).replace(/%0(\d)d/, (_, w) => String(n).padStart(Number(w), '0')) : null;

function imageReady(src) {
  return new Promise((resolve) => {
    if (!src) return resolve();
    const image = new Image();
    image.onload = image.onerror = () => resolve();
    image.src = src;
  });
}

/** Hold the overlay until critical frames, posters and fonts are ready — 12s ceiling. */
async function preloadDeck(sceneList, mobile) {
  const overlay = document.getElementById('preloader');
  const label = document.getElementById('preloader-label');
  if (!overlay || reduced()) return;
  overlay.hidden = false;
  const items = [document.fonts?.ready ?? Promise.resolve()];
  sceneList.forEach((scene) => {
    const assets = scene.assets ?? {};
    if (assets.poster) items.push(imageReady(assets.poster));
    if (Array.isArray(assets.images)) {
      (assets.critical ?? []).forEach((n) => items.push(imageReady(assets.images[n - 1])));
    }
    if (!mobile && assets.frames) {
      (assets.critical ?? []).forEach((n) => items.push(imageReady(framePath(assets.frames, n))));
    }
  });
  let done = 0;
  const update = () => {
    done += 1;
    if (label) label.textContent = `${Math.round((done / items.length) * 100)}%`;
  };
  await Promise.race([
    Promise.all(items.map((item) => Promise.resolve(item).finally(update))),
    new Promise((resolve) => window.setTimeout(resolve, 12000)),
  ]);
  if (label) label.textContent = '100%';
  overlay.hidden = true;
}

/**
 * Assemble the deck.
 * @param {{
 *   root?: HTMLElement,
 *   deck: object,                       // data/deck.json
 *   modules?: object|Map,               // scene id (or path) -> scene module
 *   partials?: object|Map,              // scene id (or path) -> scene.html string
 *   styles?: object|Map,                // collected scene.css — imported for side effects only
 * }} options
 */
export async function createDeck({
  root = typeof document !== 'undefined' ? document.getElementById('deck') : null,
  deck = {},
  modules,
  partials,
  styles, // eslint-disable-line no-unused-vars -- glob result, imported for its side effects
} = {}) {
  if (!root) throw new Error('[scrolline] createDeck: no root element (expected <main id="deck">)');

  const moduleMap = toMap(modules);
  const partialMap = toMap(partials);

  const isReduced = reduced();
  const { lenis, ScrollTrigger } = createScroll({ duration: 1.2 });

  const tier = gpuTier();
  const mobile = isMobile();
  const mounted = [];

  const ordered = [...(deck.scenes ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (deck.theme?.style) document.documentElement.dataset.theme = deck.theme.style;
  await preloadDeck(ordered, mobile);

  for (const scene of ordered) {
    const section = document.createElement('section');
    section.className = 'scene';
    section.dataset.scene = scene.id;
    section.dataset.technique = scene.technique ?? '';
    section.setAttribute('aria-label', scene.copy?.title ?? scene.id);
    section.innerHTML = partialMap.get(scene.id) ?? fallbackHTML(scene);
    root.appendChild(section);

    const ctx = {
      gsap,
      ScrollTrigger,
      lenis,
      data: { deck, scene },
      reduced: isReduced,
      mobile,
      tier,
      /** frameScrub(host, opts?) — options default to this scene's assets block. */
      frameScrub: (host, opts = {}) => createFrameScrub(host, {
        pattern: scene.assets?.frames,
        count: scene.assets?.count,
        critical: scene.assets?.critical ?? [],
        poster: scene.assets?.poster,
        mobilePattern: scene.assets?.mobileFrames,
        ...opts,
      }),
    };

    const mod = moduleMap.get(scene.id);
    const tl = gsap.timeline({ paused: true });

    try {
      mod?.mount?.(section, ctx);
      // Under reduced motion no choreography is built; the scene stays in its final frame.
      if (!isReduced) {
        mod?.build?.(tl, ctx);
        // A timeline longer than 1 makes GSAP squash everything by 1/duration, so the
        // entrance / hold / exit bands drift away from the choreography table.
        const dur = tl.duration();
        if (dur > 1.001) {
          console.warn(`[scrolline] scene ${scene.id}: timeline duration ${dur.toFixed(3)} exceeds 1`);
        }
      }
    } catch (err) {
      console.error(`[scrolline] scene ${scene.id} failed to initialise`, err);
    }

    let trigger = null;
    if (!isReduced) {
      // `pin: false` scenes are scrubbed while they pass by instead of being held.
      const shouldPin = scene.pin !== false && Number(scene.pinVh) > 0;
      trigger = shouldPin
        ? ScrollTrigger.create({
            trigger: section,
            start: 'top top',
            // `%` of viewport height. `vh` is not a valid ScrollTrigger end unit and
            // silently collapses the pin distance.
            end: `+=${scene.pinVh}%`,
            pin: true,
            scrub: 0.6,
            animation: tl,
          })
        : ScrollTrigger.create({
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.6,
            animation: tl,
          });
    }

    mounted.push({ scene, section, mod, tl, trigger });
  }

  /* ---------------- chrome ---------------- */
  const bar = document.getElementById('progress-bar');
  const progress = document.getElementById('progress');
  const hud = document.getElementById('hud');
  const notes = document.getElementById('notes');
  const notesBody = document.getElementById('notes-body');
  const notesTitle = document.getElementById('notes-title');
  const total = String(mounted.length).padStart(2, '0');
  let lastIndex = -1;

  function paintNotes(index) {
    const entry = mounted[index];
    if (!entry) return;
    if (notesTitle) notesTitle.textContent = `${entry.scene.id} · ${entry.scene.copy?.title ?? ''}`.trim();
    if (notesBody) notesBody.textContent = entry.scene.notes ?? '';
  }

  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    if (bar) bar.style.width = `${(p * 100).toFixed(2)}%`;
    if (progress) progress.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    const index = currentIndex();
    if (hud) hud.textContent = `${String(index + 1).padStart(2, '0')} / ${total}`;
    if (index !== lastIndex) { lastIndex = index; paintNotes(index); }
  }

  /* ---------------- navigation ---------------- */
  // Right after pinning, ScrollTrigger.start can read 0 for one frame. Measure from the
  // real layout anchor (the pin-spacer) so the HUD and key jumps stay stable.
  const startPx = (entry) => {
    const parent = entry.section.parentElement;
    const anchor = parent?.classList?.contains('pin-spacer') ? parent : entry.section;
    return anchor.getBoundingClientRect().top + window.scrollY;
  };

  function currentIndex() {
    const y = window.scrollY + 2;
    let idx = 0;
    mounted.forEach((m, i) => { if (startPx(m) <= y) idx = i; });
    return idx;
  }

  function goTo(index) {
    const target = mounted[Math.min(mounted.length - 1, Math.max(0, index))];
    if (!target) return;
    const pinDistance = target.scene.pin !== false && Number(target.scene.pinVh) > 0
      ? (Number(target.scene.pinVh) / 100) * window.innerHeight
      : 0;
    // Land inside the first hold frame, never mid-entrance.
    scrollToPx(lenis, startPx(target) + pinDistance * 0.35);
  }

  /* ---------------- presenter auto-advance ---------------- */
  let presenterTimer = null;
  function stopPresenter() {
    if (!presenterTimer) return;
    window.clearInterval(presenterTimer);
    presenterTimer = null;
    document.body.classList.remove('deck-presenting');
  }
  function togglePresenter() {
    if (presenterTimer) return stopPresenter();
    const seconds = Number(deck.presenter?.autoDurationSec) > 0
      ? Number(deck.presenter.autoDurationSec)
      : 180;
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    const pixelsPerMs = maxY / (seconds * 1000);
    let target = window.scrollY;
    document.body.classList.add('deck-presenting');
    presenterTimer = window.setInterval(() => {
      target = Math.min(maxY, target + pixelsPerMs * 32);
      scrollToPx(lenis, target, { duration: 0.2 });
      if (target >= maxY) stopPresenter();
    }, 32);
  }

  function toggleNotes() {
    if (!notes) return;
    notes.hidden = !notes.hidden;
    if (!notes.hidden) paintNotes(currentIndex());
  }

  function onKey(e) {
    if (e.target instanceof HTMLElement && /input|textarea|select/i.test(e.target.tagName)) return;
    const key = e.key;
    if (presenterTimer && key.toLowerCase() !== 'p') stopPresenter();
    if (key === 'ArrowRight' || key === ' ' || key === 'Spacebar') {
      e.preventDefault();
      goTo(currentIndex() + 1);
    } else if (key === 'ArrowLeft') {
      e.preventDefault();
      goTo(currentIndex() - 1);
    } else if (/^[1-9]$/.test(key)) {
      e.preventDefault();
      goTo(Number(key) - 1);
    } else if (key === '0') {
      e.preventDefault();
      goTo(9);
    } else if (key.toLowerCase() === 'f') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else document.documentElement.requestFullscreen?.().catch(() => {});
    } else if (key.toLowerCase() === 'h') {
      document.body.classList.toggle('deck-cursor-hidden');
    } else if (key.toLowerCase() === 'n') {
      toggleNotes();
    } else if (key.toLowerCase() === 'p') {
      togglePresenter();
    }
  }

  const stopOnInput = () => stopPresenter();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('keydown', onKey);
  window.addEventListener('wheel', stopOnInput, { passive: true });
  window.addEventListener('touchstart', stopOnInput, { passive: true });
  ScrollTrigger.refresh();
  onScroll();
  paintNotes(0);
  // Measure once more after images and pin-spacers have laid out.
  window.requestAnimationFrame(() => { ScrollTrigger.refresh(); onScroll(); });

  return {
    scenes: mounted,
    goTo,
    currentIndex,
    lenis,
    ScrollTrigger,
    destroy() {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', stopOnInput);
      window.removeEventListener('touchstart', stopOnInput);
      stopPresenter();
      mounted.forEach((m) => {
        try { m.mod?.unmount?.(); } catch { /* ignore */ }
        m.trigger?.kill();
        m.tl?.kill();
      });
      root.innerHTML = '';
    },
  };
}

export default createDeck;
