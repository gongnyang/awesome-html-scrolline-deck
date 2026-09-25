/** S0 — deck.json 스키마 검증 + 에셋 경로 실재 확인. */
import fs from 'node:fs';
import path from 'node:path';
import { readDeck, orderedScenes, exists, rel } from './_util.mjs';
import { validateDeck as fallbackValidate } from './_schema-fallback.mjs';

export const id = 'S0';
export const title = 'deck.json 스키마 · 에셋 경로';
export const needsBrowser = false;

/** E의 scripts/lib/schema.mjs가 있으면 그쪽을 쓴다. 반환 모양이 제각각일 수 있어 정규화한다. */
async function pickValidator() {
  try {
    const mod = await import('../lib/schema.mjs');
    const fn = mod.validateDeck ?? mod.validate ?? mod.validateDeckJson ?? mod.default;
    if (typeof fn === 'function') return { fn, source: 'scripts/lib/schema.mjs' };
  } catch { /* 아직 없다 */ }
  return { fn: fallbackValidate, source: 'gates/_schema-fallback.mjs' };
}

function normalize(result) {
  if (result === true || result == null) return { ok: true, errors: [] };
  if (result === false) return { ok: false, errors: ['스키마 검증 실패'] };
  if (Array.isArray(result)) return { ok: result.length === 0, errors: result.map(String) };
  const errors = (result.errors ?? result.issues ?? []).map((e) =>
    typeof e === 'string' ? e : `${e.instancePath ?? e.path ?? ''} ${e.message ?? JSON.stringify(e)}`.trim(),
  );
  const ok = result.ok ?? result.valid ?? errors.length === 0;
  return { ok: Boolean(ok), errors };
}

/** deck.json의 에셋 경로를 디스크 경로로 푼다. '/media/x.webp' → <dir>/public/media/x.webp */
function resolveAsset(paths, assetPath) {
  const clean = String(assetPath).split('?')[0].split('#')[0];
  if (/^(https?:)?\/\//.test(clean) || clean.startsWith('data:')) return null;
  const relPath = clean.replace(/^\/+/, '');
  const candidates = [];
  if (paths.publicDir) candidates.push(path.join(paths.publicDir, relPath));
  candidates.push(path.join(paths.root, relPath));
  return { relPath, candidates, found: candidates.find(exists) ?? null };
}

const framePath = (pattern, n) => String(pattern).replace('%03d', String(n).padStart(3, '0'));

export async function run(ctx) {
  const { deck, paths, error } = readDeck(ctx.dir);
  if (error) return { ok: false, details: error };

  const { fn, source } = await pickValidator();
  let normalized;
  try {
    normalized = normalize(await fn(deck));
  } catch (err) {
    return { ok: false, details: `스키마 검증기(${source})가 예외를 던졌습니다: ${String(err.message ?? err)}` };
  }

  const items = normalized.errors.slice(0, 20);
  const missing = [];

  for (const scene of orderedScenes(deck)) {
    const assets = scene?.assets;
    if (!assets || typeof assets !== 'object') continue;
    const wanted = [];
    if (assets.poster) wanted.push(assets.poster);
    if (assets.video) wanted.push(assets.video);
    if (Array.isArray(assets.images)) wanted.push(...assets.images);
    if (assets.frames && Number.isInteger(assets.count) && assets.count > 0) {
      for (let n = 1; n <= assets.count; n += 1) wanted.push(framePath(assets.frames, n));
    }
    if (assets.mobileFrames && Number.isInteger(assets.count) && assets.count > 0) {
      for (let n = 1; n <= assets.count; n += 1) wanted.push(framePath(assets.mobileFrames, n));
    }
    for (const asset of wanted) {
      if (typeof asset !== 'string' || !asset.trim()) continue;
      const resolved = resolveAsset(paths, asset);
      if (!resolved) {
        missing.push(`${scene.id}: 외부 미디어 URL은 배포 안정성을 위해 허용하지 않습니다: ${asset}`);
      } else if (!resolved.found) {
        missing.push(`${scene.id}: ${asset} (찾은 곳: ${resolved.candidates.map((c) => rel(ctx.dir, c)).join(', ')})`);
      }
    }
  }

  items.push(...missing.slice(0, 20));
  const ok = normalized.ok && missing.length === 0;
  const sceneCount = Array.isArray(deck?.scenes) ? deck.scenes.length : 0;
  const details = ok
    ? `장면 ${sceneCount}개 · 스키마(${source}) 통과 · 에셋 경로 이상 없음`
    : `스키마 오류 ${normalized.errors.length}건, 없는 에셋 ${missing.length}건 (검증기: ${source})`;
  return { ok, details, items };
}

export default { id, title, needsBrowser, run };
