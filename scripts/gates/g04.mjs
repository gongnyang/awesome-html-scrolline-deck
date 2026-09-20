/**
 * G4 — 장면과 검수 경로에서 window.scrollTo / scrollIntoView 금지.
 *
 * 이유: 그 두 가지는 lenis와 ScrollTrigger의 실제 입력 경로를 건너뛴다. 장면에서 쓰면 핀이 어긋나고,
 * 검수 스크립트에서 쓰면 핀·스크럽 결함이 드러나지 않은 채 통과한다. 이동은 lenis.scrollTo로만 한다.
 */
import path from 'node:path';
import { readDeck, sceneFolders, exists, readText, stripJsComments, lineAt, GATES_DIR, rel } from './_util.mjs';

export const id = 'G4';
export const title = '장면 · 검수 경로에 직접 스크롤 이동 금지';
export const needsBrowser = false;

// lenis.scrollTo( 는 허용이므로 수신자가 lenis인 경우를 제외한다.
const PATTERNS = [
  { re: /\bwindow\s*\.\s*scroll(?:To|By)\s*\(/g, what: 'window.scroll 이동' },
  { re: /\bdocument(?:Element)?\s*\.\s*scroll(?:To|By)\s*\(/g, what: 'document 스크롤 이동' },
  { re: /\.\s*scrollIntoView\s*\(/g, what: 'scrollIntoView' },
  { re: /(?<![.\w$])scroll(?:To|By)\s*\(/g, what: '전역 스크롤 이동' },
];

export function findScrollJumps(source) {
  const text = stripJsComments(source);
  const hits = [];
  for (const { re, what } of PATTERNS) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(text)) !== null) {
      const before = text.slice(Math.max(0, match.index - 40), match.index);
      if (/\blenis\s*\.\s*$/.test(before) || /\blenis\s*\?\.\s*$/.test(before)) continue;
      hits.push({ what, line: lineAt(text, match.index), snippet: text.slice(match.index, match.index + 40).trim() });
    }
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
    for (const hit of findScrollJumps(readText(folder.js) ?? '')) {
      problems.push(`${folder.id}:${hit.line} — ${hit.what} (${hit.snippet})`);
    }
  }

  // 검수 스크립트 자신도 같은 규칙을 지켜야 한다. 휠 입력으로만 굴린다.
  for (const target of ['verify.mjs', 'check.mjs'].map((f) => path.join(GATES_DIR, '..', 'cmd', f))
    .concat(['wheel.mjs', 'browser.mjs'].map((f) => path.join(GATES_DIR, '..', 'lib', f)))) {
    if (!exists(target)) continue;
    scanned += 1;
    for (const hit of findScrollJumps(readText(target) ?? '')) {
      problems.push(`${rel(ctx.dir, target)}:${hit.line} — 검수 경로에서 ${hit.what}`);
    }
  }

  return {
    ok: problems.length === 0,
    details: problems.length === 0 ? `파일 ${scanned}개 · 직접 스크롤 이동 없음` : `직접 스크롤 이동 ${problems.length}건`,
    items: problems,
  };
}

export default { id, title, needsBrowser, run };
