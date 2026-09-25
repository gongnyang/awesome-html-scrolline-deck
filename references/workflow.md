# Authoring workflow

## Intake and thesis

Record audience, purpose (pitch, teach, report, guide, propose), duration, one-sentence thesis, available evidence, visual constraints, venue/screen, and desired audience action. When evidence is missing, use a clearly labeled illustrative example instead of inventing a factual claim. A presenter should be able to say the thesis aloud in one breath.

## Storyboard before implementation

Write one row per scene: `id | narrative job | claim spoken aloud | visual evidence | template and why | motion and why | asset/source | hold frame | speaker note`. Each scene makes one point and the visual supports it. The opening earns attention with a topic-specific visual event; subsequent beats establish the problem, explanation/evidence, consequence, and action. A lecture can substitute a question, demonstration, and comprehension checkpoint for a pitch's ask.

Choose by semantic job rather than by filling a quota of techniques. Use an image when it shows a product, place, person, scale, atmosphere, or change that text cannot convey as well. Use HTML/SVG when exact numbers, labels, relationships, or maps must remain true and readable. A technique belongs in the storyboard only if its hold frame can support the spoken claim.

## Motion decisions

The first 1–2 scenes may use aggressive scale, depth, masked image reveals, frame scrubbing, kinetic type, and layered parallax. Make each opening distinctive to its subject. The strongest effect should land on a legible completed frame rather than run continuously while the presenter speaks. Later effects should reveal order, expose detail, compare alternatives, or move between sections. Record that job in the storyboard; if an effect has no job, simplify it.

Do not encode essential information solely in animation. The static and reduced-motion state must show the claim and evidence. Scroll progress is audience/presenter controlled, so the deck must not depend on timed autoplay to make its point.

## Build loop

1. Define deck art direction: typography, palette, image language, texture, and opening motion. Deliberately differ from the seven showcase decks when the new topic calls for it.
2. Select templates from `techniques.md`, draft copy and notes, and list every needed image/diagram. Generate or source assets before finalizing layouts.
3. Scaffold with the CLI, populate `deck.json`, and tune each scene's CSS and GSAP choreography. Keep scene-local selectors and token-driven colors.
4. Run static check, strict browser verify, inspect 30/55/85 captures, revise, and repeat. Inspect actual production subpath after publishing.

## Why these choices

An [experimental comparison of presentation structures](https://pure.psu.edu/en/publications/assertion-evidence-slides-appear-to-lead-to-better-comprehension--2/) found improved comprehension and recall for a sentence claim supported by visual evidence in its technical-teaching setting. This informs the claim/evidence storyboard; it does not require every scene to look like a slide. [ScrollyVis research](https://arxiv.org/abs/2207.03616) demonstrates guided narratives combining media and specialized visuals, supporting a varied authoring grammar. The number 24 is a requested coverage target, not an empirical optimum.
