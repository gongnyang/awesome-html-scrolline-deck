/** add — create one scene folder from a technique template and register it in deck.json. */
import path from 'node:path';
import fs from 'node:fs';
import {
  REPO_ROOT, ensureDir, readJson, writeJson, readText, writeText, walk,
  fillTemplate, parseFlags, escapeHtml, slugify,
} from '../lib/fs.mjs';
import { validate, formatErrors } from '../lib/schema.mjs';
import { makeQrSvg } from './qr.mjs';

const KNOWN_FLAGS = new Set(['dir', 'id', 'title', 'kicker', 'lines', 'pinVh', 'notes', 'url']);

const SCHEMA = readJson(path.join(REPO_ROOT, 'references/deck.schema.json'));
const TECHNIQUES = SCHEMA.$defs.scene.properties.technique.enum;

/* ------------------------------------------------------------------ *
 * Built-in fallback template.
 * Used when templates/scenes/<technique>/ does not exist yet, so a deck can
 * always be scaffolded. It follows the same contract: entrance 0–.30,
 * hold .30–.75, exit .75–1, timeline length exactly 1, tokens only.
 * ------------------------------------------------------------------ */
const FALLBACK = {
  'scene.html': `<div class="s-stage">
  <p class="s-kicker t-eyebrow">{{kicker}}</p>
  <h2 class="s-title t-display-lg">{{title}}</h2>
  <ul class="s-lines">
    <!-- each:line --><li class="s-line t-body-lg">{{line}}</li><!-- /each -->
  </ul>
</div>
`,
  'scene.css': `/* {{id}} — {{technique}} (built-in fallback template). Tokens only, no literal colours. */
[data-scene="{{id}}"] { background: var(--canvas); }
[data-scene="{{id}}"] .s-stage {
  width: min(var(--container), calc(100vw - var(--gutter) * 2));
  padding: 0 var(--gutter);
}
[data-scene="{{id}}"] .s-kicker { margin-bottom: var(--space-md); color: var(--ink-subtle); }
[data-scene="{{id}}"] .s-title { margin-bottom: var(--space-lg); color: var(--ink); }
[data-scene="{{id}}"] .s-lines { display: grid; gap: var(--space-xs); }
[data-scene="{{id}}"] .s-line { color: var(--ink-muted); }
`,
  'scene.js': `/**
 * {{id}} — {{technique}}
 * Timeline bands: entrance 0–.30 · hold .30–.75 · exit .75–1. Total length stays 1.
 * Edit inside the marked blocks; do not call tl.play() and do not tween a var() string.
 */
let root = null;

export default {
  id: '{{id}}',

  mount(section) {
    root = section;
  },

  build(tl, { gsap }) {
    const q = gsap.utils.selector(root);

    /* --- entrance 0 → .30 --- */
    tl.fromTo(q('.s-kicker'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.12 }, 0)
      .fromTo(q('.s-title'), { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 0.18 }, 0.06)
      .fromTo(q('.s-line'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.1, stagger: 0.04 }, 0.18);

    /* --- hold .30 → .75: nothing moves, the audience reads --- */

    /* --- exit .75 → 1 --- */
    tl.to(q('.s-stage'), { autoAlpha: 0, y: -28, duration: 0.25 }, 0.75);
  },

  unmount() {
    root = null;
  },
};
`,
  'template.json': `{
  "technique": "{{technique}}",
  "pinVh": 180,
  "pin": true,
  "tags": ["fallback"],
  "slots": { "kicker": true, "title": true, "lines": { "min": 0, "max": 4 } },
  "assets": {},
  "hold": [0.3, 0.75],
  "notesHint": "Say what this scene proves, in one breath."
}
`,
};

/** Expand <!-- each:line -->…<!-- /each --> blocks, then {{lines}} / {{line1..4}}. */
function expandLines(text, lines) {
  let out = text.replace(/<!--\s*each:line\s*-->([\s\S]*?)<!--\s*\/each\s*-->/g, (_, block) =>
    lines.map((line, i) => block
      .replace(/\{\{line\}\}/g, escapeHtml(line))
      .replace(/\{\{n\}\}/g, String(i + 1))).join(''));
  out = out.replace(/\{\{lines\}\}/g, lines.map((l) => `<li class="s-line t-body-lg">${escapeHtml(l)}</li>`).join('\n    '));
  for (let i = 0; i < 4; i += 1) {
    out = out.replace(new RegExp(`\\{\\{line${i + 1}\\}\\}`, 'g'), escapeHtml(lines[i] ?? ''));
  }
  return out;
}

