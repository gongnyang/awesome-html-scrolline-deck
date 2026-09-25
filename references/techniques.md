# Scene techniques

Twenty-four scene templates live in `templates/scenes/<technique>/`. Each one has four
source files — `scene.html`, `scene.css`, `scene.js`, `template.json` — plus a
`preview.webp` capture of a completed presentation frame. The metadata includes
`exampleCopy` so an author can inspect a real filled-in version before choosing it. Each reads
everything it shows from `ctx.data.scene`. Nothing is fetched, imported or
hard-coded inside a template, so the same folder works in any deck.

`scrolline add <technique> --id <NN-name>` copies the folder into
`src/scenes/<NN-name>/`, replaces the single `{{id}}` placeholder with the folder
name, and appends a scene entry to `data/deck.json`.

## Choosing one

| Job at hand | Technique |
|---|---|
| Open the talk on an image | `frame-scrub-hero` |
| Open the talk on a sentence | `word-relay` |
| Open with a question | `question-reveal` |
| Show the shape of the session | `agenda-path` or `kinetic-titles` |
| Mark a chapter boundary | `chapter-transition` |
| Show many images | `horizontal-gallery` |
| Take one thing apart | `anatomy-rows` |
| Show a process that moves | `frame-scrub-video` |
| Explain ordered actions | `step-flow` |
| Explain component relationships | `system-map` |
| Lay out milestones over time | `timeline-roadmap` |
| Show a route and its stops | `map-route` |
| Reveal a quantitative chart | `chart-reveal` or `annotated-chart` |
| Compare states | `before-after` or `option-matrix` |
| Show a source document | `document-proof` |
| Let the room breathe | `parallax-video` |
| Prove there is a body of work | `paper-assembly` |
| Land a number | `odometer-stats` |
| Show A becoming B | `wipe-transform` |
| Introduce a person | `tilt-card` |
| Hand the room a link | `closing-qr` |

Two rules for sequencing. Never place the same technique twice in a row. Put
`parallax-video` between two pinned scenes, never first and never last.

## The catalogue

### frame-scrub-hero — pinVh 260, pin true
An exported image sequence scrubs behind a standing title, then pushes past the
audience. A single `poster` also works as a cinematic still when no sequence is available.
**Assets:** `poster`; optionally `frames` (a `%03d` pattern), `count`, `critical`.
**Copy:** kicker, title, one or two lines. **Hold frame:** the film mid-sequence
with kicker, title, line and an optional date line all legible.
*EN — the opening image moves, the words do not.*
*KO — 오프닝은 그림이 움직이고 글자는 서 있다.*

### word-relay — pinVh 220, pin true
`copy.title` splits on an arrow (`→`, `->`, `/`, `|`), or on spaces when there is
no arrow. Each part crosses the stage and hands off to the next; the last one
stays and a centre wipe closes the scene. Two to five parts.
**Assets:** none. **Copy:** kicker, an arrowed title, up to three lines.
**Hold frame:** one word large in the centre, kicker above, lines below.
*EN — the promise of the talk, one word at a time.*
*KO — 오늘의 약속을 단어 하나씩 건넨다.*

### kinetic-titles — pinVh 240, pin true
Two to four numbered titles throw themselves onto a diagonal that a traced light
connects; an accent then walks block to block. Write a line as
`Title // bullet · bullet` to add bullets under a block.

> `scrolline add --lines` splits its own value on `|`, so a pipe never survives
> the round trip. Use the space-padded `//` form on the command line, or write
> the bullets straight into `deck.json`. A bare `|` still parses, for lines that
> were written by hand.
**Assets:** none. **Copy:** kicker, title, two to four lines.
**Hold frame:** every block in place, the diagonal fully drawn, one block accented.
*EN — the agenda as a route, not a list.*
*KO — 아젠다를 목록이 아니라 경로로 보여준다.*

### horizontal-gallery — pinVh 320, pin true
Three to ten full-bleed images pan sideways under a fixed caption and a running
counter. The pin turns vertical scroll into a sideways pan.
**Assets:** `images` (3–10). **Copy:** kicker, title, one line.
**Hold frame:** one image filling the frame, caption bottom-left, counter reading.
*EN — many images, one caption, one pace.*
*KO — 이미지는 여럿, 캡션은 하나, 속도도 하나.*

### anatomy-rows — pinVh 300, pin true
One artefact on the left, labelled rows on the right, each row drawing a
connector to a mark on the artefact. Rows come from `copy.lines` written as `Label: sentence`, or from `assets.rows`; `assets.marks` (`[[x, y], …]`, % of the image) puts each row's mark on a real feature of the picture
(`[{ label, value }]`) when a sentence contains a colon of its own.
**Assets:** `images` (exactly 1). **Copy:** kicker, title, two to four lines.
**Hold frame:** the artefact wiped in, every row open, every connector drawn,
one row accented.
*EN — take one thing apart in front of the room.*
*KO — 하나를 골라 사람들 앞에서 분해한다.*

