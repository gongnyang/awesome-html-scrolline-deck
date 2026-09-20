# Choreography

Every scene is one GSAP timeline whose total length is **1**. The engine builds
`gsap.timeline({ paused: true })`, hands it to `build(tl, ctx)`, and a
ScrollTrigger scrubs it with `scrub: 0.6` across `pinVh` of scroll. Nothing in a
scene calls `play()`, and nothing measures time in seconds.

Because the length is fixed at 1, changing `pinVh` changes how long the scene
takes to read without changing a single number in `scene.js`.

## The three-beat arc

| Beat | Window | What belongs here |
|---|---|---|
| enter | 0 .. 0.30 | Copy and structure arrive. By 0.30 the scene is fully composed. |
| hold | 0.30 .. 0.75 | The composed frame stays up. Progressive reveals and accent walks live here. |
| exit | 0.75 .. 1.00 | The scene leaves in one gesture, ending at or before 1.0. |

Three consequences follow, and they are what the gates check.

**Nothing may end after 1.0.** The static gate replays the timeline with a fake
recorder and computes `position + duration × (1 + stagger × n)` for every tween.
The largest value must be ≤ 1.001. Every shipped template ends at 0.980, which
leaves room for an author to lengthen an exit.

**Frame 0 must already be composed in CSS, and every entrance must be a
`fromTo`.** A bare `from()` renders its start values immediately, which on a
paused scrubbed timeline hides the first scene before anyone has scrolled. Write
the finished state in `scene.css` and state the start value explicitly:

```js
tl.fromTo(copy, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12 }, 0);
```

**The landing has to be a composed frame.** Pressing the right arrow or space
sends the deck to `start + pinVh × 0.35` — 35% into the pin, inside the hold.
The browser gate screenshots every scene there and fails it if fewer than three
elements are visible. This is why the hold window exists at all.

## One media tween may span the whole timeline

The arc governs *copy and structure*. A single continuous media tween — a frame
scrub, a sideways pan, a parallax drift, a word relay — may run from 0 to 0.98,
because that motion *is* the scene. Five templates do this on purpose:

| Technique | The long tween | Window |
|---|---|---|
| `frame-scrub-hero` | frame sequence progress | 0 .. 0.98 |
| `frame-scrub-video` | frame sequence progress | 0 .. 0.98 |
| `horizontal-gallery` | track pan | 0.16 .. 0.76 |
| `parallax-video` | copy drift | 0.06 .. 0.86 |
| `word-relay` | the relay itself | 0 .. 0.70 |

Everything else in those scenes still obeys the three windows.

## Timeline tables

Positions and durations as shipped. `i` is the index of a repeated element.

### frame-scrub-hero
| At | Duration | What |
|---|---|---|
| 0 | 0.20 | media scale 1.04 → 1 |
| 0.04 | 0.14, stagger 0.02 | title words rise (never below opacity 1) |
| 0.10 | 0.12, stagger 0.03 | kicker, line, meta settle |
| 0 | 0.98 | frame sequence 0 → 1 |
| 0.80 | 0.18 | media scale 1.09, copy scales out |
| 0.82 | 0.16 | veil up |

### word-relay
`step = 0.70 / n`, `n` = number of words.
| At | Duration | What |
|---|---|---|
| 0 | 0.12 | kicker settles |
| 0.16 | 0.12 | lines settle |
| `i × step` | `step × 0.72` | word i enters from the right |
| `i × step + step × 0.85` | `step × 0.60` | word i leaves left (not the last) |
| 0.66 | 0.08 | last word scales to 1.1 |
| 0.80 | 0.14 | centre wipe opens |
| 0.86 | 0.12 | scene fades |

### kinetic-titles
| At | Duration | What |
|---|---|---|
| 0 | 0.06 / 0.08 | grid fades up, heading settles |
| `0.03 + i × 0.05` | 0.09 | title i throws itself in |
| 0.06 | 0.20 | diagonal draws, light head travels |
| 0.20 | 0.06, stagger 0.015 | bullets wipe open |
| `0.36 + i × 0.10` | — | accent moves to block i |
| 0.76 | 0.08, stagger 0.01 | bullets close |
| 0.82 | 0.14 | blocks leave the way they arrived |
| 0.88 | 0.10 | heading lifts out |

### horizontal-gallery
| At | Duration | What |
|---|---|---|
| 0 | 0.18 / 0.14 | first frame opens, caption settles |
| 0.16 | 0.60 | track pans to the last image, counter reads along |
| 0.80 | 0.18 | dim to 0.72 |

### anatomy-rows
| At | Duration | What |
|---|---|---|
| 0 | 0.10 | art wipes in, copy settles |
| `0.04 + i × 0.03` | 0.09 | row i opens and draws its connector |
| `0.04 + i × 0.03 + 0.04` | 0.05 | mark i pops |
| `0.32 + i × 0.075` | — | accent moves to row i |
| 0.76 | 0.10, stagger 0.015 | connectors retract |
| 0.80 | 0.10, stagger 0.015 | rows close |
| 0.84 / 0.86 | 0.14 / 0.10 | art pushes out, copy fades |

