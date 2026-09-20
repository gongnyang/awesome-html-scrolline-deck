# JUDGE — scrolline-deck 외부 재현 판정

판정자: 사전 지식 없는 신규 심사자 (SKILL.md + references/techniques.md 만 읽고 수행)
대상: `~/.claude/skills/scrolline-deck` → `/mnt/d/awesome-html-scrolline-deck` (9ab3ee3)
산출 덱: `/mnt/d/scrolline-judge-a/deck` (그대로 보존)
일자: 2026-09-20

---

## 1. 판정

**PASS — "SKILL.md만 읽고 재현 가능"**

주제 "사내 AI 도입 킥오프" 5장면 한국어 덱을 문서만 보고 처음부터 끝까지 만들었다.
`init` → `add` ×5 → `media`/`qr` → `check` → `npm run build` → `verify` 전 구간이 끊기지 않았고,
정적 6게이트 + 브라우저 6게이트 = **12개 전부 PASS**, exit 0.

단 아래 차단 1건(closing-qr 에셋 배선)은 문서를 그대로 믿은 사용자가
**오류 메시지 없이 QR 없는 마지막 장면을 출고하게 만든다.** 재현 자체는 성공했으나 이 항목은 수정 대상이다.

---

## 2. 차단 (blockers)

### B1. `add closing-qr --url` 이 아무 일도 하지 않는다 (무경고 무시)

`references/techniques.md:144`

```
(`scrolline add closing-qr --url <site>` generates it); `images[1]` is an
```

실제 실행:

```
node ~/.claude/skills/scrolline-deck/scripts/cli.mjs add closing-qr . --id 05-closing \
  --kicker "다음 걸음" --title "감사합니다" --url "https://example.com/ai-kickoff" --lines "..."
→ Added 05-closing (closing-qr, pin 200vh)     # exit 0
→ deck.json 05-closing.assets.images == []     # QR 생성 안 됨, public/ 에 파일 없음
```

원인: `scripts/cmd/add.mjs` 에 `url` 문자열이 **0건**이다.

```
$ grep -n "url" scripts/cmd/add.mjs
(출력 없음)
```

`parseFlags` 가 미지원 플래그를 거르지 않아(`add.mjs:99`) 경고도 나지 않는다.
사용자는 성공 메시지를 받고 QR 없는 덱을 얻는다.

### B2. `qr` 명령에 `--scene` 이 없어 deck.json 배선이 끊긴다

`SKILL.md:39-44` 는 4절 "에셋"에서 `frames` · `media` · `qr` 세 명령을 나란히 놓고,
바로 아래에 "`--scene`를 주면 deck.json의 `frames`·`count`·`critical`·`images`가 자동으로 채워진다"고 적었다.
그러나 `qr` 만 `--scene` 을 받지 않는다.

`scripts/cmd/qr.mjs:7-8` — 읽는 플래그는 `url` 과 `out` 뿐이고 deck.json 을 열지 않는다.

```
node .../cli.mjs qr --url "https://example.com/ai-kickoff" --out public/media/05-closing/qr.svg
→ public/media/05-closing/qr.svg — QR for ... (currentColor)   # 파일은 생김
→ deck.json 05-closing.assets.images 는 여전히 []              # 등록 안 됨
```

B1 과 B2 가 겹쳐 **문서가 제시한 두 경로 모두 QR을 장면에 붙이지 못한다.**
결국 deck.json 을 손으로 고쳐야 했다(문서에 없는 절차).

```js
// 심사자가 수동 수행한 우회
s.assets.images = ['/media/05-closing/qr.svg'];
d.links = { site: 'https://example.com/ai-kickoff' };
```

이 수동 편집 후에야 `check` S0 와 `verify` G6 가 QR을 인식했다.

---

## 3. 주의 (notes)

### N1. CLI 호출 경로가 문서에 없다

`SKILL.md:33-52` 는 전부 `node scripts/cli.mjs …` 상대 경로다.
스킬로 설치된 사용자의 cwd 는 레포가 아니므로 그대로 치면 실패한다.
절대 경로(`node ~/.claude/skills/scrolline-deck/scripts/cli.mjs`)나
`npm link` 안내가 SKILL.md 어디에도 없다.

