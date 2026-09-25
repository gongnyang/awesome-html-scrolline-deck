/** Build and wheel-verify every published deck before assembling the gallery. */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const examples = path.join(root, 'examples');
const templateRoot = path.join(root, 'templates', 'scenes');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const decks = fs.readdirSync(examples).filter((name) =>
  fs.existsSync(path.join(examples, name, 'data', 'deck.json'))).sort();

if (decks.length !== 8) throw new Error(`Expected eight published decks, found ${decks.length}`);
const templates = fs.readdirSync(templateRoot).filter((name) =>
  fs.statSync(path.join(templateRoot, name)).isDirectory() &&
  ['scene.html', 'scene.css', 'scene.js'].every((file) => fs.existsSync(path.join(templateRoot, name, file))));
if (templates.length !== 24) throw new Error(`Expected 24 executable scene templates, found ${templates.length}`);

for (const name of decks) {
  const dir = path.join(examples, name);
  const steps = [
    [npm, ['ci', '--no-audit', '--no-fund'], dir],
    [process.execPath, [path.join(root, 'scripts', 'cli.mjs'), 'check', dir], root],
    [process.execPath, [path.join(root, 'scripts', 'cli.mjs'), 'verify', dir, '--strict', '--build'], root],
  ];
  for (const [command, args, cwd] of steps) {
    const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
    if (result.status !== 0) throw new Error(`${name}: ${command} ${args.join(' ')} failed`);
  }
  const report = JSON.parse(fs.readFileSync(path.join(dir, 'qa', 'report.json'), 'utf8'));
  if (!report.ok || report.gates.some((gate) => gate.skipped)) {
    throw new Error(`${name}: browser verification did not pass every gate`);
  }
}
console.log(`Verified ${decks.length} decks with real browser gates.`);
