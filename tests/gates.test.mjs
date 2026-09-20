/**
 * gates.test.mjs — 정적 게이트가 정상 덱을 통과시키고, 결함 덱을 정확히 그 결함으로 잡는지.
 *
 * bad-* 픽스처는 good을 한 군데만 망가뜨린 사본이다. 그래서 "기대한 게이트만 실패"까지 본다.
 * 게이트가 아무거나 물어 실패시키면 사람은 곧 게이트를 안 믿게 된다.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { checkDeck } from '../scripts/cmd/check.mjs';
import { findVarTweens } from '../scripts/gates/g03.mjs';
import { findScrollJumps } from '../scripts/gates/g04.mjs';
import { lintCss, lintPaths } from '../scripts/gates/lint.mjs';
import { TimelineRecorder } from '../scripts/gates/_tl-recorder.mjs';
import { rewriteSpecifiers } from '../scripts/gates/_load-scene.mjs';
import { validateDeck } from '../scripts/gates/_schema-fallback.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name) => path.join(HERE, 'fixtures', name);

const failedIds = (report) => report.gates.filter((g) => !g.ok && !g.skipped).map((g) => g.id).sort();

test('good 픽스처는 정적 게이트를 전부 통과한다', async () => {
  const report = await checkDeck(fixture('good'), { write: false });
  assert.equal(report.ok, true, `실패한 게이트: ${JSON.stringify(report.gates.filter((g) => !g.ok), null, 2)}`);
  assert.deepEqual(failedIds(report), []);
  assert.equal(report.gates.length, 6);
  assert.ok(report.gates.every((g) => typeof g.details === 'string' && g.details.length > 0));
});

const CASES = [
  ['bad-id', 'G1'],
  ['bad-duration', 'G2'],
  ['bad-var-tween', 'G3'],
  ['bad-hex-color', 'LINT'],
];

for (const [name, expected] of CASES) {
  test(`${name} 픽스처는 ${expected}만 실패한다`, async () => {
    const report = await checkDeck(fixture(name), { write: false });
    assert.equal(report.ok, false, `${name}이 통과해 버렸습니다`);
    assert.deepEqual(failedIds(report), [expected]);
    const gate = report.gates.find((g) => g.id === expected);
    assert.ok(gate.items.length > 0, `${expected}가 이유를 말하지 않았습니다`);
    assert.match(gate.items[0], /01-hero/);
  });
}

test('checkDeck은 report.json 모양을 지킨다', async () => {
  const report = await checkDeck(fixture('good'), { write: false });
  assert.equal(typeof report.ok, 'boolean');
  assert.ok(Array.isArray(report.gates));
  assert.ok(!Number.isNaN(Date.parse(report.ts)));
  for (const gate of report.gates) {
    assert.equal(typeof gate.id, 'string');
    assert.equal(typeof gate.ok, 'boolean');
    assert.equal(typeof gate.skipped, 'boolean');
    assert.equal(typeof gate.details, 'string');
  }
});

test('verify는 Playwright가 없으면 브라우저 게이트를 건너뛰고 exit 0 한다', () => {
  const cli = path.join(HERE, '..', 'scripts', 'cmd', 'verify.mjs');
  const result = spawnSync(process.execPath, [cli, fixture('good'), '--json'], {
    encoding: 'utf8',
    env: { ...process.env, SCROLLINE_SKIP_BROWSER: '1' },
    timeout: 120_000,
  });
  assert.equal(result.status, 0, `exit ${result.status}\n${result.stderr}`);

  const json = result.stdout.slice(result.stdout.indexOf('{'));
  const report = JSON.parse(json);
  assert.equal(report.ok, true);

  const browserGates = report.gates.filter((g) => ['G5', 'G6', 'G7', 'G8', 'G9', 'G10'].includes(g.id));
  assert.equal(browserGates.length, 6, '브라우저 게이트 6개가 보고서에 남아야 한다');
  // 건너뛴 것은 통과로 위장하지 않는다
  assert.ok(browserGates.every((g) => g.skipped === true), '건너뛴 게이트에 skipped:true 가 없습니다');
  assert.ok(report.gates.filter((g) => !g.skipped).every((g) => g.ok));
});

/* ----------------------------- 단위: 탐지기 ----------------------------- */

test('G3은 gsap 호출 문자열 안의 var( )만 잡는다', () => {
  assert.equal(findVarTweens("tl.to(el, { clipPath: 'inset(0 0 0 var(--w))' }, 0);").length, 1);
  assert.equal(findVarTweens("tl.to(el, { x: 10 }, 0);").length, 0);
  // tween이 아닌 곳의 var( )는 정상이다
  assert.equal(findVarTweens("el.style.setProperty('--w', '10px');").length, 0);
  // 주석 안은 보지 않는다
  assert.equal(findVarTweens("// tl.to(el, { clipPath: 'var(--w)' })").length, 0);
});

test('G4는 직접 스크롤 이동만 잡고 lenis.scrollTo는 허용한다', () => {
  assert.equal(findScrollJumps('window.scrollTo(0, 0);').length, 1);
  assert.equal(findScrollJumps('el.scrollIntoView({ behavior: "smooth" });').length, 1);
  assert.equal(findScrollJumps('lenis.scrollTo(target);').length, 0);
  assert.equal(findScrollJumps('ctx.lenis?.scrollTo(target);').length, 0);
  assert.equal(findScrollJumps('scrollToPx(lenis, y);').length, 0);
});

