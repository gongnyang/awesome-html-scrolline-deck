/**
 * G8 — 전 장면 주행 동안 console.error와 pageerror가 0건.
 * 발표 중 조용히 죽은 장면은 "아무 일도 안 일어나는 화면"으로만 보인다. 콘솔이 유일한 신호다.
 */
import { mainDrive } from './_drive.mjs';

export const id = 'G8';
export const title = '콘솔 오류 · 페이지 예외 0건';
export const needsBrowser = true;

export async function run(ctx) {
  const drive = await mainDrive(ctx);
  const unique = [...new Set(drive.errors)];
  return {
    ok: unique.length === 0,
    details: unique.length === 0 ? '주행 중 오류 없음' : `오류 ${unique.length}종`,
    items: unique.slice(0, 20),
  };
}

export default { id, title, needsBrowser, run };
