/**
 * run.mjs — 게이트 목록을 덱 폴더에 대해 돌리고, 표를 찍고, qa/report.json을 남긴다.
 * 실패한(건너뛰지 않은) 게이트가 하나라도 있으면 호출자가 exit 1 하도록 ok:false를 돌려준다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { deckPaths } from './_util.mjs';

export const STATIC_GATES = ['s00.mjs', 'g01.mjs', 'g02.mjs', 'g03.mjs', 'g04.mjs', 'lint.mjs'];
export const BROWSER_GATES = ['g05.mjs', 'g06.mjs', 'g07.mjs', 'g08.mjs', 'g09.mjs', 'g10.mjs', 'g11.mjs', 'g12.mjs', 'g13.mjs'];

export async function loadGates(files) {
  const gates = [];
  for (const file of files) {
    const mod = await import(new URL(file, import.meta.url).href);
    gates.push(mod.default ?? mod);
  }
  return gates;
}

/** 게이트 하나를 돌린다. 예외는 실패로 접수한다 — 게이트가 터졌다고 전체가 멎으면 안 된다. */
async function runOne(gate, ctx) {
  const startedAt = Date.now();
  try {
    const result = (await gate.run(ctx)) ?? {};
    return {
      id: gate.id,
      title: gate.title ?? '',
      ok: result.skipped ? true : Boolean(result.ok),
      skipped: Boolean(result.skipped),
      details: String(result.details ?? ''),
      items: Array.isArray(result.items) ? result.items : [],
      ms: Date.now() - startedAt,
    };
  } catch (err) {
    return {
      id: gate.id,
      title: gate.title ?? '',
      ok: false,
      skipped: false,
      details: `게이트가 예외를 던졌습니다: ${String(err?.message ?? err).split('\n')[0]}`,
      items: [String(err?.stack ?? '').split('\n').slice(0, 4).join(' | ')],
      ms: Date.now() - startedAt,
    };
  }
}

/**
 * @param {Array} gates
 * @param {{dir:string, [key:string]:any}} ctx
 * @returns {Promise<{ok:boolean, gates:Array, ts:string}>}
 */
export async function runGates(gates, ctx) {
  ctx.cache ??= {};
  const results = [];
  for (const gate of gates) results.push(await runOne(gate, ctx));
  const ok = results.every((r) => r.skipped || r.ok);
  return { ok, gates: results, ts: new Date().toISOString() };
}

const MARK = { pass: 'PASS', fail: 'FAIL', skip: 'SKIP' };

export function formatTable(report, { verbose = true } = {}) {
  const lines = [];
  const idWidth = Math.max(4, ...report.gates.map((g) => String(g.id).length));
  for (const gate of report.gates) {
    const mark = gate.skipped ? MARK.skip : gate.ok ? MARK.pass : MARK.fail;
    lines.push(`  ${mark}  ${String(gate.id).padEnd(idWidth)}  ${gate.details}`);
    if (verbose && !gate.ok && !gate.skipped) {
      for (const item of gate.items.slice(0, 12)) lines.push(`          · ${item}`);
      if (gate.items.length > 12) lines.push(`          · … 외 ${gate.items.length - 12}건`);
    }
  }
  const failed = report.gates.filter((g) => !g.ok && !g.skipped).length;
  const skipped = report.gates.filter((g) => g.skipped).length;
  lines.push('');
  lines.push(
    report.ok
      ? `  통과 ${report.gates.length - skipped}개${skipped ? ` · 건너뜀 ${skipped}개` : ''}`
      : `  실패 ${failed}개 / 전체 ${report.gates.length}개${skipped ? ` · 건너뜀 ${skipped}개` : ''}`,
  );
  return lines.join('\n');
}

/** qa/report.json에 남긴다. 되돌아보기용이므로 실패해도 검수 자체를 막지 않는다. */
export function writeReport(dir, report) {
  const { qaDir } = deckPaths(dir);
  const file = path.join(qaDir, 'report.json');
  try {
    fs.mkdirSync(qaDir, { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    return file;
  } catch (err) {
    console.warn(`  (qa/report.json을 쓰지 못했습니다: ${String(err.message ?? err)})`);
    return null;
  }
}

/** 게이트 파일 목록 → 실행 → 표 → 보고서. check/verify가 공유하는 진입점. */
export async function runAndReport({ dir, files, gates, ctx = {}, verbose = true, heading = '' }) {
  const loaded = gates ?? (await loadGates(files));
  const report = await runGates(loaded, { dir, ...ctx });
  if (heading) console.log(heading);
  console.log(formatTable(report, { verbose }));
  const file = writeReport(dir, report);
  if (file) console.log(`  보고서: ${path.relative(process.cwd(), file)}`);
  return report;
}
