# Scrolline films

The three films are rebuilt from the current deck media and QA captures. Run
`node videos/build.mjs` from the repository root after installing the repository
dependencies and FFmpeg. The build writes MP4, poster JPG, Korean SRT/VTT captions,
and a duration report under this directory.

| File | Purpose | Runtime | Edit rhythm |
| --- | --- | ---: | --- |
| `01-promo-shorts.mp4` | Vertical collection trailer | 19.5 s | Eight fast, distinct deck beats with short dissolves |
| `02-real-case-cheonggyecheon.mp4` | Source-led restoration case | 59.7 s | Seven slower beats: before, timeline, after, scope, study, limits, sources |
| `03-education-scene-design.mp4` | Short lesson on visual storytelling | 68.6 s | Sixteen beats, with quick entrance/progress/exit examples and longer reading holds |

The music is synthesized in the build from FFmpeg oscillators; there is no recorded
narration. Captions carry the spoken-line copy and are included as default Korean
tracks in the gallery player.

## Evidence and image labels

The Seoul Metropolitan Government lists the construction period as July 2003 to
September 2005, the official restoration date as October 1, 2005, a 5.84 km restored
section, and KRW 386.739 billion in cost (as of 2005) on its [project page](https://english.seoul.go.kr/service/amusement/stream/1-cheonggyecheon/).
The measured 1.1–1.4°C mean air-temperature decrease and 6.6–8.7% relative-humidity
increase are from Kim, Lee, and Yoon (2015), *Impact Assessment on the Change of
Thermal Environment, According to the Hydraulic Characteristic Urban Regeneration
Stream: Cheonggyecheon Case Study*, *Journal of Environmental Policy* 14(2), 3–25,
[DOI 10.17330/joep.14.2.201506.3](https://doi.org/10.17330/joep.14.2.201506.3).
Those measurements describe the study sites and conditions; the film does not
present them as a citywide effect.

`assets/cheonggyecheon-before-ai.jpg` and `assets/cheonggyecheon-after-ai.jpg` are
AI reconstructions for visual explanation. They are labeled in the film as
reconstructions, not archive photographs or project evidence. Product, investor,
annual-report, client-proposal, and spatial-proposal visuals in the promo are
fictional concept or sample-deck material, labeled accordingly.