덧붙여 `init` 이 출력하는 다음 단계 안내는 `scrolline add …` 라고 적지만
`scrolline` 바이너리는 PATH 에 없다(`package.json` 의 `bin` 은 레포 로컬).

### N2. sharp 부재 시 문서화된 에셋 규칙이 조용히 깨진다

`references/techniques.md` 에셋 표는 "Images — webp, 최장변 ≤1600px" 을 규칙으로 못 박는다.
그러나 레포 `node_modules` 에 sharp 가 없어 `media` 가 변환 없이 복사만 한다.

`scripts/cmd/media.mjs:33` `try { sharp = (await import('sharp')).default; } catch {}`
→ 실행 결과 `— copied as-is (install sharp for webp conversion)` ×5

즉 PNG 를 넣으면 PNG 인 채로 덱에 들어가고 리사이즈도 없다. 게이트는 잡지 않는다(S0 는 경로 존재만 확인).
심사자는 ImageMagick 으로 미리 webp 1100×1400 을 만들어 회피했다. `package.json` 에 sharp 가
optionalDependency 로도 없다.

### N3. `deck.json` 의 `theme.accent` 는 소비처가 없다

`init --style dark` 가 `theme.accent: "#5e6ad2"` 를 써넣고 스키마도 통과시키지만,
엔진은 `theme.style` 만 읽는다.

`src/engine/deck.js:122` `if (deck.theme?.style) document.documentElement.dataset.theme = deck.theme.style;`
→ `accent` 문자열을 읽는 코드가 엔진 전체에 없다. 색은 `src/tokens.css:9-11` 의
`--accent-1/2/3` 하드코딩 값만 쓴다. 사용자가 accent 를 바꿔도 화면이 변하지 않는다(무반응 설정).

### N4. kinetic-titles — 블록 01 번호가 제목에 깔린다 (템플릿 결함, 견본에도 재현)

`qa/01-kickoff-30.jpg`, `qa/01-kickoff-55.jpg` 에서 블록 01 의 `01` 배지가
덱 제목 "오늘 정할 세 가지"의 글자 "늘" 아래 파묻혀 읽히지 않는다.
02·03 배지는 정상 표시된다.

기하학적 원인:
- `templates/scenes/kinetic-titles/scene.js:28` `y: 14 + t * 54` → 첫 블록이 뷰포트 상단 14%
- `templates/scenes/kinetic-titles/scene.css:7` `.kt__head-copy { top: clamp(32px, 7vh, 88px) }` + 키커 + 대형 제목

두 요소가 900px 높이에서 필연적으로 겹친다. **카피 길이와 무관한 고정 결함**이다.

동일 증상이 출하된 견본에도 있다 — `examples/sample-deck/qa/03-arc-55.jpg` 의
"진입 · 홀드 · 퇴장" 제목 아래 `01` 배지가 같은 방식으로 묻혀 있다.

### N5. kinetic-titles — 대각선 라인이 마지막 블록 글자를 관통한다 (견본에도 재현)

`scene.js:55-56` 이 라인 경유점을 블록 좌상단 기준 `(x+8, y+6)` 로 잡는다.
이 좌표가 블록 제목 글자 **내부**라서, 선과 그 끝의 head 마커가 글자 위에 얹힌다.

`qa/01-kickoff-55.jpg` — 붉게 강조된 "언제부터"의 "부" 자 안에 파란 head 마커 얼룩이 박혀 있다.
`qa/01-kickoff-30.jpg` — 흰 대각선이 같은 글자를 가로지른다.
견본 `examples/sample-deck/qa/03-arc-55.jpg` 의 "퇴장 75–100%" 도 동일.

### N6. closing-qr — 홀드 55%에 "처음부터 다시" 링크가 없다

`references/techniques.md` closing-qr 절은 홀드 프레임을
"thanks set, QR drawn, URL typed out, **the restart link showing**" 으로 규정한다.
실측은 55%에 링크가 없고 85%에서야 나타난다.

- `qa/05-closing-55.jpg` — 키커·제목·QR·URL 4요소, 재시작 링크 없음
- `qa/05-closing-85.jpg` — "처음부터 다시" 표시됨

