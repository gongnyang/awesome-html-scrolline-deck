const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

const pad = (value) => String(value).padStart(2, '0');
const RELATION_LABELS = {
  'talk-sequence': '발표 순서', 'part-to-whole': '부분과 전체', 'time-series-event': '시간 변화와 사건',
  'controlled-change': '조건을 맞춘 변화', 'argument-sequence': '논증의 단계', 'magnitude-comparison': '수치 크기 비교',
  'decision-to-action': '결론과 행동', 'equivalent-options': '동등 조건의 선택지', 'claim-to-source': '주장과 원문 근거',
  'visual-change-over-time': '시간에 따른 시각 변화', 'process-over-time': '과정의 시간 변화',
  'ordered-visual-evidence': '순서가 있는 시각 근거', 'spatial-route': '공간 경로', 'defined-measures': '정의된 핵심 수치',
  'criteria-based-decision': '기준에 따른 결정', 'source-collection': '출처 자료의 관계', 'visual-context': '장면의 맥락',
  'question-to-observation': '질문과 관찰 근거', 'causal-sequence': '원인과 결과의 순서',
  'component-relationships': '요소 사이의 관계', 'person-to-testimony': '인물과 증언', 'dated-sequence': '날짜별 변화',
  'state-transformation': '상태의 변화', 'phrase-transformation': '문구의 의미 변화',
};

function renderDeck(card, index) {
  const scenes = card.scenes.slice(0, 3);
  const shotStrip = card.shots.slice(0, 3).map((filename) => `
        <img loading="lazy" src="./_qa/${esc(card.name)}/${esc(filename)}" alt="${esc(card.title)} — ${esc(filename.replace(/-55\.jpg$/, ''))} 장면 캡처" />`).join('');

  return `
      <article class="deck-spread reveal" id="deck-${esc(card.name)}" style="--deck-accent:${esc(card.accent)}">
        <div class="deck-copy">
          <p class="deck-number">${pad(index + 1)} / ${esc(card.style)} · ${card.scenes.length} SCENES</p>
          <h3>${esc(card.title)}</h3>
          ${card.subtitle ? `<p class="deck-subtitle">${esc(card.subtitle)}</p>` : ''}
          <p class="deck-meta"><span>${card.scenes.length} 장면</span><span>${esc(card.name)}</span><span>발표자 노트 포함</span></p>
          <ol class="scene-peek" aria-label="${esc(card.title)} 주요 장면">
            ${scenes.map((scene) => `<li>${esc(scene.copy?.title || scene.id)}</li>`).join('')}
          </ol>
          <a class="open-deck" href="./${esc(card.name)}/"><span aria-hidden="true">↗</span> 덱 열어보기</a>
        </div>
        <div class="deck-art">
          <a class="deck-cover" href="./${esc(card.name)}/" aria-label="${esc(card.title)} 발표 열기">
            <img loading="lazy" src="${esc(card.cover)}" alt="${esc(card.coverAlt)}" />
            <span class="cover-overlay" aria-hidden="true"></span>
            <span class="cover-caption">${esc(card.name)} · ${esc(card.coverCaption)}</span>
          </a>
          ${shotStrip ? `<div class="shot-strip" aria-label="${esc(card.title)} 장면 미리보기">${shotStrip}</div>` : ''}
        </div>
      </article>`;
}

function renderTemplate(template) {
  const title = template.galleryTitle || template.exampleCopy?.title || template.description_ko || template.name;
  const relation = RELATION_LABELS[template.sceneContract?.relation] || template.sceneContract?.relation || template.familyLabel;
  const linked = Boolean(template.previewHref);
  return `
        <article class="template-card" data-family="${esc(template.family)}" data-status="${esc(template.status)}" data-search="${esc(template.searchText)}">
          <${linked ? `a class="template-preview" href="${esc(template.previewHref)}" aria-label="${esc(title)}가 적용된 덱 보기"` : 'div class="template-preview"'}>
            <img loading="lazy" src="./_templates/${esc(template.previewImage)}" alt="${esc(template.alt)}" />
            <span class="review-badge status-${esc(template.status)}">${esc(template.statusLabel)}</span>
            <span class="preview-cta">${linked ? '해당 장면 보기 ↗' : '기법 미리보기 · 검수 전'}</span>
          </${linked ? 'a' : 'div'}>
          <p class="type"><span>${esc(template.familyLabel)}</span><span>${esc(template.name)}</span></p>
          <h3>${linked ? `<a href="${esc(template.previewHref)}">${esc(title)}</a>` : esc(title)}</h3>
          <p>${esc(template.purpose || template.description_ko)}</p>
          <p class="template-relation"><b>보여줄 관계</b><span>${esc(relation)}</span></p>
          <details class="template-guidance"><summary>적합한 조건과 대안</summary><dl><dt>적합</dt><dd>${esc(template.sceneContract?.fit)}</dd><dt>필요한 자료</dt><dd>${esc(template.sceneContract?.requiredInputs)}</dd><dt>맞지 않으면</dt><dd>${esc(template.sceneContract?.failureFallback)}</dd><dt>검수 상태</dt><dd>${esc(template.sceneContract?.reviewNote)}</dd></dl></details>
        </article>`;
}

