# Scene type router

Choose a scene from the audience's information task, not from its animation. The entries below are **experimental candidates** until their current representative examples receive independent visual review. For the full fit/unfit criteria, inputs, screen behavior, and fallback for each type, open its `template.json` contract or the [scene suitability ledger](scene-ledger.md).

## Selection sequence

1. Write the one sentence the audience should remember.
2. State what relationship they must see: observation, part-to-whole, sequence, date, place, change, magnitude, decision, testimony, or action.
3. Name the evidence needed to prove that relationship. If the evidence is missing, narrow the claim or use the contract's fallback.
4. Choose the simplest type that represents the relationship faithfully.
5. Define what the presenter says during the hold and what information scroll changes. Use `pass` when no pause is needed, `hold` for a readable speaking state, and `scrub` only when position itself explains change.
6. Review the actual built scene on projector, phone, reduced motion, and reverse navigation before calling it ready.

## Relationship index

| Relationship | Candidate type | Required content |
|---|---|---|
| Talk sequence | `agenda-path` | Actual section names and audience takeaways in their speaking order |
| Part to whole | `anatomy-rows` | One identifiable subject image and 2–4 feature labels tied to real locations |
| Time series and event | `annotated-chart` | Exact ordered values, x labels and units, source, selected event and interpretation |
| Controlled change | `before-after` | Two comparable views of the same subject and their dates/conditions |
| Argument sequence | `chapter-transition`, `kinetic-titles` | A real chapter claim or 2–4 ordered beats that advance the same argument |
| Magnitude comparison | `chart-reveal` | Exact category/value pairs, shared unit, baseline, source and a precise claim |
| Decision to action | `closing-qr` | A conclusion, one concrete audience action, and a QR generated from the destination |
| Equivalent options | `colorway-reveal` | Matched product views and explicit evidence that non-color properties are equivalent |
| Claim to source | `document-proof` | Primary document, exact crop/locator, quote, interpretation, attribution |
| Visual change over time | `frame-scrub-hero`, `wipe-transform` | Related source frames or three ordered states of the same subject |
| Process over time | `frame-scrub-video` | Attributable process clip with frame-matched observation cues |
| Ordered visual evidence | `horizontal-gallery`, `paper-assembly` | Related images whose order and captions explain their evidentiary role |
| Spatial route | `map-route` | Credited real map, verified coordinates, ordered stops and supported route claim |
| Defined measures | `odometer-stats` | Exact value, unit, label, definition, period and source for every measure |
| Criteria-based decision | `option-matrix` | Explicit candidates, shared criteria, values, and evidence for any recommendation |
| Question to observation | `question-reveal` | Answerable question, source image, exact marks, observations, conclusion and source |
| Causal sequence | `step-flow` | 2–4 stages with each input, action, output and causal transition |
| Component relationships | `system-map` | Center, labelled sourced relationships, and only supported directions/weights |
| Person to testimony | `tilt-card` | Consented participant, verbatim attributed quote, role and relevant work context |
| Dated sequence | `timeline-roadmap` | Verified event dates; completed facts separated from planned milestones |
| Phrase transformation | `word-relay` | A short complete phrase whose meaningful transformation supports the claim |
| Visual context | `parallax-video` | Relevant credited clip with motion tied to a clear narrative purpose and stable pause |

## Layout and motion rules

- Keep one dominant claim or piece of evidence in the first visual focus. Supporting text should explain its meaning, not repeat it.
- Give the speaking hold enough vertical space and time to read. A short connective statement can pass; do not pin every scene by default.
- Keep category labels attached to chart values, and put unit, period, denominator/definition, and source beside the figure.
- Use lines only where the edge encodes a real relationship and its endpoint remains attached at every viewport. Otherwise group items by proximity or number them.
- A generated image may establish atmosphere or depict a scene; it cannot certify a measurement, map location, document, product specification, or real-person quotation.
- The phone layout and reduced-motion state must preserve the same claim, evidence, labels, and reading order. These are designed states, not screenshots of a squeezed desktop layout.
- When the required evidence or relationship is uncertain, follow `failureFallback` in that type's contract or omit the scene.
