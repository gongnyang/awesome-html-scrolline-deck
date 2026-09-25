# 서울, 해질녘 한 바퀴

노을에서 야경까지 이어지는 다섯 정거장 산책

## 장면 흐름

| # | scene id | 장면 템플릿 | 발표에서 하는 일 |
|---:|---|---|---|
| 1 | `01-hero` | `frame-scrub-hero` | 서울을 천천히 걷는 저녁 |
| 2 | `02-route` | `map-route` | 5.8km · 다섯 정거장 · 걷기 약 1시간 40분 |
| 3 | `03-stops` | `timeline-roadmap` | 강변의 빛에서 시장의 온기까지 |
| 4 | `04-postcards` | `image-gallery` | 강변 · 돌담 · 골목 · 산자락 · 시장 · 물길 |
| 5 | `05-pause` | `parallax-video` | 청계천에서 잠깐 쉬어 갑니다 |
| 6 | `06-route-proof` | `document-proof` | 운영 시간 · 경사 · 야간 통행 · 날씨 |
| 7 | `07-choices` | `option-matrix` | 전체 걷기 · 시장 중심 · 강변 중심 |
| 8 | `08-access` | `before-after` | 인왕산 자락길 포함 / 서촌에서 청계천으로 우회 |
| 9 | `09-packing` | `step-flow` | 편한 신발 · 물 · 귀가 경로 |
| 10 | `10-close` | `closing-qr` | 서울 해질녘 산책 가이드 |

각 장면에는 발표자 노트가 포함되어 있습니다. 실행 중 `N` 키를 누르면 현재 장면의 노트를 열 수 있습니다. 화살표 키나 스페이스로 장면을 이동하고, `F`로 전체 화면을 전환합니다.

## 실행

저장소 루트에서 의존성을 설치한 뒤 다음 명령을 실행합니다.

```sh
cd examples/city-guide
pnpm install
pnpm run dev
```

## 발표 자료 안내

경로·운영 정보는 샘플이며 방문 당일 공식 교통·시설 정보를 확인해야 합니다.
