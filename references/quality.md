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

Static checks cover the scene module/timeline contract, scoped and token-driven CSS, schema, local asset references, and complete frame sequences. Strict browser verification covers actual wheel traversal, pinned scene geometry, keyboard landing, rendered captures, console/page errors, horizontal overflow, reduced motion, local media decoding, visible media in image-led holds, and text contrast. A skipped browser check is a failed strict run.

These gates establish that the engine runs and the important content is present. They do not establish that the visual design is good. Do not treat a successful build or a generated report as visual approval.

## Human visual review

For every scene inspect the entrance, a middle hold, and the exit at a typical projector viewport, then review the full sequence at approximately 390px wide and in reduced-motion mode. Use the generated 30/55/85 captures as sample points; they are evidence to inspect, not three magic quality thresholds. Reject the scene if the claim or proof is clipped, unreadable, or disconnected in any view. At the narrow viewport, verify the media container uses the available width; check image crops, captions, labels, and sources for horizontal cropping or clipping caused by flex/grid shrink. A passing no-overflow gate does not prove that the image or its caption is fully visible.

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
