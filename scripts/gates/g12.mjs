/** G12 — WCAG AA contrast for solid-background visible text at scene hold. */
import { mainDrive } from './_drive.mjs';

export const id = 'G12';
export const title = '홀드 화면의 단색 배경 텍스트 대비';
export const needsBrowser = true;

export async function run(ctx) {
  const drive = await mainDrive(ctx);
  const items = [...drive.contrast].flatMap(([scene, issues]) => issues.map((issue) => `${scene}: ${issue}`));
  return { ok: items.length === 0,
    details: items.length ? `대비 미달 ${items.length}건` : '측정 가능한 텍스트 대비 통과 (이미지 위 텍스트는 캡처 육안 검토)',
    items: items.slice(0, 30) };
}

export default { id, title, needsBrowser, run };
