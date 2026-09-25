/**
 * Rebuild the three caption-led Scrolline films from current deck visuals and QA frames.
 * Run from the repo root: node videos/build.mjs
 * Requires Playwright and FFmpeg. The generated edit lives entirely under videos/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { audioArgs } from '../tools/demo/music.mjs';

const exec = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VIDEO_DIR = path.join(ROOT, 'videos');
const BUILD_DIR = path.join(VIDEO_DIR, '.build');
const FPS = 24;
const FONT = '"Malgun Gothic", "Noto Sans KR", sans-serif';

function locateBinary(name) {
  const fromEnv = process.env.FFMPEG_PATH;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
  const appLocal = process.env.LOCALAPPDATA;
  if (appLocal) {
    const packageRoot = path.join(appLocal, 'Microsoft', 'WinGet', 'Packages');
    if (fs.existsSync(packageRoot)) {
      const vendor = fs.readdirSync(packageRoot).find((entry) => entry.startsWith('Gyan.FFmpeg.Shared_'));
      if (vendor) {
        const versionDir = fs.readdirSync(path.join(packageRoot, vendor)).find((entry) => entry.startsWith('ffmpeg-'));
        if (versionDir) {
          const binary = path.join(packageRoot, vendor, versionDir, 'bin', `${name}${process.platform === 'win32' ? '.exe' : ''}`);
          if (fs.existsSync(binary)) return binary;
        }
      }
    }
  }
  return `${name}${process.platform === 'win32' ? '.exe' : ''}`;
}

const FFMPEG = locateBinary('ffmpeg');
const FFPROBE = locateBinary('ffprobe');
const rel = (...segments) => path.join(ROOT, ...segments);
const exists = (file) => { if (!fs.existsSync(file)) throw new Error(`Missing video source: ${path.relative(ROOT, file)}`); return file; };
const sceneShot = (deck, scene, progress = 55) => exists(rel('examples', deck, 'qa', `${scene}-${progress}.jpg`));
const sceneImage = (deck, scene, filename) => exists(rel('examples', deck, 'public', 'media', deck, scene, filename));
const shortAsset = (deck, scene, filename) => exists(rel('examples', deck, 'public', 'media', deck, scene, filename));

const films = [
  {
    slug: '01-promo-shorts', title: '발표가 장면이 되다', layout: 'vertical',
    width: 1080, height: 1920, transition: .18, fadeIn: 1, fadeOut: 2.4, zoom: .00014,
    outputTitle: 'Scrolline Deck · 홍보 쇼츠',
    shots: [
      { image: shortAsset('spatial-proposal', '01-hero', 'hero.webp'), kicker: 'SCROLLINE / STORIES', title: '발표가\n장면이 되다', caption: '첫 장면에서 시선을 붙잡고, 스크롤로 이야기를 엽니다.', note: '가상 공간 제안 · AI 시각화' },
      { image: shortAsset('product-launch', '01-hero', 'hero-v2.webp'), kicker: '제품 공개', title: '제품은\n디테일과 움직임으로', caption: '가상의 NIMBUS AIR 헤드폰 콘셉트 렌더링', note: '가상 제품 콘셉트' },
      { image: sceneShot('city-guide', '01-hero'), kicker: '도시 가이드', title: '도시는\n길과 멈춤으로', caption: '한 장의 지도에서 걷는 순서가 보입니다.', note: '가상 여행 사례 · AI 시각화' },
      { image: sceneImage('annual-report', '06-mix', 'image-01.webp'), kicker: '연간 성과', title: '숫자는\n흐름과 맥락으로', caption: '가상 성과 사례를 구조로 읽습니다.', note: '가상 데이터' },
      { image: sceneShot('investor-pitch', '03-market'), kicker: '투자 피치', title: '주장은\n근거를 만날 때', caption: '가상 시장 모델의 전제를 함께 보여 줍니다.', note: '가상 시장 자료' },
      { image: sceneShot('research-lecture', '06-findings'), kicker: '연구 강의', title: '복잡한 내용은\n질문부터', caption: '모의 자료임을 밝히고 해석의 경로를 안내합니다.', note: '모의 연구 사례' },
      { image: sceneShot('client-proposal', '08-options'), kicker: '고객 제안', title: '세 가지 안을\n같은 기준으로', caption: '표준안이 세 점포 파일럿에 맞는 이유까지.', note: '가상 고객 사례' },
      { image: sceneShot('sample-deck', '05-evidence'), kicker: 'SCROLLINE DECK', title: '다음 발표를\n스크롤로 펼쳐보세요', caption: '덱을 열고, 화살표 키나 휠로 장면을 진행하세요.', note: '8개 덱 · 장면 유형 라이브러리' },
    ],
  },
  {
    slug: '02-real-case-cheonggyecheon', title: '청계천 복원 · 사실과 한계', layout: 'case',
    width: 1920, height: 1080, transition: .55, fadeIn: 4, fadeOut: 4, zoom: .000035,
    outputTitle: '청계천 복원 · 사실과 한계',
    shots: [
      { image: rel('videos', 'assets', 'cheonggyecheon-before-ai.jpg'), kicker: '사례 · 청계천 복원', title: '도시의 물길은\n도로 아래에 있었습니다', caption: '복원 전 도시를 설명하는 AI 재구성 이미지입니다.', note: 'AI 재구성 · 기록 사진 아님' },
      { image: null, kicker: '서울시 사업 안내', title: '공사 착수\n2003년 7월', caption: '사업 기간은 2005년 9월까지 2년 3개월. 공식 복원일은 2005년 10월 1일입니다.', metrics: [{ value: '2003.07', label: '공사 착수' }, { value: '2005.09', label: '사업 기간 종료' }, { value: '2005.10.01', label: '공식 복원일' }], note: '서울특별시 공식 사업 안내' },
      { image: rel('videos', 'assets', 'cheonggyecheon-after-ai.jpg'), kicker: '복원 이후 · 개념 시각화', title: '물길 옆에\n걷는 길을 잇다', caption: '이 이미지는 복원 현장의 기록 사진이 아닌 AI 재구성입니다.', note: 'AI 재구성 · 기록 사진 아님' },
      { image: null, kicker: '서울시 사업 안내 · 2005년 기준', title: '복원 구간\n5.84 km', caption: '사업비는 3,867.39억 원으로 안내됐습니다.', metrics: [{ value: '5.84 km', label: '복원 구간' }, { value: '3,867.39억 원', label: '사업비 · 2005년 기준' }], note: '서울특별시 · Cheonggyecheon Restoration Project' },
      { image: null, kicker: '2015 현장 연구 · 김정호·이주승·윤용한', title: '측정 구간 평균기온\n1.1–1.4°C 감소', caption: '연구가 관측한 수치입니다. 서울 전역의 효과를 뜻하지 않습니다.', metrics: [{ value: '1.1–1.4°C', label: '평균 기온 감소' }, { value: '6.6–8.7%', label: '상대습도 증가' }], note: '환경정책연구 14(2), 3–25 · DOI: 10.17330/joep.14.2.201506.3' },
      { image: null, kicker: '해석의 범위', title: '한 장소의 관측을\n도시 전체로 넓히지 않습니다', caption: '연구는 녹피율이 다른 두 유형과 특정 지점의 수리·기상·온열 환경을 분석했습니다. WBGT 변화도 위치와 유형에 따라 달랐습니다.', metrics: [{ value: '0.0%', label: '녹피 유형 I' }, { value: '20.2%', label: '녹피 유형 II' }], note: '결과는 연구의 측정 조건과 지점에 한정해 읽습니다.' },
      { image: null, kicker: '출처', title: '사업 기록과\n측정 연구를 나눠 읽기', caption: '서울특별시 사업 안내와 2015년 현장 연구를 각각 확인하세요.', metrics: [{ value: '서울시 공식 안내', label: '기간 · 구간 · 2005년 사업비' }, { value: 'KCI · DOI', label: '10.17330/joep.14.2.201506.3' }], note: '역사 장면은 AI 재구성 이미지입니다.', source: 'https://english.seoul.go.kr/service/amusement/stream/1-cheonggyecheon/  ·  https://doi.org/10.17330/joep.14.2.201506.3' },
    ],
  },
  {
    slug: '03-education-scene-design', title: '좋은 장면의 설계 순서', layout: 'lesson',
    width: 1920, height: 1080, transition: .32, fadeIn: 3, fadeOut: 4, zoom: .000045, defaultDuration: 7,
    outputTitle: '질문–주장–근거 · 장면 설계',
    shots: [
      { image: sceneShot('sample-deck', '01-hero'), kicker: '장면 설계 수업', title: '효과보다 먼저\n발표의 일을\n정합니다', caption: '질문·주장·시각 근거가 한 방향을 보게 만듭니다.', note: '가상 예시 덱', duration: 8 },
      { image: sceneShot('sample-deck', '02-question', 30), kicker: '01 · 질문을 꺼내기', title: '무엇이\n아직 해결되지 않았나?', caption: '질문이 화면에 들어오는 순간.', note: 'QA 장면 · 진입', duration: 2.6 },
      { image: sceneShot('sample-deck', '02-question', 55), kicker: '01 · 질문을 꺼내기', title: '청중이 가질 질문을\n먼저 드러냅니다', caption: '휠 진행 중간의 실제 QA 캡처.', note: 'QA 장면 · 진행', duration: 2.6 },
      { image: sceneShot('sample-deck', '02-question', 85), kicker: '01 · 질문을 꺼내기', title: '답을 서두르지 않고\n다음 장면을 기다립니다', caption: '질문이 화면에 충분히 머문 뒤 전환합니다.', note: 'QA 장면 · 전환', duration: 2.6 },
      { image: sceneShot('sample-deck', '03-claim'), kicker: '02 · 한 문장 주장', title: '한 화면에\n한 가지 주장만', caption: '발표자가 말할 동안 문장을 읽을 시간을 둡니다.', note: '예시 문안 · 사실 주장 아님' },
      { image: sceneShot('sample-deck', '05-evidence', 30), kicker: '03 · 시각 근거', title: '근거를\n먼저 펼치기 시작합니다', caption: '차트가 들어오는 장면.', note: '교육용 차트 · 가상 데이터', duration: 2.6 },
      { image: sceneShot('sample-deck', '05-evidence', 55), kicker: '03 · 시각 근거', title: '무엇이 달라졌는지\n차트에서 짚습니다', caption: '핵심 구간을 실제 발표 화면에서 확인합니다.', note: '교육용 차트 · 가상 데이터', duration: 2.6 },
      { image: sceneShot('sample-deck', '05-evidence', 85), kicker: '03 · 시각 근거', title: '축과 주석까지\n읽을 시간을 줍니다', caption: '도표를 잠깐 멈춰 세워 근거를 해석합니다.', note: '교육용 차트 · 가상 데이터', duration: 2.6 },
      { image: sceneShot('sample-deck', '05-evidence'), kicker: '읽을 수 있는 정지 구간', title: '움직임은 근거를\n돕는 만큼만', caption: '숫자와 축을 따라갈 동안 화면이 충분히 머뭅니다.', note: '가상 수치 · 교육용 예시' },
      { image: sceneShot('city-guide', '02-route'), kicker: '04 · 관계를 그리기', title: '순서가 중요하면\n경로로 보여줍니다', caption: '지도와 동선은 정확한 정보를 검증하고 표시합니다.', note: '도시 가이드 예시 · 경로 정보 확인 필요' },
      { image: sceneShot('client-proposal', '08-options', 30), kicker: '05 · 선택지를 비교하기', title: '라이트 · 표준 · 확장', caption: '한 안을 먼저 강조합니다.', note: '가상 고객 제안', duration: 2.6 },
      { image: sceneShot('client-proposal', '08-options', 55), kicker: '05 · 선택지를 비교하기', title: '파일럿에 맞는 안을\n같은 기준으로 봅니다', caption: '표준안이 세 점포 파일럿에 알맞은 이유를 강조합니다.', note: '가상 고객 제안', duration: 2.6 },
      { image: sceneShot('client-proposal', '08-options', 85), kicker: '05 · 선택지를 비교하기', title: '마지막에는\n세 안과 추천 근거를 함께', caption: '정지 화면에도 범위와 추천 이유가 모두 남습니다.', note: '가상 고객 제안', duration: 2.6 },
      { image: sceneImage('spatial-proposal', '04-gallery', 'image-01.webp'), kicker: '장면마다 역할을', title: '제품은 디테일로,\n공간은 경험으로', caption: '이미지가 메시지를 전하는 장면에서 원본 시각 자료를 씁니다.', note: '가상 공간 콘셉트 · AI 시각화' },
      { image: sceneShot('sample-deck', '09-checklist'), kicker: '접근성 점검', title: '모션을 줄여도\n정보는 그대로', caption: '정지 상태에서도 같은 질문·주장·근거·결정이 읽혀야 합니다.', note: '정지 화면 설계' },
      { image: sceneShot('sample-deck', '10-close'), kicker: '다시 확인하기', title: '질문 → 주장 → 근거 → 결정', caption: '스크롤 진입·정지 구간·퇴장을 실제 화면과 키보드로 점검합니다.', note: 'SCROLLINE DECK · 장면 설계' },
    ],
  },
];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function renderStill(film, shot, index) {
  const imageData = shot.image ? fs.readFileSync(shot.image).toString('base64') : '';
  const mime = shot.image?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  const uri = imageData ? `data:${mime};base64,${imageData}` : '';
  const total = String(film.shots.length).padStart(2, '0');
  const page = String(index + 1).padStart(2, '0');
  const metrics = (shot.metrics || []).map((metric) => `<div class="metric"><strong>${escapeHtml(metric.value)}</strong><span>${escapeHtml(metric.label)}</span></div>`).join('');
  const image = uri ? `<div class="art"><div class="art-blur" style="background-image:url('${uri}')"></div><img src="${uri}" alt="" /></div>` : '<div class="art art--graphic"><div class="signal" aria-hidden="true"><i></i><i></i><i></i></div></div>';
  const body = `
    <div class="canvas ${film.layout}">
      <div class="backdrop" ${uri ? `style="background-image:url('${uri}')"` : ''}></div><div class="shade"></div>
      <header class="top"><span>SCROLLINE <b>/ ${film.layout === 'case' ? 'CASE' : film.layout === 'vertical' ? 'STORY' : 'LESSON'}</b></span><span>${page} / ${total}</span></header>
      <main class="main">
        <div class="copy"><p class="kicker">${escapeHtml(shot.kicker)}</p><h1>${escapeHtml(shot.title).replace(/\n/g, '<br/>')}</h1><p class="caption">${escapeHtml(shot.caption)}</p>
          ${metrics ? `<div class="metrics">${metrics}</div>` : ''}
          ${shot.note ? `<span class="note">${escapeHtml(shot.note)}</span>` : ''}
        </div>
        ${image}
      </main>
      <footer class="bottom"><p>${escapeHtml(shot.source || '')}</p><div class="progress"><i style="width:${((index + 1) / film.shots.length) * 100}%"></i></div></footer>
    </div>`;
  const css = `
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}body{font-family:${FONT};-webkit-font-smoothing:antialiased}
    .canvas{position:relative;width:${film.width}px;height:${film.height}px;overflow:hidden;color:#f4f4ed;background:#08110f;--accent:#b6ef65;--paper:#101813}
    .backdrop{position:absolute;inset:-4%;background-size:cover;background-position:center;filter:blur(35px) brightness(.25) saturate(.75);transform:scale(1.08)}
    .shade{position:absolute;inset:0;background:linear-gradient(125deg,rgba(4,10,10,.77),rgba(4,10,10,.34) 55%,rgba(4,10,10,.8))}
    .top{position:absolute;z-index:3;top:44px;left:64px;right:64px;display:flex;justify-content:space-between;color:rgba(246,246,236,.78);font:500 18px/1.4 'Consolas',monospace;letter-spacing:.12em}.top b{color:var(--accent);font-weight:500}
    .main{position:absolute;z-index:2;inset:118px 64px 96px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.12fr);gap:46px;align-items:center}
    .copy{min-width:0}.kicker{color:var(--accent);font:600 19px/1.35 'Consolas',monospace;letter-spacing:.12em;margin:0 0 22px;text-transform:uppercase}.copy h1{margin:0;font-size:clamp(58px,5vw,100px);font-weight:760;line-height:1.06;letter-spacing:-.065em;text-wrap:balance}.caption{margin:28px 0 0;max-width:32ch;color:rgba(244,244,237,.83);font-size:clamp(24px,2vw,35px);line-height:1.48;letter-spacing:-.025em}.note{display:inline-block;margin-top:24px;padding:8px 12px;border:1px solid rgba(246,246,236,.37);color:#fff;font:500 14px/1.4 'Consolas',monospace;letter-spacing:.06em}
    .art{position:relative;min-width:0;height:min(68vh,730px);display:grid;place-items:center;overflow:hidden;border:1px solid rgba(246,246,236,.55);background:rgba(5,10,12,.55);box-shadow:0 30px 80px rgba(0,0,0,.32)}.art>img{position:relative;z-index:1;display:block;width:100%;height:100%;object-fit:contain}.art-blur{position:absolute;inset:0;background-size:cover;background-position:center;filter:blur(24px) brightness(.45);transform:scale(1.15)}
    .art--graphic{background:radial-gradient(circle at 70% 45%,rgba(182,239,101,.15),transparent 40%),linear-gradient(135deg,#15261f,#0a1313)}.signal{width:70%;display:flex;align-items:center;gap:10px}.signal i{height:3px;flex:1;background:linear-gradient(90deg,var(--accent),rgba(182,239,101,.08));position:relative}.signal i:after{content:'';position:absolute;right:0;top:-7px;width:14px;height:14px;border-radius:50%;background:var(--accent);box-shadow:0 0 25px var(--accent)}
    .metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-top:26px}.metric{padding:16px 18px;border-top:1px solid rgba(246,246,236,.38);background:rgba(5,11,10,.35)}.metric strong{display:block;color:var(--accent);font:600 30px/1.15 'Consolas',monospace;letter-spacing:-.04em}.metric span{display:block;margin-top:8px;color:rgba(246,246,236,.72);font-size:15px;line-height:1.4}
    .bottom{position:absolute;z-index:3;left:64px;right:64px;bottom:26px}.bottom p{margin:0 0 12px;color:rgba(246,246,236,.64);font:14px/1.35 'Consolas',monospace;letter-spacing:.035em;overflow-wrap:anywhere}.progress{height:3px;background:rgba(246,246,236,.25)}.progress i{display:block;height:100%;background:var(--accent)}
    .vertical{background:#07101a;--accent:#c5f56a}.vertical .backdrop{filter:blur(48px) brightness(.29) saturate(.82)}.vertical .top{top:52px;left:52px;right:52px;font-size:17px}.vertical .main{inset:156px 54px 126px;display:flex;flex-direction:column;justify-content:space-between;align-items:stretch;gap:26px}.vertical .copy{flex:0 0 auto}.vertical .kicker{font-size:18px;margin-bottom:22px}.vertical .copy h1{font-size:86px;line-height:1.02;max-width:11ch}.vertical .caption{font-size:29px;line-height:1.48;max-width:30ch;margin-top:22px}.vertical .note{font-size:14px;margin-top:18px}.vertical .art{width:100%;height:720px;flex:0 0 720px}.vertical .metrics{grid-template-columns:1fr 1fr}.vertical .metric strong{font-size:30px}.vertical .bottom{left:52px;right:52px;bottom:32px}
    .case{background:#101b1b;--accent:#f0b77d}.case .main{grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:70px;inset:132px 92px 98px}.case .copy h1{font-size:clamp(62px,5vw,96px)}.case .caption{font-size:29px;max-width:28ch}.case .art{height:690px}.case .art--graphic{border-color:rgba(240,183,125,.44)}.case .metrics{grid-template-columns:1fr}.case .metric{padding:13px 16px}.case .metric strong{font-size:32px}
    .lesson{background:#08110e;--accent:#b8f06a}.lesson .main{grid-template-columns:minmax(0,1.18fr) minmax(0,.82fr);gap:52px;inset:128px 84px 98px}.lesson .copy{order:2}.lesson .art{order:1;height:680px}.lesson .copy h1{font-size:clamp(54px,4.4vw,82px)}.lesson .caption{font-size:26px;max-width:31ch}.lesson .note{font-size:13px}
  `;
  return `<!doctype html><html lang="ko"><meta charset="utf-8"><style>${css}</style><body>${body}</body></html>`;
}

function timecode(seconds) {
  const ms = Math.round(seconds * 1000);
  const h = Math.floor(ms / 3_600_000), m = Math.floor(ms / 60_000) % 60, s = Math.floor(ms / 1000) % 60, x = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(x).padStart(3, '0')}`;
}

async function renderFrames(film, browser) {
  const page = await browser.newPage({ viewport: { width: film.width, height: film.height }, deviceScaleFactor: 1 });
  const frames = [];
  for (let index = 0; index < film.shots.length; index += 1) {
    const shot = film.shots[index];
    const file = path.join(BUILD_DIR, `${film.slug}-${String(index + 1).padStart(2, '0')}.jpg`);
    await page.setContent(renderStill(film, shot, index), { waitUntil: 'load' });
    await page.screenshot({ path: file, type: 'jpeg', quality: 94, animations: 'disabled' });
    frames.push({ ...shot, file, duration: shot.duration || film.defaultDuration || (film.layout === 'vertical' ? 2.6 : film.layout === 'case' ? 9 : 9), caption: shot.captionText || shot.caption });
  }
  await page.close();
  return frames;
}

function subtitleContents(shots, transition) {
  let segmentStart = 0;
  const cues = [];
  for (let index = 0; index < shots.length; index += 1) {
    const shot = shots[index];
    const start = Math.max(0, segmentStart + (index ? transition / 2 : 0));
    const end = Math.max(start + .5, segmentStart + shot.duration - (index < shots.length - 1 ? transition / 2 : 0));
    cues.push(`${cues.length + 1}\n${timecode(start)} --> ${timecode(end)}\n${shot.caption}\n`);
    segmentStart += shot.duration - (index < shots.length - 1 ? transition : 0);
  }
  return cues.join('\n');
}

async function encodeFilm(film, shots) {
  const duration = shots.reduce((sum, shot) => sum + shot.duration, 0) - (shots.length - 1) * film.transition;
  const music = audioArgs({ duration, fadeIn: film.fadeIn, fadeOut: film.fadeOut });
  const args = ['-hide_banner', '-loglevel', 'error', '-y'];
  for (const shot of shots) args.push('-loop', '1', '-framerate', String(FPS), '-t', String(shot.duration), '-i', shot.file);
  const audioIndex = shots.length;
  args.push(...music.input);

  const graph = [];
  shots.forEach((shot, index) => {
    const width = film.width, height = film.height;
    graph.push(`[${index}:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},zoompan=z='min(zoom+${film.zoom},1.045)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${width}x${height}:fps=${FPS},trim=duration=${shot.duration},setpts=PTS-STARTPTS,fps=${FPS},settb=AVTB,format=yuv420p[v${index}]`);
  });
  let current = 'v0';
  let timeline = shots[0].duration;
  for (let index = 1; index < shots.length; index += 1) {
    const next = `xf${index}`;
    const offset = Math.max(0, timeline - film.transition).toFixed(3);
    graph.push(`[${current}][v${index}]xfade=transition=fade:duration=${film.transition}:offset=${offset}[${next}]`);
    current = next;
    timeline += shots[index].duration - film.transition;
  }
  graph.push(`[${audioIndex}:a]${music.filter}[aout]`);
  const output = path.join(VIDEO_DIR, `${film.slug}.mp4`);
  args.push('-filter_complex', graph.join(';'), '-map', `[${current}]`, '-map', '[aout]',
    '-t', duration.toFixed(3), '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-r', String(FPS),
    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart',
    '-metadata', `title=${film.outputTitle}`, output);
  await exec(FFMPEG, args, { maxBuffer: 1 << 24 });
  await exec(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '1.0', '-i', output, '-frames:v', '1', '-q:v', '2', path.join(VIDEO_DIR, `${film.slug}.jpg`)]);

  const srt = subtitleContents(shots, film.transition);
  fs.writeFileSync(path.join(VIDEO_DIR, `${film.slug}.srt`), `${srt.trim()}\n`, 'utf8');
  const vtt = srt.replace(/^\d+\s*\r?\n/gm, '').replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  fs.writeFileSync(path.join(VIDEO_DIR, `${film.slug}.vtt`), `WEBVTT\n\n${vtt.trim()}\n`, 'utf8');

  const { stdout } = await exec(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,r_frame_rate', '-of', 'json', output]);
  const metadata = JSON.parse(stdout);
  console.log(`${film.slug}: ${(Number(metadata.format.duration)).toFixed(1)} sec · ${film.width}×${film.height} · ${shots.length} beats`);
  return { slug: film.slug, seconds: Number(metadata.format.duration), dimensions: `${film.width}x${film.height}`, beats: shots.length };
}

async function main() {
  const requestedSlug = process.env.SCROLLINE_FILM;
  const selectedFilms = requestedSlug ? films.filter((film) => film.slug === requestedSlug) : films;
  if (!selectedFilms.length) throw new Error(`Unknown video slug: ${requestedSlug}`);
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  fs.mkdirSync(BUILD_DIR, { recursive: true });
  await exec(FFMPEG, ['-version']);
  await exec(FFPROBE, ['-version']);
  const browser = await chromium.launch({ headless: true });
  try {
    const results = [];
    for (const film of selectedFilms) {
      const shots = await renderFrames(film, browser);
      results.push(await encodeFilm(film, shots));
    }
    const reportPath = path.join(VIDEO_DIR, 'build-report.json');
    const previous = requestedSlug && fs.existsSync(reportPath)
      ? JSON.parse(fs.readFileSync(reportPath, 'utf8'))
      : null;
    const reportedResults = previous
      ? previous.results.map((item) => results.find((result) => result.slug === item.slug) || item)
      : results;
    fs.writeFileSync(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), results: reportedResults }, null, 2)}\n`);
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  }
}

await main();