### frame-scrub-video — pinVh 280, pin true
A clip exported as frames scrubs under the wheel while numbered lines land one
per beat. Use `scrolline frames <in.mp4>` to produce the sequence.
**Assets:** `frames`, `count`, `critical`, `poster`.
**Copy:** kicker, title, one to four lines.
**Hold frame:** the clip mid-motion with the first two lines already landed.
*EN — the wheel is the play head.*
*KO — 휠이 곧 재생 헤드다.*

### parallax-video — pinVh 130, **pin false**
The only unpinned technique. The section scrolls past a fixed muted clip while
the copy drifts at its own rate. It is a breath between two pinned scenes.
**Assets:** `video` plus `poster` (an image falls back in when reduced motion is
on or the video is missing). **Copy:** kicker, title, one line.
**Hold frame:** the clip full-bleed, the copy centred and mid-drift.
*EN — keep moving; this one is a breath.*
*KO — 멈추지 않는다. 이 장면은 숨 고르기다.*

### paper-assembly — pinVh 260, pin true
Three to eight pages fly in from off-stage, settle into a fan, then file away
together. Use it when the count of things is the argument.
**Assets:** `images` (3–8). **Copy:** kicker, title, one line.
**Hold frame:** the full fan, title above, line below.
*EN — the body of work, counted.*
*KO — 결과물의 양을 세어 보여준다.*

### odometer-stats — pinVh 220, pin true
Two to four figures spin up on odometer reels above their labels, on a single
drawn horizon. Write each line as `<number><suffix> <label>`.

A suffix has to be **attached** to the number; everything after the first space
is the label. So `2450vh of pin` sets `vh` beside the reels, while `12 scenes`
and `12 장면` set a bare count with a label underneath. Only the reel strip is
masked and clipped to 1.04em, so a Hangul or long suffix sets at 0.4em beside it
without losing its descenders.
**Assets:** none. **Copy:** kicker, title, two to four lines.
**Hold frame:** every reel stopped on its digit, every label up, the horizon lit.
*EN — a number that arrives instead of appearing.*
*KO — 숫자가 나타나는 게 아니라 도착한다.*

### wipe-transform — pinVh 300, pin true
One surface becomes the next under a diagonal wipe, with a numbered caption
swapping at each of three steps. `assets.images[0]` is the first surface,
`assets.video` (or `images[1]`) the second, the rest the third.
**Assets:** `images` (2–5), optional `video`, `poster`.
**Copy:** title and exactly three lines; no kicker.
**Hold frame:** the second surface fully wiped in, caption reading `02`.
*EN — show A becoming B without saying "next".*
*KO — "다음"이라는 말 없이 A가 B가 되는 것을 보여준다.*

### tilt-card — pinVh 200, pin true
A masked portrait holds one side of the frame while two to four hairline-ruled
lines read on the other, under a slow tilt. Set `assets.caption` for a credit.
**Assets:** `images` (exactly 1). **Copy:** kicker, title, two to four lines.
**Hold frame:** portrait in place, every line ruled and readable.
*EN — who is talking, and why they get to.*
*KO — 누가 말하고 있고, 왜 그 사람인지.*

### closing-qr — pinVh 200, pin true
Thanks set letter by letter beside a QR that draws itself, a typed URL, and a
link back to the first scene. `assets.images[0]` is the QR as an SVG
(`scrolline add closing-qr --url <site>` or `scrolline qr --url <site> --scene <id>`
generates and wires it); `images[1]` is an
optional mascot or portrait. Without an SVG the URL is simply printed.
**Copy:** kicker, title, one line (the URL; `deck.links.site` is the fallback).
**Hold frame:** thanks set, QR drawn, URL typed out, the restart link showing.
*EN — the frame the room photographs.*
*KO — 사람들이 사진 찍는 마지막 화면.*

### question-reveal — pinVh 240, pin true
An opening question takes the left side of the stage; up to four short answer
clues arrive in a separate evidence rail. Write each line as `Label: clue`.
**Assets:** none. **Copy:** kicker, a focused question as title, two to four
answer clues. **Hold frame:** question and all clues visible together.
**Responsive:** answer rail stacks below the question. **Reduced motion:** all
copy stays visible without entrance effects.

### agenda-path — pinVh 240, pin true
Two to four stops sit on a connected route so the audience sees where the talk
starts and where it leads. Write lines as `Stop: what happens here`.
**Assets:** none. **Copy:** kicker, title, two to four stops.
**Hold frame:** every stop is readable along the route.
**Responsive:** route becomes a two-column stop grid. **Reduced motion:** all
stops remain visible at once.

