# Scene suitability ledger

This is the routing source for scene types. It borrows [BookForge](https://github.com/gongnyang/bookforge)'s useful **method**: record each type's supported semantic job, declared requirements, failure axes, and corrective work before treating it as production. It does not import BookForge's medium-specific thresholds or claim their PDF tests validate a browser talk.

`template.json.sceneContract` mirrors the per-template contract so a type remains self-describing when used from the CLI. Production means the scroll action, held composition, labels, responsive fallback, and reduced-motion output were reviewed as a coherent presentation scene. It does not mean every content instance is automatically good. Experimental types may be used as prototypes only; blocked types should not be selected until the listed structural issue is resolved.

## Routing by information relationship

| Audience needs to understand… | Route to | Status |
|---|---|---|
| A place, object, or action through time | `frame-scrub-hero` | Production |
| Parts of a pictured object, each tied to a real target | `anatomy-rows` | Production |
| A sequence of related images as evidence | `horizontal-gallery` | Production |
| One object changing through three documented states | `wipe-transform` | Production |
| A controlled comparison of the same subject | `before-after` | Production |
| A small set of exact values and their comparison | `chart-reveal` | Production |
| A sourced measurement sequence and one selected event | `annotated-chart` | Production |
| A choice between equivalent product finishes | `colorway-reveal` | Production |
| Retain a short phrase relation while revealing its transformation | `word-relay` | Production |
| Present defined and sourced headline measures | `odometer-stats` | Production |
| Explain a sourced real-world route among places | `map-route` | Production |
| See all remaining routes and their known failures | Type register below | Mixed |

**Decision sequence:** name the spoken claim → identify the relationship the audience must see → choose a type only if its data and assets can represent that relationship faithfully → compose the spoken hold → check viewport and motion fallbacks. If the fit depends on the type pretending to have evidence it lacks, reject it.

## Type register

Effort estimates are relative implementation planning cues, not guaranteed engineering times. Type-level contract fields (fit, unfit, required inputs, scroll beat, stable hold, projector criteria, label criteria, mobile/reduced-motion behavior, and example content) live in each template's `template.json.sceneContract`.

| Type | Status | Failure reason / remaining implementation before production |
|---|---|---|
| `frame-scrub-hero` | **Production** | Requires a topic-specific frame sequence or a still with a clear visual proposition. A generic image behind a large title does not establish the scroll's meaning. |
| `anatomy-rows` | **Production** | Labels must point to real image features; incorrect or fallback marks are a content failure. Use 2–4 concise points. |
| `horizontal-gallery` | **Production** | The sequence itself must be evidence; unrelated decorative stock images fail fit. Keep each hold readable and index/caption synchronized. |
| `wipe-transform` | **Production** | The three media states must depict one related subject and be sourced/ordered truthfully. A transition effect alone is not a narrative. |
| `before-after` | **Production** | Comparisons must use aligned conditions. Unmatched crops/scale or absent date/condition labels mislead. |
| `chart-reveal` | **Production** | Use actual supplied values, legible category/value labels, a zero baseline, consistent unit, and source. It is not a dashboard or proxy for image evidence. |
| `word-relay` | **Production** | Keep the source phrase and transformed phrase readable at the hold; all terms need a clear semantic relation. |
| `kinetic-titles` | **Production** | Use only for a 2–4 step argument whose stages advance the same claim. The path and current stage stay readable at the hold; browser QA reviewed projector, mobile, and reduced-motion states. |
| `frame-scrub-video` | **Production** | Requires attributable process footage and observation cues matched to visible frames. The scroll position drives the recording playhead, current observation, and progress indicator together; verify each authored cue against the actual footage and preserve its source/re-enactment label. |
| `parallax-video` | **Production** | A supplied muted clip is scrubbed by scroll and held at the current frame; no autonomous playback. The fixture passed all 15 strict gates, including mobile and reduced-motion capture review. |
| `paper-assembly` | **Production** | A large lead image arrives first, then two to four labelled source images gather around the stated claim; all captions remain visible at hold. The 15-gate browser fixture passed, including a mobile stacked layout and reduced-motion grid, both reviewed from captures. |
| `odometer-stats` | **Production** | Every `assets.stats` item requires `value`, `unit`, `label`, `definition`, and `period`; keep each definition and the `scene.source` co-visible with the figure. |
| `closing-qr` | **Production** | A specific conclusion and one audience action arrive before the optional QR; its URL comes from `deck.links.site`, the QR is an image generated from that same link, and restart is a real button. The 15-gate fixture passed with visible media; desktop 30/55/85, mobile, and reduced-motion holds were reviewed. |
| `question-reveal` | **Production** | Ask one question and reveal evidence that visibly resolves it. A generic answer list or evidence that does not answer the prompt is a content failure; the browser hold and mobile/reduced reading order were reviewed. |
| `agenda-path` | **Production** | Use actual talk sections and audience takeaways; a decorative route or unconnected list fails fit. Current section highlight, full section names, and static mobile/reduced state reviewed in browser. |
| `chapter-transition` | **Production** | A new chapter reveals two to four ordered speaking beats beneath the chapter claim. The fixture passed all 15 strict gates; desktop, mobile, and reduced-motion holds were reviewed. |
| `document-proof` | **Production** | Requires the source page, exact anchored crop, quote, interpretation, locator, and attribution together. Missing correspondence between crop and source is a content failure; the prototype hold and mobile reading order were reviewed in browser. |
| `step-flow` | **Production** | Every stage carries input, action, and result so the causal change is visible. Reject unordered procedures or labels without state change; desktop/mobile/reduced states reviewed in browser. |
| `system-map` | **Production** | Each relationship must be supplied as a labelled statement and supported by the source; the central system and all relation labels remain co-visible. Do not imply direction, weight, or causality absent from the data. Desktop, mobile, and reduced states reviewed in browser. |
| `timeline-roadmap` | **Production** | Preserve supplied chronology and labels; never imply proportional duration from equal spacing. Distinguish planned from observed claims in the authored content and cite them. Desktop, mobile, and reduced states reviewed in browser. |
| `map-route` | **Production** | Requires verified coordinates and a credited real map. Route, aligned numbered stops, adjacent desktop labels, 390px map-plus-list layout, and reduced-motion frame passed strict browser checks; validate each authored map projection and avoid unsupported distance claims. |
| `annotated-chart` | **Production** | Authored product 06-evidence passed strict browser gates and visual review at 30/55/85, 390px, and reduced motion. The 42 dB / 150 Hz peak matches the supplied series; the curve connects through 1000 Hz, with units, source, and hypothetical-design caveat visible. |
| `colorway-reveal` | **Production** | Use only when function, price, and performance are equivalent. The triptych or three images need comparable views and direct labels; focus cannot imply superiority. |
| `option-matrix` | **Production** | Must preserve every supplied criterion and show row/column relationships on mobile; a recommendation requires explicit evidence. Verify that visual emphasis does not conceal a criterion or imply a false ranking. |
| `tilt-card` | **Production** | Use a permitted image of a participant and their actual work with a verbatim, attributed quotation. The photo sequence must provide context for what the person says; reject stock-person stand-ins and an ornamental portrait without provenance or consent. |

## Failure axes

Use these labels when reviewing a prototype. They distinguish the remedy, instead of recording a generic visual dislike.

- **Semantic mismatch:** the type cannot show the relationship in the claim (example: a route with no locations). Change the scene type or build a new scene.
- **Evidence mismatch:** requested proof/source/data is absent or the visual changes its meaning. Request valid evidence or rewrite the spoken claim; do not fill the gap with a generated diagram.
- **State/hold mismatch:** scroll does not change useful information, or the keyboard landing and stable hold do not show claim and proof together. Redesign the state progression.
- **Hierarchy/legibility mismatch:** title, data, labels, or credits compete or are too small at projection distance. Reduce content and remake scale/placement; changing accent colors alone does not fix it.
- **Asset mismatch:** subject is cropped, missing, wrong, low-resolution, or unidentifiable. Replace/recrop the asset and check focus points; don't auto-fill with unrelated stock imagery.
- **Viewport/input mismatch:** pins, horizontal drags, or labels fail on narrow screens, keyboard input, or reduced motion. Design an equivalent reading sequence.
- **Motion mismatch:** timed playback, too many simultaneous transitions, or continuous movement competes with speech. Make progress presenter-controlled and guarantee a stable pause.

## Admitting a type to production

The author must demonstrate a representative example at the entrance, 35% keyboard landing, mid-journey hold, and exit; a keyboard/wheel traversal in a real browser; projector-size legibility; a narrow viewport; reduced motion; and recovery when reversing the scroll. Inspect the actual rendered states, not only the source markup or template preview. Record the result in the owning scene contract and update this ledger. Do not publish an unimplemented candidate count as a supported catalog size.
