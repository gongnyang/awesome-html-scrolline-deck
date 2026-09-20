#!/usr/bin/env node
/**
 * patch-scenes.mjs — the one scene.js edit this deck needs, applied where the
 * template invites edits (inside the marked enter/hold/exit blocks).
 *
 * TEMPLATE BUG — parallax-video. `scene.css` sets the veil to
 *   .pv__veil { background: var(--canvas); opacity: .28; }
 * and `build()` then tweens it with `autoAlpha: 1`, which writes opacity 1.
 * From progress .16 onward the veil is a fully opaque canvas-coloured sheet
 * across the whole viewport, so the clip it is meant to soften is never seen at
 * all: the scene degrades to copy on a flat background and every `verify`
 * capture of it looks empty. The fix is to tween to the resting .28 instead.
 *
 * TEMPLATE BUG — paper-assembly. `.pa__sheet` is centred in CSS with
 *   top: 50%; left: 50%; transform: translate(-50%, -50%);
 * GSAP parses that translate into xPercent/yPercent, so the fan tween's
 * `xPercent: -47..47` and `yPercent: -7..2` do not offset the centred sheet —
 * they REPLACE the -50/-50 that centres it. The whole fan lands half a sheet
 * to the right and roughly half a sheet low, and with six sheets its right edge
 * runs off a 1440-wide stage. The offsets have to be written relative to -50.
 *
 * TEMPLATE BUG — wipe-transform. The step counter is advanced with
 *   tl.set(num, { textContent: '02' }, 0.36)
 * and GSAP reads '02' as a number, so the caption renders "2" and then "3"
 * instead of "02" and "03" — the leading zero the design depends on is eaten.
 * Setting the text from a callback keeps it a string.
 *
 * Each patch is asserted: if a template changes shape, this fails loudly rather
 * than silently leaving the deck unpatched.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCENES = path.join(HERE, '..', 'src', 'scenes');

const PATCHES = [
  {
    scene: '04-drift',
    why: 'parallax-video: the veil tween overrides its own .28 resting opacity and hides the clip',
    from: "tl.fromTo(veil, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: 'none' }, 0.04);",
    to: "tl.fromTo(veil, { autoAlpha: 0 }, { autoAlpha: 0.28, duration: 0.12, ease: 'none' }, 0.04);",
  },
  {
    scene: '03-postcards',
    why: 'paper-assembly: the fan tween replaces the CSS translate(-50%,-50%) instead of offsetting it',
    from: "tl.to(sheet, { xPercent: to.x, yPercent: to.y, rotation: to.r, duration: 0.22, ease: 'power2.inOut' }, 0.34);",
    to: "tl.to(sheet, { xPercent: -50 + to.x, yPercent: -50 + to.y, rotation: to.r, duration: 0.22, ease: 'power2.inOut' }, 0.34);",
  },
  {
    scene: '06-compare',
    why: "wipe-transform: tl.set(textContent) coerces '02' to the number 2 and drops the leading zero",
    from: "    tl.set(num, { textContent: '02' }, 0.36);",
    to: "    tl.call(() => { num.textContent = '02'; }, null, 0.36);",
  },
  {
    scene: '06-compare',
    why: "wipe-transform: the same coercion turns '03' into 3",
    from: "    tl.set(num, { textContent: '03' }, 0.66);",
    to: "    tl.call(() => { num.textContent = '03'; }, null, 0.66);",
  },
];

let applied = 0;
for (const patch of PATCHES) {
  const file = path.join(SCENES, patch.scene, 'scene.js');
  const text = fs.readFileSync(file, 'utf8');
  if (text.includes(patch.to)) { console.log(`patch    ${patch.scene}/scene.js already applied`); continue; }
  if (!text.includes(patch.from)) {
    console.error(`patch    ${patch.scene}/scene.js: anchor not found — ${patch.why}`);
    process.exit(1);
  }
  fs.writeFileSync(file, text.replace(patch.from, patch.to));
  applied += 1;
  console.log(`patch    ${patch.scene}/scene.js — ${patch.why}`);
}
console.log(`patched ${applied} scene module(s)`);
