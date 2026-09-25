# Scroll choreography

Write the speaker beat before writing a tween. Each scene states a claim, the relationship the audience needs to understand, the evidence, the presenter action, and the new information scrolling exposes. If the last item is empty, use a `pass` scene or combine it with its neighbor.

## Pace and stops

| Mode | Use when | Runtime |
| --- | --- | --- |
| `pass` | A short bridge or static statement needs no scroll manipulation. | No pin; `scrollVh: 0`. |
| `hold` | A question, comparison, chart, or decision needs a stable speaking screen. | Pin for the authored `scrollVh`; `cueStates` land on complete frames. |
| `scrub` | The position of the scroll itself explains a change, sequence, place, or mechanism. | Pin for the authored `scrollVh`; each cue remains understandable when the speaker stops. |

There is no standard length or 35% landing for a new scene. Choose the distance after rehearsing the number of information changes. A short claim must not occupy several empty screens. The engine accepts older `pinVh` scenes for migration, but all new scenes use `pace`.

Every scene module receives one paused GSAP timeline from the engine. Its duration must be at most 1; the engine extends a shorter tail to 1 so cue ratios stay stable. A continuous media tween may run across the timeline if the movement itself communicates the argument. Other elements should settle at each declared cue.

Example storyboard and timeline:

```json
"pace": {
  "mode": "scrub",
  "scrollVh": 145,
  "cueStates": [
    { "at": 0.30, "message": "Before state and its source are readable" },
    { "at": 0.67, "message": "After state uses the same scale and exposes the change" }
  ]
}
```

```js
// Both states use the same visual baseline. The claim and source remain visible.
tl.fromTo(after, { clipPath: 'inset(0 100% 0 0)' },
  { clipPath: 'inset(0 0% 0 0)', duration: 0.32, ease: 'none' }, 0.32);
```

The entering frame and every cue must retain a recognizable subject, claim, and source. At 96% and 99% of a pin, the audience must still see meaningful content or the next scene's subject; do not fade an entire scene to an empty background. A full-screen wipe is acceptable only if it visibly reveals the next scene.

## Geometry and timing checks

- Use `fromTo()` for a state that must animate from hidden to visible. A bare `from()` can apply its hidden state immediately on a paused timeline.
- Never tween a string containing CSS `var()`; tween a numeric custom property and let CSS use it.
- Do not draw a line between approximate points. Attach its endpoints to actual visual anchors and recheck at mobile width; if that relationship cannot be maintained, use adjacency, numbering, or a crop.
- Do not put numerical evidence inside generated images. Render exact values, axes, units, periods, denominator, and source as HTML/SVG.
- Under reduced motion, the same final argument and evidence must be present without a timeline or pin.

Run strict browser verification and inspect 1440×900, 1920×1080, 390px, and reduced-motion captures at entry, every presenter cue, and 96%/99% exit. Automation catches geometry and visibility; another reviewer must judge whether a viewer can understand the claim in five seconds and read it from the back of a room.
