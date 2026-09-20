/**
 * _load-scene.mjs — scene.js를 브라우저·번들러 없이 import 한다.
 *
 * 방법: 원본 옆에 임시 사본을 만들되 bare 지정자(gsap, gsap/ScrollTrigger, lenis …)를
 * _stubs/*.mjs 의 절대 경로로 바꿔 쓴다. 상대 경로 import는 그대로 두므로 원본 폴더에
 * 써야 해석이 맞다. 임시 파일은 finally에서 지운다.
 *
 * 대안(--import 훅, node:vm, import map)을 쓰지 않은 이유: 훅은 프로세스 전체에 걸리고
 * vm은 ESM 링크를 직접 해줘야 해서, 파일 한 장 바꿔 쓰는 쪽이 짧고 되돌리기 쉽다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { GATES_DIR } from './_util.mjs';

const STUBS = path.join(GATES_DIR, '_stubs');
const url = (name) => pathToFileURL(path.join(STUBS, name)).href;

const BARE_MAP = new Map([
  ['gsap', url('gsap.mjs')],
  ['gsap/all', url('gsap.mjs')],
  ['gsap/dist/gsap', url('gsap.mjs')],
  ['gsap/ScrollTrigger', url('ScrollTrigger.mjs')],
  ['gsap/dist/ScrollTrigger', url('ScrollTrigger.mjs')],
  ['gsap/src/ScrollTrigger', url('ScrollTrigger.mjs')],
  ['lenis', url('lenis.mjs')],
  ['@studio-freight/lenis', url('lenis.mjs')],
]);

const STYLE_RE = /\.(css|scss|sass|less|styl)(\?.*)?$/;
const ASSET_RE = /\.(png|jpe?g|webp|avif|gif|svg|mp4|webm|woff2?|json)(\?.*)?$/;

function mapSpecifier(spec) {
  if (BARE_MAP.has(spec)) return BARE_MAP.get(spec);
  if (STYLE_RE.test(spec) || ASSET_RE.test(spec)) return url('empty.mjs');
  if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('file:')) return null; // 그대로 둔다
  return url('universal.mjs'); // 정체 모를 bare 패키지
}

/** import/export 지정자를 스텁 경로로 바꾼다. */
export function rewriteSpecifiers(source) {
  const replaced = [];
  const out = String(source).replace(
    /(\bfrom\s*|\bimport\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)(['"])([^'"\n]+)\2/g,
    (match, prefix, quote, spec) => {
      const mapped = mapSpecifier(spec);
      if (!mapped) return match;
      replaced.push(spec);
      return `${prefix}${quote}${mapped}${quote}`;
    },
  );
  return { source: out, replaced };
}

/**
 * scene.js의 기본 내보내기를 돌려준다.
 * @returns {Promise<{ok:boolean, module?:object, error?:string, replaced?:string[]}>}
 */
export async function loadSceneModule(scenePath) {
  let raw;
  try {
    raw = fs.readFileSync(scenePath, 'utf8');
  } catch (err) {
    return { ok: false, error: `읽을 수 없음: ${String(err.message ?? err)}` };
  }

  const { source, replaced } = rewriteSpecifiers(raw);
  const dir = path.dirname(scenePath);
  const token = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
  let probe = path.join(dir, `.scrolline-probe-${token}.mjs`);
  let wroteBeside = true;

  try {
    fs.writeFileSync(probe, source, 'utf8');
  } catch {
    // 장면 폴더에 쓸 수 없으면 임시 폴더로 물러난다(상대 import는 깨질 수 있다).
    wroteBeside = false;
    probe = path.join(fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'scrolline-')), 'probe.mjs');
    try { fs.writeFileSync(probe, source, 'utf8'); }
    catch (err) { return { ok: false, error: `임시 사본 생성 실패: ${String(err.message ?? err)}` }; }
  }

  try {
    const mod = await import(`${pathToFileURL(probe).href}?t=${token}`);
    return { ok: true, module: mod, replaced, wroteBeside };
  } catch (err) {
    return { ok: false, error: String(err?.message ?? err).split('\n')[0], replaced };
  } finally {
    try { fs.rmSync(probe, { force: true }); } catch { /* 무시 */ }
  }
}
