/** init — scaffold a deck project: Vite shell + a private copy of the engine. */
import path from 'node:path';
import fs from 'node:fs';
import {
  REPO_ROOT, ensureDir, copyDir, readJson, writeJson, readText, writeText,
  fillTemplate, slugify, parseFlags, walk, sha256File,
} from '../lib/fs.mjs';

export async function run(argv) {
  const flags = parseFlags(argv);
  const target = flags._[0];
  if (!target) {
    process.stderr.write('scrolline init: a target directory is required\n  scrolline init my-deck --title "…"\n');
    return 2;
  }

  const dir = path.resolve(process.cwd(), target);
  if (fs.existsSync(dir) && fs.readdirSync(dir).length > 0 && flags.force !== true) {
    process.stderr.write(`scrolline init: ${dir} is not empty (use --force to write anyway)\n`);
    return 2;
  }

  const title = typeof flags.title === 'string' ? flags.title : path.basename(dir);
  const subtitle = typeof flags.subtitle === 'string' ? flags.subtitle : '';
  const style = flags.style === 'light' ? 'light' : 'dark';
  const lang = typeof flags.lang === 'string' ? flags.lang : 'ko';
  const presenter = typeof flags.presenter === 'string' ? flags.presenter : '';
  const values = {
    title,
    subtitle,
    lang,
    theme: style,
    slug: slugify(path.basename(dir)),
    description: subtitle || title,
  };

  ensureDir(dir);

  // 1. project shell. `_gitignore` is stored without the dot so it does not act as
  //    an ignore file inside this repository.
  copyDir(path.join(REPO_ROOT, 'templates/project'), dir, {
    rename: (rel) => (rel === '_gitignore' ? '.gitignore' : rel),
    transform: (text) => fillTemplate(text, values),
  });

  // 2. the engine is copied in, not linked: a deck stays buildable after the skill moves.
  const engineDir = path.join(dir, 'src/engine');
  copyDir(path.join(REPO_ROOT, 'engine'), engineDir, {
    rename: (rel) => (rel === 'MANIFEST.json' || rel === 'VERSION' ? null : rel),
  });

  // 3. deck.json — presenter name is not a template placeholder.
  const deckFile = path.join(dir, 'data/deck.json');
  const deck = readJson(deckFile);
  deck.presenter.name = presenter;
  writeJson(deckFile, deck);

  // 4. install stamp: version plus the hashes we shipped, so `upgrade` can tell an
  //    untouched engine file from one the author edited.
  const engineVersion = readText(path.join(REPO_ROOT, 'engine/VERSION')).trim();
  const hashes = {};
  for (const rel of walk(engineDir)) hashes[rel] = sha256File(path.join(engineDir, rel));
  writeJson(path.join(dir, '.scrolline.json'), {
    engineVersion,
    installedAt: new Date().toISOString(),
    engineHashes: hashes,
  });

  // 5. keep the empty asset folders in git
  ensureDir(path.join(dir, 'public/media'));
  ensureDir(path.join(dir, 'public/frames'));
  ensureDir(path.join(dir, 'src/scenes'));
  writeText(path.join(dir, 'src/scenes/.gitkeep'), '');

  const relPath = path.relative(process.cwd(), dir);
  const rel = !relPath || relPath.startsWith('..') ? dir : relPath;
  process.stdout.write(
`Created ${rel} — "${title}" (${style}, engine ${engineVersion})

Next
  1. cd ${rel} && npm install
  2. storyboard the audience, claim, evidence, visual direction and scene jobs
  3. scrolline add <technique> --id 01-open --title "…" --lines "a|b"
  4. npm run dev            open http://localhost:5173
  5. scrolline check .      then scrolline verify . --strict before the talk
`);
  return 0;
}

export default run;
