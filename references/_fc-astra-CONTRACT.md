# fc-astra-site 작업 계약 (P0 골격)

패스트캠퍼스 「ChatGPT Astra 업무자동화 사용법」 발표 사이트. 이 문서가 워커 간 유일한 계약이다.
행동 규칙이 코드와 어긋나면 **이 문서가 우선**이고, 바꿔야 하면 아래 §9 절차를 따른다.

---

## 1. 폴더 소유권

한 워커는 자기 폴더만 쓴다. 남의 폴더를 고쳐야 하면 직접 고치지 말고 통합자에게 알린다.

| 워커 | 소유 폴더 | 산출물 |
|---|---|---|
| **W1** 메인 | `src/sections/**`, `src/pages/home.js`, `index.html` | 히어로 드래그 스크럽 + 섹션 8개 |
| **W2** 3D 맵 | `map/**` (단 `map/legacy/**` 제외) | 자비스형 HUD 3D. `map/legacy/**` 는 v1 보존본이라 **동결**이다 |
| **W3** 덱 | `deck/**` | 스크롤 시네마 엔진 + 장면 12개 |
| **W4** 갤러리 | `gallery/**` (`gallery/builder/**` 포함) | 전시회형 그리드·라이트박스 + 별도 페이지 프롬프트 빌더 |
| **메인(통합자)** | `src/shared/**`, `data/**`, `scripts/**`, `vite.config.js`, `package.json` | 공통 레이어 |
| **이미지 워커** | `_gen/**` | 생성 이미지. 다른 워커는 이 폴더를 건드리지 않는다 |

덱 장면은 한 워커가 `deck/src/scenes/NN-id/` 한 묶음만 소유한다. 다른 장면 폴더에 쓰지 않는다.
`deck/src/engine/**` 은 장면 워커가 건드리지 않는다 — 엔진 변경은 통합자만 한다.

---

## 2. 공통 모듈 시그니처

### 2.1 페이지 진입 (모든 페이지 공통)

```js
import '../shared/tokens.css';   // 항상 tokens → base 순서
import '../shared/base.css';
import { mountChrome } from '../shared/chrome.js';

mountChrome({ active: 'home' });   // 'home' | 'map' | 'gallery' | 'deck'
// 옵션: { footer = true, offset = true }
// footer:false → 푸터 생략(덱처럼 전체화면 페이지)
// offset:false → body 에 고정 내비 높이 padding 을 주지 않음(직접 처리할 때)
```

`mountChrome` 은 상단 내비(로고 `ASTRA · 공냥이`, 홈 / 3D 강의맵 / 이미지 갤러리 / 시네마 덱 / 신청하기)와
푸터를 주입한다. **내비·푸터를 페이지에서 다시 만들지 않는다.**

### 2.2 스크롤 배선

```js
import { createScroll, scrollToPx } from '../shared/scroll.js';

const { lenis, gsap, ScrollTrigger, destroy } = createScroll({ duration: 1.2 });
// 모션 축소 설정이면 lenis === null 이고 네이티브 스크롤을 쓴다. 반드시 null 을 확인할 것.
scrollToPx(lenis, targetPx);
```

`new Lenis()` 를 직접 만들지 않는다. `gsap.registerPlugin(ScrollTrigger)` 도 이 모듈이 이미 했다.

### 2.3 성능·접근성 판정

```js
import { reduced, isMobile, hasFinePointer, gpuTier, fpsProbe, smoothstep, clamp01 } from '../shared/motion.js';

const tier = gpuTier();                  // 'low' | 'mid' | 'high'
fpsProbe(2, ({ fps, tier, downgrade }) => { /* 30fps 미만이면 한 단계 자동 강등 */ });
```

### 2.4 덱 장면 모듈 계약

`deck/src/scenes/NN-id/scene.js` 는 **반드시** 이 모양의 기본 내보내기를 한다.

```js
export default {
  id: '04-image-gen',
  mount(section, ctx) {},      // DOM 주입. scene.html 내용을 section 안에 채운다
  build(tl, ctx) {},           // gsap 타임라인에 안무를 얹는다. tl 은 엔진이 만든 pin 타임라인
  unmount() {},                // 리스너·객체 정리
};
```

