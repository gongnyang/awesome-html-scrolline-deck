# Turning a deck into video

Use this only when the presenter also needs a video. Keep the deck's claim,
evidence, source and fictional-case labels intact. A frame capture is a visual
source, not permission to present simulated facts as observed footage.

| Format | Story method | Typical output |
|---|---|---|
| Promotional short | Hook → fast examples → one clear action; reframe several decks into a vertical montage. | 9:16, under 60 seconds |
| Real-case story | Source-backed before → action → outcome → limit; use dated facts and cite them on screen. | 16:9 or 9:16, about 45–90 seconds |
| Education | Question → one-sentence claim → visual evidence → interpretation → recap; leave reading time on diagrams. | 16:9, about 1–3 minutes |

1. Pick completed `qa/<scene>-55.jpg` frames for the claims and `-30`/`-85`
   only where the transition itself teaches something. Verify they belong to
   the latest `data/deck.json` and rerun `scrolline verify --strict --build` if
   the deck changed.
2. Write a timecoded storyboard with the voice line, screen caption, image,
   source and duration for every beat. Keep captions usable with the sound off.
3. For vertical crops, retain the whole evidence region or recompose the scene
   into a vertical card. Never crop a chart's axes or a claim's qualifier.
4. Add restrained pans, zooms and short dissolves. Hold diagrams and sources
   long enough to read. Use animation to reveal relationships, not decorate a
   static claim.
5. Distinguish AI visual reconstructions from historical photos in the video
   itself. Put source credit next to the relevant factual claim and provide
   direct links with the published video. Avoid unverified numerical outcomes.
6. Export H.264 MP4 with readable Korean captions. Decode the entire video,
   inspect representative frames, listen through the audio, and verify duration,
   aspect ratio, text-safe area and source attribution.

The three delivered demonstrations for this repository use different methods:
a montage of the eight deck captures, a sourced Cheonggyecheon restoration
story with labeled AI reconstruction images, and a question–claim–evidence
lesson drawn from the scrollytelling lecture.
