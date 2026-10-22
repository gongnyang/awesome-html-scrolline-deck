import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const DECK_ID = /^_?[a-z0-9][a-z0-9-]*$/;

const option = (args, name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);

export function parseExportArgs(args) {
  if (args.includes('--help') || !args.length) return { help: true };
  const deckId = args[0];
  if (!DECK_ID.test(deckId)) throw new Error(`invalid deck id: ${deckId}`);
  const fps = Number(option(args, '--fps', '30'));
  if (!Number.isInteger(fps) || fps <= 0) throw new Error('--fps must be a positive integer');
  return {
    deckId,
    fps,
    out: option(args, '--out', `out/export/${deckId}.mp4`),
    report: option(args, '--report', null),
    dryRun: args.includes('--dry-run'),
    buildOnly: args.includes('--build-only'),
  };
}

export function exportPaths(root, deckId, out = `out/export/${deckId}.mp4`) {
  return {
    deckFile: path.join(root, 'decks', deckId, 'deck.yaml'),
    buildDir: path.join(root, 'out', 'export', deckId),
    out: path.resolve(root, out),
  };
}

export function parseCaptureArgs(args) {
  if (args.includes('--help') || !args.length) return { help: true };
  const deckId = args[0];
  if (!DECK_ID.test(deckId)) throw new Error(`invalid deck id: ${deckId}`);
  const atIndex = args.indexOf('--at');
  const at =
    atIndex < 0
      ? []
      : String(args[atIndex + 1] ?? '')
          .split(',')
          .filter(Boolean);
  return { deckId, stops: args.includes('--stops'), between: args.includes('--between'), at };
}

// 엔진·registry는 늘 이 레포 것(root는 덱·출력 위치만 바꾼다).
const CODE_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');


/**
 * Deck → timing map and export path, no build or render (the --dry-run report).
 * Engine, yaml and the move registry load lazily: a static import made `--help` take seconds on /mnt/d.
 */
export async function exportPlan(root, { deckId, fps, out: outArg }) {
  const { deckFile, buildDir, out } = exportPaths(root, deckId, outArg);
  if (!existsSync(deckFile)) throw new Error(`deck not found: ${deckId}`);
  const [{ default: YAML }, { exportHolds, exportPath }, { plan }] = await Promise.all([
    import('yaml'),
    import('../engine/export.js'),
    import('../engine/timeline.js'),
  ]);
  const deck = YAML.parse(readFileSync(deckFile, 'utf8'));
  const [{ default: moves }, { default: concept }] = await Promise.all([
    import('../moves/index.js'),
    import(pathToFileURL(path.join(CODE_ROOT, 'concepts', deck.concept, 'index.js')).href),
  ]);
  const map = plan(deck, { registry: moves, concept });
  const pathInfo = exportPath(map, deck.export, exportHolds(deck, map));
  return { deck: deckId, fps, out, buildDir, map, path: pathInfo };
}

