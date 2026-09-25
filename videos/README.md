# Scrolline films

The build creates three films with different visual grammars from the current
deck media and QA captures. Run `node videos/build.mjs` from the repository root
after installing repository dependencies and FFmpeg. Set `SCROLLINE_FILM` to a
film slug to rebuild just that film.

| Film | Format | Runtime | Visual approach |
| --- | --- | ---: | --- |
| `01-promo-shorts.mp4` | 9:16, 1080×1920 | 19.5 s | Full-bleed opening imagery, then four deck examples rebuilt as large, readable value relationships with explicit fictional/synthetic labels |
| `02-real-case-cheonggyecheon.mp4` | 16:9, 1920×1080 | 59.7 s | AI-reconstruction opening, chronological restoration timeline, typographic project scale, measured study result, limits and readable sources |
| `03-education-scene-design.mp4` | 16:9, 1920×1080 | 76.6 s | Actual sample-deck QA captures, including the 30% entry, 55% presentation hold and 85% exit states, with lessons on claim, relationship, evidence and accessibility |

Each MP4 has a same-name poster JPG and Korean SRT/VTT captions. The build also
extracts one review frame per beat to `videos/.qa-inspect/<film-slug>/`; inspect
those images before sharing the films. The music is synthesized from FFmpeg
oscillators. There is no recorded narration; the captions carry the full
spoken-line copy and the gallery player loads the Korean VTT track. The promo's
four data-led previews use values from their decks: quarterly revenue (fictional),
an assumed market share, synthetic shade observations, and a fictional pilot
scope. They use large type instead of miniature screenshots so the information
stays legible in the vertical format.

## Sources and limits

The Seoul Metropolitan Government's [Cheonggyecheon Restoration Project page](https://english.seoul.go.kr/service/amusement/stream/1-cheonggyecheon/)
states July 2003 to September 2005, a 5.84 km restored section and a cost of KRW
386.739 billion as of 2005. The City's [official history page](https://english.seoul.go.kr/seoul-views/meaning-of-seoul/1-history/)
gives the official restoration date as October 1, 2005.

The 1.1–1.4°C mean air-temperature decrease and 6.6–8.7% relative-humidity
increase are reported in Kim, Lee, and Yoon (2015), *Impact Assessment on the
Change of Thermal Environment, According to the Hydraulic Characteristic Urban
Regeneration Stream: Cheonggyecheon Case Study*, *Journal of Environmental
Policy* 14(2), 3–25, [KCI record and DOI 10.17330/joep.14.2.201506.3](https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART002009075).
The film labels these as measurements at the study sites and does not state them
as a citywide effect.

`assets/cheonggyecheon-before-ai.jpg` and `assets/cheonggyecheon-after-ai.jpg`
are labeled in-frame as AI reconstructions, not archive photos or evidence of
the project. The promo's product, investor, annual-report, spatial-proposal,
city-guide, research, client-proposal and sample-deck visuals are concept or
sample material, with their fictional status shown in-frame.
