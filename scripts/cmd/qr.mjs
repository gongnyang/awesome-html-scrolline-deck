/** qr — write a QR code as an SVG that inherits the deck's text colour. */
import path from 'node:path';
import fs from 'node:fs';
import { writeText, parseFlags, readJson, writeJson } from '../lib/fs.mjs';

/** Build a themed QR SVG (dark modules = currentColor, background transparent). */
export async function makeQrSvg(url) {
  let QRCode;
  try {
    QRCode = (await import('qrcode')).default;
  } catch {
    throw new Error('the "qrcode" package is not installed. Run npm install in the skill folder.');
  }
  const svg = await QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' });
  return svg
    .replace(/(fill|stroke)="#(fff|ffffff)"/gi, '$1="none"')
    .replace(/(fill|stroke)="#(000|000000)"/gi, '$1="currentColor"')
    .replace(/shape-rendering="crispEdges"/i, 'shape-rendering="crispEdges" role="img" aria-label="QR code"');
}

/**
 * Register a QR file on a scene: assets.images[0] = the SVG, deck.links.site = the URL.
 * Returns false when the scene is not in deck.json.
 */
export function wireQr(deckFile, sceneId, publicPath, url) {
  const deck = readJson(deckFile);
  const scene = (deck.scenes ?? []).find((s) => s.id === sceneId);
  if (!scene) return false;
  scene.assets ??= {};
  const images = (scene.assets.images ?? []).filter((p) => p !== publicPath);
  images.unshift(publicPath); // closing-qr reads the QR from images[0]
  scene.assets.images = images;
  deck.links = { ...(deck.links ?? {}), site: url };
  writeJson(deckFile, deck);
  return true;
}

export async function run(argv) {
  const flags = parseFlags(argv);
  const url = typeof flags.url === 'string' ? flags.url : flags._[0];
  const scene = typeof flags.scene === 'string' ? flags.scene : null;
  const dir = path.resolve(process.cwd(), typeof flags.dir === 'string' ? flags.dir : '.');
  let out = typeof flags.out === 'string' ? flags.out : flags._[1];
  if (!out && scene) out = path.join('public/media', scene, 'qr.svg');

  if (!url || !out) {
    process.stderr.write('scrolline qr: --url and (--scene <id> | --out <file>) are required\n  scrolline qr --url https://example.com --scene 09-close\n');
    return 2;
  }

  let themed;
  try {
    themed = await makeQrSvg(url);
  } catch (error) {
    process.stderr.write(`scrolline qr: ${error.message}\n`);
    return 2;
  }

  const file = path.resolve(dir, out);
  writeText(file, themed);
  process.stdout.write(`${out} — QR for ${url} (currentColor)\n`);

  if (scene) {
    const deckFile = path.join(dir, 'data/deck.json');
    if (!fs.existsSync(deckFile)) {
      process.stderr.write(`scrolline qr: ${deckFile} not found — pass --dir <project> or run inside the deck\n`);
      return 1;
    }
    const publicPath = `/${path.relative(path.join(dir, 'public'), file).split(path.sep).join('/')}`;
    if (!wireQr(deckFile, scene, publicPath, url)) {
      process.stderr.write(`scrolline qr: scene "${scene}" is not in deck.json\n`);
      return 1;
    }
    process.stdout.write(`deck.json ${scene}: assets.images[0] = ${publicPath}, links.site = ${url}\n`);
  }
  return 0;
}

export default run;
