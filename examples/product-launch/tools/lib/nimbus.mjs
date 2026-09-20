/**
 * nimbus.mjs — the drawing kit every asset in this deck is built from.
 *
 * Nothing here is photography. The headphone is an SVG solid: two cylinders on
 * a circle, a band arched over them, projected by hand so the whole thing can
 * be turned one degree at a time. `headphone()` returns the markup for one
 * angle, which is what makes the 90-frame rotation possible from a script.
 *
 * The palette mirrors src/tokens.css. Keep the two in step: the plates are
 * meant to look drawn on the same cream paper as the deck.
 */

export const PAL = {
  canvas: '#faf3e8',
  surface1: '#f3e9da',
  surface2: '#ecdfcc',
  surface3: '#e3d3bc',
  hairline: '#ddcdb5',
  hairlineStrong: '#c2ab8c',
  ink: '#1b1410',
  inkMuted: '#4a3b30',
  inkSubtle: '#7c6a5a',
  coral: '#cf4224',
  coralSoft: '#e8714f',
  cobalt: '#1f3fbb',
  amber: '#9a5a00',
};

export const FONT_DISPLAY = "'URW Gothic','Century Gothic','Pretendard','Noto Sans CJK KR',sans-serif";
export const FONT_BODY = "'Pretendard','Noto Sans CJK KR','Noto Sans KR',sans-serif";
export const FONT_MONO = "'Ubuntu Mono','D2Coding','Noto Sans Mono CJK KR',monospace";

const R = (n) => Number(n.toFixed(2));
export const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ------------------------------------------------------------------ *
 * projection
 * ------------------------------------------------------------------ */

const D = 1500; // eye distance; small enough to read as depth, large enough to stay calm

/** Project a point that is already relative to the product centre. */
function project(x, y, z, cx, cy, scale) {
  const p = D / (D + z * scale);
  return { x: cx + x * scale * p, y: cy + y * scale * p, p };
}

/* ------------------------------------------------------------------ *
 * the headphone
 * ------------------------------------------------------------------ */

/**
 * One headphone, turned `angle` radians about its vertical axis.
 *
 * The cup axis runs through both ear cups. At angle 0 the axis lies across the
 * screen and both cups are edge-on (a front view of the wearer); at 90° the
 * axis points at the viewer and one cup covers the other (a side view).
 *
 * @param {object} o
 * @param {number} o.angle   radians
 * @param {number} o.cx      centre x
 * @param {number} o.cy      centre y of the cups
 * @param {number} o.scale   1 = a 300px-wide headphone
 * @param {boolean} o.shadow draw the contact shadow
 */