function renderFilm(video, index) {
  const [slug, title, description] = video;
  const id = `film-${esc(slug)}`;
  return `
        <article class="film reveal">
          <div class="film-head"><span>${pad(index + 1)} / SCREENING ROOM</span><span>한국어 자막</span></div>
          <video controls preload="none" poster="./videos/${esc(slug)}.jpg" aria-labelledby="${id}-title">
            <source src="./videos/${esc(slug)}.mp4" type="video/mp4" />
            <track kind="captions" src="./videos/${esc(slug)}.vtt" srclang="ko" label="한국어" default />
            이 브라우저는 동영상을 재생할 수 없습니다. 자막 파일은 아래 링크에서 내려받으세요.
          </video>
          <h3 id="${id}-title">${esc(title)}</h3>
          <p>${esc(description)}</p>
          <a class="caption-link" href="./videos/${esc(slug)}.vtt" download>한국어 자막 받기 (.vtt)</a>
        </article>`;
}

export function renderGallery({ decks, templates, videos, families, sceneTypeCount }) {
  const familyControls = families.map((family) => `
          <button class="family-filter" type="button" data-family-filter="${esc(family.id)}" aria-pressed="false">
            ${esc(family.label)} <span>${family.count}</span>
          </button>`).join('');

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#101411" />
  <meta name="description" content="${decks.length}개의 한국어 스크롤 웹덱과 ${sceneTypeCount}개의 장면 선택 후보를 용도와 근거 기준으로 살펴보세요." />
  <title>Scrolline — 장면으로 보는 발표</title>
  <link rel="preload" as="image" href="./media/gallery-hero.webp" fetchpriority="high" />
  <link rel="stylesheet" href="./assets/gallery.css" />
</head>
<body>
  <a class="skip-link" href="#main">본문으로 건너뛰기</a>
  <div class="shell">
    <nav class="topbar" aria-label="주요 메뉴">
      <a class="brand" href="#top"><span class="brand-mark" aria-hidden="true"></span> SCROLLINE DECK</a>
      <div class="top-count">${decks.length} DECKS · ${sceneTypeCount} SCENE CANDIDATES · ${videos.length} FILMS</div>
      <div class="nav-links"><a href="#decks">덱 둘러보기</a><a href="#templates">장면 찾기</a><a href="#videos">영상 보기</a></div>
    </nav>
  </div>
  <main id="main">
    <section class="hero" id="top" aria-labelledby="hero-title">
      <img class="hero-photo" src="./media/gallery-hero.webp" alt="" fetchpriority="high" />
      <div class="hero-inner">
        <div>
          <p class="eyebrow">A living index of scroll presentations</p>
          <h1 id="hero-title">발표가<br/><span>장면이</span> 되다.</h1>
          <p class="hero-lead">한 장씩 넘기는 대신, 이야기가 화면을 따라 움직입니다. 서로 다른 목적과 시각 언어를 가진 한국어 웹덱을 직접 열어보세요.</p>
          <div class="hero-actions"><a class="button-link" href="#decks">덱 둘러보기 <span aria-hidden="true">↓</span></a><a class="button-link ghost" href="#templates">장면 유형 찾기</a></div>
        </div>
        <aside class="hero-aside" aria-label="컬렉션 개요">
          <p class="eyebrow">The collection</p>
          <strong>${decks.length}가지<br/>발표의 결</strong>
          <p>제품 공개에서 도시 산책, 공간 제안까지. 각 덱은 첫 두 장면에서 이야기에 빠져들고, 발표자가 말할 자리를 남깁니다.</p>
        </aside>
      </div>
      <div class="hero-bottom"><span>Scroll to enter the collection</span><span>SEOUL · 2026</span></div>
    </section>
    <div class="shell stats-band" aria-label="컬렉션 통계">
      <div class="stat"><b>${decks.length}</b><span>완성된 발표 덱</span></div>
      <div class="stat"><b>${sceneTypeCount}</b><span>정보 관계별 장면 메커니즘</span></div>
      <div class="stat"><b>${videos.length}</b><span>한국어 자막 영상</span></div>
    </div>

    <section class="section shell" id="decks" aria-labelledby="decks-title">
      <div class="section-head">
        <span class="section-index">01 — OPEN THE DECKS</span>
        <h2 id="decks-title">한 번의 스크롤,<br/>다른 이야기.</h2>
        <p>표지에서 한 덱의 분위기를 먼저 보고, 아래 장면 제목으로 전체 흐름을 살펴보세요. 클릭하면 바로 발표가 열립니다.</p>
      </div>
      <nav class="deck-index" aria-label="발표 덱 바로가기">
        ${decks.map((deck, index) => `<a href="#deck-${esc(deck.name)}"><span>${pad(index + 1)}</span>${esc(deck.title)}</a>`).join('')}
      </nav>
      ${decks.map(renderDeck).join('')}
    </section>

    <section class="library" id="templates" aria-labelledby="templates-title">
      <div class="shell">
        <div class="section-head">
          <span class="section-index">02 — CHOOSE A SCENE BY JOB</span>
          <div><p class="eyebrow">Scene library · ${sceneTypeCount} selection candidates</p><h2 class="library-title" id="templates-title">장면의 역할부터<br/><em>고르세요.</em></h2></div>
          <p>효과 이름 대신 청중이 이해해야 할 관계로 탐색합니다. 각 후보에는 맞는 자료와 맞지 않을 때의 대안이 적혀 있습니다. 완성 덱의 실제 장면을 먼저 보고 새 콘텐츠에 맞게 다시 설계하세요.</p>
        </div>
        <div class="library-tools">
          <label class="search-wrap"><span class="visually-hidden">장면 검색</span><input class="template-search" id="template-search" type="search" placeholder="숫자, 비교, 질문…" autocomplete="off" /></label>
          <div class="family-filters" role="group" aria-label="장면 유형 필터">
            <button class="family-filter" type="button" data-family-filter="all" aria-pressed="true">전체 <span>${sceneTypeCount}</span></button>${familyControls}
          </div>
        </div>
        <p class="filter-status" id="template-result" role="status" aria-live="polite">${sceneTypeCount}개 장면 선택 후보</p>
        <div class="template-grid" id="template-grid">${templates.map(renderTemplate).join('')}</div>
        <p class="no-results" id="no-results">조건에 맞는 장면이 없습니다. 검색어를 바꾸거나 전체 유형을 선택해 주세요.</p>
      </div>
    </section>

    <section class="films shell" id="videos" aria-labelledby="films-title">
      <div class="section-head">
        <span class="section-index">03 — SHORT FILM PROGRAM</span>
        <h2 id="films-title">장면을<br/>영상으로.</h2>
        <p>홍보 몽타주, 출처가 있는 실제 사례, 장면 설계 교육 영상입니다. 플레이어에서 바로 한국어 자막을 켤 수 있습니다.</p>
      </div>
      <div class="film-grid">${videos.map(renderFilm).join('')}</div>
      <p class="source-note">실제 사례 영상의 역사 장면은 AI 재구성 이미지입니다. 기간과 구간은 <a href="https://english.seoul.go.kr/service/amusement/stream/1-cheonggyecheon/">서울시 청계천 안내</a>, 측정 구간의 온열 변화는 <a href="https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART002009075">김정호·이주승·윤용한(2015)</a>을 참고했습니다.</p>
    </section>
  </main>
  <footer class="shell closing">
    <div><h2>다음 발표를<br/><span style="color:var(--accent);font-family:var(--serif);font-style:italic">여기서</span> 시작하세요.</h2><p>화살표 키나 스크롤로 진행하고, N 키로 발표자 노트를 여세요.</p></div>
    <nav class="closing-nav" aria-label="하단 메뉴"><a href="#top">맨 위로 ↑</a><a href="#decks">덱</a><a href="#templates">장면 템플릿</a><a href="#videos">영상</a><a href="https://github.com/gongnyang/awesome-html-scrolline-deck">GitHub</a></nav>
    <div class="legal"><span>SCROLLINE DECK · MIT LICENSE</span><span>BUILT FOR STORIES THAT MOVE</span></div>
  </footer>
  <script>
    const cards = [...document.querySelectorAll('.template-card')];
    const buttons = [...document.querySelectorAll('[data-family-filter]')];
    const search = document.querySelector('#template-search');
    const result = document.querySelector('#template-result');
    const empty = document.querySelector('#no-results');
    let activeFamily = 'all';
    function updateTemplates() {
      const query = search.value.trim().toLocaleLowerCase();
      let visible = 0;
      for (const card of cards) {
        const matchesFamily = activeFamily === 'all' || card.dataset.family === activeFamily;
        const matchesText = !query || card.dataset.search.toLocaleLowerCase().includes(query);
        card.hidden = !(matchesFamily && matchesText);
        if (!card.hidden) visible += 1;
      }
      result.textContent = visible + '개 장면 선택 후보';
      empty.classList.toggle('is-visible', visible === 0);
    }
    buttons.forEach((button) => button.addEventListener('click', () => {
      activeFamily = button.dataset.familyFilter;
      buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      updateTemplates();
    }));
    search.addEventListener('input', updateTemplates);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
      document.documentElement.classList.add('has-motion');
      const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      }), { threshold: .12 });
      document.querySelectorAll('.reveal').forEach((node) => observer.observe(node));
    }
  </script>
</body>
</html>`;
}
