#!/usr/bin/env node
// Self-test for the scene templates. Stubs gsap and the DOM, runs every
// template's mount() and build(), and asserts the rules the gates enforce:
//   1. default export is { id, mount, build, unmount } and id is '{{id}}'
//   2. every timeline position + duration stays inside 0 .. 1
//   3. no var() anywhere in scene.js (tween strings must not read CSS vars)
//   4. no bare from() — frame 0 has to be an explicit fromTo start value
//   5. every scene.css rule is scoped with [data-scene=
//   6. no hex, rgb(), hsl() or named colours in scene.css
//   7. no text reveal tweened as a width in ch/em
// scripts/gates/ reuses these predicates; keep the two in step.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TOLERANCE = 0.001;

const NAMED_COLORS = ['aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategray', 'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'greenyellow', 'grey', 'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan', 'lightgray', 'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray', 'lightsteelblue', 'lightyellow', 'lime', 'limegreen', 'linen', 'magenta', 'maroon', 'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen', 'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange', 'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise', 'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple', 'rebeccapurple', 'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna', 'silver', 'skyblue', 'slateblue', 'slategray', 'snow', 'springgreen', 'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen'];

// ---------------------------------------------------------------- fake DOM
const rect = () => ({ left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600, x: 0, y: 0 });

function makeNode(tag = 'div', depth = 0) {
  const kids = new Map();
  const node = {
    tagName: String(tag).toUpperCase(),
    style: { setProperty() {}, removeProperty() {} },
    dataset: { target: '1', slot: 'r0', mark: 'r0', accent: '1' },
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    className: '',
    textContent: '',
    innerHTML: '',
    children: [],
    getBoundingClientRect: rect,
    setAttribute() {},
    getAttribute: () => null,
    removeAttribute() {},
    insertAdjacentHTML() {},
    append() {},
    replaceChildren() {},
    addEventListener() {},
    removeEventListener() {},
    closest: () => makeNode('div', depth + 1),
    play: () => Promise.resolve(),
    pause() {},
    querySelector(selector) {
      if (depth > 6) return null;
      if (!kids.has(selector)) kids.set(selector, makeNode('div', depth + 1));
      return kids.get(selector);
    },
    querySelectorAll(selector) {
      if (depth > 6) return [];
      const key = `all:${selector}`;
      if (!kids.has(key)) kids.set(key, [makeNode('div', depth + 1), makeNode('div', depth + 1), makeNode('div', depth + 1)]);
      return kids.get(key);
    },
  };
  return node;
}

function installGlobals() {
  globalThis.document = {
    createElement: (tag) => makeNode(tag),
    scrollingElement: { scrollTop: 0 },
  };
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};
  globalThis.fetch = () => Promise.resolve({ ok: false, text: () => Promise.resolve('') });
  globalThis.Image = class { constructor() { return makeNode('img'); } };
}

// -------------------------------------------------------- timeline recorder
function makeTimeline(problems, id) {
  const records = [];
  const count = (target) => (Array.isArray(target) ? Math.max(1, target.length) : 1);

  const scanStrings = (vars, kind) => {
    for (const [key, value] of Object.entries(vars || {})) {
      if (typeof value === 'string' && value.includes('var(')) {
        problems.push(`${id}: ${kind} value ${key}: "${value}" reads a CSS variable inside a tween string`);
      }
    }
  };

  const record = (target, vars, position, kind) => {
    const at = Number(position) || 0;
    const duration = Number(vars && vars.duration) || 0;
    const stagger = Number(vars && vars.stagger) || 0;
    const repeat = Number(vars && vars.repeat) || 0;
    const n = Math.max(0, count(target) - 1);
    const span = duration * (1 + stagger * n) * (repeat + 1);
    records.push({ kind, at, end: at + span });
    scanStrings(vars, kind);
  };

  const tl = {
    records,
    to(target, vars, position) { record(target, vars, position, 'to'); return tl; },
    from(target, vars, position) {
      problems.push(`${id}: bare from() breaks the frame-0 composed state; use fromTo()`);
      record(target, vars, position, 'from');
      return tl;
    },
    fromTo(target, fromVars, toVars, position) {
      scanStrings(fromVars, 'fromTo start');
      record(target, toVars, position, 'fromTo');
      return tl;
    },
    set(target, vars, position) { record(target, { ...vars, duration: 0 }, position, 'set'); return tl; },
    call(fn, args, position) { records.push({ kind: 'call', at: Number(position) || 0, end: Number(position) || 0 }); return tl; },
    add() { return tl; },
    addLabel() { return tl; },
  };
  return tl;
}

