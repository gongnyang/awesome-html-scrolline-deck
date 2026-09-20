#!/usr/bin/env bash
# build-deck.sh — 이 덱을 CLI 로 처음부터 세우는 순서를 그대로 기록한 스크립트.
#
#   bash tools/build-deck.sh /tmp/annual-report-rebuild
#
# 인자로 받은 빈 폴더에만 쓴다. 정본 덱(examples/annual-report)을 덮어쓰지 않는다 —
# 정본에는 이 순서 뒤에 손으로 더한 것이 있기 때문이다(아래 "그 다음" 참고).
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "사용법: bash tools/build-deck.sh <새로 만들 폴더>" >&2
  exit 2
fi

OUT="$1"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"
CLI="node $REPO/scripts/cli.mjs"

if [ -e "$OUT" ] && [ -n "$(ls -A "$OUT" 2>/dev/null)" ]; then
  echo "폴더가 비어 있지 않습니다: $OUT" >&2
  exit 2
fi

$CLI init "$OUT" \
  --title "2026 연간 성과 보고" \
  --subtitle "밀물 주식회사 · 가상 데이터 기반 샘플 덱" \
  --style dark \
  --lang ko \
  --presenter "재무·전략본부"

$CLI add word-relay "$OUT" \
  --id 01-open \
  --kicker "2026 연간 성과 보고" \
  --title "규모를 줄여 → 이익을 남겼다" \
  --lines "구독 전환과 물류 통합, 두 가지만 했다|밀물 주식회사 · 2026 회계연도 결산 (가상 데이터)" \
  --notes "첫 단어에서 한 번 멈춘다. 두 번째 단어가 도착하면 그것이 올해의 한 문장이라고 말하고 넘어간다. 수치는 전부 예시용 가상 데이터라는 점을 여기서 한 번 밝힌다."

$CLI add anatomy-rows "$OUT" \
  --id 02-anatomy \
  --kicker "분기 실적" \
  --title "여덟 분기를 한 장으로" \
  --lines "매출: 여덟 분기 내리 올랐지만 4분기 증가폭은 절반으로 꺾였다|이익률: 원가를 다시 짠 2026년 2분기부터 두 자리로 올라섰다|전환점: 구독 매출이 절반을 넘은 시점과 이익률 반등이 겹친다|비용: 물류를 한 곳으로 모아 고정비 비중이 4.2%p 내려갔다" \
  --notes "차트를 먼저 3초 보여준 뒤 행을 하나씩 읽는다. 네 번째 행에서 다음 장면의 숫자를 예고한다."

$CLI add odometer-stats "$OUT" \
  --id 03-numbers \
  --kicker "핵심 지표" \
  --title "네 숫자로 본 한 해" \
  --lines "1482억 연결 매출 (+8.3%)|12% 영업이익률|38만 구독 가구|17개 통합 물류 거점" \
  --notes "릴이 전부 멈춘 뒤에 말을 시작한다. 12%는 연간 11.9%를 반올림한 값이고, 분기별 숫자는 앞 장면 차트에 있다. 매출보다 이익률을 먼저 짚고, 구독 가구 수가 이익률을 만든 원인이라고 연결한다."

$CLI add paper-assembly "$OUT" \
  --id 04-stack \
  --kicker "부문별 보고" \
  --title "여섯 장의 부속 보고서" \
  --lines "본문 한 권 뒤에 붙는 부속 자료 여섯 장" \
  --notes "여섯 장이 모이는 동안 말하지 않는다. 부채꼴이 완성되면 각 장이 어느 부문인지만 이름을 부른다."

$CLI add wipe-transform "$OUT" \
  --id 05-shift \
  --title "사업 구조가 바뀌었다" \
  --lines "2025 — 한 갈래로 팔았다|2026 — 세 갈래로 나눴다|2027 — 물류 자동화가 남았다" \
  --notes "와이프가 지나가는 동안 손을 든다. 2025 구조도와 2026 구조도의 차이는 갈래 수가 아니라 재구매 비중이라고 말한다."

$CLI add closing-qr "$OUT" \
  --id 06-close \
  --kicker "자료 받기" \
  --title "감사합니다" \
  --url "https://github.com/gongnyang/awesome-html-scrolline-deck" \
  --notes "QR을 띄운 채로 질문을 받는다. 이 덱은 스크롤라인 덱 스킬의 예제이고 모든 수치는 가상 데이터라는 점을 마지막으로 다시 밝힌다."

cat <<'NEXT'

여기까지가 CLI 가 해 주는 부분이다. 정본 덱은 이 위에 다음을 더했다.

  1. src/tokens.css        숲빛 캔버스 + 앰버·민트, 제목 명조로 교체
  2. tools/make-all.mjs    인포그래픽 10장 생성 (sharp)
  3. tools/wire-assets.mjs deck.json 에 그림 물리기
  4. src/scenes/*/scene.css, scene.js   장면별 손질 (주석으로 이유를 적어 뒀다)
  5. npm install && npm run build && check → verify

NEXT
