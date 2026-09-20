# City guide — 「서울, 해질녘 한 바퀴」

A seven-scene photo-essay deck: one evening route through Seoul, from the last of the sun to the ride home. It exists to show what this skill looks like when it is *not* explaining itself — a different subject, a different palette, a serif, and infographics rather than typographic plates.

It ships no photography. Every image, the frame sequence and the video are drawn as vector art by the scripts in `tools/`, so the whole example is reproducible from source and stays under 4 MB.

> **Sample data.** The landmarks are real places in Seoul. The times, distances, walking minutes and fares are invented for this example and are not advice — every plate that carries a number prints `SAMPLE DATA` on it, and 05-guide says so out loud in its third line.

## Storyboard

| # | id | technique | pinVh | what is on screen | asset |
|---|---|---|---|---|---|
| 1 | `01-hero` | `frame-scrub-hero` | 260 | a skyline going from dusk to night behind a standing title: the sky ramps, the sun drops behind the ridge, windows light up one by one, the moon comes up | 100 frames + poster |
| 2 | `02-route` | `anatomy-rows` | 300 | a route map dissected into five annotated rows — time, place, what to do there — each drawing a connector to its pin on the map | 1 map, 5 rows |
| 3 | `03-postcards` | `paper-assembly` | 260 | six postcards, one per stop plus the ride home, flying in and settling into a numbered fan | 6 cards |
| 4 | `04-drift` | `parallax-video` | 130 (unpinned) | the breath: six seconds of cloud and water drift under the copy | mp4 + poster |
| 5 | `05-guide` | `tilt-card` | 200 | the guide as an abstract figure, and the whole day as a vertical timeline with walking-minute bars | 1 plate |
| 6 | `06-compare` | `wipe-transform` | 300 | the same cost/time chart three times, 대중교통 → 도보 → 택시, a different mode lit at each step | 3 plates |
| 7 | `07-close` | `closing-qr` | 200 | thanks, the QR for this repository, and the day closed into a loop | QR + 1 mark |

Seven scenes, 1650vh of pin, about eleven minutes spoken. Every technique appears exactly once, no technique repeats back to back, and the unpinned scene sits between two pinned ones.

## Palette and type

`src/tokens.css` is a full replacement for the scaffold's token file, not a patch on it:

| | |
|---|---|
| canvas | deep indigo into plum (`#141026` → `#0b0817`) |
| accents | stream teal `#3fc7b4`, lit-window amber `#ffc06b`, route tangerine `#ff8a4c` |
| ink | warm off-white `#f7f1e8`, because every light in this deck is warm |
| display | Noto Serif KR — a humanist serif carries every title |
| body | Pretendard / Noto Sans CJK KR |

Scene CSS names tokens only (gate L1 fails on any literal colour). The drawings *have* to name colours, so `tools/palette.mjs` is the JavaScript twin of the token file: the two are kept in step by hand, and an entry there has the same name as the token it mirrors.

## How the assets are made

