# Scene contract

This is the only agreement between the engine and a scene. If code and this file
disagree, this file wins and the code is fixed.

## 1. Folder = scene id

```
src/scenes/03-agenda/
├ scene.html   markup injected into the <section> (read with ?raw)
├ scene.css    every selector scoped to [data-scene="03-agenda"]
└ scene.js     default export { id, mount, build, unmount }
```

The folder name is the scene id, and it must equal the `id` in `data/deck.json`.
All three files are optional. With no `scene.html` the engine draws a readable
fallback block from `copy.kicker`, `copy.title` and `copy.lines`, so a deck is
presentable before a single scene is written.

## 2. The module

```js
export default {
  id: '03-agenda',
  mount(section, ctx) {},   // inject or query DOM inside `section`
  build(tl, ctx) {},        // add choreography to the engine's pinned timeline
  unmount() {},             // remove listeners, dispose objects
};
```

- `mount` runs once, before `build`. Under reduced motion it still runs: the
  scene must be readable with no animation at all.
- `build` never runs under reduced motion, and never calls `tl.play()`.
- `unmount` is called by `deck.destroy()`.

## 3. ctx

```js
ctx = {
  gsap, ScrollTrigger,
  lenis,                       // null under reduced motion — always check
  data: { deck, scene },       // deck.json, and this scene's entry
  reduced, mobile,             // booleans
  tier,                        // 'low' | 'mid' | 'high'
  frameScrub(host, opts?),     // → { canvas, setProgress(0..1), destroy() }
}
```

`frameScrub` defaults every option from `scene.assets`, so a scene with a frame
sequence in `deck.json` only needs `const seq = ctx.frameScrub(section)`.
Options: `{ pattern, count, critical, poster, fit, mobilePattern }`, where
`pattern` carries the frame number as `%02d`, `%03d`, or another schema-supported width.
Reduced motion uses `poster` when supplied and otherwise renders the first frame.

## 4. The timeline

The engine creates `gsap.timeline({ paused: true })` and binds it to scroll
progress. `pace.mode: pass` runs through the viewport without a pin; `hold` and
`scrub` pin for `pace.scrollVh` percent of viewport height.

- **Total length is 1.** Position and duration are fractions of the scene, so
  changing `pace.scrollVh` later rescales the choreography instead of breaking it.
  The engine fills a short timeline with an inert tail to keep cue positions
  aligned with scroll progress. A longer timeline makes GSAP squash everything
  by `1/duration` and fails the timeline gate.
- Each `pace.cueStates[].at` is a complete, readable presenter stop. Do not
  fade all claim and evidence elements before the pin ends; the 96% and 99%
  frames are checked for an empty canvas. Legacy decks use a 35% fallback stop.
- Use `fromTo`, not `from`. A bare `from()` applies its start values at build
  time (`immediateRender`) and the scene flashes its end state on load.
- Never tween a string containing `var(...)`. GSAP cannot interpolate it and the
  property snaps. Tween a plain number into a custom property instead, and let
  CSS do the arithmetic: `gsap.to(el, { '--draw': 1 })` with
  `stroke-dashoffset: calc(1 - var(--draw))`.
- Animated SVG paths carry `pathLength="1"` so dash maths is resolution free.

## 5. deck.json

`data/deck.json` is validated by `references/deck.schema.json`.

