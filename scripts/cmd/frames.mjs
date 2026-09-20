/** frames — cut a video into a scrubbable JPEG sequence under public/frames/<name>/. */
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { ensureDir, readJson, writeJson, parseFlags, walk } from '../lib/fs.mjs';

const MAX_FRAMES = 120;
const MAX_BYTES = 10 * 1024 * 1024;

const hasFfmpeg = () => {
  const probe = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  return !probe.error && probe.status === 0;
};

function extract(video, outDir, { fps, width }) {
  ensureDir(outDir);
  for (const file of fs.readdirSync(outDir)) {
    if (/^f_\d+\.jpg$/.test(file)) fs.unlinkSync(path.join(outDir, file));
  }
  const args = [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', video,
    '-vf', `fps=${fps},scale=${width}:-2`,
    '-q:v', '4',
    path.join(outDir, 'f_%03d.jpg'),
  ];
  const result = spawnSync('ffmpeg', args, { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`ffmpeg failed (exit ${result.status})`);
  const files = walk(outDir).filter((f) => /^f_\d+\.jpg$/.test(f));
  const bytes = files.reduce((sum, f) => sum + fs.statSync(path.join(outDir, f)).size, 0);
  return { count: files.length, bytes };
}

export async function run(argv) {
  const flags = parseFlags(argv);
  const video = flags._[0];
  const dir = path.resolve(process.cwd(), flags.dir ?? flags._[1] ?? '.');

  if (!video) {
    process.stderr.write('scrolline frames: a source video is required\n  scrolline frames hero.mp4 --name hero --fps 12 --width 1280\n');
    return 2;
  }
  const source = path.resolve(process.cwd(), video);
  if (!fs.existsSync(source)) {
    process.stderr.write(`scrolline frames: ${source} not found\n`);
    return 2;
  }
  if (!hasFfmpeg()) {
    process.stderr.write(
`scrolline frames: ffmpeg is not on PATH.
  macOS   brew install ffmpeg
  Ubuntu  sudo apt install ffmpeg
  Windows winget install Gyan.FFmpeg
`);
    return 2;
  }

  const name = typeof flags.name === 'string' ? flags.name : path.basename(source).replace(/\.[^.]+$/, '');
  const fps = Number(flags.fps ?? 12);
  const width = Number(flags.width ?? 1280);
  const mobileWidth = flags.mobile === true ? 640 : Number(flags.mobile ?? 0);

  const framesRoot = path.join(dir, 'public/frames');
  const outDir = path.join(framesRoot, name);
  const main = extract(source, outDir, { fps, width });
  process.stdout.write(`public/frames/${name}/  ${main.count} frames, ${(main.bytes / 1048576).toFixed(1)} MB\n`);

  let mobile = null;
  if (mobileWidth > 0) {
    mobile = extract(source, path.join(framesRoot, `${name}-mobile`), { fps, width: mobileWidth });
    process.stdout.write(`public/frames/${name}-mobile/  ${mobile.count} frames, ${(mobile.bytes / 1048576).toFixed(1)} MB\n`);
  }

  if (main.count > MAX_FRAMES || main.bytes > MAX_BYTES) {
    const suggestFps = Math.max(6, Math.floor((fps * MAX_FRAMES) / Math.max(1, main.count)));
    process.stdout.write(
`GUARD  a scrub sequence should stay under ${MAX_FRAMES} frames and ${MAX_BYTES / 1048576} MB.
       Re-run with a lower rate or width, e.g.
       scrolline frames ${video} --name ${name} --fps ${suggestFps} --width ${Math.min(width, 1280)}
`);
  }

  const sceneId = typeof flags.scene === 'string' ? flags.scene : null;
  if (sceneId) {
    const deckFile = path.join(dir, 'data/deck.json');
    if (!fs.existsSync(deckFile)) {
      process.stderr.write(`scrolline frames: ${deckFile} not found, frames written but deck.json not updated\n`);
      return 1;
    }
    const deck = readJson(deckFile);
    const scene = (deck.scenes ?? []).find((s) => s.id === sceneId);
    if (!scene) {
      process.stderr.write(`scrolline frames: scene "${sceneId}" is not in deck.json\n`);
      return 1;
    }
    scene.assets ??= {};
    scene.assets.frames = `/frames/${name}/f_%03d.jpg`;
    if (mobile) scene.assets.mobileFrames = `/frames/${name}-mobile/f_%03d.jpg`;
    scene.assets.count = main.count;
    scene.assets.critical = [...new Set([1, Math.round(main.count / 2), main.count])].filter((n) => n >= 1);
    scene.assets.poster ??= `/frames/${name}/f_001.jpg`;
    writeJson(deckFile, deck);
    process.stdout.write(`deck.json ${sceneId}: frames, count ${main.count}, critical ${scene.assets.critical.join(', ')}\n`);
  } else {
    process.stdout.write(`Add to the scene's assets block:\n  "frames": "/frames/${name}/f_%03d.jpg", "count": ${main.count}, "critical": [1, ${Math.round(main.count / 2)}, ${main.count}]\n`);
  }
  return 0;
}

export default run;
