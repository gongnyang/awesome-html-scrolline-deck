/**
 * data.mjs — 이 덱이 쓰는 모든 숫자. 전부 예시용 가상 데이터다.
 *
 * 실재하는 회사·실적과 무관하며, 「밀물 주식회사」는 이 예제를 위해 지어낸 이름이다.
 * 장면 카피(data/deck.json)와 인포그래픽이 같은 값을 보도록 여기 한 곳에만 둔다.
 */

export const COMPANY = '밀물 주식회사';
export const FY = 2026;

/** 여덟 분기. revenue 단위 억원, margin 단위 %. */
export const QUARTERS = [
  { label: '25 Q1', year: 2025, revenue: 302, margin: 5.9 },
  { label: '25 Q2', year: 2025, revenue: 328, margin: 6.6 },
  { label: '25 Q3', year: 2025, revenue: 340, margin: 7.1 },
  { label: '25 Q4', year: 2025, revenue: 398, margin: 7.4 },
  { label: '26 Q1', year: 2026, revenue: 336, margin: 9.6 },
  { label: '26 Q2', year: 2026, revenue: 358, margin: 11.6 },
  { label: '26 Q3', year: 2026, revenue: 372, margin: 12.6 },
  { label: '26 Q4', year: 2026, revenue: 416, margin: 13.4 },
];

export const sum = (list, key) => list.reduce((total, row) => total + row[key], 0);

export const REVENUE_2025 = sum(QUARTERS.filter((q) => q.year === 2025), 'revenue'); // 1368
export const REVENUE_2026 = sum(QUARTERS.filter((q) => q.year === 2026), 'revenue'); // 1482
export const GROWTH = ((REVENUE_2026 / REVENUE_2025 - 1) * 100).toFixed(1);          // 8.3

/** 매출 구성. 합 100. */
export const MIX = [
  { label: '구독', value: 52, tone: 'mint' },
  { label: '단건 판매', value: 31, tone: 'amber' },
  { label: 'B2B 공급', value: 17, tone: 'ember' },
];

/** 2026 분기 손익 요약. 단위 억원. */
export const PNL = QUARTERS.filter((q) => q.year === 2026).map((q) => ({
  quarter: q.label.replace('26 ', ''),
  revenue: q.revenue,
  profit: Math.round(q.revenue * q.margin) / 100,
  margin: q.margin,
}));

export const TIMELINE = [
  { when: '2월', what: '구독 요금제 전환' },
  { when: '5월', what: '원가 구조 재설계' },
  { when: '8월', what: '물류 거점 통합' },
  { when: '11월', what: 'B2B 공급 개시' },
];

/** 권역별 통합 물류 거점. 합 17. */
export const REGIONS = [
  { name: '수도권', count: 6, x: 0.44, y: 0.30 },
  { name: '중부', count: 3, x: 0.49, y: 0.47 },
  { name: '영남', count: 4, x: 0.58, y: 0.66 },
  { name: '호남', count: 3, x: 0.40, y: 0.69 },
  { name: '제주', count: 1, x: 0.36, y: 0.88 },
];

/** 구독 유지율(%), 1월부터 12월까지. */
export const RETENTION = [78, 79, 81, 82, 84, 85, 86, 88, 88, 90, 90, 91];

export const QUOTE = {
  text: '주문을 넣는 날보다\n안 넣어도 되는 날이 좋아졌다.',
  by: '구독 3년차 가구 인터뷰 · 2026년 9월',
};

/** 2025 → 2026 구조 변화. */
export const SHIFT = [
  { label: '영업이익률', from: 6.8, to: 11.9, unit: '%' },
  { label: '구독 매출 비중', from: 18, to: 52, unit: '%' },
  { label: '물류 거점', from: 9, to: 17, unit: '개' },
];

/** 연간 영업이익률(%). 2026 = 11.9 → 덱 표지 숫자는 반올림한 12. */
export const marginOf = (year) => {
  const rows = QUARTERS.filter((q) => q.year === year);
  const profit = rows.reduce((total, q) => total + q.revenue * q.margin, 0);
  return Math.round((profit / sum(rows, 'revenue')) * 10) / 10;
};

/** 물류 통합으로 내려간 고정비 비중(%p). */
export const FIXED_COST_DROP = 4.2;

export const KPI = {
  revenue: REVENUE_2026,
  growth: GROWTH,
  margin: marginOf(2026),
  households: 38,
  hubs: 17,
};
