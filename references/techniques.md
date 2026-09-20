# Scene techniques

Twelve scene templates live in `templates/scenes/<technique>/`. Each one is four
files — `scene.html`, `scene.css`, `scene.js`, `template.json` — and each reads
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
| Show the shape of the session | `kinetic-titles` |
| Show many images | `horizontal-gallery` |
| Take one thing apart | `anatomy-rows` |
| Show a process that moves | `frame-scrub-video` |
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
audience. **Assets:** `frames` (a `%03d` pattern), `count`, `critical`, `poster`.
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
connector to a mark on the artefact. Rows come from `copy.lines` written as `Label: sentence`, or from `assets.rows`
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
(`scrolline add closing-qr --url <site>` generates it); `images[1]` is an
optional mascot or portrait. Without an SVG the URL is simply printed.
**Copy:** kicker, title, one line (the URL; `deck.links.site` is the fallback).
**Hold frame:** thanks set, QR drawn, URL typed out, the restart link showing.
*EN — the frame the room photographs.*
*KO — 사람들이 사진 찍는 마지막 화면.*

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