`ctx` 모양:

```js
ctx = {
  gsap, ScrollTrigger, lenis,       // lenis 는 reduced 일 때 null
  data,                             // data/scenes.json 의 해당 장면 항목
  event, sessions,                  // data/event.json, data/sessions.json
  reduced, mobile, tier,            // boolean, boolean, 'low'|'mid'|'high'
  frameScrub(section, { dir, count, critical, poster }),  // 프레임 스크럽 헬퍼(엔진 제공)
}
```

CSS 는 `[data-scene="NN-id"]` 로 스코프한다. 전역 선택자 금지.

**엔진이 장면을 찾는 법** — `deck/src/engine/index.js` 가 `import.meta.glob` 으로 폴더를 통째로 읽는다.
폴더 이름이 곧 장면 id 이고, `data/scenes.json` 의 `id` 와 정확히 같아야 붙는다.

```
deck/src/scenes/04-image-gen/
├ scene.html   섹션 안에 그대로 들어갈 마크업 (?raw 로 읽는다)
├ scene.css    [data-scene="04-image-gen"] 로 스코프
└ scene.js     기본 내보내기 { id, mount, build, unmount }
```

세 파일 다 선택이다. `scene.html` 이 없으면 엔진이 `scenes.json` 의 kicker·title·lines 로
기본 블록을 그리므로, **다른 워커의 장면이 아직 없어도 자기 장면을 혼자 확인할 수 있다.**
참고용 예시가 `deck/src/scenes/00-example/` 에 있다(scenes.json 에는 없으므로 렌더되지 않는다).

**타임라인 규칙** — 엔진이 `gsap.timeline({ paused: true })` 를 만들어 `build(tl, ctx)` 로 넘기고,
`ScrollTrigger` 가 `scrub: 0.6` 으로 스크럽한다. 타임라인 **총 길이를 1로 두고 0..1 구간에 배치**하면
`pinVh` 를 나중에 조정해도 비율이 유지된다. `tl.play()` 를 직접 부르지 않는다.

**핀 여부** — `scenes.json` 의 `pinVh` 만큼 `pin: true` 로 고정한다.
단 `"pin": false` 인 항목은 고정하지 않고 지나가는 동안만 스크럽한다(현재 `07-video-parallax` 하나).

**엔진이 이미 하는 것**(중복 구현 금지): 섹션 생성·장면 마운트·pin/scrub 배선·상단 진행바·
`ArrowRight`/`Space` 다음 장면, `ArrowLeft` 이전 장면·모션 축소 시 핀과 안무 생략.
**W3 이 얹을 것**: 프리로더 진행률(`#preloader` 는 지금 `hidden`), 장면 인덱스 HUD 고도화,
숫자 점프, `P` 발표자 자동 진행, `F` 전체화면, `H` 커서 숨김, 그리고 실제 장면 12개.

### 2.5 3D 스테이션 모듈 계약

`map/src/stations/<id>.js` 는 `createStation` 하나를 내보낸다.

```js
export function createStation(ctx, data) {
  return {
    group,                    // THREE.Group — 씬에 붙일 루트
    anchors,                  // Object3D[4] — pins.js 가 번호 핀을 투영할 지점
    hitMesh,                  // 투명 Sphere(r 3.2) — 레이캐스트 과녁. picker 가 이것만 본다
    update(u, t, dt) {},      // u = 스테이션 로컬 진행률 0..1, t = 전체 진행률, dt = 초
    setHover(v) {},           // 0|1 — 호버 밴드·fresnel 부스트
    setFocus(k) {},           // 0..1 — 선택 역 1→1.25 확대, 코어 링 디밍
    pulse() {},               // 클릭 버스트 — 확장 링 0.6s + uSelect 1→0
    dispose() {},             // geometry·material·texture 해제
  };
}
```

`data` 는 `data/stations.json` 의 `stations[]` 한 항목이다. `ctx` 는 `{ THREE, renderer, scene, camera, tier, reduced, mobile, shared }`.

