# 도시의 그늘은 누구에게 충분한가

보행자 열 노출과 가로수 분포를 읽는 데이터 강의

## 장면 흐름

| # | scene id | 장면 템플릿 | 발표에서 하는 일 |
|---:|---|---|---|
| 1 | `01-hero` | `frame-scrub-hero` | 한낮의 보행로를 다시 보다 |
| 2 | `02-question` | `question-reveal` | 그늘까지의 거리가 보행 경험을 바꾼다 |
| 3 | `03-method` | `step-flow` | 보행로 분할 → 그늘 추정 → 보행량 가중 |
| 4 | `04-system` | `system-map` | 기온 · 그늘 면적 · 보행 시간 |
| 5 | `05-map` | `map-route` | 대학로 12개 블록 · 240개 보행 구간 |
| 6 | `06-findings` | `chart-reveal` | 그늘 보행 비율 09시 46% → 14시 28% |
| 7 | `07-annotation` | `annotated-chart` | 주거 블록과 상업 블록의 분포가 다르다 |
| 8 | `08-limits` | `document-proof` | 나무의 건강도 · 실제 체감 · 이동 목적 |
| 9 | `09-implications` | `before-after` | 그늘 취약 구간부터 현장 조사 |
| 10 | `10-close` | `closing-qr` | 질문과 토론 |

각 장면에는 발표자 노트가 포함되어 있습니다. 실행 중 `N` 키를 누르면 현재 장면의 노트를 열 수 있습니다. 화살표 키나 스페이스로 장면을 이동하고, `F`로 전체 화면을 전환합니다.

## 실행

저장소 루트에서 의존성을 설치한 뒤 다음 명령을 실행합니다.

```sh
cd examples/research-lecture
pnpm install
pnpm run dev
```

## 발표 자료 안내

지도, 표본, 수치는 강의 설명을 위한 합성 자료입니다. 실제 관측 결과나 연구 논문을 인용하지 않습니다.
