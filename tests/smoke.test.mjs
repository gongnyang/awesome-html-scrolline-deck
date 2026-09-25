/**
 * smoke.test.mjs — 샘플 덱이 실제로 설치되고 빌드되고 정적 게이트를 통과하는지.
 *
 * 게이트가 픽스처에서만 도는 것은 증명이 아니다. 배포되는 덱(examples/sample-deck)을
 * 임시 폴더로 복사해 npm ci → vite build → check 를 순서대로 돌린다.
 * 샘플 덱이 아직 없으면(D 워커 산출 전) 건너뛴다.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkDeck } from '../scripts/cmd/check.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const SAMPLE = path.join(REPO, 'examples', 'sample-deck');

const deckFile = ['data/deck.json', 'deck.json'].map((f) => path.join(SAMPLE, f)).find((f) => fs.existsSync(f));
const hasSample = Boolean(deckFile) && fs.existsSync(path.join(SAMPLE, 'package.json'));

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const bundledPnpm = path.resolve(path.dirname(process.execPath), '../node_modules/pnpm/bin/pnpm.mjs');

const OFFLINE = /ENOTFOUND|ETIMEDOUT|ECONNREFUSED|EAI_AGAIN|network|registry\.npmjs\.org/i;

function run(command, args, cwd) {
  const env = { ...process.env, PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ''}` };
  const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', timeout: 10 * 60_000 });
  return { code: result.status ?? 1, out: `${result.stdout ?? ''}${result.stderr ?? ''}${result.error ?? ''}` };
}

test(
  '샘플 덱: 복사 → npm ci → vite build → check 통과',
  { skip: hasSample ? false : 'examples/sample-deck 가 아직 없습니다 (D 워커 산출 전)' },
  async (t) => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scrolline-smoke-'));
    t.after(() => { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* 무시 */ } });

    const work = path.join(tmp, 'sample-deck');
    fs.cpSync(SAMPLE, work, {
      recursive: true,
      filter: (src) => !/[\\/](node_modules|dist|qa)([\\/]|$)/.test(src),
    });
    assert.ok(fs.existsSync(path.join(work, 'package.json')));

    const hasLock = fs.existsSync(path.join(work, 'package-lock.json'));
    const useBundledPnpm = process.platform === 'win32' && run(npm, ['--version'], work).code !== 0 && fs.existsSync(bundledPnpm);
    if (useBundledPnpm) {
      // This isolated smoke fixture must allow Vite's esbuild install hook.
      fs.writeFileSync(path.join(work, 'pnpm-workspace.yaml'), 'packages:\n  - .\ndangerouslyAllowAllBuilds: true\n');
    }
    const install = useBundledPnpm
      ? run(process.execPath, [bundledPnpm, 'install', '--lockfile=false'], work)
      : run(npm, [hasLock ? 'ci' : 'install', '--no-audit', '--no-fund'], work);
    if (install.code !== 0) {
      if (OFFLINE.test(install.out)) return t.skip(`npm 레지스트리에 접근할 수 없습니다: ${install.out.slice(-200)}`);
      assert.fail(`npm ${hasLock ? 'ci' : 'install'} 실패\n${install.out.slice(-1500)}`);
    }

    const localVite = path.join(work, 'node_modules', 'vite', 'bin', 'vite.js');
    const build = fs.existsSync(localVite)
      ? run(process.execPath, [localVite, 'build'], work)
      : run(npx, ['vite', 'build'], work);
    assert.equal(build.code, 0, `vite build 실패\n${build.out.slice(-1500)}`);
    assert.ok(fs.existsSync(path.join(work, 'dist', 'index.html')), 'dist/index.html 이 나오지 않았습니다');

    const report = await checkDeck(work, { write: false });
    const failed = report.gates.filter((g) => !g.ok && !g.skipped);
    assert.equal(
      report.ok,
      true,
      `샘플 덱이 정적 게이트를 통과하지 못했습니다:\n${failed.map((g) => `  ${g.id} ${g.details}\n${g.items.map((i) => `    · ${i}`).join('\n')}`).join('\n')}`,
    );
  },
);

test('샘플 덱 deck.json은 발표 장면 8개 이상을 담는다', { skip: hasSample ? false : '샘플 덱 없음' }, () => {
  const deck = JSON.parse(fs.readFileSync(deckFile, 'utf8'));
  assert.ok(Array.isArray(deck.scenes));
  assert.ok(deck.scenes.length >= 8, `장면이 ${deck.scenes.length}개입니다 (최소 8개)`);
  const ids = deck.scenes.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'id가 중복입니다');
});
