import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyTextGeometry } from '../scripts/lib/layout-audit.mjs';

function rect(text, left, top, width, height, fontSize = 20, lineHeight = 28) {
  return {
    text,
    hangul: (text.match(/[가-힣]/g) ?? []).length,
    left, right: left + width, top, bottom: top + height,
    width, height, fontSize, lineHeight,
  };
}

test('projector label squeezed into a one-word column is rejected', () => {
  const issues = classifyTextGeometry([rect('우리의 경쟁 우위는 실제 예약 흐름입니다', 10, 10, 78, 196)]);
  assert.ok(issues.some((issue) => issue.startsWith('좁은 한국어 열')));
});

test('two readable text labels occupying the same location are rejected', () => {
  const issues = classifyTextGeometry([
    rect('주장 문구', 10, 10, 260, 40),
    rect('근거 수치', 16, 12, 240, 38),
  ]);
  assert.ok(issues.some((issue) => issue.startsWith('텍스트 충돌')));
});

test('adjacent readable labels pass', () => {
  const issues = classifyTextGeometry([
    rect('주장 문구', 10, 10, 260, 40),
    rect('근거 수치', 10, 62, 260, 40),
  ]);
  assert.deepEqual(issues, []);
});
