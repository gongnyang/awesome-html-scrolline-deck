---
name: scrolline-deck
description: 발표 주제·개요를 스크롤 구동 시네마 HTML 덱(스크롤텔링 덱)으로 만든다. 슬라이드 컷이 아니라 휠 한 칸 = 장면 진행률 — 장면 12기법·진입/홀드/퇴장 3박자·게이트 10종·발표자 키 바인딩까지 포함. Vite+GSAP ScrollTrigger+Lenis 프로젝트를 생성하고 휠 기반으로 실측 검증한다. 트리거 — "스크롤텔링 덱", "스크롤 발표", "스크롤 덱 만들어", "시네마 덱", "스크롤로 넘어가는 발표자료", "scrolline", "scrolline deck", "scrollytelling deck", "scroll-driven presentation", "scroll deck", "cinematic html presentation". 후속 — "이 장면만 기법 바꿔", "홀드 더 길게", "카피만 다시", "검증만 다시", "발표용으로 빌드" 도 이 스킬. ※ 이산 슬라이드·발표자 노트 중심이면 slideshow 스킬, 영상 렌더(MP4)면 hyperframes 소관.
---

# scrolline-deck — 스크롤텔링 덱

개요 한 장 → **스크롤 구동 시네마 HTML 덱**. 슬라이드를 넘기는 게 아니라 **휠 한 칸이 장면의 진행률**이고, 장면마다 진입·홀드·퇴장이 완결된다. 엔진 = Vite + GSAP ScrollTrigger(pin/scrub) + Lenis, 산출물 = 로컬에서 도는 정적 HTML(배포는 범위 밖).

## 원칙 (코드가 강제 — 어기면 게이트에서 막힌다)

1. **3박자 완결** — 모든 장면은 진입 0–.30 / 홀드 .30–.75 / 퇴장 .75–1. 홀드 구간에 완성 프레임이 서 있어야 발표자가 말할 시간이 생긴다.
2. **타임라인 합 ≤ 1** — `build(tl, ctx)` 안 모든 tween의 `position + duration`이 1을 넘지 않는다(G2). `pinVh`를 나중에 바꿔도 비율이 유지된다.
3. **토큰만** — `scene.css`에 hex·rgb()·색이름 0건, 선택자는 전부 `[data-scene="<id>"]` 접두(L1·L2). 색은 `src/tokens.css` 변수로만.
4. **tween 문자열 안 `var()` 금지** — `clip-path: inset(var(--x))` 류는 GSAP이 보간하지 못하고 스냅한다(G3). 숫자로 풀어 쓴다.
5. **박스 금지** — 카드·테두리·그림자 패널로 정보를 가두지 않는다. 화면 전체가 한 장면이다.
6. **휠로 검증** — 검증 경로와 장면 코드에 `window.scrollTo`·`scrollIntoView` 금지(G4). 실제 휠 이벤트로 굴려서 재본다.
7. **키 착지 35%** — `→` 키는 다음 장면의 핀 구간 35% 지점에 내린다. 착지 화면이 곧 그 장면의 대표 컷이다.

## 저작 워크플로 (이 순서대로)

**1 인테이크** — 주제·청중·발표 길이(분)·다크/라이트·보유 에셋을 묻는다. 장면 수 = 분 ÷ 1.5, 5–12장 범위. 총 `pinVh`는 기법 기본값의 합(장면당 130–320)이고, 발표 길이가 모자라면 여기부터 줄인다.

**2 스토리보드** — 표로 먼저 짜서 **사용자에게 보여주고 합의한 뒤** 생성한다.

| id | technique | kicker | title | lines | asset | pinVh |
|---|---|---|---|---|---|---|

오프너는 `frame-scrub-hero` 또는 `kinetic-titles`, 클로저는 `closing-qr`. **같은 기법 연속 배치 금지.**

**3 생성** — 아래 `scripts/cli.mjs`는 **스킬 루트**(이 SKILL.md가 있는 폴더, 설치 시 `~/.claude/skills/scrolline-deck`) 기준이다. 다른 작업 폴더에서 부를 때는 `node ~/.claude/skills/scrolline-deck/scripts/cli.mjs …`로 절대경로를 쓴다.
```bash
node scripts/cli.mjs init <dir> --title "<제목>" --style dark
node scripts/cli.mjs add <technique> --id 01-hero --kicker "..." --title "..." --lines "1줄|2줄"
```
`add`는 표의 행마다 한 번. `--id`는 `^\d{2}-[a-z0-9-]+$`이고 폴더명 = deck.json의 id.

**4 에셋**
```bash
node scripts/cli.mjs frames in.mp4 --name hero --fps 12 --width 1280 --scene 01-hero   # ffmpeg, ≤120장·≤10MB
node scripts/cli.mjs media photo.png --scene 04-gallery                                # webp 변환 + deck.json 등록
node scripts/cli.mjs qr --url https://example.com --out public/media/qr.svg
```
`--scene`를 주면 deck.json의 `frames`·`count`·`critical`·`images`가 자동으로 채워진다. 이미지는 webp ≤1600px `public/media/<id>/`, 영상은 muted·playsinline·포스터 필수.

