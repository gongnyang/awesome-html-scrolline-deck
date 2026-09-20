/**
 * G6 — 홀드 구간(진행률 55%)에서 장면마다 보이는 요소가 3개 이상이고,
 *      30/55/85% 캡처 3장이 qa/에 남는다.
 *
 * 빈 화면으로 지나가는 장면(진입만 하고 홀드가 없거나, 퇴장이 너무 빠른 장면)을 잡는다.
 * 캡처는 사람이 읽어야 한다 — 게이트는 "찍혔다"까지만 보증한다.
 */
import path from 'node:path';
import { orderedScenes, rel } from './_util.mjs';
import { mainDrive, PROBES } from './_drive.mjs';

export const id = 'G6';
export const title = '홀드 55%에서 가시 요소 ≥3 · 캡처 3장';
export const needsBrowser = true;
export const MIN_VISIBLE = 3;

export async function run(ctx) {
  const drive = await mainDrive(ctx);
  const problems = [];
  const captured = new Set(drive.captures.map((f) => path.basename(f)));
  const counts = [];

  for (const scene of orderedScenes(ctx.deck)) {
    const count = drive.visible.get(scene.id);
    if (count === undefined) { problems.push(`${scene.id}: 홀드 구간을 측정하지 못했습니다`); continue; }
    counts.push({ id: scene.id, visible: count });
    if (count < MIN_VISIBLE) {
      problems.push(`${scene.id}: 홀드 55%에서 보이는 요소가 ${count}개입니다 (최소 ${MIN_VISIBLE})`);
    }
    for (const probe of PROBES) {
      const file = `${scene.id}-${probe}.jpg`;
      if (!captured.has(file)) problems.push(`${scene.id}: 캡처 ${file}가 없습니다`);
    }
  }

  const lowest = counts.reduce((min, c) => (min === null || c.visible < min.visible ? c : min), null);
  return {
    ok: problems.length === 0,
    details: problems.length === 0
      ? `장면 ${counts.length}개 · 캡처 ${drive.captures.length}장 · 최소 가시 ${lowest ? `${lowest.visible}(${lowest.id})` : '-'} · ${rel(ctx.dir, path.join(ctx.dir, 'qa'))}/`
      : `홀드·캡처 문제 ${problems.length}건`,
    items: problems,
    counts,
  };
}

export default { id, title, needsBrowser, run };
