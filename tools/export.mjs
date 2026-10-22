#!/usr/bin/env node
/** Build one deck's fixed-size HyperFrames composition and render it to MP4. */
import { cpSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportPlan, parseExportArgs } from './export-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const usage =
  'node tools/export.mjs <deckId> [--fps 30] [--out out/export/<deckId>.mp4] [--build-only] [--report file] [--dry-run]';
const run = (command, args, env = process.env) => {
  const result = spawnSync(command, args, { cwd: ROOT, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited ${result.status}`);
};

export function setCompositionRoot(file, report, io = { readFileSync, writeFileSync }) {
  const html = io.readFileSync(file, 'utf8');
  const root = `<div id="scrolline-root" data-composition-id="scrolline" data-width="1920" data-height="1080" data-duration="${report.path.duration}">`;
  // HyperFrames lints the standalone HTML, not Vite's external bundle.  Keep
  // this static registration shape for lint while boot performs the real,
  // post-build assignment from its export-ready branch.  Executing an alias
  // assignment here would overwrite HyperFrames' timeline proxy during render.
  const registration = `<script>if(false)window.__timelines['scrolline']=window.__timelines.scrolline</script>`;
  const replaced = html.replace('<div id="app"></div>', `${root}<div id="app"></div></div>${registration}`);
  if (replaced === html) throw new Error('export HTML must contain <div id="app"></div>');
  io.writeFileSync(file, replaced);
}

function builtEntry(buildDir) {
  const html = readdirSync(buildDir, { withFileTypes: true }).filter(
    (entry) => entry.isFile() && entry.name.endsWith('.html'),
  );
  if (html.length !== 1 || html[0].name !== 'index.html')
    throw new Error(`Vite build must produce exactly ${path.join(buildDir, 'index.html')}`);
  return path.join(buildDir, 'index.html');
}

async function main() {
  const args = process.argv.slice(2);
  const parsed = parseExportArgs(args);
  if (parsed.help) return console.log(usage);
  const { deckId, fps } = parsed;
  const report = await exportPlan(ROOT, parsed);
  const { buildDir, out } = report;
  if (parsed.report) writeFileSync(path.resolve(ROOT, parsed.report), `${JSON.stringify(report, null, 2)}\n`);
  if (parsed.dryRun) return console.log(JSON.stringify(report, null, 2));
  run('npx', ['vite', 'build'], {
    ...process.env,
    SCROLLINE_MODE: 'export',
    SCROLLINE_DECK: deckId,
    SCROLLINE_OUT: buildDir,
  });
  const entry = builtEntry(buildDir);
  const assets = path.join(ROOT, 'decks', deckId, 'assets');
  if (existsSync(assets)) cpSync(assets, path.join(buildDir, 'assets'), { recursive: true });
  setCompositionRoot(entry, report);
  run('npx', ['hyperframes', 'lint', buildDir]);
  if (parsed.buildOnly) return console.log(JSON.stringify({ ...report, entry }, null, 2));
  run('npx', ['hyperframes', 'render', buildDir, '--fps', String(fps), '--output', out]);
  console.log(JSON.stringify({ ...report, entry }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`export: ${error.message}`);
    process.exitCode = 2;
  });
}
