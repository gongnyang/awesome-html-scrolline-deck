/**
 * music.mjs — the score, synthesised from scratch.
 *
 * No sampled or downloaded audio is used. Nothing on this machine carries a licence
 * file that can be verified, and an unverifiable track is not worth the risk on a
 * public repo, so the bed is built out of ffmpeg oscillators: an A-minor drone, a pad
 * that swells on an eight-second cycle, and a soft pluck on a 1.2s pulse. It is
 * deliberately plain — a floor under the picture, not a song.
 *
 * Note for anyone editing the expressions: they are full of commas (min, mod, exp), and
 * an unquoted comma ends the filter as far as ffmpeg's parser is concerned. The whole
 * expression therefore has to stay inside the single quotes that buildFilter() adds.
 */

const A1 = 55.00, E2 = 82.41, A3 = 220.00, E4 = 329.63, A5 = 880.00, E6 = 1318.51;

/**
 * One channel of the bed.
 * @param {number} detune  cents-ish offset applied to the pad, for stereo width
 * @param {number} phase   phase offset on the swell, so the two channels breathe apart
 */
function channel({ fadeIn, detune = 0, phase = 0 }) {
  const d = (hz) => (hz * (1 + detune)).toFixed(4);
  const ramp = `min(1,t/${fadeIn})`;
  const swell = `(0.55+0.45*sin(2*PI*t/8+${phase}))`;
  // A bare exp() decay restarts instantly every period, and that step is a click, not
  // a pluck — broadband enough to show up at 16kHz. The min() in front is a ~12ms
  // attack ramp, which is what makes it read as a struck note.
  const pluck = (period, decay) => `min(1,mod(t,${period})*80)*exp(-mod(t,${period})*${decay})`;

  return [
    // drone — root and fifth, always present
    `0.115*sin(2*PI*${A1}*t)*(0.80+0.20*sin(2*PI*t/11))`,
    `0.075*sin(2*PI*${E2}*t)`,
    // pad — A minor, swelling
    `0.052*sin(2*PI*${d(A3)}*t)*${swell}*${ramp}`,
    `0.040*sin(2*PI*${d(E4)}*t)*(0.55+0.45*sin(2*PI*t/8+${(phase + 1.1).toFixed(2)}))*${ramp}`,
    // pulse — a plucked A every 1.2s, with an octave shimmer every fourth
    `0.105*sin(2*PI*${A5}*t)*${pluck(1.2, 15)}*${ramp}`,
    `0.055*sin(2*PI*${E6}*t)*${pluck(4.8, 19)}*${ramp}`,
  ].join('+').replace(/\s+/g, '');
}

/** The stereo source filter. */
export function bedSource({ fadeIn = 7 } = {}) {
  const left = channel({ fadeIn, detune: -0.0009, phase: 0 });
  const right = channel({ fadeIn, detune: +0.0009, phase: 0.7 });
  return `aevalsrc=exprs='${left}|${right}':s=44100`;
}

/** Input args plus the filter chain: synth -> gentle low-pass -> fades -> -16 LUFS. */
export function audioArgs({ duration, fadeOut = 3.5, fadeIn = 7 }) {
  return {
    input: ['-f', 'lavfi', '-t', String(duration), '-i', bedSource({ fadeIn })],
    filter: [
      'highpass=f=32',                                    // nothing subsonic survives the encode anyway
      'lowpass=f=5200',                                   // take the edge off the oscillators
      'afade=t=in:st=0:d=1.6',
      `afade=t=out:st=${(duration - fadeOut).toFixed(2)}:d=${fadeOut}`,
      'loudnorm=I=-16:TP=-1.5:LRA=11',
      'aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo',
    ].join(','),
  };
}
