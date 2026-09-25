# Presenting a Scrolline deck

## Keys

| Key | What it does |
|---|---|
| `→` or `Space` | Next declared presenter cue; repeated keydown cannot skip cues |
| `←` | Previous declared presenter cue |
| `1`–`9`, `0` | Jump to scene 1–9, `0` is scene 10 |
| `P` | Presenter auto-advance. Any wheel, touch or key input stops it |
| `F` | Fullscreen |
| `H` | Hide the cursor |
| `N` | Speaker notes panel for the current scene |

Auto-advance spends `presenter.autoDurationSec` (default 180) crossing the whole
deck at a constant speed. Set it to the length of your talk, start it on the
first scene, and take the wheel back whenever you want — one scroll cancels it.

## Before the talk

1. `npm run build && npm run preview`, then present from the preview server, not
   the dev server. Dev-mode module loading stutters on the first scrub.
2. `scrolline verify .` **on the machine that will drive the projector**. Pin
   distances are measured in viewport heights, so a different screen is a
   different deck.
3. Read the entry, every declared cue, 96% and 99% exit captures at 1440×900 and
   1920×1080; then review mobile and reduced-motion captures. A cue that looks
   unfinished cannot support a spoken explanation.
4. `scrolline storyboard .` and check that every scene has notes.
5. Press `F`, then `H`. Both are one-way switches your audience never sees.
6. Walk the deck once with `→` alone. Every landing should be readable without
   scrolling further.
7. Scroll the whole deck once with the wheel to warm the image cache.
8. Export a PDF backup: one screenshot per scene at its hold frame. Projectors
   fail; a deck that only exists in a browser is a single point of failure.
9. Check the room's aspect ratio. The reference stage is 1440×900; at 16:9 the
   scenes get wider, never taller.
10. Turn off notifications, and plug in. A frame scrub on battery saver drops to
    half rate.

## During

- Scroll gently and stop at the authored cue when explaining evidence. The
  required scroll distance varies by scene and viewport.
- If the deck stalls, press a number key. Jumps are absolute and always recover.
- If the projector shows a blank scene, use a number key to recover and report
  the scene as broken. Reduced motion should show a complete static screen.

## Numbers worth knowing

| Thing | Value |
|---|---|
| Reference stage | 1440×900 |
| Landing point | Each scene's declared `pace.cueStates` |
| Scroll distance | Set from the scene's speaking beat and information change |
| Default auto-advance | 180s for the whole deck |
| Speaking time | Rehearse the actual narration and pauses |
| Pin per scene | `pass` 0; `hold`/`scrub` according to content |
