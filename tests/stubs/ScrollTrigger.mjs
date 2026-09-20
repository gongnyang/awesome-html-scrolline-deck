/**
 * tests/stubs/ScrollTrigger.mjs — 정적 게이트가 쓰는 ScrollTrigger 대역.
 * 실제 구현은 scripts/gates/_stubs/에 있다(게이트가 배포본에서도 스스로 돌아야 하므로).
 * 여기서는 테스트가 같은 대역을 직접 import 할 수 있게 다시 내보내기만 한다.
 */
export * from '../../scripts/gates/_stubs/ScrollTrigger.mjs';
export { default } from '../../scripts/gates/_stubs/ScrollTrigger.mjs';
