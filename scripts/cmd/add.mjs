/** add — create one scene folder from a technique template and register it in deck.json. */
import path from 'node:path';
import fs from 'node:fs';
import {
  REPO_ROOT, ensureDir, readJson, writeJson, readText, writeText,
  fillTemplate, parseFlags, escapeHtml, slugify,
} from '../lib/fs.mjs';
import { validate, formatErrors } from '../lib/schema.mjs';
import { makeQrSvg } from './qr.mjs';

const KNOWN_FLAGS = new Set([
  'dir', 'id', 'title', 'kicker', 'lines', 'pinVh', 'notes', 'url',
  'purpose', 'claim', 'relation', 'evidence', 'source', 'evidenceStatus',
  'presenterAction', 'visualChange', 'reason', 'pace', 'scrollVh', 'cue',
]);
const RELATIONS = new Set(['question', 'comparison', 'change', 'sequence', 'spatial', 'structure', 'decision', 'atmosphere']);
const STATUSES = new Set(['sourced', 'synthetic', 'design-target', 'concept', 'none']);
const PACES = new Set(['pass', 'hold', 'scrub']);

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
  const isV2 = (deck.schemaVersion ?? 1) >= 2;

  if (isV2) {
    const required = ['title', 'purpose', 'claim', 'relation', 'reason', 'presenterAction', 'visualChange', 'evidenceStatus', 'pace', 'notes'];
    const missing = required.filter((name) => typeof flags[name] !== 'string' || !flags[name].trim());
    if (missing.length) {
      process.stderr.write(`scrolline add: schemaVersion 2 needs ${missing.map((name) => `--${name}`).join(', ')}\nWrite the argument and evidence before choosing a scene module.\n`);
      return 2;
    }
    if (!RELATIONS.has(flags.relation) || !STATUSES.has(flags.evidenceStatus) || !PACES.has(flags.pace)) {
      process.stderr.write(`scrolline add: invalid --relation, --evidenceStatus, or --pace\n`);
      return 2;
    }
    if (flags.evidenceStatus === 'sourced' && String(flags.source ?? '').trim().length < 8) {
      process.stderr.write('scrolline add: sourced evidence needs a specific --source\n');
      return 2;
    }
    if (['synthetic', 'design-target', 'concept'].includes(flags.evidenceStatus) &&
        !/(가상|합성|목표|콘셉트|예시|synthetic|fictional|target|concept)/i.test(String(flags.source ?? ''))) {
      process.stderr.write('scrolline add: synthetic, design-target, and concept scenes need an explicit --source label\n');
      return 2;
    }
  }

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
  if (meta.sceneContract?.status !== 'production') {
    process.stderr.write(`scrolline add: ${technique} is a selection candidate (${meta.sceneContract?.status ?? 'unreviewed'}); adapt the claim, evidence, composition, and scroll beats, then approve the rendered scene in every required viewport.\n`);
  }

  const lines = typeof flags.lines === 'string'
    ? flags.lines.split('|').map((s) => s.trim()).filter(Boolean).slice(0, 4)
    : [];
  const kicker = typeof flags.kicker === 'string' ? flags.kicker : '';
  const pinVh = Number(flags.pinVh ?? meta.pinVh ?? 180);
  const paceMode = isV2 ? flags.pace : null;
  const scrollVh = isV2 ? Number(flags.scrollVh ?? (paceMode === 'pass' ? 0 : pinVh)) : pinVh;
  if (isV2 && (!Number.isInteger(scrollVh) || scrollVh < 0 || scrollVh > 400 ||
      (paceMode === 'pass' && scrollVh !== 0) || (paceMode !== 'pass' && scrollVh === 0))) {
    process.stderr.write('scrolline add: --scrollVh must be 0 for pass and 1–400 for hold/scrub\n');
    return 2;
  }
  const cueAt = isV2 ? Number(flags.cue ?? (paceMode === 'pass' ? 0 : 0.55)) : null;
  if (isV2 && (!Number.isFinite(cueAt) || cueAt < 0 || cueAt > 1)) {
    process.stderr.write('scrolline add: --cue must be a ratio from 0 to 1\n');
    return 2;
  }
  const notes = typeof flags.notes === 'string' && flags.notes.trim()
    ? flags.notes
    : (meta.notesHint || `TODO — speaker notes for ${id}.`);

  const values = {
    id, technique, kicker, title,
    pinVh: String(pinVh),
    order: String(order),
  };

  const entry = {
    id,
    order,
    technique,
    purpose: typeof flags.purpose === 'string' ? flags.purpose : '',
    reason: typeof flags.reason === 'string' ? flags.reason : '',
    evidence: typeof flags.evidence === 'string' ? flags.evidence : '',
    source: typeof flags.source === 'string' ? flags.source : '',
    assets: {},
    copy: { kicker, title, lines },
    transition: { in: meta.transitionIn ?? 'fade', out: meta.transitionOut ?? 'fade' },
    notes,
  };
  if (isV2) {
    Object.assign(entry, {
      claim: flags.claim,
      relation: flags.relation,
      presenterAction: flags.presenterAction,
      visualChange: flags.visualChange,
      evidenceStatus: flags.evidenceStatus,
      pace: { mode: paceMode, scrollVh, cueStates: [{ at: cueAt, message: flags.claim }] },
    });
  } else {
    entry.pinVh = pinVh;
    entry.pin = meta.pin === false ? false : true;
  }
  // Pre-declare the asset keys the technique expects, so the author sees what to fill.
  // template.json writes either a boolean or a { min, max } range.
  const wants = (slot) => slot === true || (slot && typeof slot === 'object' && Number(slot.max ?? 1) > 0);
  if (wants(meta.assets?.frames)) Object.assign(entry.assets, { frames: null, count: 0, critical: [], poster: null });
  if (wants(meta.assets?.images)) entry.assets.images = [];
  if (wants(meta.assets?.video)) Object.assign(entry.assets, { video: null, poster: null });

  // --url: write a QR for the link and wire it as images[0] (closing-qr reads it there).
  const url = typeof flags.url === 'string' ? flags.url : '';
  let qrAsset = null;
  if (url) {
    let svg;
    try {
      svg = await makeQrSvg(url);
    } catch (error) {
      process.stderr.write(`scrolline add: --url given but ${error.message}\n`);
      return 1;
    }
    const publicPath = `/media/${id}/qr.svg`;
    qrAsset = { publicPath, svg };
    entry.assets.images = [publicPath, ...(entry.assets.images ?? [])];
    deck.links = { ...(deck.links ?? {}), site: url };
  }

  deck.scenes.push(entry);
  deck.scenes.sort((a, b) => a.order - b.order);

  const result = validate(SCHEMA, deck);
  if (!result.ok) {
    process.stderr.write(`scrolline add: deck.json would become invalid\n${formatErrors(result.errors)}\n`);
    return 1;
  }
  const sceneDir = path.join(dir, 'src/scenes', id);
  ensureDir(sceneDir);
  const written = [];
  for (const [rel, raw] of Object.entries(files)) {
    if (rel === 'template.json') continue; // template metadata stays in the skill
    const filled = fillTemplate(expandLines(String(raw), lines), values);
    writeText(path.join(sceneDir, rel), filled);
    written.push(rel);
  }
  if (qrAsset) {
    writeText(path.join(dir, 'public', qrAsset.publicPath), qrAsset.svg);
    written.push(`public${qrAsset.publicPath}`);
  }
  writeJson(deckFile, deck);

  process.stdout.write(
`Added ${id} (${technique}, ${isV2 ? `${paceMode} ${scrollVh}vh` : `pin ${pinVh}vh`})
  src/scenes/${id}/${written.join(', ')}
  deck.json scene ${deck.scenes.length}, total scroll ${deck.scenes.reduce((s, x) => s + (x.pace?.scrollVh ?? x.pinVh ?? 0), 0)}vh
`);
  return 0;
}

export default run;
