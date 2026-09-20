/**
 * make-report-pages.mjs — 04-stack 이 모아 세울 부속 보고서 여섯 장.
 *
 * 한 장에 그림 하나씩: 도넛 · 표 · 연표 · 지도 점 · 인용 · 꺾은선.
 * 1280×720 이고 화면에서는 380px 폭으로 줄어든다 — 그래서 활자가 크다.
 */
import { MIX, PNL, TIMELINE, REGIONS, RETENTION, QUOTE, REVENUE_2026 } from './data.mjs';
import { C, TONE, SERIF, MONO, backdrop, svgDoc, emit, t, line, rect, circle, round } from './lib.mjs';

const W = 1280;
const H = 720;
const M = 72;

/** 도넛 조각 하나. */
function arc(cxp, cyp, rOuter, rInner, from, to, fill) {
  const rad = (deg) => ((deg - 90) * Math.PI) / 180;
  const p = (r, deg) => `${round(cxp + r * Math.cos(rad(deg)), 2)} ${round(cyp + r * Math.sin(rad(deg)), 2)}`;
  const large = to - from > 180 ? 1 : 0;
  return `<path d="M ${p(rOuter, from)} A ${rOuter} ${rOuter} 0 ${large} 1 ${p(rOuter, to)}`
    + ` L ${p(rInner, to)} A ${rInner} ${rInner} 0 ${large} 0 ${p(rInner, from)} Z" fill="${fill}" />`;
}

function frame(num, title, kicker) {
  return [
    backdrop(W, H, `wash-${num}`),
    rect(8, 8, W - 16, H - 16, { stroke: C.hairline }),
    t(M, 96, num, { size: 34, font: MONO, fill: C.amber, weight: 700, spacing: 2 }),
    t(W - M, 96, kicker, { size: 26, fill: C.inkSubtle, anchor: 'end' }),
    line(M, 130, W - M, 130, { stroke: C.hairline }),
    t(M, 218, title, { size: 60, font: SERIF, weight: 700, fill: C.ink }),
    line(M, 636, W - M, 636, { stroke: C.hairline }),
    t(M, 682, '예시용 가상 데이터 · 밀물 주식회사 2026 연차보고', { size: 24, fill: C.inkSubtle }),
  ].join('\n');
}

/** 01 — 매출 구성 도넛 */
function pageMix() {
  const cxp = 380;
  const cyp = 440;
  const parts = [];
  let at = 0;
  MIX.forEach((slice) => {
    const span = (slice.value / 100) * 360;
    parts.push(arc(cxp, cyp, 152, 96, at + 1.6, at + span - 1.6, TONE[slice.tone]));
    at += span;
  });
  const legend = MIX.flatMap((slice, i) => {
    const y = 336 + i * 98;
    return [
      rect(660, y - 26, 30, 30, { fill: TONE[slice.tone] }),
      t(710, y, slice.label, { size: 40, fill: C.ink }),
      t(W - M, y + 4, `${slice.value}%`, { size: 50, font: SERIF, weight: 700, fill: TONE[slice.tone], anchor: 'end' }),
    ];
  });
  return [
    frame('01', '매출 구성', '부문별 비중'),
    ...parts,
    t(cxp, 432, `${REVENUE_2026.toLocaleString('en-US')}억`, { size: 42, font: SERIF, weight: 700, fill: C.ink, anchor: 'middle' }),
    t(cxp, 478, '연결 매출', { size: 26, fill: C.inkSubtle, anchor: 'middle' }),
    ...legend,
  ].join('\n');
}

/** 02 — 분기 손익 표 */
function pagePnl() {
  const cols = [M, 700, 960, W - M];
  const head = [
    t(cols[0], 310, '분기', { size: 30, fill: C.inkSubtle }),
    t(cols[1], 310, '매출', { size: 30, fill: C.inkSubtle, anchor: 'end' }),
    t(cols[2], 310, '영업이익', { size: 30, fill: C.inkSubtle, anchor: 'end' }),
    t(cols[3], 310, '이익률', { size: 30, fill: C.inkSubtle, anchor: 'end' }),
    line(M, 334, W - M, 334, { stroke: C.hairlineStrong }),
  ];
  const rows = PNL.flatMap((row, i) => {
    const y = 390 + i * 68;
    const last = i === PNL.length - 1;
    const ink = last ? C.mint : C.ink;
    return [
      t(cols[0], y, row.quarter, { size: 42, font: SERIF, weight: 700, fill: ink }),
      t(cols[1], y, row.revenue, { size: 40, font: MONO, fill: ink, anchor: 'end' }),
      t(cols[2], y, row.profit.toFixed(1), { size: 40, font: MONO, fill: ink, anchor: 'end' }),
      t(cols[3], y, `${row.margin}%`, { size: 40, font: MONO, weight: 700, fill: last ? C.mint : C.amber, anchor: 'end' }),
      line(M, y + 26, W - M, y + 26, { stroke: C.hairline }),
    ];
  });
  return [frame('02', '분기 손익', '2026 · 단위 억원'), ...head, ...rows].join('\n');
}