export function headphone({ angle, cx, cy, scale = 1, shadow = true, idPrefix = 'hp' }) {
  const axisR = 150;      // half the distance between the cups
  const cupR = 94;        // cup radius
  const depth = 52;       // how deep a cup is
  const bandH = 214;      // how high the band arches over the cup centres
  const bandLift = 52;    // band endpoints sit above the cup centres

  const sin = Math.sin(angle);
  const cos = Math.cos(angle);

  // --- the two cups, far one first -------------------------------------
  const cups = [0, Math.PI].map((offset) => {
    const a = angle + offset;
    const nx = Math.cos(a);
    const nz = Math.sin(a);
    return { a, nx, nz, z: axisR * nz, x: axisR * nx };
  }).sort((l, r) => r.z - l.z);

  const cupSvg = cups.map((cup, index) => {
    const near = index === cups.length - 1;
    // front face sits half a depth along the outward normal, back face behind it
    const front = project(cup.x + cup.nx * depth * 0.5, 0, cup.z + cup.nz * depth * 0.5, cx, cy, scale);
    const back = project(cup.x - cup.nx * depth * 0.5, 0, cup.z - cup.nz * depth * 0.5, cx, cy, scale);
    const rxF = Math.max(0.6, cupR * Math.abs(cup.nz) * scale * front.p);
    const rxB = Math.max(0.6, cupR * Math.abs(cup.nz) * scale * back.p);
    const ryF = cupR * scale * front.p;
    const ryB = cupR * scale * back.p;
    // how much of the front face we actually see, 0 edge-on .. 1 face-on
    const facing = Math.abs(cup.nz);
    const shell = near ? PAL.ink : PAL.inkMuted;

    // the barrel between the two faces
    const barrel = `<path d="M ${R(back.x)} ${R(back.y - ryB)} L ${R(front.x)} ${R(front.y - ryF)}`
      + ` A ${R(rxF)} ${R(ryF)} 0 0 ${front.x >= back.x ? 1 : 0} ${R(front.x)} ${R(front.y + ryF)}`
      + ` L ${R(back.x)} ${R(back.y + ryB)}`
      + ` A ${R(rxB)} ${R(ryB)} 0 0 ${front.x >= back.x ? 0 : 1} ${R(back.x)} ${R(back.y - ryB)} Z"`
      + ` fill="url(#${idPrefix}-barrel)" />`;

    // the pad, on the head side
    const pad = `<ellipse cx="${R(back.x)}" cy="${R(back.y)}" rx="${R(rxB)}" ry="${R(ryB)}"`
      + ` fill="${PAL.ink}" fill-opacity="${near ? 0.92 : 0.7}" />`
      + `<ellipse cx="${R(back.x)}" cy="${R(back.y)}" rx="${R(rxB * 0.62)}" ry="${R(ryB * 0.62)}"`
      + ` fill="${PAL.surface3}" fill-opacity="${(0.1 + facing * 0.22).toFixed(3)}" />`;

    // the outer shell: a disc, a coral ring and the mark, all fading as it turns away
    const shellFace = `<ellipse cx="${R(front.x)}" cy="${R(front.y)}" rx="${R(rxF)}" ry="${R(ryF)}"`
      + ` fill="${shell}" />`
      + `<ellipse cx="${R(front.x)}" cy="${R(front.y)}" rx="${R(rxF * 0.97)}" ry="${R(ryF * 0.97)}"`
      + ` fill="none" stroke="${PAL.surface1}" stroke-opacity="${(0.16 * facing + 0.05).toFixed(3)}" stroke-width="${R(1.4 * scale)}" />`
      + `<ellipse cx="${R(front.x)}" cy="${R(front.y)}" rx="${R(rxF * 0.54)}" ry="${R(ryF * 0.54)}"`
      + ` fill="none" stroke="${PAL.coral}" stroke-opacity="${(0.2 + facing * 0.75).toFixed(3)}" stroke-width="${R(2.6 * scale)}" />`
      + `<ellipse cx="${R(front.x)}" cy="${R(front.y)}" rx="${R(rxF * 0.2)}" ry="${R(ryF * 0.2)}"`
      + ` fill="${PAL.coral}" fill-opacity="${(facing * 0.9).toFixed(3)}" />`;

    // the yoke: cup top up to the band end
    const yokeTop = project(cup.x * 1.0, -cupR - bandLift, cup.z, cx, cy, scale);
    const yokeBase = project(cup.x, -cupR * 0.72, cup.z, cx, cy, scale);
    const yoke = `<path d="M ${R(yokeBase.x)} ${R(yokeBase.y)} L ${R(yokeTop.x)} ${R(yokeTop.y)}"`
      + ` stroke="${near ? PAL.ink : PAL.inkMuted}" stroke-width="${R(13 * scale * yokeTop.p)}" stroke-linecap="round" fill="none" />`
      + `<path d="M ${R(yokeBase.x)} ${R(yokeBase.y)} L ${R(yokeTop.x)} ${R(yokeTop.y)}"`
      + ` stroke="${PAL.surface2}" stroke-opacity="0.35" stroke-width="${R(2.2 * scale * yokeTop.p)}" stroke-linecap="round" fill="none" />`;

    return { z: cup.z, markup: pad + barrel + shellFace, yoke };
  });

  // --- the band --------------------------------------------------------
  const bandPts = [];
  const bandInner = [];
  for (let i = 0; i <= 48; i += 1) {
    const phi = (i / 48) * Math.PI;
    const s = axisR * Math.cos(phi);
    const h = -(cupR * 0.55) - bandLift - bandH * Math.sin(phi) * 0.62;
    const pt = project(s * cos, h, s * sin, cx, cy, scale);
    bandPts.push(`${R(pt.x)} ${R(pt.y)}`);
    const inner = project(s * cos, h + 15, s * sin, cx, cy, scale);
    bandInner.push(`${R(inner.x)} ${R(inner.y)}`);
  }
  const band = `<path d="M ${bandPts.join(' L ')}" fill="none" stroke="${PAL.ink}"`
    + ` stroke-width="${R(17 * scale)}" stroke-linecap="round" stroke-linejoin="round" />`
    + `<path d="M ${bandInner.join(' L ')}" fill="none" stroke="${PAL.surface2}"`
    + ` stroke-opacity="0.34" stroke-width="${R(3.4 * scale)}" stroke-linecap="round" />`;

  // --- contact shadow --------------------------------------------------
  const floorY = cy + (cupR + 122) * scale;
  const spread = (axisR * Math.abs(cos) + cupR * 0.9) * scale;
  const shade = shadow
    ? `<ellipse cx="${R(cx)}" cy="${R(floorY)}" rx="${R(spread * 1.05)}" ry="${R(16 * scale)}"`
      + ` fill="url(#${idPrefix}-shadow)" />`
    : '';

  const defs = `<defs>
    <linearGradient id="${idPrefix}-barrel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${PAL.inkMuted}" />
      <stop offset="46%" stop-color="${PAL.ink}" />
      <stop offset="100%" stop-color="${PAL.ink}" />
    </linearGradient>
    <radialGradient id="${idPrefix}-shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${PAL.inkSubtle}" stop-opacity="0.42" />
      <stop offset="100%" stop-color="${PAL.inkSubtle}" stop-opacity="0" />
    </radialGradient>
  </defs>`;

  // far cup, its yoke, the band, then the near cup on top of everything
  const far = cupSvg[0];
  const near = cupSvg[cupSvg.length - 1];
  return defs + shade + far.markup + far.yoke + band + near.yoke + near.markup;
}

