/**
 * build.mjs — cut the captured frames into docs/demo.mp4, plus the poster and the
 * README teaser GIF.
 *
 * Two ffmpeg stages. First each segment is encoded on its own, which is where the
 * push-ins live: during the long holds the frame creeps in by about five percent, so
 * an infographic that has just landed keeps moving. Then one command chains the
 * segments with xfade, lays the synthesised bed underneath and encodes the master.
 *
 *   node tools/demo/build.mjs [--skip-segments]
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { CARDS, EDIT, FPS, PASSES, PRESENTER, REPO, passFrames, passHolds } from './shots.mjs';
import { audioArgs } from './music.mjs';

const run = promisify(execFile);
const FFMPEG = '/home/seunghyeong/.local/bin/ffmpeg';
const FFPROBE = '/home/seunghyeong/.local/bin/ffprobe';

const SCRATCH = process.env.DEMO_SCRATCH
  ?? '/tmp/claude-1000/-home-seunghyeong/5a368c9d-2934-46d9-a7ee-fd39df4aef46/scratchpad/demo';
const FRAMES = `${SCRATCH}/frames`;
const SEGMENTS = `${SCRATCH}/segments`;
const DOCS = `${REPO}/docs`;

const ffmpeg = (args) => run(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { maxBuffer: 1 << 26 });

/**
 * How many frames each segment runs for, and where the picture stops moving.
 *
 * Every visit rests on its 55% frame, which is the point of it — but a settled scene
 * is also a frozen frame, so each rest gets a push-in. The title cards and the
 * presenter beat are static for most of their length by nature, so they drift instead.
 */
function segmentPlan(source) {
  if (source.startsWith('card-')) {
    return { frames: CARDS[source.slice(5)].frames, holds: [], drift: 0.022 };
  }
  if (source === 'presenter') {
    return { frames: PRESENTER.frames, holds: [], drift: 0.045 };
  }
  const pass = PASSES[source];
  return { frames: passFrames(pass), holds: passHolds(pass), drift: 0 };
}

/**
 * A zoompan expression: a slow drift across the whole segment, plus a push-in across
 * each rest that releases over the exit ramp following it — so the zoom is back to
 * neutral by the time the visit cuts away.
 */
function pushInExpression({ holds, drift, frames }, { release = 10 } = {}) {
  const terms = [];
  if (drift) terms.push(`${drift}*on/${frames - 1}`);
  for (const { start, end, amount } of holds) {
    const span = Math.max(1, end - start);
    const rampIn = `(on-${start})/${span}`;
    const rampOut = `1-(on-${end})/${release}`;
    terms.push(`${amount}*if(between(on,${start},${end}),${rampIn},if(between(on,${end},${end + release}),${rampOut},0))`);
  }
  return terms.length ? `1+${terms.join('+')}` : null;
}

async function buildSegment(source) {
  const plan = segmentPlan(source);
  const { frames, holds } = plan;
  const out = `${SEGMENTS}/${source}.mp4`;
  const filters = [];

  const z = pushInExpression(plan);
  if (z) {
    filters.push(
      `zoompan=z='${z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=${FPS}`,
    );
  }
  filters.push('format=yuv420p');

  await ffmpeg([
    '-framerate', String(FPS),
    '-start_number', '0',
    '-i', `${FRAMES}/${source}/f_%05d.jpg`,
    '-frames:v', String(frames),
    '-vf', filters.join(','),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14',
    '-r', String(FPS),
    out,
  ]);
  const { size } = await stat(out);
  console.log(`  ${source.padEnd(15)} ${String(frames).padStart(4)}f  ${(frames / FPS).toFixed(2)}s  ` +
    `${holds.length} push-in${plan.drift ? ' + drift' : ''}  ${(size / 1e6).toFixed(1)}MB`);
  return { source, frames, seconds: frames / FPS, path: out };
}

/** Lay the segments end to end, overlapping each cut by its transition duration. */
function cutTimeline(segments) {
  let clock = 0;
  const cuts = [];
  segments.forEach((seg, i) => {
    const edit = EDIT[i];
    if (i === 0) { clock = seg.seconds; return; }
    const d = edit.xfadeIn.duration;
    const offset = clock - d;                 // xfade starts this many seconds in
    cuts.push({ ...edit.xfadeIn, offset });
    clock = offset + d + (seg.seconds - d);   // == clock - d + seg.seconds
  });
  return { cuts, duration: clock };
}

