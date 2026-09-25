/**
 * browser.mjs — Playwright를 "있으면 쓰고 없으면 건너뛴다".
 *
 * playwright는 optional peer다(package.json). 정적 check는 설치 없이 실행할 수 있다.
 * verify에서 브라우저가 없으면 G5~G13을 skipped 실패로 남겨 배포 통과로 오인하지 않는다.
 */
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const GLOBAL_FALLBACKS = [
  '/home/seunghyeong/.npm-global/lib/node_modules/playwright/index.js',
  '/usr/local/lib/node_modules/playwright/index.js',
  '/usr/lib/node_modules/playwright/index.js',
];

export const INSTALL_HINT = [
  'Playwright가 없어 브라우저 게이트(G5~G13)를 건너뜁니다. verify는 실패로 처리합니다.',
  '  설치: npm i -D playwright && npx playwright install --with-deps chromium',
  '  전역 설치본을 쓰려면 PLAYWRIGHT_PATH=/경로/playwright/index.js 를 지정하세요.',
].join('\n');

/**
 * @returns {Promise<{pw:object, from:string}|null>}
 */
export async function loadPlaywright() {
  // 브라우저가 없는 CI·테스트에서 '건너뜀' 경로를 그대로 타게 하는 스위치.
  // 통과로 위장하지 않는다 — G5~G10은 report.json에 skipped:true로 남는다.
  if (process.env.SCROLLINE_SKIP_BROWSER === '1') return null;

  const tried = [];
  const attempts = [];
  if (process.env.PLAYWRIGHT_PATH) attempts.push(process.env.PLAYWRIGHT_PATH);
  attempts.push('playwright', 'playwright-core', ...GLOBAL_FALLBACKS);

  for (const attempt of attempts) {
    const isPath = attempt.startsWith('/') || attempt.startsWith('.');
    if (isPath && !fs.existsSync(attempt)) { tried.push(attempt); continue; }
    try {
      const mod = await import(isPath ? pathToFileURL(attempt).href : attempt);
      const pw = mod.default ?? mod;
      if (pw?.chromium) return { pw, from: attempt };
      tried.push(`${attempt} (chromium 없음)`);
    } catch (err) {
      tried.push(`${attempt} (${String(err?.message ?? err).split('\n')[0].slice(0, 60)})`);
    }
  }
  return null;
}

/** chromium을 띄운다. 브라우저 바이너리가 없으면 null과 안내를 돌려준다. */
export async function launchChromium(pw, options = {}) {
  try {
    return await pw.chromium.launch({ args: ['--disable-dev-shm-usage'], ...options });
  } catch (err) {
    const message = String(err?.message ?? err);
    if (/Executable doesn't exist|install/i.test(message)) {
      throw new Error(`chromium 바이너리가 없습니다. npx playwright install chromium 을 먼저 실행하세요.\n${message.split('\n')[0]}`);
    }
    throw err;
  }
}

/**
 * 오류를 모으는 페이지를 연다.
 * @returns {Promise<{page:object, context:object, errors:string[]}>}
 */
export async function openPage(browser, { width = 1440, height = 900, reducedMotion } = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    ...(reducedMotion ? { reducedMotion } : {}),
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${String(e?.message ?? e).split('\n')[0].slice(0, 160)}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 160)}`); });
  page.on('requestfailed', (r) => {
    const failure = r.failure()?.errorText ?? '';
    if (/ERR_ABORTED/.test(failure)) return; // 미디어 프리로드 중단은 오류가 아니다
    errors.push(`request: ${r.url().slice(-80)} ${failure}`);
  });
  return { page, context, errors };
}