`group`·`update`·`dispose` 는 필수고 **나머지는 선택**이다. HUD 쪽(`map/src/main.js`)은 전부 옵셔널 체이닝으로
부르므로(`station.setFocus?.(1)`) 모듈이 아직 새 메서드를 갖추지 않아도 페이지는 그대로 뜬다.

`data/stations.json` 의 역별 항목에는 HUD 패널용 키가 더 붙어 있다(레거시 호환 — 기존 키는 그대로다).

```
steps[5] tools[5] outputs[3]
metrics[4] { label, value:number, unit, delta, format:'int'|'time'|'tenth' }
series[24] log[6] sample:true
```

최상위에 `disclaimer: "수치는 예시"` 가 있다. **이 숫자는 전부 예시이므로 화면에서 그 사실을 감추지 않는다** —
METRICS·TREND·LOG 패널 푸터와 상단 티커의 `DATA` 칸이 그 표기를 담당한다.

### 2.5-1 맵 이벤트 버스 (`map/src/fx.js`)

`createFx()` 가 돌려주는 프레임 공유 상태에 EventTarget 기반 버스가 붙어 있다.
**선택 입력은 소스가 무엇이든 먼저 이 버스로 흘리고**, `map/src/main.js` 하나가 받아서 실행한다.
모듈이 서로를 직접 부르지 않으므로 3D 워커와 HUD 워커가 같은 파일을 만지지 않는다.

```js
fx.emit(type, detail);           // 흘린다
const off = fx.on(type, fn);     // 구독. 해제 함수를 돌려준다
```

| 이벤트 | detail | 흘리는 쪽 |
|---|---|---|
| `station:select` | `{ index, source:'3d'\|'list'\|'key'\|'timeline'\|'scroll', x?, y? }` | picker · HUD 리스트 · 키보드 · 타임라인 노드 |
| `station:hover` | `{ index }` — `-1` 이면 해제 | picker · HUD 리스트 |
| `bullet:focus` | `{ station, bullet, x?, y? }` | LIVE 패널 행 |
| `burst` | `{ from, to }` | `transition.js` (활성 역이 바뀐 뒤) |
| `timeline:scrub` | `{ t, live }` | 타임라인 드래그 |
| `timeline:step` | `{ delta }` | 타임라인 prev/next |
| `hud:log` | `{}` | `L` 키 |

같은 객체에 프레임 필드도 함께 있다 — `boot`(0→1 부트 리빌), `hover`(-1 또는 역 색인),
`focus`(0..1 스톱 근접도), `pulse[3]`(역별 클릭 펄스). 콘텐츠 모듈은 `ctx.shared` 로 **읽기만** 한다.

### 2.5-2 맵 HUD 색 토큰

`/map/` 의 3D·HUD 크롬은 **블루만** 쓴다. 세션 액센트(`--accent-s2` 노랑 · `--accent-s3` 빨강)는
6px 태그 칩·점에만 쓴다. 홀로 팔레트는 `map/src/hud.css` 의 `.map-page` 블록 **한 곳에서만** 정의하고,
나머지 규칙은 전부 `var()` 로 읽는다 — 이 파일에서 리터럴 색이 허용되는 곳은 그 블록뿐이다.

```
--holo-cyan  시안 주선        --holo-beam  면·흐린 선      --holo-pale  하이라이트·커서
--holo-dim   그리드·스캔면    --holo-line  1px 라인        --holo-glow  글로우
--holo-panel 패널 바탕        --holo-cut   모서리 컷 polygon()
```

`config.js` 의 `TOKEN.holo/holoDeep/holoPale/holoDim` 이 같은 값의 3D 쪽 상수다(three.js 는 CSS 변수를 못 읽는다).

### 2.6 인포그래픽 키트 계약

메인 세션 섹션·덱 03·덱 10 은 박스 카드를 쓰지 않고 이 키트로 그린다.
직접 마크업을 짜지 말고 `renderInfographic` 이 만든 DOM 위에 안무만 얹는다.

