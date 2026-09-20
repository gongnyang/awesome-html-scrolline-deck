#!/usr/bin/env node
/**
 * apply-theme.mjs — turn the scaffold's default tokens into the Nimbus palette.
 *
 * `scrolline init --style light` ships the stock token file. This rewrites the
 * three things a launch deck actually owns: the colour ladders, the type stack
 * and the display scale. Run it again and it exits quietly — the marker in the
 * header says the file has already been themed.
 *
 *   node tools/apply-theme.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(HERE, '..', 'src', 'tokens.css');
const MARKER = 'Nimbus launch palette';

const EDITS = [
  [
`/* ============================================================
   tokens.css — the only place colours, type and spacing are defined.
   Rule: scene CSS uses var() and never a literal colour (gate L1 enforces it).
   Dark is the default ladder; [data-theme="light"] flips it.
   ============================================================ */`,
`/* ============================================================
   tokens.css — ${MARKER} (warm cream + coral / cobalt).
   The only place colours, type and spacing are defined; scene CSS uses
   var() and never a literal colour (gate L1 enforces it).
   The deck ships light — [data-theme="light"] is the palette that matters —
   and the dark ladder is kept warm so the same deck survives a dark room.
   ============================================================ */`,
  ],
  [
`  /* ---------- accents ---------- */
  --accent-1: #5e6ad2;   /* primary accent: progress bar, key marks, focus */
  --accent-2: #f0b429;   /* secondary accent: numbers, highlights */
  --accent-3: #e5484d;   /* tertiary accent: warnings, contrast beats */
  --on-accent: #ffffff;

  /* ---------- surface ladder ---------- */
  --canvas:    #08090a;  /* page background. never pure #000 */
  --surface-1: #101113;
  --surface-2: #17181a;
  --surface-3: #1e1f22;

  /* ---------- hairlines ---------- */
  --hairline:        #26282c;
  --hairline-strong: #34363b;

  /* ---------- ink ---------- */
  --ink:        #f4f5f6;
  --ink-muted:  #c9ced6;
  --ink-subtle: #868b94;`,
`  /* ---------- accents ---------- */
  --accent-1: #f2674a;   /* coral: the launch colour, marks and accents */
  --accent-2: #7f9bff;   /* cobalt, lifted for a dark room */
  --accent-3: #e0a34a;   /* amber: third beat, charge and warmth */
  --on-accent: #1a120c;

  /* ---------- surface ladder ---------- */
  --canvas:    #14100d;  /* warm near-black. never pure #000 */
  --surface-1: #1c1713;
  --surface-2: #241d18;
  --surface-3: #2e251e;

  /* ---------- hairlines ---------- */
  --hairline:        #3a2f26;
  --hairline-strong: #4d3f33;

  /* ---------- ink ---------- */
  --ink:        #f8f1e6;
  --ink-muted:  #d6c9ba;
  --ink-subtle: #9b8b7b;`,
  ],
  [
`:root[data-theme='light'] {
  --canvas:    #ffffff;
  --surface-1: #f6f7f8;
  --surface-2: #eef0f2;
  --surface-3: #e5e8ec;

  --hairline:        #dfe2e6;
  --hairline-strong: #c5cad1;

  --ink:        #0d0e10;
  --ink-muted:  #3c4148;
  --ink-subtle: #6a7078;

  --accent-1: #3a45b8;
  --accent-2: #9a6400;
  --accent-3: #c02a2f;
}`,
`:root[data-theme='light'] {
  /* Cream canvas, not white: the plates are drawn on the same paper. */
  --canvas:    #faf3e8;
  --surface-1: #f3e9da;
  --surface-2: #ecdfcc;
  --surface-3: #e3d3bc;

  --hairline:        #ddcdb5;
  --hairline-strong: #c2ab8c;

  --ink:        #1b1410;
  --ink-muted:  #4a3b30;
  --ink-subtle: #7c6a5a;

  --accent-1: #cf4224;   /* coral — 4.9:1 on the cream canvas */
  --accent-2: #1f3fbb;   /* cobalt — 7.4:1 */
  --accent-3: #9a5a00;   /* amber, darkened until it reads as text */
  --on-accent: #faf3e8;
}`,
  ],
  [
`  --font-display: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont,
                  'SF Pro Display', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue',
                  'Noto Sans KR', sans-serif;
  --font-body: var(--font-display);
  --font-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;`,
`  /* Display is a geometric sans — URW Gothic / Century Gothic / Futura — with
     Pretendard picking up Hangul, which those faces do not cover. Body stays
     Korean-first so a paragraph never switches face mid-sentence. */
  --font-display: 'URW Gothic', 'Century Gothic', Questrial, Poppins, Futura,
                  'Pretendard Variable', Pretendard, system-ui,
                  'Noto Sans CJK KR', 'Noto Sans KR', sans-serif;
  --font-body: 'Pretendard Variable', Pretendard, system-ui, -apple-system,
               'Noto Sans CJK KR', 'Noto Sans KR', sans-serif;
  /* Ubuntu Mono carries no Hangul, so a CJK mono follows it in the stack. Note
     that this is not a cure: a string that mixes Latin and Hangul inside one
     monospace run still gets Latin advances and sets the syllables on top of
     each other, so mono copy in this deck stays single-script. */
  --font-mono: 'Ubuntu Mono', 'Noto Sans Mono CJK KR', ui-monospace, SFMono-Regular,
               'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;`,
  ],
  [
`  --display-xl-size: 80px;  --display-xl-lh: 1.05; --display-xl-ls: -3.0px;  --display-xl-weight: 600;
  --display-lg-size: 56px;  --display-lg-lh: 1.10; --display-lg-ls: -1.8px;  --display-lg-weight: 600;
  --display-md-size: 40px;  --display-md-lh: 1.15; --display-md-ls: -1.0px;  --display-md-weight: 600;`,
`  --display-xl-size: 88px;  --display-xl-lh: 0.98; --display-xl-ls: -3.6px;  --display-xl-weight: 700;
  --display-lg-size: 60px;  --display-lg-lh: 1.06; --display-lg-ls: -2.2px;  --display-lg-weight: 700;
  --display-md-size: 42px;  --display-md-lh: 1.12; --display-md-ls: -1.2px;  --display-md-weight: 700;`,
  ],
  [
`  --eyebrow-size:    13px;  --eyebrow-lh:    1.30; --eyebrow-ls:    0.4px;   --eyebrow-weight:    500;`,
`  --eyebrow-size:    13px;  --eyebrow-lh:    1.30; --eyebrow-ls:    2.2px;   --eyebrow-weight:    500;`,
  ],
];

let css = fs.readFileSync(FILE, 'utf8');
if (css.includes(MARKER)) {
  console.log('tokens.css already carries the Nimbus palette — nothing to do');
  process.exit(0);
}
for (const [from, to] of EDITS) {
  if (!css.includes(from)) {
    console.error('apply-theme: tokens.css does not match the scaffold this script was written against.');
    console.error(`missing block:\n${from.split('\n')[0]} …`);
    process.exit(1);
  }
  css = css.replace(from, to);
}
fs.writeFileSync(FILE, css);
console.log('tokens.css — cream canvas, coral/cobalt accents, geometric display stack');
