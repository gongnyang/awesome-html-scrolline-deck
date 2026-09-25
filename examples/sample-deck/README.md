# 한 장씩 넘기지 않는 발표

스크롤이 장면을 움직이는 발표 설계 강의

## 장면 흐름

| # | scene id | 장면 템플릿 | 발표에서 하는 일 |
|---:|---|---|---|
| 1 | `01-hero` | `frame-scrub-hero` | 한 장씩 넘기지 않는 발표 |
| 2 | `02-question` | `question-reveal` | 좋은 발표는 다음 화면이 궁금해진다 |
| 3 | `03-claim` | `kinetic-titles` | 스크롤은 내용의 순서를 공간으로 바꾼다 |
| 4 | `04-agenda` | `agenda-path` | 문제에서 설계, 설계에서 검증까지 |
| 5 | `05-evidence` | `annotated-chart` | 한 주장에 한 시각 근거 |
| 6 | `06-flow` | `step-flow` | 보여주고, 머물고, 넘긴다 |
| 7 | `07-templates` | `horizontal-gallery` | 24개 장면은 서로 다른 발표 일을 한다 |
| 8 | `08-demo` | `frame-scrub-video` | 문장이 바뀔 때 화면도 바뀐다 |
| 9 | `09-checklist` | `option-matrix` | 읽힘 · 근거 · 조작 · 대체 화면 |
| 10 | `10-close` | `closing-qr` | 주장 하나를 장면 하나로 |

각 장면에는 발표자 노트가 포함되어 있습니다. 실행 중 `N` 키를 누르면 현재 장면의 노트를 열 수 있습니다. 화살표 키나 스페이스로 장면을 이동하고, `F`로 전체 화면을 전환합니다.

## 실행

저장소 루트에서 의존성을 설치한 뒤 다음 명령을 실행합니다.

```sh
cd examples/sample-deck
pnpm install
pnpm run dev
```

## 발표 자료 안내

모션 감소 환경에서도 각 장면의 주장과 안내 문구가 정지 화면에서 읽히도록 구성했습니다.
