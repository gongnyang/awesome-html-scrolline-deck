# Pitfalls

Every entry here cost a real debugging session. They are listed in the order they
usually bite.

## 1. `vh` is not a ScrollTrigger unit

```js
end: `+=${scene.pinVh}vh`   // wrong — vh is not parsed as a relative unit
end: `+=${scene.pinVh}%`    // wrong — changes when the trigger grows with wrapped text
end: () => `+=${Math.round(scene.pinVh / 100 * window.innerHeight)}` // viewport pixels
```

ScrollTrigger accepts pixels and percentages in a relative end string. `vh` is
parsed as a bare number, so a 250vh pin becomes a few hundred pixels. A relative
percentage can scale with the trigger's rendered height, which changes when text
wraps differently across platforms. Compute pixels from the viewport on refresh.
Gate G5 measures the pin spacer and fails when the distance is off by more than 2px.

## 2. Lenis 1.1.0 needs `prevent` as a function

```js
new Lenis({ prevent: () => false })
```

The documented default `false` is called as a function on the first wheel event
and throws `TypeError: prevent is not a function`. Smooth scrolling then dies
silently mid-presentation. `engine/scroll.js` passes the function; never
construct Lenis yourself.

## 3. `var()` inside a tweened string snaps

```js
gsap.to(el, { clipPath: 'inset(0 0 0 var(--x))' });   // wrong — jumps at the end
```

GSAP interpolates numbers, not unresolved custom properties. Anything with a
`var()` in the value string snaps from start to end. Tween a number into the
custom property and let CSS compute:

```js
gsap.fromTo(el, { '--wipe': 0 }, { '--wipe': 1, duration: 0.3 }, 0.3);
/* css */ clip-path: inset(0 calc((1 - var(--wipe)) * 100%) 0 0);
```

Gate G3 fails on `var(` inside any tween value.

## 4. `from()` renders immediately

`gsap.from(el, {...})` applies its values at build time even on a paused
timeline, so the page flashes the end state while loading and a re-mount starts
from the wrong place. Always use `fromTo()` with both states written out.

## 5. Timeline longer than 1

The engine scrubs a timeline of length 1 across the pin distance. If the sum of
positions and durations exceeds 1, GSAP rescales everything by `1/duration` and
the entrance, hold and exit bands all drift. The engine warns in the console and
gate G2 replays the timeline with a recorder and fails above 1.001.

## 6. Measuring with `scrollTo` proves nothing

Verification drives the wheel — `mouse.wheel(0, 240)` on a 50ms tick — because
`window.scrollTo` bypasses Lenis, lands where no viewer ever lands, and hides
exactly the pin bugs you are looking for. `window.scrollTo` and
`scrollIntoView` are banned from scene code and from verification scripts
(gate G4). A closing scene that restarts the deck uses `ctx.lenis?.scrollTo(0)`.

## 7. Pin start values read 0 for one frame

Right after pinning, `ScrollTrigger.start` can be 0 for every trigger for one
frame, which sends the HUD and every key jump to the top of the deck. Measure
from the layout anchor instead: if the section's parent is a `.pin-spacer`, use
the spacer's offset. The engine's `startPx()` does this.

## 8. Keyboard landing at 35%

Jumping to a scene's start lands mid-entrance, where the title is still flying.
The engine lands at `start + pinDistance * 0.35`, the first frame of the hold.
Keep the entrance band under 30% or the landing shows an unfinished scene.
Gate G7 checks the landing position and the visible element count.

## 9. Reduced motion is a different deck

Under `prefers-reduced-motion: reduce` the engine skips `build`, creates no pin
and no Lenis instance. Everything a scene shows must therefore be visible after
`mount` alone. Scenes that hide their content in CSS and reveal it in the
timeline go blank for those viewers. Gate G10 loads the deck with reduced motion
and requires three visible elements per section and zero pin spacers.

## 10. Frame sequences get heavy fast

Keep a scrub sequence under 120 frames and 10 MB, and list the frames the
opening needs in `critical` so they are fetched before the rest. On mobile the
engine draws the poster only, unless `mobileFrames` points at a narrow sequence.

## 11. Boxes are not a layout

A card with a border is the default a deck should avoid: at projector distance
it reads as noise. Use the full bleed, type scale and negative space instead.
Colours come from tokens only — gate L1 fails on a literal hex, `rgb()` or a
colour keyword in any `scene.css`.

*Not applicable here:* the HalfFloat bloom workaround from WebGL decks. This
engine paints frames onto a 2D canvas, so there is no float-precision pass to
configure.
