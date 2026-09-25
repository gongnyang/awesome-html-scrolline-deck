# Scene suitability ledger

This ledger routes a presentation scene by the relationship the audience must understand. It is not a quota and a listed type is not automatically the right choice. Start with the spoken claim, name the relationship, check whether the evidence can support it, then design a stable speaking hold.

## Review status

Every current catalog entry is marked **experimental (selection candidate)**. The earlier `production` labels overstated the available review: several previews point to temporary work, and the existing automated gates check implementation behavior rather than whether a room can read and understand the scene. The public gallery shows only candidates represented by a current, strictly verified deck scene and uses that scene's actual hold capture. Unrepresented mechanisms remain in the authoring catalog for deliberate adaptation. None should be described as independently approved until its representative rendered scene passes the criteria below.

Status meanings:

- **experimental** — implemented selection candidate; review the actual deck instance and do not treat the catalog preview as quality approval.
- **production** — permitted only after another reviewer checks the real presentation hold, the scroll's information change, the four viewport/motion conditions, and reverse navigation. Record a review artifact and date in `sceneContract.reviewNote`.
- **blocked** — implementation has a known defect that prevents responsible use. Do not recommend until the defect is fixed and reviewed.

## Route by relationship

| Audience needs to understand | Candidate types | Main evidence requirement |
|---|---|---|
| Question resolved by observations in a source image | `question-reveal`, `document-proof` | Directly inspectable image/document, exact observation or quote, locator and source |
| Parts and whole, or components and relationships | `anatomy-rows`, `system-map` | Identifiable target for each part; sourced relationship for each edge |
| Ordered cause, procedure, or argument | `step-flow`, `kinetic-titles`, `agenda-path`, `chapter-transition` | Each step advances the same argument; order and transition meaning are explicit |
| Dated events or planned milestones | `timeline-roadmap` | Verified dates; observed events distinguished from future plans |
| Places and travel order | `map-route` | Verified coordinates, credited base map, and supported route claims |
| Change across time or between matched states | `frame-scrub-hero`, `frame-scrub-video`, `before-after`, `wipe-transform` | Same subject and traceable states; dates/conditions where a comparison implies them |
| A sourced measure, trend, or event | `chart-reveal`, `annotated-chart`, `odometer-stats` | Exact values, units, period, denominator/definition, source, honest scale |
| Criteria-based decision between options | `option-matrix`, `colorway-reveal` | Explicit criteria and values; equivalence evidence for finish-only choices |
| Images whose sequence itself supports a claim | `horizontal-gallery`, `paper-assembly` | Related, ordered source images and a visible explanation of their relation |
| Relevant human testimony or concise phrase | `tilt-card`, `word-relay` | Consent/provenance and verbatim attribution for people; meaningful phrase context |
| Conclusion that asks for one next action | `closing-qr` | Stated conclusion, specific audience action, and QR matching the destination |
| Visual atmosphere without a data claim | `parallax-video` | Relevant sourced clip whose motion has a clear narrative role and a stable pause |

## Candidate register

The per-type contracts live beside runnable code in `templates/scenes/<type>/template.json`. They define fit, unfit, required inputs, scroll beat, stable hold, projector hierarchy, labels, mobile behavior, reduced-motion behavior, an example, and a concrete fallback. `relation` names the information relationship in a machine-readable form. `failureFallback` describes a lower-risk alternative when the necessary relation or evidence is unavailable.

| Type | Relationship | Status |
|---|---|---|
| `agenda-path` | Talk sequence | Experimental candidate |
| `anatomy-rows` | Part to whole | Experimental candidate |
| `annotated-chart` | Time series and event | Experimental candidate |
| `before-after` | Controlled change | Experimental candidate |
| `chapter-transition` | Argument sequence | Experimental candidate |
| `chart-reveal` | Magnitude comparison | Experimental candidate |
| `closing-qr` | Decision to action | Experimental candidate |
| `colorway-reveal` | Equivalent options | Experimental candidate |
| `document-proof` | Claim to source | Experimental candidate |
| `frame-scrub-hero` | Visual change over time | Experimental candidate |
| `frame-scrub-video` | Process over time | Experimental candidate |
| `horizontal-gallery` | Ordered visual evidence | Experimental candidate |
| `kinetic-titles` | Argument sequence | Experimental candidate |
| `map-route` | Spatial route | Experimental candidate |
| `odometer-stats` | Defined measures | Experimental candidate |
| `option-matrix` | Criteria-based decision | Experimental candidate |
| `paper-assembly` | Source collection | Experimental candidate |
| `parallax-video` | Visual context | Experimental candidate |
| `question-reveal` | Question to observation | Experimental candidate |
| `step-flow` | Causal sequence | Experimental candidate |
| `system-map` | Component relationships | Experimental candidate |
| `tilt-card` | Person to testimony | Experimental candidate |
| `timeline-roadmap` | Dated sequence | Experimental candidate |
| `wipe-transform` | State transformation | Experimental candidate |
| `word-relay` | Phrase transformation | Experimental candidate |

## Admission to production

Review a representative scene built with real content and its intended source assets, not only the isolated template fixture. Capture entry, each meaningful reveal, the final speaking hold, and exit at **1440×900**, **1920×1080**, **390px**, and `prefers-reduced-motion`. In a real browser, test wheel traversal, keyboard traversal, reverse scroll, and a stable pause. At the hold, the audience must see the claim and enough evidence to understand it; the presenter must have a natural pause; the scroll must reveal a meaningful change. A second reviewer should be able to state the claim after a five-second look and read the labels at projection size. Check Korean line breaks, image crop, source visibility, chart units, and connector endpoints. Fix any failure and repeat the review before changing status.

Automated build and interaction gates are necessary implementation checks, not visual approval. Record the reviewer, date, tested example path, viewport states, and any remaining limit in `sceneContract.reviewNote`. Do not infer approval from a passing self-test or a `preview.webp` existing.

## Failure axes

- **Semantic mismatch:** choose a scene whose relationship matches the claim, or use a simpler static composition.
- **Evidence mismatch:** request valid evidence or narrow the claim; never invent a chart, map, quotation, or connecting edge.
- **Hold mismatch:** keep the claim and relevant proof visible together when scrolling stops.
- **Hierarchy or legibility mismatch:** reduce competing detail, enlarge the claim and labels, and verify the rendered projector view.
- **Asset mismatch:** replace or recrop the asset and check its focal subject; do not substitute unrelated imagery.
- **Viewport or motion mismatch:** preserve the same reading order and complete information on mobile and reduced-motion settings.
- **Connector mismatch:** remove decorative lines when endpoints or relationships cannot remain exact; use adjacent labels, numbering, or grouped placement.

### `before-after` mobile review note

The v2 `market-returnables` trial exposed a visual failure that passed automated geometry checks: on a 390px stacked comparison, labels sat over busy illustration details and the partial after-image left a large blank region. The template now gives each label a canvas-tinted backing and shows both complete states in the stacked mobile layout. The trial was regenerated from this template and visually rechecked; the type remains an experimental candidate until other subjects and image crops are reviewed.
