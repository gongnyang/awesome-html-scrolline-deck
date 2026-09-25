/** Inspect rendered text boxes at a presentation hold, not source CSS guesses. */
export function classifyTextGeometry(rects) {
  const issues = [];
  for (const rect of rects) {
    const lineCount = rect.height / Math.max(rect.lineHeight, rect.fontSize * 1.1);
    const widthInEm = rect.width / Math.max(rect.fontSize, 1);
    if (rect.hangul >= 8 && rect.text.length >= 12 && widthInEm < 6.8 && lineCount > 4.2) {
      issues.push(`좁은 한국어 열: “${rect.text.slice(0, 26)}” (${widthInEm.toFixed(1)}em, ${lineCount.toFixed(1)}줄)`);
    }
  }
  for (let i = 0; i < rects.length; i += 1) {
    const a = rects[i];
    if (a.text.length < 3 || a.fontSize < 14) continue;
    for (let j = i + 1; j < rects.length; j += 1) {
      const b = rects[j];
      if (b.text.length < 3 || b.fontSize < 14 || a.text === b.text) continue;
      const w = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const h = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      const smaller = Math.min(a.width * a.height, b.width * b.height);
      if (smaller > 0 && (w * h) / smaller > .78) {
        issues.push(`텍스트 충돌: “${a.text.slice(0, 22)}” / “${b.text.slice(0, 22)}”`);
      }
    }
  }
  return [...new Set(issues)];
}

export async function auditTextGeometry(page, sceneId) {
  const rects = await page.evaluate((id) => {
    const section = [...document.querySelectorAll('[data-scene]')].find((node) => node.getAttribute('data-scene') === id);
    if (!section) return [];
    const candidates = section.querySelectorAll('h1,h2,h3,h4,p,span,strong,b,small,li,figcaption,td,th,svg text');
    return [...candidates].filter((node) => node.childElementCount === 0).map((node) => {
      const text = node.textContent?.trim().replace(/\s+/g, ' ') || '';
      if (!text) return null;
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      const fontSize = parseFloat(style.fontSize) || 0;
      const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.25;
      let opacity = 1;
      for (let parent = node; parent && parent !== section.parentElement; parent = parent.parentElement) {
        const parentStyle = getComputedStyle(parent);
        if (parentStyle.visibility === 'hidden' || parentStyle.display === 'none') return null;
        opacity *= parseFloat(parentStyle.opacity) || 0;
      }
      if (opacity < .2 || box.width < 3 || box.height < 3) return null;
      if (box.right < 0 || box.left > innerWidth || box.bottom < 0 || box.top > innerHeight) return null;
      return {
        text, hangul: (text.match(/[가-힣]/g) || []).length,
        left: box.left, right: box.right, top: box.top, bottom: box.bottom,
        width: box.width, height: box.height, fontSize, lineHeight,
      };
    }).filter(Boolean);
  }, sceneId);
  return classifyTextGeometry(rects);
}
