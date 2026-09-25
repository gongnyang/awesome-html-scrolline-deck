# Scene type router

The catalog is organized by the audience's information task. Route from the relationship to be understood, then check `template.json.sceneContract` and [scene-ledger.md](scene-ledger.md). Twenty types are currently production-reviewed. Experimental types are named here for discovery, but are not production-ready. Blocked types must not be selected.

## Production reviewed

| Need | Type | Required content |
|---|---|---|
| Establish place, object, or change through time | `frame-scrub-hero` | Source frames or one poster, one short claim title, at most one support line |
| Explain identifiable parts of a pictured subject | `anatomy-rows` | One clear image, 2–4 feature labels with short explanation; align marks to real features |
| Read a meaningful series of related images | `horizontal-gallery` | 3–6 images, alt text, one concise caption, meaningful image order |
| Explain one subject becoming another | `wipe-transform` | Three related, ordered, sourced states with one state label each |
| Compare before and after under equivalent conditions | `before-after` | Two matched images and labels with date/condition where needed |
| Compare a small set of actual numbers | `chart-reveal` | 2–4 category/value pairs, unit, source and a precise claim |
| Read sourced measurements and explain one selected event | `annotated-chart` | 2–20 exact values, matching x-labels with units, source, selected point and interpretation |
| Track supplied media frames through a mechanical/process clip | `frame-scrub-video` | Sourced frame sequence, frame-matched captions, and a stable hold |
| Compare finishes of one otherwise-equivalent product | `colorway-reveal` | One labelled triptych or three matched images, three labels and an explicit equivalence statement |
| Present a short phrase through its conceptual transformation | `word-relay` | Retain the full phrase relationship at the hold; do not leave isolated words without context |
| Present two sourced headline measures with their definitions | `odometer-stats` | `assets.stats` with value, unit, label, definition and period for each measure; `scene.source` |
| Reveal evidence located in a primary source | `document-proof` | Source page, exact anchored crop, quote, interpretation, locator, and attribution |
| Explain a labelled set of system relationships | `system-map` | Central system, 2–4 sourced relationship statements; do not invent direction or causality |
| Read a sequence of dated milestones | `timeline-roadmap` | 2–4 dated entries, chronology, fact/plan status, and source |
| Present a talk agenda as a meaningful audience path | `agenda-path` | Actual talk sections and takeaways in order; active stop matches the sequence |
| Teach a causal procedure | `step-flow` | 2–4 stages with each input, action, and output; retain causal transitions at the hold |
| Ask a question and reveal the evidence that resolves it | `question-reveal` | One answerable question, one direct evidence image, exact target marks, a clear answer and source |
| Evaluate a few candidates against shared criteria | `option-matrix` | Supplied criteria, values, and evidence for any recommendation; show row/column associations on mobile |
| Introduce a relevant speaker in their real working context | `tilt-card` | Consented portrait, role, provenance, and context that establishes relevance |
| Explain a route across real places | `map-route` | Credited map, verified coordinates, accessible ordered stop labels, and source |

## Experimental (prototype and review before use)

| Intended job | Type | Current limit |
|---|---|---|
| Animate talk section titles | `kinetic-titles` | Motion lacks an evidence/hold grammar; connect to a real visual path or keep experimental. |









## Blocked

| Type | Why it is excluded |
|---|---|
| `parallax-video` | Autonomous looping video moves independently of the speaker's scroll and has no reliable hold. |
| `paper-assembly` | Tiny paper thumbnails imply evidence while hiding content and relationships. |
| `closing-qr` | QR/thank-you animation is not a conclusion or reason for an audience action. |
| `chapter-transition` | A number/title alone is a slide-like interstitial with no visual evidence or scroll job. |

## Declare each type

Every `template.json` carries `sceneContract` fields for:

- `status`, `fit`, and `unfit` — supported job and explicit rejection cases
- `requiredInputs` and `exampleContent` — assets/data and a realistic demonstration
- `scrollBeatSemantics` and `stableHold` — what wheel movement reveals and where the presenter speaks
- `projectorTypeCriteria` and `labelCriteria` — hierarchy and legibility requirements
- `mobile` and `reducedMotion` — equivalent ways to read the scene
- `unsupportedReason`, `nextImplementation`, and `estimatedEffort` — diagnostic information for types not yet supported

Scroll each image state with the wheel; do not play media independently while the presenter pauses. Type modules expose `mount`, `build`, and `unmount`, and their normalized timeline follows [contract.md](contract.md). Their starting CSS state is already readable, including when `build()` is skipped for reduced motion.