/** 03 — 한 해의 연표 */
function pageTimeline() {
  const x = (i) => 200 + i * ((W - 400) / (TIMELINE.length - 1));
  const y = 440;
  const marks = TIMELINE.flatMap((item, i) => {
    const last = i === TIMELINE.length - 1;
    return [
      circle(x(i), y, last ? 18 : 13, { fill: last ? C.mint : C.canvas, stroke: last ? C.mint : C.hairlineStrong, width: 3 }),
      t(x(i), y - 46, item.when, { size: 36, font: MONO, weight: 700, fill: last ? C.mint : C.amber, anchor: 'middle' }),
      t(x(i), y + 76, item.what, { size: 32, fill: C.inkMuted, anchor: 'middle' }),
    ];
  });
  return [
    frame('03', '한 해의 순서', '주요 실행'),
    line(120, y, W - 120, y, { stroke: C.hairline }),
    line(120, y, x(TIMELINE.length - 1), y, { stroke: C.hairlineStrong }),
    ...marks,
  ].join('\n');
}

/** 04 — 권역별 거점 */
function pageMap() {
  const px = (r) => 200 + (r.x - 0.36) * 1100;
  const py = (r) => 296 + (r.y - 0.30) * 480;
  const hub = REGIONS[0];
  const links = REGIONS.slice(1).map((r) =>
    line(px(hub), py(hub), px(r), py(r), { stroke: C.hairlineStrong, dash: '4 8', opacity: 0.8 }));
  const dots = REGIONS.flatMap((r) => {
    const size = 16 + r.count * 5;
    return [
      circle(px(r), py(r), size, { fill: C.mint, opacity: 0.16, stroke: C.mint, width: 2 }),
      circle(px(r), py(r), 6, { fill: C.mint }),
      t(px(r) + size + 18, py(r) + 12, `${r.name} ${r.count}`, { size: 34, fill: C.inkMuted }),
    ];
  });
  return [
    frame('04', '거점 지도', '권역별 물류 거점'),
    ...links,
    ...dots,
    t(W - M, 430, '17', { size: 130, font: SERIF, weight: 700, fill: C.mint, anchor: 'end' }),
    t(W - M, 486, '통합 물류 거점', { size: 34, fill: C.ink, anchor: 'end' }),
    t(W - M, 532, '2025년 9개에서 8개 늘었다', { size: 26, fill: C.inkSubtle, anchor: 'end' }),
  ].join('\n');
}

/** 05 — 고객 인용 */
function pageQuote() {
  const lines = QUOTE.text.split('\n');
  return [
    frame('05', '고객의 말', '구독 가구 인터뷰'),
    t(96, 486, '“', { size: 200, font: SERIF, weight: 700, fill: C.mint, opacity: 0.32 }),
    ...lines.map((text, i) => t(230, 370 + i * 82, text, { size: 54, font: SERIF, weight: 700, fill: C.ink })),
    line(230, 500, 350, 500, { stroke: C.amber, width: 3 }),
    t(230, 556, QUOTE.by, { size: 30, fill: C.inkSubtle }),
  ].join('\n');
}

/** 06 — 구독 유지율 */
function pageRetention() {
  const x0 = 120;
  const x1 = W - 160;
  const step = (x1 - x0) / (RETENTION.length - 1);
  const yv = (v) => 590 - ((v - 74) / 20) * 200;
  const pts = RETENTION.map((v, i) => [x0 + i * step, yv(v)]);
  const poly = pts.map(([x, y]) => `${round(x, 1)},${round(y, 1)}`).join(' ');
  const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${round(x, 1)} ${round(y, 1)}`).join(' ');
  const area = `<path d="${path} L ${round(x1, 1)} 590 L ${round(x0, 1)} 590 Z" fill="${C.mint}" fill-opacity="0.12" />`;
  return [
    frame('06', '구독 유지율', '2026 · 월별 %'),
    t(M, 336, `${RETENTION[RETENTION.length - 1]}%`, { size: 76, font: SERIF, weight: 700, fill: C.mint }),
    t(M, 382, `1월 ${RETENTION[0]}% 에서 12월까지`, { size: 28, fill: C.inkSubtle }),
    line(x0, yv(90), x1, yv(90), { stroke: C.hairline, dash: '4 8' }),
    t(x0 + 8, yv(90) - 14, '90%', { size: 26, font: MONO, fill: C.inkSubtle }),
    line(x0, 590, x1, 590, { stroke: C.hairlineStrong }),
    area,
    `<polyline points="${poly}" fill="none" stroke="${C.mint}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" />`,
    circle(pts[0][0], pts[0][1], 10, { fill: C.canvas, stroke: C.mint, width: 4 }),
    circle(pts[pts.length - 1][0], pts[pts.length - 1][1], 13, { fill: C.mint }),
    t(x0, 626, '1월', { size: 26, font: MONO, fill: C.inkSubtle }),
    t(x1, 626, '12월', { size: 26, font: MONO, fill: C.inkSubtle, anchor: 'middle' }),
  ].join('\n');
}

const PAGES = [
  ['page-01-mix', pageMix],
  ['page-02-pnl', pagePnl],
  ['page-03-timeline', pageTimeline],
  ['page-04-map', pageMap],
  ['page-05-quote', pageQuote],
  ['page-06-retention', pageRetention],
];

for (const [name, draw] of PAGES) {
  await emit({ scene: '04-stack', name, svg: svgDoc(W, H, draw()) });
}
