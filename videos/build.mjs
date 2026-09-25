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
const QA_DIR = path.join(VIDEO_DIR, '.qa-inspect');
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

function assertSafeBuildDir() {
  const videoRoot = fs.realpathSync(VIDEO_DIR);
  const expected = path.join(videoRoot, '.build');
  if (path.resolve(BUILD_DIR) !== expected || (fs.existsSync(BUILD_DIR) && fs.realpathSync(BUILD_DIR) !== expected)) {
    throw new Error(`Unsafe temporary build path: ${BUILD_DIR}`);
  }
}

const FFMPEG = locateBinary('ffmpeg');
const FFPROBE = locateBinary('ffprobe');
const rel = (...segments) => path.join(ROOT, ...segments);
const exists = (file) => { if (!fs.existsSync(file)) throw new Error(`Missing video source: ${path.relative(ROOT, file)}`); return file; };
const sceneShot = (deck, scene, progress = 55) => {
  const qaDir = rel('examples', deck, 'qa');
  const candidates = [
    path.join(qaDir, `${scene}-${progress}-1920.jpg`),
    path.join(qaDir, `final-${scene}-1440-${progress}.png`),
    path.join(qaDir, `${scene}-${progress}.jpg`),
  ].filter((candidate) => fs.existsSync(candidate));
  candidates.sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs);
  return candidates[0] || path.join(qaDir, `${scene}-${progress}.jpg`);
};
const sceneImage = (deck, scene, filename) => rel('examples', deck, 'public', 'media', deck, scene, filename);
const shortAsset = (deck, scene, filename) => rel('examples', deck, 'public', 'media', deck, scene, filename);