```jsonc
{
  "schemaVersion": 2,
  "title": "…", "subtitle": "…", "lang": "ko",
  "presenter": { "name": "…", "roles": [], "avatar": "", "autoDurationSec": 180 },
  "theme": { "style": "dark", "accent": "#5e6ad2" },
  "scenes": [{
    "id": "03-agenda",          // ^\d{2}-[a-z0-9-]+$, unique, equals the folder name
    "order": 3,                 // sort key
    "technique": "kinetic-titles",
    "purpose": "이 장면에서 청중이 이해해야 할 발표 과제",
    "claim": "청중이 기억할 한 문장",
    "relation": "sequence",       // question | comparison | change | sequence | spatial | structure | decision | atmosphere
    "reason": "순차 공개와 정지 화면이 이 관계를 설명하는 이유",
    "evidence": "주장을 뒷받침하는 실제 자료 또는 명시적 설명",
    "presenterAction": "각 단계를 짚으며 설명한다",
    "visualChange": "단계마다 결과가 누적된다",
    "evidenceStatus": "sourced", // sourced | synthetic | design-target | concept | none
    "source": "자료와 위치를 식별할 수 있는 출처",
    "pace": {
      "mode": "scrub",          // pass | hold | scrub
      "scrollVh": 240,          // pass=0; pinned modes use viewport-height percent
      "cueStates": [
        { "at": 0.35, "message": "첫 단계와 그 근거가 모두 보임" },
        { "at": 0.7, "message": "전체 과정과 결과가 모두 보임" }
      ]
    },
    "assets": {
      "frames": "/frames/hero/f_%03d.jpg",
      "mobileFrames": "/frames/hero-mobile/f_%03d.jpg",
      "count": 120, "critical": [1, 60, 120],
      "poster": "/media/03-agenda/poster.webp",
      "images": [], "video": null
    },
    "copy": { "kicker": "…", "title": "…", "lines": ["…"] },   // max 4 lines
    "transition": { "in": "fade", "out": "wipe" },
    "notes": "Speaker notes — required, shown in the N panel.",
    "audio": { "src": "/media/03-agenda/bed.mp3", "volume": 0.4 },
    "fallback": "What the scene degrades to when assets are missing."
  }]
}
```

## 6. How the engine finds a scene

`src/main.js` is the only file that touches the bundler:

```js
const modules  = import.meta.glob('./scenes/*/scene.js',   { eager: true });
const partials = import.meta.glob('./scenes/*/scene.html', { eager: true, query: '?raw', import: 'default' });
const styles   = import.meta.glob('./scenes/*/scene.css',  { eager: true });
createDeck({ root: document.getElementById('deck'), deck, modules, partials, styles });
```

`createDeck` accepts a Map, an object keyed by scene id, or a glob result keyed
by path. The engine itself imports nothing from Vite, so it can be unit tested
under Node with a DOM stub.

## 7. What the engine already does

Section creation, mounting, pin and scrub wiring, the preloader, the progress
bar, the scene HUD, the notes panel, and every key binding
(`→`/`Space`, `←`, `1`–`9`/`0`, `P`, `F`, `H`, `N`). A scene never re-implements
these and never calls `window.scrollTo` or `scrollIntoView` — a closing scene
that restarts the deck uses `ctx.lenis?.scrollTo(0)`.
The URL query `?scene=<scene-id>` opens a scene at its first presenter hold;
the gallery uses this for links from verified scene captures.

---

## 요약 (Korean)

장면 폴더 이름이 곧 장면 id이고 `data/deck.json`의 `id`와 같아야 한다. `scene.js`는
`{ id, mount, build, unmount }` 하나만 기본 내보내기 한다. `mount`는 DOM을 채우고,
`build`는 엔진이 만든 **총 길이 1짜리** 타임라인에 안무만 얹는다. 진입 0–.30,
각 `pace.cueStates`에서 주장과 근거가 함께 읽히는 정지 화면을 만든다. 마지막 5%에서
화면이 비면 안 된다. 기존 덱만 35% 지점을 기본 착지점으로 사용한다.

`from()` 대신 `fromTo()`를 쓰고, 문자열 안에 `var()`가 든 값은 트윈하지 않는다.
숫자를 커스텀 속성에 흘려 CSS `calc()`가 계산하게 한다. CSS 선택자는 전부
`[data-scene="<id>"]`로 스코프하고 색은 토큰만 쓴다.

`ctx.lenis`는 모션 축소 설정에서 `null`이다. 반드시 확인하고 쓴다. 섹션 생성·핀·
진행바·HUD·노트 패널·키 바인딩은 엔진이 이미 한다 — 장면에서 다시 만들지 않는다.
검증된 장면의 직접 링크는 `?scene=<장면 id>`를 사용한다.
