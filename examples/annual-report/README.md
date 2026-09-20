# Annual report deck — 「2026 연간 성과 보고」

A six-scene deck for a fictional company's annual results, in Korean. It is the
infographic-heavy counterpart to `examples/sample-deck/`: where that one is a
typographic deck about the tool, this one is a room full of charts — a quarterly
bar-and-line chart taken apart on stage, six report pages that assemble into a
fan, and two structure diagrams that wipe into each other.

Everything under `public/media/` is drawn by the scripts in `tools/`. No
photography, no video, no web fonts, no network at build or at run time.

**All figures are sample data for a company that does not exist.** 「밀물
주식회사」 is invented for this example, and every number, quote and location in
the deck is made up. The disclaimer is printed on every generated plate
(`예시용 가상 데이터`), stated in the opening and closing speaker notes, and
carried in scene 01's second line.

## Look

A different ladder from the default scaffold: a deep forest-ink canvas with
amber and mint accents, and a serif (명조) display face against a sans body.
All of it lives in `src/tokens.css`; no scene file names a colour.

| token | value | used for |
|---|---|---|
| `--canvas` | `#061210` | page, scrims, plate backgrounds |
| `--accent-1` | `#4fd1a5` mint | progress bar, 2026 bars, focus |
| `--accent-2` | `#edb04a` amber | kickers, the odometer horizon, margin line |
| `--accent-3` | `#e08744` ember | anatomy connectors, step numbers |
| `--font-display` | Noto Serif KR → Georgia | every title and figure |
| `--font-body` | Pretendard → Noto Sans CJK KR | lines, labels, captions |

## Storyboard

| # | id | technique | kicker | title | asset | pinVh |
|---|---|---|---|---|---|---|
| 1 | `01-open` | `word-relay` | 2026 연간 성과 보고 | 규모를 줄여 → 이익을 남겼다 | — | 220 |
| 2 | `02-anatomy` | `anatomy-rows` | 분기 실적 | 여덟 분기를 한 장으로 | `02-anatomy/quarters.webp` | 300 |
| 3 | `03-numbers` | `odometer-stats` | 핵심 지표 | 네 숫자로 본 한 해 | — | 220 |
| 4 | `04-stack` | `paper-assembly` | 부문별 보고 | 여섯 장의 부속 보고서 | `04-stack/page-01…06.webp` | 260 |
| 5 | `05-shift` | `wipe-transform` | — | 사업 구조가 바뀌었다 | `05-shift/plate-2025 · 2026 · delta.webp` | 300 |
| 6 | `06-close` | `closing-qr` | 자료 받기 | 감사합니다 | `06-close/qr.svg` | 200 |

Total pin distance 1500vh, about nine minutes spoken. Every `pinVh` is the
default its technique ships with.

## How the infographics are made

`tools/` holds the whole pipeline. Each script writes its SVG source to
`tools/svg/` and bakes the same drawing to webp with sharp:

```bash
# sharp is not a dependency of the deck; point NODE_PATH at an install that has it
NODE_PATH=/path/to/node_modules node tools/make-all.mjs
node tools/wire-assets.mjs            # registers the files in data/deck.json
```

| script | output | what it draws |
|---|---|---|
| `tools/make-anatomy-chart.mjs` | `quarters.webp` 1100×1600 | eight quarters of revenue as bars, operating margin as a line, a fiscal-year divider and a three-figure footer |
| `tools/make-report-pages.mjs` | six 1280×720 pages | donut (revenue mix), table (quarterly P&L), timeline, dot map (regional hubs), pull quote, retention line chart |
| `tools/make-shift-plates.mjs` | three plates | 2025 single-channel chain, 2026 three-branch diagram, and a 720×1040 summary card |

`tools/data.mjs` is the single source of every figure: the deck copy, the chart
and the summary card all read the same numbers, so 1,482억 / 11.9% / 52% agree
wherever they appear. `tools/lib.mjs` mirrors the palette from `src/tokens.css`
and holds the SVG helpers.

Two things the generators do on purpose:

- **They leave room for the scene.** `quarters.webp` is portrait because
  `anatomy-rows` crops it into a 44vw column; the two full-bleed plates keep
  their lower-left corner and their right third empty because the caption, the
  title and the rising summary card land there.
- **They print their own anchors.** `make-anatomy-chart.mjs` ends by printing
  the four feature points as percentages. Those are the `--ax` / `--ay` values in
  `02-anatomy/scene.css`, so a mark sits on the bar it talks about.

`tools/build-deck.sh <empty-dir>` replays the `init` → `add` ×6 CLI sequence that
scaffolded the deck. It refuses to write into this folder, because the committed
deck carries hand edits on top of the scaffold.

## Run it

```bash
npm install
npm run dev                  # http://localhost:5173
npm run build && npm run preview
```

## Gate it

```bash
node ../../scripts/cli.mjs check .     # 6/6, no browser
node ../../scripts/cli.mjs verify .    # 12/12, wheel-driven, writes qa/<id>-{30,55,85}.jpg
node ../../scripts/cli.mjs storyboard .
```

`qa/` is tracked here on purpose: the captures are the evidence that each scene
enters, holds and exits the way the storyboard says.

## Scene edits, and why

The templates were not enough on their own in five places. Each edit is
commented where it lives.

| where | edit |
|---|---|
| `02-anatomy/scene.css` | mark positions moved onto the chart's own features. The template writes `--ax`/`--ay` as inline style, so the override needs `!important`. |
| `03-numbers/scene.css` | reel type scaled down. At the template's `clamp(72px,13vw,180px)` a four-digit figure like 1482 is clipped by the reel mask in a four-column row. |
| `04-stack/scene.js` | the fan re-centred. The hold tween sets `xPercent`/`yPercent`, which replaces the `-50/-50` that GSAP read from the CSS centring, so the fan drifts to the lower right; the fix adds `-50` back and spreads six pages wider. |
| `05-shift/scene.js` | caption numbers written through `tl.call` with a restore call in front of each swap. `tl.set(num, { textContent: '02' })` renders `2`, because GSAP parses the string as a number. |
| `05-shift/scene.css`, `scene.js` | full-bleed plates keep a paint-invalidating tween running. With a static layer the two 1440×900 plates were not rasterised at all between roughly 15% and 45% of the pin — the caption drew, the plates did not, in both headless and headed Chromium here. Animating the canvas veil (`--dim`) across the scene keeps them painted; the entrance blur was dropped for the same reason. |

## 요약

가상의 회사 「밀물 주식회사」의 2026년 결산을 스크롤 여섯 장면으로 읽는 덱이다.
숲빛 캔버스에 앰버·민트, 제목은 명조. 분기 차트 한 장을 무대에서 분해하고(02),
숫자 넷을 릴로 세우고(03), 부속 보고서 여섯 장을 부채꼴로 모으고(04), 2025와
2026의 구조도를 와이프로 겹친다(05).

**수치는 전부 예시용 가상 데이터다.** 회사도 숫자도 인용도 실재하지 않는다.

그림은 전부 `tools/` 의 스크립트가 SVG로 그려 sharp로 굽는다. 숫자는
`tools/data.mjs` 한 곳에서 나오므로 카피와 차트가 어긋나지 않는다.
