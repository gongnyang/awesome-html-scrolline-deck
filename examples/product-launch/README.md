# Nimbus — 무선 헤드폰 런칭 (example deck)

A seven-scene product launch, built only with the CLI in this repository. It is
the counterweight to [`../sample-deck`](../sample-deck): that one is a dark,
typographic deck about the skill itself, this one is a **light, warm, chart-heavy
product deck** — cream canvas, coral and cobalt accents, a geometric display
face, and an infographic on every plate rather than a caption on a photograph.

> **The product is fictional.** Nimbus NB-01 does not exist. Every figure on
> every plate — 40 hours, −42 dB, 213 g, six microphones, the four rival columns
> — was invented for this example, and each plate says so in its own footer.
> Nothing here is a claim about a real product.

| | |
|---|---|
| Scenes | 7, one per technique, no technique twice |
| Techniques | kinetic-titles · frame-scrub-video · tilt-card · horizontal-gallery · parallax-video · odometer-stats · closing-qr |
| Theme | `light`, warm palette override in `src/tokens.css` |
| Total pin | 1590vh · about 11 minutes spoken |
| Gates | `check` 6/6 · `verify` 12/12 |
| Folder | 3.1 MB excluding `node_modules/` and `dist/` |

## Storyboard

| id | technique | kicker | title | what the audience sees | asset | pinVh |
|---|---|---|---|---|---|---|
| `01-open` | kinetic-titles | NIMBUS OVER-EAR | 우리가 지운 세 가지 | Three numbered blocks — 소음 / 무게 / 시간 — assembling down a diagonal, each with two bullets | — | 240 |
| `02-turn` | frame-scrub-video | 외형 | 한 바퀴 돌려 본다 | The headphone turning once on its axis under the wheel, with a rotation readout, while three build lines land | 90 frames + poster | 280 |
| `03-hero` | tilt-card | 안쪽 | 뜯어 보면 네 층 | An exploded view of one ear cup — shell, driver, cell, mic array, pad — with leader lines and part specs | 1 plate 900×1200 | 200 |
| `04-features` | horizontal-gallery | 다섯 장면 | 숫자로 먼저 본다 | A rail of five charts: battery bars, the ANC attenuation curve, weight columns, a codec bitrate ladder, four finishes | 5 plates 1600×1000 | 320 |
| `05-breathe` | parallax-video | 잠깐 | 소리가 사라진 자리 | A field of sound lines swelling and flattening once behind the copy. Unpinned — the room breathes | 6s mp4 + poster | 130 (no pin) |
| `06-specs` | odometer-stats | 스펙 | 네 숫자로 끝낸다 | Four figures arriving on reels above a lit horizon: 40시간 · 42dB · 213g · 6개 | — | 220 |
| `07-close` | closing-qr | 가져가기 | 감사합니다 | Thanks set letter by letter, the QR drawing itself, the repository URL typed out | qr.svg | 200 |

`parallax-video` sits between two pinned scenes, never first and never last, as
`references/techniques.md` requires.

## How the assets are made

There is no photography and no footage. Every pixel under `public/` is drawn by
a script in `tools/`, so the deck rebuilds from source on any machine with
`sharp` and `ffmpeg`.

| Script | Output | Notes |
|---|---|---|
| `tools/lib/nimbus.mjs` | — | The drawing kit: the palette (mirroring `src/tokens.css`), and `headphone({ angle })`, which projects two cylinders on a circle plus an arched band by hand, so the product can be turned one frame at a time |
| `tools/make-rotation.mjs` | `public/frames/turn/f_%03d.jpg` ×90 + `poster.jpg`, 1.4 MB | One full turn, 1280×720, drawn at 90 angles. Frame 91 would repeat frame 1, so the loop stops one step short |
| `tools/make-hero-plate.mjs` | `public/media/03-hero/exploded.webp`, 27 KB | The five-layer exploded view. Everything lives right of x≈320 and inside y 120–1090, because `tilt-card` crops its plate to 56vw and masks the left 31% away |
| `tools/make-feature-plates.mjs` | `public/media/04-features/plate-0*.webp` ×5, 129 KB | The five charts, at 16:10 so `object-fit: cover` has nothing to crop, with the lower left left empty for the scene's own caption |
| `tools/make-breathe-video.mjs` | `public/media/05-breathe/breathe.mp4` 405 KB + `poster.webp` | 144 drawn frames → H.264, `-crf 30`, `yuv420p`, `-movflags +faststart`, no audio track. Every term is periodic over the six seconds, so the loop has no seam |
| `tools/apply-theme.mjs` | `src/tokens.css` | The palette, the type stack and the display scale |
| `tools/apply-scene-fixes.mjs` | three `scene.css` files | The scoped corrections listed below |
| `tools/wire-assets.mjs` | `data/deck.json` | Writes `frames`/`count`/`critical`/`poster`, `images`, `video` — the same fields `scrolline frames --scene` and `scrolline media --scene` write for a deck built from real material |

