/** 정체를 모르는 bare 패키지 대역. 호출하든 new 하든 터지지 않는 값을 돌려준다. */
function universal() {
  const fn = function universalValue() { return universal(); };
  return new Proxy(fn, {
    get(_t, key) {
      if (key === Symbol.toPrimitive) return () => 0;
      if (key === Symbol.iterator) return function* () {};
      if (key === 'then') return undefined;
      return universal();
    },
    set: () => true,
    has: () => true,
    apply: () => universal(),
    construct: () => universal(),
  });
}
export default universal();
