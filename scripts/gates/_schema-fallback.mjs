/**
 * _schema-fallback.mjs — scripts/lib/schema.mjs(E 담당)가 아직 없을 때 쓰는 최소 검증기.
 * 플랜 §S2의 deck.json 계약만 본다. schema.mjs가 생기면 s00이 그쪽을 먼저 쓴다.
 */

export const TECHNIQUES = [
  'frame-scrub-hero', 'word-relay', 'kinetic-titles', 'horizontal-gallery',
  'anatomy-rows', 'frame-scrub-video', 'parallax-video', 'paper-assembly',
  'odometer-stats', 'wipe-transform', 'tilt-card', 'closing-qr',
];

const ID_RE = /^\d{2}-[a-z0-9-]+$/;

export function validateDeck(deck) {
  const errors = [];
  const add = (p, m) => errors.push(`${p}: ${m}`);

  if (!deck || typeof deck !== 'object' || Array.isArray(deck)) {
    return { ok: false, errors: ['deck: 객체가 아닙니다'] };
  }
  if (typeof deck.title !== 'string' || !deck.title.trim()) add('title', '문자열이어야 합니다');
  if (deck.subtitle != null && typeof deck.subtitle !== 'string') add('subtitle', '문자열이어야 합니다');
  if (deck.lang != null && typeof deck.lang !== 'string') add('lang', '문자열이어야 합니다');

  const presenter = deck.presenter;
  if (presenter != null) {
    if (typeof presenter !== 'object') add('presenter', '객체여야 합니다');
    else {
      if (presenter.name != null && typeof presenter.name !== 'string') add('presenter.name', '문자열이어야 합니다');
      if (presenter.roles != null && !Array.isArray(presenter.roles)) add('presenter.roles', '배열이어야 합니다');
      if (presenter.autoDurationSec != null && !(Number(presenter.autoDurationSec) > 0)) {
        add('presenter.autoDurationSec', '양수여야 합니다');
      }
    }
  }

  const theme = deck.theme;
  if (theme != null) {
    if (typeof theme !== 'object') add('theme', '객체여야 합니다');
    else if (theme.style != null && !['dark', 'light'].includes(theme.style)) add('theme.style', "'dark' 또는 'light'");
  }

  if (!Array.isArray(deck.scenes) || deck.scenes.length === 0) {
    add('scenes', '장면이 최소 1개 있어야 합니다');
    return { ok: errors.length === 0, errors };
  }

  const seenId = new Set();
  const seenOrder = new Set();
  deck.scenes.forEach((scene, i) => {
    const p = `scenes[${i}]`;
    if (!scene || typeof scene !== 'object') { add(p, '객체여야 합니다'); return; }
    if (typeof scene.id !== 'string' || !ID_RE.test(scene.id)) add(`${p}.id`, `'NN-kebab' 형식이어야 합니다 (받은 값: ${JSON.stringify(scene.id)})`);
    else if (seenId.has(scene.id)) add(`${p}.id`, `id 중복: ${scene.id}`);
    else seenId.add(scene.id);

    if (!Number.isInteger(scene.order)) add(`${p}.order`, '정수여야 합니다');
    else if (seenOrder.has(scene.order)) add(`${p}.order`, `order 중복: ${scene.order}`);
    else seenOrder.add(scene.order);

    if (!TECHNIQUES.includes(scene.technique)) add(`${p}.technique`, `12기법 중 하나여야 합니다 (받은 값: ${JSON.stringify(scene.technique)})`);

    const pinVh = Number(scene.pinVh);
    if (!Number.isFinite(pinVh) || pinVh < 100 || pinVh > 400) add(`${p}.pinVh`, `100~400 사이여야 합니다 (받은 값: ${JSON.stringify(scene.pinVh)})`);

    if (scene.pin != null && typeof scene.pin !== 'boolean') add(`${p}.pin`, '불리언이어야 합니다');
    if (typeof scene.notes !== 'string' || !scene.notes.trim()) add(`${p}.notes`, '발표 노트는 필수입니다');

    const copy = scene.copy;
    if (copy == null) add(`${p}.copy`, '필수입니다');
    else if (typeof copy !== 'object') add(`${p}.copy`, '객체여야 합니다');
    else {
      if (copy.title != null && typeof copy.title !== 'string') add(`${p}.copy.title`, '문자열이어야 합니다');
      if (copy.kicker != null && typeof copy.kicker !== 'string') add(`${p}.copy.kicker`, '문자열이어야 합니다');
      if (copy.lines != null && !Array.isArray(copy.lines)) add(`${p}.copy.lines`, '배열이어야 합니다');
    }

    const assets = scene.assets;
    if (assets != null) {
      if (typeof assets !== 'object') add(`${p}.assets`, '객체여야 합니다');
      else {
        if (assets.frames != null) {
          if (typeof assets.frames !== 'string' || !assets.frames.includes('%03d')) add(`${p}.assets.frames`, "'%03d' 패턴이 있어야 합니다");
          if (!Number.isInteger(assets.count) || assets.count < 1) add(`${p}.assets.count`, 'frames가 있으면 count는 1 이상 정수여야 합니다');
        }
        if (assets.critical != null && !Array.isArray(assets.critical)) add(`${p}.assets.critical`, '배열이어야 합니다');
        if (assets.images != null && !Array.isArray(assets.images)) add(`${p}.assets.images`, '배열이어야 합니다');
      }
    }
  });

  return { ok: errors.length === 0, errors };
}

export default validateDeck;
