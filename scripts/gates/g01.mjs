/**
 * G1 — 장면 모듈 계약: 기본 내보내기 { id, mount, build, unmount } 이고 id가 폴더명과 같다.
 * scene.js는 브라우저 없이 import 한다(_load-scene.mjs가 bare 지정자를 스텁으로 바꾼다).
 */
import { readDeck, sceneFolders, exists, rel } from './_util.mjs';
import { loadSceneModule } from './_load-scene.mjs';
import { installFakeGlobals, restoreGlobals } from './_fake-dom.mjs';

export const id = 'G1';
export const title = '장면 모듈 4멤버 · id = 폴더명';
export const needsBrowser = false;

const MEMBERS = ['mount', 'build', 'unmount'];

export async function run(ctx) {
  const { deck } = readDeck(ctx.dir);
  const folders = sceneFolders(ctx.dir, deck);
  const problems = [];
  let checked = 0;

  installFakeGlobals();
  try {
    for (const folder of folders) {
      if (!folder.inDeck && !folder.onDisk) continue;
      if (folder.inDeck && !folder.onDisk) {
        // 폴더가 없으면 엔진이 fallback 블록을 그린다. 계약 위반은 아니다.
        continue;
      }
      if (!folder.js || !exists(folder.js)) continue; // scene.js는 선택
      checked += 1;

      const loaded = await loadSceneModule(folder.js);
      if (!loaded.ok) {
        problems.push(`${folder.id}: scene.js를 불러올 수 없습니다 — ${loaded.error}`);
        continue;
      }
      const mod = loaded.module?.default;
      if (!mod || typeof mod !== 'object') {
        problems.push(`${folder.id}: 기본 내보내기가 객체가 아닙니다 (${rel(ctx.dir, folder.js)})`);
        continue;
      }
      if (mod.id !== folder.id) {
        problems.push(`${folder.id}: default.id가 폴더명과 다릅니다 — id=${JSON.stringify(mod.id)}`);
      }
      for (const member of MEMBERS) {
        if (typeof mod[member] !== 'function') problems.push(`${folder.id}: ${member}()가 함수가 아닙니다`);
      }
      // ctx.cache에 실어 두면 G2가 다시 import 하지 않는다.
      ctx.cache.scenes ??= new Map();
      ctx.cache.scenes.set(folder.id, mod);
    }
  } finally {
    restoreGlobals();
  }

  return {
    ok: problems.length === 0,
    details: problems.length === 0 ? `장면 모듈 ${checked}개 계약 충족` : `계약 위반 ${problems.length}건`,
    items: problems,
  };
}

export default { id, title, needsBrowser, run };
