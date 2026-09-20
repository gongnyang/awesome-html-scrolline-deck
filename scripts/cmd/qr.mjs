/** qr — write a QR code as an SVG that inherits the deck's text colour. */
import path from 'node:path';
import { writeText, parseFlags } from '../lib/fs.mjs';

export async function run(argv) {
  const flags = parseFlags(argv);
  const url = typeof flags.url === 'string' ? flags.url : flags._[0];
  const out = typeof flags.out === 'string' ? flags.out : flags._[1];

  if (!url || !out) {
    process.stderr.write('scrolline qr: --url and --out are required\n  scrolline qr --url https://example.com --out public/media/09-close/qr.svg\n');
    return 2;
  }

  let QRCode;
  try {
    QRCode = (await import('qrcode')).default;
  } catch {
    process.stderr.write('scrolline qr: the "qrcode" package is not installed. Run npm install in the skill folder.\n');
    return 2;
  }

  const svg = await QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' });
  // Let CSS colour the code: fills become currentColor, the light modules go transparent.
  // qrcode emits either a filled path or a stroked one depending on the version;
  // map the dark modules to currentColor and drop the light background either way.
  const themed = svg
    .replace(/(fill|stroke)="#(fff|ffffff)"/gi, '$1="none"')
    .replace(/(fill|stroke)="#(000|000000)"/gi, '$1="currentColor"')
    .replace(/shape-rendering="crispEdges"/i, 'shape-rendering="crispEdges" role="img" aria-label="QR code"');

  const file = path.resolve(process.cwd(), out);
  writeText(file, themed);
  process.stdout.write(`${out} — QR for ${url} (currentColor)\n`);
  return 0;
}

export default run;
