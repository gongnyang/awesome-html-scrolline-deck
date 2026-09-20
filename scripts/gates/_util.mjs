/**
 * _util.mjs — 게이트 공용 헬퍼. 덱 폴더의 모양을 한 곳에서만 안다.
 *
 * 덱 폴더 규약(templates/project 기준)
 *   <dir>/data/deck.json      덱 계약(없으면 <dir>/deck.json도 본다)
 *   <dir>/src/scenes/<id>/    scene.html · scene.css · scene.js (없으면 <dir>/scenes/<id>/)
 *   <dir>/public/media/...    에셋(deck.json의 경로는 사이트 루트 기준 '/media/...')
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const GATES_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(GATES_DIR, '..', '..');

export const exists = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };
export const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };
export const readText = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

/** 덱 폴더의 주요 경로를 한 번에 푼다. 못 찾은 항목은 null이다. */
export function deckPaths(dir) {
  const root = path.resolve(dir);
  const deckFile = ['data/deck.json', 'deck.json'].map((rel) => path.join(root, rel)).find(exists) ?? null;
  const scenesDir = ['src/scenes', 'scenes'].map((rel) => path.join(root, rel)).find(isDir) ?? null;
  const publicDir = ['public'].map((rel) => path.join(root, rel)).find(isDir) ?? null;
  return { root, deckFile, scenesDir, publicDir, qaDir: path.join(root, 'qa') };
}

/** deck.json을 읽는다. 없거나 깨졌으면 {deck:null, error}. */
export function readDeck(dir) {
  const paths = deckPaths(dir);
  if (!paths.deckFile) return { paths, deck: null, error: 'deck.json을 찾지 못했습니다 (data/deck.json 또는 deck.json)' };
  const raw = readText(paths.deckFile);
  try {
    return { paths, deck: JSON.parse(raw), error: null };
  } catch (err) {
    return { paths, deck: null, error: `deck.json 파싱 실패: ${String(err.message ?? err)}` };
  }
}

/** deck.json의 scenes를 order 순으로 돌려준다. */
export function orderedScenes(deck) {
  const scenes = Array.isArray(deck?.scenes) ? deck.scenes.slice() : [];
  return scenes.sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0));
}

/** 장면 폴더 목록. deck.json에 있는 장면과 디스크의 폴더를 합쳐 본다. */
export function sceneFolders(dir, deck) {
  const { scenesDir } = deckPaths(dir);
  const fromDisk = scenesDir
    ? fs.readdirSync(scenesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)
    : [];
  const fromDeck = orderedScenes(deck).map((s) => s?.id).filter((id) => typeof id === 'string');
  const ids = [...new Set([...fromDeck, ...fromDisk])];
  return ids.map((id) => {
    const folder = scenesDir ? path.join(scenesDir, id) : null;
    return {
      id,
      folder,
      onDisk: folder ? isDir(folder) : false,
      inDeck: fromDeck.includes(id),
      scene: orderedScenes(deck).find((s) => s?.id === id) ?? null,
      js: folder ? path.join(folder, 'scene.js') : null,
      css: folder ? path.join(folder, 'scene.css') : null,
      html: folder ? path.join(folder, 'scene.html') : null,
    };
  });
}

/** 게이트 보고에 쓰는 상대 경로. 보고가 길어지지 않게 덱 폴더 기준으로 자른다. */
export function rel(dir, p) {
  if (!p) return '';
  const r = path.relative(path.resolve(dir), p);
  return r.startsWith('..') ? p : r;
}

/** /* *\/ 와 // 주석을 지운다. 문자열 안의 주석 비슷한 것은 남을 수 있다(정규식 수준 검사). */
export function stripJsComments(source) {
  return String(source ?? '')
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:\\])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(Math.max(0, m.length - pre.length)));
}

export function stripCssComments(source) {
  return String(source ?? '').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

/** 오프셋을 1-기반 줄 번호로. */
export function lineAt(source, index) {
  return String(source ?? '').slice(0, index).split('\n').length;
}

/**
 * 여는 괄호 바로 뒤 위치에서 시작해 균형이 맞는 닫는 괄호 앞까지의 텍스트를 돌려준다.
 * 문자열·템플릿 리터럴 안의 괄호는 세지 않는다.
 */
export function balancedArgs(source, openIndex) {
  let depth = 1;
  let i = openIndex + 1;
  const n = source.length;
  while (i < n) {
    const ch = source[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      i += 1;
      while (i < n) {
        if (source[i] === '\\') { i += 2; continue; }
        if (source[i] === quote) break;
        i += 1;
      }
      i += 1;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth += 1;
    else if (ch === ')' || ch === ']' || ch === '}') {
      depth -= 1;
      if (depth === 0) return { text: source.slice(openIndex + 1, i), end: i };
    }
    i += 1;
  }
  return { text: source.slice(openIndex + 1), end: n };
}

/** 소스에서 문자열 리터럴을 전부 뽑는다. {quote, value, index}. */
export function stringLiterals(source) {
  const out = [];
  const n = source.length;
  let i = 0;
  while (i < n) {
    const ch = source[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      const start = i;
      i += 1;
      let value = '';
      while (i < n) {
        if (source[i] === '\\') { value += source[i + 1] ?? ''; i += 2; continue; }
        if (source[i] === quote) break;
        value += source[i];
        i += 1;
      }
      out.push({ quote, value, index: start });
      i += 1;
      continue;
    }
    i += 1;
  }
  return out;
}
