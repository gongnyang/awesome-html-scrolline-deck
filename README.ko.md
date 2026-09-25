# Scrolline Deck

완성 덱을 바탕으로 홍보 쇼츠, 출처를 밝힌 청계천 실제 사례 스토리, 장면 설계 교육 영상도 제작했습니다. 배포 갤러리의 **발표 장면을 영상으로** 영역에서 재생하고 한국어 자막을 내려받을 수 있습니다. 실제 사례 영상의 역사 장면은 AI 재구성으로 명시했습니다.

실제 피칭과 강의에 사용할 수 있는 스크롤 HTML 발표자료 제작 스킬이다. 발표자가 휠이나 키로 장면의 진입·완성·퇴장을 제어한다. 스킬은 발표 흐름을 설계하고, 25개 작동하는 장면 템플릿에서 목적에 맞는 구성을 골라 이미지 제작·검증·배포까지 돕는다.

[English](README.md) · [8개 덱 갤러리](https://gongnyang.github.io/awesome-html-scrolline-deck/) · [스킬 지침](SKILL.md) · [장면 카탈로그](references/techniques.md)

## 완성 덱 8개

각 덱은 발표자 노트를 갖춘 독립 정적 웹사이트다. 가상 브랜드와 수치는 덱에 표시한다.

| 덱 | 발표 목적 | 열기 |
|---|---|---|
| 스크롤텔링 강의 | 장면 문법과 제작 방법 설명 | [열기](https://gongnyang.github.io/awesome-html-scrolline-deck/sample-deck/) |
| 제품 출시 | 제품 키노트와 기능 근거 | [열기](https://gongnyang.github.io/awesome-html-scrolline-deck/product-launch/) |
| 연간 성과 | 이사회·투자자 성과 보고 | [열기](https://gongnyang.github.io/awesome-html-scrolline-deck/annual-report/) |
| 도시 가이드 | 동선 중심 브리핑 | [열기](https://gongnyang.github.io/awesome-html-scrolline-deck/city-guide/) |
| 투자 피치 | 문제·해결·시장·요청 | [열기](https://gongnyang.github.io/awesome-html-scrolline-deck/investor-pitch/) |
| 연구 강의 | 질문·근거·해석 | [열기](https://gongnyang.github.io/awesome-html-scrolline-deck/research-lecture/) |
| 고객 제안 | 사례·접근법·성과·다음 단계 | [열기](https://gongnyang.github.io/awesome-html-scrolline-deck/client-proposal/) |
| 공간 제안 | 풍부한 이미지로 구성한 미래 공공도서관 제안 | [열기](https://gongnyang.github.io/awesome-html-scrolline-deck/spatial-proposal/) |

## 시작하기

Node.js 20 이상이 필요하다. 브라우저 검증에는 Playwright와 Chromium도 필요하다.

```bash
git clone https://github.com/gongnyang/awesome-html-scrolline-deck.git
cd awesome-html-scrolline-deck
npm ci
node scripts/cli.mjs init my-deck --title "발표 제목" --lang ko
node scripts/cli.mjs add frame-scrub-hero --dir my-deck --id 01-open --title "핵심 주장"
cd my-deck && npm ci && npm run dev
```

기법을 고르기 전에 청중·목표·한 문장 주장·장면별 근거·시각 방향을 적는다. 이미지는 덱의 `public/media/`에 저장하고 문구, 출처, 발표자 노트는 `data/deck.json`에 넣는다. [저작 순서](references/workflow.md)와 [이미지 제작 지침](references/asset-direction.md)을 따른다. 예시 덱의 배열을 그대로 복사하지 않는다.

```bash
node scripts/cli.mjs check my-deck
node scripts/cli.mjs verify my-deck --strict --build
node scripts/cli.mjs storyboard my-deck
```

엄격 검증은 실제 브라우저에서 휠·키를 사용하고 모든 패키지 이미지를 디코딩하며 장면 진행률 30%·55%·85%를 캡처한다. Playwright가 없으면 실패한다. 캡처를 직접 읽는 기준은 [품질 지침](references/quality.md)에 있다. 덱 안의 에셋 경로는 배포 하위 경로에서도 작동하도록 해석된다.

`→`/Space 다음 장면, `←` 이전 장면, 숫자 키 장면 이동, `F` 전체 화면, `N` 발표자 노트, `P` 자동 진행이다. 여덟 덱의 엄격 검증 후 GitHub Pages 갤러리를 배포한다.

## 선택 근거

각 장면을 열기·설명·비교·증명·요청 같은 발표 역할로 고른다. 기술 발표의 [주장–시각 근거 구조 연구](https://pure.psu.edu/en/publications/assertion-evidence-slides-appear-to-lead-to-better-comprehension--2/)를 참고하되, 모든 장면을 같은 형식으로 만들지는 않는다. 25종은 사용 맥락을 포괄하기 위한 기준이며 연구가 제시한 최적 개수가 아니다. [W3C 모션 지침](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions)과 [반응형 이미지 지침](https://web.dev/learn/design/responsive-images)을 정지 화면과 로딩 전략에 반영한다.

MIT 라이선스.