test('L1은 토큰을 통과시키고 색 리터럴을 잡는다', () => {
  const scoped = (body) => `[data-scene="01-a"] .x { ${body} }`;
  assert.equal(lintCss(scoped('color: var(--fg);'), '01-a').l1.length, 0);
  assert.equal(lintCss(scoped('background: transparent;'), '01-a').l1.length, 0);
  assert.equal(lintCss(scoped('color: currentColor;'), '01-a').l1.length, 0);
  assert.equal(lintCss(scoped('color: #fff;'), '01-a').l1.length, 1);
  assert.equal(lintCss(scoped('color: rgba(0,0,0,.4);'), '01-a').l1.length, 1);
  assert.equal(lintCss(scoped('color: rebeccapurple;'), '01-a').l1.length, 1);
});

test('L2는 스코프 없는 선택자를 잡고 @keyframes 안은 눈감는다', () => {
  assert.equal(lintCss('[data-scene="01-a"] .x { opacity: 1 }', '01-a').l2.length, 0);
  assert.equal(lintCss('@media (min-width: 900px) { [data-scene="01-a"] .x { opacity: 1 } }', '01-a').l2.length, 0);
  assert.equal(lintCss('@keyframes spin { from { opacity: 0 } to { opacity: 1 } }', '01-a').l2.length, 0);
  assert.equal(lintCss('html[data-theme="light"] [data-scene="01-a"] .x { opacity: 1 }', '01-a').l2.length, 0);
  assert.equal(lintCss('.x { opacity: 1 }', '01-a').l2.length, 1);
  assert.equal(lintCss('[data-scene="02-b"] .x { opacity: 1 }', '01-a').l2.length, 1);
});

test('L3은 그리기 안무가 있을 때만 pathLength를 따진다', () => {
  const html = '<svg><path d="M0 0 L10 10"/></svg>';
  assert.equal(lintPaths(html, { css: '', js: '' }).length, 0);
  assert.equal(lintPaths(html, { css: '.x { --draw: 0; }' }).length, 1);
  assert.equal(lintPaths(html, { js: 'tl.to(p, { strokeDashoffset: 0 })' }).length, 1);
  assert.equal(lintPaths('<svg><path pathLength="1" d="M0 0"/></svg>', { css: '--draw:0' }).length, 0);
});

/* ----------------------------- 단위: 타임라인 ----------------------------- */

test('타임라인 레코더가 position 파라미터를 푼다', () => {
  const tl = new TimelineRecorder();
  tl.to({}, { duration: 0.2 }, 0);        // 0 → .2
  tl.to({}, { duration: 0.3 }, '>');      // .2 → .5
  tl.to({}, { duration: 0.1 }, '<');      // .2 → .3
  tl.to({}, { duration: 0.2 }, '+=0.1');  // 끝(.5)+.1 = .6 → .8
  assert.equal(Number(tl.duration().toFixed(3)), 0.8);
});

test('타임라인 레코더가 stagger와 기본 duration을 센다', () => {
  const each = new TimelineRecorder();
  each.to([1, 2, 3, 4], { duration: 0.2, stagger: 0.1 }, 0); // .2 + .1*3
  assert.equal(Number(each.duration().toFixed(3)), 0.5);

  const amount = new TimelineRecorder();
  amount.to([1, 2, 3, 4], { duration: 0.2, stagger: { amount: 0.3 } }, 0);
  assert.equal(Number(amount.duration().toFixed(3)), 0.5);

  const fallback = new TimelineRecorder();
  fallback.to({}, {}, 0); // duration 미지정 → GSAP 기본 0.5
  assert.equal(fallback.duration(), 0.5);

  const zero = new TimelineRecorder();
  zero.set({}, { autoAlpha: 0 }, 0.9); // set은 길이 0
  assert.equal(zero.duration(), 0.9);
});

test('타임라인 레코더가 중첩 타임라인과 라벨을 센다', () => {
  const child = new TimelineRecorder();
  child.to({}, { duration: 0.4 }, 0);
  const tl = new TimelineRecorder();
  tl.addLabel('hold', 0.3);
  tl.add(child, 'hold');
  assert.equal(Number(tl.duration().toFixed(3)), 0.7);
});

/* ----------------------------- 단위: 로더·스키마 ----------------------------- */

test('로더가 bare 지정자만 스텁으로 바꾼다', () => {
  const { source, replaced } = rewriteSpecifiers(
    "import gsap from 'gsap';\nimport { ScrollTrigger } from 'gsap/ScrollTrigger';\nimport './scene.css';\nimport x from './helper.js';",
  );
  assert.ok(replaced.includes('gsap'));
  assert.ok(replaced.includes('gsap/ScrollTrigger'));
  assert.ok(replaced.includes('./scene.css'));
  assert.ok(source.includes("from './helper.js'"), '상대 경로 모듈은 그대로 두어야 한다');
  assert.ok(!/from 'gsap'/.test(source));
});

test('대체 스키마가 계약 위반을 잡는다', () => {
  const base = {
    title: 't',
    scenes: [{ id: '01-a', order: 0, technique: 'closing-qr', pinVh: 180, copy: {}, notes: 'n' }],
  };
  assert.equal(validateDeck(base).ok, true);
  assert.equal(validateDeck({ ...base, scenes: [{ ...base.scenes[0], id: 'hero' }] }).ok, false);
  assert.equal(validateDeck({ ...base, scenes: [{ ...base.scenes[0], pinVh: 900 }] }).ok, false);
  assert.equal(validateDeck({ ...base, scenes: [{ ...base.scenes[0], technique: 'nope' }] }).ok, false);
  assert.equal(validateDeck({ ...base, scenes: [{ ...base.scenes[0], notes: '' }] }).ok, false);
  assert.equal(validateDeck({ ...base, scenes: [] }).ok, false);
});
