---
name: scrolline-deck
description: 발표자가 말하며 직접 스크롤해 진행하는 이미지 중심 HTML 스크롤 덱을 설계·제작·검증한다. Scrollytelling 발표, 시네마틱 웹덱, scroll-driven talk 요청과 기존 덱의 시각 서사 개선에 사용한다.
---

# Scrolline Deck

발표용 스크롤 덱은 슬라이드 카드를 세로로 쌓은 웹페이지가 아니다. 스크롤 위치가 이미지·카메라·도표·라벨의 상태와 공개 순서를 움직이고, 발표자는 핵심 화면에서 멈춰 설명한다. 스크롤은 내러티브 제어이자 발표자의 입력이다.

## 기본 실행

`references/workflow.md`대로 청중·발표 목적·시간·자료를 확인하고, 주장과 근거를 말할 순서로 장면화한다. 각 장면의 주장, 청중이 이해할 관계, 근거, 발표자의 행동, 스크롤 뒤 새로 알게 될 것을 먼저 기록한다. 그다음 `references/scene-ledger.md`에서 유형을 고르고 `references/scene-exemplars.md`의 완성 장면에서 해당 정보 관계를 어떻게 구현했는지 본다. 현재 카탈로그의 유형은 시각 승인 전 사용 후보이므로 실제 화면을 검수하지 않고 품질을 보증하지 않는다.

전체 덱에 일관된 스타일을 정하되, 모든 장면을 한 레이아웃에 가두지 않는다. 이미지가 장소·사람·물성·규모·변화를 보여주게 하고, 정확한 표기와 수치 및 출처는 HTML/SVG로 표현한다. 한 화면에 하나의 시각적 주도 요소를 두고, 제목·주장·라벨·근거·출처가 투사 화면에서 구분되는 위계를 만든다.

첫 한두 장면은 시작 1초 안에 큰 주장·의미 있는 이미지·결정적 수치 중 하나를 드러내 발표의 훅을 만든다. 상자가 순서대로 나타나는 것만으로 스크롤 박자를 채우지 않는다. 각 공개는 자료의 변화, 비교, 원인, 위치 또는 근거를 실제로 이해하게 해야 한다.

## 장면 계약

각 장면은 다음을 충족해야 한다.

- 어떤 발표 목적과 정보 관계에 적합한지, 쓰지 말아야 할 입력은 무엇인지 설명한다.
- 스크롤 각 구간에서 무엇이 바뀌고 그 변화로 무엇을 알게 되는지 정의한다.
- `pass`·`hold`·`scrub` 중 발표 행위에 맞는 속도를 고르고, 각 키보드 cue의 완성 화면에서 주장과 근거를 함께 읽을 수 있게 한다. 짧은 문구에 긴 고정 스크롤을 자동으로 주지 않는다.
- 투사 거리에서 제목·주장·라벨·값·출처를 읽을 수 있으며, 주장과 근거를 작은 글씨에 숨기지 않는다.
- `enter → speaker hold → exit`의 실제 화면을 1440×900·1920×1080 투사 화면, 약 390px 모바일, `prefers-reduced-motion`에서 확인한다. 좁은 화면은 의미 있는 읽기 순서를 유지하고 reduced-motion은 같은 핵심 정보를 정적으로 제공한다.

대표 제작물은 기존 템플릿을 필요하면 크게 고쳐 위 계약을 만족시킨다. 카탈로그의 항목 수나 다양한 이름은 품질 지표가 아니다. 실험 또는 미지원 유형을 생산 지원처럼 말하지 않는다.

## 제작과 승인

스토리보드와 시각 방향을 먼저 정의한 뒤 `node scripts/cli.mjs init <dir> --title <title>`로 시작한다. `scrolline add`에는 장면의 `--purpose`, `--claim`, `--relation`, `--reason`, `--evidenceStatus`, `--presenterAction`, `--visualChange`, `--pace`, `--notes`를 함께 전달해야 새 장면이 생성된다. 근거가 있으면 `--source`와 `--evidence`를 넣고, 생성 후 `data/deck.json`의 카피·에셋·cue 상태를 완성한다. 타임라인과 모듈 인터페이스는 `references/contract.md`를 따른다.

`node scripts/cli.mjs check <dir>`와 `node scripts/cli.mjs verify <dir> --strict`를 실행한다. 장면별 캡처를 투사 크기와 모바일에서 직접 검토하고 실제 브라우저로 휠·키·홀드·모션 감소를 리허설한다. 자동 게이트는 시각 품질을 보증하지 않는다. 합격·반려 기준은 `references/quality.md`를 따른다. 브라우저 검증을 건너뛰면 완료로 보고하지 않는다.

## 참조

- `references/workflow.md`: 이야기 구성, 스크롤 박자, 제작 루프
- `references/scene-ledger.md`: 목적·정보 관계 기반 라우팅 및 유형별 적합성/실패 판정
- `references/scene-exemplars.md`: 8개 덱의 완성 장면에서 가져온 주장·근거·전환의 실제 구현 사례
- `references/techniques.md`: 제작 지원 장면의 입력·진행·홀드·반응형 동작
- `references/quality.md`: 발표 거리 위계, 자동 게이트, 사람의 시각 판정
- `references/asset-direction.md`: 이미지 수급·방향·크롭·접근성
- `references/contract.md`: 장면 API와 엔진 규약
- `references/video-adaptation.md`: 승인한 장면을 홍보 쇼츠·실제 사례 스토리·교육 영상으로 옮기는 기준
