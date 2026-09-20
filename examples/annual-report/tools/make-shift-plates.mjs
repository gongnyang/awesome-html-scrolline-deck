/**
 * make-shift-plates.mjs — 05-shift 가 와이프로 겹쳐 넘길 판 세 장.
 *
 *   plate-2025  전체 화면 구조도, 한 갈래
 *   plate-2026  전체 화면 구조도, 세 갈래
 *   plate-delta 오른쪽 아래에 서는 요약 카드
 *
 * 전체 화면 판은 1600×900 이고 화면에서는 cover 로 잘린다. 좌우 80px 은
 * 잘려 나갈 수 있고, 왼쪽 아래는 장면 캡션 자리라 비워 둔다.
 */
import { MIX, SHIFT } from './data.mjs';
import { C, TONE, SERIF, SANS, MONO, backdrop, svgDoc, emit, t, line, rect, circle, round } from './lib.mjs';

const W = 1600;
const H = 900;

/** 왼쪽 아래 캡션 자리를 지키는 어둠. */
const scrim = (id) =>
  `<defs><linearGradient id="${id}" x1="0" y1="1" x2="0.75" y2="0.15">`
  + `<stop offset="0%" stop-color="${C.canvas}" stop-opacity="0.96"/>`
  + `<stop offset="48%" stop-color="${C.canvas}" stop-opacity="0.55"/>`
  + `<stop offset="100%" stop-color="${C.canvas}" stop-opacity="0"/>`
  + `</linearGradient></defs>`
  + rect(0, 0, W, H, { fill: `url(#${id})` });

const node = (x, y, r, label, opts = {}) => {
  const { stroke = C.hairlineStrong, fill = C.surface2, ink = C.inkMuted, size = 34, width = 2 } = opts;
  return [
    circle(x, y, r, { fill, stroke, width }),
    t(x, y + size / 3, label, { size, fill: ink, anchor: 'middle', font: SANS }),
  ].join('\n');
};

const chevron = (x, y, tone = C.hairlineStrong) =>
  `<path d="M ${x} ${y - 11} L ${x + 13} ${y} L ${x} ${y + 11}" fill="none" stroke="${tone}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;

/** 2025 — 산지에서 고객까지 한 줄. */
function plate2025() {
  const y = 450;
  const xs = [260, 520, 780, 1040];
  const names = ['산지', '총판', '소매', '고객'];
  const links = xs.slice(0, -1).flatMap((x, i) => [
    line(x + 92, y, xs[i + 1] - 92, y, { stroke: C.hairlineStrong }),
    chevron(xs[i + 1] - 112, y),
  ]);
  return [
    backdrop(W, H, 'wash-2025'),
    t(110, 300, '2025', { size: 190, font: SERIF, weight: 700, fill: C.inkSubtle, opacity: 0.2 }),
    t(112, 360, '유통 경로 하나', { size: 30, font: MONO, fill: C.inkSubtle, spacing: 2 }),
    ...links,
    ...xs.map((x, i) => node(x, y, 84, names[i], i === xs.length - 1
      ? { stroke: C.amber, ink: C.ink }
      : {})),
    t(1040, 600, '100%', { size: 40, font: SERIF, weight: 700, fill: C.amber, anchor: 'middle' }),
    t(1040, 642, '단건 판매', { size: 28, fill: C.inkSubtle, anchor: 'middle' }),
    t(650, 232, '재구매는 집계되지 않았다', { size: 30, fill: C.inkSubtle, anchor: 'middle' }),
    scrim('scrim-2025'),
  ].join('\n');
}

/** 2026 — 산지에서 세 갈래로. 오른쪽 아래는 요약 카드가 설 자리라 비운다. */
function plate2026() {
  const hub = { x: 320, y: 500 };
  const branches = MIX.map((slice, i) => ({
    ...slice,
    x: 720,
    y: 260 + i * 240,
    tone: TONE[slice.tone],
  }));
  const curves = branches.map((b) =>
    `<path d="M ${hub.x + 92} ${hub.y} C ${(hub.x + b.x) / 2} ${hub.y} ${(hub.x + b.x) / 2} ${b.y} ${b.x - 84} ${b.y}"`
    + ` fill="none" stroke="${b.tone}" stroke-width="${round(2 + (b.value / 100) * 8, 1)}" stroke-opacity="0.75" />`);
  const bars = branches.flatMap((b) => [
    rect(830, b.y - 13, 200, 26, { fill: C.surface3 }),
    rect(830, b.y - 13, (b.value / 100) * 200, 26, { fill: b.tone, opacity: 0.9 }),
    t(1048, b.y + 11, `${b.value}%`, { size: 36, font: SERIF, weight: 700, fill: b.tone }),
  ]);
  return [
    backdrop(W, H, 'wash-2026'),
    t(110, 300, '2026', { size: 190, font: SERIF, weight: 700, fill: C.mint, opacity: 0.26 }),
    t(112, 360, '유통 경로 셋', { size: 30, font: MONO, fill: C.mint, spacing: 2 }),
    ...curves,
    node(hub.x, hub.y, 84, '산지', { stroke: C.hairlineStrong, ink: C.ink }),
    ...branches.map((b) => node(b.x, b.y, 76, b.label, { stroke: b.tone, ink: C.ink, size: 30 })),
    ...bars,
    t(780, 120, '구독이 매출의 절반을 넘었다', { size: 30, fill: C.inkMuted, anchor: 'middle' }),
    scrim('scrim-2026'),
  ].join('\n');
}

/** 요약 카드 — 세로로 서는 작은 판. */
function plateDelta() {
  const CW = 720;
  const CH = 1040;
  const rows = SHIFT.flatMap((row, i) => {
    const y = 300 + i * 230;
    const max = Math.max(row.from, row.to);
    const bar = (value, yy, fill) => [
      rect(60, yy, 600, 16, { fill: C.surface3 }),
      rect(60, yy, (value / max) * 600, 16, { fill }),
    ];
    return [
      t(60, y, row.label, { size: 34, fill: C.inkSubtle }),
      t(60, y + 72, `${row.from}${row.unit}`, { size: 46, font: SERIF, weight: 700, fill: C.inkSubtle }),
      t(200, y + 72, '→', { size: 40, fill: C.inkSubtle }),
      t(258, y + 72, `${row.to}${row.unit}`, { size: 64, font: SERIF, weight: 700, fill: C.mint }),
      ...bar(row.from, y + 104, C.hairlineStrong),
      ...bar(row.to, y + 134, C.mint),
    ];
  });
  return svgDoc(CW, CH, [
    backdrop(CW, CH, 'wash-delta'),
    rect(6, 6, CW - 12, CH - 12, { stroke: C.hairline }),
    t(60, 96, '2025 → 2026', { size: 30, font: MONO, fill: C.amber, spacing: 2 }),
    line(60, 126, CW - 60, 126, { stroke: C.hairline }),
    t(60, 212, '한 해의 차이', { size: 60, font: SERIF, weight: 700, fill: C.ink }),
    ...rows,
    line(60, 946, CW - 60, 946, { stroke: C.hairline }),
    t(60, 992, '예시용 가상 데이터', { size: 26, fill: C.inkSubtle }),
  ].join('\n'));
}

await emit({ scene: '05-shift', name: 'plate-2025', svg: svgDoc(W, H, plate2025()) });
await emit({ scene: '05-shift', name: 'plate-2026', svg: svgDoc(W, H, plate2026()) });
await emit({ scene: '05-shift', name: 'plate-delta', svg: plateDelta() });
