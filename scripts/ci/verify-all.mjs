/** Build and wheel-verify every published deck before assembling the gallery. */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const examples = path.join(root, 'examples');
const templateRoot = path.join(root, 'templates', 'scenes');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const useInstalledDependencies = process.env.SCROLLINE_USE_INSTALLED_DEPS === '1';
const concurrency = Math.max(1, Math.min(4, Number(process.env.SCROLLINE_VERIFY_CONCURRENCY) || 2));
const decks = fs.readdirSync(examples).filter((name) =>
  fs.existsSync(path.join(examples, name, 'data', 'deck.json'))).sort();

if (decks.length !== 8) throw new Error(`Expected eight published decks, found ${decks.length}`);
const templates = fs.readdirSync(templateRoot).filter((name) =>
  fs.statSync(path.join(templateRoot, name)).isDirectory() &&
  ['scene.html', 'scene.css', 'scene.js'].every((file) => fs.existsSync(path.join(templateRoot, name, file))));
if (templates.length < 24) throw new Error(`Expected at least 24 executable scene templates, found ${templates.length}`);
const ready = templates.filter((name) => {
  const dir = path.join(templateRoot, name);
  const metadataPath = path.join(dir, 'template.json');
  if (!fs.existsSync(metadataPath) || !fs.existsSync(path.join(dir, 'preview.webp'))) return false;
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  return metadata.sceneContract?.status === 'production';
});
if (ready.length < 24) throw new Error(`Expected at least 24 production-reviewed scene templates, found ${ready.length}`);

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd, stdio: 'inherit', shell: process.platform === 'win32' && command.endsWith('.cmd'),
    });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)));
  });
}

async function verifyDeck(name) {
  const dir = path.join(examples, name);
  const deck = JSON.parse(fs.readFileSync(path.join(dir, 'data', 'deck.json'), 'utf8'));
  if (!Array.isArray(deck.scenes) || deck.scenes.length < 8 || deck.scenes.length > 12) {
    throw new Error(`${name}: expected 8–12 distinct presentation scenes, found ${deck.scenes?.length ?? 0}`);
  }
  const steps = [
    ...useInstalledDependencies ? [] : [[npm, ['ci', '--no-audit', '--no-fund'], dir]],
    [process.execPath, [path.join(root, 'scripts', 'cli.mjs'), 'check', dir], root],
    [process.execPath, [path.join(root, 'scripts', 'cli.mjs'), 'verify', dir, '--strict', '--build', '--port', String(57000 + decks.indexOf(name))], root],
  ];
  for (const [command, args, cwd] of steps) {
    await run(command, args, cwd);
  }
  const report = JSON.parse(fs.readFileSync(path.join(dir, 'qa', 'report.json'), 'utf8'));
  if (!report.ok || report.gates.some((gate) => gate.skipped)) {
    throw new Error(`${name}: browser verification did not pass every gate`);
  }
}
let next = 0;
async function worker() {
  while (next < decks.length) {
    const name = decks[next++];
    console.log(`Verifying ${name}...`);
    await verifyDeck(name);
    console.log(`Verified ${name}`);
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, decks.length) }, worker));
console.log(`Verified ${decks.length} decks with real browser gates.`);