export async function run(argv) {
  const flags = parseFlags(argv);
  const technique = flags._[0];
  const unknown = Object.keys(flags).filter((k) => k !== '_' && !KNOWN_FLAGS.has(k));
  if (unknown.length) {
    process.stderr.write(`scrolline add: ignoring unknown flag(s) ${unknown.map((k) => `--${k}`).join(', ')} (known: ${[...KNOWN_FLAGS].map((k) => `--${k}`).join(', ')})\n`);
  }
  const dir = path.resolve(process.cwd(), flags.dir ?? flags._[1] ?? '.');

  if (!technique) {
    process.stderr.write(`scrolline add: a technique is required\n  techniques: ${TECHNIQUES.join(', ')}\n`);
    return 2;
  }
  if (!TECHNIQUES.includes(technique)) {
    process.stderr.write(`scrolline add: unknown technique "${technique}"\n  techniques: ${TECHNIQUES.join(', ')}\n`);
    return 2;
  }

  const deckFile = path.join(dir, 'data/deck.json');
  if (!fs.existsSync(deckFile)) {
    process.stderr.write(`scrolline add: ${deckFile} not found — run "scrolline init" first, or pass the project directory\n`);
    return 2;
  }
  const deck = readJson(deckFile);
  deck.scenes ??= [];

  const order = deck.scenes.reduce((max, s) => Math.max(max, Number(s.order) || 0), 0) + 1;
  const title = typeof flags.title === 'string' ? flags.title : '';
  const id = typeof flags.id === 'string'
    ? flags.id
    : `${String(order).padStart(2, '0')}-${slugify(title || technique) || technique}`;

  if (!/^\d{2}-[a-z0-9-]+$/.test(id)) {
    process.stderr.write(`scrolline add: id "${id}" must look like 01-opening (two digits, dash, lowercase slug)\n`);
    return 2;
  }
  if (deck.scenes.some((s) => s.id === id)) {
    process.stderr.write(`scrolline add: scene "${id}" already exists in deck.json\n`);
    return 2;
  }

  // Template source: worker T's folder if present, otherwise the built-in fallback.
  const templateDir = path.join(REPO_ROOT, 'templates/scenes', technique);
  const useFallback = !fs.existsSync(path.join(templateDir, 'scene.js'));
  const files = useFallback
    ? Object.fromEntries(Object.entries(FALLBACK))
    : Object.fromEntries(walk(templateDir).map((rel) => [rel, readText(path.join(templateDir, rel))]));

  const meta = (() => {
    try { return JSON.parse(files['template.json'] ?? '{}'); } catch { return {}; }
  })();

  const lines = typeof flags.lines === 'string'
    ? flags.lines.split('|').map((s) => s.trim()).filter(Boolean).slice(0, 4)
    : [];
  const kicker = typeof flags.kicker === 'string' ? flags.kicker : '';
  const pinVh = Number(flags.pinVh ?? meta.pinVh ?? 180);
  const notes = typeof flags.notes === 'string' && flags.notes.trim()
    ? flags.notes
    : (meta.notesHint || `TODO — speaker notes for ${id}.`);

  const values = {
    id, technique, kicker, title,
    pinVh: String(pinVh),
    order: String(order),
  };

  const sceneDir = path.join(dir, 'src/scenes', id);
  ensureDir(sceneDir);
  const written = [];
  for (const [rel, raw] of Object.entries(files)) {
    if (rel === 'template.json') continue; // template metadata stays in the skill
    const filled = fillTemplate(expandLines(String(raw), lines), values);
    writeText(path.join(sceneDir, rel), filled);
    written.push(rel);
  }

  const entry = {
    id,
    order,
    technique,
    pinVh,
    pin: meta.pin === false ? false : true,
    assets: {},
    copy: { kicker, title, lines },
    transition: { in: meta.transitionIn ?? 'fade', out: meta.transitionOut ?? 'fade' },
    notes,
  };
  // Pre-declare the asset keys the technique expects, so the author sees what to fill.
  // template.json writes either a boolean or a { min, max } range.
  const wants = (slot) => slot === true || (slot && typeof slot === 'object' && Number(slot.max ?? 1) > 0);
  if (wants(meta.assets?.frames)) Object.assign(entry.assets, { frames: null, count: 0, critical: [], poster: null });
  if (wants(meta.assets?.images)) entry.assets.images = [];
  if (wants(meta.assets?.video)) Object.assign(entry.assets, { video: null, poster: null });

  // --url: write a QR for the link and wire it as images[0] (closing-qr reads it there).
  const url = typeof flags.url === 'string' ? flags.url : '';
  if (url) {
    let svg;
    try {
      svg = await makeQrSvg(url);
    } catch (error) {
      process.stderr.write(`scrolline add: --url given but ${error.message}\n`);
      return 1;
    }
    const publicPath = `/media/${id}/qr.svg`;
    writeText(path.join(dir, 'public', publicPath), svg);
    entry.assets.images = [publicPath, ...(entry.assets.images ?? [])];
    deck.links = { ...(deck.links ?? {}), site: url };
    written.push(`public${publicPath}`);
  }

  deck.scenes.push(entry);
  deck.scenes.sort((a, b) => a.order - b.order);

  const result = validate(SCHEMA, deck);
  if (!result.ok) {
    process.stderr.write(`scrolline add: deck.json would become invalid\n${formatErrors(result.errors)}\n`);
    return 1;
  }
  writeJson(deckFile, deck);

  process.stdout.write(
`Added ${id} (${technique}, pin ${pinVh}vh)${useFallback ? ' — built-in fallback template' : ''}
  src/scenes/${id}/${written.join(', ')}
  deck.json scene ${deck.scenes.length}, total pin ${deck.scenes.reduce((s, x) => s + (x.pinVh || 0), 0)}vh
`);
  if (useFallback) {
    process.stdout.write(`  note: templates/scenes/${technique}/ is not installed in this build, so the generic template was used.\n`);
  }
  return 0;
}

export default run;
