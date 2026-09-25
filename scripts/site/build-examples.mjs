/**
 * build-examples — build every deck under examples/ and assemble a static site:
 *   site/index.html            gallery of decks (55% captures)
 *   site/<deck>/               the built deck (vite base './' so it runs under any path)
 * Used by .github/workflows/pages.yml; runs locally too: node scripts/site/build-examples.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EX = path.join(ROOT, 'examples');
const SITE = path.join(ROOT, 'site');
const VIDEOS = [
  ['01-promo-shorts', '홍보 쇼츠', '여덟 개 덱을 45초 세로 영상으로 압축했습니다.'],
  ['02-real-case-cheonggyecheon', '실제 사례 스토리', '청계천 복원의 연혁과 도시 열섬 연구를 55초에 담았습니다.'],
  ['03-education-scene-design', '장면 설계 교육', '질문·주장·시각 근거의 순서를 84초에 설명합니다.'],
];
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const useInstalledDependencies = process.env.SCROLLINE_USE_INSTALLED_DEPS === '1';

fs.rmSync(SITE, { recursive: true, force: true });
fs.mkdirSync(SITE, { recursive: true });
fs.mkdirSync(path.join(SITE, 'videos'), { recursive: true });
for (const [slug] of VIDEOS) {
  for (const ext of ['mp4', 'jpg', 'srt']) {
    const src = path.join(ROOT, 'videos', `${slug}.${ext}`);
    if (!fs.existsSync(src)) throw new Error(`Missing published video ${src}`);
    fs.copyFileSync(src, path.join(SITE, 'videos', `${slug}.${ext}`));
  }
}

const decks = fs.readdirSync(EX).filter((d) => fs.existsSync(path.join(EX, d, 'data/deck.json'))).sort();
const cards = [];
for (const name of decks) {
  const dir = path.join(EX, name);
  const deck = JSON.parse(fs.readFileSync(path.join(dir, 'data/deck.json'), 'utf8'));
  const reportPath = path.join(dir, 'qa', 'report.json');
  if (!fs.existsSync(reportPath)) throw new Error(`${name}: qa/report.json is missing; run strict verify first`);
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  if (!report.ok || report.gates.some((gate) => gate.skipped)) {
    throw new Error(`${name}: strict browser verification is required before publication`);
  }
  const steps = useInstalledDependencies
    ? [[process.execPath, [path.join(dir, 'node_modules', 'vite', 'bin', 'vite.js'), 'build']]]
    : [[npm, ['ci', '--no-audit', '--no-fund']], [npm, ['run', 'build']]];
  for (const [command, args] of steps) {
    const r = spawnSync(command, args, { cwd: dir, stdio: 'inherit' });
    if (r.status !== 0) { console.error(`${name}: ${command} ${args.join(' ')} failed`); process.exit(1); }
  }
  fs.cpSync(path.join(dir, 'dist'), path.join(SITE, name), { recursive: true });
  const qa = path.join(dir, 'qa');
  const shots = fs.existsSync(qa) ? fs.readdirSync(qa).filter((f) => /-55\.jpg$/.test(f)).sort() : [];
  if (shots.length !== deck.scenes.length) throw new Error(`${name}: expected ${deck.scenes.length} hold captures, found ${shots.length}`);
  fs.mkdirSync(path.join(SITE, '_qa', name), { recursive: true });
  for (const f of shots.slice(0, 4)) fs.copyFileSync(path.join(qa, f), path.join(SITE, '_qa', name, f));
  const scenes = (deck.scenes || []).sort((a, b) => a.order - b.order);
  const pin = scenes.reduce((s, x) => s + (x.pin === false ? 0 : x.pinVh || 0), 0);
  cards.push({ name, title: deck.title, subtitle: deck.subtitle || '', style: deck.theme?.style || 'dark', accent: deck.theme?.accent || '#a8ff60', scenes, pin, shots });
  console.log(`built ${name}: ${scenes.length} scenes, ${pin}vh`);
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Scrolline Deck — examples</title>
<meta name="description" content="Scroll-driven cinematic HTML presentations. Open a deck and scroll." />
<style>
  :root { --canvas:#080b0e; --ink:#f4f5f6; --muted:#aeb6bb; --subtle:#829098; --hair:#273139; --accent:#a8ff60; }
  * { box-sizing:border-box } html,body { margin:0; background:var(--canvas); color:var(--ink); font-family:"Inter Tight","Noto Sans KR",system-ui,sans-serif; }
  body { background:radial-gradient(circle at 78% 4%,#17392d 0,transparent 26%),var(--canvas); }
  main { width:min(1380px, calc(100vw - 48px)); margin:0 auto; padding:6vh 0 12vh; }
  header { min-height:58vh; display:flex; flex-direction:column; justify-content:center; position:relative; }
  header:after { content:""; position:absolute; right:3%; top:15%; width:min(28vw,360px); aspect-ratio:1; border:1px solid #406650; border-radius:50%; box-shadow:0 0 0 34px #a8ff6010,0 0 0 68px #a8ff6008; pointer-events:none; }
  .eyebrow { font:500 12px/1 ui-monospace,Menlo,monospace; letter-spacing:.18em; text-transform:uppercase; color:var(--subtle); margin:0 0 20px; }
  h1 { font-size:clamp(50px,9vw,144px); line-height:.88; letter-spacing:-.06em; font-weight:800; margin:0 0 34px; position:relative; z-index:1; }
  .lead { color:var(--muted); font-size:clamp(17px,1.6vw,22px); line-height:1.55; max-width:58ch; margin:0 0 6vh; position:relative; z-index:1; }
  .lead a { color:var(--ink) }
  .deck { display:grid; grid-template-columns: 1fr; gap:30px; padding:8vh 0; border-top:1px solid var(--hair); --deck-accent:var(--accent); }
  @media (min-width:900px){ .deck { grid-template-columns: 4fr 8fr; gap:5vw; align-items:start } }
  .deck h2 { font-size:clamp(28px,3.4vw,48px); letter-spacing:-.02em; line-height:1.05; margin:0 0 10px; }
  .deck h2 a { color:inherit; text-decoration:none; } .deck h2 a:hover { color:var(--deck-accent) }
  .deck p { color:var(--muted); margin:0 0 18px; line-height:1.55 }
  .meta { font:500 12px/1.6 ui-monospace,Menlo,monospace; letter-spacing:.06em; color:var(--subtle); margin:0 0 20px }
  .open { display:inline-block; font-weight:700; color:var(--ink); border-bottom:2px solid var(--deck-accent); text-decoration:none; padding-bottom:4px }
  .strip { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
  .strip a { display:block; aspect-ratio:16/10; overflow:hidden; background:#111; position:relative } .strip a:first-child { grid-column:1/-1; aspect-ratio:16/8; }
  .strip img { width:100%; height:100%; object-fit:cover; display:block; filter:saturate(1.05); transition:transform .5s ease; } .strip a:hover img { transform:scale(1.04); }
  .videos { padding:8vh 0; border-top:1px solid var(--hair) } .videos h2 { font-size:clamp(36px,5vw,68px); margin:0 0 12px; line-height:1.05 }
  .video-grid { display:grid; gap:24px; grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr)); margin-top:38px }
  .video-card { padding:16px; border:1px solid var(--hair); background:#10171a }
  .video-card video { display:block; width:100%; max-height:420px; background:#080b0e; aspect-ratio:16/10; object-fit:contain }
  .video-card:first-child video { aspect-ratio:9/12 } .video-card h3 { font-size:22px; margin:16px 0 8px }
  .video-card p { color:var(--muted); line-height:1.5; margin:0 0 10px } .video-card a { color:var(--accent) }
  ol { margin:0; padding-left:1.2em; color:var(--muted); font-size:14px; line-height:1.7 } ol code { color:var(--ink); font-size:12px }
  footer { color:var(--subtle); font-size:13px; margin-top:8vh; line-height:1.7 }
</style>
</head>
<body>
<main>
  <header><p class="eyebrow">Scrolline Deck · 8 complete presentations</p>
  <h1>발표가<br/>장면이 되다.</h1>
  <p class="lead">피치와 강의를 위해 만든 여덟 개의 스크롤 웹덱. 덱을 열고 휠을 굴리거나 <b>→</b> 키로 장면을 진행하세요. 각 덱은 고유한 시각 방향과 발표자 노트를 갖추고 있습니다.</p></header>
${cards.map((c) => `
  <section class="deck" style="--deck-accent:${esc(c.accent)}">
    <div>
      <h2><a href="./${c.name}/">${esc(c.title)}</a></h2>
      ${c.subtitle ? `<p>${esc(c.subtitle)}</p>` : ''}
      <p class="meta">${c.scenes.length} scenes · ${c.style} · 가상 사례는 덱 안에 표시</p>
      <ol>${c.scenes.map((s) => `<li>${esc(s.copy?.title || s.id)} <code>${s.technique}</code></li>`).join('')}</ol>
      <p style="margin-top:20px"><a class="open" href="./${c.name}/">Open the deck →</a></p>
    </div>
    <div class="strip">${c.shots.slice(0,4).map((f) => `<a href="./${c.name}/"><img loading="lazy" src="./_qa/${c.name}/${f}" alt="${esc(c.title)} — ${f.replace('-55.jpg','')} 완성 화면" /></a>`).join('')}</div>
  </section>`).join('')}
  <section class="videos" id="videos"><p class="eyebrow">Deck to video · three storytelling methods</p><h2>발표 장면을 영상으로</h2>
    <p class="lead">홍보용 몽타주, 출처를 밝힌 실제 사례, 장면 설계 강의. 세 영상 모두 한국어 음성과 화면 자막을 포함합니다.</p>
    <div class="video-grid">
    ${VIDEOS.map(([slug, title, description]) => `<article class="video-card"><video controls preload="none" poster="./videos/${slug}.jpg" src="./videos/${slug}.mp4" aria-label="${esc(title)}"></video><h3>${esc(title)}</h3><p>${esc(description)}</p><a href="./videos/${slug}.srt" download>자막 다운로드</a></article>`).join('')}
    </div><p style="color:var(--muted);margin-top:22px">실제 사례 영상의 역사 장면은 AI 재구성입니다. 기간·구간은 <a href="https://english.seoul.go.kr/service/amusement/stream/1-cheonggyecheon/" style="color:var(--accent)">서울시</a>, 냉각에 관한 설명은 <a href="https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART002009246" style="color:var(--accent)">김경태·송재민(2015)</a>을 따릅니다.</p>
  </section>
  <footer>Keys: → / Space next · ← previous · 1–9 jump · P autoplay · F fullscreen · N notes.<br/>MIT · gongnyang · <a href="https://github.com/gongnyang/awesome-html-scrolline-deck" style="color:var(--muted)">github.com/gongnyang/awesome-html-scrolline-deck</a></footer>
</main>
</body>
</html>
`;
fs.writeFileSync(path.join(SITE, 'index.html'), html);
fs.writeFileSync(path.join(SITE, '.nojekyll'), '');
console.log(`site/ ready: ${decks.length} deck(s)`);
