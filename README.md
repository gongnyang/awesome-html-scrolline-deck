# Scrolline Deck

The gallery also includes three captioned Korean videos derived from the completed decks: a promotional short, a sourced Cheonggyecheon case story, and a scene-design lesson. Historical visuals in the case story are visibly labeled as AI reconstructions.

Presentation-ready, scroll-driven HTML decks. A presenter controls each scene's entrance, finished frame, and exit with the wheel or keyboard. The skill plans the talk, chooses from 25 working scene templates, develops local imagery, builds the site, and verifies what the audience will actually see.

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
node scripts/cli.mjs add frame-scrub-hero --dir my-deck --id 01-open --title "The claim"
cd my-deck && npm ci && npm run dev
```

Write the audience, goal, one-sentence thesis, scene jobs, visual evidence, and art direction before selecting techniques. Add local media in `public/media/`; put copy, sources, and speaker notes in `data/deck.json`. The [authoring workflow](references/workflow.md) and [asset direction](references/asset-direction.md) explain the decision points. The examples show finished output, not a fixed sequence to copy.

```bash
node scripts/cli.mjs check my-deck
node scripts/cli.mjs verify my-deck --strict --build
node scripts/cli.mjs storyboard my-deck
```

Strict verify drives a real browser with wheel and keyboard input, checks every packaged image can decode, and captures each scene at 30%, 55%, and 85%. It fails if Playwright is unavailable. Read those screenshots as part of [visual acceptance](references/quality.md). Media URLs are resolved relative to the deck, so the same build works at the site root or under a GitHub Pages project path.

## What ships

- `SKILL.md`: task-level authoring and verification workflow.
- `templates/scenes/`: 25 scene implementations with metadata, mobile and reduced-motion behavior.
- `engine/`: GSAP ScrollTrigger + Lenis runtime copied into generated decks.
- `scripts/`: CLI, static/browser gates, gallery builder, and production-subpath smoke test.
- `examples/`: eight complete decks with local imagery, presenter notes, and QA captures.

Present with `→`/Space, `←`, number keys, `F` fullscreen, `N` notes, and `P` auto-progress. The static output can be hosted anywhere; the gallery is deployed to GitHub Pages after all eight strict checks pass.

## Design rationale

The skill chooses scenes by their rhetorical job: open, explain, compare, prove, or ask. Technical-presentation [research on assertion–evidence structure](https://pure.psu.edu/en/publications/assertion-evidence-slides-appear-to-lead-to-better-comprehension--2/) motivates putting a clear claim beside meaningful visual evidence. The 25-template count is coverage for different presentation needs, not a research-derived optimum. [WCAG motion guidance](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions) and [responsive image guidance](https://web.dev/learn/design/responsive-images) inform the static fallback and image-loading rules.

MIT license.
