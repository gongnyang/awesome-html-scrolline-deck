/**
 * make-all.mjs — 이 덱의 에셋 전부를 한 번에 굽는다.
 *
 *   NODE_PATH=<sharp 가 있는 node_modules> node tools/make-all.mjs
 *
 * 사진도 영상도 쓰지 않는다. 모든 그림은 tools/ 안의 SVG 소스에서 나온다.
 */
await import('./make-anatomy-chart.mjs');
await import('./make-report-pages.mjs');
await import('./make-shift-plates.mjs');
