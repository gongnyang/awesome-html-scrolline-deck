# Changelog

## 0.1.0 — 2026-09-20

First public release.

- Engine: `createDeck` (GSAP ScrollTrigger pin/scrub, Lenis), frame scrub, presenter keys (`→`/`Space`, `←`, `1`–`9`/`0`, `P`, `F`, `H`, `N`), key landing at 35 % of each pin.
- 12 scene techniques as templates: frame-scrub-hero, word-relay, kinetic-titles, horizontal-gallery, anatomy-rows, frame-scrub-video, parallax-video, paper-assembly, odometer-stats, wipe-transform, tilt-card, closing-qr.
- CLI: `init`, `add`, `frames`, `media`, `qr`, `check`, `verify`, `storyboard`, `upgrade`.
- Gates: static S0, G1–G4, lint L1–L3; browser G5–G10 driven by real wheel events (Playwright optional, global install auto-detected).
- Sample deck (6 scenes) with 18 QA captures; 28 tests; CI on Node 20/22.
- Companion handbook (Korean, 46 pages): `docs/스크롤로-발표하라.pdf`.
