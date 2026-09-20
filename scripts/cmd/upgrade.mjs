/**
 * upgrade — refresh a project's copied engine.
 *
 * init records the sha256 of every engine file it installed in .scrolline.json.
 * A file whose hash still matches is untouched and is replaced silently; a file
 * whose hash differs was edited locally and is only replaced with --force.
 *
 * `scrolline upgrade --manifest` regenerates engine/MANIFEST.json in this repo.
 */
import path from 'node:path';
import fs from 'node:fs';
import {
  REPO_ROOT, readJson, writeJson, readText, walk, sha256File, ensureDir, parseFlags,
} from '../lib/fs.mjs';

function buildManifest() {
  const engineDir = path.join(REPO_ROOT, 'engine');
  const version = readText(path.join(engineDir, 'VERSION')).trim();
  const files = {};
  for (const rel of walk(engineDir)) {
    if (rel === 'MANIFEST.json') continue;
    files[rel] = sha256File(path.join(engineDir, rel));
  }
  const manifest = { engineVersion: version, generatedAt: new Date().toISOString(), files };
  writeJson(path.join(engineDir, 'MANIFEST.json'), manifest);
  return manifest;
}

export async function run(argv) {
  const flags = parseFlags(argv);

  if (flags.manifest) {
    const manifest = buildManifest();
    process.stdout.write(`engine/MANIFEST.json — ${Object.keys(manifest.files).length} files, engine ${manifest.engineVersion}\n`);
    for (const [file, hash] of Object.entries(manifest.files)) {
      process.stdout.write(`  ${hash.slice(0, 12)}  ${file}\n`);
    }
    return 0;
  }

  const dir = path.resolve(process.cwd(), flags._[0] ?? '.');
  const stampFile = path.join(dir, '.scrolline.json');
  if (!fs.existsSync(stampFile)) {
    process.stderr.write(`scrolline upgrade: ${stampFile} not found — is this a scrolline project?\n`);
    return 2;
  }

  const stamp = readJson(stampFile);
  const engineSrc = path.join(REPO_ROOT, 'engine');
  const engineDst = path.join(dir, 'src/engine');
  const nextVersion = readText(path.join(engineSrc, 'VERSION')).trim();

  const replaced = [];
  const modified = [];
  const added = [];

  for (const rel of walk(engineSrc)) {
    if (rel === 'MANIFEST.json' || rel === 'VERSION') continue;
    const dest = path.join(engineDst, rel);
    if (!fs.existsSync(dest)) { added.push(rel); continue; }
    const current = sha256File(dest);
    const installed = stamp.engineHashes?.[rel];
    if (current === sha256File(path.join(engineSrc, rel))) continue; // already up to date
    if (installed && current !== installed) modified.push(rel);
    else replaced.push(rel);
  }

  if (modified.length && !flags.force) {
    process.stderr.write(
`scrolline upgrade: ${modified.length} engine file(s) were edited in this project:
${modified.map((f) => `  src/engine/${f}`).join('\n')}
Re-run with --force to overwrite them, or move your changes into a scene module first.
`);
    return 1;
  }

  const write = [...replaced, ...added, ...(flags.force ? modified : [])];
  ensureDir(engineDst);
  for (const rel of write) {
    ensureDir(path.dirname(path.join(engineDst, rel)));
    fs.copyFileSync(path.join(engineSrc, rel), path.join(engineDst, rel));
  }

  const hashes = {};
  for (const rel of walk(engineDst)) hashes[rel] = sha256File(path.join(engineDst, rel));
  writeJson(stampFile, {
    ...stamp,
    engineVersion: nextVersion,
    upgradedAt: new Date().toISOString(),
    engineHashes: hashes,
  });

  process.stdout.write(
`engine ${stamp.engineVersion ?? '?'} → ${nextVersion}
  replaced ${replaced.length}${added.length ? `, added ${added.length}` : ''}${flags.force && modified.length ? `, forced ${modified.length}` : ''}${write.length === 0 ? ' (already current)' : ''}
`);
  return 0;
}

export default run;
