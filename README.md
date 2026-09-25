# Scrolline Deck

The gallery also includes three captioned Korean videos derived from the completed decks: a promotional short, a sourced Cheonggyecheon case story, and a scene-design lesson. Historical visuals in the case story are visibly labeled as AI reconstructions.

Scroll-driven HTML decks for talks. A presenter controls each scene's information change and speaking hold with the wheel or keyboard. The skill plans the argument, selects a suitable scene mechanism, develops local imagery, builds the site, and verifies what the audience will actually see. Catalog entries are selection candidates until their rendered scenes receive independent visual review.

[한국어 안내](README.ko.md) · [Live gallery](https://gongnyang.github.io/awesome-html-scrolline-deck/) · [Skill](SKILL.md) · [Scene catalogue](references/techniques.md)

## Eight complete decks

Every example is a standalone static website with Korean presenter notes. Fictional brands and figures are marked in the deck.

| Presentation | Purpose | Open |
|---|---|---|
| Scroll storytelling lecture | Teach the scene grammar | [Open](https://gongnyang.github.io/awesome-html-scrolline-deck/sample-deck/) |
| Product launch | Product keynote and feature proof | [Open](https://gongnyang.github.io/awesome-html-scrolline-deck/product-launch/) |
| Annual report | Board/investor results story | [Open](https://gongnyang.github.io/awesome-html-scrolline-deck/annual-report/) |
| City guide | Visual route briefing | [Open](https://gongnyang.github.io/awesome-html-scrolline-deck/city-guide/) |
| Investor pitch | Problem, solution, market, ask | [Open](https://gongnyang.github.io/awesome-html-scrolline-deck/investor-pitch/) |
| Research lecture | Question, evidence, interpretation | [Open](https://gongnyang.github.io/awesome-html-scrolline-deck/research-lecture/) |
| Client proposal | Case, approach, outcome, next step | [Open](https://gongnyang.github.io/awesome-html-scrolline-deck/client-proposal/) |
| Spatial proposal | Image-rich public-library concept pitch | [Open](https://gongnyang.github.io/awesome-html-scrolline-deck/spatial-proposal/) |

## Create a deck

Requires Node.js 20+. Install dependencies with `npm ci`. The browser verification also requires Playwright and Chromium.

```bash
git clone https://github.com/gongnyang/awesome-html-scrolline-deck.git
cd awesome-html-scrolline-deck
npm ci
node scripts/cli.mjs init my-deck --title "My talk" --lang ko
node scripts/cli.mjs add chapter-transition --dir my-deck --id 01-proof \
  --kicker "Chapter 01 · Evidence" --title "From claim to proof" \
  --lines "Establish the current state|Compare causes|Name the decision criteria" \
  --purpose "Bridge the opening claim to the order of evidence" \
  --claim "Check the state, causes, and criteria before choosing" \
  --relation sequence --reason "A short transition previews the three checks before the evidence scenes" \
  --evidenceStatus none --presenterAction "Preview the three proof steps" \
  --visualChange "Preview the three checks briefly, then continue to evidence" --pace pass --scrollVh 0 \
  --notes "State the question each step will answer."
cd my-deck && npm ci && npm run dev
```

Write the audience, goal, one-sentence thesis, scene jobs, visual evidence, and art direction before selecting techniques. Add local media in `public/media/`; put copy, sources, and speaker notes in `data/deck.json`. The [authoring workflow](references/workflow.md) and [asset direction](references/asset-direction.md) explain the decision points. The examples show finished output, not a fixed sequence to copy.

```bash
node scripts/cli.mjs check my-deck
node scripts/cli.mjs verify my-deck --strict --build
node scripts/cli.mjs storyboard my-deck
```

Strict verify drives a real browser with wheel and keyboard input, checks every packaged image can decode, and captures scenes at 30%, 55%, 85%, 96%, and 99% at projector size, plus mobile and reduced-motion views. It fails if Playwright is unavailable. Read those screenshots as part of [visual acceptance](references/quality.md). Media URLs are resolved relative to the deck, so the same build works at the site root or under a GitHub Pages project path.

## What ships

- `SKILL.md`: task-level authoring and verification workflow.
- `templates/scenes/`: scene implementation candidates with suitability and failure guidance; verify each selected use in the actual talk.
- `engine/`: GSAP ScrollTrigger + Lenis runtime copied into generated decks.
- `scripts/`: CLI, static/browser gates, gallery builder, and production-subpath smoke test.
- `examples/`: eight complete decks with local imagery, presenter notes, and QA captures.

Present with `→`/Space, `←`, number keys, `F` fullscreen, `N` notes, and `P` auto-progress. The static output can be hosted anywhere; the gallery is deployed to GitHub Pages after all eight strict checks pass.

## Design rationale

The skill chooses scenes by the relationship the audience must understand: comparison, change, sequence, place, structure, or decision. Technical-presentation [research on assertion–evidence structure](https://pure.psu.edu/en/publications/assertion-evidence-slides-appear-to-lead-to-better-comprehension--2/) motivates putting a clear claim beside meaningful visual evidence. There is no target template count. [WCAG motion guidance](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions) and [responsive image guidance](https://web.dev/learn/design/responsive-images) inform the static fallback and image-loading rules.

MIT license.