async function build({ skipSegments = false } = {}) {
  await mkdir(SEGMENTS, { recursive: true });
  await mkdir(DOCS, { recursive: true });

  console.log('segments:');
  const segments = [];
  for (const { source } of EDIT) {
    if (skipSegments) {
      const { frames } = segmentPlan(source);
      segments.push({ source, frames, seconds: frames / FPS, path: `${SEGMENTS}/${source}.mp4` });
    } else {
      segments.push(await buildSegment(source));
    }
  }

  const { cuts, duration } = cutTimeline(segments);
  console.log(`\ntimeline: ${duration.toFixed(2)}s over ${segments.length} segments, ${cuts.length} transitions`);

  // video: [0][1]xfade -> [v1]; [v1][2]xfade -> [v2]; ...
  const chain = [];
  let label = '0:v';
  cuts.forEach((cut, i) => {
    const next = `v${i + 1}`;
    chain.push(`[${label}][${i + 1}:v]xfade=transition=${cut.transition}:duration=${cut.duration}:offset=${cut.offset.toFixed(4)}[${next}]`);
    label = next;
  });
  // A vignette settles the eye on the centre; the grain is there to stop the dark
  // gradients banding once x264 has had its way with them.
  chain.push(`[${label}]vignette=angle=PI/6,noise=alls=3:allf=t,format=yuv420p[vout]`);

  const audio = audioArgs({ duration });
  const audioIndex = segments.length;
  chain.push(`[${audioIndex}:a]${audio.filter}[aout]`);

  const out = `${DOCS}/demo.mp4`;
  await ffmpeg([
    ...segments.flatMap((s) => ['-i', s.path]),
    ...audio.input,
    '-filter_complex', chain.join(';'),
    '-map', '[vout]', '-map', '[aout]',
    '-c:v', 'libx264', '-preset', 'slow',
    '-b:v', '2900k', '-maxrate', '3400k', '-bufsize', '6800k',
    '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
    '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
    '-movflags', '+faststart',
    '-r', String(FPS),
    out,
  ]);

  await ffmpeg(['-ss', '3', '-i', out, '-frames:v', '1', '-q:v', '3', `${DOCS}/demo-poster.jpg`]);
  return { out, duration, segments };
}

/**
 * The README teaser: a hard-cut run through all four decks.
 *
 * Built from the captured frames, not from the encoded segments, and deliberately so.
 * The segments carry a push-in across every rest, which moves every pixel of every
 * frame — fine for H.264, ruinous for GIF, which leans on frames repeating. Sourcing
 * the raw frames instead takes the same 12.4 seconds from 11.5MB to inside the budget.
 *
 * Each slice starts on a visit boundary and runs just over three seconds, so it opens
 * on a scene arriving and carries one hard cut.
 */
async function buildGif() {
  const slices = [
    { source: 'sample-deck', from: 148, frames: 93 },     // 03-arc, entrance/hold/exit
    { source: 'product-launch', from: 63, frames: 93 },   // 02-turn, the headphone
    { source: 'annual-report', from: 0, frames: 93 },     // 02-anatomy, the chart
    { source: 'city-guide', from: 0, frames: 93 },        // 01-hero, the sunset
  ];

  const inputs = slices.flatMap((s) => [
    '-framerate', String(FPS),
    '-start_number', String(s.from),
    '-i', `${FRAMES}/${s.source}/f_%05d.jpg`,
  ]);
  const trims = slices
    .map((s, i) => `[${i}:v]trim=end_frame=${s.frames},setpts=PTS-STARTPTS[t${i}]`)
    .join(';');
  const concat = slices.map((_, i) => `[t${i}]`).join('') + `concat=n=${slices.length}:v=1:a=0[c]`;
  // 15fps at 160 colours lands near 6.9MB, inside the 8MB budget with room to spare.
  // Sourcing raw frames rather than the pushed-in segments is what bought that headroom;
  // when the GIF was cut from the segments the same length needed 12fps and 64 colours.
  const palette = '[c]fps=15,scale=960:-1:flags=lanczos,split[p1][p2];' +
    '[p1]palettegen=max_colors=160:stats_mode=diff[pal];' +
    '[p2][pal]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle';

  const out = `${DOCS}/demo-teaser.gif`;
  await ffmpeg([...inputs, '-filter_complex', `${trims};${concat};${palette}`, '-loop', '0', out]);
  return { out, seconds: slices.reduce((n, s) => n + s.frames, 0) / FPS };
}

async function probe(path) {
  const { stdout } = await run(FFPROBE, [
    '-v', 'error', '-show_entries',
    'format=duration,size,bit_rate:stream=codec_name,width,height,r_frame_rate,pix_fmt,nb_frames',
    '-of', 'default=noprint_wrappers=1', path,
  ]);
  return stdout.trim();
}

// Guarded: process.argv[1] is undefined when these modules are imported rather than run.
const isMain = process.argv[1] && import.meta.url === `file://${resolve(process.argv[1])}`;
if (isMain) {
  const skipSegments = process.argv.includes('--skip-segments') || process.argv.includes('--gif-only');
  const gifOnly = process.argv.includes('--gif-only');

  const segments = EDIT.map(({ source }) => {
    const { frames } = segmentPlan(source);
    return { source, frames, seconds: frames / FPS, path: `${SEGMENTS}/${source}.mp4` };
  });
  const out = `${DOCS}/demo.mp4`;
  if (!gifOnly) await build({ skipSegments });
  const gif = await buildGif();

  console.log('\n--- demo.mp4 ---\n' + await probe(out));
  for (const f of [out, `${DOCS}/demo-poster.jpg`, gif.out]) {
    console.log(`${f}  ${((await stat(f)).size / 1e6).toFixed(2)} MB`);
  }
  process.exit(0);
}