```js
import { renderInfographic, cascade, playCascade } from '../shared/infographic.js';

const ig = renderInfographic(hostEl, {
  template: 'steps-ascending' | 'steps-snake' | 'pipeline',
  title, desc,
  items: [{ badge, label, desc, children: [], media, icon, accent }],
});
// ig = { el, update(), destroy() }
```

| 템플릿 | 모양 | media 의 쓰임 |
|---|---|---|
| `steps-ascending` | 플레이트 3장이 왼→오른쪽으로 계단처럼 올라가고 하위 불릿이 아래로 깔린다 | 플레이트 배경 |
| `steps-snake` | 노드가 위·아래로 번갈아 놓이고 곡선 커넥터로 이어진다 | 플레이트 배경 |
| `pipeline` | 타일 3개를 화살표 커넥터가 잇는다 | 타일 아래 산출물 썸네일 |

**훅** — `[data-ig-node]`, `[data-ig-child]`, `[data-ig-badge]`,
`<svg class="ig-connectors" viewBox="0 0 W H" preserveAspectRatio="none">` 안의
`<path data-ig-connector pathLength="1">`. 커넥터 `d` 는 노드 실측 레이아웃에서 계산하고
`ResizeObserver` 로 다시 그린다(모바일 ≤720px 에서는 세로로 적층되고 커넥터도 세로가 된다).

**안무**

```js
cascade(tl, root, { at = 0, stagger = .025, dur = .12, nodeStagger = dur / 3 });  // 스크럽(정규화 단위)
playCascade(root, { stagger = .06 });                                            // 일반 페이지(초 단위, IO 1회)
```

`cascade` 는 스크럽 타임라인에 `fromTo` 를 얹고 캐스케이드가 끝나는 진행률을 돌려준다.
기본값이 덱 03 안무표 그대로다 — `at: .06` 이면 플레이트가 .06/.10/.14, 커넥터가 .12–.20/.20–.28.
노드 `y 24→0 autoAlpha`, 배지 `scale .6→1`, 자식 stagger, 커넥터 `--draw 0→1` 순서다.

**규칙**

1. **tween 문자열 안에 `var()` 를 넣지 않는다.** 시작값과 목표값의 토큰이 달라지면 GSAP 이 보간하지 못하고
   스냅한다(플랜 §C0 의 04·05 결함 원인). 커넥터는 숫자 커스텀 프로퍼티 `--draw` 만 tween 하고,
   색·모양은 CSS 가 `stroke-dashoffset: calc(1 - var(--draw, 1))` 로 받는다.
2. CSS 정지 상태가 곧 완성 프레임이다. 숨김 초기값은 모션 축소가 아닐 때만 GSAP 이 설정하고,
   `reduced()` 이면 `cascade`·`playCascade` 둘 다 아무것도 하지 않는다.
3. 색은 토큰만 — `accent` 에는 `var(--accent-s1)` 같은 토큰 문자열을 넘긴다. hex 를 넘기지 않는다.
4. 활성 상태는 노드에 `is-active` 클래스를 토글한다(액센트 테두리 + 배지 강조). 인라인 색을 쓰지 않는다.

견본은 `qa/infographic-demo.html` 에 템플릿 3종이 다 들어 있다.
vite 입력이 아니므로 볼 때만 `vite.config.js` 에 잠깐 넣었다가 뺀다.

---

## 3. 디자인 토큰

`src/shared/tokens.css` 의 CSS 변수만 쓴다. **색상 하드코딩 금지** — `#5e6ad2`, `rgb(...)`, `black`, `white` 모두 금지.

