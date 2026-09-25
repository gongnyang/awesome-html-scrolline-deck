# Presentation quality and release checks

The quality question is whether a speaker can use the visual sequence to explain an idea to a room. A page of stacked mini-slides may technically scroll and still fail. Review content order, focal hierarchy, stable holds, and operation from the back of the room.

## Acceptance contract

Reject a scene or deck if any condition below fails:

- **The scroll communicates something.** A scroll step changes the information state or helps the audience follow a relationship. Scrolling through a static poster, or using wheel input only to swap card-like panels, is not enough.
- **The opening earns attention immediately.** In the first one or two scenes, the main claim, meaningful image, or decisive value reaches headline scale within the first second. A decorative buildup that delays the point fails.
- **Each reveal has a reason.** A box appearing because the timeline advanced is not a sufficient scroll beat. The reveal must expose a real change, comparison, cause, location, or piece of evidence, and its labels must stay attached to that evidence.
- **One thing leads.** The first glance lands on the intended subject or claim. Secondary copy, labels, credits, and controls visibly recede. Do not give the headline, an oversized statistic, and a decorative graphic equal weight at once.
- **Type is hierarchic and projector-readable.** The claim is clearly larger and heavier than supporting text. Labels are shorter, quieter, and attached to the evidence they explain. Source and caveat remain readable. Do not use a tiny mono kicker, micro-label, or dense caption to carry a claim. The author chooses responsive sizes according to content, venue, and language; this contract sets roles and visibility rather than a universal pixel scale.
- **The hold supports speech.** At the keyboard landing point and during a stopped scroll, the whole spoken claim and its evidence are simultaneously visible. The hold does not hide information behind timed motion, active state, hover, or a still-running animation.
- **The evidence is faithful.** Values, quotations, map geometry, comparison states, labels, and generated imagery are not invented or distorted. Data views show supplied values and meaningful scale, including units, source, and relevant caveat.
- **Every audience can follow.** At compact width the scene retains its claim and relationships in a deliberate reading order. Under reduced motion it presents the same essential evidence in a composed static state. Keyboard progression and visible focus work.

## Automated gates

Run `node scripts/cli.mjs check <dir>` and `node scripts/cli.mjs verify <dir> --strict --build`.

Static checks cover the scene module/timeline contract, scoped and token-driven CSS, schema, local asset references, and complete frame sequences. Strict browser verification covers actual wheel traversal, pinned scene geometry, cue landing, key repeat and reverse recovery, large wheel input, 1440×900 and 1920×1080 rendered captures through 96%/99% exits, console/page errors, horizontal overflow, reduced motion, local media decoding, visible media in image-led holds, and text contrast. At the mobile and projector holds it also rejects Korean labels collapsed into narrow columns and strongly overlapping text boxes. A skipped browser check is a failed strict run.

At 85% of a pinned image scene, verification also requires a decoded image, canvas, or video still visible after ancestor opacity is applied. At 85/96/99% of a pass scene, either that scene or the next must contribute visible content. These checks catch blank hand-offs but still cannot judge whether the pictured evidence is relevant.

These gates establish that the engine runs and the important content is present. They do not establish that the visual design is good. Do not treat a successful build or a generated report as visual approval.

## Charts, tables, and precise diagrams

Choose the representation from the audience's question before choosing a charting library. Use bars for magnitude against a meaningful zero, a line for ordered change, aligned states for before/after, and a table when exact lookup matters more than shape. If the source only supports a qualitative statement, show that statement and its real evidence rather than inventing points to draw a curve. A measured value, a fictional scenario, and a design target must have different labels on the same screen as the figure.

