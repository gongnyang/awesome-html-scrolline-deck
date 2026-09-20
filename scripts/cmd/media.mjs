/**
 * media — put an image into public/media/<scene>/ at deck resolution.
 * Converts to webp with sharp when sharp is installed; otherwise copies as-is.
 */
import path from 'node:path';
import fs from 'node:fs';
import { ensureDir, readJson, writeJson, parseFlags } from '../lib/fs.mjs';

export async function run(argv) {
  const flags = parseFlags(argv);
  const input = flags._[0];
  const dir = path.resolve(process.cwd(), flags.dir ?? '.');
  const sceneId = typeof flags.scene === 'string' ? flags.scene : null;

  if (!input || !sceneId) {
    process.stderr.write('scrolline media: a source file and --scene are required\n  scrolline media shot.png --scene 04-gallery\n');
    return 2;
  }
  const source = path.resolve(process.cwd(), input);
  if (!fs.existsSync(source)) {
    process.stderr.write(`scrolline media: ${source} not found\n`);
    return 2;
  }

  const width = Number(flags.width ?? 1600);
  const outDir = path.join(dir, 'public/media', sceneId);
  ensureDir(outDir);
  const base = path.basename(source).replace(/\.[^.]+$/, '');

  let publicPath;
  let sharp = null;
  try { sharp = (await import('sharp')).default; } catch { /* optional */ }

  if (sharp && /\.(png|jpe?g|webp|tiff?)$/i.test(source)) {
    const dest = path.join(outDir, `${base}.webp`);
    await sharp(source).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(dest);
    publicPath = `/media/${sceneId}/${base}.webp`;
    process.stdout.write(`${publicPath} — webp, max width ${width} (${(fs.statSync(dest).size / 1024).toFixed(0)} KB)\n`);
  } else {
    const dest = path.join(outDir, path.basename(source));
    fs.copyFileSync(source, dest);
    publicPath = `/media/${sceneId}/${path.basename(source)}`;
    process.stdout.write(`${publicPath} — copied as-is${sharp ? '' : ' (install sharp for webp conversion)'}\n`);
  }

  const deckFile = path.join(dir, 'data/deck.json');
  if (fs.existsSync(deckFile)) {
    const deck = readJson(deckFile);
    const scene = (deck.scenes ?? []).find((s) => s.id === sceneId);
    if (scene) {
      scene.assets ??= {};
      if (flags.poster) scene.assets.poster = publicPath;
      else {
        scene.assets.images ??= [];
        if (!scene.assets.images.includes(publicPath)) scene.assets.images.push(publicPath);
      }
      writeJson(deckFile, deck);
      process.stdout.write(`deck.json ${sceneId}: ${flags.poster ? 'poster' : `images[${scene.assets.images.length - 1}]`} set\n`);
    }
  }
  return 0;
}

export default run;
