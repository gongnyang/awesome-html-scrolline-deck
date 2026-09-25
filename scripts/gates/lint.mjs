/**
 * LINT — 장면 파일 3종 규칙.
 *  L1 scene.css에 hex·rgb()·hsl()·색이름 리터럴 0 (토큰만 쓴다. transparent·currentColor·inherit은 예외)
 *  L2 scene.css의 모든 선택자가 [data-scene="<id>"] 로 시작 (@keyframes 내부는 제외,
 *     html/body/:root[data-theme=…] 접두는 허용)
 *  L3 scene.html의 <path>가 그리기 안무(--draw · strokeDashoffset)를 쓰면 pathLength="1" 필수
 *  L4 fallback 없는 CSS 변수는 프로젝트 토큰이나 장면 안에 정의되어야 한다.
 */
import path from 'node:path';
import { readDeck, sceneFolders, exists, readText, stripCssComments, lineAt } from './_util.mjs';

export const id = 'LINT';
export const title = 'scene.css 토큰·정의 · 선택자 스코프 · pathLength';
export const needsBrowser = false;

const ALLOWED_KEYWORDS = new Set(['transparent', 'currentcolor', 'inherit', 'initial', 'unset', 'revert', 'none', 'auto']);

// CSS 이름 있는 색. 값 자리에 통째로 나타날 때만 잡는다.
const NAMED_COLORS = new Set(`aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue
blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue
darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid
darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink
deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold
goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush
lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey
lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime
limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen
mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin
navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise
palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue
saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow
springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen`
  .trim().split(/\s+/));

const COLOR_FN_RE = /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\s*\(/i;
const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;

/** 가장 안쪽 블록의 선언만 훑는다. 선택자·@media 조건의 #id 를 색으로 오인하지 않게. */
function declarations(css) {
  const out = [];
  const re = /\{([^{}]*)\}/g;
  let block;
  while ((block = re.exec(css)) !== null) {
    const body = block[1];
    const base = block.index + 1;
    const declRe = /([-\w]+)\s*:\s*([^;}]*)/g;
    let decl;
    while ((decl = declRe.exec(body)) !== null) {
      out.push({ prop: decl[1], value: decl[2], index: base + decl.index });
    }
  }
  return out;
}

export function lintCss(cssRaw, sceneId, tokenNames = null) {
  const css = stripCssComments(cssRaw ?? '');
  const l1 = [];
  const l2 = [];
  const l4 = [];

  for (const { prop, value, index } of declarations(css)) {
    if (prop.startsWith('--') && /^\s*$/.test(value)) continue;
    const line = lineAt(css, index);
    if (HEX_RE.test(value)) l1.push(`${line}행 ${prop}: hex 색 리터럴 (${value.trim().slice(0, 48)})`);
    else if (COLOR_FN_RE.test(value)) l1.push(`${line}행 ${prop}: 색 함수 리터럴 (${value.trim().slice(0, 48)})`);
    else {
      for (const word of value.toLowerCase().match(/[a-z]+/g) ?? []) {
        if (ALLOWED_KEYWORDS.has(word)) continue;
        if (NAMED_COLORS.has(word)) { l1.push(`${line}행 ${prop}: 색 이름 리터럴 (${word})`); break; }
      }
    }
  }

  if (tokenNames) {
    const local = new Set([...css.matchAll(/(--[a-z][a-z0-9-]*)\s*:/gi)].map((match) => match[1]));
    for (const match of css.matchAll(/var\(\s*(--[a-z][a-z0-9-]*)\s*\)/gi)) {
      if (!tokenNames.has(match[1]) && !local.has(match[1])) {
        l4.push(`${lineAt(css, match.index)}행 ${match[1]} 변수에 정의나 fallback이 없습니다`);
      }
    }
  }

  // 선택자 스코프: 중괄호를 걸으며 전문(prelude)을 모은다.
  const prefix = `[data-scene="${sceneId}"]`;
  const allowedLead = /^(?:html|body|:root)?(?:\[data-theme\s*=\s*["'][^"']*["']\])?\s*/;
  const stack = [];
  let buffer = '';
  for (let i = 0; i < css.length; i += 1) {
    const ch = css[i];
    if (ch === '{') {
      const prelude = buffer.trim().replace(/\s+/g, ' ');
      buffer = '';
      const inKeyframes = stack.some((f) => f.keyframes);
      if (prelude.startsWith('@')) {
        stack.push({ keyframes: /^@(-\w+-)?keyframes\b/i.test(prelude), at: true });
      } else {
        stack.push({ keyframes: inKeyframes, at: false });
        if (!inKeyframes && prelude) {
          for (const part of prelude.split(',').map((s) => s.trim()).filter(Boolean)) {
            const stripped = part.replace(allowedLead, '');
            if (!stripped.startsWith(prefix)) {
              l2.push(`${lineAt(css, i)}행 선택자가 ${prefix} 로 시작하지 않습니다: "${part.slice(0, 72)}"`);
            }
          }
        }
      }
      continue;
    }
    if (ch === '}') { stack.pop(); buffer = ''; continue; }
    if (ch === ';') { buffer = ''; continue; }
    buffer += ch;
  }

  return { l1, l2, l4 };
}

