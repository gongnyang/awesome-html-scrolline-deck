# tools/demo — the launch film

Builds `docs/demo.mp4`, `docs/demo-poster.jpg` and `docs/demo-teaser.gif` from the four
example decks. Nothing here is part of the skill or the CLI; it only reads the decks.

## Regenerate

```bash
# from the repo root, with the four example decks already built (npm ci && npm run build)
node tools/demo/record.mjs          # capture every frame  (~5 min)
node tools/demo/build.mjs           # cut, score and encode (~3 min)
node tools/demo/qc.mjs docs/demo.mp4   # check it before shipping it
```

`record.mjs` accepts segment names if you only need to redo part of it:

```bash
node tools/demo/record.mjs card-open sample-deck presenter
node tools/demo/build.mjs --skip-segments     # reuse the encoded segments, recut only
node tools/demo/build.mjs --gif-only          # rebuild just the teaser GIF
```

Intermediates go to `$DEMO_SCRATCH` (a scratch directory, default is the session
scratchpad). Frames are JPEG q95, roughly 500 MB for a full capture.

## Requirements

- Node 20+, and `playwright` resolvable — `record.mjs` imports it by absolute path, so
  change that constant if yours lives elsewhere.
- `ffmpeg` and `ffprobe` 6+; paths are constants at the top of `build.mjs`.
- Each `examples/*/dist` must exist. The decks are served from a tiny static server in
  `serve.mjs`, one port per deck, because deck assets use absolute paths (`/frames/…`)
  and would break under a shared subpath.

## The files

| file | what it owns |
| --- | --- |
| `shots.mjs` | the whole edit as data: decks, scene visits, presenter beat, card lengths, cut list |
| `record.mjs` | Playwright capture of deck passes, the presenter beat and the title cards |
| `cards/` | the three title cards, plus `seek.js`, the deterministic clock they run on |
| `music.mjs` | the synthesised score |
| `build.mjs` | segment encode with push-ins, the xfade chain, the master, poster and GIF |
| `serve.mjs` | dependency-free static server |
| `qc.mjs` | empty-frame, duplicate-frame and stall checks; run it on the master |
| `map-scenes.mjs` | prints each deck's scroll geometry; run it after changing a deck |

Change the film in `shots.mjs`. `record.mjs` and `build.mjs` hold no editorial decisions.

## How the decks are driven

A scroll-driven deck can only be scrubbed honestly by scrolling it, so every captured
frame is preceded by one real `page.mouse.wheel` tick — never `scrollTo`.

But a deck is **not** scrolled end to end. Scrolling through a deck means scrolling
through the gaps between its pinned scenes, and a gap is an empty screen. The first cut
of this film was 11% empty by the measure below, in ten runs of half a second, and all
of it was gaps and scene entrances. A trailer cannot afford that.

So each deck is a list of **visits** instead. A visit jumps straight to a scene — the
jump is a real wheel event too, just never captured — ramps across the composed part of
its pin, rests on the 55% frame, ramps out, and hard-cuts to the next. The gaps are
never filmed. That alone took the four deck passes to 0% empty.

The windows come from the gate's own QA captures. Every scene is shot at 30%, 55% and
85% of its pin; measured the way the emptiness check measures, every scene clears the
threshold comfortably at 30% and 55%, so `visit()` defaults to entering at 30% and
leaving at 78%. The few that thin out by 85% carry an explicit `exit`. Re-run the QA
captures and re-measure if a deck's scenes change.

Three things make the motion come out smooth:

- **Lenis settles inside a frame.** Measured on `sample-deck`, a 26px wheel delta lands
  with a standard deviation of 0.34px by the time the screenshot is taken — sub-pixel,
  so the ramps are even without waiting for a convergence poll on every frame.
- **The jump does wait.** `jumpTo()` polls until the scroll is within 1.5px of target,
  then waits out the 0.6s ScrollTrigger scrub, so a visit opens on a settled frame.
- **The ramps are eased.** In on a smoothstep, so the scene arrives already settled;
  out on an accelerating curve, so the cut lands on movement rather than on a stop.

Every rest gets a `zoompan` push-in in `build.mjs` — 5.5% across the dwell, released
over the exit ramp — so a settled scene is not also a frozen frame. The title cards and
the presenter beat are static for most of their length by nature, so they drift instead.

## Music

Synthesised, not sourced. `music.mjs` builds an A-minor drone, a pad on an eight-second
swell and a plucked pulse every 1.2s out of ffmpeg oscillators, then normalises to
-16 LUFS with a 3.5s fade out. No third-party audio is downloaded or bundled — there is
no track on this machine with a licence file next to it that can be verified, and an
unverifiable track is not worth the risk on a public repo.

Two traps if you edit the expressions:

- They are full of commas (`min`, `mod`, `exp`). An unquoted comma ends the filter as far
  as ffmpeg's parser is concerned, so the expression must stay inside the single quotes
  `bedSource()` adds.
- A bare `exp()` decay restarts instantly each period. That step is a click, not a pluck,
  and it shows up as broadband energy to 16kHz. The `min(1, …)` in front is a ~12ms
  attack ramp.

## Checking a render

The measure that matters is **emptiness**: how much of the film is a screen with almost
nothing on it. Sample at 5fps, shrink to 96x54 greyscale, take each frame's standard
deviation; below 6 is an empty frame. A composed frame scores well above it however dark
— city-guide's night cityscape averages 14 luma out of 255 and scores 17 — while a frame
caught in a gap between pinned scenes is near uniform and scores 1.

```bash
node tools/demo/qc.mjs docs/demo.mp4
```

The bar is under 3% overall with no run of 0.3s or longer. The current cut reports 0.3%
and no runs, against 11.0% and ten runs before the film moved to scene visits.

`qc.mjs` also reports black frames (by YHIGH, the 90th-percentile luma), duplicate
frames, and the longest stall — how long the picture stops moving. Anything approaching
two seconds needs a push-in, which is what the `holds` and `drift` values are for. The
current cut's longest stall is 0.40s.

## Gotchas worth remembering

**Glob patterns in CSS comments.** `cards/card.css` must not contain one. A stray `*/` inside
`/* … */` ends the comment early, and the `:root` token block that follows is then parsed
as part of a broken selector and dropped in silence — the cards render white-on-serif
with the layout still intact, which looks like a font problem rather than a parse error.

**A `fadeblack` transition is an empty screen by construction.** Every cut in `EDIT`
dissolves or slides between two composed frames instead, and none runs long enough for
the emptiness check to sample it twice.

**Card reveals have to be front-loaded.** A card that takes three quarters of a second
to put anything on screen is three quarters of a second of dead trailer. Each card now
carries real contrast within 0.2s and finishes its reveal inside the first third.

**The teaser GIF is cut from the raw frames, not the segments.** The segments carry a
push-in across every rest, which moves every pixel of every frame — fine for H.264,
ruinous for GIF, which leans on frames repeating. The same 12.4 seconds is 11.5MB from
the segments and 6.9MB from the frames, at better quality.

**The presenter beat cannot hold real time.** A screenshot costs about 45ms, so a
one-second key glide lands in roughly seven captured frames no matter how many are
budgeted for it; the rest of the budget becomes a frozen picture. That segment is timed
around what the capture actually contains, not around how long the interaction takes.
