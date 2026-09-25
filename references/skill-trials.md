# Independent skill generation trials

Date: 2026-09-25
Purpose: check whether the Scrolline skill can develop distinct Korean talks from topics outside the eight bundled example decks.

## Setup and commands

Ran from the repository root. Used the bundled Node and pnpm executables because Windows PATH does not provide Node/npm:

```powershell
$node = 'C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$pnpm = 'C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd'
```

Scaffold commands:

```powershell
& $node scripts/cli.mjs init work/skill-trials/heat-island --title '도시 열섬을 식히는 동네 설계' --subtitle '폭염 대응을 위한 생활권 선택' --style light
& $node scripts/cli.mjs init work/skill-trials/food-waste --title '급식 잔반을 줄이는 학교 실험' --subtitle '학생 참여로 바꾸는 한 끼의 운영' --style dark
& $node scripts/cli.mjs init work/skill-trials/library-resilience --title '동네 도서관은 폭염 쉼터가 될 수 있을까' --subtitle '생활권 회복력의 작은 기반시설' --style light
```

For each row below, ran:

```powershell
& $node scripts/cli.mjs add <technique> --dir work/skill-trials/<deck> --id <id> --kicker '<kicker>' --title '<title>' --lines '<line1>|<line2>|...' --notes '<speaker notes>'
```

The resulting `data/deck.json` in each trial directory contains the exact copy and speaker notes. Compact copies are saved in `tests/skill-trials/*.json` so the three storyboards remain reviewable after temporary builds are removed. Their scenes also have `purpose`, `reason`, `evidence`, and `source` fields filled in after generation.

| Deck | Ordered scene mix and narrative reason |
|---|---|
| `heat-island` — urban heat and neighborhood shade | `question-reveal` (open with a daily-life question) → `map-route` (frame three observation stops) → `chart-reveal` (compare clearly labeled illustrative scores) → `system-map` (show proposed collaborators) → `option-matrix` (compare interventions on shared criteria) → `timeline-roadmap` (propose a seasonal pilot) → `closing-qr` (ask for one local observation; no QR/link claimed) |
| `food-waste` — a school lunch waste experiment | `word-relay` (state a participation-centered thesis) → `step-flow` (turn it into a classroom experiment) → `chart-reveal` (show uncollected indicators as zero/start values) → `agenda-path` (assign roles) → `odometer-stats` (emphasize the proposed four-week plan) → `closing-qr` (end with a small next-lunch action) |
| `library-resilience` — neighborhood libraries and heat preparedness | `kinetic-titles` (define three readiness conditions) → `question-reveal` (surface different access needs) → `system-map` (show a proposed operating network) → `timeline-roadmap` (sequence readiness work) → `map-route` (show an explicitly abstract last-mile route) → `option-matrix` (choose one first improvement) |

No images or external claims were supplied. Notes label the heat comparison values as fictional planning scores, the food-waste zeroes as pre-collection values, and route/timeline content as proposals. Claims about specific municipalities, schools, or libraries were avoided. These topic and scene sequences differ from the example deck topics and their supplied scene orders.

## Install, static check, build, and strict browser verification

Installed each scaffold's declared dependencies with the bundled pnpm. Pnpm initially blocked esbuild's install script; after approving only `esbuild`, its postinstall also required the bundled Node directory on PATH. Then ran:

```powershell
$env:PATH = 'C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:PATH
Push-Location work/skill-trials/heat-island; & $pnpm approve-builds esbuild; & $pnpm install; & $pnpm run build; Pop-Location
Push-Location work/skill-trials/food-waste; & $pnpm approve-builds esbuild; & $pnpm install; & $pnpm run build; Pop-Location
Push-Location work/skill-trials/library-resilience; & $pnpm approve-builds esbuild; & $pnpm install; & $pnpm run build; Pop-Location
& $node scripts/cli.mjs check work/skill-trials/heat-island
& $node scripts/cli.mjs check work/skill-trials/food-waste
& $node scripts/cli.mjs check work/skill-trials/library-resilience
& $node scripts/cli.mjs verify work/skill-trials/heat-island --strict --build
& $node scripts/cli.mjs verify work/skill-trials/food-waste --strict --build
& $node scripts/cli.mjs verify work/skill-trials/library-resilience --strict --build
```

All three installs and production builds passed. Static checks passed all six gates for each deck. Strict Playwright verification passed all reported gates: 14 for `heat-island` and 15 each for `food-waste` and `library-resilience`. The browser reports recorded 21, 18, and 18 screenshots. Reports and captures are in each deck's `qa/` directory under `work/skill-trials/`.

## Visual review and findings

Reviewed representative 55% and 85% captures. The initial heat-island `chart-reveal` screenshot (`work/skill-trials/heat-island/qa/03-example-55.jpg`) showed the title, values, and category labels but no visible bars, even though G6 passed. The parent updated the shared chart template to assign a direct bar height, and the generated scene was refreshed from it. The first strict rerun passed all 15 gates but still showed no bars. A direct browser measurement at 1440×900 found a 378px chart and bars with heights 251.3px, 125.7px, and 377px, each at opacity 1 and identity transform; their computed background image was `none` and background color transparent. The chart template uses `var(--accent)`, but the deck tokens originally defined only `--accent-1` and `--accent-2`, leaving the gradient invalid. The parent added the scene composition aliases to the scaffold and example tokens; I copied those aliases into the heat-island trial tokens and reran strict verification. All 15 gates passed again, 21 captures were regenerated, and `03-example-55.jpg` now shows all three colored bars. The final browser measurement reports `linear-gradient(rgb(58, 69, 184), rgb(154, 100, 0))` for every bar background. The food-waste chart uses zero values before collection, so its absent bars are expected.

At initial inspection, CLI `help` listed 12 techniques while the documentation and schema listed 24. The trials succeeded with additional techniques such as `question-reveal`, `map-route`, `chart-reveal`, and `system-map`, because `add` reads its supported techniques from the schema. The parent updated `help` to list all 24; a follow-up `node scripts/cli.mjs help` confirmed the full list.

## Outcome

The skill and CLI generated three distinct Korean scene mixes from unseen topics, carried speaker notes and storyboard rationales, and passed static and browser gates. This is evidence against simple copying of the bundled examples for these three topics. It does not establish quality across all audiences or all 25 current production templates. The chart issue exposed in the first run was resolved in the refreshed trial through the updated template and theme aliases.
