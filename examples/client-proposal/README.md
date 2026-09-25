# 온결 리테일 고객 제안

매장 대기 경험 개선 90일 파일럿 제안 · 가상 사례

## 장면 흐름

| # | scene id | 장면 템플릿 | 발표에서 하는 일 |
|---:|---|---|---|
| 1 | `01-hero` | `frame-scrub-hero` | 매장 경험이 달라집니다 |
| 2 | `02-challenge` | `question-reveal` | 대기 8분을 넘으면 이탈이 늘어난다 |
| 3 | `03-evidence` | `annotated-chart` | 피크 시간 대기 중앙값 8.4분 |
| 4 | `04-journey` | `step-flow` | 탐색 → 상담 → 결제 |
| 5 | `05-solution` | `system-map` | 모바일 대기표 · 상담 슬롯 · 직원 알림 |
| 6 | `06-pilot` | `timeline-roadmap` | 기준 측정 2주 · 적용 8주 · 평가 2주 |
| 7 | `07-impact` | `before-after` | 대기 중앙값 8.4분 → 5분 이하 |
| 8 | `08-options` | `option-matrix` | 라이트 · 표준 · 확장 |
| 9 | `09-governance` | `document-proof` | 고객 식별 정보 없이 대기 흐름만 집계 |
| 10 | `10-close` | `action-request` | 3개 점포 · 90일 · 공동 평가 |

각 장면에는 발표자 노트가 포함되어 있습니다. 실행 중 `N` 키를 누르면 현재 장면의 노트를 열 수 있습니다. 화살표 키나 스페이스로 장면을 이동하고, `F`로 전체 화면을 전환합니다.

## 실행

저장소 루트에서 의존성을 설치한 뒤 다음 명령을 실행합니다.

```sh
cd examples/client-proposal
pnpm install
pnpm run dev
```

## 발표 자료 안내

브랜드, 성과 지표, 시장 수치, 일정은 모두 발표 설계를 보여 주기 위한 가상 사례입니다.
