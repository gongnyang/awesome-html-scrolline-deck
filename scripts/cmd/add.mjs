/** add — create one scene folder from a technique template and register it in deck.json. */
import path from 'node:path';
import fs from 'node:fs';
import {
  REPO_ROOT, ensureDir, readJson, writeJson, readText, writeText,
  fillTemplate, parseFlags, escapeHtml, slugify,
} from '../lib/fs.mjs';
import { validate, formatErrors } from '../lib/schema.mjs';
import { makeQrSvg } from './qr.mjs';

const KNOWN_FLAGS = new Set(['dir', 'id', 'title', 'kicker', 'lines', 'pinVh', 'notes', 'url']);

const SCHEMA = readJson(path.join(REPO_ROOT, 'references/deck.schema.json'));
const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates/scenes');
const TECHNIQUES = fs.readdirSync(TEMPLATE_ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(TEMPLATE_ROOT, entry.name, 'template.json')))
  .map((entry) => entry.name)
  .sort();

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

  // A missing template is a packaging error, not a reason to make a generic scene.
  const templateDir = path.join(REPO_ROOT, 'templates/scenes', technique);
  if (!fs.existsSync(path.join(templateDir, 'scene.js'))) {
    process.stderr.write(`scrolline add: template ${technique} is incomplete or missing\n`);
    return 1;
  }
  // Preview images document the template; only source files belong in a deck.
  const sourceFiles = ['scene.html', 'scene.css', 'scene.js', 'template.json'];
  const files = Object.fromEntries(sourceFiles.map((rel) => [rel, readText(path.join(templateDir, rel))]));

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
    purpose: '',
    reason: '',
    evidence: '',
    source: '',
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
`Added ${id} (${technique}, pin ${pinVh}vh)
  src/scenes/${id}/${written.join(', ')}
  deck.json scene ${deck.scenes.length}, total pin ${deck.scenes.reduce((s, x) => s + (x.pinVh || 0), 0)}vh
`);
  return 0;
}

export default run;