/** L3 — 그리기 안무를 쓰는 장면의 <path>는 pathLength="1" 이어야 progress 0..1 매핑이 성립한다. */
export function lintPaths(html, { css = '', js = '' } = {}) {
  const usesDraw = /--draw\b/.test(css) || /--draw\b/.test(js) || /--draw\b/.test(html)
    || /strokeDash(?:offset|array)/.test(js);
  if (!usesDraw) return [];
  const problems = [];
  const re = /<path\b([^>]*)>/gi;
  let match;
  let index = 0;
  while ((match = re.exec(html)) !== null) {
    index += 1;
    if (!/\bpathLength\s*=\s*["']?1["']?/i.test(match[1])) {
      problems.push(`${index}번째 <path>에 pathLength="1" 이 없습니다 (${match[0].slice(0, 64)})`);
    }
  }
  return problems;
}

export async function run(ctx) {
  const { deck } = readDeck(ctx.dir);
  const folders = sceneFolders(ctx.dir, deck);
  const problems = [];
  let scanned = 0;
  const tokens = readText(path.join(ctx.dir, 'src', 'tokens.css')) ?? '';
  const tokenNames = new Set([...tokens.matchAll(/(--[a-z][a-z0-9-]*)\s*:/gi)].map((match) => match[1]));

  for (const folder of folders) {
    if (!folder.onDisk) continue;
    const css = folder.css && exists(folder.css) ? readText(folder.css) ?? '' : '';
    const js = folder.js && exists(folder.js) ? readText(folder.js) ?? '' : '';
    const html = folder.html && exists(folder.html) ? readText(folder.html) ?? '' : '';
    if (!css && !js && !html) continue;
    scanned += 1;

    if (css) {
      const { l1, l2, l4 } = lintCss(css, folder.id, tokenNames);
      problems.push(...l1.map((m) => `L1 ${folder.id}/scene.css ${m}`));
      problems.push(...l2.map((m) => `L2 ${folder.id}/scene.css ${m}`));
      problems.push(...l4.map((m) => `L4 ${folder.id}/scene.css ${m}`));
    }
    if (html) {
      problems.push(...lintPaths(html, { css, js }).map((m) => `L3 ${folder.id}/scene.html ${m}`));
    }
  }

  return {
    ok: problems.length === 0,
    details: problems.length === 0 ? `장면 ${scanned}개 린트 통과 (L1·L2·L3·L4)` : `린트 위반 ${problems.length}건`,
    items: problems,
  };
}

export default { id, title, needsBrowser, run };