G6(가시 ≥3)은 통과하므로 게이트가 잡지 못한다. 문서 규격과 구현이 어긋난다.

### N7. closing-qr — 조판이 화면 왼쪽 40%에 몰린다

`qa/05-closing-55.jpg` 1440px 폭 기준 모든 요소가 x≈95–555 구간에 있고 오른쪽 60%가 빈다.
박스는 없으나(원칙 5 위반 아님) "사람들이 사진 찍는 마지막 화면"치고 무게중심이 심하게 치우친다.

### N8. paper-assembly — 부채꼴이 제목 축에서 오른쪽으로 벗어난다

`qa/03-cases-55.jpg` — 제목 "지난 분기에 나온 초안 38건"은 x=720 중앙 정렬인데
4장 묶음은 x≈520–1295, 중심 x≈907. 약 185px 우측 이탈로 두 축이 어긋나 보인다.

### N9. paper-assembly — 진입 30%에 어두운 둥근 덩어리가 보인다

`qa/03-cases-30.jpg` — 아직 도착하지 않은 페이지들의 드롭섀도가 겹쳐,
거의 검은 배경 위에 더 어두운 둥근 사각형 덩어리로 뭉친다.
55%에서는 사라지는 진입 구간 한정 잔상이지만, 원칙 5(박스 금지)의 인상을 준다.

### N10. odometer-stats — 수평선이 한글 접미사 글자를 관통한다

`qa/04-numbers-55.jpg` — 금색 horizon 선이 "건"·"%"·"시간" 글자 중간(y≈553)을 가로지른다.
다만 **한글 글리프 잘림은 없다.** 문서가 경고한 1.04em 클립 이슈는 실제로 방어되어
"건"·"시간"의 받침과 디센더가 온전히 나온다. 이 항목은 합격.

### N11. 긍정 확인 사항

- `verify` 는 `dist/` 가 없으면 **자동으로 `vite build` 를 먼저 돌린다.** SKILL.md 가 6절(verify) → 7절(build) 순서라 역순 위험이 있었으나 실제로는 끊기지 않는다(실측: dist 삭제 후 verify → 자동 빌드 후 12게이트 PASS).
- Playwright 를 전역 경로에서 스스로 찾았다 — `playwright: /home/seunghyeong/.npm-global/lib/node_modules/playwright/index.js`. 별도 설정 불필요.
- `kinetic-titles` 의 `--lines` 파이프 충돌은 문서(`techniques.md`)의 인용 경고대로 ` // ` 형식으로 회피되어 3블록 × 2불릿이 정확히 파싱됐다.
- `odometer-stats` 의 `38건 분기 초안` 식 "접미사 붙여쓰기" 규칙이 문서대로 동작했다.
- `anatomy-rows` 의 `Label: sentence` 4행이 전부 열리고 커넥터 4개가 그려졌다.
- 한국어 조판 전반에 글리프 잘림 0건.

---

## 4. 실행한 명령 전문