const films = [
  {
    slug: '01-promo-shorts', title: '발표가 장면이 되다', layout: 'vertical',
    width: 1080, height: 1920, transition: .18, transitionName: 'smoothleft', fadeIn: 1, fadeOut: 2.4, zoom: .00035,
    outputTitle: 'Scrolline Deck · 홍보 쇼츠',
    shots: [
      { image: shortAsset('spatial-proposal', '01-hero', 'hero.webp'), kicker: 'SCROLLINE / STORIES', title: '발표가\n장면이 되다', caption: '큰 이미지와 스크롤로 이야기를 엽니다.', note: '가상 공간 제안 · AI 시각화' },
      { image: shortAsset('product-launch', '01-hero', 'hero-v2.webp'), kicker: '제품 공개', title: '제품은\n디테일과 움직임으로', caption: '가상의 NIMBUS AIR 헤드폰 콘셉트 렌더링', note: '가상 제품 콘셉트' },
      { image: sceneImage('city-guide', '02-route', 'image.webp'), kicker: '도시 가이드', title: '도시는\n길과 멈춤으로', caption: '실제 장소를 상상한 AI 콘셉트 이미지로 저녁 산책을 엽니다.', note: '가상 여행 사례 · AI 콘셉트 이미지' },
      { image: sceneShot('annual-report', '03-trend'), kicker: '가상 결산 · 분기별 매출', title: '매출은 증가,\n성장 속도는 둔화', caption: '4분기 매출은 최고지만 증가 폭은 앞 분기보다 작습니다.', note: '가상 수치 · 실제 성과 아님', mode: 'feature', feature: true, featureType: 'quarters', featureValues: ['312', '346', '391', '433'] },
      { image: sceneShot('investor-pitch', '03-market'), kicker: '투자 피치 · 시장 가정', title: '첫 검토 대상은\n전체 후보의 30%', caption: '2,400곳 ÷ 8,000곳 · 가상 시장 가정입니다.', note: '가상 점포 수 · 실측 아님', mode: 'feature', feature: true, featureType: 'share', featureValues: ['30%', '2,400 / 8,000'] },
      { image: sceneShot('research-lecture', '06-findings'), kicker: '연구 강의 · 합성 관측 예시', title: '오후 표본에서\n그늘 비율 18%p 감소', caption: '09시 46% → 14시 28% · 표본 구간 비율입니다.', note: '수업용 합성값 · 실측 아님', mode: 'feature', feature: true, featureType: 'compare', featureValues: ['46%', '28%', '−18%p'] },
      { image: sceneShot('client-proposal', '08-options'), kicker: '고객 제안 · 가상 파일럿', title: '표준안으로\n세 점포부터 검증', caption: '3곳 · 주 1회 현장 지원 · 대기+슬롯 연결.', note: '가상 고객 제안 · 운영 조건 예시', mode: 'feature', feature: true, featureType: 'choice', featureValues: ['표준안', '3곳', '주 1회', '대기 + 슬롯'] },
      { image: sceneShot('sample-deck', '05-evidence', 55), kicker: 'SCROLLINE DECK', title: '다음 발표를\n스크롤로 펼쳐보세요', caption: '덱을 열고, 화살표 키나 휠로 장면을 진행하세요.', note: '8개 덱 · 장면 유형 라이브러리', mode: 'deck-shot' },
    ],
  },
  {
    slug: '02-real-case-cheonggyecheon', title: '청계천 복원 · 사실과 한계', layout: 'case',
    width: 1920, height: 1080, transition: .55, transitionName: 'fade', fadeIn: 4, fadeOut: 4, zoom: .00012,
    outputTitle: '청계천 복원 · 사실과 한계',
    shots: [
      { image: rel('videos', 'assets', 'cheonggyecheon-before-ai.jpg'), kicker: '사례 · 청계천 복원', title: '도시의 물길은\n도로 아래에 있었습니다', caption: '복원 전 도시를 설명하는 AI 재구성 이미지입니다.', note: 'AI 재구성 · 기록 사진 아님' },
      { image: null, kicker: '서울시 공식 기록 · 시간 순', title: '공사는 2년 3개월\n이어졌습니다', caption: '복원 사업의 공사 기간과 공식 개장일을 연달아 읽습니다.', milestones: [{ date: '2003.07', event: '복원 공사 착수' }, { date: '2005.09', event: '사업 기간 종료' }, { date: '2005.10.01', event: '공식 복원일' }], note: '서울특별시 공식 사업 안내 · 공식 연혁' },
      { image: rel('videos', 'assets', 'cheonggyecheon-after-ai.jpg'), kicker: '복원 이후 · 개념 시각화', title: '물길 옆에\n걷는 길을 잇다', caption: '이 이미지는 복원 현장의 기록 사진이 아닌 AI 재구성입니다.', note: 'AI 재구성 · 기록 사진 아님' },
      { image: null, kicker: '서울시 사업 안내 · 2005년 기준', title: '도심을 가로지른\n복원 구간 5.84 km', caption: '복원 구간 길이와 당시 사업비를 기록으로 확인합니다.', metrics: [{ value: '5.84 km', label: '복원 구간' }, { value: '3,867.39억 원', label: '사업비 · 2005년 기준' }], note: '서울특별시 · 공식 사업 안내' },
      { image: null, kicker: '2015년 현장 연구 · 김정호·이주승·윤용한', title: '측정 지점의 평균 기온\n1.1–1.4°C 낮게 관측', caption: '청계천 현장 측정 지점에서의 평균 변화이며 서울 전역의 효과를 뜻하지 않습니다.', metrics: [{ value: '1.1–1.4°C', label: '평균 기온 감소' }, { value: '6.6–8.7%', label: '상대습도 증가' }], note: '환경정책연구 14(2), 3–25 · DOI 10.17330/joep.14.2.201506.3' },
      { image: null, kicker: '해석의 범위', title: '한 장소의 관측을\n도시 전체로 넓히지 않습니다', caption: '연구는 녹피율이 다른 두 유형과 특정 지점의 수리·기상·온열 환경을 분석했습니다. WBGT 변화도 위치와 유형에 따라 달랐습니다.', metrics: [{ value: '0.0%', label: '녹피 유형 I' }, { value: '20.2%', label: '녹피 유형 II' }], note: '결과는 연구의 측정 조건과 지점에 한정해 읽습니다.' },
      { image: null, kicker: '근거를 직접 확인하기', title: '사업 연혁과\n현장 연구는 다른 출처', caption: '공식 기록은 사업 범위를, 논문은 측정 지점의 열환경을 설명합니다.', sources: ['서울특별시 · Cheonggyecheon Restoration Project — english.seoul.go.kr', '서울특별시 · History of Seoul — 공식 복원일 2005.10.01', '김정호·이주승·윤용한 (2015) · 환경정책연구 14(2), 3–25', 'KCI DOI · 10.17330/joep.14.2.201506.3'], note: 'AI 이미지는 설명용 재구성으로, 기록 사진이나 사업 증거가 아닙니다.', source: 'english.seoul.go.kr/service/amusement/stream/1-cheonggyecheon/ · doi.org/10.17330/joep.14.2.201506.3' },
    ],
  },
  {
    slug: '03-education-scene-design', title: '좋은 장면의 설계 순서', layout: 'lesson',
    width: 1920, height: 1080, transition: .32, transitionName: 'fade', fadeIn: 3, fadeOut: 4, zoom: .00008, defaultDuration: 7,
    outputTitle: '질문–주장–근거 · 장면 설계',
    shots: [
      { image: sceneShot('sample-deck', '01-hero', 55), kicker: '스크롤 장면 설계', title: '효과보다 먼저\n핵심 주장부터', caption: '좋은 스크롤 덱은 장면마다 이해할 관계를 설계합니다.', note: '현재 sample-deck QA 캡처', mode: 'concept', duration: 7 },
      { image: sceneShot('sample-deck', '02-question', 55), kicker: '01 · 질문', title: '청중의 질문을\n먼저 꺼냅니다', caption: '이 장면이 발표 흐름에 어떤 질문을 여는지 확인합니다.', note: '현재 sample-deck QA · 질문 장면', mode: 'concept', duration: 6 },
      { image: sceneShot('sample-deck', '03-claim', 55), kicker: '02 · 주장', title: '주장을 한 문장으로\n말할 수 있나요?', caption: '제목을 읽고 발표의 핵심을 예상할 수 있게 씁니다.', note: '현재 sample-deck QA · 주장 장면', mode: 'concept', duration: 6 },
      { image: sceneShot('sample-deck', '05-evidence', 30), kicker: '03 · 실제 스크롤 화면 / 진입', title: '진입 · 근거가\n화면에 들어옵니다', caption: '30% 진입 · 시각 근거가 막 나타나는 순간.', note: '실제 sample-deck QA 화면 · 진입', mode: 'demo-full', duration: 3.2 },
      { image: sceneShot('sample-deck', '05-evidence', 55), kicker: '03 · 실제 스크롤 화면 / 정지', title: '정지 · 설명하는 동안\n주장과 근거를 읽습니다', caption: '55% 정지 · 설명하는 동안 주장과 근거를 함께 읽습니다.', note: '실제 sample-deck QA 화면 · 발표 정지', mode: 'demo-full', duration: 7 },
      { image: sceneShot('sample-deck', '05-evidence', 85), kicker: '03 · 실제 스크롤 화면 / 퇴장', title: '퇴장 · 정보를 지우지 않고\n다음 맥락으로 넘깁니다', caption: '85% 퇴장 · 다음 장면으로 넘어가도 핵심 정보가 유지됩니다.', note: '실제 sample-deck QA 화면 · 퇴장', mode: 'demo-full', duration: 3.2 },
      { image: sceneShot('sample-deck', '06-flow', 55), kicker: '04 · 관계', title: '정보 관계를\n먼저 확인합니다', caption: '비교·순서·원인과 결과에 맞춰 비교 보드·경로·전후 변화 중 적합한 시각 유형을 고릅니다.', note: '현재 sample-deck QA · 관계 시각화', mode: 'concept', duration: 7 },
      { image: sceneShot('sample-deck', '07-templates', 55), kicker: '05 · 장면 유형', title: '이름이 아니라\n정보 관계로 고릅니다', caption: '템플릿은 핵심 주장을 더 빠르고 정확하게 이해시킬 때만 씁니다.', note: '현재 sample-deck QA · 템플릿 장면', mode: 'hold', duration: 7 },
      { image: sceneShot('sample-deck', '08-demo', 55), kicker: '06 · 시연', title: '스크롤이 정보를\n실제로 바꾸는가?', caption: '진입·설명·완성 상태에서 장면의 변화와 멈춤을 직접 점검합니다.', note: '현재 sample-deck QA · 데모 장면', mode: 'exit', duration: 7 },
      { image: sceneShot('city-guide', '02-route', 55), kicker: '관계 예시 · 순서', title: '장소 순서는\n경로 시퀀스로', caption: '실제 장소 사진과 누적되는 일정으로 순서를 보여 줍니다.', note: '가상 일정 예시 · AI 콘셉트 이미지 표기', mode: 'concept', duration: 6 },
      { image: sceneShot('client-proposal', '08-options', 55), kicker: '관계 예시 · 선택', title: '선택은 기준과\n추천 이유를 함께', caption: '한 가지 안을 무대로 강조하고, 다른 안을 보조 비교로 둡니다.', note: '가상 고객 제안 · 범위 표시', mode: 'hold', duration: 6 },
      { image: sceneShot('sample-deck', '09-checklist', 55), kicker: '07 · 접근성', title: '모션을 줄인 화면에도\n같은 정보가 있나요?', caption: '움직임을 끄고도 주장·근거·다음 행동을 읽을 수 있어야 합니다.', note: '현재 sample-deck QA · 접근성 장면', mode: 'concept', duration: 7 },
      { image: sceneShot('sample-deck', '10-close', 55), kicker: '마지막 검토', title: '질문 → 주장 → 관계 → 근거', caption: '발표 정지 화면을 뒤쪽 청중의 눈높이와 실제 발표 시간으로 검수합니다.', note: 'Scrolline Deck · 장면 설계', mode: 'hold', duration: 8 },
    ],
  },
];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function renderStill(film, shot, index) {
  const imageData = shot.image ? fs.readFileSync(exists(shot.image)).toString('base64') : '';
  const extension = path.extname(shot.image || '').toLowerCase();
  const mime = extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : extension === '.svg' ? 'image/svg+xml' : 'image/jpeg';
  const uri = imageData ? `data:${mime};base64,${imageData}` : '';
  const total = String(film.shots.length).padStart(2, '0');
  const page = String(index + 1).padStart(2, '0');
  const facts = (shot.metrics || []).map((metric) => `<div class="fact"><strong>${escapeHtml(metric.value)}</strong><span>${escapeHtml(metric.label)}</span></div>`).join('');
  const feature = shot.feature ? `<div class="feature-panel feature-${escapeHtml(shot.featureType)}">${shot.featureValues.map((value, i) => `<span class="feature-value feature-value-${i + 1}">${escapeHtml(value)}</span>`).join('')}</div>` : '';
  const timeline = shot.milestones ? `<div class="timeline" aria-label="사업 연표">${shot.milestones.map((item) => `<div class="milestone"><time>${escapeHtml(item.date)}</time><strong>${escapeHtml(item.event)}</strong></div>`).join('')}</div>` : '';
  const image = uri ? `<figure class="visual"><img src="${uri}" alt="" /><figcaption>${escapeHtml(shot.imageLabel || '')}</figcaption></figure>` : '';
  const indexClass = shot.mode || `beat-${index % 4}`;
  const body = `
    <div class="canvas ${film.layout} ${indexClass} ${uri ? 'has-visual' : 'no-visual'} ${shot.sources ? 'has-sources' : ''}" data-page="${page}">
      ${film.layout === 'vertical' && uri ? `<img class="full-image" src="${uri}" alt="" />` : ''}<div class="shade"></div>
      <header class="top"><span>SCROLLINE <b>/ ${film.layout === 'case' ? 'CASE FILE' : film.layout === 'vertical' ? 'SCROLL STORIES' : 'FIELD GUIDE'}</b></span><span>${page} / ${total}</span></header>
      <main class="main">
        ${feature}
        <div class="copy"><p class="kicker">${escapeHtml(shot.kicker)}</p><h1>${escapeHtml(shot.title).replace(/\n/g, '<br/>')}</h1><p class="caption">${escapeHtml(shot.caption)}</p>
          ${timeline}${facts ? `<div class="facts">${facts}</div>` : ''}
          ${shot.note ? `<p class="note">${escapeHtml(shot.note)}</p>` : ''}
          ${shot.sources ? `<div class="sources">${shot.sources.map((source, i) => `<div><b>0${i + 1}</b><span>${escapeHtml(source)}</span></div>`).join('')}</div>` : ''}
        </div>
        ${film.layout === 'vertical' ? '' : image}
      </main>
      <footer class="bottom"><p>${escapeHtml(shot.source || '')}</p><div class="progress"><i style="width:${((index + 1) / film.shots.length) * 100}%"></i></div></footer>
    </div>`;
  const css = `
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}body{font-family:${FONT};-webkit-font-smoothing:antialiased}
    .canvas{position:relative;width:${film.width}px;height:${film.height}px;overflow:hidden;color:#f5f3ec;background:#080b11;--accent:#e5ff64}
    .top{position:absolute;z-index:5;top:36px;left:58px;right:58px;display:flex;justify-content:space-between;color:rgba(248,247,239,.82);font:600 18px/1.35 'Consolas',monospace;letter-spacing:.11em}.top b{color:var(--accent);font-weight:600}
    .main{position:absolute;z-index:2;inset:118px 72px 90px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:56px;align-items:center}
    .copy{position:relative;z-index:2;min-width:0}.kicker{color:var(--accent);font:700 19px/1.35 'Consolas',monospace;letter-spacing:.12em;margin:0 0 24px;text-transform:uppercase}.copy h1{margin:0;font-size:82px;font-weight:780;line-height:1.02;letter-spacing:-.065em;text-wrap:balance}.caption{margin:26px 0 0;max-width:32ch;color:rgba(245,243,236,.87);font-size:29px;line-height:1.36;letter-spacing:-.025em}.note{margin:24px 0 0;color:#fff;font:600 17px/1.35 'Consolas',monospace;letter-spacing:.025em}.visual{position:relative;margin:0;min-width:0;overflow:hidden}.visual img{display:block;width:100%;height:100%;object-fit:cover}.visual figcaption{position:absolute;right:20px;bottom:16px;color:white;background:rgba(0,0,0,.82);padding:8px 10px;font:600 15px/1.2 'Consolas',monospace}
    .facts{display:flex;align-items:flex-start;gap:48px;margin-top:40px}.fact{min-width:0}.fact strong{display:block;color:var(--accent);font:700 70px/.98 'Consolas',monospace;letter-spacing:-.07em;white-space:nowrap}.fact span{display:block;max-width:20ch;margin-top:12px;color:rgba(245,243,236,.83);font:600 20px/1.3 var(--font-body,Arial,sans-serif)}
    .timeline{position:relative;display:flex;gap:0;margin-top:48px;padding-top:28px}.timeline:before{content:'';position:absolute;top:0;left:8px;right:8px;height:2px;background:linear-gradient(90deg,var(--accent),rgba(229,255,100,.25))}.milestone{position:relative;flex:1;padding:0 20px 0 0}.milestone:before{content:'';position:absolute;top:-34px;left:0;width:13px;height:13px;background:var(--accent);border-radius:50%}.milestone time{display:block;color:var(--accent);font:700 25px/1.2 'Consolas',monospace}.milestone strong{display:block;margin-top:10px;color:#fff;font-size:21px;line-height:1.35}
    .sources{margin-top:34px;display:grid;gap:18px}.sources>div{display:grid;grid-template-columns:58px 1fr;gap:18px;align-items:baseline}.sources b{color:var(--accent);font:700 21px/1 'Consolas',monospace}.sources span{font:600 22px/1.35 'Consolas',monospace;overflow-wrap:anywhere;color:#fff}
    .bottom{position:absolute;z-index:5;left:58px;right:58px;bottom:24px}.bottom p{margin:0 0 12px;color:rgba(248,247,239,.78);font:600 15px/1.35 'Consolas',monospace;letter-spacing:.025em;overflow-wrap:anywhere}.progress{height:3px;background:rgba(248,247,239,.22)}.progress i{display:block;height:100%;background:var(--accent)}
    .vertical.feature .full-image{display:none}.vertical.feature .shade{background:linear-gradient(180deg,#08111c 0%,#101c28 46%,#08111c 100%)}.vertical.feature .feature-panel{position:absolute;top:22%;left:7%;width:86%;height:34%;z-index:1;color:#f5f3ec}.vertical.feature .feature-value{display:inline-block;color:#e7ff5d;font-weight:800;letter-spacing:-.075em;line-height:.92}.vertical.feature .copy{top:60%;bottom:auto;left:7%;right:7%}.vertical.feature .kicker{font-size:19px;margin-bottom:14px}.vertical.feature .copy h1{max-width:14ch;font-size:72px;line-height:1.02}.vertical.feature .caption{max-width:32ch;font-size:26px;margin-top:15px}.vertical.feature .note{font-size:18px;margin-top:10px}.vertical.feature .feature-panel:after{display:block;margin-top:28px;color:#cad3d9;font:600 21px/1.3 'Malgun Gothic',sans-serif;letter-spacing:.025em}.vertical.feature .feature-panel.feature-quarters{display:flex;align-items:flex-end;justify-content:space-between;border-bottom:2px solid rgba(231,255,93,.6);padding-bottom:28px}.vertical.feature .feature-panel.feature-quarters .feature-value{font:800 82px/.95 'Consolas',monospace}.vertical.feature .feature-panel.feature-quarters .feature-value:after{content:'억';font:600 26px/1 'Malgun Gothic',sans-serif;letter-spacing:0}.vertical.feature .feature-panel.feature-quarters:after{content:'1분기     2분기     3분기     4분기';position:absolute;bottom:-38px;left:0;right:0;display:flex;justify-content:space-between;font-size:17px}.vertical.feature .feature-panel.feature-share{display:grid;grid-template-columns:.9fr 1.1fr;align-items:center;border-left:5px solid #e7ff5d;padding-left:40px}.vertical.feature .feature-panel.feature-share .feature-value-1{font:800 220px/.9 'Consolas',monospace}.vertical.feature .feature-panel.feature-share .feature-value-2{font:600 44px/1.25 'Consolas',monospace;color:#dce5e8}.vertical.feature .feature-panel.feature-compare{display:flex;align-items:center;justify-content:space-around}.vertical.feature .feature-panel.feature-compare .feature-value{font:800 128px/.9 'Consolas',monospace}.vertical.feature .feature-panel.feature-compare .feature-value-3{position:absolute;right:0;bottom:-52px;font:800 46px/1 'Consolas',monospace;color:#fff}.vertical.feature .feature-panel.feature-choice{display:grid;grid-template-columns:1fr 1fr;align-content:center;column-gap:30px;row-gap:30px;border-top:2px solid rgba(231,255,93,.6);border-bottom:2px solid rgba(231,255,93,.6);padding:28px 0}.vertical.feature .feature-panel.feature-choice .feature-value{color:#f5f3ec;font:700 46px/1.1 'Malgun Gothic',sans-serif;letter-spacing:-.04em}.vertical.feature .feature-panel.feature-choice .feature-value-1{grid-column:1/-1;color:#e7ff5d;font-size:72px}.vertical.feature .feature-panel.feature-choice .feature-value:nth-child(n+3){font-size:38px}
    .vertical{background:#08111c;--accent:#e7ff5d}.vertical .full-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(.86);transform:scale(1.02)}.vertical .shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(4,7,14,.42),rgba(4,7,14,.05) 30%,rgba(4,7,14,.16) 52%,rgba(4,7,14,.82))}.vertical .top{top:54px;left:52px;right:52px;font-size:17px}.vertical .main{inset:0;padding:0;display:block}.vertical .copy{position:absolute;left:54px;right:54px;bottom:185px}.vertical .kicker{font-size:19px;margin-bottom:20px}.vertical .copy h1{max-width:11ch;font-size:112px;line-height:.98;letter-spacing:-.075em}.vertical .caption{font-size:29px;line-height:1.3;max-width:32ch;margin-top:24px}.vertical .note{font-size:20px;margin-top:18px}.vertical .bottom{left:52px;right:52px;bottom:34px}.vertical.beat-1 .copy{top:34%;bottom:auto;left:55px;right:54px}.vertical.beat-1 .copy h1{max-width:9ch;font-size:122px}.vertical.beat-2 .copy{left:60px;right:60px;bottom:200px;text-align:center}.vertical.beat-2 .copy h1{margin:0 auto;max-width:11ch;font-size:106px}.vertical.beat-2 .caption{margin-inline:auto}.vertical.beat-3 .full-image{inset:0 0 37% auto;width:100%;height:63%;object-position:center}.vertical.beat-3 .shade{background:linear-gradient(180deg,rgba(4,7,14,.08),rgba(4,7,14,.04) 27%,#08111c 60%)}.vertical.beat-3 .copy{bottom:195px}.vertical.beat-3 .copy h1{font-size:102px}.vertical.beat-0 .full-image{object-position:center}.vertical.deck-shot .full-image{inset:8% 3% auto;width:94%;height:auto;aspect-ratio:16/9;object-fit:contain;filter:none;transform:none}.vertical.deck-shot .shade{background:linear-gradient(180deg,#08111c 0%,rgba(8,17,28,.9) 5%,rgba(8,17,28,.02) 10%,rgba(8,17,28,.02) 38%,#08111c 43%,#08111c 100%)}.vertical.deck-shot .copy{left:58px;right:58px;top:58%;bottom:auto}.vertical.deck-shot .kicker{margin-bottom:12px}.vertical.deck-shot .copy h1{max-width:15ch;font-size:74px;line-height:1.02}.vertical.deck-shot .caption{max-width:32ch;margin-top:16px;font-size:27px}.vertical.deck-shot .note{margin-top:12px;font-size:19px}.vertical.entry .full-image{inset:10% 3% auto;width:94%;height:auto;aspect-ratio:16/9;object-fit:contain;filter:none;transform:none}.vertical.entry .shade{background:linear-gradient(180deg,#08111c 0%,rgba(8,17,28,.9) 8%,rgba(8,17,28,.02) 15%,rgba(8,17,28,.02) 41%,#08111c 49%,#08111c 100%)}.vertical.entry .copy{left:58px;right:58px;top:51%;bottom:auto}.vertical.entry .copy h1{max-width:15ch;font-size:77px;line-height:1.02}.vertical.entry .caption{max-width:32ch;margin-top:16px;font-size:27px}.vertical.entry .note{margin-top:12px;font-size:19px}.vertical .top,.vertical .bottom{z-index:8}
    .lesson.demo-full .shade{display:none}.lesson.demo-full .main{inset:0;padding:0;display:block}.lesson.demo-full .copy{display:none}.lesson.demo-full .visual{position:absolute;inset:0;width:100%;height:100%;margin:0;overflow:hidden;background:#07090b;box-shadow:none}.lesson.demo-full .visual img{width:100%;height:100%;object-fit:contain}.lesson.demo-full .visual figcaption{display:none}
    .case{background:#101718;--accent:#f3b77e}.case .shade{position:absolute;inset:0;background:radial-gradient(ellipse at 82% 46%,rgba(243,183,126,.10),transparent 45%),linear-gradient(120deg,#101718 0%,#111a19 62%,#071110 100%)}.case .main{inset:142px 94px 94px;grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);gap:64px}.case .copy h1{font-size:78px;max-width:11ch}.case .caption{font-size:26px;max-width:30ch}.case .visual{height:680px}.case .visual img{object-fit:cover}.case .visual figcaption{font-size:17px}.case .facts{gap:40px;margin-top:46px}.case .fact strong{font-size:86px}.case .fact span{font-size:22px;max-width:18ch}.case .fact:nth-child(2) strong{font-size:62px}.case .fact:nth-child(2) span{max-width:20ch}.case .timeline{margin-top:55px}.case .milestone{min-height:126px}.case .milestone time{font-size:30px}.case .milestone strong{font-size:22px}.case .sources{max-width:1060px}.case .sources span{font-size:23px}.case.no-visual .main{display:block;padding-top:52px}.case.no-visual .copy{max-width:1640px}.case.no-visual .copy h1{max-width:18ch}.case.no-visual .facts{max-width:1360px}.case.no-visual .timeline{max-width:1520px}.case.no-visual.has-sources .copy h1{font-size:70px}
    .lesson{background:#0b1110;--accent:#c9fb79}.lesson .shade{position:absolute;inset:0;background:linear-gradient(90deg,#0b1110 0%,#0b1110 43%,rgba(11,17,16,.68) 67%,rgba(11,17,16,.35))}.lesson .main{inset:120px 70px 92px;grid-template-columns:minmax(0,.94fr) minmax(0,1.06fr);gap:48px}.lesson .copy h1{font-size:64px;max-width:none;line-height:1.06;letter-spacing:-.055em}.lesson .caption{font-size:25px;max-width:28ch}.lesson .visual{height:680px;box-shadow:0 25px 70px rgba(0,0,0,.34)}.lesson .visual img{object-fit:cover}.lesson .note{font-size:15px}.lesson.entry .visual{height:555px;align-self:end}.lesson.hold .main{grid-template-columns:minmax(0,.84fr) minmax(0,1.16fr);gap:38px}.lesson.hold .visual{height:735px}.lesson.exit .shade{background:linear-gradient(90deg,#0b1110 0%,#0b1110 50%,rgba(11,17,16,.30) 82%,rgba(11,17,16,.12))}.lesson.exit .visual{height:600px;align-self:start}.lesson.concept .visual{height:520px}.lesson.concept .main{grid-template-columns:minmax(0,.96fr) minmax(0,1.04fr)}
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
    await page.locator('.visual img, .full-image').evaluateAll((images) => Promise.all(images.map((image) => image.decode().then(() => {
      if (!image.naturalWidth || !image.naturalHeight) throw new Error(`Video still image failed to decode: ${image.src.slice(0, 80)}`);
    }))));
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
    graph.push(`[${current}][v${index}]xfade=transition=${film.transitionName || 'fade'}:duration=${film.transition}:offset=${offset}[${next}]`);
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
  const qaFilmDir = path.join(QA_DIR, film.slug);
  fs.mkdirSync(qaFilmDir, { recursive: true });
  let shotStart = 0;
  for (let index = 0; index < shots.length; index += 1) {
    const shot = shots[index];
    const at = Math.min(shotStart + Math.min(.7, shot.duration * .25), Math.max(0, duration - .15));
    const qaFrame = path.join(qaFilmDir, `beat-${String(index + 1).padStart(2, '0')}.jpg`);
    await exec(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', at.toFixed(3), '-i', output, '-frames:v', '1', '-q:v', '2', qaFrame]);
    shotStart += shot.duration - (index < shots.length - 1 ? film.transition : 0);
  }

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
  assertSafeBuildDir();
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
    assertSafeBuildDir();
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  }
}

await main();
