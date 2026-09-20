/**
 * make-anatomy-chart.mjs — 02-anatomy 가 뜯어볼 차트 한 장.
 *
 * 여덟 분기 매출(막대)과 영업이익률(꺾은선)을 세로 1100×1600 판으로 그린다.
 * anatomy-rows 는 이 그림을 왼쪽 44vw 기둥에 cover 로 깔기 때문에 세로형이다.
 *
 * 끝에 표시점 좌표를 퍼센트로 찍어 준다 — scene.css 의 --ax/--ay 가 그 값이다.
 */
import { QUARTERS, REVENUE_2026, GROWTH, FIXED_COST_DROP, marginOf } from './data.mjs';
import { C, SERIF, SANS, MONO, backdrop, svgDoc, emit, t, line, rect, circle, round } from './lib.mjs';

const W = 1100;
const H = 1600;

const X0 = 180;
const X1 = 1020;
const BASE = 1240;
const SLOT = (X1 - X0) / QUARTERS.length;
const BAR = 58;

const REV_MAX = 450;
const yRev = (v) => BASE - (v / REV_MAX) * 810;
const yMar = (m) => 790 - ((m - 5) / 9) * 440;
const cx = (i) => X0 + SLOT * i + SLOT / 2;

function chart() {
  const out = [];

  // 눈금과 바닥선
  for (let v = 100; v <= 400; v += 100) {
    out.push(line(X0 - 24, yRev(v), X1, yRev(v), { stroke: C.hairline }));
    out.push(t(X0 - 38, yRev(v) + 8, v, { size: 22, fill: C.inkSubtle, anchor: 'end', font: MONO }));
  }
  out.push(line(X0 - 24, BASE, X1, BASE, { stroke: C.hairlineStrong }));

  // 막대 — 2025 는 가라앉은 면, 2026 은 민트
  QUARTERS.forEach((q, i) => {
    const top = yRev(q.revenue);
    const now = q.year === 2026;
    out.push(rect(cx(i) - BAR / 2, top, BAR, BASE - top, {
      fill: now ? C.mint : C.surface3,
      opacity: now ? 0.9 : 1,
    }));
    if (!now) out.push(line(cx(i) - BAR / 2, top, cx(i) + BAR / 2, top, { stroke: C.hairlineStrong, width: 2 }));
    out.push(t(cx(i), top - 16, q.revenue, {
      size: 26, weight: now ? 700 : 400, font: MONO,
      fill: now ? C.ink : C.inkSubtle, anchor: 'middle',
    }));
    out.push(t(cx(i), BASE + 46, q.label, {
      size: 24, font: MONO, anchor: 'middle',
      fill: now ? C.inkMuted : C.inkSubtle,
    }));
  });

  // 회계연도 경계
  const split = X0 + SLOT * 4;
  out.push(line(split, 400, split, BASE + 70, { stroke: C.hairlineStrong, dash: '5 9' }));
  // 경계 라벨은 막대 사이 빈 기둥에 세로로 세운다 — 꺾은선 라벨과 겹치지 않는다.
  out.push(`<text transform="translate(${round(split - 16, 1)} 1226) rotate(-90)" font-family="${SANS}"`
    + ` font-size="24" fill="${C.mint}">2026 회계연도</text>`);

  // 영업이익률 꺾은선
  const points = QUARTERS.map((q, i) => `${round(cx(i), 1)},${round(yMar(q.margin), 1)}`).join(' ');
  out.push(`<polyline points="${points}" fill="none" stroke="${C.amber}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" />`);
  QUARTERS.forEach((q, i) => {
    const last = i === QUARTERS.length - 1;
    out.push(circle(cx(i), yMar(q.margin), last ? 11 : 8, {
      fill: last ? C.amber : C.canvas, stroke: C.amber, width: 3,
    }));
  });
  // 첫 점은 옆에, 나머지는 위에 — 막대 값 라벨과 부딪히지 않는 자리.
  out.push(t(cx(0) - 22, yMar(QUARTERS[0].margin) + 9, `${QUARTERS[0].margin}%`, {
    size: 26, weight: 700, font: MONO, fill: C.amber, anchor: 'end',
  }));
  [5, 7].forEach((i) => {
    const q = QUARTERS[i];
    out.push(t(cx(i), yMar(q.margin) - 26, `${q.margin}%`, {
      size: 26, weight: 700, font: MONO, fill: C.amber, anchor: 'middle',
    }));
  });

  return out.join('\n');
}

function header() {
  return [
    line(90, 150, W - 90, 150, { stroke: C.hairline }),
    t(90, 118, 'QUARTERLY RESULT', { size: 22, font: MONO, fill: C.inkSubtle, spacing: 5 }),
    t(W - 90, 118, '가상 데이터', { size: 22, font: MONO, fill: C.ember, anchor: 'end', spacing: 2 }),
    t(90, 250, '매출과 이익률', { size: 62, font: SERIF, weight: 700, fill: C.ink }),
    t(90, 300, '2025 Q1 – 2026 Q4 · 매출 억원 · 이익률 %', { size: 26, fill: C.inkMuted }),
    rect(90, 340, 30, 14, { fill: C.mint, opacity: 0.9 }),
    t(132, 353, '연결 매출', { size: 24, fill: C.inkMuted }),
    line(290, 347, 334, 347, { stroke: C.amber, width: 4, cap: 'round' }),
    circle(312, 347, 7, { fill: C.canvas, stroke: C.amber, width: 3 }),
    t(346, 353, '영업이익률', { size: 24, fill: C.inkMuted }),
  ].join('\n');
}

function footer() {
  const items = [
    { x: 90, label: '연간 매출', value: `${REVENUE_2026.toLocaleString('en-US')}억`, delta: `+${GROWTH}%` },
    { x: 430, label: '영업이익률', value: `${marginOf(2026)}%`, delta: `+${round(marginOf(2026) - marginOf(2025), 1)}%p` },
    { x: 760, label: '고정비 비중', value: `-${FIXED_COST_DROP}%p`, delta: '물류 통합' },
  ];
  return [
    line(90, 1330, W - 90, 1330, { stroke: C.hairline }),
    ...items.flatMap((item) => [
      t(item.x, 1382, item.label, { size: 22, fill: C.inkSubtle }),
      t(item.x, 1432, item.value, { size: 40, font: SERIF, weight: 700, fill: C.ink }),
      t(item.x, 1474, item.delta, { size: 24, font: MONO, fill: C.mint }),
    ]),
    t(90, 1552, '예시용 가상 데이터 · 밀물 주식회사 2026 연차보고', { size: 22, fill: C.inkSubtle }),
  ].join('\n');
}

/** 각 행이 가리키는 지점. scene.css 의 --ax/--ay 로 옮겨 적는다. */
const ANCHORS = [
  { row: '매출', x: cx(7), y: yRev(QUARTERS[7].revenue) - 16 },
  { row: '이익률', x: cx(5), y: yMar(QUARTERS[5].margin) },
  { row: '전환점', x: X0 + SLOT * 4, y: 1000 },
  { row: '비용', x: 800, y: 1408 },
];

const svg = svgDoc(W, H, [backdrop(W, H), header(), chart(), footer()].join('\n'));

await emit({ scene: '02-anatomy', name: 'quarters', svg });
console.log('  표시점 (scene.css --ax/--ay):');
for (const a of ANCHORS) {
  console.log(`    ${a.row.padEnd(4)} --ax:${round((a.x / W) * 100, 1)} --ay:${round((a.y / H) * 100, 1)}`);
}