```bash
# 문서 읽기
cat ~/.claude/skills/scrolline-deck/SKILL.md
cat /mnt/d/awesome-html-scrolline-deck/references/techniques.md
sed -n '1,60p' /mnt/d/awesome-html-scrolline-deck/references/choreography.md
node ~/.claude/skills/scrolline-deck/scripts/cli.mjs --help

# Part A — 생성
rm -rf /mnt/d/scrolline-judge-a && mkdir -p /mnt/d/scrolline-judge-a
CLI=~/.claude/skills/scrolline-deck/scripts/cli.mjs

node $CLI init /mnt/d/scrolline-judge-a/deck \
  --title "사내 AI 도입 킥오프" --subtitle "무엇을, 누가, 언제부터" \
  --style dark --presenter "김승형" --lang ko

cd /mnt/d/scrolline-judge-a/deck

node $CLI add kinetic-titles . --id 01-kickoff --kicker "2026 사내 AI 도입" \
  --title "오늘 정할 세 가지" \
  --lines "무엇을 // 반복 문서 작업 · 고객 응대 초안|누가 // 팀별 파일럿 2명 · 보안 검토 1명|언제부터 // 10월 파일럿 · 1월 전사" \
  --notes "..."

node $CLI add anatomy-rows . --id 02-frame --kicker "도입 구조" \
  --title "킥오프 한 장을 뜯어보면" \
  --lines "업무 선정: …|데이터 경계: …|검수 책임: …|확산 경로: …" --notes "..."

node $CLI add paper-assembly . --id 03-cases --kicker "이미 쌓인 것" \
  --title "지난 분기에 나온 초안 38건" --lines "전부 사람이 다시 손봤다. …" --notes "..."

node $CLI add odometer-stats . --id 04-numbers --kicker "숫자로" \
  --title "지금 우리가 쓰는 시간" \
  --lines "38건 분기 초안|62% 재작성 비율|14시간 주당 절감 목표" --notes "..."

node $CLI add closing-qr . --id 05-closing --kicker "다음 걸음" --title "감사합니다" \
  --url "https://example.com/ai-kickoff" --lines "example.com/ai-kickoff" --notes "..."   # --url 무시됨 (B1)

# 에셋 — 자작 플레이스홀더 (ImageMagick 6.9.12, libwebp 1.3.2)
convert -size 1100x1400 xc:white -draw "…" -quality 82 ph-artefact.webp   # ×5 (문서 페이지 목업)

node $CLI media <scratch>/ph-artefact.webp --scene 02-frame
node $CLI media <scratch>/ph-doc-{1,2,3,4}.webp --scene 03-cases          # ×4
node $CLI qr --url "https://example.com/ai-kickoff" --out public/media/05-closing/qr.svg

# deck.json 수동 수정 (B1+B2 우회, 문서에 없는 절차)
node -e "…s.assets.images=['/media/05-closing/qr.svg']; d.links={site:'…'}…"

# 검증
node $CLI check .
npm install
npm run build
node $CLI verify .
node $CLI storyboard .

# 빌드 선행 없이 verify 되는지 실측 (N11)
mv dist <scratch>/dist-bak && node $CLI verify .

# Part B — 네거티브 픽스처
cd /mnt/d/awesome-html-scrolline-deck
for f in bad-duration bad-hex-color bad-id bad-var-tween good; do
  node scripts/cli.mjs check "tests/fixtures/$f" >/dev/null 2>&1; echo "$f -> exit=$?"
done
```

---

## 5. 게이트 결과와 확인한 캡처

### check (정적) — `/mnt/d/scrolline-judge-a/deck`, exit 0

```
PASS  S0    장면 5개 · 스키마(scripts/lib/schema.mjs) 통과 · 에셋 경로 이상 없음
PASS  G1    장면 모듈 5개 계약 충족
PASS  G2    장면 5개 · 최장 타임라인 0.980
PASS  G3    scene.js 5개에 var( ) tween 없음
PASS  G4    파일 9개 · 직접 스크롤 이동 없음
PASS  LINT  장면 5개 린트 통과 (L1·L2·L3)
통과 6개
```

### verify (브라우저) — exit 0

```
vite preview http://127.0.0.1:42497/
playwright: /home/seunghyeong/.npm-global/lib/node_modules/playwright/index.js

PASS  G5    핀 장면 5개 전부 ±2px 이내
PASS  G6    장면 5개 · 캡처 15장 · 최소 가시 7(03-cases) · qa/
PASS  G7    키 착지 4회 · 최대 오차 0px
PASS  G8    주행 중 오류 없음
PASS  G9    가로 넘침 없음 (1440 · 390)
PASS  G10   핀 0개 · 장면 5개 정지 프레임 완성
통과 12개
```

### npm run build

```
vite v6.4.3 building for production...
✓ 32 modules transformed.
dist/index.html                   1.05 kB │ gzip:  0.57 kB
dist/assets/index-D0FwLbA3.css   25.17 kB │ gzip:  5.30 kB
dist/assets/index-CFSp8uBf.js   153.06 kB │ gzip: 58.35 kB
✓ built in 796ms
```

### 눈으로 읽은 캡처

전 장면 55% (요구 항목) + 판정에 필요한 추가분.

