#!/usr/bin/env node
/**
 * scrolline verify <덱 폴더> — 정적 게이트 + 실제 브라우저 주행.
 *
 * 순서: (필요하면) vite build → vite preview 띄움 → 200 확인 → 게이트 전체 → 서버 종료.
 * Playwright가 없으면 브라우저 게이트를 skipped로 남긴다.
 * 공개 전 검증에는 --strict를 사용해 이 경우 실패로 처리한다.
 * 브라우저 설치를 강요하지 않되, 통과했다고 거짓말하지도 않는다(report.json에 skipped:true).
 *
 * 주행은 마우스 휠 입력만 쓴다. 스크롤 위치를 코드로 옮기면 lenis·ScrollTrigger의 실제 경로를
 * 건너뛰어 핀·스크럽 결함이 드러나지 않는다(G4가 이 파일도 함께 검사한다).
 */
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { loadGates, runGates, formatTable, writeReport, STATIC_GATES, BROWSER_GATES } from '../gates/run.mjs';
import { readDeck, isDir, exists } from '../gates/_util.mjs';
import { loadPlaywright, launchChromium, INSTALL_HINT } from '../lib/browser.mjs';

export const USAGE = 'scrolline verify <덱 폴더> [--build] [--strict] [--port N] [--base URL] [--json]';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function sh(command, args, options) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.on('error', (err) => resolve({ code: 1, error: err }));
    child.on('close', (code) => resolve({ code: code ?? 1 }));
  });
}

async function waitForServer(url, { timeoutMs = 60_000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (res.ok) return true;
    } catch { /* 아직 안 떴다 */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

/** vite preview를 자식 프로세스 그룹으로 띄우고, 끄는 함수를 함께 돌려준다. */
async function startPreview(dir, port) {
  const localVite = path.join(dir, 'node_modules', 'vite', 'bin', 'vite.js');
  const command = exists(localVite) ? process.execPath : npx;
  const args = exists(localVite)
    ? [localVite, 'preview', '--port', String(port), '--strictPort']
    : ['vite', 'preview', '--port', String(port), '--strictPort'];
  const child = spawn(command, args, {
    cwd: dir,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  });
  const log = [];
  child.stdout?.on('data', (d) => log.push(String(d)));
  child.stderr?.on('data', (d) => log.push(String(d)));

  const stop = async () => {
    try {
      if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, 'SIGTERM');
      else child.kill('SIGTERM');
    } catch { /* 이미 죽었다 */ }
    await new Promise((r) => setTimeout(r, 200));
  };
  return { child, log, stop };
}

export async function run(argv = []) {
  const flags = argv.filter((a) => a.startsWith('--'));
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--port' || argv[i] === '--base') { i += 1; continue; }
    if (!argv[i].startsWith('--')) positional.push(argv[i]);
  }
  const json = flags.includes('--json');
  const forceBuild = flags.includes('--build');
  const strict = flags.includes('--strict');
  const portFlag = argv[argv.indexOf('--port') + 1];
  const baseFlag = argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : null;
  const dir = path.resolve(positional[0] ?? '.');

  if (!isDir(dir)) {
    console.error(`덱 폴더가 없습니다: ${dir}\n${USAGE}`);
    return 2;
  }

  const { deck, error } = readDeck(dir);
  if (error) {
    console.error(`  ${error}`);
    return 2;
  }

  console.log(`\nscrolline verify — ${path.relative(process.cwd(), dir) || '.'}\n`);

  const found = await loadPlaywright();
  const cleanups = [];
  let browser = null;
  let stopServer = null;
  let baseURL = baseFlag;
  let gateFiles = STATIC_GATES;
  const skippedNote = [];

  try {
    if (!found) {
      console.log(INSTALL_HINT);
      console.log('');
      skippedNote.push('Playwright 없음');
    } else {
      if (!baseURL) {
        const distDir = path.join(dir, 'dist');
        if (forceBuild || !exists(path.join(distDir, 'index.html'))) {
          console.log('  vite build …');
          const localVite = path.join(dir, 'node_modules', 'vite', 'bin', 'vite.js');
          const hasScript = (() => {
            try { return Boolean(JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).scripts?.build); }
            catch { return false; }
          })();
          const built = exists(localVite)
            ? await sh(process.execPath, [localVite, 'build'], { cwd: dir })
            : hasScript
            ? await sh(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { cwd: dir })
            : await sh(npx, ['vite', 'build'], { cwd: dir });
          if (built.code !== 0) {
            console.error('  빌드 실패. 덱 폴더에서 npm install 을 먼저 했는지 확인하세요.');
            return 1;
          }
        }
        const port = Number(portFlag) || (await freePort());
        const preview = await startPreview(dir, port);
        stopServer = preview.stop;
        baseURL = `http://127.0.0.1:${port}/`;
        console.log(`  vite preview ${baseURL}`);
        if (!(await waitForServer(baseURL))) {
          console.error('  preview 서버가 200을 돌려주지 않았습니다.');
          console.error(preview.log.join('').slice(-800));
          return 1;
        }
      }

      browser = await launchChromium(found.pw);
      cleanups.push(async () => { try { await browser.close(); } catch { /* 무시 */ } });
      gateFiles = [...STATIC_GATES, ...BROWSER_GATES];
      console.log(`  playwright: ${found.from}\n`);
    }

    const gates = await loadGates(gateFiles);
    const ctx = { dir, deck, baseURL, browser, cache: {}, cleanups };
    const report = await runGates(gates, ctx);

    // 건너뛴 브라우저 게이트도 보고서에 남긴다. 통과와 구분되어야 한다.
    if (!found) {
      const browserGates = await loadGates(BROWSER_GATES);
      for (const gate of browserGates) {
        report.gates.push({
          id: gate.id,
          title: gate.title,
          ok: true,
          skipped: true,
          details: `건너뜀 — ${skippedNote.join(', ')}`,
          items: [],
          ms: 0,
        });
      }
      if (strict) report.ok = false;
    }

    for (const cleanup of cleanups.splice(0)) await cleanup();

    if (json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(formatTable(report));
      console.log(`  보고서: ${path.relative(process.cwd(), path.join(dir, 'qa', 'report.json'))}`);
      if (report.ok && found) console.log('\n  전부 통과. qa/*.jpg 캡처 3장씩을 눈으로 확인하세요.\n');
      else if (report.ok) console.log('\n  정적 게이트만 통과했습니다. 브라우저 게이트는 돌지 않았습니다.\n');
      else console.log('\n  실패한 게이트를 고친 뒤 다시 돌리세요.\n');
    }
    writeReport(dir, report);
    return report.ok ? 0 : 1;
  } finally {
    for (const cleanup of cleanups) { try { await cleanup(); } catch { /* 무시 */ } }
    if (stopServer) await stopServer();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exit(await run(process.argv.slice(2)));
}

export default run;