- 배경: `--canvas` → `--surface-1` → `--surface-2` → `--surface-3` → `--surface-4`
- 선: `--hairline` / `--hairline-strong` / `--hairline-tertiary`
- 글자: `--ink` / `--ink-muted` / `--ink-subtle` / `--ink-tertiary`
- 액센트: `--primary` 는 브랜드 마크·주 CTA·포커스·링크 강조에만. 섹션 배경이나 카드 채움에 쓰지 않는다.
- 세션 액센트: `--accent-s1`(#5e6ad2) / `--accent-s2`(#ffd12b) / `--accent-s3`(#ff2d2d) — **3D 맵과 덱 장면 안에서만.** 메인 페이지 크롬에는 쓰지 않는다.
- 타입: `--display-xl-size` 같은 낱개 변수 또는 유틸리티 클래스 `.t-display-xl` `.t-headline` `.t-body` `.t-eyebrow` `.t-mono`
- 라운드: `--radius-md`(버튼·인풋 8px) / `--radius-lg`(카드 12px) / `--radius-xl`(미디어 패널 16px). CTA 는 pill 로 만들지 않는다.
- 간격: `--space-xs … --space-section`, 좌우 여백은 `--gutter`(16px), 컨테이너는 `--container`(1200) / `--container-wide`(1440)

`base.css` 가 제공하는 것: `.container` `.container-wide` `.section` `.panel` `.panel--media` `.panel--lift`
`.btn` `.btn--primary|secondary|tertiary|inverse` `.badge` `.sr-only` `.skip-link` `.stack`.
한국어 본문은 `word-break: keep-all` 이 이미 걸려 있다. 되돌리지 않는다.

**폰트**: Pretendard Variable(동적 서브셋). `src/shared/fonts.css` 가 `@font-face` 를 담당하고 `tokens.css` 가 이를 `@import` 한다.
페이지에서 폰트를 따로 링크하지 않는다. 모노는 시스템 스택(`--font-mono`).

---

## 4. 데이터 파일

정본은 `data/`. 빌드 전 `scripts/sync-data.mjs` 가 `public/data/` 로 복사하므로 **두 방식 모두 가능**하다.

| 파일 | 내용 | 읽는 법 |
|---|---|---|
| `data/event.json` | 행사 사실(제목·일시·장소·가격·링크·강사·세션명·대상). `links.site` = 이 사이트 주소이고 엔드카드 QR 의 원본이다 | `import event from '../../data/event.json'` |
| `data/sessions.json` | 세션 3개(kicker·title·oneLiner·불릿 4개·keyart·accent) | import |
| `data/scenes.json` | 덱 장면 12개 계약(`pin` 플래그 포함) | import |
| `data/stations.json` | 3D 카메라 경로·조명·스테이션 3종 | import |
| `data/motion.json` | 영상 19편(gnworks 3 · showreel 1 · style 11 · flow 4) | import |
| `data/gallery.json` | 키아트 79장 + 프롬프트 전문 (176KB) | **`await fetch('/data/gallery.json')`** — 번들에 넣지 말 것 |

`gallery.json` 항목: `{ id, series, file, thumb, title, lang, ratio, concept, prompt, reference, tags[] }`
`series` = `v2`(2:3 25장) | `wide`(16:9 25장) | `character`(캐릭터 포스터 24장) | `ad`(제품 광고 5장). 프롬프트 누락 0건.

`motion.json` 항목: `{ id, title, style, duration, url, poster, group }`
`group` = `gnworks` | `showreel` | `style` 은 `https://focused-motion-studies.vercel.app/` 절대 URL(재업로드 금지, `preload="none"` + 포스터).
`group: 'flow'` 만 로컬 `/media/promo/*`.

---

## 5. 에셋 경로

`scripts/ingest.mjs` 가 만든 것만 쓴다. 원본 폴더를 코드에서 직접 참조하지 않는다.

```
/frames/impact/f_001.jpg … f_120.jpg      1280px, 12fps, 6.9MB   (히어로·덱 01-hero)
/frames/impact-640/f_001.jpg … f_120.jpg  640px,  3.0MB          (모바일)
/frames/tunnel/f_001.jpg … f_120.jpg      1280px, 9.8MB          (덱 06-video-gen)
/frames/tunnel-640/…                      640px,  3.7MB
/media/promo/{impact,ring2,tunnel,tunnel2}-720.mp4   h264 crf28 · 무음 · faststart
/media/promo/{...}-poster.jpg
/media/mascot.webp                        공냥이 캐릭터 800px
/keyart/{v2,wide,character,ad}/<name>.webp          1600px q80
/keyart/{v2,wide,character,ad}/thumb/<name>.webp    400px q72
/fonts/pretendard/woff2-dynamic-subset/*.woff2
/gen/qr-site.svg                          event.links.site 로 만든 사이트 QR
                                          (scripts/build-qr.mjs, prebuild 에서 자동 생성 · 색은 currentColor)
/favicon.svg
```

프레임 시트는 무겁다. **모바일(`isMobile()`)에서는 프레임을 내려받지 않는다** — 포스터로 대체한다.
영상은 `muted playsinline preload="none"`(또는 `metadata`)를 기본으로 한다.

---

## 6. 금지 사항

1. **React·프레임워크 금지.** 바닐라 ES 모듈만. 빌드에 새 런타임 의존성을 추가하지 않는다.
2. **외부 CSS/JS CDN 금지.** 폰트·라이브러리는 전부 `node_modules` 또는 `public/`.
3. **색상·폰트 하드코딩 금지.** `tokens.css` 변수만.
4. **행사 사실 하드코딩 금지.** 날짜·시간·제목·링크·강사 소개는 반드시 `data/event.json` 에서 읽는다.
5. **`src/shared/**`, `data/**`, `vite.config.js`, `package.json` 을 말없이 고치지 않는다.**
6. **원본 폴더 수정 금지.** `/mnt/d/패켐 아스트라 특강`, `/mnt/d/9_10_고려대`, `/mnt/d/ai-model-practice-2026` 은 읽기 전용.
7. **`_gen/` 금지.** 이미지 워커 전용 폴더다.
8. **`prefers-reduced-motion` 무시 금지.** 모든 모션 페이지는 정지 폴백을 갖춘다.
9. **모바일 390px 가로 스크롤 0**, **콘솔 에러 0** 이 인수 조건이다.

---

## 7. 예산

| 항목 | 상한 | 현재 |
|---|---|---|
| 배포 총량 | 120 MB | 46 MB |
| 첫 화면 전송 | 4 MB | — |
| 콘솔 에러 | 0 | — |
| 모바일 가로 스크롤 | 0 | — |

---

## 8. 개발 명령

```bash
npm install --cache /mnt/d/fc-astra-site/.npm-cache   # C 드라이브를 쓰지 않도록 캐시 고정
npm run dev        # 개발 서버 (localhost:5173) — 실행 전 sync-data 자동
npm run build      # 프로덕션 빌드 → dist/
npm run preview    # 빌드 결과 확인 (localhost:4173)

npm run smoke      # 브라우저 스모크(6경로 × 2뷰포트). preview 를 먼저 띄워 둘 것
                   # playwright 전역 설치본을 쓴다(프로젝트 의존성 아님)
npm run wheel      # 실제 휠 입력 120틱 주행(6경로). BASE 로 프로덕션도 본다
                   # 덱 측정에 window.scrollTo 를 쓰지 않는 이유가 여기에 있다
npm run qr         # event.links.site → public/gen/qr-site.svg (prebuild 가 자동 실행)

npm run ingest     # 원본 → public/ 에셋 변환 (멱등, --force 로 전체 재생성)
npm run gallery    # 이미지 ↔ 프롬프트 매핑 → data/gallery.json
npm run sync-data  # data/*.json → public/data/
npm run sync-fonts # Pretendard 서브셋 → public/fonts/ + src/shared/fonts.css 재생성
npm run assets     # 위 세 개를 순서대로
```

빌드 타깃은 `es2022`(top-level await 사용 가능).

---

## 9. 공통 레이어를 바꿔야 할 때

1. 먼저 자기 폴더 안에서 해결할 수 있는지 본다(스코프된 CSS, 로컬 유틸).
2. 정말 공통이어야 하면 **고치지 말고** 통합자에게 "무엇을 · 왜 · 어떤 시그니처로" 를 알린다.
3. 토큰을 새로 추가할 때는 기존 사다리(surface 1~4, ink 4단계)를 건너뛰지 않는다.
4. `data/*.json` 스키마 변경은 그 파일을 읽는 모든 워커에게 영향을 준다. 반드시 통합자를 거친다.
