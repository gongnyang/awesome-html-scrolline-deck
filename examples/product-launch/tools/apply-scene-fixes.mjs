#!/usr/bin/env node
/**
 * apply-scene-fixes.mjs — the four scoped corrections this deck makes to the
 * scene templates, appended to the scene.css that `scrolline add` generated.
 *
 * Each one is a bug or a light-theme mismatch found by reading qa/*.jpg, and each
 * is written as a scoped override rather than an edit to templates/, so the deck
 * stays a plain consumer of the skill. The comments say what went wrong; the
 * README repeats the two that are template bugs rather than taste.
 *
 *   node tools/apply-scene-fixes.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCENES = path.join(HERE, '..', 'src', 'scenes');
const MARKER = '/* --- deck corrections';

const FIXES = {
  '03-hero': `
${MARKER} (03-hero) --- */
/* The engine's scene HUD ("03 / 07") lives in the bottom-right corner, exactly
   where the template parks this credit. Lift the credit clear of it. */
[data-scene="03-hero"] .tc__portrait figcaption { bottom: var(--space-section, 88px); }
`,

  '05-breathe': `
${MARKER} (05-breathe) --- */
/* Template bug. parallax-video paints a veil of solid var(--canvas) over the
   clip and keeps it translucent with \`opacity: .28\` in CSS — but build() tweens
   the same element's autoAlpha to 1, which writes \`opacity: 1\` inline and turns
   the veil into an opaque sheet. The clip is invisible in both themes, with no
   console error and every gate green. Keep the fade (opacity is the tweened
   property) and move the translucency into the colour instead. */
[data-scene="05-breathe"] .pv__veil { background: color-mix(in srgb, var(--canvas) 46%, transparent); }
/* The template dims the clip for a dark deck (brightness .62). This one is drawn
   on the same cream as the page, so it only needs a touch of contrast. */
[data-scene="05-breathe"] .pv__media video,
[data-scene="05-breathe"] .pv__media img { filter: contrast(1.04); }
`,

  '06-specs': `
${MARKER} (06-specs) --- */
/* The template sizes the reels at up to 180px, which assumes a short Latin
   suffix. "40시간" and "213g" are wider than one of four grid columns at that
   size, and \`.od__reels { min-width: 0; overflow: hidden }\` then quietly cuts
   the right-hand side off the last digit — a zero comes out looking like a C.
   Size the figures to the column instead and every digit stays whole. */
[data-scene="06-specs"] .od__odo { font-size: clamp(56px, 8.4vw, 116px); }
@media (max-width: 720px) {
  [data-scene="06-specs"] .od__odo { font-size: clamp(56px, 18vw, 104px); }
}
/* The reel mask fades the top and bottom 16% of every digit into the canvas.
   On a dark deck that reads as depth; on cream it is a haircut, so the fade is
   cut back to the sliver of the neighbouring digit it actually has to hide. */
[data-scene="06-specs"] .od__reels {
  mask-image: linear-gradient(transparent, var(--ink) 4%, var(--ink) 96%, transparent);
  -webkit-mask-image: linear-gradient(transparent, var(--ink) 4%, var(--ink) 96%, transparent);
}
/* The geometric display face overshoots a line-height:1 slot; a little leading
   inside each slot keeps the top of a digit out of the reel's mask. */
[data-scene="06-specs"] .od__strip i { line-height: 1.14; }
/* A 1px accent horizon disappears at projector distance on cream, and
   --accent-2 (cobalt) reads as a stray blue line next to coral figures. */
[data-scene="06-specs"] .od__horizon { height: 2px; background: var(--accent-1); opacity: calc(.82 + var(--flash, 0) * .18); }
`,
};

let touched = 0;
for (const [id, block] of Object.entries(FIXES)) {
  const file = path.join(SCENES, id, 'scene.css');
  if (!fs.existsSync(file)) {
    console.error(`apply-scene-fixes: ${file} not found — run \`scrolline add\` first`);
    process.exit(1);
  }
  const css = fs.readFileSync(file, 'utf8');
  if (css.includes(`${MARKER} (${id})`)) {
    console.log(`${id}/scene.css — corrections already applied`);
    continue;
  }
  fs.writeFileSync(file, `${css.trimEnd()}\n${block}`);
  console.log(`${id}/scene.css — corrections appended`);
  touched += 1;
}
console.log(`${touched} scene(s) patched`);
