# Sample deck — "Scrolline Deck"

A six-scene deck that explains the tool it was built with. It is also the repository's test fixture: the smoke test under `tests/` copies it, installs it, builds it and runs `check` against it, and the README hero images are `verify` captures taken from it.

| # | id | technique | what it says |
|---|---|---|---|
| 1 | `01-hero` | `frame-scrub-hero` | a scrollytelling deck does not cut, it advances |
| 2 | `02-relay` | `word-relay` | one notch of the wheel is one notch of progress |
| 3 | `03-arc` | `kinetic-titles` | every scene is enter, hold, exit |
| 4 | `04-gallery` | `horizontal-gallery` | six of the twelve techniques, as plates |
| 5 | `05-numbers` | `odometer-stats` | 12 techniques, 10 gates, 1 timeline, 0 boxes |
| 6 | `06-closing` | `closing-qr` | the QR points at this repository |

Total pin distance: 1460vh across six scenes, about nine minutes spoken. Every `pinVh` is the default its technique template ships with.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build && npm run preview
```

## Gate it

```bash
node ../../scripts/cli.mjs check .
node ../../scripts/cli.mjs verify .    # needs Playwright; writes qa/<id>-{30,55,85}.jpg
```

## Assets

This deck ships no photography and no video. Everything under `public/` is generated from the deck tokens by two small scripts, so the example stays small and reproducible:

```bash
# 120 hero frames + poster  →  public/frames/hero/
NODE_PATH=<dir containing sharp> node tools/make-frames.mjs

# six typographic plates    →  public/media/gallery/
NODE_PATH=<dir containing sharp> node tools/make-posters.mjs

# closing QR                →  public/media/qr.svg
node ../../scripts/cli.mjs qr --url https://github.com/gongnyang/awesome-html-scrolline-deck --out public/media/qr.svg
```

In a real deck you would cut the frames from footage instead: `scrolline frames talk.mp4 --name hero --fps 12 --width 1280 --scene 01-hero`.
