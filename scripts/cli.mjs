#!/usr/bin/env node
/**
 * scrolline — build a scroll-driven cinematic HTML deck.
 *
 *   scrolline init <dir> --title "…"        scaffold a Vite project with the engine inside
 *   scrolline add <technique> --id NN-slug  add one scene folder and register it
 *   scrolline frames <video> --name hero    cut a video into a scrubbable frame sequence
 *   scrolline storyboard [dir]              print the scene table
 *   scrolline check [dir]                   static gates (no browser)
 *   scrolline verify [dir]                  browser gates (Playwright, optional)
 *   scrolline qr --url https://… --scene 06-closing
 *   scrolline media <file> --scene NN-id    convert an image into the scene's media folder
 *   scrolline upgrade <dir> [--force]       replace the copied engine with this one
 */
import process from 'node:process';
import path from 'node:path';
import { readText, REPO_ROOT } from './lib/fs.mjs';

const VERSION = (() => {
  try { return readText(path.join(REPO_ROOT, 'engine/VERSION')).trim(); } catch { return '0.0.0'; }
})();

const HELP = `scrolline ${VERSION} — scroll-driven cinematic HTML decks

Usage
  scrolline <command> [options]

Commands
  init <dir>                  Scaffold a deck project (Vite + engine + tokens)
      --title "…"             Deck title (also the <title> tag)
      --subtitle "…"          Subtitle stored in deck.json
      --style dark|light      Theme ladder, default dark
      --presenter "Name"      Presenter name stored in deck.json
      --lang ko|en|…          Document language, default ko
      --force                 Write into a non-empty directory

  add <technique> [dir]       Add one scene: folder + deck.json entry
      --id NN-slug            Scene id and folder name (default: next order + title slug)
      --kicker "…"            Eyebrow line
      --title "…"             Scene title
      --lines "a|b|c"         Body lines, pipe separated (max 4)
      --pinVh 100..400        Pin distance, default from the technique template
      --notes "…"             Speaker notes (required by the schema; a hint is used if omitted)

  frames <video> [dir]        Cut a video into /public/frames/<name>/f_%03d.jpg (needs ffmpeg)
      --name hero             Sequence folder name
      --fps 12                Sampling rate, default 12
      --width 1280            Output width, default 1280
      --mobile 640            Also write a narrow sequence at this width
      --scene NN-id           Write frames/count/critical into that deck.json scene

  storyboard [dir]            Print the scene table (id, technique, copy, pin, assets)
  check [dir]                 Static gates: module shape, timeline <= 1, tokens, no scrollTo
  verify [dir] --strict       Browser gates: wheel, keyboard, media, contrast, reduced motion
  qr --url <url> --scene <id> Write a currentColor QR SVG and wire it into deck.json (or --out <file>)
  media <file> --scene NN-id  Copy/convert an image into public/media/<scene>/
  upgrade <dir> [--force]     Refresh <dir>/src/engine from this engine build
      --manifest              (no dir) Regenerate engine/MANIFEST.json in this repo

  help, --help                This text
  version, --version          ${VERSION}

Techniques
  frame-scrub-hero  word-relay        kinetic-titles   horizontal-gallery
  anatomy-rows      frame-scrub-video parallax-video   paper-assembly
  odometer-stats    wipe-transform    tilt-card        closing-qr
  question-reveal    agenda-path       chapter-transition chart-reveal
  annotated-chart   before-after      document-proof     step-flow
  system-map        timeline-roadmap  map-route          option-matrix

Presenting keys: -> / Space next · <- previous · 1-9,0 jump · P auto-advance · F fullscreen · H hide cursor · N notes
`;

const COMMANDS = {
  init: './cmd/init.mjs',
  add: './cmd/add.mjs',
  frames: './cmd/frames.mjs',
  storyboard: './cmd/storyboard.mjs',
  upgrade: './cmd/upgrade.mjs',
  qr: './cmd/qr.mjs',
  media: './cmd/media.mjs',
  check: './cmd/check.mjs',
  verify: './cmd/verify.mjs',
};

async function main(argv) {
  const [command, ...rest] = argv;

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    process.stdout.write(HELP);
    return 0;
  }
  if (command === 'version' || command === '--version' || command === '-v') {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }

  const entry = COMMANDS[command];
  if (!entry) {
    process.stderr.write(`scrolline: unknown command "${command}"\nRun "scrolline help" for the command list.\n`);
    return 2;
  }

  let mod;
  try {
    mod = await import(entry);
  } catch (err) {
    if (err?.code === 'ERR_MODULE_NOT_FOUND' && (command === 'check' || command === 'verify')) {
      process.stderr.write(`scrolline ${command}: the gate runner is not installed in this build (scripts/cmd/${command}.mjs missing).\n`);
      return 2;
    }
    throw err;
  }

  const run = mod.run ?? mod.default;
  if (typeof run !== 'function') {
    process.stderr.write(`scrolline: command "${command}" has no run() export\n`);
    return 2;
  }
  const code = await run(rest);
  return typeof code === 'number' ? code : 0;
}

main(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((err) => {
    process.stderr.write(`scrolline: ${err?.message ?? err}\n`);
    if (process.env.SCROLLINE_DEBUG) process.stderr.write(`${err?.stack ?? ''}\n`);
    process.exit(1);
  });
