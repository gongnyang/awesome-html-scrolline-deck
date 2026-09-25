# Scrollytelling workflow

## Frame the talk

Capture the audience, purpose, duration, one-sentence thesis, available evidence, visual constraints, venue/screen, and intended audience action or question. If a missing detail would not change the story, make a sensible default. Never invent a factual claim or number. Mark illustrative material clearly.

Plan spoken beats, not a slide count. A beat is one idea that the presenter can explain while the audience studies a composed visual state. The number and length of beats come from the argument and rehearsal, not a fixed template quota.

## Storyboard each scroll

Create one row for each narrative beat:

`id | spoken claim | audience relationship | evidence/status/source | presenter action | new information on scroll | stable cue | hand-off | speaker note`

For every row:

1. State what question this beat answers or raises, and how it advances the thesis.
2. Describe the entering frame. When it follows another scene, carry one visual or conceptual element forward where that helps the audience connect the ideas.
3. Name the scroll action and its information consequence: reveal a feature, move closer, expose a layer, trace a route, change scale, align two states, or bring labels into view. If the text and image would communicate identically without scrolling, the scene needs a different visual idea.
4. Define each composed keyboard cue: the spoken claim and the evidence stay visible while the presenter talks. A cue is a meaningful complete state, not an arbitrary percentage.
5. Describe the exit or hand-off. A scene transition should resolve or deliberately change the visual story rather than simply uncover the next card.
6. Include spoken notes, source attribution, and caveats. Notes supplement the screen; they do not carry required audience information.

The hold is a stable visual state controlled by the presenter. It may be a single key frame in a scrubbed film, a settled diagram, or a completed reveal. It is not empty space in a timeline, and the audience must not need to keep scrolling while the presenter speaks.

## Route the visual form

Use the scene suitability contract and failure register in [scene-ledger.md](scene-ledger.md) before selecting a template. Match the relationship in the content to the visual grammar: spatial parts need a spatial image, change needs aligned states, order needs a route or trace, and measured evidence needs a truthful chart.

Images carry place, material, scale, people, and visible change. Use original or sourced images wherever they carry more information than generic decoration. Use HTML/SVG for exact values, annotation, labels, routes, and comparisons. Keep precise information editable and accessible. Do not put charts, words, logos, or fake data into generated image pixels.

Design one dominant focal point per scene. The typography should identify the claim first, then provide concise labels, values, source, or caveat. Remove copy or move it to a later beat when it weakens the focal point. A grid of rounded text cards is not a default scene grammar.

Make the main claim, meaningful image, or decisive value visible at headline scale within the first second of the first one or two scenes. Treat this as the opening hook; decorative movement must not delay it.

Treat existing scene templates as mechanisms, not mandated layouts. If no supported type fits the relationship, document the gap in the ledger and create an intentional bespoke scene only if it meets the same contract. Do not publish an unreviewed experimental type as production-ready.

## Pace the scroll

Scroll progress changes the visual state and controls the release of information; it does not autoplay the argument. Motion is justified when it reveals order, cause, detail, comparison, or a change of scale/focus. Do not use “boxes appear one after another” as a default beat: name the evidence or relationship that becomes understandable at each point. The first one or two scenes establish a strong hook; later scenes alternate purposeful reveals, calm holds, and brief transitions.

Choose `pace.mode` after the speaking beat is written:

| Presentation job | Mode | Decision |
|---|---|---|
| A short transition or already understood question | `pass` | No pin; merge with a neighboring beat if it adds no new claim or useful tension. |
| An audience question, argument, or evidence the speaker must discuss | `hold` | Pin a complete, stable composition; choose scroll length by rehearsal, not word count. |
| A comparison, process, route, or object whose changing state explains the claim | `scrub` | Use 2–4 meaningful cue states and enough travel to control them without skipping. |

The engine supplies a normalized timeline from 0 to 1. It does not force an entrance/exit fade; a pinned canvas must keep its claim or evidence visible through the last part of its pin. Continuous frame scrubbing is reserved for a visual transformation that can be interpreted at each key frame. An effect must never conceal the claim while the presenter speaks.

Choose `pace.scrollVh` according to the number of information changes and the precision required to operate them. `pass` uses 0; `hold` and `scrub` use positive distance. There is no empirically established universal distance, timing, font scale, or number of scenes. Do not depend on an exact wheel notch, continuous scroll, autoplay, hover, or color alone to communicate meaning.

## Build and revise

1. Choose a coherent deck style: display and reading type, palette, image treatment, density, and a motif that can evolve with the story. Style sets express a visual identity and contrast/scale intent, not a fixed layout for every scene.
2. Finish the storyboard, evidence list, and image plan. Prepare the intended desktop and narrow-screen crops before tuning type around them. At 390px, explicitly inspect the media element width and verify its entire crop and caption remain visible; horizontal-overflow checks can pass while a flex-shrunk image is still too narrow or its contents are clipped.
3. Scaffold with `node scripts/cli.mjs init <dir> --title <title>` and add suitable scene modules with `node scripts/cli.mjs add <technique> --dir <dir> --id <NN-name>`. Populate the schemaVersion 2 storyboard fields in `data/deck.json`. Adapt a module or write a bespoke one when the relationship cannot be expressed by the chosen template. Reject a template whose line geometry, image landmarks, or data contract cannot be made faithful.
4. Inspect the hold state and transitions at presentation distance. Rehearse the whole deck with the actual wheel or keyboard. Ensure the presenter can pause, continue, reverse a reveal, and recover from an overscroll.
5. Run static checks and strict browser verification. Inspect entrance, speaker hold, and exit at projector size, then the full scene at approximately 390px and in reduced motion. Review every capture before marking a type production-ready. A passing automated report does not override a visual failure: record the exact viewport/state and collision, crop, hierarchy, or legibility issue; fix the scene data, asset, or scoped layout at its source; regenerate affected captures; and rerun strict verification on the final source. If the defect remains, mark the scene/type unapproved and provide a usable fallback instead of treating a pass count as visual approval. Use [quality.md](quality.md) for rejection criteria and [scene-ledger.md](scene-ledger.md) for type support status.

The generated deck includes its own engine. The module interface is specified in [contract.md](contract.md).

## Design basis

Claim-and-evidence framing is a useful way to keep a spoken beat focused. Research on Assertion-Evidence presentations reported benefits in a technical-teaching setting; that finding does not establish a universal layout and does not require every scrollytelling scene to resemble a slide. ScrollyVis research discusses guided narratives combining media and specialized visuals. Neither source establishes an optimal scene count, scroll distance, typography scale, or motion schedule.