```bash
# from examples/product-launch
NODE_PATH=/path/to/node_modules/with/sharp node tools/make-rotation.mjs
FFMPEG=/path/to/ffmpeg node tools/make-breathe-video.mjs
```

## Rebuild it

```bash
# scaffold + copy, from the repository root
bash examples/product-launch/tools/build-deck.sh

# the same, redrawing every asset (needs sharp and ffmpeg)
ASSETS=1 NODE_PATH=/path/to/node_modules bash examples/product-launch/tools/build-deck.sh
```

## Run it and gate it

```bash
cd examples/product-launch
npm install
npm run dev                          # http://localhost:5173
npm run build && npm run preview

node ../../scripts/cli.mjs check .   # static: S0, G1–G4, lint  → 6/6
node ../../scripts/cli.mjs verify .  # wheel drive in Chromium  → 12/12, writes qa/
node ../../scripts/cli.mjs storyboard .
```

`qa/` is committed on purpose — 21 captures at 30% / 55% / 85% of every scene,
which is the fastest way for a reviewer to see what the deck does without
installing anything. The scaffold's `.gitignore` ignores `qa/`; this deck's
does not. `node_modules/` and `dist/` stay ignored.

Presenter keys: `→`/`Space` and `←` move a scene (landing 35% in, on the hold),
`1`–`7` jump, `P` auto-advances, `F` `H` `N` are fullscreen, cursor and notes.

## What reading the captures turned up

Everything below was invisible to the gates — all twelve passed the whole time —
and visible the moment the `qa/*.jpg` were opened. The fixes are scoped
overrides in this deck's `scene.css`; nothing under `templates/` was touched.

**A template bug, `parallax-video`.** The scene renders as a blank canvas in
every theme. `.pv__veil` is a full-bleed sheet of solid `var(--canvas)` kept
translucent by `opacity: .28` in CSS — but `build()` tweens that same element's
`autoAlpha` to 1, which writes `opacity: 1` inline and makes the veil opaque.
The clip is painted and playing underneath it, so there is no console error and
no failed request; the gates count three visible elements (the copy, which sits
above the veil) and pass. Fix here: leave `opacity` to the tween and move the
translucency into the colour — `background: color-mix(in srgb, var(--canvas) 46%,
transparent)`. Worth fixing upstream, since no deck using this technique can be
showing its video today.

**A template edge, `odometer-stats` with Korean suffixes.** The reels size up to
180px, which assumes a suffix like `vh` or `kg`. `40시간` and `213g` are wider
than one of four grid columns at that size, and `.od__reels { min-width: 0;
overflow: hidden }` then silently shaves the right-hand side off the last digit —
a zero renders as a C. Fix here: size the figures to the column
(`clamp(56px, 8.4vw, 116px)`). A guard in the template — sizing from the number
of columns and the suffix length — would catch it for everyone.

**Light-theme mismatches.** The odometer's reel mask fades 16% of every digit
into the canvas; invisible on a dark deck, a haircut on a light one, so the mask
was shortened to 4%. Its 1px `--accent-2` horizon disappears at projector
distance on cream, so it is 2px of `--accent-1` here. `parallax-video` dims its
clip with `brightness(.62)`, which is right for a dark room and muddy for a clip
drawn on the same cream as the page.

**The HUD owns the bottom-right corner.** `tilt-card` parks its credit exactly
where the engine draws `03 / 07`, and the two overlap into noise. The credit is
lifted by one `--space-section` here.

**Korean in a monospace stack.** A string that mixes Latin and Hangul inside one
mono run gets Latin advances for the Hangul and sets the syllables on top of each
other — `EXPLODED VIEW · 가상 제품` came out as a pile. Adding a CJK mono to the
stack does not fix the mixed run. Mono copy in this deck is single-script: Latin
credits and readouts, Korean kickers.

**Frames are cropped before they are seen.** A 1280×720 frame covering a
1440×900 stage loses 80px from each side, so anything the frame draws near its
own edge is gone. The rotation slate sits at x=150 rather than x=64 for that
reason.
