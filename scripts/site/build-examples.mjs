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
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

fs.rmSync(SITE, { recursive: true, force: true });
fs.mkdirSync(SITE, { recursive: true });

const decks = fs.readdirSync(EX).filter((d) => fs.existsSync(path.join(EX, d, 'data/deck.json'))).sort();
const cards = [];
for (const name of decks) {
  const dir = path.join(EX, name);
  const deck = JSON.parse(fs.readFileSync(path.join(dir, 'data/deck.json'), 'utf8'));
  for (const args of [['ci', '--no-audit', '--no-fund'], ['run', 'build']]) {
    const r = spawnSync(npm, args, { cwd: dir, stdio: 'inherit' });
    if (r.status !== 0) { console.error(`${name}: npm ${args[0]} failed`); process.exit(1); }
  }
  fs.cpSync(path.join(dir, 'dist'), path.join(SITE, name), { recursive: true });
  const qa = path.join(dir, 'qa');
  const shots = fs.existsSync(qa) ? fs.readdirSync(qa).filter((f) => /-55\.jpg$/.test(f)).sort() : [];
  fs.mkdirSync(path.join(SITE, '_qa', name), { recursive: true });
  for (const f of shots) fs.copyFileSync(path.join(qa, f), path.join(SITE, '_qa', name, f));
  const scenes = (deck.scenes || []).sort((a, b) => a.order - b.order);
  const pin = scenes.reduce((s, x) => s + (x.pin === false ? 0 : x.pinVh || 0), 0);
  cards.push({ name, title: deck.title, subtitle: deck.subtitle || '', style: deck.theme?.style || 'dark', scenes, pin, shots });
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
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;700;800&family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet" />
<style>
  :root { --canvas:#08090a; --ink:#f4f5f6; --muted:#9a9ea6; --subtle:#5c6069; --hair:#1c1e22; --accent:#5e6ad2; }
  * { box-sizing:border-box } html,body { margin:0; background:var(--canvas); color:var(--ink); font-family:"Inter Tight","Noto Sans KR",system-ui,sans-serif; }
  main { width:min(1200px, calc(100vw - 48px)); margin:0 auto; padding:9vh 0 12vh; }
  .eyebrow { font:500 12px/1 ui-monospace,Menlo,monospace; letter-spacing:.18em; text-transform:uppercase; color:var(--subtle); margin:0 0 20px; }
  h1 { font-size:clamp(40px,7vw,96px); line-height:.98; letter-spacing:-.03em; font-weight:800; margin:0 0 20px; }
  .lead { color:var(--muted); font-size:clamp(17px,1.6vw,22px); line-height:1.5; max-width:56ch; margin:0 0 9vh; }
  .lead a { color:var(--ink) }
  .deck { display:grid; grid-template-columns: 1fr; gap:24px; padding:6vh 0; border-top:1px solid var(--hair); }
  @media (min-width:900px){ .deck { grid-template-columns: 5fr 7fr; gap:48px; align-items:start } }
  .deck h2 { font-size:clamp(28px,3.4vw,48px); letter-spacing:-.02em; line-height:1.05; margin:0 0 10px; }
  .deck h2 a { color:inherit; text-decoration:none; } .deck h2 a:hover { color:var(--accent) }
  .deck p { color:var(--muted); margin:0 0 18px; line-height:1.55 }
  .meta { font:500 12px/1.6 ui-monospace,Menlo,monospace; letter-spacing:.06em; color:var(--subtle); margin:0 0 20px }
  .open { display:inline-block; font-weight:700; color:var(--ink); border-bottom:2px solid var(--accent); text-decoration:none; padding-bottom:2px }
  .strip { display:grid; grid-template-columns: repeat(auto-fill, minmax(180px,1fr)); gap:10px; }
  .strip a { display:block; aspect-ratio:16/10; overflow:hidden; background:#111 } .strip img { width:100%; height:100%; object-fit:cover; display:block; filter:saturate(1.05) }
  ol { margin:0; padding-left:1.2em; color:var(--muted); font-size:14px; line-height:1.7 } ol code { color:var(--ink); font-size:12px }
  footer { color:var(--subtle); font-size:13px; margin-top:8vh; line-height:1.7 }
</style>
</head>
<body>
<main>
  <p class="eyebrow">Scrolline Deck · examples</p>
  <h1>Scroll it,<br/>don't click it.</h1>
  <p class="lead">스크롤 구동 시네마 HTML 발표자료. 덱을 열고 휠을 굴리거나 <b>→</b> 키를 누르세요. 모든 덱은 <a href="https://github.com/gongnyang/awesome-html-scrolline-deck">scrolline-deck</a> 스킬로 생성·검증됐고, 이미지는 전부 스크립트로 만든 벡터 인포그래픽입니다.</p>
${cards.map((c) => `
  <section class="deck">
    <div>
      <h2><a href="./${c.name}/">${esc(c.title)}</a></h2>
      ${c.subtitle ? `<p>${esc(c.subtitle)}</p>` : ''}
      <p class="meta">${c.scenes.length} scenes · ${c.pin}vh pin · ${c.style}</p>
      <ol>${c.scenes.map((s) => `<li>${esc(s.copy?.title || s.id)} <code>${s.technique}</code></li>`).join('')}</ol>
      <p style="margin-top:20px"><a class="open" href="./${c.name}/">Open the deck →</a></p>
    </div>
    <div class="strip">${c.shots.map((f) => `<a href="./${c.name}/"><img loading="lazy" src="./_qa/${c.name}/${f}" alt="${esc(c.title)} — ${f.replace('-55.jpg','')} at 55%" /></a>`).join('')}</div>
  </section>`).join('')}
  <footer>Keys: → / Space next · ← previous · 1–9 jump · P autoplay · F fullscreen · N notes.<br/>MIT · gongnyang · <a href="https://github.com/gongnyang/awesome-html-scrolline-deck" style="color:var(--muted)">github.com/gongnyang/awesome-html-scrolline-deck</a></footer>
</main>
</body>
</html>
`;
fs.writeFileSync(path.join(SITE, 'index.html'), html);
fs.writeFileSync(path.join(SITE, '.nojekyll'), '');
console.log(`site/ ready: ${decks.length} deck(s)`);
