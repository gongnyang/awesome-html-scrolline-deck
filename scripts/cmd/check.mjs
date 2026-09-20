#!/usr/bin/env node
/**
 * scrolline check <덱 폴더> — 브라우저 없이 도는 정적 게이트.
 *
 *   S0  deck.json 스키마 · 에셋 경로 실재
 *   G1  장면 모듈 { id, mount, build, unmount } · id = 폴더명
 *   G2  타임라인 총 길이 ≤ 1.001 · order 정합
 *   G3  tween 문자열 안 var( ) 금지
 *   G4  장면 · 검수 경로에 직접 스크롤 이동 금지
 *   LINT scene.css 토큰만 · 선택자 스코프 · pathLength
 *
 * 빌드도 설치도 필요 없다. 장면을 고칠 때마다 돌리는 쪽이 이 명령이고,
 * 실제 핀·스크럽·가시성은 `scrolline verify`가 브라우저로 본다.
 */
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { loadGates, runGates, formatTable, writeReport, STATIC_GATES } from '../gates/run.mjs';
import { readDeck, isDir } from '../gates/_util.mjs';

export const USAGE = 'scrolline check <덱 폴더> [--json] [--quiet]';

/**
 * 정적 게이트를 돌린다. 테스트가 직접 쓰는 진입점이다.
 * @returns {Promise<{ok:boolean, gates:Array, ts:string}>}
 */
export async function checkDeck(dir, { write = true } = {}) {
  const { deck } = readDeck(dir);
  const gates = await loadGates(STATIC_GATES);
  const report = await runGates(gates, { dir, deck, cache: {}, cleanups: [] });
  if (write) writeReport(dir, report);
  return report;
}

export async function run(argv = []) {
  const args = argv.filter((a) => !a.startsWith('--'));
  const json = argv.includes('--json');
  const quiet = argv.includes('--quiet');
  const dir = path.resolve(args[0] ?? '.');

  if (!isDir(dir)) {
    console.error(`덱 폴더가 없습니다: ${dir}\n${USAGE}`);
    return 2;
  }

  const report = await checkDeck(dir);

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else if (!quiet) {
    console.log(`\nscrolline check — ${path.relative(process.cwd(), dir) || '.'}\n`);
    console.log(formatTable(report));
    console.log(`  보고서: ${path.relative(process.cwd(), path.join(dir, 'qa', 'report.json'))}`);
    if (report.ok) console.log('\n  정적 게이트 통과. 실제 핀·가시성은 `scrolline verify`로 봅니다.\n');
    else console.log('\n  실패한 게이트를 고친 뒤 다시 돌리세요.\n');
  }

  return report.ok ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exit(await run(process.argv.slice(2)));
}

export default run;
