#!/usr/bin/env bash
# build-city-guide.sh — rebuild examples/city-guide from the CLI, the way the skill says to.
#
# Scene folders and data/deck.json are regenerated from the templates; everything
# under public/ survives, because the assets are drawn by the tools/make-*.mjs
# scripts (see README.md → "How the assets are made").
#
#   bash examples/city-guide/tools/build-city-guide.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DECK="$ROOT/examples/city-guide"
CLI="node $ROOT/scripts/cli.mjs"
SITE="https://github.com/gongnyang/awesome-html-scrolline-deck"

cd "$ROOT"

rm -rf "$DECK/src/scenes" "$DECK/data" "$DECK/src/engine"

$CLI init "$DECK" \
  --title "서울, 해질녘 한 바퀴" \
  --subtitle "해가 지는 세 시간 동안 걷는 다섯 정거장" \
  --style dark \
  --lang ko \
  --presenter "gongnyang" \
  --force

# The scaffold ignores qa/. This deck ships its captures so a reader can see the
# hold frames without installing a browser, so that one line is removed again.
python3 - "$DECK/.gitignore" <<'PY'
import sys
p = sys.argv[1]
lines = [l for l in open(p, encoding='utf-8').read().splitlines() if l.strip() != 'qa/']
lines.append('# qa/ is tracked here on purpose — the captures are this example\'s evidence.')
open(p, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
PY

# The twilight palette and the serif display stack replace the scaffold's tokens.
cp "$DECK/tools/tokens-twilight.css" "$DECK/src/tokens.css"

$CLI add frame-scrub-hero "$DECK" \
  --id 01-hero \
  --kicker "SEOUL TWILIGHT LOOP" \
  --title "해가 지는 세 시간" \
  --lines "오후 다섯 시 반에 출발해 밤 아홉 시에 끝나는 다섯 정거장.|SAMPLE ITINERARY · 요금과 시간은 예시 데이터입니다" \
  --notes "첫 문장만 말하고 기다린다. 하늘이 완전히 어두워지고 창문에 불이 다 들어올 때까지 프레임을 굴린다. 마지막에 오늘 걷는 거리(5.8km)만 덧붙인다."

$CLI add anatomy-rows "$DECK" \
  --id 02-route \
  --kicker "ROUTE" \
  --title "다섯 정거장, 걸어서 이어진다" \
  --notes "지도를 먼저 보여 주고 행을 하나씩 짚는다. 정거장 사이가 모두 도보 20분 안쪽이라는 점이 이 경로의 전부다. 세 번째 행(인왕산 자락길)에서 한 번 쉬어 간다."

$CLI add paper-assembly "$DECK" \
  --id 03-postcards \
  --kicker "POSTCARDS" \
  --title "여섯 장이면 하루가 된다" \
  --lines "정거장마다 한 장. 도장은 그 시각에 찍힌다." \
  --notes "여섯 장이 다 모일 때까지 말하지 않는다. 부채꼴이 서면 그때 '하루가 여섯 장이면 충분하다'고 말한다."

$CLI add parallax-video "$DECK" \
  --id 04-drift \
  --kicker "BREATH" \
  --title "물 위로 간판이 두 번" \
  --lines "청계천 하류. 이 구간에서는 아무것도 하지 않아도 됩니다." \
  --notes "멈추지 않는다. 한 문장만 말하고 계속 굴린다. 객석이 화면을 보는 시간이다."

$CLI add tilt-card "$DECK" \
  --id 05-guide \
  --kicker "YOUR GUIDE" \
  --title "안내는 사람이 한다" \
  --lines "골목 안내 7년 차. 해질녘 시간대만 골라 걷습니다.|하루 다섯 정거장, 5.8km, 순수하게 걷는 시간은 1시간 40분.|거리·시간·요금은 이 예제를 위해 만든 샘플 데이터입니다." \
  --notes "오른쪽 타임라인을 손으로 짚으며 하루의 모양을 한 번 훑는다. 마지막 줄(샘플 데이터)은 반드시 소리 내어 읽는다."

$CLI add wipe-transform "$DECK" \
  --id 06-compare \
  --title "같은 길, 세 가지 속도" \
  --lines "환승 두 번|가장 느리고 가장 싸다|가장 빠른 대신 창밖만" \
  --notes "숫자를 읽지 말고 막대를 가리킨다. 도보가 가장 오래 걸리고 가장 싸다는 것, 그리고 이 경로는 그래서 도보라는 것만 말한다."

$CLI add closing-qr "$DECK" \
  --id 07-close \
  --kicker "가져가기" \
  --title "고맙습니다" \
  --lines "$SITE" \
  --url "$SITE" \
  --notes "QR을 띄워 둔 채로 질문을 받는다. 화면을 넘기지 않는다."

# One documented scene.js patch (a parallax-video template bug — see the file).
node "$DECK/tools/patch-scenes.mjs"

# Per-scene CSS overrides are appended to the generated scene.css, so a rebuild
# keeps them and the diff against the template stays readable.
for override in "$DECK"/tools/overrides/*.css; do
  [ -e "$override" ] || continue
  id="$(basename "$override" .css)"
  if [ -d "$DECK/src/scenes/$id" ]; then
    cat "$override" >> "$DECK/src/scenes/$id/scene.css"
    echo "override  src/scenes/$id/scene.css"
  else
    echo "override  skipped: no scene $id" >&2
  fi
done

# Draw every asset. SVG is built in the scripts and rasterised with sharp;
# the drift clip is encoded with ffmpeg.
SHARP_PATH="${SHARP_PATH:-/mnt/d/2026-06-site/node_modules}"
export NODE_PATH="$SHARP_PATH"
node "$DECK/tools/make-skyline.mjs"
node "$DECK/tools/make-route-map.mjs"
node "$DECK/tools/make-postcards.mjs"
node "$DECK/tools/make-guide.mjs"
node "$DECK/tools/make-compare.mjs"
node "$DECK/tools/make-closing.mjs"
node "$DECK/tools/make-drift.mjs"

# Point deck.json at what was just drawn (a real deck gets these from
# `scrolline frames --scene` and `scrolline media --scene`).
node "$DECK/tools/wire-assets.mjs"

$CLI storyboard "$DECK"
echo
echo "Next: cd examples/city-guide && npm install && npm run build"
