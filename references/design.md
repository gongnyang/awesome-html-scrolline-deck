# Design rules

A scrollytelling deck is a film strip, not a slide deck. The rules below are
what keep twelve independently written scenes looking like one piece of work.
Two of them are enforced by the gates; the rest are the difference between a
deck that looks made and a deck that looks generated.

## No boxes

The single most common way a generated deck gives itself away is the card: a
rounded rectangle with a border, a tint and a shadow, holding text that would
have read perfectly well on its own. None of the twelve templates uses one.

Forbidden as composition: bordered panels, tinted cards, rounded containers
around copy, a shadowed "slide" holding a bullet list, a bubble around a quote.

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

The one place a rectangle is allowed is when the rectangle is the subject:
`paper-assembly` shows document pages, and pages have edges.

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
scene. Twelve scenes share one document; scoping is what keeps scene 09 from
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

Text sits over media in six of the twelve templates. In all of them the
legibility comes from a gradient scrim anchored to `--canvas`, running from
fully opaque at the bottom edge to transparent around 68–78% up. Check the
result at the hold frame, not at rest: the scrub moves the image under the text,
so the worst contrast is usually somewhere in the middle of the pin.

Interactive elements — only `closing-qr` has one — keep a visible
`:focus-visible` outline drawn in `--accent-1`.

## Mobile and reduced motion

Every template carries a `@media (max-width: 720px)` block and a
`@media (prefers-reduced-motion: reduce)` block. They are not optional; the
self-test fails a template that is missing either.

At 720px and below: absolute positioning becomes flow, side-by-side becomes
stacked, fixed backgrounds become inline media, and decorative connectors are
hidden rather than shrunk.

Under reduced motion, **copy has to come first in the flow**. The browser gate
samples the top screen of each section and needs three visible elements there.
A scene that stacks ten plates above its caption passes at rest and fails the
gate, because the caption is now six screens down. `horizontal-gallery` pulls
its caption up with `order: -1` and lays the plates out two across for exactly
this reason.

Under reduced motion the engine skips pinning and the timelines entirely, so
every scene must already look finished with no JavaScript having run. That is
the same requirement as "frame 0 is composed", which is why the resting state in
`scene.css` is always the hold frame and never the start of an entrance.
