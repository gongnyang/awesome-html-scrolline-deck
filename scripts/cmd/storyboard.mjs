/** storyboard — print the deck as the table the author edits from. */
import path from 'node:path';
import fs from 'node:fs';
import { readJson, parseFlags } from '../lib/fs.mjs';

const cut = (text, max) => {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim();
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
};

/** Pad by display width: CJK glyphs occupy two columns in a terminal. */
const width = (s) => [...String(s)].reduce((w, ch) => w + (/[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(ch) ? 2 : 1), 0);
const pad = (s, n) => `${s}${' '.repeat(Math.max(0, n - width(s)))}`;

export async function run(argv) {
  const flags = parseFlags(argv);
  const dir = path.resolve(process.cwd(), flags.dir ?? flags._[0] ?? '.');
  const deckFile = path.join(dir, 'data/deck.json');
  if (!fs.existsSync(deckFile)) {
    process.stderr.write(`scrolline storyboard: ${deckFile} not found\n`);
    return 2;
  }
  const deck = readJson(deckFile);
  const scenes = [...(deck.scenes ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (scenes.length === 0) {
    process.stdout.write(`${deck.title ?? 'deck'} — no scenes yet. Choose a scene by purpose, then add it with scrolline add <technique>.\n`);
    return 0;
  }

  const rows = scenes.map((s) => ({
    id: s.id,
    technique: s.technique ?? '',
    kicker: cut(s.copy?.kicker, 18),
    title: cut(s.copy?.title, 30),
    lines: String((s.copy?.lines ?? []).length),
    asset: s.assets?.frames ? `frames×${s.assets.count ?? 0}`
      : s.assets?.video ? 'video'
      : (s.assets?.images ?? []).length ? `images×${s.assets.images.length}`
      : '—',
    pin: `${s.pinVh ?? 0}${s.pin === false ? ' (no pin)' : ''}`,
    notes: (s.notes ?? '').trim() ? 'yes' : 'MISSING',
    purpose: cut(s.purpose, 22),
    reason: cut(s.reason, 32),
  }));

  const head = { id: 'id', technique: 'technique', purpose: 'purpose', reason: 'why this scene', title: 'claim', asset: 'asset', pin: 'pinVh', notes: 'notes' };
  const cols = Object.keys(head);
  const widths = Object.fromEntries(cols.map((c) => [c, Math.max(width(head[c]), ...rows.map((r) => width(r[c])))]));
  const line = (r) => `| ${cols.map((c) => pad(r[c], widths[c])).join(' | ')} |`;

  const totalPin = scenes.reduce((sum, s) => sum + (Number(s.pinVh) || 0), 0);
  process.stdout.write(`${deck.title ?? 'deck'}${deck.subtitle ? ` — ${deck.subtitle}` : ''}\n\n`);
  process.stdout.write(`${line(head)}\n`);
  process.stdout.write(`|${cols.map((c) => '-'.repeat(widths[c] + 2)).join('|')}|\n`);
  rows.forEach((r) => process.stdout.write(`${line(r)}\n`));
  process.stdout.write(
`\n${scenes.length} scene${scenes.length === 1 ? '' : 's'} · total pin ${totalPin}vh · about ${(scenes.length * 1.5).toFixed(0)} minutes spoken
theme ${deck.theme?.style ?? 'dark'} · presenter auto-advance ${deck.presenter?.autoDurationSec ?? 180}s\n`);

  const missing = rows.filter((r) => r.notes === 'MISSING').map((r) => r.id);
  if (missing.length) process.stdout.write(`notes missing: ${missing.join(', ')}\n`);
  return 0;
}

export default run;
