/** G13 — a scene that declares imagery must actually show media at its hold. */
import { mainDrive } from './_drive.mjs';
import { orderedScenes } from './_util.mjs';

export const id = 'G13';
export const title = '이미지 장면의 실제 렌더링';
export const needsBrowser = true;

export async function run(ctx) {
  const drive = await mainDrive(ctx);
  const expected = orderedScenes(ctx.deck).filter((scene) => {
    const assets = scene.assets ?? {};
    return Boolean(assets.poster || assets.frames || assets.video || assets.images?.length);
  });
  const missing = expected.filter((scene) => !(drive.mediaVisible.get(scene.id) > 0));
  return { ok: missing.length === 0,
    details: `${expected.length}개 이미지 장면 중 화면 미표시 ${missing.length}개`,
    items: missing.map((scene) => `${scene.id}: 이미지·캔버스·영상이 홀드 화면에 보이지 않습니다`),
  };
}

export default { id, title, needsBrowser, run };
