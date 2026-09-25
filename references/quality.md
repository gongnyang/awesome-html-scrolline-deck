# Presentation quality and release checks

## Automated gates

- `check`: schema, scene module/timeline contract, scoped/token CSS, local media paths and every frame in a sequence.
- `verify --strict --build`: real wheel traversal, scene pin geometry, presenter key landing, 30/55/85 captures, no console/page errors, no horizontal overflow, reduced-motion state, every packaged image decoding at its served URL, visible media in image-led hold screens, and measurable solid-background text contrast. A skipped browser gate fails strict verification.
- CI runs strict verification for all eight examples before assembling the gallery or deploying Pages. A build or stale historical capture is not a release gate.

## Human visual acceptance

Read the 30/55/85 capture set for **every scene** at projector-size desktop and inspect the deck at 390px mobile. At the opening, the intended visual should arrive clearly and the headline be readable over it. At 55%, the audience should be able to identify one claim and its evidence without decoding a wall of text. At 85%, no crucial content should vanish before the presenter has finished the point. Reject broken crops, stretched images, confusing visual reuse, fake-looking data, clipped text, empty holds, or transitions that obscure the claim.

Check keyboard-only progression, visible focus, notes/fullscreen, screen-reader labels for meaningful images, and reduced motion. WCAG 2.2 gives a 4.5:1 minimum for normal text and 3:1 for large text; test text over the *actual image frames*, not a flat token background. [WCAG contrast](https://www.w3.org/TR/WCAG22/#contrast-minimum) and [motion guidance](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions) explain these checks.

## Media and performance

Image count has no preset cap. Package every image locally with a defined purpose, dimensions, mobile crop where needed, and fallback/poster for moving media. Prioritize first-screen media; defer below-fold assets until needed. Check decoded dimensions and network failures, not merely filenames. [Responsive image guidance](https://web.dev/learn/design/responsive-images) supports size variants and avoiding lazy loading for the hero. Measure first-scene readiness and scrolling smoothness on a typical laptop and phone; revise oversized media or expensive effects before release.

## Publish and rehearsal

Publish the gallery and eight independent deck URLs only after all gates and visual review pass. Open each *deployed* URL, traverse its opening and closing, confirm every requested image URL returns and decodes, and check mobile and reduced-motion once more. Keep a static hold-frame backup for the speaker. Confirm navigation, notes, fullscreen, and any QR on the actual presentation machine.
