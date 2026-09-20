/**
 * G3 — gsap 호출의 문자열 인자 안에 var(…)를 쓰지 않는다.
 *
 * GSAP은 CSS 변수를 보간하지 못한다. clip-path·transform 같은 문자열 값 안에 var(--x)가 들어가면
 * 중간 프레임이 계산되지 않아 "날아들다 멈춤"이 된다(fc-astra 실패 3건 중 하나).
 * 색·길이 토큰은 mount에서 getComputedStyle로 실수치를 읽어 넣거나 CSS 쪽에서 처리한다.
 */
import { readDeck, sceneFolders, exists, readText, stripJsComments, balancedArgs, stringLiterals, lineAt } from './_util.mjs';

export const id = 'G3';
export const title = 'tween 문자열 안 var( ) 금지';
export const needsBrowser = false;

const CALL_RE = /\.\s*(to|from|fromTo|set|quickTo|quickSetter|timeline)\s*\(/g;

/** 소스에서 위반을 찾는다. 테스트가 직접 쓰도록 내보낸다. */
export function findVarTweens(source) {
  const text = stripJsComments(source);
  const hits = [];
  CALL_RE.lastIndex = 0;
  let match;
  while ((match = CALL_RE.exec(text)) !== null) {
    const openIndex = match.index + match[0].length - 1;
    const { text: args, end } = balancedArgs(text, openIndex);
    for (const literal of stringLiterals(args)) {
      if (/var\s*\(/.test(literal.value)) {
        hits.push({
          method: match[1],
          value: literal.value.slice(0, 80),
          line: lineAt(text, openIndex + 1 + literal.index),
        });
      }
    }
    CALL_RE.lastIndex = Math.max(end, CALL_RE.lastIndex);
  }
  return hits;
}

export async function run(ctx) {
  const { deck } = readDeck(ctx.dir);
  const folders = sceneFolders(ctx.dir, deck);
  const problems = [];
  let scanned = 0;

  for (const folder of folders) {
    if (!folder.onDisk || !folder.js || !exists(folder.js)) continue;
    scanned += 1;
    const source = readText(folder.js) ?? '';
    for (const hit of findVarTweens(source)) {
      problems.push(`${folder.id}:${hit.line} — .${hit.method}() 문자열 인자에 var( ) 사용: "${hit.value}"`);
    }
  }

  return {
    ok: problems.length === 0,
    details: problems.length === 0 ? `scene.js ${scanned}개에 var( ) tween 없음` : `var( ) tween ${problems.length}건`,
    items: problems,
  };
}

export default { id, title, needsBrowser, run };
