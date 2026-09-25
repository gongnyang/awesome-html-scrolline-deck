# Design rules

A scrollytelling deck is a presenter-controlled sequence, not a stack of
slides. These rules let independently authored scenes share an art direction
while keeping a distinct visual job for each scene. Automated gates enforce
only part of this; inspect every actual hold frame.

## No boxes

The most common weak default is a rounded card holding text that would read
better at projector scale without a container. Choose a container only when
it depicts a real object or makes a data relationship clearer.

Avoid bordered panels, tinted cards, shadowed slide replicas, and bubbles
around quotes as the main composition. A document page, comparison cell, or
physical product may still need a visible edge; explain its information job.

Use instead:

- **Type** — size, weight and position carry the hierarchy. A 104px title next
  to a 19px line is a structure; both in boxes is a layout.
- **Full-bleed media** — images and video run to all four edges, with a gradient
  scrim for legibility rather than a panel behind the text.
- **Lines** — a 1px hairline separates rows (`tilt-card`, `anatomy-rows`). A
  drawn diagonal connects points (`kinetic-titles`). A single horizon anchors
  numbers (`odometer-stats`).
- **Light** — a bloom, a scan line, a flash. Light groups things without
  drawing a frame around them.

For charts and tables, use an explicit scale, aligned values, readable units,
and a dominant conclusion. A styled grid alone does not make evidence legible;
the scroll transition should disclose a change, comparison, or decision.

## Tokens only

`scene.css` may not contain a hex code, an `rgb()`, an `hsl()` or a named
colour. The lint gate fails on any of them. Every colour comes from
`src/tokens.css`:

| Token | Use |
|---|---|
| `--canvas` | the page behind everything; also scrims and veils |
| `--surface-1` `--surface-2` `--surface-3` | raised ground, in three steps |
| `--hairline` | every 1px rule and border |
| `--ink` | body and display text, and SVG strokes |
| `--ink-muted` | supporting lines, captions |
| `--ink-subtle` | kickers, counters, credits |
| `--accent-1` `--accent-2` `--accent-3` | one accent per scene, cycled by index |

`color-mix(in srgb, var(--canvas) 62%, transparent)` is the way to get a
translucent scrim without inventing a colour. `currentColor` and `transparent`
are always allowed.

Light and dark are one switch: `theme.style` in `deck.json` sets
`data-theme="light"` or `data-theme="dark"` on the root, and `tokens.css`
redefines the same names. A template that only ever names tokens works in both
without a single extra rule. Never hard-code a dark value and then "fix" light
mode with an override.

Spacing, type sizes and families are tokens too, but templates always write them
with a fallback — `var(--space-lg, 34px)`, `var(--fs-title, clamp(30px, 4.4vw,
64px))` — so a template dropped into a project with a thinner token file still
lays out correctly.

## Scoping

Every selector in `scene.css` starts with `[data-scene="<id>"]`, including the
ones inside `@media` blocks. In the templates the id is the `{{id}}` placeholder
that `scrolline add` replaces with the folder name. There are no global
selectors, no element selectors at the top level, and no `:root` blocks in a
scene. Many scenes share one document; scoping is what keeps scene 09 from
restyling scene 03.

## Typography

Five roles, and nothing between them:

| Role | Size | Treatment |
|---|---|---|
| kicker | `clamp(11px, .95vw, 13px)` | mono, uppercase, `.18em` tracking, `--ink-subtle` |
| display | `clamp(40px, 6.6vw, 104px)` | display family, 700, `-.03em`, line-height 1.02 |
| title | `clamp(30px, 4.4vw, 64px)` | display family, 700, `-.02em`, line-height 1.08 |
| lead | `clamp(18px, 1.7vw, 24px)` | body family, `--ink-muted`, line-height 1.5 |
| body | `clamp(15px, 1.35vw, 19px)` | body family, `--ink-muted`, line-height 1.6 |

One scene gets one display-sized element. If two things are the largest thing,
neither is. Title lines cap at about 20 characters, body lines at 46.

## Korean

Every element that can hold Korean carries `word-break: keep-all`, so lines
break between words instead of between syllables. Two further rules learned the
hard way:

- Split Korean titles into **words**, never characters, when animating. A
  per-character stagger on Hangul reads as noise and breaks wrapping. Only
  `closing-qr` splits characters, and only because "감사합니다" is one word that
  has to set itself letter by letter.
- Never clip a box to a Latin metric and then let Korean into it. A slot sized
  at 1.04em holds a digit and loses the bottom of a Hangul syllable. Keep the
  tight box around the thing that needs it — in `odometer-stats` that is the
  reel strip alone — and let adjacent text set in its own line-height.
- Put explicit spans around the spaces you want preserved. The templates map
  whitespace runs to `&nbsp;` inside their own span so an inline-block word
  never collapses against its neighbour.

## Contrast and legibility

Text over media needs a subject-aware crop and a local contrast treatment,
often a gradient scrim anchored to `--canvas`. Check every cue and the hold
frame: the image may move behind the text during the pin, and the middle can
be the least readable state. Keep numeric data and source labels in HTML/SVG.

Interactive elements keep a visible `:focus-visible` outline drawn in
`--accent-1`.

## Mobile and reduced motion

Every template carries a `@media (max-width: 720px)` block and a
`@media (prefers-reduced-motion: reduce)` block. They are not optional; the
self-test fails a template that is missing either.

At 720px and below: absolute positioning becomes flow, side-by-side becomes
stacked, fixed backgrounds become inline media, and decorative connectors are
hidden rather than shrunk.

Under reduced motion, **the complete claim and its essential evidence must
be visible without choreography**. Copy should come first in the reading flow.
If a gallery or choice scene hides all its `[data-step]` content at rest, a
title and source can still look populated while the actual lesson is missing.
The browser gate rejects that case, and a person still checks the screenshot.

Under reduced motion the engine skips pinning and timelines entirely, so CSS
must produce a finished static state. The default scene CSS may be the hold
state, or the reduced-motion override may deliberately show the final image,
caption, and all required options. Verify both desktop and narrow screens.
