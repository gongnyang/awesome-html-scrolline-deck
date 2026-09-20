# 워커 계약 (내부 문서, 배포 시 삭제)
플랜: /home/seunghyeong/.claude/plans/snug-booping-grove.md §S가 정본. 소유 폴더만 수정, git commit 금지(통합자가 커밋).
- E: engine/**, templates/project/**, scripts/cli.mjs, scripts/cmd/{init,add,frames,storyboard,upgrade}.mjs, scripts/lib/{schema,fs}.mjs, references/{deck.schema.json,contract.md,pitfalls.md,presenting.md}
- T: templates/scenes/**, references/{techniques,choreography,design}.md
- G: scripts/gates/**, scripts/lib/{browser,wheel}.mjs, scripts/cmd/{check,verify}.mjs, tests/**
- D: SKILL.md, README.md, README.ko.md, examples/sample-deck/**
공유 인터페이스(변경 시 WORKERS.md에 기록): template.json 형식, deck.json 스키마(references/deck.schema.json — E가 먼저 씀), 장면 모듈 계약(references/contract.md), CLI 서브커맨드 이름.

## D notes

- 소유 파일 작성: `SKILL.md`(91줄, 라우터), `README.md`(EN), `README.ko.md`(KO), `examples/sample-deck/**`.
- **샘플 덱 6장면**: `01-hero`(frame-scrub-hero) · `02-relay`(word-relay) · `03-arc`(kinetic-titles) ·
  `04-gallery`(horizontal-gallery) · `05-numbers`(odometer-stats) · `06-closing`(closing-qr). 주제 = 도구 자신.
- **에셋은 전부 생성물**(영상·사진 0). 재현 스크립트는 `examples/sample-deck/tools/`:
  - `make-frames.mjs` → `public/frames/hero/f_%03d.jpg` 120장 + `poster.jpg` (1280×720, 합 2.43 MB)
  - `make-posters.mjs` → `public/media/gallery/plate-0{1..6}.webp` (900×1200, 각 ~12 KB)
  - 둘 다 `sharp` 필요: `NODE_PATH=/mnt/d/fc-astra-site/node_modules node tools/make-*.mjs`
  - QR은 `scripts/cli.mjs qr` 로 `public/media/qr.svg` 생성.
- **README 히어로 이미지 경로**(G가 만드는 verify 캡처에 의존): `examples/sample-deck/qa/{01-hero,04-gallery,05-numbers,06-closing}-55.jpg`.
  캡처 파일명이 `<id>-55.jpg`가 아니면 알려줄 것 — README 두 개를 같이 고친다.
- **기법 표는 `template.json`의 `pinVh`를 정본으로 동기화**한다(SKILL.md·README 2종에 같은 표). T가 12개를
  다 쓴 뒤 D가 마지막에 맞춘다. 현재 확인된 차이: word-relay 220, kinetic-titles 240, frame-scrub-hero 260.
- 프레임 경로 규약은 `public/frames/<name>/`(deck.schema.json 예시 기준), 그 외 미디어는 `public/media/`.

## E notes (엔진·템플릿·CLI 인터페이스 — 2026-09-20)

**엔진 API** `createDeck({ root, deck, modules, partials, styles })` — `engine/deck.js`.
`modules`/`partials`는 Map·id 키 객체·glob 경로 키 객체 셋 다 받는다. 반환값
`{ scenes, goTo, currentIndex, lenis, ScrollTrigger, destroy }`. ctx는
`{ gsap, ScrollTrigger, lenis, data:{deck,scene}, reduced, mobile, tier, frameScrub }`이고
`ctx.frameScrub(host, opts?)`는 옵션을 `scene.assets`에서 자동으로 채운다
(`{pattern,count,critical,poster,fit,mobilePattern}`, pattern은 `%03d`).
엔진 CSS는 **생성 프로젝트의 `src/main.js`가** `./engine/deck.css`로 import 한다(엔진 JS는 CSS를 import 하지 않음).

**장면 템플릿 치환 규칙(T)** — `add`가 `templates/scenes/<technique>/`의 파일을 그대로 복사하며 치환한다.
- 치환 키: `{{id}} {{technique}} {{kicker}} {{title}} {{pinVh}} {{order}}`
- 줄 반복: `<!-- each:line --> … {{line}} … {{n}} … <!-- /each -->` (n은 1부터)
- 보조: `{{lines}}`(li 목록으로 확장), `{{line1}}`~`{{line4}}`
- `template.json`은 **프로젝트로 복사되지 않는다**(스킬 메타데이터). `add`가 읽는 키:
  `pinVh`, `pin`, `notesHint`, `assets.{frames|images|video}`(있으면 deck.json 에셋 키를 미리 깔아둠),
  `transitionIn`, `transitionOut`.
- `templates/scenes/<technique>/scene.js`가 없으면 내장 폴백 템플릿으로 스캐폴드하고 그 사실을 출력한다.

**토큰 이름(templates/project/src/tokens.css)** — `--canvas --surface-1..3 --hairline --hairline-strong
--ink --ink-muted --ink-subtle --accent-1..3 --on-accent`, 타입 스케일 `--display-xl/lg/md --headline
--card-title --subhead --body-lg --body --body-sm --caption --eyebrow --mono`(각 `-size/-lh/-ls/-weight`),
간격 `--space-xxs..xxl --space-section`(⚠ `--space-2xl`은 **없다**), `--gutter --container --stage-max`,
`--radius-xs..xl --radius-pill`, `--ease-out --ease-in-out --dur-fast/base/slow`, `--z-nav/overlay/modal`,
`--focus-ring`. `--fs-*` 계열은 없다(T 템플릿의 `var(--fs-title, clamp(...))` 폴백으로 렌더는 정상).
라이트는 `:root[data-theme='light']` 오버라이드이고 엔진이 `deck.theme.style`을 `<html data-theme>`에 쓴다.

**생성 프로젝트 레이아웃(G)** — `index.html`(`body.deck-body`, `#preloader`+`#preloader-label`,
`#progress`+`#progress-bar`, `main#deck`, `#hud`, `aside#notes`+`#notes-title`+`#notes-body`),
`vite.config.js`(target es2022, base './'), `src/{main.js,tokens.css,base.css,engine/**,scenes/<id>/**}`,
`data/deck.json`, `public/{media,frames}/`, `.scrolline.json`(`{engineVersion, installedAt, engineHashes}`),
`.gitignore`(템플릿에는 `_gitignore`로 저장 — 레포 안에서 ignore로 동작하지 않게).

**CLI 계약** — `node scripts/cli.mjs <cmd>`: `init add frames storyboard check verify qr media upgrade help version`.
각 `scripts/cmd/<cmd>.mjs`는 `export async function run(argv)`를 내보내고 **종료 코드를 숫자로 반환**한다
(argv = 커맨드 뒤 인자 전부). `check`/`verify`는 없으면 라우터가 안내 후 exit 2로 끝나므로 G가 파일만 얹으면 붙는다.
디렉터리 인자는 전부 `[dir]` 위치 인자 또는 `--dir`이고 기본값은 cwd.

**스키마** — `references/deck.schema.json`이 정본이고 technique enum 12종도 여기가 유일 출처다
(`add`가 이 enum을 읽어 검증한다). 검증기는 `scripts/lib/schema.mjs`의 `validate(schema, data) → {ok, errors[]}`와
`formatErrors(errors)`. 확장 키워드 `x-uniqueBy: "id"`로 장면 id 유일성을 본다.
공용 헬퍼는 `scripts/lib/fs.mjs`(`REPO_ROOT, walk, copyDir, readJson, writeJson, readText, writeText,
sha256File, fillTemplate, slugify, parseFlags, escapeHtml`).

**엔진 버전** — `engine/VERSION` 0.1.0, `engine/MANIFEST.json`은 `node scripts/cli.mjs upgrade --manifest`로 재생성.
`upgrade <dir>`는 `.scrolline.json`의 설치 시점 해시와 대조해 **수정된 파일은 `--force` 없이는 덮지 않는다**.
