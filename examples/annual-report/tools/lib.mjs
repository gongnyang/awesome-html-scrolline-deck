/**
 * lib.mjs — 인포그래픽 생성 공통부.
 *
 * SVG를 문자열로 조립해 tools/svg/ 에 소스로 남기고, sharp로 webp로 구워
 * public/media/<scene-id>/ 에 떨군다. 사진도 폰트 내려받기도 없다.
 *
 *   NODE_PATH=<sharp가 있는 node_modules> node tools/make-all.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error([
    'sharp 를 찾지 못했습니다.',
    'NODE_PATH 로 sharp 가 설치된 node_modules 를 가리키고 다시 돌리세요:',
    '  NODE_PATH=/path/to/node_modules node tools/make-all.mjs',
  ].join('\n'));
  process.exit(1);
}

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DECK = path.join(HERE, '..');
export const SVG_DIR = path.join(HERE, 'svg');

/** src/tokens.css 와 같은 값. 여기 색이 바뀌면 tokens.css 도 같이 바꾼다. */
export const C = {
  canvas: '#061210',
  surface1: '#0b1a17',
  surface2: '#11241f',
  surface3: '#183029',
  hairline: '#24423a',
  hairlineStrong: '#33594e',
  ink: '#f1f6f2',
  inkMuted: '#bed1c7',
  inkSubtle: '#7d9489',
  mint: '#4fd1a5',
  amber: '#edb04a',
  ember: '#e08744',
};

export const TONE = { mint: C.mint, amber: C.amber, ember: C.ember };

/** 시스템에 있는 글꼴만 쓴다 — 빌드도 렌더도 네트워크를 타지 않는다. */
export const SERIF = "'Noto Serif KR','Noto Serif CJK KR','Nanum Myeongjo',Georgia,serif";
export const SANS = "'Noto Sans CJK KR','Noto Sans KR','Pretendard',sans-serif";
export const MONO = "'DejaVu Sans Mono','Liberation Mono',monospace";

export const esc = (value) => String(value).replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));

export const round = (n, digits = 1) => Number(n.toFixed(digits));

/** 글자 한 줄. 기본은 산세리프 본문. */
export function t(x, y, value, opts = {}) {
  const {
    size = 28, fill = C.inkMuted, font = SANS, weight = 400,
    anchor = 'start', spacing = 0, opacity = 1,
  } = opts;
  return `<text x="${round(x, 2)}" y="${round(y, 2)}" font-family="${font}" font-size="${size}"`
    + ` font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"`
    + (spacing ? ` letter-spacing="${spacing}"` : '')
    + (opacity !== 1 ? ` fill-opacity="${opacity}"` : '')
    + `>${esc(value)}</text>`;
}

export const line = (x1, y1, x2, y2, opts = {}) => {
  const { stroke = C.hairline, width = 1, dash = null, cap = 'butt', opacity = 1 } = opts;
  return `<line x1="${round(x1, 2)}" y1="${round(y1, 2)}" x2="${round(x2, 2)}" y2="${round(y2, 2)}"`
    + ` stroke="${stroke}" stroke-width="${width}" stroke-linecap="${cap}"`
    + (dash ? ` stroke-dasharray="${dash}"` : '')
    + (opacity !== 1 ? ` stroke-opacity="${opacity}"` : '') + ' />';
};

export const rect = (x, y, w, h, opts = {}) => {
  const { fill = 'none', stroke = null, width = 1, radius = 0, opacity = 1 } = opts;
  return `<rect x="${round(x, 2)}" y="${round(y, 2)}" width="${round(w, 2)}" height="${round(h, 2)}"`
    + ` fill="${fill}"${opacity !== 1 ? ` fill-opacity="${opacity}"` : ''}`
    + (stroke ? ` stroke="${stroke}" stroke-width="${width}"` : '')
    + (radius ? ` rx="${radius}"` : '') + ' />';
};

export const circle = (cx, cy, r, opts = {}) => {
  const { fill = 'none', stroke = null, width = 1, opacity = 1 } = opts;
  return `<circle cx="${round(cx, 2)}" cy="${round(cy, 2)}" r="${round(r, 2)}"`
    + ` fill="${fill}"${opacity !== 1 ? ` fill-opacity="${opacity}"` : ''}`
    + (stroke ? ` stroke="${stroke}" stroke-width="${width}"` : '') + ' />';
};

/** 바탕: 캔버스 + 위에서 아래로 옅어지는 숲빛 워시. */
export const backdrop = (w, h, id = 'wash') =>
  `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0.35" y2="1">`
  + `<stop offset="0%" stop-color="${C.surface2}" stop-opacity="0.95"/>`
  + `<stop offset="55%" stop-color="${C.surface1}" stop-opacity="0.7"/>`
  + `<stop offset="100%" stop-color="${C.canvas}" stop-opacity="1"/>`
  + `</linearGradient></defs>`
  + rect(0, 0, w, h, { fill: C.canvas })
  + rect(0, 0, w, h, { fill: `url(#${id})` });

export const svgDoc = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n${body}\n</svg>`;

/**
 * SVG 소스를 tools/svg/ 에 남기고 같은 그림을 webp로 구워 public/media/<scene>/ 에 쓴다.
 * 반환값은 deck.json 에 넣을 경로.
 */
export async function emit({ scene, name, svg, quality = 86 }) {
  await mkdir(SVG_DIR, { recursive: true });
  await writeFile(path.join(SVG_DIR, `${name}.svg`), `${svg}\n`, 'utf8');

  const outDir = path.join(DECK, 'public', 'media', scene);
  await mkdir(outDir, { recursive: true });
  const buffer = await sharp(Buffer.from(svg)).webp({ quality }).toBuffer();
  await writeFile(path.join(outDir, `${name}.webp`), buffer);
  console.log(`  ${scene}/${name}.webp  ${(buffer.length / 1024).toFixed(0)} KB`);
  return `/media/${scene}/${name}.webp`;
}
