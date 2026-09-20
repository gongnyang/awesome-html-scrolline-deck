#!/usr/bin/env bash
# build-deck.sh — rebuild examples/product-launch from the CLI, the way the skill says to.
#
# Scene folders, data/deck.json and the engine copy are regenerated; everything
# under public/ is left alone unless you ask for it:
#
#   bash examples/product-launch/tools/build-deck.sh              # scaffold + copy only
#   ASSETS=1 bash examples/product-launch/tools/build-deck.sh     # also redraw every asset
#
# Redrawing assets needs sharp and ffmpeg:
#   NODE_PATH=/mnt/d/2026-06-site/node_modules   (any directory that has sharp)
#   FFMPEG=/path/to/ffmpeg                       (only if ffmpeg is not on PATH)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DECK="$ROOT/examples/product-launch"
CLI="node $ROOT/scripts/cli.mjs"

cd "$ROOT"

rm -rf "$DECK/src/scenes" "$DECK/data" "$DECK/src/engine"

$CLI init "$DECK" \
  --title "Nimbus" \
  --subtitle "무선 헤드폰 런칭 — 소음·무게·시간을 지운다" \
  --style light \
  --lang ko \
  --presenter "Nimbus Audio" \
  --force

# The scaffold ignores qa/. Here the captures are the review material, so they stay tracked.
python3 - "$DECK/.gitignore" <<'PY'
import sys
p = sys.argv[1]
lines = [l for l in open(p, encoding='utf-8').read().splitlines() if l.strip() != 'qa/']
tail = '# qa/ stays tracked here: the captures are what a reviewer looks at first.'
if tail not in lines:
    lines.append(tail)
open(p, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
PY

$CLI add kinetic-titles "$DECK" \
  --id 01-open \
  --kicker "NIMBUS OVER-EAR" \
  --title "우리가 지운 세 가지" \
  --lines "소음 // 42dB를 덜어냈다 · 엔진 소리가 방 안 공기가 된다|무게 // 213g · 두 시간 뒤에는 쓴 것을 잊는다|시간 // 40시간 재생 · 출장에 충전기를 두고 간다" \
  --notes "세 단어만 말한다. 소음, 무게, 시간. 블록이 다 서면 '오늘은 이 셋을 어떻게 지웠는지만 말합니다'로 넘어간다."

$CLI add frame-scrub-video "$DECK" \
  --id 02-turn \
  --kicker "외형" \
  --title "한 바퀴 돌려 본다" \
  --lines "이어컵은 알루미늄 한 덩이를 깎아 만든다|힌지는 안쪽으로 접혀 가방 두께를 넘지 않는다|헤드밴드는 다섯 단계로 늘어난다" \
  --notes "휠을 천천히 굴린다. 한 바퀴가 다 돌 때까지 말을 아끼고, 줄이 하나씩 내려앉을 때마다 한 문장씩만 붙인다."

$CLI add tilt-card "$DECK" \
  --id 03-hero \
  --kicker "안쪽" \
  --title "뜯어 보면 네 층" \
  --lines "40mm 다이내믹 드라이버 — 리퀴드 크리스털 다이어프램|1,200mAh 셀 — 힌지 아래에 눕혔다|피드포워드·피드백 마이크 각 2개|메모리폼 이어패드 — 손으로 교체한다" \
  --notes "분해도를 가리키며 위에서 아래로 짚는다. 드라이버, 배터리, 마이크, 패드. 네 번째 줄에서 '수리해서 오래 쓰는 물건'이라는 말을 붙인다."

$CLI add horizontal-gallery "$DECK" \
  --id 04-features \
  --kicker "다섯 장면" \
  --title "숫자로 먼저 본다" \
  --lines "한 판에 하나씩, 다섯 판" \
  --notes "판을 하나씩 해설하지 않는다. 레일이 지나가는 동안 '재생·소음·무게·코덱·색' 다섯 축만 소리 내어 읽는다."

$CLI add parallax-video "$DECK" \
  --id 05-breathe \
  --kicker "잠깐" \
  --title "소리가 사라진 자리" \
  --lines "남는 것은 당신이 고른 소리뿐이다" \
  --notes "여기서는 한 문장만 말하고 계속 굴린다. 멈추면 숨 고르기가 아니라 정적이 된다."

$CLI add odometer-stats "$DECK" \
  --id 06-specs \
  --kicker "스펙" \
  --title "네 숫자로 끝낸다" \
  --lines "40시간 연속 재생|42dB 노이즈 캔슬링|213g 헤드밴드 포함|6개 빔포밍 마이크" \
  --notes "릴이 멈춘 뒤에 숫자를 읽는다. 마지막에 '전부 실험실 수치이고, 이 제품은 가상입니다'를 덧붙인다."

$CLI add closing-qr "$DECK" \
  --id 07-close \
  --kicker "가져가기" \
  --title "감사합니다" \
  --url "https://github.com/gongnyang/awesome-html-scrolline-deck" \
  --notes "QR을 띄운 채로 질문을 받는다. 화면을 넘기지 않는다."

# Palette, type stack and the four scoped scene corrections.
node "$DECK/tools/apply-theme.mjs"
node "$DECK/tools/apply-scene-fixes.mjs"

# Assets. Off by default because they need sharp and ffmpeg; the committed files
# under public/ are exactly what these scripts produce.
if [ "${ASSETS:-0}" = "1" ]; then
  node "$DECK/tools/make-rotation.mjs"
  node "$DECK/tools/make-hero-plate.mjs"
  node "$DECK/tools/make-feature-plates.mjs"
  node "$DECK/tools/make-breathe-video.mjs"
fi

# Point deck.json at those assets (what `scrolline frames|media --scene` would write).
node "$DECK/tools/wire-assets.mjs"

$CLI storyboard "$DECK"
echo
echo "Next: cd examples/product-launch && npm install && npm run build"
echo "Then: node ../../scripts/cli.mjs check . && node ../../scripts/cli.mjs verify ."
