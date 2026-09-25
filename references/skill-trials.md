# Independent v2 skill generation trials

## Scope and reproduction

Date: 2026-09-25. These three small Korean decks test new topics beyond the eight packaged examples. Each storyboard has three scenes and is saved as a compact JSON snapshot under `tests/skill-trials-v2/`; source illustrations are preserved beside those snapshots. Earlier v1 work is archived at the end of this page.

### Recreate and verify

Run from the repository root with Node.js; on machines without Node on `PATH`, point `$node` to the installed executable. For each topic, recreate the scaffold with its title/theme, then add the ordered scenes using the exact `technique`, `id`, `purpose`, `claim`, `relation`, `reason`, `evidenceStatus`, `source`, `presenterAction`, `visualChange`, `pace`, `scrollVh`, `cue`, `notes`, and `copy` values in its snapshot. Use `assets` as saved; the companion SVGs are in `tests/skill-trials-v2/assets/<slug>/`. The initial scaffold and verification commands are:

```powershell
$node = (Get-Command node -ErrorAction Stop).Source
& $node scripts/cli.mjs init work/skill-trials-v2/repair-cafe --title '고장 난 이어폰, 어디까지 고칠까' --subtitle '점검 순서와 안전한 선택' --style dark
& $node scripts/cli.mjs init work/skill-trials-v2/night-transit --title '막차 뒤의 이동 선택' --subtitle '교대 근무자의 안전한 귀가 판단' --style light
& $node scripts/cli.mjs init work/skill-trials-v2/market-returnables --title '다회용 포장, 어디서부터 시작할까' --subtitle '회수 운영을 포함한 작은 실험' --style light
& $node scripts/cli.mjs check work/skill-trials-v2/repair-cafe
& $node scripts/cli.mjs check work/skill-trials-v2/night-transit
& $node scripts/cli.mjs check work/skill-trials-v2/market-returnables
& $node scripts/cli.mjs verify work/skill-trials-v2/repair-cafe --strict
& $node scripts/cli.mjs verify work/skill-trials-v2/night-transit --strict
& $node scripts/cli.mjs verify work/skill-trials-v2/market-returnables --strict
```

The snapshots are the canonical per-scene inputs and preserve scene order and purpose/reason text: [repair-cafe](../tests/skill-trials-v2/repair-cafe.json), [night-transit](../tests/skill-trials-v2/night-transit.json), and [market-returnables](../tests/skill-trials-v2/market-returnables.json).

### Storyboards and results

| Trial | Scene order and purpose | Status and evidence |
| --- | --- | --- |
| `repair-cafe` | `question-reveal` introduces cable/plug observations → `step-flow` sequences safe exterior checks before disassembly → `option-matrix` compares repair check, parts recovery, and specialist disposal by shared qualitative criteria. | Static 6/6; strict 16/16. Entry/hold/exit and mobile/reduced-motion gates pass. Fictional repair-café example; no product diagnosis asserted. |
| `night-transit` | `question-reveal` relates shift end to the official last-trip check → `map-route` orders transit checks and alternatives on a conceptual route (explicitly not a street map or verified schedule) → `timeline-roadmap` assigns three checks to before departure, shift end, and a service change. | Static 6/6; strict 16/16 on final source. A baked-in SVG footer label conflicted with the scene source caption; the label was removed and strict captures regenerated. No real transit time or safety claim. |
| `market-returnables` | `before-after` compares disposable and returnable package paths → `step-flow` assigns return, cleaning, and redistribution responsibilities → `option-matrix` chooses a small pilot scope without invented performance figures. | Static 6/6; strict 16/16. An initial 390px visual review found the before/after labels colliding with illustration details and the stacked after-state partly hidden, despite passing automated gates. The original template now gives labels a canvas-tinted backing and, in stacked mobile mode, shows both complete images with full-width labels. The trial uses this updated source template and final strict passes 16/16. Concept illustrations and fictional planning example. |

Full strict reports are saved as `tests/skill-trials-v2/reports/<slug>-strict.json`. Representative 1440px and 390px captures are saved in `tests/skill-trials-v2/captures/`; the complete per-scene QA set remains under `work/skill-trials-v2/<slug>/qa/`. Visual review covered 1440px holds and 390px mobile for each topic. The repair evidence markers align to the illustrated plug/cable points. The night route stays legible as a conceptual route, not a street map. The returnables comparison initially had overlapping labels on mobile; the general before-after template CSS was corrected, then the market trial was regenerated and strictly rechecked. The before-after preview remains a desktop example; mobile behavior was verified in the generated trial captures. These limited trials pass the configured gates; they are not a claim of universal audience or presentation-quality approval.

## Historical v1 trials

The earlier exploratory runs predate the v2 scene contract and are not current release evidence. Their setup, failures, and fixes are archived in [skill-trials-v1-archive.md](skill-trials-v1-archive.md).