| 캡처 | 홀드 완성 | 한글 잘림 | 박스 구성 | 비고 |
|---|---|---|---|---|
| `qa/01-kickoff-55.jpg` | 예 (3블록·대각선·강조 완료) | 없음 | 없음 | N4 배지 매몰, N5 선 관통 |
| `qa/02-frame-55.jpg` | 예 (4행 개방·커넥터 4) | 없음 | 없음 | 결함 없음 |
| `qa/03-cases-55.jpg` | 예 (4장 부채꼴·제목·리드) | 없음 | 없음 | N8 우측 이탈 |
| `qa/04-numbers-55.jpg` | 예 (릴 3·라벨 3·horizon) | **없음 (건·시간 받침 온전)** | 없음 | N10 선이 글자 통과 |
| `qa/05-closing-55.jpg` | 부분 (재시작 링크 누락) | 없음 | 없음 | N6, N7 |
| `qa/01-kickoff-30.jpg` | 진입 중, 강조 블록 01 | 없음 | 없음 | 30%에 이미 조판 완료 |
| `qa/03-cases-30.jpg` | 진입 중, 1장 도착 | 없음 | **어두운 덩어리** | N9 |
| `qa/05-closing-85.jpg` | 퇴장 중 | 없음 | 없음 | "처음부터 다시" 확인 |
| `examples/sample-deck/qa/03-arc-55.jpg` | — | 없음 | 없음 | N4·N5 견본 재현 대조 |

요약: 5장면 전부 55%에서 **완성된 홀드 프레임**이 서 있고, **한글 글리프 잘림 0건**,
**박스·카드 구성 0건**. 05-closing 만 문서가 규정한 홀드 요소 4개 중 1개(재시작 링크)가 빠진다.

---

## 6. Part B — 네거티브 픽스처

`cd /mnt/d/awesome-html-scrolline-deck && node scripts/cli.mjs check tests/fixtures/<name>`

| 픽스처 | exit | 실패 게이트 | 기대 | 판정 |
|---|---|---|---|---|
| `bad-id` | 1 | **G1** | G1 | 일치 |
| `bad-duration` | 1 | **G2** | G2 | 일치 |
| `bad-var-tween` | 1 | **G3** | G3 | 일치 |
| `bad-hex-color` | 1 | **LINT** | LINT | 일치 |
| `good` | 0 | — | 0 | 일치 |

**Part B 전항 통과.** 메시지도 원인을 정확히 지목한다.

```
bad-id        · 01-hero: default.id가 폴더명과 다릅니다 — id="01-hero-typo"
bad-duration  · 01-hero: 타임라인 길이 2.050 > 1.001 (가장 늦게 끝나는 항목: to 0.750→2.050)
bad-var-tween · 01-hero:22 — .to() 문자열 인자에 var( ) 사용: "inset(0 0 0 var(--wipe))"
bad-hex-color · L1 01-hero/scene.css 8행 color: hex 색 리터럴 (#8b8b93)
```

각 픽스처는 실패 1건만 내고 나머지 5게이트는 PASS — 게이트 간 오염이 없다.

---

## 7. 수정 우선순위 제안

1. **B1/B2** — `add closing-qr --url` 을 실제로 구현하거나 `techniques.md:144` 에서 그 문장을 삭제하고, `qr --scene` 을 추가한다. 최소한 미지원 플래그는 경고를 내야 한다.
2. **N4/N5** — `kinetic-titles` 의 첫 블록 y 시작값(`scene.js:28`)과 라인 경유점 오프셋(`scene.js:55`)을 조정한다. 출하 견본에도 있는 결함이라 스킬의 첫인상을 깎는다.
3. **N1** — SKILL.md 에 절대 경로 호출 예시를 넣는다. 스킬 사용자가 가장 먼저 막힐 지점이다.
4. **N3** — `theme.accent` 를 엔진에서 소비하거나 `init` 이 쓰지 않게 한다.
5. **N2** — sharp 를 optionalDependency 로 선언하고, 미설치 시 webp 규칙 위반임을 `check` 가 경고한다.
6. **N6** — `closing-qr` 의 재시작 링크를 0.75 이전으로 당기거나 문서 홀드 규격에서 뺀다.