### chapter-transition — pinVh 240, pin true
A large chapter number and new section title create a clear visual threshold.
Use the kicker for a chapter label such as `02` or `2부`.
**Assets:** none. **Copy:** kicker, title. **Hold frame:** number and title share
the stage with generous negative space. **Responsive:** number moves above title.
**Reduced motion:** both remain composed as a static title card.

### chart-reveal — pinVh 240, pin true
Bars share a baseline and reveal in sequence. Write each line as
`Category: value`; labels retain the supplied value, and height scales against
the largest supplied value. Negative or missing values display as missing; no
value is invented or clamped.
**Assets:** none; chart marks are HTML. **Copy:** kicker, title, two to four
category-value lines. **Hold frame:** values and category labels are all visible.
**Responsive:** the chart keeps its labels and compresses bar spacing.
**Reduced motion:** bars show their final heights immediately.

### annotated-chart — pinVh 240, pin true
A line chart draws an explicitly supplied series and anchors one callout at
its peak. Put the interpretation in line one and the source in line two.
`assets.series` accepts 2–20 normalized values from 0 to 100; without valid
data, the scene displays an empty-state prompt instead of inventing a curve.
**Copy:** kicker, title, annotation, source. **Hold frame:** full curve and
callout are visible.
**Responsive:** callout moves toward the top of the plot.
**Reduced motion:** full curve and callout appear in place.

### before-after — pinVh 240, pin true
Two images of the same subject share equal space and use a wipe to reveal the
after state. Lines one and two label the two sides. **Assets:** two distinct
images of the same subject. A missing second image stays visibly empty rather
than repeating the first. **Copy:** kicker, title, two state labels.
**Hold frame:** both states are aligned and labeled.
**Responsive:** image panels stay side by side at compact proportions.
**Reduced motion:** both states are immediately visible.

### document-proof — pinVh 240, pin true
A paper-like exhibit presents a quoted passage beside its source credit.
**Assets:** one image of the source artifact; the quote and source are taken
from the first two lines. **Copy:** kicker, title, quote, source/citation.
Never fabricate a quotation: paraphrase explicitly when the original is not
available. **Hold frame:** the source image and quote are legible together.
**Responsive:** exhibit stacks above the source credit.
**Reduced motion:** complete static exhibit remains visible.

### step-flow — pinVh 240, pin true
Two to four connected cards explain actions in sequence. Write each line as
`Step: explanation`. **Assets:** none. **Copy:** kicker, title, two to four
steps. **Hold frame:** every numbered action is readable.
**Responsive:** cards stack along a vertical connector.
**Reduced motion:** all steps remain in the final layout.

### system-map — pinVh 240, pin true
A central subject is surrounded by two to four actors or components. The title
names the hub; lines name the surrounding nodes. **Assets:** none; diagram is
HTML/CSS. **Hold frame:** hub and nodes are visible as one system.
**Responsive:** nodes use a compact two-column arrangement.
**Reduced motion:** every node is visible immediately.

### timeline-roadmap — pinVh 240, pin true
Two to four dated events sit on a chronological rail. Write lines as
`Date: milestone: outcome`; use consistent date formats across the deck.
**Assets:** none. **Copy:** kicker, title, two to four events.
**Hold frame:** dates, milestones, and outcomes can be scanned together.
**Responsive:** events form a two-column grid.
**Reduced motion:** the complete timeline appears without drawing effects.

### map-route — pinVh 240, pin true
A stylized diagram map carries a route through up to three stops. Lines supply
stop names. The abstract grid is a visual aid, not geographic evidence; use
notes or a sourced map when locations must be accurate.
**Assets:** none; route is SVG. **Copy:** kicker, title, two or three stops.
**Hold frame:** route and all stops are visible.
**Responsive:** the route area shortens and stop labels compact.
**Reduced motion:** route and labels show in their final state.

### option-matrix — pinVh 240, pin true
A criteria-by-options matrix helps compare up to three choices. Lines one to
three name options; line four can supply criteria after `기준:`. Optional
`assets.matrix` can provide `options`, `criteria`, row-major `values`, and a
zero-based `recommendedIndex`. Empty values stay as em dashes, and no column is
recommended by default. **Assets:** none; matrix is HTML.
**Hold frame:** criteria and the highlighted recommended column are visible.
**Responsive:** cells tighten while preserving the row and column labels.
**Reduced motion:** all cells show at once.

## Asset rules

| Kind | Rule |
|---|---|
| Images | webp, longest edge ≤ 1600px, in `public/media/<scene-id>/` |
| Frame sequences | `scrolline frames`, ≤ 120 frames, ≤ 10MB total, `%03d` pattern, a `poster` always |
| Video | muted, `playsinline`, 720p, with a `poster` that works on its own |
| QR | generated by the CLI as SVG so it draws and scales |

Every scene that carries media also carries a `poster` or a first image that
reads on its own. A projector that refuses to decode your video should still
leave a composed frame on the wall.
