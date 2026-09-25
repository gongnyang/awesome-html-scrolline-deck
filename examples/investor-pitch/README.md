# 모아: 동네 가게의 빈 시간을 채우다

초기 투자 검토용 가상 사업 제안

## 장면 흐름

| # | scene id | 장면 템플릿 | 발표에서 하는 일 |
|---:|---|---|---|
| 1 | `01-hero` | `frame-scrub-hero` | 예약 가능한 자리를 채웁니다 |
| 2 | `02-problem` | `question-reveal` | 수요가 없는 게 아니라, 보이지 않습니다 |
| 3 | `03-market` | `chart-reveal` | 초기 공략 가능 점포 2,400곳 |
| 4 | `04-product` | `product-rotation` | 당일 좌석과 메뉴를 간단히 등록 |
| 5 | `05-model` | `system-map` | 가게 공급 → 근거리 노출 → 예약 결제 → 재방문 |
| 6 | `06-traction` | `odometer-stats` | 42개 가게 · 예약 1,860건 · 재방문 31% |
| 7 | `07-economics` | `annotated-chart` | 첫 예약 획득비 9,200원 → 재방문 고객 3,100원 |
| 8 | `08-competition` | `option-matrix` | 지도 검색 · 쿠폰 앱 · 모아 |
| 9 | `09-ask` | `timeline-roadmap` | 서울 3개 권역 · 점포 500곳 · 재방문 40% |
| 10 | `10-close` | `closing-qr` | 빈 시간을 반복 매출로 바꿀 수 있을까요? |

각 장면에는 발표자 노트가 포함되어 있습니다. 실행 중 `N` 키를 누르면 현재 장면의 노트를 열 수 있습니다. 화살표 키나 스페이스로 장면을 이동하고, `F`로 전체 화면을 전환합니다.

## 실행

저장소 루트에서 의존성을 설치한 뒤 다음 명령을 실행합니다.

```sh
cd examples/investor-pitch
pnpm install
pnpm run dev
```

## 발표 자료 안내

브랜드, 성과 지표, 시장 수치, 일정은 모두 발표 설계를 보여 주기 위한 가상 사례입니다.