**5 카피·노트** — deck.json의 `copy`(제목 1줄, `lines` 최대 4줄 — 기법별 허용 범위는 `template.json`의 `slots`)와 `notes`(필수, N키 노트 패널에 뜬다)를 채운다. `scene.js`는 템플릿이 표시한 **enter / hold / exit 블록 안에서만** 고친다. CSS 정지 상태 = 홀드에서 보일 완성 프레임.

**6 검증 루프**
```bash
node scripts/cli.mjs check <dir>     # 정적, 브라우저 없이
node scripts/cli.mjs verify <dir>    # 휠 주행 + qa/<id>-{30,55,85}.jpg
node scripts/cli.mjs storyboard <dir>
```
`verify` 캡처 3장을 **직접 읽어서** 30%=진입 중, 55%=완성 프레임, 85%=퇴장 중인지 확인한다. 아니면 고치고 다시.

**7 인계** — `npm run build && npm run preview`. 발표자에게 키를 알려주고, **발표할 PC에서 `verify` 한 번** 돌린다.

## 기법 고르기 (12종 — 정본은 `references/techniques.md`)

| technique | 무엇을 하나 | 언제 쓰나 | 에셋 | pinVh |
|---|---|---|---|---|
| `frame-scrub-hero` | 제목이 선 채로 뒤에서 프레임 시퀀스가 스크럽된다 | 이미지로 말문을 열 때 | frames + poster | 260 |
| `word-relay` | 화살표로 나눈 제목이 단어마다 바통을 넘긴다 | 한 문장으로 말문을 열 때 | 없음 | 220 |
| `kinetic-titles` | 번호 붙은 제목이 대각선 위로 조립된다 | 세션의 얼개를 보일 때 | 없음 | 240 |
| `horizontal-gallery` | 세로 스크롤이 가로 레일을 민다 | 이미지를 여러 장 보일 때 | 이미지 3–10 | 320 |
| `anatomy-rows` | 한 덩어리가 주석 달린 행으로 갈라진다 | 하나를 뜯어 보일 때 | 이미지 1 | 300 |
| `frame-scrub-video` | 본문용 프레임 스크럽 | 움직이는 과정을 보일 때 | frames + poster | 280 |
| `parallax-video` | 핀 없이 지나가는 영상 패럴랙스 | 객석에 숨을 줄 때 (`pin: false`) | video + poster | 130 |
| `paper-assembly` | 낱장이 모여 한 덩어리가 된다 | 쌓인 작업량을 보일 때 | 이미지 3–8 | 260 |
| `odometer-stats` | 숫자가 릴 위에서 굴러 도착한다 | 수치를 못 박을 때 | 없음 | 220 |
| `wipe-transform` | 한 면이 다음 면으로 와이프된다 | A가 B로 바뀌는 걸 보일 때 | 이미지 2–5, video 선택 | 300 |
| `tilt-card` | 인물 한 장을 느린 기울기로 세운다 | 사람을 소개할 때 | 이미지 1 | 200 |
| `closing-qr` | QR·주소·첫 장면으로 돌아가는 길 | 링크를 손에 쥐여 줄 때 | qr.svg | 200 |

## 게이트 (G1–G10 + 스키마 S0, 전부 exit-code)

정적 — `check`: **G1** 장면 모듈 4멤버·id=폴더명 / **G2** 타임라인 합 ≤1 + order·pinVh / **G3** tween 안 `var(` 금지 + 린트 L1 색상·L2 스코프·L3 `pathLength="1"` / **G4** `scrollTo`·`scrollIntoView` 금지 / **S0** deck.json 스키마 + 에셋 경로 존재.

브라우저 — `verify`(Playwright 없으면 안내 후 skip): **G5** 핀 거리 = `pinVh%` ±2px / **G6** 55% 지점 가시 요소 ≥3 + 캡처 / **G7** `→` 착지 오차 ≤4px·가시 ≥3 / **G8** console.error·pageerror 0 / **G9** 가로 넘침 0(1440·390) / **G10** reduced-motion에서 핀 0·각 장면 가시 ≥3.

## 발표 (인계용 키)

| 키 | 동작 |
|---|---|
| `→` `Space` / `←` | 다음 / 이전 장면 (홀드 35% 착지) |
| `1`–`9`, `0` | 장면 1–9 점프, `0`은 10번째 |
| `P` | 자동 진행 토글 (`presenter.autoDurationSec`, 입력하면 멈춤) |
| `F` / `H` / `N` | 전체화면 / 커서 숨김 / 발표자 노트 |

## 참조

`references/`: `techniques.md`(12기법 정본) · `choreography.md`(진입·홀드·퇴장 타이밍) · `contract.md`(장면 모듈·ctx) · `deck.schema.json` · `design.md`(탈박스·타이포·라이트/다크) · `pitfalls.md`(`vh`→`%`, lenis prevent, `from()` immediateRender 등) · `presenting.md`. 6장면 완성본 = `examples/sample-deck/`.
