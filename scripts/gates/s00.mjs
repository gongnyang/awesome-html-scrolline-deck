/** S0 — deck.json 스키마 검증 + 에셋 경로 실재 확인. */
import fs from 'node:fs';
import path from 'node:path';
import { readDeck, orderedScenes, exists, rel } from './_util.mjs';
import { validateDeck as fallbackValidate } from './_schema-fallback.mjs';

export const id = 'S0';
export const title = 'deck.json 스키마 · 에셋 경로';
export const needsBrowser = false;

/** Prefer the full JSON Schema validator; the lightweight fallback is for old installs. */
async function pickValidator() {
  try {
    const mod = await import('../lib/schema.mjs');
    if (typeof mod.validateDeck === 'function') return { fn: mod.validateDeck, source: 'scripts/lib/schema.mjs' };
    if (typeof mod.validate === 'function') {
      const schema = JSON.parse(fs.readFileSync(new URL('../../references/deck.schema.json', import.meta.url), 'utf8'));
      return { fn: (deck) => mod.validate(schema, deck), source: 'scripts/lib/schema.mjs' };
    }
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

const framePath = (pattern, n) => String(pattern).replace(/%0(\d)d/, (_, width) => String(n).padStart(Number(width), '0'));

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
  let cueErrors = 0;
  let narrativeErrors = 0;
  const version = deck.schemaVersion ?? 1;

  for (const scene of orderedScenes(deck)) {
    // Vite's scene glob silently omits a missing scene.js, so a successful
    // build alone does not prove every storyboard scene is actually mounted.
    for (const file of ['scene.html', 'scene.css', 'scene.js']) {
      if (!exists(path.join(paths.root, 'src', 'scenes', scene.id, file))) {
        items.push(`${scene.id}: 장면 파일 없음 src/scenes/${scene.id}/${file}`);
        narrativeErrors += 1;
      }
    }
    if (version === 1 && !Number.isFinite(Number(scene?.pinVh))) {
      items.push(`${scene.id}: legacy deck requires pinVh`);
      narrativeErrors += 1;
    }
    if (version >= 2) {
      for (const field of ['purpose', 'claim', 'relation', 'reason', 'presenterAction', 'visualChange', 'evidenceStatus']) {
        if (typeof scene?.[field] !== 'string' || !scene[field].trim()) {
          items.push(`${scene.id}: ${field} is required in schemaVersion 2`);
          narrativeErrors += 1;
        }
      }
      const pace = scene?.pace;
      if (!pace || !['pass', 'hold', 'scrub'].includes(pace.mode)) {
        items.push(`${scene.id}: pace.mode must be pass, hold, or scrub`);
        narrativeErrors += 1;
      } else {
        if (pace.mode !== 'pass' && !(pace.scrollVh > 0)) {
          items.push(`${scene.id}: a ${pace.mode} scene needs a positive scrollVh`);
          narrativeErrors += 1;
        }
        if (pace.mode === 'pass' && pace.scrollVh !== 0) {
          items.push(`${scene.id}: pass scenes must use scrollVh 0`);
          narrativeErrors += 1;
        }
        if (!Array.isArray(pace.cueStates) || pace.cueStates.length === 0 ||
            pace.cueStates.some((cue, index) => !Number.isFinite(cue.at) ||
              (index > 0 && cue.at <= pace.cueStates[index - 1].at))) {
          items.push(`${scene.id}: pace.cueStates must contain ascending, meaningful stops`);
          narrativeErrors += 1;
        }
      }
      if (scene.evidenceStatus === 'sourced' && (!scene.source || scene.source.trim().length < 8)) {
        items.push(`${scene.id}: sourced evidence needs a specific source`);
        narrativeErrors += 1;
      }
      if (['synthetic', 'design-target', 'concept'].includes(scene.evidenceStatus) &&
          (!scene.source || !/(가상|합성|목표|콘셉트|예시|synthetic|fictional|target|concept)/i.test(scene.source))) {
        items.push(`${scene.id}: ${scene.evidenceStatus} must be identified in source`);
        narrativeErrors += 1;
      }
    }
    if (Array.isArray(scene?.cues) && scene.cues.some((cue, index) => index > 0 && cue <= scene.cues[index - 1])) {
      items.push(`${scene.id}: cues는 중복 없이 오름차순이어야 합니다`);
      cueErrors += 1;
    }
    const assets = scene?.assets;
    if (!assets || typeof assets !== 'object') continue;
    const wanted = [];
    if (assets.poster) wanted.push(assets.poster);
    if (assets.video) wanted.push(assets.video);
    if (Array.isArray(assets.images)) wanted.push(...assets.images);
    if (Array.isArray(assets.photos)) wanted.push(...assets.photos);
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
  const ok = normalized.ok && missing.length === 0 && items.length === 0;
  const sceneCount = Array.isArray(deck?.scenes) ? deck.scenes.length : 0;
  const details = ok
    ? `장면 ${sceneCount}개 · 스키마(${source}) 통과 · 에셋 경로 이상 없음`
    : `스키마·스토리보드 오류 ${normalized.errors.length + cueErrors + narrativeErrors}건, 없는 에셋 ${missing.length}건 (검증기: ${source})`;
  return { ok, details, items };
}

export default { id, title, needsBrowser, run };