/* ------------------------------------------------------------------ *
 * small drawing helpers shared by the plates
 * ------------------------------------------------------------------ */

export const text = (x, y, s, o = {}) => {
  const {
    size = 24, fill = PAL.ink, weight = 400, family = FONT_BODY,
    anchor = 'start', ls = 0, opacity = 1,
  } = o;
  return `<text x="${R(x)}" y="${R(y)}" font-family="${family}" font-size="${size}"`
    + ` font-weight="${weight}" fill="${fill}" fill-opacity="${opacity}"`
    + ` text-anchor="${anchor}" letter-spacing="${ls}">${esc(s)}</text>`;
};

export const line = (x1, y1, x2, y2, o = {}) => {
  const { stroke = PAL.hairline, width = 1, dash = null, opacity = 1, cap = 'butt' } = o;
  return `<line x1="${R(x1)}" y1="${R(y1)}" x2="${R(x2)}" y2="${R(y2)}" stroke="${stroke}"`
    + ` stroke-width="${width}" stroke-opacity="${opacity}" stroke-linecap="${cap}"`
    + (dash ? ` stroke-dasharray="${dash}"` : '') + ' />';
};

/** The cream ground every plate and frame shares. */
export const ground = (w, h, id = 'bg') => `
  <defs>
    <radialGradient id="${id}-wash" cx="62%" cy="34%" r="78%">
      <stop offset="0%" stop-color="${PAL.surface1}" />
      <stop offset="58%" stop-color="${PAL.canvas}" />
      <stop offset="100%" stop-color="${PAL.surface2}" />
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="${PAL.canvas}" />
  <rect width="${w}" height="${h}" fill="url(#${id}-wash)" />`;

/** Header furniture: the product name left, a mono readout right. */
export const slate = (w, y, left, right, o = {}) => {
  const { x = 64, size = 19 } = o;
  return text(x, y, left, { family: FONT_MONO, size, fill: PAL.inkSubtle, ls: 3 })
    + text(w - x, y, right, { family: FONT_MONO, size, fill: PAL.coral, ls: 3, anchor: 'end' })
    + line(x, y + 22, w - x, y + 22, { stroke: PAL.hairline, width: 1 });
};