Each script builds SVG in memory and rasterises it with [sharp](https://sharp.pixelplumbing.com/); `sharp` is not a dependency of the deck, so point `NODE_PATH` at an installation of it.

```bash
export NODE_PATH=/path/to/node_modules      # a directory containing sharp

node tools/make-skyline.mjs     # 100 dusk→night frames + poster → public/frames/skyline/
node tools/make-route-map.mjs   # the route map                 → public/media/02-route/
node tools/make-postcards.mjs   # six postcards                 → public/media/03-postcards/
node tools/make-guide.mjs       # the guide plate               → public/media/05-guide/
node tools/make-compare.mjs     # three comparison plates       → public/media/06-compare/
node tools/make-closing.mjs     # the closing loop mark         → public/media/07-close/
node tools/make-drift.mjs       # the six-second clip + poster  → public/media/04-drift/
node tools/wire-assets.mjs      # writes the paths into data/deck.json
```

`make-drift.mjs` draws 144 frames, hands them to `ffmpeg` and deletes them again. It looks for `ffmpeg` on `PATH` and at `~/.local/bin/ffmpeg`; set `FFMPEG=/path/to/ffmpeg` if it lives somewhere else.

Three of the drawings are laid out against geometry the templates own, which is why they are the sizes they are:

- **The route map is 1126 × 1600** because `anatomy-rows` fills a 44vw × 100svh slot with `object-fit: cover`, and at 1440 × 900 that ratio crops nothing. The five stops are drawn *on* the template's fixed mark positions rather than the other way round, so the pins and the connector targets coincide.
- **The postcards carry a numbered spine.** `paper-assembly` spreads six sheets across 94% of one sheet's width, so every card but the last shows only its left ~19%. That strip holds the stop number and the time, and the fan reads as a day even where the pictures are covered.
- **The comparison plates keep their lower half empty.** `wipe-transform` puts its numbered caption and the scene title in the lower left and raises the third sheet into the lower right. A 1600 × 1000 plate maps 1:1 onto a 1440 × 900 stage, so the chart lives above y≈600 and the footnote goes to the far bottom right.

## Rebuild the whole deck

`tools/build-city-guide.sh` regenerates the scene folders and `data/deck.json` from the CLI, applies the deck's own overrides, draws every asset and prints the storyboard. Everything under `public/` is rebuilt; nothing is hand-edited in place.

```bash
bash tools/build-city-guide.sh
cd examples/city-guide && npm install && npm run build
```

What the script adds on top of plain `init` + `add`:

| step | what it does |
|---|---|
| `tools/tokens-twilight.css` | copied over `src/tokens.css` after `init` |
| `tools/patch-scenes.mjs` | four asserted one-line fixes to scene modules, inside the marked enter/hold blocks — see below |
| `tools/overrides/<id>.css` | appended to the generated `scene.css`, so a rebuild keeps them and the diff against the template stays readable |

## Run it

```bash
npm install
npm run dev                  # http://localhost:5173
npm run build && npm run preview
```

Presenter keys: `→` / `Space` and `←` move a scene at a time and land 35% into the pin; `1`–`7` jump; `P` auto-advances; `F`, `H`, `N` are fullscreen, hide cursor, speaker notes.

## Gate it

```bash
node ../../scripts/cli.mjs check .     # 6 static gates, no browser
node ../../scripts/cli.mjs verify .    # 12 gates including the wheel drive; writes qa/<id>-{30,55,85}.jpg
node ../../scripts/cli.mjs storyboard .
```

Both pass: `check` 6/6, `verify` 12/12. `qa/` is tracked here on purpose — the captures are this example's evidence, so the three frames of every scene can be read without installing a browser. `node_modules/` and `dist/` stay ignored.

## Template bugs found while building this

All four were found by reading the `verify` captures, and all four are worked around inside this deck by `tools/patch-scenes.mjs`, which asserts each anchor and fails loudly rather than silently leaving the deck unpatched. They are worth fixing upstream in `templates/scenes/`.

1. **`parallax-video` — the veil hides the clip.** `scene.css` sets `.pv__veil { opacity: .28 }`, and `build()` then tweens it with `autoAlpha: 1`, which writes opacity 1. From progress .16 onward the veil is a fully opaque canvas-coloured sheet across the viewport, so the clip it is meant to soften is never visible at all. The scene degrades to copy on a flat background, and every capture of it looks empty. Tween to `0.28` instead.
2. **`paper-assembly` — the fan lands off-centre.** `.pa__sheet` is centred with `transform: translate(-50%, -50%)`. GSAP parses that into `xPercent: -50, yPercent: -50`, so the fan tween's `xPercent: -47..47` does not offset the centred sheet, it *replaces* the value that centres it. The whole fan lands half a sheet right and half a sheet low, and with six sheets it runs off a 1440-wide stage. Write the offsets as `-50 + x`.
3. **`wipe-transform` — the step counter loses its leading zero.** `tl.set(num, { textContent: '02' })` makes GSAP read `'02'` as a number, so the caption renders "2" and then "3". Setting the text from a callback keeps it a string.
4. **`tilt-card` — `assets.caption` collides with the artwork.** The figcaption is pinned to the portrait's bottom right corner, which on a full-bleed plate is over whatever the plate puts there. Not a bug so much as a slot with no clearance; this deck leaves `assets.caption` empty and prints its credit inside the plate instead.

One more thing worth knowing, though it is the harness and not a template: `verify` settles for 250ms after reaching a probe position while ScrollTrigger scrubs with `scrub: 0.6`, so the 55% capture is taken slightly behind the timeline. Compositions that only resolve at the very end of a hold tween will read as unfinished in `qa/`.
