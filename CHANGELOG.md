# Changelog

## 0.1.1 — 2026-09-21

- Three more example decks, each a different concept and palette, every picture a script-drawn infographic: `product-launch` (light), `annual-report`, `city-guide`. All twelve techniques are now exercised across the examples.
- GitHub Pages gallery of all decks: https://gongnyang.github.io/awesome-html-scrolline-deck/ (`scripts/site/build-examples.mjs`).
- One-minute demo trailer `docs/demo.mp4` + teaser GIF; regenerate with `tools/demo/`.
- Handbook grows to 56 pages with a chapter-4 gallery of real captures from the four decks.
- Template fixes found by building the decks: parallax-video veil hid the clip; odometer clipped 3–4 digit figures; paper-assembly fan lost its centring; wipe-transform step number coerced to a number; anatomy-rows accepts `assets.marks`; tilt-card caption legible over plates; `verify` settles 700 ms so captures match the scrubbed timeline. Schema documents `links`, `rows`, `marks`, `caption`, `restartLabel`.
- CLI: `add --url` and `qr --scene` wire the QR into `deck.json`; unknown flags warn.

## 0.1.0 — 2026-09-20

First public release.

- Engine: `createDeck` (GSAP ScrollTrigger pin/scrub, Lenis), frame scrub, presenter keys (`→`/`Space`, `←`, `1`–`9`/`0`, `P`, `F`, `H`, `N`), key landing at 35 % of each pin.
- 12 scene techniques as templates: frame-scrub-hero, word-relay, kinetic-titles, horizontal-gallery, anatomy-rows, frame-scrub-video, parallax-video, paper-assembly, odometer-stats, wipe-transform, tilt-card, closing-qr.
- CLI: `init`, `add`, `frames`, `media`, `qr`, `check`, `verify`, `storyboard`, `upgrade`.
- Gates: static S0, G1–G4, lint L1–L3; browser G5–G10 driven by real wheel events (Playwright optional, global install auto-detected).
- Sample deck (6 scenes) with 18 QA captures; 28 tests; CI on Node 20/22.
- Companion handbook (Korean, 46 pages): `docs/스크롤로-발표하라.pdf`.
