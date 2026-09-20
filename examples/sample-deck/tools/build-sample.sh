#!/usr/bin/env bash
# build-sample.sh — rebuild examples/sample-deck from the CLI, the way the skill says to.
#
# Assets (frames, plates) are generated separately by tools/make-frames.mjs and
# tools/make-posters.mjs and are left alone here.
#
#   bash examples/sample-deck/tools/build-sample.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DECK="$ROOT/examples/sample-deck"
CLI="node $ROOT/scripts/cli.mjs"

cd "$ROOT"

# A clean scaffold: scene folders and deck.json are regenerated, assets survive.
rm -rf "$DECK/src/scenes" "$DECK/data" "$DECK/src/engine"

$CLI init "$DECK" \
  --title "Scrolline Deck" \
  --subtitle "스크롤로 굴리는 시네마 HTML 발표자료" \
  --style dark \
  --lang ko \
  --presenter "gongnyang" \
  --force

# The scaffold ignores qa/ because captures are build output. This deck is the
# exception: its captures are the README hero images, so they stay tracked.
python3 - "$DECK/.gitignore" <<'PY'
import sys
p = sys.argv[1]
lines = [l for l in open(p, encoding='utf-8').read().splitlines() if l.strip() != 'qa/']
lines.append('# qa/ is tracked here on purpose — the captures are the README hero images.')
open(p, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
PY

$CLI add frame-scrub-hero "$DECK" \
  --id 01-hero \
  --kicker "SCROLLINE DECK" \
  --title "스크롤이 장면을 민다" \
  --lines "슬라이드는 컷으로 넘어간다. 이 덱은 넘어가지 않는다.|Scroll-driven cinematic HTML presentation" \
  --notes "첫 문장 하나만 말한다. 프레임이 끝까지 지나갈 때까지 기다렸다가 다음 장면으로 넘어간다."

$CLI add word-relay "$DECK" \
  --id 02-relay \
  --kicker "무엇인가" \
  --title "휠 한 칸 → 장면 진행률 한 칸" \
  --lines "장면은 화면에 고정된 채 0에서 1까지 밀린다|속도는 발표자 손에 남는다" \
  --notes "단어가 하나씩 도착할 때마다 소리 내어 읽는다. 마지막 단어에서 멈추고 다음 장면을 예고한다."

$CLI add kinetic-titles "$DECK" \
  --id 03-arc \
  --kicker "장면 문법" \
  --title "진입 · 홀드 · 퇴장" \
  --lines "진입 0–30% // 장면이 들어온다 · 제목이 선다|홀드 30–75% // 완성 프레임이 서 있다 · 말은 여기서 한다|퇴장 75–100% // 다음 장면에 자리를 넘긴다" \
  --notes "세 박자를 한 번씩 짚는다. 홀드 구간이 발표자의 시간이라는 점만 남기면 된다."

$CLI add horizontal-gallery "$DECK" \
  --id 04-gallery \
  --kicker "기법" \
  --title "열둘 중 여섯" \
  --lines "세로로 굴리면 가로로 흐른다" \
  --notes "판을 하나씩 짚지 않는다. 레일이 지나가는 동안 기법이 열두 개이고 고르는 기준이 있다는 것만 말한다."

$CLI add odometer-stats "$DECK" \
  --id 05-numbers \
  --kicker "숫자" \
  --title "네 숫자로 요약된다" \
  --lines "12 장면 기법|10 하드 게이트|1 타임라인|0 박스" \
  --notes "네 숫자가 다 서면 한 문장으로 묶는다. 게이트가 exit-code라서 통과 못 하면 다음 단계로 못 간다는 점."

$CLI add closing-qr "$DECK" \
  --id 06-closing \
  --kicker "가져가기" \
  --title "레포에서 바로 시작" \
  --lines "github.com/gongnyang/awesome-html-scrolline-deck" \
  --notes "QR을 띄워 둔 채로 질문을 받는다. 화면을 넘기지 않는다."

# QR for the closing scene
$CLI qr --url "https://github.com/gongnyang/awesome-html-scrolline-deck" --out "$DECK/public/media/qr.svg" \
  || echo "warning: qr command unavailable — public/media/qr.svg left as is"

# Wire the generated assets into deck.json (a real deck gets these from
# `scrolline frames --scene` and `scrolline media --scene`).
node "$DECK/tools/wire-assets.mjs"

$CLI storyboard "$DECK"
echo
echo "Next: cd examples/sample-deck && npm install && npm run build"