### frame-scrub-video
`step = 0.44 / (n − 1)`.
| At | Duration | What |
|---|---|---|
| 0 | 0.10 | copy settles |
| 0 | 0.98 | frame sequence 0 → 1 |
| `0.16 + i × step` | 0.09 | line i lands |
| 0.82 | 0.14 | copy lifts out; the frame stays full-bleed |

### parallax-video
| At | Duration | What |
|---|---|---|
| 0.02 / 0.04 | 0.10 / 0.12 | clip and veil fade up |
| 0.06 | 0.80 | copy drifts yPercent 16 → −13 |
| 0.86 | 0.12 | clip and veil let go |

### paper-assembly
| At | Duration | What |
|---|---|---|
| 0 | 0.08 | copy settles |
| `i × 0.015` | 0.18 | page i flies in from off-stage |
| 0.34 | 0.22 | every page moves to its fan position |
| 0.50 | 0.10 | the line under the fan settles |
| 0.80 | 0.18 | the set files away into the corner |
| 0.84 | 0.12 | copy and line fade |

### odometer-stats
| At | Duration | What |
|---|---|---|
| 0 | 0.08 | copy settles, horizon draws |
| 0.06 | 0.14, stagger 0.015 | every reel spins to its digit, blur up |
| 0.20 | 0.06, stagger 0.015 | blur back to 0 |
| 0.18 | 0.07, stagger 0.02 | unit labels rise |
| 0.34 | 0.03 ×2 yoyo | horizon flashes once |
| 0.80 | 0.18 | the board lifts away |

### wipe-transform
| At | Duration | What |
|---|---|---|
| 0 | 0.10 | first surface sharpens, caption settles |
| 0.10 | 0.18 | diagonal wipe crosses, scan line sweeps |
| 0.32 / 0.36 | 0.04 / 0.08 | caption swaps to `02` |
| 0.46 | 0.10 | second surface dims |
| `0.46 + i × 0.04` | 0.16 | sheet i rises |
| 0.62 / 0.66 | 0.04 / 0.08 | caption swaps to `03`, title appears |
| 0.80 | 0.18 | the finished surface pushes out |

### tilt-card
| At | Duration | What |
|---|---|---|
| 0 | 0.20 | portrait slides in |
| 0.04 | 0.12, stagger 0.04 | kicker and title settle |
| 0.12 | 0.12, stagger 0.04 | ruled lines stack up |
| 0.32 | 0.42 | slow tilt −1.6° → 1.6° |
| 0.80 | 0.18 | the frame drops away |

### closing-qr
| At | Duration | What |
|---|---|---|
| 0 | 0.14 | bloom opens |
| 0.10 | 0.10 | lead settles |
| 0.14 | 0.12, stagger 0.008 | thanks set letter by letter |
| 0.32 | 0.20 | QR draws itself |
| 0.38 | 0.14 | URL wipes open (a clip, not a width) |
| 0.48 | 0.16 | mascot arrives |
| 0.62 | 0.10 | restart link appears |
| 0.80 | 0.18 | bloom breathes out — nothing leaves the screen |

## Tweening custom properties

Never put `var()` inside a tween string. GSAP snaps instead of interpolating,
which is what produced the "flies in, then stops" bug in the original deck:

```js
// wrong — GSAP cannot interpolate this
tl.to(el, { clipPath: 'inset(0 var(--x) 0 0)' }, 0);
```

Tween a numeric custom property and let CSS consume it:

```js
// scene.js
tl.fromTo(el, { '--draw': 0 }, { '--draw': 1, duration: 0.2 }, 0.32);
```
```css
/* scene.css — the resting value is the composed state */
[data-scene="09-qr"] .cq__qr path { stroke-dashoffset: calc(1 - var(--draw, 1)); }
```

Two more properties belong on that list. Never tween a `width` in `ch` to
reveal text: `ch` is the advance width of a zero, so in a proportional stack a
long string stays clipped at the *final* state, not just mid-tween. Reveal text
with a clip instead, which holds at any length:

```js
tl.fromTo(url, { '--type': 0 }, { '--type': 1, duration: 0.14, ease: 'none' }, 0.38);
```
```css
[data-scene="09-qr"] .cq__url { clip-path: inset(0 calc((1 - var(--type, 1)) * 100%) 0 0); }
```

The static gate fails any tween string containing `var(`, and the self-test
refuses a `scene.js` that contains `var(` at all. Any SVG path that animates its
own stroke carries `pathLength="1"`, so `stroke-dasharray: 1` and a 0..1
`--draw` are all the maths you ever need.

## Development warnings

`scrolline check` prints a warning rather than failing when it sees:

- a tween ending between 0.90 and 1.001 — legal, but there is no room left for a
  longer exit;
- an enter tween on copy ending after 0.30, or an exit starting before 0.75 —
  legal for the long media tweens above, suspicious for anything else;
- a scene with no tween at all in the exit window — the next scene will cut.

Failures, not warnings: a total above 1.001, a bare `from()`, a `var()` inside a
tween string, an unscoped selector, a literal colour, and any call to
`window.scrollTo` or `scrollIntoView` from a scene.