// ------------------------------------------------------------- css checking
function cssRulePreludes(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const preludes = [];
  let start = 0;
  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (ch === '{') {
      preludes.push(clean.slice(start, i).trim());
      start = i + 1;
    } else if (ch === '}' || ch === ';') {
      start = i + 1;
    }
  }
  return preludes.filter(Boolean);
}

function cssColorProblems(css, id) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const problems = [];
  const declaration = /([-a-zA-Z]+)\s*:\s*([^;{}]+)/g;
  let match;
  while ((match = declaration.exec(clean)) !== null) {
    const value = match[2];
    if (/#[0-9a-fA-F]{3,8}\b/.test(value)) problems.push(`${id}: hex colour in "${match[0].trim()}"`);
    if (/\brgba?\s*\(/.test(value)) problems.push(`${id}: rgb() in "${match[0].trim()}"`);
    if (/\bhsla?\s*\(/.test(value)) problems.push(`${id}: hsl() in "${match[0].trim()}"`);
    for (const name of NAMED_COLORS) {
      if (new RegExp(`(^|[^-\\w])${name}([^-\\w]|$)`).test(value)) {
        problems.push(`${id}: named colour "${name}" in "${match[0].trim()}"`);
        break;
      }
    }
  }
  return problems;
}

// --------------------------------------------------------------------- run
const folders = readdirSync(HERE)
  .filter((name) => !name.startsWith('_') && !name.startsWith('.'))
  .filter((name) => statSync(join(HERE, name)).isDirectory())
  .sort();

installGlobals();

const problems = [];
let checked = 0;

for (const folder of folders) {
  const dir = join(HERE, folder);
  const jsPath = join(dir, 'scene.js');
  const cssPath = join(dir, 'scene.css');
  const htmlPath = join(dir, 'scene.html');
  const jsonPath = join(dir, 'template.json');

  // --- files exist
  for (const file of [jsPath, cssPath, htmlPath, jsonPath]) {
    try { statSync(file); } catch { problems.push(`${folder}: missing ${file.replace(dir + '/', '')}`); }
  }

  const source = readFileSync(jsPath, 'utf8');
  if (source.includes('var(')) problems.push(`${folder}: scene.js contains "var(" — CSS variables belong in scene.css`);
  if (/window\.scrollTo|scrollIntoView/.test(source)) problems.push(`${folder}: scene.js must not drive the page scroll`);
  // "ch" is the advance width of a zero: a width tween in ch clips proportional
  // text at the final state, not just mid-tween. Reveal with a clip instead.
  if (/\bwidth\s*:\s*[`'"][^`'"]*\d(ch|em|ex)\b/.test(source)) {
    problems.push(`${folder}: scene.js tweens a width in ch/em — use a clip-path reveal so any length survives`);
  }
  for (const marker of ['// enter', '// hold', '// exit']) {
    if (!source.includes(marker)) problems.push(`${folder}: scene.js is missing the "${marker}" block comment`);
  }

  // --- module shape
  const mod = (await import(pathToFileURL(jsPath).href)).default;
  if (!mod || typeof mod !== 'object') { problems.push(`${folder}: no default export`); continue; }
  if (mod.id !== '{{id}}') problems.push(`${folder}: id must be the '{{id}}' placeholder, got ${JSON.stringify(mod.id)}`);
  for (const member of ['mount', 'build', 'unmount']) {
    if (typeof mod[member] !== 'function') problems.push(`${folder}: ${member}() is missing`);
  }

  // --- mount + build against the stubs
  const template = JSON.parse(readFileSync(jsonPath, 'utf8'));
  for (const key of ['technique', 'pinVh', 'pin', 'tags', 'slots', 'assets', 'hold', 'notesHint', 'description_en', 'description_ko']) {
    if (!(key in template)) problems.push(`${folder}: template.json is missing "${key}"`);
  }
  if (template.technique !== folder) problems.push(`${folder}: template.json technique is "${template.technique}"`);
  const contract = template.sceneContract;
  for (const key of ['status', 'relation', 'fit', 'unfit', 'requiredInputs', 'scrollBeatSemantics', 'stableHold', 'projectorTypeCriteria', 'labelCriteria', 'mobile', 'reducedMotion', 'exampleContent', 'failureFallback', 'reviewNote']) {
    if (typeof contract?.[key] !== 'string' || !contract[key].trim()) problems.push(`${folder}: sceneContract is missing a useful "${key}" declaration`);
  }
  if (!['production', 'experimental', 'blocked'].includes(contract?.status)) problems.push(`${folder}: sceneContract.status must be production, experimental, or blocked`);

  const ctx = {
    gsap: { set() {}, to() {}, timeline: () => makeTimeline([], folder) },
    ScrollTrigger: {},
    lenis: null,
    reduced: false,
    mobile: false,
    tier: 'high',
    frameScrub: () => ({ setProgress() {}, destroy() {} }),
    data: {
      deck: { title: 'Deck', lang: 'ko', links: { site: 'https://example.test' } },
      scene: {
        id: 'demo',
        copy: {
          kicker: 'KICKER',
          title: '첫 문장 → 두 번째 → 세 번째',
          lines: ['Scene: 12 첫 줄 | 하나 · 둘', '2 두 번째 줄', '3 세 번째 줄'],
        },
        assets: {
          frames: '/media/demo/f_%03d.jpg',
          count: 120,
          critical: [1, 60, 120],
          poster: '/media/demo/poster.jpg',
          images: ['/media/demo/a.svg', '/media/demo/b.webp', '/media/demo/c.webp'],
          video: '/media/demo/clip.mp4',
        },
        notes: 'note',
      },
    },
  };

  const section = makeNode('section');
  if (folder === 'annotated-chart') {
    ctx.data.scene.assets.series = [2.1, 3.4, 2.8, 6.7];
    ctx.data.scene.assets.xLabels = ['1월', '2월', '3월', '4월'];
    ctx.data.scene.assets.unit = '분';
    ctx.data.scene.assets.annotationIndex = 3;
    ctx.data.scene.source = '예시 데이터 · 템플릿 자체 검사';
    ctx.data.scene.evidence = '합성 테스트 데이터 · 실제 관측 자료 아님';
  }
  const tlProblems = [];
  try {
    await mod.mount(section, ctx);
    const tl = makeTimeline(tlProblems, folder);
    mod.build(tl, ctx);
    if (!tl.records.length) problems.push(`${folder}: build() added nothing to the timeline`);
    const end = tl.records.reduce((max, entry) => Math.max(max, entry.end), 0);
    const start = tl.records.reduce((min, entry) => Math.min(min, entry.at), 0);
    if (end > 1 + TOLERANCE) problems.push(`${folder}: timeline runs to ${end.toFixed(3)} (must be <= 1.0)`);
    if (start < 0) problems.push(`${folder}: timeline starts at ${start}`);
    const enters = tl.records.filter((entry) => entry.kind !== 'call' && entry.at < 0.3);
    const exits = tl.records.filter((entry) => entry.at >= 0.75);
    if (!enters.length) problems.push(`${folder}: nothing happens in the enter window (0 .. 0.30)`);
    if (!exits.length) problems.push(`${folder}: nothing happens in the exit window (0.75 .. 1.00)`);
    mod.unmount();
  } catch (error) {
    problems.push(`${folder}: mount/build threw — ${error.message}`);
  }
  problems.push(...tlProblems);

  // --- css. {{id}} is substituted first so the braces do not confuse the parser.
  const rawCss = readFileSync(cssPath, 'utf8');
  if (!rawCss.includes('{{id}}')) problems.push(`${folder}: scene.css never uses the {{id}} placeholder`);
  const css = rawCss.split('{{id}}').join('01-demo');
  for (const prelude of cssRulePreludes(css)) {
    if (prelude.startsWith('@')) continue;
    for (const selector of prelude.split(',')) {
      if (!selector.trim().startsWith('[data-scene=')) {
        problems.push(`${folder}: selector "${selector.trim()}" is not scoped with [data-scene=`);
      }
    }
  }
  problems.push(...cssColorProblems(css, folder));
  if (!/@media\s*\(\s*max-width:\s*720px/.test(css)) problems.push(`${folder}: scene.css has no <= 720px block`);
  if (!/prefers-reduced-motion/.test(css)) problems.push(`${folder}: scene.css has no reduced-motion block`);

  // --- html
  const html = readFileSync(htmlPath, 'utf8');
  if (/\{\{(?!id\}\})/.test(rawCss + html + source)) problems.push(`${folder}: placeholders other than {{id}} are not supported`);
  if (/<path/.test(html) && !/pathLength="1"/.test(html)) problems.push(`${folder}: animated <path> without pathLength="1"`);

  checked += 1;
}

if (problems.length) {
  console.error(`FAIL — ${problems.length} problem(s) across ${checked} template(s):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`PASS — ${checked} scene templates`);