[Observable Plot](https://observablehq.com/plot/features/marks) is the default candidate for conventional sourced charts because its marks, scales, axes, and labels can be composed from explicit values. Use bespoke SVG or D3 only when a scroll beat genuinely changes the encoded relationship; keep the data and labels inspectable in HTML/SVG. The library does not decide the axis, baseline, denominator, unit, period, or source. Verify rendered labels and lengths against the input values, and read the figure aloud once without speaker notes.

For a table, align every number by its decimal or right edge, align text to a consistent left edge, state units in the header, and emphasize the row that answers the decision question. Avoid equal-weight cells and tiny dense footnotes. On mobile, preserve each row's label/value relationship with a stacked reading order rather than shrinking the whole table.

Treat infographic geometry as part of the evidence. First name the relation: a sequence needs an ordered path; a comparison needs a shared baseline; a process needs input and output; a system needs explicit edges; a decision needs aligned criteria. A decorated list is not a substitute for any of these. The [BookForge diagram contract](https://github.com/gongnyang/bookforge/blob/main/references/diagrams.md) separates diagram types by information task and rejects crossing or unattached connectors. Apply that principle to the rendered deck: every connector must have identifiable endpoints, remain attached at each viewport, avoid passing through unrelated content, and leave enough space for its label. If an edge does not survive mobile reflow, remove the edge and use proximity, numbering, or a separate detail scene.

Budget complexity for a projected **hold**, not for a static export. If a relation requires so many nodes, arrows, series, or labels that the presenter must shrink type or the audience must scan the whole screen to find the claim, divide the relation into a legible overview and a focused follow-up. Repeated equal-size cards are justified only when the audience really compares equally weighted items on the same criteria. Check each label's real bounding box and line break after rendering; never let a title, connector, or value force Korean text into one- or two-character columns. Numeric graphics must be reconstructible from the deck's supplied values, and the same screen must say whether the data are measured, synthetic, or a target.

## Human visual review

For every scene inspect the entrance, each declared cue, and 96%/99% exit at 1440×900 and 1920×1080, then review the full sequence at approximately 390px wide and in reduced-motion mode. The generated 30/55/85/96/99 captures are sample points, not magic quality thresholds. Reject the scene if the claim or proof is clipped, unreadable, or disconnected in any view. At the narrow viewport, verify the media container uses the available width; check image crops, captions, labels, and sources for horizontal cropping or clipping caused by flex/grid shrink. A passing no-overflow gate does not prove that the image or its caption is fully visible.

At projector size ask:

1. Can a viewer at the back of the room name the subject or claim without reading the speaker notes?
2. Is the dominant image or diagram large enough to make its intended detail visible?
3. Can the audience distinguish headline, explanatory label, value, and source by size and placement without relying on color alone?
4. Does each scroll change reveal or focus evidence in a way that the presenter can narrate? Does the scene settle before a spoken explanation needs it?
5. Can the presenter pause naturally, resume, and recover from moving too far?

Reject broken crops, stretched or reused assets without reason, text on busy imagery without a legibility treatment, clipped labels, false scale, unreadable sources, empty holds, card grids used without semantic reason, transitions that obscure a claim, or motion that makes the speaker compete with the screen.

Measure contrast on the actual image frame and its text overlay. WCAG 2.2 contrast guidance uses 4.5:1 for normal text and 3:1 for large text. These are contrast checks, not a replacement for judging size and legibility at the back of the room. Confirm meaningful images have useful text alternatives and decorative images are hidden from assistive technology.

## Responsive and motion review

At a narrow viewport, check the scene's focal point, wrapping, label-to-target association, and evidence order. Keep names/labels adjacent to the thing they describe. A smaller version of a desktop canvas is not an acceptable mobile adaptation when the type or relations become hard to read.

Under reduced motion, show all essential evidence immediately or provide an equivalent deliberate sequence without motion. Remove scrub, parallax, and large transitions. Do not allow the engine's no-pin mode to strand the speaker's claim below several screens of decorative content.

## Publish and rehearsal

After all checks pass, review the actual deployed URL at its subpath. Confirm the first and last scenes, every local asset, keyboard navigation, notes, fullscreen, and mobile/reduced-motion behavior. Rehearse on the presentation machine and leave a static hold-frame backup. Check the real display's aspect ratio and browser zoom; the deck is designed for the room where it will be used.
