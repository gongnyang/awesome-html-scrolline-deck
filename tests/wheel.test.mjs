/**
 * wheel.test.mjs — 휠 드라이버의 순수 계산만 본다(브라우저 없이).
 * 구간 산수와 가시 판정이 틀리면 G5~G10이 조용히 틀린 답을 낸다.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeRange, expectedPinDistance, progressY, probeY, reachableProbeY, landingY,
  isVisibleEntry, countVisible, HOLD_RATIO, MIN_AREA,
} from '../scripts/lib/wheel.mjs';

const rect = (top, left, width, height) => ({
  top, left, right: left + width, bottom: top + height, width, height,
});
const view = { width: 1440, height: 900 };

test('핀 구간은 spacer 높이에서 실제 section 높이를 뺀 값이다', () => {
  const range = computeRange({ top: -500, height: 2700, scrollY: 1000, innerHeight: 900 });
  assert.equal(range.start, 500);
  assert.equal(range.pinDistance, 1800);
  assert.equal(range.end, 2300);
  assert.equal(range.pinned, true);
});

test('줄바꿈으로 section이 커져도 핀 거리에는 더하지 않는다', () => {
  const range = computeRange({ top: 0, height: 2236, sectionHeight: 976, innerHeight: 900 });
  assert.equal(range.pinDistance, 1260);
  assert.equal(range.pinDistance, expectedPinDistance(140, 900));
});

test('핀이 없는 장면의 핀 거리는 0이다', () => {
  const range = computeRange({ top: 0, height: 900, scrollY: 2000, innerHeight: 900, pinned: false });
  assert.equal(range.pinDistance, 0);
  assert.equal(range.start, 2000);
});

test('pinVh는 뷰포트 높이 비율로 픽셀이 된다', () => {
  assert.equal(expectedPinDistance(200, 900), 1800);
  assert.equal(expectedPinDistance(100, 900), 900);
  assert.equal(expectedPinDistance(350, 1080), 3780);
});

test('진행률 좌표와 착지 좌표', () => {
  const range = computeRange({ top: 0, height: 2700, scrollY: 1000, innerHeight: 900 });
  assert.equal(progressY(range, 0), 1000);
  assert.equal(progressY(range, 0.55), 1000 + Math.round(1800 * 0.55));
  assert.equal(progressY(range, 1), 2800);
  assert.equal(progressY(range, 2), 2800, '1을 넘는 진행률은 잘라낸다');
  assert.equal(landingY(range), 1000 + 1800 * HOLD_RATIO);
});

test('핀 없는 장면의 탐침 좌표는 섹션 통과 구간을 쓴다', () => {
  const pinned = computeRange({ top: 0, height: 2700, scrollY: 1000, innerHeight: 900 });
  assert.equal(probeY(pinned, 0.5, 900), 1900);

  const flat = computeRange({ top: 0, height: 900, scrollY: 3000, innerHeight: 900, pinned: false });
  // start-900 에서 start+900 까지가 구간이므로 절반은 start
  assert.equal(probeY(flat, 0.5, 900), 3000);
  assert.equal(probeY(flat, 0, 900), 2100);
  assert.equal(probeY(flat, 1, 900), 3900);
});

test('마지막 비고정 장면은 문서 끝의 완성 화면을 탐침 종료점으로 쓴다', () => {
  const finalPass = computeRange({ top: 0, height: 1080, scrollY: 3000, innerHeight: 1080, pinned: false });
  assert.equal(reachableProbeY(finalPass, .30, 1080, 3000, true), 2568);
  assert.equal(reachableProbeY(finalPass, .99, 1080, 3000, true), 3000);
  assert.equal(reachableProbeY(finalPass, .99, 1080, 3000, false), 4058);
});

test('가시 판정: 면적·불투명도·종류', () => {
  const big = { kind: 'text', opacity: 1, rect: rect(100, 100, 300, 80) };
  assert.equal(isVisibleEntry(big, view), true);

  assert.equal(isVisibleEntry({ ...big, opacity: 0.05 }, view), false, '.05는 통과하지 않는다');
  assert.equal(isVisibleEntry({ ...big, opacity: 0.06 }, view), true);
  assert.equal(isVisibleEntry({ ...big, kind: 'other' }, view), false, '글자도 미디어도 아니면 세지 않는다');
  assert.equal(isVisibleEntry({ ...big, hidden: true }, view), false);
});

test('가시 판정: 뷰포트 밖과 걸친 요소', () => {
  // 완전히 위로 빠진 요소
  assert.equal(isVisibleEntry({ kind: 'img', opacity: 1, rect: rect(-300, 0, 300, 300) }, view), false);
  // 오른쪽으로 완전히 빠진 요소
  assert.equal(isVisibleEntry({ kind: 'img', opacity: 1, rect: rect(0, 1440, 300, 300) }, view), false);
  // 걸쳐 있고 겹친 면적이 400px² 이상
  assert.equal(isVisibleEntry({ kind: 'img', opacity: 1, rect: rect(-280, 0, 300, 300) }, view), true);
});

test('가시 판정: 최소 면적 경계', () => {
  const side = Math.sqrt(MIN_AREA); // 20px
  assert.equal(isVisibleEntry({ kind: 'text', opacity: 1, rect: rect(0, 0, side, side) }, view), true);
  assert.equal(isVisibleEntry({ kind: 'text', opacity: 1, rect: rect(0, 0, side - 1, side) }, view), false);
});

test('countVisible은 통과한 것만 센다', () => {
  const entries = [
    { kind: 'text', opacity: 1, rect: rect(0, 0, 300, 60) },
    { kind: 'img', opacity: 1, rect: rect(100, 100, 400, 300) },
    { kind: 'text', opacity: 0, rect: rect(200, 0, 300, 60) },
    { kind: 'other', opacity: 1, rect: rect(0, 0, 900, 900) },
    { kind: 'canvas', opacity: 1, rect: rect(2000, 0, 300, 300) },
  ];
  assert.equal(countVisible(entries, view), 2);
  assert.equal(countVisible([], view), 0);
  assert.equal(countVisible(undefined, view), 0);
});
