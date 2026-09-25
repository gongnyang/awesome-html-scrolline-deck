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
import { renderGallery } from './render-gallery.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EX = path.join(ROOT, 'examples');
const SITE = path.join(ROOT, 'site');
const TEMPLATE_ROOT = path.join(ROOT, 'templates', 'scenes');
const VIDEOS = [
  ['01-promo-shorts', '홍보 쇼츠', '8개 덱의 서로 다른 장면을 19.5초 세로 영상으로 소개합니다.'],
  ['02-real-case-cheonggyecheon', '실제 사례 스토리', '청계천 복원 연혁과 제한된 현장 측정 결과를 59.7초로 다룹니다. 일부 역사 장면은 AI 재구성입니다.'],
  ['03-education-scene-design', '장면 설계 교육', '질문·주장·시각 근거의 순서를 68.6초에 설명합니다.'],
];
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const useInstalledDependencies = process.env.SCROLLINE_USE_INSTALLED_DEPS === '1';

fs.rmSync(SITE, { recursive: true, force: true });
fs.mkdirSync(SITE, { recursive: true });
fs.mkdirSync(path.join(SITE, 'videos'), { recursive: true });
for (const [slug] of VIDEOS) {
  for (const ext of ['mp4', 'jpg', 'srt', 'vtt']) {
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
  if (!Array.isArray(deck.scenes) || deck.scenes.length < 8 || deck.scenes.length > 12) {
    throw new Error(`${name}: expected 8–12 distinct scenes, found ${deck.scenes?.length ?? 0}`);
  }
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
  const heroScene = scenes.find((scene) => scene.id === '01-hero');
  const heroAsset = Object.values(heroScene?.assets || {}).flatMap((value) =>
    typeof value === 'string' ? [value] : Array.isArray(value) ? value : []).find((value) =>
    typeof value === 'string' && value.startsWith('/media/'));
  cards.push({ name, title: deck.title, subtitle: deck.subtitle || '', style: deck.theme?.style || 'dark', accent: deck.theme?.accent || '#a8ff60', scenes, pin, shots, heroAsset });
  console.log(`built ${name}: ${scenes.length} scenes, ${pin}vh`);
}
// A template is publishable when its runnable files, teaching metadata, and
// representative preview are all present. The registry grows without a fixed count.
const REQUIRED_FILES = ['scene.html', 'scene.css', 'scene.js', 'preview.webp'];
const REQUIRED_TEXT = ['description_ko', 'purpose', 'notesHint', 'responsive', 'reducedMotion'];
const TAG_FAMILIES = [
  ['start-flow', new Set(['opening', 'agenda', 'sequence', 'transition', 'chapter', 'closing', 'promise'])],
  ['evidence', new Set(['chart', 'evidence', 'comparison', 'numbers', 'document', 'proof', 'annotation'])],
  ['explanation', new Set(['explain', 'breakdown', 'process', 'system', 'relationships', 'map', 'route', 'timeline', 'roadmap', 'structure', 'workflow', 'gallery', 'showcase', 'gather', 'breath'])],
  ['product-people', new Set(['decision', 'person', 'portrait', 'media', 'video', 'typography', 'images', 'full-bleed'])],
];
const FAMILY_LABELS = {
  'start-flow': '시작과 흐름', evidence: '근거와 비교', explanation: '설명과 교육', 'product-people': '제품과 결정',
};
const classify = (tags = []) => {
  for (const [family, keywords] of TAG_FAMILIES) if (tags.some((tag) => keywords.has(tag))) return family;
  return 'explanation';
};
const templateNames = fs.readdirSync(TEMPLATE_ROOT).filter((name) =>
  fs.existsSync(path.join(TEMPLATE_ROOT, name, 'template.json'))).sort();
const templateCards = [];
fs.mkdirSync(path.join(SITE, '_templates'), { recursive: true });
for (const name of templateNames) {
  const dir = path.join(TEMPLATE_ROOT, name);
  const template = JSON.parse(fs.readFileSync(path.join(dir, 'template.json'), 'utf8'));
  if (template.sceneContract?.status !== 'production') {
    console.warn(`excluded unreviewed template ${name}`);
    continue;
  }
  const missingFiles = REQUIRED_FILES.filter((file) => !fs.existsSync(path.join(dir, file)));
  const missingFields = REQUIRED_TEXT.filter((field) => !String(template[field] || '').trim());
  if (missingFiles.length || missingFields.length || !template.exampleCopy?.title || !Array.isArray(template.tags) || !template.tags.length) {
    console.warn(`excluded incomplete production template ${name}: ${[...missingFiles, ...missingFields].join(', ') || 'exampleCopy.title or tags missing'}`);
    continue;
  }
  const previewName = `${name}.webp`;
  fs.copyFileSync(path.join(dir, 'preview.webp'), path.join(SITE, '_templates', previewName));
  const source = String(template.previewSource || '');
  const match = source.match(/^examples\/([^/]+)\//);
  const deckName = match?.[1] && cards.some((card) => card.name === match[1]) ? match[1] : cards[0]?.name;
  const deckCard = cards.find((card) => card.name === deckName);
  const title = template.exampleCopy.title;
  templateCards.push({
    ...template, name, family: classify(template.tags), familyLabel: FAMILY_LABELS[classify(template.tags)],
    searchText: [name, title, template.purpose, template.description_ko, ...template.tags].join(' '),
    previewHref: deckName ? `./${deckName}/` : '#decks',
    alt: `${title} 장면 템플릿 미리보기`,
  });
}
if (templateCards.length < 24) throw new Error(`At least 24 reviewed scene templates are required; found ${templateCards.length}.`);
const familyCounts = Object.fromEntries(Object.keys(FAMILY_LABELS).map((family) =>
  [family, templateCards.filter((template) => template.family === family).length]));

// Use each deck's own hero art for a strong editorial cover; QA captures provide the strip.
for (const card of cards) {
  const hero = card.heroAsset ? path.join(EX, card.name, 'public', card.heroAsset.replace(/^\/+/, '')) : null;
  const heroExt = hero ? path.extname(hero) || '.webp' : '.webp';
  const copiedHero = path.join(SITE, '_qa', card.name, `cover${heroExt}`);
  if (hero && fs.existsSync(hero)) fs.copyFileSync(hero, copiedHero);
  card.cover = hero && fs.existsSync(hero) ? `./_qa/${card.name}/cover${heroExt}` : `./_qa/${card.name}/${card.shots[0]}`;
  card.coverAlt = `${card.title}의 시네마틱 오프닝 이미지`;
  card.coverCaption = card.subtitle || '한국어 스크롤 프레젠테이션';
}
const mediaDir = path.join(SITE, 'media');
fs.mkdirSync(mediaDir, { recursive: true });
fs.copyFileSync(path.join(ROOT, 'scripts', 'site', 'media', 'gallery-hero.webp'), path.join(mediaDir, 'gallery-hero.webp'));
fs.mkdirSync(path.join(SITE, 'assets'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'scripts', 'site', 'gallery.css'), path.join(SITE, 'assets', 'gallery.css'));
for (const [slug] of VIDEOS) {
  const srtPath = path.join(SITE, 'videos', `${slug}.srt`);
  const vtt = fs.readFileSync(srtPath, 'utf8').replace(/^\uFEFF/, '').replace(/^\d+\s*\r?\n/gm, '')
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2 --> $3.$4');
  fs.writeFileSync(path.join(SITE, 'videos', `${slug}.vtt`), `WEBVTT\n\n${vtt.trim()}\n`);
}
const families = Object.entries(FAMILY_LABELS).map(([id, label]) => ({ id, label, count: familyCounts[id] }));
const html = renderGallery({ decks: cards, templates: templateCards, videos: VIDEOS, families, sceneTypeCount: templateCards.length });
fs.writeFileSync(path.join(SITE, 'index.html'), html);
console.log(`gallery: ${cards.length} decks, ${templateCards.length} production scene types`);
