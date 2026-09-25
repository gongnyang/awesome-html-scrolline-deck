import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { run as init } from '../scripts/cmd/init.mjs';
import { run as add } from '../scripts/cmd/add.mjs';
import { scenePace } from '../scripts/lib/wheel.mjs';

test('v2 authoring requires the argument before creating a scene', async (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scrolline-v2-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const project = path.join(tmp, 'deck');
  assert.equal(await init([project, '--title', '검증 덱']), 0);
  const file = path.join(project, 'data/deck.json');
  assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).schemaVersion, 2);
  assert.equal(await add(['chapter-transition', '--dir', project, '--id', '01-chapter', '--title', '첫 장']), 2);
  assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).scenes.length, 0);
  assert.equal(fs.existsSync(path.join(project, 'src/scenes/01-chapter')), false);

  assert.equal(await add([
    'chapter-transition', '--dir', project, '--id', '01-chapter',
    '--title', '증거를 읽는 순서', '--purpose', '앞 장면의 결론을 다음 근거 질문으로 연결한다',
    '--claim', '증거를 읽는 순서가 이해를 바꾼다', '--reason', '짧은 장 전환은 다음 근거의 읽기 순서를 예고하고 바로 넘긴다',
    '--relation', 'sequence', '--evidenceStatus', 'none',
    '--presenterAction', '앞 장면을 요약하고 다음 질문을 제시한다',
    '--visualChange', '짧은 장 전환이므로 고정 없이 통과한다',
    '--pace', 'pass', '--scrollVh', '0', '--notes', '다음 장으로 연결한다',
  ]), 0);
  const scene = JSON.parse(fs.readFileSync(file, 'utf8')).scenes[0];
  assert.deepEqual(scene.pace, {
    mode: 'pass', scrollVh: 0,
    cueStates: [{ at: 0, message: '증거를 읽는 순서가 이해를 바꾼다' }],
  });
  assert.equal(scene.pinVh, undefined);
});

test('v2 pace takes precedence while v1 pin distance stays readable', () => {
  assert.deepEqual(scenePace({ pace: { mode: 'hold', scrollVh: 160, cueStates: [{ at: 0.6 }] }, pinVh: 300 }),
    { mode: 'hold', scrollVh: 160, cues: [0.6] });
  assert.deepEqual(scenePace({ pinVh: 220, cues: [0.4] }),
    { mode: 'scrub', scrollVh: 220, cues: [0.4] });
});
