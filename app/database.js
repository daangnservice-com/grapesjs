const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'careers.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize DB schema
function initDb() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Pages table
      db.run(`
        CREATE TABLE IF NOT EXISTS pages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version_name TEXT NOT NULL,
          page_path TEXT DEFAULT '/',
          page_name TEXT DEFAULT '메인 페이지',
          html TEXT NOT NULL,
          css TEXT NOT NULL,
          components_json TEXT,
          seo_title TEXT,
          seo_description TEXT,
          favicon_url TEXT DEFAULT '/images/favicon-192.png',
          is_published INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) return reject(err);
        
        // Add favicon_url, page_path, page_name columns to existing database if missing
        db.run(`ALTER TABLE pages ADD COLUMN favicon_url TEXT DEFAULT '/images/favicon-192.png'`, () => {
          db.run(`ALTER TABLE pages ADD COLUMN page_path TEXT DEFAULT '/'`, () => {
            db.run(`ALTER TABLE pages ADD COLUMN page_name TEXT DEFAULT '메인 페이지'`, () => {
              // 과거 버전에서 잔존할 수 있는 문법 오류 인라인 스크립트 자동 정제
              db.run(`UPDATE pages SET html = REPLACE(html, 'initHeaderDropdowns();', '') WHERE html LIKE '%initHeaderDropdowns();%'`);
              seedDefaultSubPages().catch(e => console.warn('[DB] seedDefaultSubPages error:', e.message));
            });
          });
        });

        // 2. Articles table
        db.run(`
          CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            subtitle TEXT,
            thumbnail_url TEXT,
            author TEXT DEFAULT '당근서비스팀',
            content TEXT NOT NULL,
            content_html TEXT,
            tags TEXT DEFAULT '[]',
            status TEXT DEFAULT 'draft',
            published_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err2) => {
          if (err2) return reject(err2);

          // Add published_at column to existing database if missing
          db.run(`ALTER TABLE articles ADD COLUMN published_at DATETIME`, () => {});

          db.run(`CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug)`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status)`);

          // Check if initial pages exist
          db.get('SELECT COUNT(*) as count FROM pages', (err3, pRow) => {
            if (err3) return reject(err3);
            const pPromise = (pRow && pRow.count === 0) ? seedDefaultPage() : Promise.resolve();

            pPromise.then(() => {
              // Check if initial article exists
              db.get('SELECT COUNT(*) as count FROM articles', (err4, aRow) => {
                if (err4) return reject(err4);
                if (aRow && aRow.count === 0) {
                  seedInitialArticle().then(resolve).catch(reject);
                } else {
                  resolve();
                }
              });
            }).catch(reject);
          });
        });
      });
    });
  });
}

// Official Daangn Careers Production HTML & CSS Seed
function seedDefaultPage() {
  const officialHtml = getOfficialHtml();
  const officialCss = getOfficialCss();

  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO pages (version_name, html, css, components_json, seo_title, seo_description, favicon_url, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);
    stmt.run(
      '당근서비스 공식 채용 사이트 풀 템플릿 (v3.0)',
      officialHtml,
      officialCss,
      '{}',
      '당근서비스 채용 - 당근다운 경험이 완성되는 당근서비스',
      '당근서비스에 합류하세요. 당근다운 경험이 완성되는 여정을 함께할 동료를 찾습니다.',
      '/images/favicon-192.png',
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function getOfficialCss() {
  return `:root {
  --seed-orange: #FF6F0F;
  --seed-orange-hover: #E55E00;
  --seed-bg-white: #ffffff;
  --seed-font-family: 'KarrotSans', 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
}
body {
  font-family: var(--seed-font-family);
  color: #212124;
  line-height: 1.6;
  margin: 0;
  padding: 0;
  background-color: #ffffff;
}
.daangn-sticky-left {
  position: sticky;
  top: 120px;
  align-self: flex-start;
}
#sticky-label-text, #sticky-label-sub {
  transition: opacity 0.3s ease;
}`.trim();
}

function getOfficialHtml() {
  return `<div class="daangn-official-wrapper" style="background-color: #ffffff; color: #212124; font-family: 'KarrotSans', 'Pretendard', sans-serif;">

  <!-- GLOBAL HEADER (상단 내비게이션 - GrapesJS 빌더에서 직접 로고, 메뉴 텍스트 및 링크 수정 가능) -->
  <header id="daangnHeader" class="header__HeaderContainer-sc-bdd24b93-1 base-header-styles__CustomHeader-sc-eefa7522-0">
    <div class="header__HeaderInnerContainer-sc-bdd24b93-2">
      <a href="/" class="header-link-wrapper">
        <div class="header__LogoWrapper-sc-bdd24b93-3">
          <img alt="당근서비스 로고" src="/images/daangn-service-logo.png" />
        </div>
      </a>
      <div class="mobile-view__MobileView-sc-bb2ed92c-0 hossQr">
        <button data-testid="모바일_메뉴_버튼" type="button" aria-label="모바일 메뉴 열기" class="header__MobileMenuButtonStyled-sc-bdd24b93-4" onclick="var m = document.querySelector('.mobile-view__MobileView-sc-bb2ed92c-0.gJVwBD'); if (m) m.classList.toggle('is-open');">
          <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
            <path clip-rule="evenodd" d="M3 5.5H21V7.5H3V5.5ZM3 11H21V13H3V11ZM21 16.5H3V18.5H21V16.5Z" fill="#222222" fill-rule="evenodd"></path>
          </svg>
        </button>
      </div>
      <div class="mobile-view__MobileView-sc-bb2ed92c-0 gJVwBD">
        <div class="kCDZmt" style="display: flex; align-items: center; gap: 16px;">
          <!-- 1. 홈 -->
          <a rel="noreferrer" href="/" class="header-link-wrapper">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU" name="홈">
              <span class="sc-aYaIB gigtVE">홈</span>
            </button>
          </a>

          <!-- 2. 팀 소개 (프로덕트 / 사업운영 / 독립) -->
          <div class="header-menu-item-group">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU header-dropdown-trigger">
              <span class="sc-aYaIB gigtVE">팀 소개</span>
              <svg class="header-chevron-icon" viewBox="0 0 16 16" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="header-dropdown-menu">
              <a href="/teams/product" class="header-dropdown-item">프로덕트</a>
              <a href="/teams/business" class="header-dropdown-item">사업운영</a>
              <a href="/teams/vertical" class="header-dropdown-item">독립</a>
              <a href="/teams/support" class="header-dropdown-item">경영지원</a>
            </div>
          </div>

          <!-- 3. 콘텐츠 (전체 이야기 / Culture / People / CX) -->
          <div class="header-menu-item-group">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU header-dropdown-trigger">
              <span class="sc-aYaIB gigtVE">콘텐츠</span>
              <svg class="header-chevron-icon" viewBox="0 0 16 16" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="header-dropdown-menu">
              <a href="/articles" class="header-dropdown-item">전체 이야기</a>
              <a href="/articles" class="header-dropdown-item">Culture</a>
              <a href="/articles" class="header-dropdown-item">People</a>
              <a href="/articles" class="header-dropdown-item">CX</a>
            </div>
          </div>

          <!-- 4. 채용 절차 (프로세스 / 자주묻는질문) -->
          <div class="header-menu-item-group">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU header-dropdown-trigger">
              <span class="sc-aYaIB gigtVE">채용 절차</span>
              <svg class="header-chevron-icon" viewBox="0 0 16 16" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="header-dropdown-menu">
              <a href="/process#process" class="header-dropdown-item">프로세스</a>
              <a href="/process#faq" class="header-dropdown-item">자주묻는질문</a>
            </div>
          </div>

          <!-- 5. 채용 공고 (버튼) -->
          <a rel="noreferrer" href="/apply" class="header-link-wrapper">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cbRJON" name="채용 공고">
              <span class="sc-aYaIB gigtVE">채용 공고</span>
            </button>
          </a>
        </div>
      </div>
    </div>
  </header>

  <!-- HERO STICKY SCROLL SECTION (about.daangn.com 스타일) -->
  <section class="daangn-hero-track" id="daangnHeroTrack">
    <div class="daangn-hero-sticky" id="daangnHeroSticky">
      
      <!-- Initial Title (당근다운 경험이 완성되는 당근서비스) -->
      <div class="daangn-hero-title-container" id="daangnHeroTitle1">
        <h1 class="daangn-hero-main-title">
          <span style="color: #FF6F0F;">당근</span>다운 경험이<br/>
          완성되는 <span style="color: #FF6F0F;">당근서비스</span>
        </h1>
      </div>

      <!-- Video Box Container (마우스 스크롤 시 화면 전체창으로 부드럽게 확장) -->
      <div class="daangn-hero-video-box" id="daangnHeroVideoBox">
        <video autoplay loop muted playsinline>
          <source src="https://opening-attachments.greetinghr.com/2025-09-05/5d5028c2-cdcf-4704-af25-1fd2302ccdba/aHTuFEMqNJQqH1nx_video_cartoon.CPwTwaNX(1).mp4" type="video/mp4">
        </video>

        <!-- Dark Scrim Overlay for Fullscreen -->
        <div class="daangn-hero-scrim" id="daangnHeroScrim"></div>
      </div>

      <!-- Fullscreen Overlay Text (마우스 스크롤 시 비디오 중앙에 표시 / 빌더에서는 동영상 밑에 바로 표시되어 편리하게 수정) -->
      <div class="daangn-hero-text-overlay" id="daangnHeroTitle2">
        <div class="daangn-hero-quote-badge">🎬 [스크롤 확대 시 전체 화면 문구] 더블 클릭하여 수정</div>
        <p class="daangn-hero-fullscreen-quote">
          고객을 향한 따뜻한 마음과 탁월한  문제해결능력을 바탕으로,<br/>
          설명이 필요없고 예상을 뛰어넘는 고객경험을 제공해요.
        </p>
      </div>

    </div>
  </section>

  <!-- LOCAL QUESTIONS SECTION (당근서비스가 고민하는 로컬의 질문들 - 상단 고정 & 스크롤 연동 슬라이딩) -->
  <section id="questionsSection" class="daangn-questions-section">
    <div id="questionsStickyPin" class="daangn-questions-sticky-pin">
      <div class="daangn-questions-header">
        <h2 class="daangn-questions-title">당근서비스가 풀고있는 로컬의 문제들</h2>
        <img src="https://careers-prismic-image-proxy.krrt.io/karrot/aiqUKKlQnVZVENN4_%E1%84%85%E1%85%A9%E1%84%8F%E1%85%A5%E1%86%AF%E1%84%8B%E1%85%B4%E1%84%8C%E1%85%B5%E1%86%AF%E1%84%86%E1%85%AE%E1%86%AB%E1%84%83%E1%85%B3%E1%86%AF_%E1%84%8E%E1%85%A5%E1%86%BA%E1%84%91%E1%85%B3%E1%84%85%E1%85%A6%E1%84%8B%E1%85%B5%E1%86%B7.png?auto=compress&w=960&fit=max&fm=webp" alt="로컬의 질문들 일러스트" class="daangn-questions-img" />
      </div>

      <!-- 3-card sliding carousel container -->
      <div class="daangn-questions-carousel">
        <!-- Prev & Next Arrows (3개 노출 및 슬라이딩 네비게이션) -->
        <button id="questionsPrevBtn" class="daangn-carousel-arrow daangn-carousel-arrow-prev" aria-label="이전 질문">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <button id="questionsNextBtn" class="daangn-carousel-arrow daangn-carousel-arrow-next" aria-label="다음 질문">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        <!-- Viewport (한 번에 3개만 보이고 오른쪽으로 슬라이딩) -->
        <div class="daangn-questions-viewport">
          <!-- Track with 6 Question Cards -->
          <div id="questionsTrack" class="daangn-questions-track">
            <!-- Card 1 -->
            <div class="daangn-question-card">
              <p class="daangn-question-text">전국 어딘가에 딱 하나 있는 물건과 그걸 알아본 사람을, 채팅 한 번 없이 거래까지 어떻게 연결할까요?</p>
              <div class="daangn-question-author">중고거래 · Adeline</div>
            </div>
            <!-- Card 2 -->
            <div class="daangn-question-card">
              <p class="daangn-question-text">5분짜리 거래는 익숙해졌는데, 처음 보는 이웃과 한 시간 넘게 취향과 취미를 나누려면 무엇이 필요할까요?</p>
              <div class="daangn-question-author">모임 · Luana</div>
            </div>
            <!-- Card 3 -->
            <div class="daangn-question-card">
              <p class="daangn-question-text">'길을 찾는 지도'가 아니라 '동네 생활을 위한 지도'라면, 콘텐츠는 어떤 맥락으로 보여야 할까요?</p>
              <div class="daangn-question-author">동네지도 · Audrey</div>
            </div>
            <!-- Card 4 -->
            <div class="daangn-question-card">
              <p class="daangn-question-text">벌레 한 마리 잡는 데 5분이면 와줄 이웃과의 거리를 어떻게 허물어야, 현관문을 열게 될까요?</p>
              <div class="daangn-question-author">알바 · Jennie</div>
            </div>
            <!-- Card 5 -->
            <div class="daangn-question-card">
              <p class="daangn-question-text">수만 개 매물 중 나에게 딱 맞는 동네와 딱 맞는 집을, 몇 번의 클릭으로 찾아낼 수 있을까요?</p>
              <div class="daangn-question-author">부동산 · Sam</div>
            </div>
            <!-- Card 6 -->
            <div class="daangn-question-card">
              <p class="daangn-question-text">수천만 원의 거래가, 10분 거리 동네 주차장에서 일어날 수 있는 신뢰 관계를 어떻게 구축할까요?</p>
              <div class="daangn-question-author">중고차 · Zoe</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CULTURE STICKY SCROLL SECTION (당근서비스가 일하는 방식 7대 인재상: 상단 제목 고정 + 좌측 고정 네비 + 우측 스티키 카드 스택) -->
  <section id="culture" class="daangn-culture-section" style="background-color: #ffffff; position: relative;">
    <div style="max-width: 1120px; margin: 0 auto; padding: 0 24px; position: relative;">
      <!-- Sticky Header: 소수정예 팀의 경계 없는 몰입 + 설명글 함께 상단 고정 -->
      <div class="daangn-culture-header" id="daangnCultureHeader">
        <h2 class="daangn-culture-title">소수정예 팀의 경계 없는 몰입</h2>
        <p class="daangn-culture-desc">
          동네를 개발거리로 보는 빌더의 상상력은 100m 앞 현장까지 뻗어 나갑니다.<br/>
          한 사람이 직무의 경계를 넘어 문제를 직접 해결하고,<br/>
          그 변화는 수천만의 일상에 가장 빠르게 닿습니다. 당근서비스가 일하는 방식입니다.
        </p>
      </div>

      <!-- Sticky container: left interactive sticky list + right sticky cards stack -->
      <div class="daangn-sticky-stack-container">
        <!-- Left sticky list (7대 인재상) -->
        <div class="daangn-sticky-left">
          <span style="font-size: 14px; font-weight: 800; color: #FF6F0F; letter-spacing: 0.5px;">당근서비스가 일하는 방식</span>
          <div class="sticky-value-list" id="stickyValueList">
            <div class="sticky-value-item is-active" data-index="0" onclick="scrollToStickyCard(0)">일을 즐기는 사람</div>
            <div class="sticky-value-item" data-index="1" onclick="scrollToStickyCard(1)">고객 집착 마인드</div>
            <div class="sticky-value-item" data-index="2" onclick="scrollToStickyCard(2)">빠른 학습과 성장</div>
            <div class="sticky-value-item" data-index="3" onclick="scrollToStickyCard(3)">주도적인 몰입</div>
            <div class="sticky-value-item" data-index="4" onclick="scrollToStickyCard(4)">팀으로 일하기</div>
            <div class="sticky-value-item" data-index="5" onclick="scrollToStickyCard(5)">유연한 적응력</div>
            <div class="sticky-value-item" data-index="6" onclick="scrollToStickyCard(6)">솔직함과 신뢰</div>
          </div>
          <div class="sticky-desc-box" id="stickyDescBox">
            누가 시켜서 억지로 하는 것이 아니라, 스스로 좋아서 이 일을 선택한 사람들과 함께하고 싶어요. 일이 곧 재미인 동료를 보며 자극받고 함께 성장해요.
          </div>
        </div>
        <!-- Right sticky cards stack: 7개 핵심 인재상 카드 -->
        <div class="daangn-cards-stack" id="stickyCardsStack">
          <!-- Card 1: 일을 즐기는 사람 -->
          <div class="daangn-sticky-card" data-index="0" data-label="일을 즐기는 사람">
            <span class="daangn-sticky-card-category">일을 즐기는 사람</span>
            <h3 class="daangn-sticky-card-headline">즐겁게, 제대로</h3>
            <div class="daangn-sticky-card-media">
              <img src="https://careers-prismic-image-proxy.krrt.io/karrot/ai_1Fo1P9HI4Ug1L_%E1%84%89%E1%85%B5%E1%86%AB%E1%84%85%E1%85%AC%E1%84%8B%E1%85%AA%E1%84%8E%E1%85%AE%E1%86%BC%E1%84%83%E1%85%A9%E1%86%AF_F.png?auto=compress&w=900&fit=max&fm=webp" alt="일을 즐기는 사람" class="daangn-sticky-card-img" />
            </div>
            <div class="daangn-sticky-card-quote">
              “내가 쌓은 지식과 경험이 고객에게 도움이 되는 순간 자체가 즐거워요” <span class="daangn-sticky-card-author">- 당근알바팀 Trudy</span>
            </div>
            <p class="daangn-sticky-card-body">
              재미있는 무언가를 할 때 가끔 시간 가는 줄 모르곤 할 때가 있을 거예요.<br/>
              밤을 새워도, 주말에도, 머릿속에서 일이 떠나지 않을 정도로 일이 곧 재미인 사람들이 생각보다 많아요. 우리는 그런 동료를 보며 자극 받고, 영감을 주며, 함께 성장해요.
            </p>
          </div>

          <!-- Card 2: 고객의 기쁨을 극대화하는 사람 -->
          <div class="daangn-sticky-card" data-index="1" data-label="고객 집착 마인드">
            <span class="daangn-sticky-card-category">고객의 기쁨을 극대화하는 사람</span>
            <h3 class="daangn-sticky-card-headline">고객 집착 마인드</h3>
            <div class="daangn-sticky-card-media">
              <img src="/images/builder-spirit.webp" alt="고객의 기쁨을 극대화하는 사람" class="daangn-sticky-card-img" />
            </div>
            <div class="daangn-sticky-card-quote">
              “내가 고객이라면, 어떻게 해결해 주길 원할까? 이 질문을 끝까지 붙들어요” <span class="daangn-sticky-card-author">- 고객경험팀</span>
            </div>
            <p class="daangn-sticky-card-body">
              나의 행동, 나의 노력이 고객에게 어떤 변화를 만들어 냈는지 중요한 사람들과 함께하고 싶어요.<br/>
              상황이 어렵더라도 마치 나의 일처럼 끝까지 노력하며, 상대방의 문제를 해결해 주는 것에 보람을 느끼는 분들이 모인 조직을 지향해요.
            </p>
          </div>

          <!-- Card 3: 빠르게 배우고 성장하는 사람 -->
          <div class="daangn-sticky-card" data-index="2" data-label="빠른 학습과 성장">
            <span class="daangn-sticky-card-category">빠르게 배우고 성장하는 사람</span>
            <h3 class="daangn-sticky-card-headline">호기심과 가파른 성장곡선</h3>
            <div class="daangn-sticky-card-media">
              <img src="https://careers-prismic-image-proxy.krrt.io/karrot/ahhmCrK9tuLqEO1Y_%E1%84%89%E1%85%B5%E1%86%AF%E1%84%92%E1%85%A2%E1%86%BC%E1%84%85%E1%85%A7%E1%86%A8_F.png?auto=compress&w=900&fit=max&fm=webp" alt="빠르게 배우고 성장하는 사람" class="daangn-sticky-card-img" />
            </div>
            <div class="daangn-sticky-card-quote">
              “새로운 것을 시도하고 배우는 과정에서 느끼는 즐거움과 뿌듯함이 훨씬 커요” <span class="daangn-sticky-card-author">- 데이터분석팀</span>
            </div>
            <p class="daangn-sticky-card-body">
              편안함을 추구하기보다 늘 '왜?'라고 질문하고 스스로 배우려는 사람들과 함께해요.<br/>
              호기심을 바탕으로 부딪혀 보면서 실패를 하더라도 배움을 얻고, 빠르게 성장하며 가파른 성장 곡선을 그려나가는 사람들의 조직이에요.
            </p>
          </div>

          <!-- Card 4: 주도적으로 몰입하는 사람 -->
          <div class="daangn-sticky-card" data-index="3" data-label="주도적인 몰입">
            <span class="daangn-sticky-card-category">주도적으로 몰입하는 사람</span>
            <h3 class="daangn-sticky-card-headline">스스로 돌파하는 몰입과 에너지</h3>
            <div class="daangn-sticky-card-media">
              <img src="https://careers-prismic-image-proxy.krrt.io/karrot/ahhmDrK9tuLqEO1Z_%E1%84%8B%E1%85%B2%E1%84%8C%E1%85%A5%E1%84%8B%E1%85%B5%E1%86%B7%E1%84%91%E1%85%A2%E1%86%A8%E1%84%90%E1%85%B3_F.png?auto=compress&w=900&fit=max&fm=webp" alt="주도적으로 몰입하는 사람" class="daangn-sticky-card-img" />
            </div>
            <div class="daangn-sticky-card-quote">
              “단순히 해야 하는 일이라서가 아니라, 사용자에게 왜 중요한지 알기에 파고들어요” <span class="daangn-sticky-card-author">- 운영정책팀</span>
            </div>
            <p class="daangn-sticky-card-body">
              누가 시켜서 하는 게 아니라 스스로 답답해서 반드시 해결해 내려는 사람을 말해요.<br/>
              스스로 방향을 찾고 어려운 과제를 두려워하지 않으며, 압도적으로 집중해서 돌파하는 '에너지 레벨'이 높은 동료들과 함께 몰입해요.
            </p>
          </div>

          <!-- Card 5: 개인기를 넘어 팀으로 일하는 사람 -->
          <div class="daangn-sticky-card" data-index="4" data-label="팀으로 일하기">
            <span class="daangn-sticky-card-category">개인기를 넘어 팀으로 일하는 사람</span>
            <h3 class="daangn-sticky-card-headline">경계 없는 원팀의 힘</h3>
            <div class="daangn-sticky-card-media">
              <img src="https://careers-prismic-image-proxy.krrt.io/karrot/ahhl_rK9tuLqEO1U_%E1%84%80%E1%85%A9%E1%86%BC%E1%84%80%E1%85%A2%E1%84%8B%E1%85%AA%E1%84%80%E1%85%A9%E1%86%BC%E1%84%8B%E1%85%B2_F.png?auto=compress&w=900&fit=max&fm=webp" alt="개인기를 넘어 팀으로 일하는 사람" class="daangn-sticky-card-img" />
            </div>
            <div class="daangn-sticky-card-quote">
              “혼자 하는 것보다 서로의 강점을 살려 함께 해결하는 것이 훨씬 빠르고 효율적이에요” <span class="daangn-sticky-card-author">- 중고거래팀</span>
            </div>
            <p class="daangn-sticky-card-body">
              나의 일과 동료의 일을 구분하지 않고 경계 없이 팀을 위해 먼저 나서는 사람을 말해요.<br/>
              뛰어난 개인이 모인 평범한 팀보다, 평범한 개인이 모여 만든 뛰어난 팀을 지향하며 고객의 삶의 문제를 진정성 있게 해결해요.
            </p>
          </div>

          <!-- Card 6: 변화에 유연하게 적응하는 사람 -->
          <div class="daangn-sticky-card" data-index="5" data-label="유연한 적응력">
            <span class="daangn-sticky-card-category">변화에 유연하게 적응하는 사람</span>
            <h3 class="daangn-sticky-card-headline">본질을 지키며 유연하게 찾는 답</h3>
            <div class="daangn-sticky-card-media">
              <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80" alt="변화에 유연하게 적응하는 사람" class="daangn-sticky-card-img" />
            </div>
            <div class="daangn-sticky-card-quote">
              “정답을 외우는 사람보다, 변화의 맥락을 읽고 유연하게 답을 찾아가는 사람이 필요해요” <span class="daangn-sticky-card-author">- CX운영팀</span>
            </div>
            <p class="daangn-sticky-card-body">
              변화가 일상인 지금, 어제의 방식에 갇히지 않고 새로운 문제에 맞게 유연하게 접근해요.<br/>
              AI를 활용해 더 효율적으로 일하며 동시에 AI가 대신할 수 없는 '사람다움'에 집중하여, 어떤 환경에서도 스스로 균형을 찾아 나아갑니다.
            </p>
          </div>

          <!-- Card 7: 서로를 신뢰하며 솔직하게 이야기할 수 있는 사람 -->
          <div class="daangn-sticky-card" data-index="6" data-label="솔직함과 신뢰">
            <span class="daangn-sticky-card-category">서로를 신뢰하며 솔직하게 이야기할 수 있는 사람</span>
            <h3 class="daangn-sticky-card-headline">솔직함과 심리적 안전감</h3>
            <div class="daangn-sticky-card-media">
              <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80" alt="서로를 신뢰하며 솔직하게 이야기할 수 있는 사람" class="daangn-sticky-card-img" />
            </div>
            <div class="daangn-sticky-card-quote">
              “서로를 신뢰하기에 어려운 고민과 피드백도 숨김없이 솔직하게 나눌 수 있어요” <span class="daangn-sticky-card-author">- 피플팀</span>
            </div>
            <p class="daangn-sticky-card-body">
              더 좋은 결정을 위해 적극적으로 치열하게 의견을 나누는 심리적 안전감을 만듭니다.<br/>
              앞에서 할 수 없는 말은 뒤에서도 하지 않으며, 같은 방향을 바라본다는 믿음과 솔직함에서 나오는 단단한 신뢰 문화를 가꾸어 갑니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- TEAM INTRODUCTION SECTION (당근서비스 4대 그룹 소개: Product / Business / Independent / Support) -->
  <section id="team" class="daangn-team-section" style="background-color: #ffffff;">
    <div style="max-width: 1140px; margin: 0 auto; position: relative;">
      <div class="daangn-team-header" style="margin-bottom: 32px;">
        <h2 class="daangn-team-section-title" style="font-size: 34px; font-weight: 800; color: #212124; margin: 0; letter-spacing: -0.5px;">팀 소개</h2>
      </div>

      <!-- 4 Group Cards Grid (서브페이지 기본 이미지 동기화 & 빌더에서 개별 이미지 변경 가능 & 호버 줌) -->
      <div class="daangn-team-groups-grid">
        <!-- 1. Product Group -->
        <a href="/teams/product" class="daangn-team-group-card">
          <img src="https://prismic-image-proxy.krrt.io/karrot/f92b5275-92ec-4ce0-b196-c71dc36239c3_service_01.jpg" alt="Product 그룹 이미지" class="daangn-team-group-card-img" />
          <div class="daangn-team-group-card-overlay"></div>
          <div class="daangn-team-group-card-content">
            <h3 class="daangn-team-group-card-title">Product</h3>
            <p class="daangn-team-group-card-sub">프로덕트 그룹</p>
          </div>
        </a>

        <!-- 2. Business Group -->
        <a href="/teams/business" class="daangn-team-group-card">
          <img src="https://prismic-image-proxy.krrt.io/karrot/10d0e07e-9bcf-48a8-b375-fcd43b533606_service_03.jpg" alt="Business 그룹 이미지" class="daangn-team-group-card-img" />
          <div class="daangn-team-group-card-overlay"></div>
          <div class="daangn-team-group-card-content">
            <h3 class="daangn-team-group-card-title">Business</h3>
            <p class="daangn-team-group-card-sub">사업운영 그룹</p>
          </div>
        </a>

        <!-- 3. Independent Group -->
        <a href="/teams/vertical" class="daangn-team-group-card">
          <img src="https://prismic-image-proxy.krrt.io/karrot/f25a287d-a97e-4040-8b8f-62e616d266bd_service_05.jpg" alt="독립 그룹 이미지" class="daangn-team-group-card-img" />
          <div class="daangn-team-group-card-overlay"></div>
          <div class="daangn-team-group-card-content">
            <h3 class="daangn-team-group-card-title">Independent</h3>
            <p class="daangn-team-group-card-sub">독립 그룹</p>
          </div>
        </a>

        <!-- 4. Management Support Group -->
        <a href="/teams/support" class="daangn-team-group-card">
          <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80" alt="경영지원 그룹 이미지" class="daangn-team-group-card-img" />
          <div class="daangn-team-group-card-overlay"></div>
          <div class="daangn-team-group-card-content">
            <h3 class="daangn-team-group-card-title">Support</h3>
            <p class="daangn-team-group-card-sub">경영지원 그룹</p>
          </div>
        </a>
      </div>
    </div>
  </section>

  <!-- STORIES & NEWS SECTION (인사이드 당근서비스 - 하나씩 넘겨지는 카드) -->
  <section id="inside" class="daangn-stories-section" style="background-color: #ffffff;">
    <div style="max-width: 1140px; margin: 0 auto; position: relative;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px;">
        <div>
          <span style="font-size: 14px; font-weight: 800; color: #FF6F0F; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">INSIDE STORY</span>
          <h2 style="font-size: 38px; font-weight: 800; color: #212124; margin: 0; letter-spacing: -0.5px;">인사이드 당근서비스</h2>
          <p style="font-size: 16px; color: #868B94; margin: 8px 0 0; line-height: 1.5;">따뜻한 경험을 만드는 당근서비스와 구성원의 생생한 성장 이야기를 들려드릴게요.</p>
        </div>
        <a href="/articles" class="daangn-more-link" style="display: inline-flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 600; color: #4D5159; text-decoration: none; transition: color 0.2s;">전체 이야기 보기 ➔</a>
      </div>

      <div class="daangn-stories-carousel">
        <!-- Prev & Next Arrows (하나씩 넘겨지기) -->
        <button id="storiesPrevBtn" class="daangn-carousel-arrow daangn-carousel-arrow-prev" aria-label="이전 이야기">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <button id="storiesNextBtn" class="daangn-carousel-arrow daangn-carousel-arrow-next" aria-label="다음 이야기">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        <!-- Viewport -->
        <div class="daangn-stories-viewport">
          <!-- Track with Story Cards -->
          <div id="storiesTrack" class="daangn-stories-track">
            <!-- Story 1: 새로운 오피스, 그리고 새로운 시작 -->
            <a href="/articles/inside1" class="daangn-story-card" data-article-slug="inside1">
              <div class="daangn-story-img-box">
                <img src="https://opening-attachments.greetinghr.com/2025-10-29/10d70084-3e78-4969-8c59-3e0747a70d94/IMG_2029.jpeg(1).png.webp" alt="새로운 오피스, 그리고 새로운 시작" class="daangn-story-img" />
              </div>
              <div class="daangn-story-info">
                <h4 class="daangn-story-title">새로운 오피스, 그리고 새로운 시작</h4>
                <p class="daangn-story-sub">더 좋은 환경에서 업무에 집중할 수 있도록 시작된 오피스 이전</p>
                <span class="daangn-story-tag">Culture</span>
              </div>
            </a>

            <!-- Story 2: 준비중 -->
            <a href="javascript:void(0)" class="daangn-story-card is-placeholder" data-article-slug="">
              <div class="daangn-story-img-box">
                <img src="/images/article-placeholder.svg" alt="준비중" class="daangn-story-img" />
              </div>
              <div class="daangn-story-info">
                <h4 class="daangn-story-title">준비중</h4>
                <p class="daangn-story-sub">새로운 당근서비스 이야기를 기대해 주세요.</p>
                <span class="daangn-story-tag">준비중</span>
              </div>
            </a>

            <!-- Story 3: 준비중 -->
            <a href="javascript:void(0)" class="daangn-story-card is-placeholder" data-article-slug="">
              <div class="daangn-story-img-box">
                <img src="/images/article-placeholder.svg" alt="준비중" class="daangn-story-img" />
              </div>
              <div class="daangn-story-info">
                <h4 class="daangn-story-title">준비중</h4>
                <p class="daangn-story-sub">새로운 당근서비스 이야기를 기대해 주세요.</p>
                <span class="daangn-story-tag">준비중</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- SEARCH & KEYWORD SECTION (인사이드 당근서비스 하단 배치) -->
  <section style="background-color: #ffffff; padding: 80px 0 120px; text-align: center;">
    <div style="max-width: 1040px; margin: 0 auto; padding: 0 24px;">
      <h2 style="font-size: 44px; font-weight: 800; color: #4D5159; margin-bottom: 24px;">로컬에 <span style="color: #FF6F0F;">중고거래 / 부동산 / 알바 / 커머스</span>를 더하면</h2>
      <p style="font-size: 20px; color: #868B94; line-height: 1.7; max-width: 800px; margin: 0 auto 48px;">
        로컬에 닿는 순간, 모든 것이 개발거리가 됩니다.<br/>
        수천만의 일상을 바꾼 중고거래를 넘어 커뮤니티, 구인구직, 비즈니스, 금융까지<br/>
        끝없이 펼쳐진 하이퍼로컬 인프라, 이 거대한 현장의 빌더를 찾습니다.
      </p>
      <form style="max-width: 700px; margin: 0 auto; display: flex; align-items: center; background: #F2F3F7; border-radius: 40px; padding: 8px 24px; border: 1px solid #EAEBEE;" onsubmit="return false;">
        <input type="text" placeholder="직무, 기술, 주요 업무 등 검색" style="flex: 1; background: transparent; border: none; outline: none; color: #212124; font-size: 18px; padding: 12px 16px; font-family: inherit;" />
        <button type="submit" style="background: #FF6F0F; color: #fff; border: none; border-radius: 24px; padding: 12px 24px; font-weight: 700; font-size: 16px; cursor: pointer; font-family: inherit; transition: background 0.2s;">검색하기</button>
      </form>
    </div>
  </section>

  <!-- GLOBAL FOOTER (공식 Greeting 하단 푸터 디자인) -->
  <footer id="daangnFooter" class="footer__Container-sc-ece516ab-0 eNKNXj daangn-global-footer">
    <div class="footer__FooterInner-sc-ece516ab-2 eYxtUY">
      <div class="sc-kAkozD gVHQgh">
        <div class="sc-kAkozD dRWxSw footer__LinkAndTitleWrapper-sc-ece516ab-1 bUNMpz">
          <div data-testid="클릭_테스트" class="sc-kAkozD dRWxSw">
            <p class="footer-title">당근서비스</p>
            <p class="footer-detail">사업자번호 : 819-88-01473
주소 : 서울시 구로구 디지털로 300, 10층 당근서비스</p>
          </div>
          <ul class="footer__LinkWrapper-sc-ece516ab-3 gDuQAz">
            <li><a href="mailto:contact@daangnservice.com" target="_blank" rel="noopener noreferrer">사용자 문의</a></li>
            <li><a href="mailto:recruit@daangnservice.com" target="_blank" rel="noopener noreferrer">채용 문의</a></li>
          </ul>
        </div>
        <ul class="footer__SnsLinkWrapper-sc-ece516ab-4 jAhMFN">
          <li>
            <a href="https://www.linkedin.com/company/daangnservice/" target="_blank" rel="noopener noreferrer">
              <img alt="sns-icons" loading="lazy" width="36" height="36" decoding="async" data-nimg="1" style="color:transparent" src="https://cdn.greetinghr.com/assets/career/SNS_Linkedin.svg"/>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </footer>

  <!-- FLOATING CAMPAIGN PROMO STICKER (하단 플로팅 스티커 배너) -->
  <div class="daangn-floating-promo" id="daangnFloatingPromo" data-delay-seconds="5">
    <aside data-campaign-promo="" class="daangn-promo-card" data-delay-seconds="5" aria-label="채용 캠페인 안내">
      <div class="daangn-promo-delay-badge">⏱️ 접속 후 <span id="promoDelayDisplay">5</span>초 뒤 노출</div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div class="daangn-promo-header">
          <p class="daangn-promo-title">함께 성장하며 신뢰를 만들어갈
동료를 기다립니다.</p>
          <button data-promo-close="" type="button" aria-label="닫기" class="daangn-promo-close" onclick="var p = document.getElementById('daangnFloatingPromo'); if (p) { p.style.transition = 'opacity 0.25s, transform 0.25s'; p.style.opacity = '0'; p.style.transform = 'scale(0.9) translateY(12px)'; setTimeout(function() { p.style.display = 'none'; }, 260); }">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden="true">
              <path d="M20.7071 4.70711C21.0976 4.31658 21.0976 3.68342 20.7071 3.29289C20.3166 2.90237 19.6834 2.90237 19.2929 3.29289L12 10.5858L4.70711 3.29289C4.31658 2.90237 3.68342 2.90237 3.29289 3.29289C2.90237 3.68342 2.90237 4.31658 3.29289 4.70711L10.5858 12L3.29289 19.2929C2.90237 19.6834 2.90237 20.3166 3.29289 20.7071C3.68342 21.0976 4.31658 21.0976 4.70711 20.7071L12 13.4142L19.2929 20.7071C19.6834 21.0976 20.3166 21.0976 20.7071 20.7071C21.0976 20.3166 21.0976 19.6834 20.7071 19.2929L13.4142 12L20.7071 4.70711Z" fill="currentColor"></path>
            </svg>
          </button>
        </div>
        <p class="daangn-promo-desc">우리는 고객의 목소리에서 더 나은 방향을 찾고, 더 따뜻하고 안전한 연결을 만들어갑니다.</p>
      </div>
      <div class="daangn-promo-bottom">
        <a data-promo-cta="" href="/apply" class="daangn-promo-cta">채용공고 바로가기</a>
        <img src="https://brandnew.daangn.com/static/7-45374badce048137094b93c78a42b270.png" alt="당근 캐릭터" class="daangn-promo-img" />
      </div>
    </aside>
  </div>

</div>

<script>
// ── Hero sticky scroll zoom & text transition (about.daangn.com 스타일) ────
(function() {
  if (typeof window === 'undefined') return;

  var track = document.getElementById('daangnHeroTrack');
  var title1 = document.getElementById('daangnHeroTitle1');
  var videoBox = document.getElementById('daangnHeroVideoBox');
  var scrim = document.getElementById('daangnHeroScrim');
  var title2 = document.getElementById('daangnHeroTitle2');
  var header = document.querySelector('.header__HeaderContainer-sc-bdd24b93-1');

  if (!track || !videoBox) return;

  var ticking = false;

  function updateHeroScroll() {
    var rect = track.getBoundingClientRect();
    var maxScroll = track.offsetHeight - window.innerHeight;
    if (maxScroll <= 0) return;

    var scrolled = -rect.top;
    var p = Math.max(0, Math.min(1, scrolled / maxScroll));

    var winW = window.innerWidth;
    var winH = window.innerHeight;
    var initialW = Math.min(1060, winW - 48);
    var titleH = title1 ? title1.offsetHeight : 160;
    var titleTop = title1 ? title1.offsetTop : 40;
    var initialMarginTop = Math.max(220, titleTop + titleH + 24);
    var initialH = Math.min(520, Math.max(320, winH - initialMarginTop - 40));

    // Phase 1: Expand video (progress: 0.0 -> 0.45)
    var expandT = Math.max(0, Math.min(1, p / 0.45));
    var ease = expandT < 0.5 ? 2 * expandT * expandT : -1 + (4 - 2 * expandT) * expandT;

    var curW = initialW + (winW - initialW) * ease;
    var curH = initialH + (winH - initialH) * ease;
    var curMarginTop = initialMarginTop * (1 - ease);
    var curRadius = 28 * (1 - ease);
    var curShadowOpacity = 0.08 * (1 - ease);

    videoBox.style.width = curW + 'px';
    videoBox.style.height = curH + 'px';
    videoBox.style.marginTop = curMarginTop + 'px';
    videoBox.style.borderRadius = curRadius + 'px';
    videoBox.style.boxShadow = '0 20px 48px rgba(0,0,0,' + curShadowOpacity + ')';
    if (ease >= 0.95) {
      videoBox.style.border = 'none';
    } else {
      videoBox.style.border = '1px solid #EAEBEE';
    }

    // Title 1 fades out and translates upward (progress: 0.0 -> 0.22)
    var t1P = Math.max(0, Math.min(1, p / 0.22));
    if (title1) {
      title1.style.opacity = (1 - t1P);
      title1.style.transform = 'translateY(' + (-40 * t1P) + 'px)';
    }

    // Dark scrim dims video for contrast (progress: 0.15 -> 0.45)
    var scrimP = Math.max(0, Math.min(1, (p - 0.15) / 0.3));
    if (scrim) {
      scrim.style.opacity = (scrimP * 0.45);
    }

    // Title 2 fades in and rises into center (progress: 0.28 -> 0.52)
    var t2P = Math.max(0, Math.min(1, (p - 0.28) / 0.22));
    if (title2) {
      title2.style.opacity = t2P;
      title2.style.transform = 'translateY(' + (32 * (1 - t2P)) + 'px)';
    }

    // Global header adapts to fullscreen video mode
    if (header) {
      if (p > 0.20 && p < 0.98) {
        header.classList.add('is-hero-fullscreen');
      } else {
        header.classList.remove('is-hero-fullscreen');
      }
    }

    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      window.requestAnimationFrame(updateHeroScroll);
      ticking = true;
    }
  }

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick, { passive: true });
  updateHeroScroll();
})();
// ── Questions Carousel Controller (로컬의 질문들 3개 노출 슬라이딩) ────
(function() {
  if (typeof window === 'undefined') return;

  function initQuestionsCarousel() {
    var track = document.getElementById('questionsTrack') || document.getElementById('questions-track');
    var btnPrev = document.getElementById('questionsPrevBtn');
    var btnNext = document.getElementById('questionsNextBtn');
    if (!track) return;

    var currentIndex = 0;

    function getCardStep() {
      var card = track.querySelector('.daangn-question-card') || track.children[0];
      if (!card) return 360;
      var gap = 24;
      return card.offsetWidth + gap;
    }

    function getMaxIndex() {
      var cards = track.querySelectorAll('.daangn-question-card');
      if (!cards.length) cards = track.children;
      var viewport = track.parentElement;
      var viewportWidth = viewport ? viewport.offsetWidth : window.innerWidth;
      var cardStep = getCardStep();
      var visibleCount = Math.max(1, Math.floor((viewportWidth + 24) / cardStep));
      return Math.max(0, cards.length - visibleCount);
    }

    function updateCarousel() {
      var maxIdx = getMaxIndex();
      if (currentIndex > maxIdx) currentIndex = maxIdx;
      if (currentIndex < 0) currentIndex = 0;

      var step = getCardStep();
      track.style.transform = 'translateX(' + (-currentIndex * step) + 'px)';

      if (btnPrev) {
        btnPrev.style.opacity = currentIndex === 0 ? '0.25' : '1';
        btnPrev.style.pointerEvents = currentIndex === 0 ? 'none' : 'auto';
      }
      if (btnNext) {
        btnNext.style.opacity = currentIndex >= maxIdx ? '0.25' : '1';
        btnNext.style.pointerEvents = currentIndex >= maxIdx ? 'none' : 'auto';
      }
    }

    window.questionsCarousel = function(direction) {
      currentIndex += direction;
      updateCarousel();
    };

    if (btnPrev) {
      btnPrev.onclick = function(e) {
        e.preventDefault();
        window.questionsCarousel(-1);
      };
    }
    if (btnNext) {
      btnNext.onclick = function(e) {
        e.preventDefault();
        window.questionsCarousel(1);
      };
    }

    window.addEventListener('resize', updateCarousel);
    setTimeout(updateCarousel, 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuestionsCarousel);
  } else {
    initQuestionsCarousel();
  }
})();

// ── Sticky scroll culture interactive updater (오늘의집 레퍼런스 스타일) ────
(function() {
  if (typeof window === 'undefined') return;
  window.scrollToStickyCard = function(idx) {
    var cards = document.querySelectorAll('.daangn-sticky-card');
    if (cards[idx]) {
      var top = cards[idx].getBoundingClientRect().top + window.pageYOffset - 130;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  };

  function updateSticky() {
    var cards = document.querySelectorAll('.daangn-sticky-card');
    var items = document.querySelectorAll('.sticky-value-item');
    var descBox = document.getElementById('stickyDescBox');
    var list = document.getElementById('stickyValueList');
    if (!cards.length) return;

    // Dynamically sync titles from cards to left navigation items
    if (list) {
      if (items.length !== cards.length) {
        list.innerHTML = '';
        cards.forEach(function(card, idx) {
          var titleElem = card.querySelector('.daangn-sticky-card-title');
          var label = titleElem ? titleElem.textContent.trim() : (card.getAttribute('data-label') || ('가치 ' + (idx + 1)));
          var item = document.createElement('div');
          item.className = 'sticky-value-item' + (idx === 0 ? ' is-active' : '');
          item.setAttribute('data-index', idx);
          item.textContent = label;
          item.onclick = function() { scrollToStickyCard(idx); };
          list.appendChild(item);
        });
        items = list.querySelectorAll('.sticky-value-item');
      } else {
        cards.forEach(function(card, idx) {
          var titleElem = card.querySelector('.daangn-sticky-card-title');
          if (titleElem && items[idx]) {
            items[idx].textContent = titleElem.textContent.trim();
          }
        });
      }
    }

    var activeIdx = 0;
    var triggerY = window.innerHeight * 0.45;

    cards.forEach(function(card, i) {
      var r = card.getBoundingClientRect();
      if (r.top <= triggerY) {
        activeIdx = i;
      }
    });

    items.forEach(function(item, i) {
      if (i === activeIdx) {
        item.classList.add('is-active');
      } else {
        item.classList.remove('is-active');
      }
    });

    if (descBox && cards[activeIdx]) {
      var descElem = cards[activeIdx].querySelector('.daangn-sticky-card-desc');
      var sub = descElem ? descElem.textContent.trim() : (cards[activeIdx].getAttribute('data-sub') || '');
      if (sub && descBox.textContent.trim() !== sub) {
        descBox.style.opacity = '0';
        descBox.style.transform = 'translateY(4px)';
        setTimeout(function() {
          descBox.textContent = sub;
          descBox.style.opacity = '1';
          descBox.style.transform = 'translateY(0)';
        }, 150);
      }
    }
  }

  window.addEventListener('scroll', updateSticky, { passive: true });
  window.addEventListener('resize', updateSticky, { passive: true });
  updateSticky();
})();

// ── Team Carousel Controller (팀 소개 3개 노출 슬라이딩) ─────────
(function() {
  if (typeof window === 'undefined') return;

  function initTeamCarousel() {
    var track = document.getElementById('teamTrack');
    var btnPrev = document.getElementById('teamPrevBtn');
    var btnNext = document.getElementById('teamNextBtn');
    if (!track || !btnNext) return;

    var currentIndex = 0;

    function getCardStep() {
      var card = track.querySelector('.daangn-team-card');
      if (!card) return 360;
      var gap = 24;
      return card.offsetWidth + gap;
    }

    function getMaxIndex() {
      var cards = track.querySelectorAll('.daangn-team-card');
      var viewport = track.parentElement;
      var viewportWidth = viewport ? viewport.offsetWidth : window.innerWidth;
      var cardStep = getCardStep();
      var visibleCount = Math.max(1, Math.floor((viewportWidth + 24) / cardStep));
      return Math.max(0, cards.length - visibleCount);
    }

    function updateCarousel() {
      var maxIdx = getMaxIndex();
      if (currentIndex > maxIdx) currentIndex = maxIdx;
      if (currentIndex < 0) currentIndex = 0;

      var step = getCardStep();
      track.style.transform = 'translateX(' + (-currentIndex * step) + 'px)';

      if (btnPrev) {
        btnPrev.style.opacity = currentIndex === 0 ? '0.25' : '1';
        btnPrev.style.pointerEvents = currentIndex === 0 ? 'none' : 'auto';
      }
      if (btnNext) {
        btnNext.style.opacity = currentIndex >= maxIdx ? '0.25' : '1';
        btnNext.style.pointerEvents = currentIndex >= maxIdx ? 'none' : 'auto';
      }
    }

    window.slideTeams = function(direction) {
      currentIndex += direction;
      updateCarousel();
    };

    if (btnPrev) {
      btnPrev.onclick = function(e) {
        e.preventDefault();
        window.slideTeams(-1);
      };
    }
    if (btnNext) {
      btnNext.onclick = function(e) {
        e.preventDefault();
        window.slideTeams(1);
      };
    }

    window.addEventListener('resize', updateCarousel);
    setTimeout(updateCarousel, 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTeamCarousel);
  } else {
    initTeamCarousel();
  }
})();

// ── Stories Carousel Controller (소식과 이야기 하나씩 넘겨지기) ────
(function() {
  if (typeof window === 'undefined') return;

  function initStoriesCarousel() {
    var track = document.getElementById('storiesTrack');
    var btnPrev = document.getElementById('storiesPrevBtn');
    var btnNext = document.getElementById('storiesNextBtn');
    if (!track || !btnNext) return;

    var currentIndex = 0;

    function getCardStep() {
      var card = track.querySelector('.daangn-story-card');
      if (!card) return 360;
      var gap = 24;
      return card.offsetWidth + gap;
    }

    function getMaxIndex() {
      var cards = track.querySelectorAll('.daangn-story-card');
      var viewport = track.parentElement;
      var viewportWidth = viewport ? viewport.offsetWidth : window.innerWidth;
      var cardStep = getCardStep();
      var visibleCount = Math.max(1, Math.floor((viewportWidth + 24) / cardStep));
      return Math.max(0, cards.length - visibleCount);
    }

    function updateCarousel() {
      var maxIdx = getMaxIndex();
      if (currentIndex > maxIdx) currentIndex = maxIdx;
      if (currentIndex < 0) currentIndex = 0;

      var step = getCardStep();
      track.style.transform = 'translateX(' + (-currentIndex * step) + 'px)';

      if (btnPrev) {
        btnPrev.style.display = maxIdx === 0 ? 'none' : '';
        btnPrev.style.opacity = currentIndex === 0 ? '0.25' : '1';
        btnPrev.style.pointerEvents = currentIndex === 0 ? 'none' : 'auto';
      }
      if (btnNext) {
        btnNext.style.display = maxIdx === 0 ? 'none' : '';
        btnNext.style.opacity = currentIndex >= maxIdx ? '0.25' : '1';
        btnNext.style.pointerEvents = currentIndex >= maxIdx ? 'none' : 'auto';
      }
    }

    window.slideStories = function(direction) {
      currentIndex += direction;
      updateCarousel();
    };

    if (btnPrev) {
      btnPrev.onclick = function(e) {
        e.preventDefault();
        window.slideStories(-1);
      };
    }
    if (btnNext) {
      btnNext.onclick = function(e) {
        e.preventDefault();
        window.slideStories(1);
      };
    }

    window.addEventListener('resize', updateCarousel);
    setTimeout(updateCarousel, 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStoriesCarousel);
  } else {
    initStoriesCarousel();
  }
})();

// ── Floating Campaign Promo Timer Controller (지연 시간 후 부드럽게 노출) ────
(function() {
  if (typeof window === 'undefined') return;

  function initPromoTimer() {
    var promo = document.getElementById('daangnFloatingPromo') || document.querySelector('.daangn-floating-promo');
    if (!promo) return;

    var delayAttr = promo.getAttribute('data-delay-seconds');
    var card = promo.querySelector('[data-campaign-promo]') || promo.querySelector('.daangn-promo-card');
    if (!delayAttr && card) {
      delayAttr = card.getAttribute('data-delay-seconds');
    }

    var delaySec = parseFloat(delayAttr);
    if (isNaN(delaySec) || delaySec < 0) {
      delaySec = 5; // Default 5 seconds
    }

    setTimeout(function() {
      if (promo && promo.style.display !== 'none') {
        promo.classList.add('is-visible');
      }
    }, Math.round(delaySec * 1000));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPromoTimer);
  } else {
    initPromoTimer();
  }
})();

// ── Header Dropdown Submenu Click & Outside Click Controller ─────
(function() {
  if (typeof window === 'undefined') return;

  function initHeaderDropdowns() {
    var groups = document.querySelectorAll('.header-menu-item-group');
    if (!groups.length) return;

    groups.forEach(function(group) {
      var btn = group.querySelector('.header-dropdown-trigger');
      if (!btn) return;

      btn.onclick = function(e) {
        e.stopPropagation();
        var wasOpen = group.classList.contains('is-open');
        groups.forEach(function(g) { g.classList.remove('is-open'); });
        if (!wasOpen) {
          group.classList.add('is-open');
        }
      };
    });

    document.addEventListener('click', function(e) {
      if (!e.target.closest || !e.target.closest('.header-menu-item-group')) {
        groups.forEach(function(g) { g.classList.remove('is-open'); });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderDropdowns);
  } else {
    initHeaderDropdowns();
  }
})();
</script>`.trim();
}

function normalizePath(p) {
  if (!p) return '/';
  let clean = p.trim();
  if (!clean.startsWith('/')) clean = '/' + clean;
  if (clean.length > 1 && clean.endsWith('/')) clean = clean.slice(0, -1);
  return clean;
}

function savePageDraft({ versionName, html, css, componentsJson, seoTitle, seoDescription, faviconUrl, pagePath = '/', pageName = '메인 페이지' }) {
  const normalizedPath = normalizePath(pagePath);
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO pages (version_name, page_path, page_name, html, css, components_json, seo_title, seo_description, favicon_url, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);
    stmt.run(
      versionName || `임시 저장 (${new Date().toLocaleString('ko-KR')})`,
      normalizedPath,
      pageName || (normalizedPath === '/' ? '메인 페이지' : normalizedPath),
      html,
      css,
      componentsJson || '{}',
      seoTitle || '당근서비스 채용',
      seoDescription || '당근서비스에 합류하세요.',
      faviconUrl || '/images/favicon-192.png',
      function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, pagePath: normalizedPath });
      }
    );
  });
}

function publishPage(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT page_path FROM pages WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      const targetPath = (row && row.page_path) ? normalizePath(row.page_path) : '/';
      db.serialize(() => {
        db.run('UPDATE pages SET is_published = 0 WHERE page_path = ?', [targetPath], (err2) => {
          if (err2) return reject(err2);
          db.run('UPDATE pages SET is_published = 1 WHERE id = ?', [id], (err3) => {
            if (err3) return reject(err3);
            db.get('SELECT * FROM pages WHERE id = ?', [id], (err4, updatedPage) => {
              if (err4) return reject(err4);
              resolve({ success: true, pagePath: targetPath, page: updatedPage });
            });
          });
        });
      });
    });
  });
}

function rollbackPage(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM pages WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error('해당 버전을 찾을 수 없습니다.'));

      const targetPath = normalizePath(row.page_path || '/');
      const rollbackVersionName = `[롤백 배포] #${row.id} 버전 복원 (${new Date().toLocaleDateString('ko-KR')} ${new Date().toLocaleTimeString('ko-KR')})`;

      db.serialize(() => {
        db.run('UPDATE pages SET is_published = 0 WHERE page_path = ?', [targetPath], (err2) => {
          if (err2) return reject(err2);

          const stmt = db.prepare(`
            INSERT INTO pages (version_name, page_path, page_name, html, css, components_json, seo_title, seo_description, favicon_url, is_published)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          `);
          stmt.run(
            rollbackVersionName,
            targetPath,
            row.page_name || (targetPath === '/' ? '메인 페이지' : targetPath),
            row.html,
            row.css,
            row.components_json || '{}',
            row.seo_title || '당근서비스 채용',
            row.seo_description || '당근서비스에 합류하세요.',
            row.favicon_url || '/images/favicon-192.png',
            function (err3) {
              if (err3) return reject(err3);
              const newId = this.lastID;
              db.get('SELECT * FROM pages WHERE id = ?', [newId], (err4, newRow) => {
                if (err4) return reject(err4);
                resolve({ success: true, pagePath: targetPath, page: newRow });
              });
            }
          );
        });
      });
    });
  });
}

function getPublishedPage(pagePath = '/') {
  const normalizedPath = normalizePath(pagePath);
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM pages WHERE page_path = ? AND is_published = 1 ORDER BY id DESC LIMIT 1', [normalizedPath], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function getLatestPage(pagePath = '/') {
  const normalizedPath = normalizePath(pagePath);
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM pages WHERE page_path = ? AND is_published = 1 ORDER BY id DESC LIMIT 1', [normalizedPath], (err, pubRow) => {
      if (err) return reject(err);
      if (!pubRow) {
        return db.get('SELECT * FROM pages WHERE page_path = ? ORDER BY id DESC LIMIT 1', [normalizedPath], (err2, row2) => {
          if (err2) reject(err2);
          else resolve(row2);
        });
      }
      db.get('SELECT * FROM pages WHERE page_path = ? AND id > ? ORDER BY id DESC LIMIT 1', [normalizedPath, pubRow.id], (err3, draftRow) => {
        if (err3) return reject(err3);
        resolve(draftRow || pubRow);
      });
    });
  });
}

function getAllPages() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT p1.id, p1.page_path, p1.page_name, p1.seo_title, p1.is_published, p1.created_at
      FROM pages p1
      INNER JOIN (
        SELECT page_path, MAX(id) as max_id
        FROM pages
        GROUP BY page_path
      ) p2 ON p1.id = p2.max_id
      ORDER BY CASE WHEN p1.page_path = '/' THEN 0 ELSE 1 END, p1.id ASC
    `;
    db.all(sql, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function getAllVersions(pagePath = '/') {
  const normalizedPath = normalizePath(pagePath);
  return new Promise((resolve, reject) => {
    db.all('SELECT id, version_name, seo_title, favicon_url, is_published, created_at, page_path, page_name FROM pages WHERE page_path = ? ORDER BY id DESC', [normalizedPath], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getVersionById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM pages WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function createSubPage({ pageName, pagePath, templateType = 'group' }) {
  const normalized = normalizePath(pagePath);
  return new Promise(async (resolve, reject) => {
    try {
      const existing = await getLatestPage(normalized);
      if (existing) {
        return reject(new Error('이미 존재하는 페이지 경로(URL)입니다.'));
      }

      let html = '';
      if (templateType === 'apply') {
        html = getApplyTemplateHtml();
      } else if (templateType === 'process') {
        html = getProcessTemplateHtml();
      } else if (templateType === 'group') {
        const badgeName = pageName.replace(/그룹.*/, '').trim() || 'Team';
        html = getGroupTemplateHtml({
          groupBadge: `${badgeName} Group`,
          groupTitle: `당근서비스의<br/>${pageName}을 소개해요.`,
          groupQuote: `“우리는 기술과 데이터로 동네 이웃의 따뜻한 연결을 가장 안전하고 편리하게 완성합니다.”`,
          teams: [
            { name: `${badgeName} 1팀은~`, desc: '핵심 서비스의 안정적인 운영과 최고의 사용자 경험을 설계하고 지원해요.' },
            { name: `${badgeName} 2팀은~`, desc: '고객의 목소리를 경청하여 서비스의 신뢰도를 높이고 개선 사항을 빠르게 적용해요.' },
            { name: `${badgeName} 3팀은~`, desc: '동네 이웃과 소상공인이 함께 상생하는 건강한 로컬 생태계를 구축해요.' }
          ],
          crossLinks: [
            { text: '메인 페이지 바로가기', href: '/' }
          ]
        });
      } else {
        html = getBlankTemplateHtml({ pageName });
      }

      const css = getOfficialCss();
      const seoTitle = `${pageName} - 당근서비스 채용`;
      const seoDescription = `당근서비스 ${pageName}을 소개합니다.`;

      const stmt = db.prepare(`
        INSERT INTO pages (version_name, page_path, page_name, html, css, components_json, seo_title, seo_description, favicon_url, is_published)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `);
      stmt.run(
        `최초 생성 (${pageName})`,
        normalized,
        pageName,
        html,
        css,
        '{}',
        seoTitle,
        seoDescription,
        '/images/favicon-192.png',
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, pagePath: normalized, pageName });
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

function updatePageSettings({ oldPath, newPath, pageName }) {
  const oldNorm = normalizePath(oldPath);
  const newNorm = normalizePath(newPath);
  return new Promise((resolve, reject) => {
    if (oldNorm === '/' && newNorm !== '/') {
      return reject(new Error('메인 페이지(/)의 URL 경로는 변경할 수 없습니다.'));
    }
    db.run('UPDATE pages SET page_path = ?, page_name = ? WHERE page_path = ?', [newNorm, pageName, oldNorm], function(err) {
      if (err) reject(err);
      else resolve({ success: true, changes: this.changes });
    });
  });
}

function deletePage(pagePath) {
  const normalized = normalizePath(pagePath);
  return new Promise((resolve, reject) => {
    if (normalized === '/') {
      return reject(new Error('메인 페이지는 삭제할 수 없습니다.'));
    }
    db.run('DELETE FROM pages WHERE page_path = ?', [normalized], function(err) {
      if (err) reject(err);
      else resolve({ success: true, changes: this.changes });
    });
  });
}

function getGroupTemplateHtml({
  groupBadge = 'Product Group',
  groupTitle = '당근서비스의<br/>프로덕트 그룹을 소개해요.',
  groupImg = 'https://prismic-image-proxy.krrt.io/karrot/f92b5275-92ec-4ce0-b196-c71dc36239c3_service_01.jpg',
  groupQuote = '“그룹장이 본인 그룹을 소개하는 코멘트 한 줄”',
  teams = [
    { name: '중고거래는~', desc: '안전하고 원활한 중고거래를 지원하며, 거래 과정의 피해를 예방해 누구나 안심하고 거래할 수 있는 환경을 만들어요.' },
    { name: '커뮤니티는~', desc: '온·오프라인 모임과 동네생활을 통해 이웃 간 더욱 따뜻하고 활발한 교류가 이루어질 수 있도록 소통 공간을 운영해요.' },
    { name: '분쟁조정은~', desc: '이웃 간 거래나 서비스 이용 중 생기는 분쟁을 공정하고 신속하게 중재하여 신뢰의 온도를 지켜요.' },
    { name: '바로구매는~', desc: '채팅 없이도 빠르고 간편하게 결제하고 거래할 수 있는 새로운 중고거래 경험을 구축해요.' },
    { name: '대외민원운영팀은~', desc: '고객의 중요한 문의와 대외 기관 협업 이슈를 신속하고 정확하게 대응하여 서비스 신뢰를 보장해요.' }
  ],
  crossLinks = [
    { text: '사업운영그룹 소개 바로가기', href: '/teams/business' },
    { text: '독립 그룹 소개 바로가기', href: '/teams/vertical' }
  ]
} = {}) {
  const teamsHtml = teams.map(t => `
        <div class="daangn-group-team-item">
          <h3 class="daangn-group-team-name">${t.name}</h3>
          <p class="daangn-group-team-desc">${t.desc}</p>
        </div>`).join('\n');

  const linksHtml = crossLinks.map(l => `
        <a href="${l.href}" class="daangn-group-nav-link">
          <span>${l.text}</span>
          <span class="arrow">&gt;</span>
        </a>`).join('\n');

  return `<div class="daangn-official-wrapper" style="background-color: #ffffff; color: #212124; font-family: 'KarrotSans', 'Pretendard', sans-serif;">
  <!-- GLOBAL HEADER -->
  <header id="daangnHeader" class="header__HeaderContainer-sc-bdd24b93-1 base-header-styles__CustomHeader-sc-eefa7522-0">
    <div class="header__HeaderInnerContainer-sc-bdd24b93-2">
      <a href="/" class="header-link-wrapper">
        <div class="header__LogoWrapper-sc-bdd24b93-3">
          <img alt="당근서비스 로고" src="/images/daangn-service-logo.png" />
        </div>
      </a>
      <div class="mobile-view__MobileView-sc-bb2ed92c-0 hossQr">
        <button data-testid="모바일_메뉴_버튼" type="button" aria-label="모바일 메뉴 열기" class="header__MobileMenuButtonStyled-sc-bdd24b93-4" onclick="var m = document.querySelector('.mobile-view__MobileView-sc-bb2ed92c-0.gJVwBD'); if (m) m.classList.toggle('is-open');">
          <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
            <path clip-rule="evenodd" d="M3 5.5H21V7.5H3V5.5ZM3 11H21V13H3V11ZM21 16.5H3V18.5H21V16.5Z" fill="#222222" fill-rule="evenodd"></path>
          </svg>
        </button>
      </div>
      <div class="mobile-view__MobileView-sc-bb2ed92c-0 gJVwBD">
        <div class="kCDZmt" style="display: flex; align-items: center; gap: 16px;">
          <a rel="noreferrer" href="/" class="header-link-wrapper">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU" name="홈">
              <span class="sc-aYaIB gigtVE">홈</span>
            </button>
          </a>
          <div class="header-menu-item-group">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU header-dropdown-trigger">
              <span class="sc-aYaIB gigtVE">팀 소개</span>
              <svg class="header-chevron-icon" viewBox="0 0 16 16" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="header-dropdown-menu">
              <a href="/teams/product" class="header-dropdown-item">프로덕트</a>
              <a href="/teams/business" class="header-dropdown-item">사업운영</a>
              <a href="/teams/vertical" class="header-dropdown-item">독립</a>
              <a href="/teams/support" class="header-dropdown-item">경영지원</a>
            </div>
          </div>
          <div class="header-menu-item-group">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU header-dropdown-trigger">
              <span class="sc-aYaIB gigtVE">콘텐츠</span>
              <svg class="header-chevron-icon" viewBox="0 0 16 16" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="header-dropdown-menu">
              <a href="/articles" class="header-dropdown-item">전체 이야기</a>
              <a href="/articles" class="header-dropdown-item">Culture</a>
              <a href="/articles" class="header-dropdown-item">People</a>
              <a href="/articles" class="header-dropdown-item">CX</a>
            </div>
          </div>
          <div class="header-menu-item-group">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU header-dropdown-trigger">
              <span class="sc-aYaIB gigtVE">채용 절차</span>
              <svg class="header-chevron-icon" viewBox="0 0 16 16" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="header-dropdown-menu">
              <a href="/process#process" class="header-dropdown-item">프로세스</a>
              <a href="/process#faq" class="header-dropdown-item">자주묻는질문</a>
            </div>
          </div>
          <!-- 5. 채용 공고 (버튼) -->
          <a rel="noreferrer" href="/apply" class="header-link-wrapper">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cbRJON" name="채용 공고">
              <span class="sc-aYaIB gigtVE">채용 공고</span>
            </button>
          </a>
        </div>
      </div>
    </div>
  </header>

  <!-- GROUP SUB-PAGE MAIN -->
  <main class="daangn-group-page-main">
    <div class="daangn-group-container">
      <div class="daangn-group-badge">${groupBadge}</div>
      <h1 class="daangn-group-title">${groupTitle}</h1>

      <div class="daangn-group-hero-media">
        <img src="${groupImg}" alt="${groupBadge}" class="daangn-group-hero-img" />
      </div>

      <blockquote class="daangn-group-quote">
        ${groupQuote}
      </blockquote>

      <div class="daangn-group-teams-section">
${teamsHtml}
      </div>

      <div class="daangn-group-nav-links">
${linksHtml}
      </div>
    </div>
  </main>

  <!-- GLOBAL FOOTER (공식 Greeting 하단 푸터 디자인) -->
  <footer id="daangnFooter" class="footer__Container-sc-ece516ab-0 eNKNXj daangn-global-footer">
    <div class="footer__FooterInner-sc-ece516ab-2 eYxtUY">
      <div class="sc-kAkozD gVHQgh">
        <div class="sc-kAkozD dRWxSw footer__LinkAndTitleWrapper-sc-ece516ab-1 bUNMpz">
          <div data-testid="클릭_테스트" class="sc-kAkozD dRWxSw">
            <p class="footer-title">당근서비스</p>
            <p class="footer-detail">사업자번호 : 819-88-01473
주소 : 서울시 구로구 디지털로 300, 10층 당근서비스</p>
          </div>
          <ul class="footer__LinkWrapper-sc-ece516ab-3 gDuQAz">
            <li><a href="mailto:contact@daangnservice.com" target="_blank" rel="noopener noreferrer">사용자 문의</a></li>
            <li><a href="mailto:recruit@daangnservice.com" target="_blank" rel="noopener noreferrer">채용 문의</a></li>
          </ul>
        </div>
        <ul class="footer__SnsLinkWrapper-sc-ece516ab-4 jAhMFN">
          <li>
            <a href="https://www.linkedin.com/company/daangnservice/" target="_blank" rel="noopener noreferrer">
              <img alt="sns-icons" loading="lazy" width="36" height="36" decoding="async" data-nimg="1" style="color:transparent" src="https://cdn.greetinghr.com/assets/career/SNS_Linkedin.svg"/>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </footer>
</div>`.trim();
}

function getBlankTemplateHtml({ pageName = '새 페이지' } = {}) {
  return `<div class="daangn-official-wrapper" style="background-color: #ffffff; color: #212124; font-family: 'KarrotSans', 'Pretendard', sans-serif;">
  <header id="daangnHeader" class="header__HeaderContainer-sc-bdd24b93-1 base-header-styles__CustomHeader-sc-eefa7522-0">
    <div class="header__HeaderInnerContainer-sc-bdd24b93-2">
      <a href="/" class="header-link-wrapper">
        <div class="header__LogoWrapper-sc-bdd24b93-3">
          <img alt="당근서비스 로고" src="/images/daangn-service-logo.png" />
        </div>
      </a>
      <div class="mobile-view__MobileView-sc-bb2ed92c-0 gJVwBD">
        <div class="kCDZmt" style="display: flex; align-items: center; gap: 16px;">
          <a rel="noreferrer" href="/" class="header-link-wrapper">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU" name="홈">
              <span class="sc-aYaIB gigtVE">홈</span>
            </button>
          </a>
          <a rel="noreferrer" href="/teams/product" class="header-link-wrapper">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU" name="팀 소개">
              <span class="sc-aYaIB gigtVE">팀 소개</span>
            </button>
          </a>
          <a rel="noreferrer" href="/articles" class="header-link-wrapper">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU" name="콘텐츠">
              <span class="sc-aYaIB gigtVE">콘텐츠</span>
            </button>
          </a>
        </div>
      </div>
    </div>
  </header>

  <main style="padding: 100px 24px; max-width: 960px; margin: 0 auto; min-height: 60vh;">
    <h1 style="font-size: 40px; font-weight: 800; margin-bottom: 20px;">${pageName}</h1>
    <p style="font-size: 18px; color: #868B94; line-height: 1.6;">여기에서 원하는 콘텐츠와 블록을 자유롭게 빌더로 추가하고 수정하세요.</p>
  </main>

  <!-- GLOBAL FOOTER (공식 Greeting 하단 푸터 디자인) -->
  <footer id="daangnFooter" class="footer__Container-sc-ece516ab-0 eNKNXj daangn-global-footer">
    <div class="footer__FooterInner-sc-ece516ab-2 eYxtUY">
      <div class="sc-kAkozD gVHQgh">
        <div class="sc-kAkozD dRWxSw footer__LinkAndTitleWrapper-sc-ece516ab-1 bUNMpz">
          <div data-testid="클릭_테스트" class="sc-kAkozD dRWxSw">
            <p class="footer-title">당근서비스</p>
            <p class="footer-detail">사업자번호 : 819-88-01473
주소 : 서울시 구로구 디지털로 300, 10층 당근서비스</p>
          </div>
          <ul class="footer__LinkWrapper-sc-ece516ab-3 gDuQAz">
            <li><a href="mailto:contact@daangnservice.com" target="_blank" rel="noopener noreferrer">사용자 문의</a></li>
            <li><a href="mailto:recruit@daangnservice.com" target="_blank" rel="noopener noreferrer">채용 문의</a></li>
          </ul>
        </div>
        <ul class="footer__SnsLinkWrapper-sc-ece516ab-4 jAhMFN">
          <li>
            <a href="https://www.linkedin.com/company/daangnservice/" target="_blank" rel="noopener noreferrer">
              <img alt="sns-icons" loading="lazy" width="36" height="36" decoding="async" data-nimg="1" style="color:transparent" src="https://cdn.greetinghr.com/assets/career/SNS_Linkedin.svg"/>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </footer>
</div>`.trim();
}

function getProcessTemplateHtml() {
  return `<div class="daangn-official-wrapper" style="background-color: #ffffff; color: #212124; font-family: 'KarrotSans', 'Pretendard', sans-serif;">
  <!-- GLOBAL HEADER -->
  <header id="daangnHeader" class="header__HeaderContainer-sc-bdd24b93-1 base-header-styles__CustomHeader-sc-eefa7522-0">
    <div class="header__HeaderInnerContainer-sc-bdd24b93-2">
      <a href="/" class="header-link-wrapper">
        <div class="header__LogoWrapper-sc-bdd24b93-3">
          <img alt="당근서비스 로고" src="/images/daangn-service-logo.png" />
        </div>
      </a>
      <div class="mobile-view__MobileView-sc-bb2ed92c-0 hossQr">
        <button data-testid="모바일_메뉴_버튼" type="button" aria-label="모바일 메뉴 열기" class="header__MobileMenuButtonStyled-sc-bdd24b93-4" onclick="var m = document.querySelector('.mobile-view__MobileView-sc-bb2ed92c-0.gJVwBD'); if (m) m.classList.toggle('is-open');">
          <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
            <path clip-rule="evenodd" d="M3 5.5H21V7.5H3V5.5ZM3 11H21V13H3V11ZM21 16.5H3V18.5H21V16.5Z" fill="#222222" fill-rule="evenodd"></path>
          </svg>
        </button>
      </div>
      <div class="mobile-view__MobileView-sc-bb2ed92c-0 gJVwBD">
        <div class="kCDZmt" style="display: flex; align-items: center; gap: 16px;">
          <a rel="noreferrer" href="/" class="header-link-wrapper">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU" name="홈">
              <span class="sc-aYaIB gigtVE">홈</span>
            </button>
          </a>
          <div class="header-menu-item-group">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU header-dropdown-trigger">
              <span class="sc-aYaIB gigtVE">팀 소개</span>
              <svg class="header-chevron-icon" viewBox="0 0 16 16" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="header-dropdown-menu">
              <a href="/teams/product" class="header-dropdown-item">프로덕트</a>
              <a href="/teams/business" class="header-dropdown-item">사업운영</a>
              <a href="/teams/vertical" class="header-dropdown-item">독립</a>
              <a href="/teams/support" class="header-dropdown-item">경영지원</a>
            </div>
          </div>
          <div class="header-menu-item-group">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU header-dropdown-trigger">
              <span class="sc-aYaIB gigtVE">콘텐츠</span>
              <svg class="header-chevron-icon" viewBox="0 0 16 16" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="header-dropdown-menu">
              <a href="/articles" class="header-dropdown-item">전체 이야기</a>
              <a href="/articles" class="header-dropdown-item">Culture</a>
              <a href="/articles" class="header-dropdown-item">People</a>
              <a href="/articles" class="header-dropdown-item">CX</a>
            </div>
          </div>
          <div class="header-menu-item-group is-active">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU header-dropdown-trigger">
              <span class="sc-aYaIB gigtVE" style="color: #FF6F0F; font-weight: 800;">채용 절차</span>
              <svg class="header-chevron-icon" viewBox="0 0 16 16" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="#FF6F0F" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="header-dropdown-menu">
              <a href="/process#process" class="header-dropdown-item">프로세스</a>
              <a href="/process#faq" class="header-dropdown-item">자주묻는질문</a>
            </div>
          </div>
          <!-- 5. 채용 공고 (버튼) -->
          <a rel="noreferrer" href="/apply" class="header-link-wrapper">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cbRJON" name="채용 공고">
              <span class="sc-aYaIB gigtVE">채용 공고</span>
            </button>
          </a>
        </div>
      </div>
    </div>
  </header>

  <!-- PROCESS & FAQ SUB-PAGE MAIN -->
  <main class="daangn-process-page-main">
    <div class="daangn-process-container">
      
      <!-- 1. 합류 여정 (프로세스) -->
      <section id="process" class="daangn-process-section">
        <div class="daangn-process-header">
          <h1 class="daangn-process-title">당근서비스 합류 여정</h1>
        </div>

        <div class="daangn-process-tracks">
          
          <!-- Track 1: CX Specialist (계약직) -->
          <div class="daangn-process-track-item">
            <div class="daangn-process-track-img">
              <img src="/images/process-cxs.png" alt="CX Specialist (계약직) 합류 여정" loading="lazy" />
            </div>
            <div class="daangn-process-toggle-bar">
              <button type="button" class="daangn-process-toggle-btn">
                <span>더보기</span>
                <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
            <div class="daangn-process-detail">
              <div class="daangn-process-detail-inner">
                <div class="daangn-process-detail-step">
                  <h4>01 서류 전형</h4>
                  <p>- 이력서는 본인의 역량과 성장 가능성을 구체적으로 알아볼 수 있는 자료로 자유롭게 작성해 주세요.</p>
                  <p>- 폰트 깨짐 등의 문제가 발생할 수 있으니 문서 형식은 PDF 파일로 변환하여 업로드해 주세요.</p>
                </div>
                <div class="daangn-process-detail-step">
                  <h4>02 직무/컬처핏 통합 인터뷰</h4>
                  <p>- 직무 적합도와 경험을 바탕으로 당근서비스와 잘 어울릴 수 있는 분인지 서로의 가치관과 생각에 대해 이야기를 나눠요.</p>
                  <p>- 대면으로 진행되며, 업무 연관성이 높은 당근서비스 구성원이 참석하여 최대 1시간 동안 이야기를 나눠요.</p>
                </div>
                <div class="daangn-process-detail-step">
                  <h4>03 최종 합격 및 입사</h4>
                  <p>- 최종 합격 소식과 함께, 합류 일자 조율 후 입사 안내사항을 전달드려요.</p>
                </div>
              </div>
            </div>
            <hr class="daangn-process-divider" />
          </div>

          <!-- Track 2: CX Professional (정규직) -->
          <div class="daangn-process-track-item">
            <div class="daangn-process-track-img">
              <img src="/images/process-cxp.png" alt="CX Professional (정규직) 합류 여정" loading="lazy" />
            </div>
            <div class="daangn-process-toggle-bar">
              <button type="button" class="daangn-process-toggle-btn">
                <span>더보기</span>
                <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
            <div class="daangn-process-detail">
              <div class="daangn-process-detail-inner">
                <div class="daangn-process-detail-step">
                  <h4>01 서류 전형</h4>
                  <p>- 이력서는 본인의 역량과 성장 가능성을 구체적으로 알아볼 수 있는 자료로 자유롭게 작성해 주세요.</p>
                  <p>- 폰트 깨짐 등의 문제가 발생할 수 있으니 문서 형식은 PDF 파일로 변환하여 업로드해 주세요.</p>
                </div>
                <div class="daangn-process-detail-step">
                  <h4>02 1차 직무 인터뷰</h4>
                  <p>- 직무 적합도와 경험에 대한 이야기를 나누는 시간을 가져요.</p>
                  <p>- 대면으로 진행되며, 업무 연관성이 높은 당근서비스 구성원이 참석하여 약 1시간 동안 이야기를 나눠요.</p>
                </div>
                <div class="daangn-process-detail-step">
                  <h4>03 2차 컬처핏 인터뷰</h4>
                  <p>- 당근서비스와 잘 어울릴 수 있는 분인지 서로의 가치관과 일하는 방식에 대해 솔직함을 바탕으로 이야기를 나눠요.</p>
                  <p>- 대면으로 진행되며, 당근서비스 경영진과 업무 연관성이 높은 당근서비스 구성원이 참석하여 약 1시간 동안 이야기를 나눠요.</p>
                </div>
                <div class="daangn-process-detail-step">
                  <h4>04 처우 협의</h4>
                  <p>- 인터뷰 전형 합격 이후, 보상에 대한 협의를 진행하기 위해 자료를 요청드려요.</p>
                  <p>- 검토 후 빠른 시일 내로 이메일을 통해 공식 오퍼 레터를 전달드려요.</p>
                </div>
                <div class="daangn-process-detail-step">
                  <h4>05 최종 합격 및 입사</h4>
                  <p>- 최종 합격 소식과 함께, 합류 일자 조율 후 입사 안내사항을 전달드려요.</p>
                </div>
              </div>
            </div>
            <hr class="daangn-process-divider" />
          </div>

          <!-- Track 3: Staff (경영지원직군, 정규직) -->
          <div class="daangn-process-track-item">
            <div class="daangn-process-track-img">
              <img src="/images/process-staff.png" alt="Staff (경영지원직군, 정규직) 합류 여정" loading="lazy" />
            </div>
            <div class="daangn-process-toggle-bar">
              <button type="button" class="daangn-process-toggle-btn">
                <span>더보기</span>
                <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
            <div class="daangn-process-detail">
              <div class="daangn-process-detail-inner">
                <div class="daangn-process-detail-step">
                  <h4>01 서류 전형</h4>
                  <p>- 이력서는 본인의 역량과 성장 가능성을 구체적으로 알아볼 수 있는 자료로 자유롭게 작성해 주세요.</p>
                  <p>- 폰트 깨짐 등의 문제가 발생할 수 있으니 문서 형식은 PDF 파일로 변환하여 업로드해 주세요.</p>
                </div>
                <div class="daangn-process-detail-step">
                  <h4>02 1차 직무 인터뷰</h4>
                  <p>- 직무 적합도와 경험에 대한 이야기를 나누는 시간을 가져요.</p>
                  <p>- 대면으로 진행되며, 업무 연관성이 높은 당근서비스 구성원이 참석하여 약 1시간 동안 이야기를 나눠요.</p>
                </div>
                <div class="daangn-process-detail-step">
                  <h4>03 2차 컬처핏 인터뷰</h4>
                  <p>- 당근서비스와 잘 어울릴 수 있는 분인지 서로의 가치관과 일하는 방식에 대해 솔직함을 바탕으로 이야기를 나눠요.</p>
                  <p>- 대면으로 진행되며, 당근서비스 경영진과 업무 연관성이 높은 당근서비스 구성원이 참석하여 약 1시간 동안 이야기를 나눠요.</p>
                </div>
                <div class="daangn-process-detail-step">
                  <h4>04 처우 협의</h4>
                  <p>- 인터뷰 전형 합격 이후, 보상에 대한 협의를 진행하기 위해 자료를 요청드려요.</p>
                  <p>- 검토 후 빠른 시일 내로 이메일을 통해 공식 오퍼 레터를 전달드려요.</p>
                </div>
                <div class="daangn-process-detail-step">
                  <h4>05 레퍼런스 체크 (Optional)</h4>
                  <p>- 포지션에 따라 지원자의 동의 하에 레퍼런스 체크가 진행될 수 있어요.</p>
                </div>
                <div class="daangn-process-detail-step">
                  <h4>06 최종 합격 및 입사</h4>
                  <p>- 최종 합격 소식과 함께, 합류 일자 조율 후 입사 안내사항을 전달드려요.</p>
                </div>
              </div>
            </div>
            <hr class="daangn-process-divider" />
          </div>

        </div>

        <!-- 꼭 확인해 주세요 (공지) -->
        <div class="daangn-process-notice-box">
          <h3 class="daangn-process-notice-title">💡 꼭 확인해 주세요</h3>
          <ul class="daangn-process-notice-list">
            <li>위 합류 여정은 기본적인 프로세스로, 경우에 따라 과제 전형 등의 추가 절차가 진행될 수 있어요.</li>
            <li>세부사항(대상 및 자격기준 등)은 공고별로 상이할 수 있으니 지원하시는 공고의 내용을 반드시 확인해 주세요.</li>
            <li>지원서에 기재된 학력 및 경력사항 등 기재사항이 허위임이 판명될 경우 합류 여정이 중단되거나 합격이 취소될 수 있어요.</li>
            <li>장애인 및 국가유공자 등 취업보호대상자는 관계 법령에 따라 우대해요.</li>
          </ul>
        </div>
      </section>

      <!-- 2. 자주 묻는 질문 (FAQ) -->
      <section id="faq" class="daangn-faq-container">
        <div class="daangn-faq-section-header">
          <span class="daangn-process-badge">FAQ</span>
          <h2 class="daangn-process-title">자주 묻는 질문</h2>
          <p class="daangn-process-sub">지원자분들이 가장 많이 질문해 주시는 내용을 모았어요.</p>
        </div>

        <!-- 카테고리 1: 서류 전형 -->
        <div class="daangn-faq-group">
          <h3 class="daangn-faq-group-title">
            <span class="dot"></span>
            <span>서류 전형</span>
          </h3>
          <div class="daangn-faq-list">
            
            <div class="daangn-faq-item">
              <button type="button" class="daangn-faq-question-btn">
                <span class="daangn-faq-question-text">Q. 지원서가 정상적으로 제출되었는지 알 수 있나요?</span>
                <svg class="daangn-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div class="daangn-faq-answer">
                <div class="daangn-faq-answer-content">
                  A. 지원서가 접수되면 지원서 도착 알림 메일을 전달하고 있어요. 혹시라도 받지 못하셨다면 당근서비스 피플팀 (<a href="mailto:people@daangnservice.com">people@daangnservice.com</a>) 으로 문의 남겨 주세요.
                </div>
              </div>
            </div>

            <div class="daangn-faq-item">
              <button type="button" class="daangn-faq-question-btn">
                <span class="daangn-faq-question-text">Q. 지원서 제출 후, 서류를 수정하고 싶어요.</span>
                <svg class="daangn-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div class="daangn-faq-answer">
                <div class="daangn-faq-answer-content">
                  A. 서류 업데이트가 필요하신 분은, 당근서비스 피플팀 (<a href="mailto:people@daangnservice.com">people@daangnservice.com</a>)으로 지원 이력에 대한 설명과 함께 업데이트하신 서류를 전달해 주세요.
                </div>
              </div>
            </div>

            <div class="daangn-faq-item">
              <button type="button" class="daangn-faq-question-btn">
                <span class="daangn-faq-question-text">Q. 공고 간 중복 지원도 가능한가요?</span>
                <svg class="daangn-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div class="daangn-faq-answer">
                <div class="daangn-faq-answer-content">
                  A. 여러 공고에 동시에 지원해 주시는 것은 가능해요. 하지만, 공고에 따라 기준이 다른 경우가 있다는 점을 참고해주세요.
                </div>
              </div>
            </div>

            <div class="daangn-faq-item">
              <button type="button" class="daangn-faq-question-btn">
                <span class="daangn-faq-question-text">Q. 학력/성별/나이에 대한 제한이 있나요?</span>
                <svg class="daangn-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div class="daangn-faq-answer">
                <div class="daangn-faq-answer-content">
                  A. 당근서비스의 모든 포지션에 나이나 학력에 대한 제한을 두고 있지 않아요.
                </div>
              </div>
            </div>

            <div class="daangn-faq-item">
              <button type="button" class="daangn-faq-question-btn">
                <span class="daangn-faq-question-text">Q. 공고 지원 마감일은 언제인가요?</span>
                <svg class="daangn-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div class="daangn-faq-answer">
                <div class="daangn-faq-answer-content">
                  A. 대부분이 채용 시 마감되는 포지션으로 운영하고 있어요. 따라서 관심 있는 포지션이 있다면, 마감되기 전 늦지 않게 지원해 주시는 걸 추천드려요.
                </div>
              </div>
            </div>

            <div class="daangn-faq-item">
              <button type="button" class="daangn-faq-question-btn">
                <span class="daangn-faq-question-text">Q. 인재DB 전형에 지원했어요. 절차가 어떻게 되나요?</span>
                <svg class="daangn-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div class="daangn-faq-answer">
                <div class="daangn-faq-answer-content">
                  A. 제출해 주신 서류는 피플 팀에서 수시로 확인하고 있어요. 신규 포지션이 게시 되기 전 우선 검토하여 개별적으로 연락 드리고 있어요. 다만, 해당 지원 경로의 경우 별도로 서류 불합격 안내를 드리고 있지 않다는 점 양해 부탁 드려요.
                </div>
              </div>
            </div>

            <div class="daangn-faq-item">
              <button type="button" class="daangn-faq-question-btn">
                <span class="daangn-faq-question-text">Q. 불합격한 이력이 있어도 재지원이 가능한가요?</span>
                <svg class="daangn-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div class="daangn-faq-answer">
                <div class="daangn-faq-answer-content">
                  A. 네, 가능해요. 저희는 뛰어난 동료와 즐겁게 문제를 해결할 수 있는 동료에 대한 갈증이 커요.<br/><br/>이전과 비교하여, 유의미한 성장이나 경험을 추가로 확인 할 수 있도록 충분한 기간을 가진 이후에 재지원해 주시면 좋아요.
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- 카테고리 2: 인터뷰 전형 -->
        <div class="daangn-faq-group">
          <h3 class="daangn-faq-group-title">
            <span class="dot"></span>
            <span>인터뷰 전형</span>
          </h3>
          <div class="daangn-faq-list">

            <div class="daangn-faq-item">
              <button type="button" class="daangn-faq-question-btn">
                <span class="daangn-faq-question-text">Q. 인터뷰 일정 조율은 가능한가요?</span>
                <svg class="daangn-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div class="daangn-faq-answer">
                <div class="daangn-faq-answer-content">
                  A. 인터뷰 일정은 조율이 가능하며 필요하신 경우 당근서비스 피플 팀 (<a href="mailto:people@daangnservice.com">people@daangnservice.com</a>) 으로 일정 조율 요청 부탁 드려요.
                </div>
              </div>
            </div>

            <div class="daangn-faq-item">
              <button type="button" class="daangn-faq-question-btn">
                <span class="daangn-faq-question-text">Q. 인터뷰의 복장은 어떻게 갖춰야 하나요?</span>
                <svg class="daangn-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div class="daangn-faq-answer">
                <div class="daangn-faq-answer-content">
                  A. 별도의 복장 규정은 없어요. 편안히 인터뷰에 임하실 수 있도록 단정하고 편한 복장이면 충분해요. 인터뷰어도 편안한 복장으로 참석하실 예정이에요.
                </div>
              </div>
            </div>

            <div class="daangn-faq-item">
              <button type="button" class="daangn-faq-question-btn">
                <span class="daangn-faq-question-text">Q. 전형 결과는 언제 어떻게 안내 되나요? 불합격의 경우도 안내가 오나요?</span>
                <svg class="daangn-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div class="daangn-faq-answer">
                <div class="daangn-faq-answer-content">
                  A. 전형 결과 안내까지는 최대 1주 정도 소요될 수 있어요. 합불 여부와 관계없이 모든 지원자분께 메일 발송 및 유선으로 결과를 안내 드리고 있어요. 만약 전형 결과 안내가 지연될 경우 별도로 안내해 드릴 예정이에요.
                </div>
              </div>
            </div>

            <div class="daangn-faq-item">
              <button type="button" class="daangn-faq-question-btn">
                <span class="daangn-faq-question-text">Q. 불합격에 대한 피드백을 알려 주시나요?</span>
                <svg class="daangn-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div class="daangn-faq-answer">
                <div class="daangn-faq-answer-content">
                  A. 모든 지원 과정에 세심한 피드백을 드리기 어려운 점 너그러이 양해 부탁 드려요. 하지만 지원자분들이 당근서비스에 할애해 주신 소중한 시간이 헛되지 않도록 당근서비스도 계속해서 노력할게요.
                </div>
              </div>
            </div>

            <div class="daangn-faq-item">
              <button type="button" class="daangn-faq-question-btn">
                <span class="daangn-faq-question-text">Q. 인터뷰 합격 이후 프로세스가 어떻게 되나요?</span>
                <svg class="daangn-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div class="daangn-faq-answer">
                <div class="daangn-faq-answer-content">
                  A. 합격 이후 처우 및 입사 일정에 대한 협의를 진행해요. 협의는 메일 혹은 유선으로 연락 드릴 예정이니 참고 부탁 드려요.
                </div>
              </div>
            </div>

          </div>
        </div>

      </section>

      <!-- 3. Bottom CTA Banner -->
      <div class="daangn-process-cta">
        <h3 class="daangn-process-cta-title">당근서비스와 함께 일상의 따뜻한 온도를 만들어갈 동료를 기다려요.</h3>
        <p class="daangn-process-cta-sub">지금 열려 있는 다양한 포지션을 확인하고 지원해 보세요.</p>
        <a href="https://daangnservice.career.greetinghr.com/" target="_blank" rel="noopener noreferrer" class="daangn-process-cta-btn">
          <span>채용 공고 보러가기</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </a>
      </div>

    </div>
  </main>

  <!-- GLOBAL FOOTER (공식 Greeting 하단 푸터 디자인) -->
  <footer id="daangnFooter" class="footer__Container-sc-ece516ab-0 eNKNXj daangn-global-footer">
    <div class="footer__FooterInner-sc-ece516ab-2 eYxtUY">
      <div class="sc-kAkozD gVHQgh">
        <div class="sc-kAkozD dRWxSw footer__LinkAndTitleWrapper-sc-ece516ab-1 bUNMpz">
          <div data-testid="클릭_테스트" class="sc-kAkozD dRWxSw">
            <p class="footer-title">당근서비스</p>
            <p class="footer-detail">사업자번호 : 819-88-01473
주소 : 서울시 구로구 디지털로 300, 10층 당근서비스</p>
          </div>
          <ul class="footer__LinkWrapper-sc-ece516ab-3 gDuQAz">
            <li><a href="mailto:contact@daangnservice.com" target="_blank" rel="noopener noreferrer">사용자 문의</a></li>
            <li><a href="mailto:recruit@daangnservice.com" target="_blank" rel="noopener noreferrer">채용 문의</a></li>
          </ul>
        </div>
        <ul class="footer__SnsLinkWrapper-sc-ece516ab-4 jAhMFN">
          <li>
            <a href="https://www.linkedin.com/company/daangnservice/" target="_blank" rel="noopener noreferrer">
              <img alt="sns-icons" loading="lazy" width="36" height="36" decoding="async" data-nimg="1" style="color:transparent" src="https://cdn.greetinghr.com/assets/career/SNS_Linkedin.svg"/>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </footer>
</div>
<script>
(function() {
  function initProcessAndFaq() {
    document.addEventListener('click', function(e) {
      var processBtn = e.target.closest('.daangn-process-toggle-btn');
      if (processBtn) {
        e.preventDefault();
        var item = processBtn.closest('.daangn-process-track-item');
        if (item) {
          var isOpen = item.classList.toggle('is-open');
          var textSpan = processBtn.querySelector('span');
          if (textSpan) {
            var currentText = textSpan.textContent.trim();
            if (isOpen && currentText === '더보기') textSpan.textContent = '접기';
            else if (!isOpen && currentText === '접기') textSpan.textContent = '더보기';
          }
        }
        return;
      }
      var faqBtn = e.target.closest('.daangn-faq-question-btn');
      if (faqBtn) {
        e.preventDefault();
        var faqItem = faqBtn.closest('.daangn-faq-item');
        if (faqItem) {
          faqItem.classList.toggle('is-open');
        }
        return;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProcessAndFaq);
  } else {
    initProcessAndFaq();
  }
})();
</script>`.trim();
}

function getApplyTemplateHtml() {
  return `<div class="daangn-official-wrapper" style="background-color: #ffffff; color: #212124; font-family: 'KarrotSans', 'Pretendard', sans-serif;">
  <!-- GLOBAL HEADER -->
  <header id="daangnHeader" class="header__HeaderContainer-sc-bdd24b93-1 base-header-styles__CustomHeader-sc-eefa7522-0">
    <div class="header__HeaderInnerContainer-sc-bdd24b93-2">
      <a href="/" class="header-link-wrapper">
        <div class="header__LogoWrapper-sc-bdd24b93-3">
          <img alt="당근서비스 로고" src="/images/daangn-service-logo.png" />
        </div>
      </a>
      <div class="mobile-view__MobileView-sc-bb2ed92c-0 hossQr">
        <button data-testid="모바일_메뉴_버튼" type="button" aria-label="모바일 메뉴 열기" class="header__MobileMenuButtonStyled-sc-bdd24b93-4" onclick="var m = document.querySelector('.mobile-view__MobileView-sc-bb2ed92c-0.gJVwBD'); if (m) m.classList.toggle('is-open');">
          <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
            <path clip-rule="evenodd" d="M3 5.5H21V7.5H3V5.5ZM3 11H21V13H3V11ZM21 16.5H3V18.5H21V16.5Z" fill="#222222" fill-rule="evenodd"></path>
          </svg>
        </button>
      </div>
      <div class="mobile-view__MobileView-sc-bb2ed92c-0 gJVwBD">
        <div class="kCDZmt" style="display: flex; align-items: center; gap: 16px;">
          <!-- 1. 홈 -->
          <a rel="noreferrer" href="/" class="header-link-wrapper">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU" name="홈">
              <span class="sc-aYaIB gigtVE">홈</span>
            </button>
          </a>
          <!-- 2. 팀 소개 -->
          <div class="header-menu-item-group">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU header-dropdown-trigger">
              <span class="sc-aYaIB gigtVE">팀 소개</span>
              <svg class="header-chevron-icon" viewBox="0 0 16 16" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="header-dropdown-menu">
              <a href="/teams/product" class="header-dropdown-item">프로덕트</a>
              <a href="/teams/business" class="header-dropdown-item">사업운영</a>
              <a href="/teams/vertical" class="header-dropdown-item">독립</a>
              <a href="/teams/support" class="header-dropdown-item">경영지원</a>
            </div>
          </div>
          <!-- 3. 콘텐츠 -->
          <div class="header-menu-item-group">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU header-dropdown-trigger">
              <span class="sc-aYaIB gigtVE">콘텐츠</span>
              <svg class="header-chevron-icon" viewBox="0 0 16 16" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="header-dropdown-menu">
              <a href="/articles" class="header-dropdown-item">전체 이야기</a>
              <a href="/articles" class="header-dropdown-item">Culture</a>
              <a href="/articles" class="header-dropdown-item">People</a>
              <a href="/articles" class="header-dropdown-item">CX</a>
            </div>
          </div>
          <!-- 4. 채용 절차 -->
          <div class="header-menu-item-group">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU header-dropdown-trigger">
              <span class="sc-aYaIB gigtVE">채용 절차</span>
              <svg class="header-chevron-icon" viewBox="0 0 16 16" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="header-dropdown-menu">
              <a href="/process#process" class="header-dropdown-item">프로세스</a>
              <a href="/process#faq" class="header-dropdown-item">자주묻는질문</a>
            </div>
          </div>
          <!-- 5. 채용 공고 (버튼) -->
          <a rel="noreferrer" href="/apply" class="header-link-wrapper">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cbRJON" name="채용 공고">
              <span class="sc-aYaIB gigtVE" style="color: #ffffff; font-weight: 800;">채용 공고</span>
            </button>
          </a>
        </div>
      </div>
    </div>
  </header>

  <!-- APPLY / JOB OPENINGS PAGE MAIN (Bucketplace & Greeting Style) -->
  <main class="daangn-jobs-page-main">
    
    <!-- Hero Section -->
    <section class="daangn-jobs-hero">
      <h1 class="daangn-jobs-title">
        함께 성장하며 신뢰를 만들어갈<br/>
        동료를 기다립니다.
      </h1>
      <p class="daangn-jobs-sub">
        우리는 고객의 목소리에서 더 나은 방향을 찾고, 더 따뜻하고 안전한 연결을 만들어갑니다.
      </p>
    </section>

    <!-- Filter & Search Controls -->
    <section class="daangn-jobs-filter-section">
      <!-- Search Input -->
      <div class="daangn-jobs-search-box">
        <svg class="daangn-jobs-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" id="jobSearchInput" class="daangn-jobs-search-input" placeholder="포지션명, 팀명 또는 직무를 검색해보세요" autocomplete="off" />
        <button type="button" id="jobSearchClear" class="daangn-jobs-search-clear" aria-label="검색어 지우기">✕</button>
      </div>

      <!-- Role / Job Family Tabs (Bucketplace 스타일) -->
      <div class="daangn-jobs-role-tabs">
        <button type="button" class="daangn-role-tab is-active" data-role="all">
          전체 <span class="tab-badge-num">11</span>
        </button>
        <button type="button" class="daangn-role-tab" data-role="cxs">
          CX Specialist <span class="tab-badge-num">7</span>
        </button>
        <button type="button" class="daangn-role-tab" data-role="cxp">
          CX Professional <span class="tab-badge-num">2</span>
        </button>
        <button type="button" class="daangn-role-tab" data-role="srcxp">
          Sr. CX Professional <span class="tab-badge-num">1</span>
        </button>
        <button type="button" class="daangn-role-tab" data-role="qm">
          Quality &amp; L&amp;D <span class="tab-badge-num">2</span>
        </button>
      </div>

      <!-- Secondary Sub-filters (고용형태 & 조직그룹) -->
      <div class="daangn-jobs-subfilters">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="daangn-filter-group-label">고용 형태</span>
          <div class="daangn-subfilter-chips">
            <button type="button" class="daangn-subfilter-chip is-active" data-emp="all">전체</button>
            <button type="button" class="daangn-subfilter-chip" data-emp="fulltime">정규직 (4)</button>
            <button type="button" class="daangn-subfilter-chip" data-emp="contract">계약직 (7)</button>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; margin-left: auto;">
          <span class="daangn-filter-group-label">그룹</span>
          <div class="daangn-subfilter-chips">
            <button type="button" class="daangn-subfilter-chip is-active" data-group="all">전체 그룹</button>
            <button type="button" class="daangn-subfilter-chip" data-group="product">Product</button>
            <button type="button" class="daangn-subfilter-chip" data-group="business">Business</button>
            <button type="button" class="daangn-subfilter-chip" data-group="vertical">독립</button>
            <button type="button" class="daangn-subfilter-chip" data-group="support">경영지원</button>
          </div>
        </div>
      </div>

      <!-- Status Bar -->
      <div class="daangn-jobs-status-bar">
        <div class="daangn-jobs-count-text">
          총 <span id="jobFilteredCount" class="num-highlight">11</span>개의 포지션이 열려있어요
        </div>
        <button type="button" id="jobResetFilterBtn" class="daangn-jobs-reset-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
          필터 초기화
        </button>
      </div>
    </section>

    <!-- Job Postings List Container -->
    <div class="daangn-jobs-list-container">
      <div class="daangn-jobs-list" id="jobPostingsList">

        <!-- Job 1: CX Specialist, 분쟁조정팀 (ID: 238112) -->
        <a href="https://daangnservice.career.greetinghr.com/ko/o/238112" target="_blank" rel="noopener noreferrer" class="daangn-job-card" data-role="cxs" data-emp="contract" data-group="product" data-title="cx specialist 분쟁조정팀">
          <div class="daangn-job-card-info">
            <div class="daangn-job-badges">
              <span class="daangn-badge-category">CX Specialist</span>
              <span class="daangn-badge-emp contract">계약직</span>
              <span class="daangn-badge-career">경력 무관</span>
            </div>
            <h3 class="daangn-job-card-title">CX Specialist, 분쟁조정팀</h3>
            <div class="daangn-job-card-meta">
              <span class="daangn-job-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Product 그룹 · 분쟁조정팀
              </span>
            </div>
          </div>
          <div class="daangn-job-card-arrow-wrap">
            <div class="daangn-job-card-arrow" aria-label="지원하기">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>
        </a>

        <!-- Job 2: CX Specialist, 중고거래팀 (ID: 230271) -->
        <a href="https://daangnservice.career.greetinghr.com/ko/o/230271" target="_blank" rel="noopener noreferrer" class="daangn-job-card" data-role="cxs" data-emp="contract" data-group="product" data-title="cx specialist 중고거래팀">
          <div class="daangn-job-card-info">
            <div class="daangn-job-badges">
              <span class="daangn-badge-category">CX Specialist</span>
              <span class="daangn-badge-emp contract">계약직</span>
              <span class="daangn-badge-career">경력 무관</span>
            </div>
            <h3 class="daangn-job-card-title">CX Specialist, 중고거래팀</h3>
            <div class="daangn-job-card-meta">
              <span class="daangn-job-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Product 그룹 · 중고거래팀
              </span>
            </div>
          </div>
          <div class="daangn-job-card-arrow-wrap">
            <div class="daangn-job-card-arrow" aria-label="지원하기">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>
        </a>

        <!-- Job 3: CX Specialist, 바로구매 TF (ID: 224927) -->
        <a href="https://daangnservice.career.greetinghr.com/ko/o/224927" target="_blank" rel="noopener noreferrer" class="daangn-job-card" data-role="cxs" data-emp="contract" data-group="product" data-title="cx specialist 바로구매 tf">
          <div class="daangn-job-card-info">
            <div class="daangn-job-badges">
              <span class="daangn-badge-category">CX Specialist</span>
              <span class="daangn-badge-emp contract">계약직</span>
              <span class="daangn-badge-career">경력 무관</span>
            </div>
            <h3 class="daangn-job-card-title">CX Specialist, 바로구매 TF</h3>
            <div class="daangn-job-card-meta">
              <span class="daangn-job-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Product 그룹 · 바로구매 TF
              </span>
            </div>
          </div>
          <div class="daangn-job-card-arrow-wrap">
            <div class="daangn-job-card-arrow" aria-label="지원하기">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>
        </a>

        <!-- Job 4: CX Specialist, 당근알바팀 (ID: 226155) -->
        <a href="https://daangnservice.career.greetinghr.com/ko/o/226155" target="_blank" rel="noopener noreferrer" class="daangn-job-card" data-role="cxs" data-emp="contract" data-group="vertical" data-title="cx specialist 당근알바팀">
          <div class="daangn-job-card-info">
            <div class="daangn-job-badges">
              <span class="daangn-badge-category">CX Specialist</span>
              <span class="daangn-badge-emp contract">계약직</span>
              <span class="daangn-badge-career">경력 무관</span>
            </div>
            <h3 class="daangn-job-card-title">CX Specialist, 당근알바팀</h3>
            <div class="daangn-job-card-meta">
              <span class="daangn-job-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                독립 그룹 · 당근알바팀
              </span>
            </div>
          </div>
          <div class="daangn-job-card-arrow-wrap">
            <div class="daangn-job-card-arrow" aria-label="지원하기">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>
        </a>

        <!-- Job 5: CX Specialist, 버티컬팀(중고차/부동산) (ID: 206020) -->
        <a href="https://daangnservice.career.greetinghr.com/ko/o/206020" target="_blank" rel="noopener noreferrer" class="daangn-job-card" data-role="cxs" data-emp="contract" data-group="vertical" data-title="cx specialist 버티컬팀(중고차/부동산)">
          <div class="daangn-job-card-info">
            <div class="daangn-job-badges">
              <span class="daangn-badge-category">CX Specialist</span>
              <span class="daangn-badge-emp contract">계약직</span>
              <span class="daangn-badge-career">경력 무관</span>
            </div>
            <h3 class="daangn-job-card-title">CX Specialist, 버티컬팀(중고차/부동산)</h3>
            <div class="daangn-job-card-meta">
              <span class="daangn-job-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                독립 그룹 · 버티컬팀
              </span>
            </div>
          </div>
          <div class="daangn-job-card-arrow-wrap">
            <div class="daangn-job-card-arrow" aria-label="지원하기">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>
        </a>

        <!-- Job 6: CX Specialist, 페이팀 (ID: 197541) -->
        <a href="https://daangnservice.career.greetinghr.com/ko/o/197541" target="_blank" rel="noopener noreferrer" class="daangn-job-card" data-role="cxs" data-emp="contract" data-group="business" data-title="cx specialist 페이팀">
          <div class="daangn-job-card-info">
            <div class="daangn-job-badges">
              <span class="daangn-badge-category">CX Specialist</span>
              <span class="daangn-badge-emp contract">계약직</span>
              <span class="daangn-badge-career">경력 무관</span>
            </div>
            <h3 class="daangn-job-card-title">CX Specialist, 페이팀</h3>
            <div class="daangn-job-card-meta">
              <span class="daangn-job-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Business 그룹 · 페이팀
              </span>
            </div>
          </div>
          <div class="daangn-job-card-arrow-wrap">
            <div class="daangn-job-card-arrow" aria-label="지원하기">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>
        </a>

        <!-- Job 7: CX Professional, 로컬비즈니스팀 (ID: 214312) -->
        <a href="https://daangnservice.career.greetinghr.com/ko/o/214312" target="_blank" rel="noopener noreferrer" class="daangn-job-card" data-role="cxp" data-emp="fulltime" data-group="business" data-title="cx professional 로컬비즈니스팀">
          <div class="daangn-job-card-info">
            <div class="daangn-job-badges">
              <span class="daangn-badge-category">CX Professional</span>
              <span class="daangn-badge-emp fulltime">정규직</span>
              <span class="daangn-badge-career">경력 2~7년</span>
            </div>
            <h3 class="daangn-job-card-title">CX Professional, 로컬비즈니스팀</h3>
            <div class="daangn-job-card-meta">
              <span class="daangn-job-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Business 그룹 · 로컬비즈니스팀
              </span>
            </div>
          </div>
          <div class="daangn-job-card-arrow-wrap">
            <div class="daangn-job-card-arrow" aria-label="지원하기">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>
        </a>

        <!-- Job 8: CX Specialist, 로컬비즈니스팀 (ID: 214304) -->
        <a href="https://daangnservice.career.greetinghr.com/ko/o/214304" target="_blank" rel="noopener noreferrer" class="daangn-job-card" data-role="cxs" data-emp="contract" data-group="business" data-title="cx specialist 로컬비즈니스팀">
          <div class="daangn-job-card-info">
            <div class="daangn-job-badges">
              <span class="daangn-badge-category">CX Specialist</span>
              <span class="daangn-badge-emp contract">계약직</span>
              <span class="daangn-badge-career">경력 무관</span>
            </div>
            <h3 class="daangn-job-card-title">CX Specialist, 로컬비즈니스팀</h3>
            <div class="daangn-job-card-meta">
              <span class="daangn-job-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Business 그룹 · 로컬비즈니스팀
              </span>
            </div>
          </div>
          <div class="daangn-job-card-arrow-wrap">
            <div class="daangn-job-card-arrow" aria-label="지원하기">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>
        </a>

        <!-- Job 9: CX Quality Manager, 성장문화팀 (ID: 196872) -->
        <a href="https://daangnservice.career.greetinghr.com/ko/o/196872" target="_blank" rel="noopener noreferrer" class="daangn-job-card" data-role="qm" data-emp="fulltime" data-group="support" data-title="cx quality manager 성장문화팀">
          <div class="daangn-job-card-info">
            <div class="daangn-job-badges">
              <span class="daangn-badge-category">Quality Manager</span>
              <span class="daangn-badge-emp fulltime">정규직</span>
              <span class="daangn-badge-career">경력 1년 이상</span>
            </div>
            <h3 class="daangn-job-card-title">CX Quality Manager, 성장문화팀</h3>
            <div class="daangn-job-card-meta">
              <span class="daangn-job-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                경영지원 그룹 · 성장문화팀
              </span>
            </div>
          </div>
          <div class="daangn-job-card-arrow-wrap">
            <div class="daangn-job-card-arrow" aria-label="지원하기">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>
        </a>

        <!-- Job 10: Sr. CX Professional, 페이팀 (ID: 235965) -->
        <a href="https://daangnservice.career.greetinghr.com/ko/o/235965" target="_blank" rel="noopener noreferrer" class="daangn-job-card" data-role="srcxp" data-emp="fulltime" data-group="business" data-title="sr cx professional 페이팀">
          <div class="daangn-job-card-info">
            <div class="daangn-job-badges">
              <span class="daangn-badge-category">Sr. CX Professional</span>
              <span class="daangn-badge-emp fulltime">정규직</span>
              <span class="daangn-badge-career">경력 3년 이상</span>
            </div>
            <h3 class="daangn-job-card-title">Sr. CX Professional, 페이팀</h3>
            <div class="daangn-job-card-meta">
              <span class="daangn-job-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Business 그룹 · 페이팀
              </span>
            </div>
          </div>
          <div class="daangn-job-card-arrow-wrap">
            <div class="daangn-job-card-arrow" aria-label="지원하기">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>
        </a>

        <!-- Job 11: CX L&D Manager, 성장문화팀 (ID: 205372) -->
        <a href="https://daangnservice.career.greetinghr.com/ko/o/205372" target="_blank" rel="noopener noreferrer" class="daangn-job-card" data-role="qm" data-emp="fulltime" data-group="support" data-title="cx l&d manager 성장문화팀">
          <div class="daangn-job-card-info">
            <div class="daangn-job-badges">
              <span class="daangn-badge-category">L&amp;D Manager</span>
              <span class="daangn-badge-emp fulltime">정규직</span>
              <span class="daangn-badge-career">경력 1년 이상</span>
            </div>
            <h3 class="daangn-job-card-title">CX L&D Manager, 성장문화팀</h3>
            <div class="daangn-job-card-meta">
              <span class="daangn-job-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                경영지원 그룹 · 성장문화팀
              </span>
            </div>
          </div>
          <div class="daangn-job-card-arrow-wrap">
            <div class="daangn-job-card-arrow" aria-label="지원하기">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>
        </a>

      </div>

      <!-- Empty State (검색 결과 없을 때 표시) -->
      <div id="jobsEmptyState" class="daangn-jobs-empty">
        <div class="daangn-jobs-empty-icon">🔍</div>
        <h4 class="daangn-jobs-empty-title">일치하는 채용공고가 없어요</h4>
        <p class="daangn-jobs-empty-desc">다른 검색어로 검색하시거나 선택하신 필터를 초기화해 보세요.</p>
        <button type="button" id="jobEmptyResetBtn" class="daangn-jobs-empty-btn">
          전체 공고 보기
        </button>
      </div>

      <!-- Bottom Talent Pool & Help Banner (Bucketplace 스타일) -->
      <section class="daangn-jobs-bottom-banner">
        <div class="daangn-jobs-banner-content">
          <h3>채용 절차가 궁금하신가요?</h3>
          <p>서류 전형부터 직무 인터뷰, 처우 협의, 자주 묻는 질문까지 당근서비스 합류 여정을 자세히 확인해보세요.</p>
        </div>
        <div class="daangn-jobs-banner-actions">
          <a href="/process#process" class="daangn-banner-btn-secondary">채용 프로세스 안내</a>
          <a href="/process#faq" class="daangn-banner-btn-primary">자주 묻는 질문 (FAQ) ➔</a>
        </div>
      </section>

    </div>
  </main>

  <!-- GLOBAL FOOTER (공식 Greeting 하단 푸터 디자인) -->
  <footer id="daangnFooter" class="footer__Container-sc-ece516ab-0 eNKNXj daangn-global-footer">
    <div class="footer__FooterInner-sc-ece516ab-2 eYxtUY">
      <div class="sc-kAkozD gVHQgh">
        <div class="sc-kAkozD dRWxSw footer__LinkAndTitleWrapper-sc-ece516ab-1 bUNMpz">
          <div data-testid="클릭_테스트" class="sc-kAkozD dRWxSw">
            <p class="footer-title">당근서비스</p>
            <p class="footer-detail">사업자번호 : 819-88-01473
주소 : 서울시 구로구 디지털로 300, 10층 당근서비스</p>
          </div>
          <ul class="footer__LinkWrapper-sc-ece516ab-3 gDuQAz">
            <li><a href="mailto:contact@daangnservice.com" target="_blank" rel="noopener noreferrer">사용자 문의</a></li>
            <li><a href="mailto:recruit@daangnservice.com" target="_blank" rel="noopener noreferrer">채용 문의</a></li>
          </ul>
        </div>
        <ul class="footer__SnsLinkWrapper-sc-ece516ab-4 jAhMFN">
          <li>
            <a href="https://www.linkedin.com/company/daangnservice/" target="_blank" rel="noopener noreferrer">
              <img alt="sns-icons" loading="lazy" width="36" height="36" decoding="async" data-nimg="1" style="color:transparent" src="https://cdn.greetinghr.com/assets/career/SNS_Linkedin.svg"/>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </footer>
</div>

<script>
(function() {
  function initJobFiltering() {
    var searchInput = document.getElementById('jobSearchInput');
    var clearBtn = document.getElementById('jobSearchClear');
    var roleTabs = document.querySelectorAll('.daangn-role-tab');
    var empChips = document.querySelectorAll('.daangn-subfilter-chip[data-emp]');
    var groupChips = document.querySelectorAll('.daangn-subfilter-chip[data-group]');
    var cards = document.querySelectorAll('.daangn-job-card');
    var countEl = document.getElementById('jobFilteredCount');
    var emptyEl = document.getElementById('jobsEmptyState');
    var resetBtn = document.getElementById('jobResetFilterBtn');
    var emptyResetBtn = document.getElementById('jobEmptyResetBtn');

    var currentRole = 'all';
    var currentEmp = 'all';
    var currentGroup = 'all';
    var currentKeyword = '';

    function filterJobs() {
      var visibleCount = 0;
      var kw = currentKeyword.trim().toLowerCase();

      cards.forEach(function(card) {
        var cardRole = card.getAttribute('data-role') || '';
        var cardEmp = card.getAttribute('data-emp') || '';
        var cardGroup = card.getAttribute('data-group') || '';
        var cardTitle = (card.getAttribute('data-title') || '').toLowerCase();
        var cardText = card.textContent.toLowerCase();

        var matchRole = (currentRole === 'all') || (cardRole === currentRole);
        var matchEmp = (currentEmp === 'all') || (cardEmp === currentEmp);
        var matchGroup = (currentGroup === 'all') || (cardGroup === currentGroup);
        var matchKeyword = !kw || cardTitle.indexOf(kw) !== -1 || cardText.indexOf(kw) !== -1;

        if (matchRole && matchEmp && matchGroup && matchKeyword) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      if (countEl) countEl.textContent = visibleCount;
      if (emptyEl) emptyEl.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    if (searchInput) {
      searchInput.addEventListener('input', function() {
        currentKeyword = this.value;
        if (clearBtn) clearBtn.style.display = currentKeyword ? 'flex' : 'none';
        filterJobs();
      });
    }

    if (clearBtn && searchInput) {
      clearBtn.addEventListener('click', function() {
        searchInput.value = '';
        currentKeyword = '';
        clearBtn.style.display = 'none';
        searchInput.focus();
        filterJobs();
      });
    }

    roleTabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        roleTabs.forEach(function(t) { t.classList.remove('is-active'); });
        this.classList.add('is-active');
        currentRole = this.getAttribute('data-role') || 'all';
        filterJobs();
      });
    });

    empChips.forEach(function(chip) {
      chip.addEventListener('click', function() {
        empChips.forEach(function(c) { c.classList.remove('is-active'); });
        this.classList.add('is-active');
        currentEmp = this.getAttribute('data-emp') || 'all';
        filterJobs();
      });
    });

    groupChips.forEach(function(chip) {
      chip.addEventListener('click', function() {
        groupChips.forEach(function(c) { c.classList.remove('is-active'); });
        this.classList.add('is-active');
        currentGroup = this.getAttribute('data-group') || 'all';
        filterJobs();
      });
    });

    function resetAllFilters() {
      currentRole = 'all';
      currentEmp = 'all';
      currentGroup = 'all';
      currentKeyword = '';
      if (searchInput) searchInput.value = '';
      if (clearBtn) clearBtn.style.display = 'none';

      roleTabs.forEach(function(t) {
        if (t.getAttribute('data-role') === 'all') t.classList.add('is-active');
        else t.classList.remove('is-active');
      });

      empChips.forEach(function(c) {
        if (c.getAttribute('data-emp') === 'all') c.classList.add('is-active');
        else c.classList.remove('is-active');
      });

      groupChips.forEach(function(c) {
        if (c.getAttribute('data-group') === 'all') c.classList.add('is-active');
        else c.classList.remove('is-active');
      });

      filterJobs();
    }

    if (resetBtn) resetBtn.addEventListener('click', resetAllFilters);
    if (emptyResetBtn) emptyResetBtn.addEventListener('click', resetAllFilters);
  }

  function initHeaderDropdowns() {
    var triggers = document.querySelectorAll('.header-dropdown-trigger');
    triggers.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var parent = this.parentElement;
        var wasOpen = parent.classList.contains('is-open');
        document.querySelectorAll('.header-menu-item-group').forEach(function(g) {
          g.classList.remove('is-open');
        });
        if (!wasOpen) {
          parent.classList.add('is-open');
        }
      });
    });

    document.addEventListener('click', function() {
      document.querySelectorAll('.header-menu-item-group').forEach(function(g) {
        g.classList.remove('is-open');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initHeaderDropdowns();
      initJobFiltering();
    });
  } else {
    initHeaderDropdowns();
    initJobFiltering();
  }
})();
</script>`.trim();
}

function seedDefaultSubPages() {
  return new Promise((resolve) => {
    const subpages = [
      {
        pagePath: '/apply',
        pageName: '채용 공고',
        isApply: true
      },
      {
        pagePath: '/process',
        pageName: '채용 절차',
        isProcess: true
      },
      {
        pagePath: '/teams/product',
        pageName: 'Product 그룹 소개',
        badge: 'Product Group',
        title: '당근서비스의<br/>프로덕트 그룹을 소개해요.',
        img: 'https://prismic-image-proxy.krrt.io/karrot/f92b5275-92ec-4ce0-b196-c71dc36239c3_service_01.jpg',
        quote: '“우리는 기술과 데이터로 동네 이웃의 따뜻한 연결을 가장 안전하고 편리하게 완성합니다.”',
        teams: [
          {
            name: '중고거래팀',
            desc: '당근에서 동네 이웃들과 가깝고 따뜻한 거래 경험을 제공해요.<br/>동네인증, 매너온도는 물론 머신러닝 기술을 통한 게시글 분석으로 모두가 안전하게 거래할 수 있도록 노력하고 있어요.'
          },
          {
            name: '커뮤니티팀 &amp; POI운영팀',
            desc: '🗣️ <strong>커뮤니티팀</strong>은 동네생활, 모임, 아파트, 온라인 카페라는 당근의 커뮤니티 서비스 전반을 운영하는 팀이에요. 사용자가 커뮤니티에서 안전하고 즐겁게 활동하실 수 있도록 문의·신고 대응, 정책 운영, 운영 품질 개선을 담당하고 있어요.<br/><br/>📍 <strong>POI운영팀</strong>은 동네지도에 노출되는 장소 정보의 정확도와 신뢰도를 관리하는 팀이에요. 가게·시설 정보가 실제 이용 맥락에 맞게 보여질 수 있도록 유저 제안, 장소 정보, 유효성 데이터를 검수하고 운영 기준을 개선하고 있어요.'
          },
          {
            name: '대외민원운영팀',
            desc: '• 당근과 협업을 하는 많은 대내외 기관과 소통하며 다양한 업무를 수행해요.<br/>• 발생한 대외적인 이슈들을 분석하며, 향후 발생을 방지하기 위한 대안을 고민하며 안정적인 서비스를 운영하기 위해 노력해요.<br/>• 당근서비스 오피스를 방문하는 민원인을 직접 응대하고 문제를 해결해요.'
          },
          {
            name: '분쟁조정팀',
            desc: '분쟁조정팀은 거래 과정에서 발생하는 거래 분쟁에 적극적으로 개입을 해 거래분쟁 경험을 최소화하는 팀이에요.'
          }
        ],
        crossLinks: [
          { text: '사업운영그룹 소개 바로가기', href: '/teams/business' },
          { text: '독립 그룹 소개 바로가기', href: '/teams/vertical' },
          { text: '경영지원그룹 소개 바로가기', href: '/teams/support' }
        ]
      },
      {
        pagePath: '/teams/business',
        pageName: 'Business 그룹 소개',
        badge: 'Business Group',
        title: '당근서비스의<br/>사업운영 그룹을 소개해요.',
        img: 'https://prismic-image-proxy.krrt.io/karrot/10d0e07e-9bcf-48a8-b375-fcd43b533606_service_03.jpg',
        quote: '“명확한 기준과 안정적인 운영 구조를 통해 사업자와 이용자 모두가 안심할 수 있는 비즈니스 환경을 만듭니다.”',
        teams: [
          {
            name: '광고팀',
            desc: '<strong>우리 팀은 이런 일을 하고 있어요.</strong><br/><br/>우리는 <strong>1) 당근 서비스 내 광고 심사와 관련 고객 대응을 담당</strong>하며, 당근의 광고주가 신뢰할 수 있는 방식으로 안전하게 광고를 집행할 수 있도록 <strong>2) 심사/대응의 기준과 운영 흐름을 정리하고 개선하는 역할</strong>을 하고 있어요.<br/>단기적인 이슈 처리보다는, 왜 문제가 발생했는지를 구조적으로 살펴 심사 기준과 프로세스를 정비해 같은 이슈가 반복되지 않도록 하는 것을 중요하게 생각해요.<br/><br/><strong>우리의 목표</strong>는 <em>명확한 기준과 안정적인 운영 구조를 통해 광고주와 이용자 모두가 안심할 수 있는 비즈니스 환경을 만드는 것</em>이에요.'
          },
          {
            name: '로컬비즈니스팀',
            desc: '<strong>우리 팀은 이런 일을 하고 있어요.</strong><br/><br/>우리는 <strong>1) 로컬비즈 전 영역에 걸쳐 비즈프로필 사업자와 서비스 이용자에게 최고의 이용 경험을 제공하기 위해, 고객 접점에서의 심사·대응 업무를 담당</strong>하며 <strong>2) 이를 바탕으로 신뢰할 수 있는 운영 기준과 안정적인 프로세스를 정립·개선하는 역할</strong>을 하고 있어요.<br/><br/>단기적인 이슈 처리에 머물지 않고, 부정적 경험과 반복되는 문의의 구조적 원인을 파악해 심사 기준과 운영 프로세스를 정비함으로써 같은 문제가 재발하지 않도록 하는 것을 중요하게 생각해요.<br/>또한 <strong>신규 서비스가 안정적으로 운영에 안착할 수 있도록 운영 프레임을 구축</strong>하고, 데이터에 기반한 문제 정의와 협업 구조를 통해 고객 중심·데이터 중심의 업무 문화를 만들어가고 있어요.<br/><br/>우리의 목표는 <strong>명확한 기준과 안정적인 운영 구조를 통해 사업자와 이용자 모두가 안심할 수 있는 비즈니스 환경을 만드는 것</strong>이에요.'
          },
          {
            name: '페이팀',
            desc: '<strong>페이팀에 오신 것을 환영해요!</strong><br/><br/>당근에서 이웃 간 연결이 실제 거래로 완성되는 순간에는 결제와 신뢰가 필요해요. 당근페이는 중고거래 과정에서 대금을 안전하고 편리하게 주고받을 수 있도록 지원하며, 거래에 대한 불안과 번거로움을 줄여 더 많은 연결이 실제 거래로 이어질 수 있게 해요.<br/><br/>당근페이의 역할은 중고거래에만 머물지 않아요. 우리동네 가게 결제, 픽업, 포인트 사용과 각종 편의 서비스까지 당근 안에서 이루어지는 다양한 활동을 금융 경험으로 연결하고 있어요. <strong>당근페이는 하나의 결제 기능을 넘어, 당근의 서비스와 비즈니스가 확장될 수 있도록 뒷받침하는 핵심 기반</strong>이에요.<br/><br/>페이팀은 고객이 이 금융 경험을 안심하고 이용할 수 있도록 결제 과정의 문제를 해결하고 이상거래와 금융피해를 예방해요. 한 건의 문의를 처리하는 데 그치지 않고, “왜 이 문제가 발생했을까?”, “고객이 다시 문의하지 않도록 무엇을 바꿔야 할까?”를 고민하며 운영 정책과 프로세스를 정비하고 제품과 시스템의 개선으로 연결해요.<br/><br/>새로운 금융 서비스가 확장될수록 기존 기준만으로 해결하기 어려운 고객 문제와 운영 리스크도 함께 생겨요. 고객의 목소리와 데이터를 바탕으로 문제를 정의하고, 필요한 운영 기준과 해결 방식을 처음부터 만들어가며 당근페이의 신뢰와 성장을 이끌어가요.'
          }
        ],
        crossLinks: [
          { text: '프로덕트 그룹 소개 바로가기', href: '/teams/product' },
          { text: '독립 그룹 소개 바로가기', href: '/teams/vertical' },
          { text: '경영지원그룹 소개 바로가기', href: '/teams/support' }
        ]
      },
      {
        pagePath: '/teams/vertical',
        pageName: '독립 그룹 소개',
        badge: 'Independent Group',
        title: '당근서비스의<br/>독립 그룹을 소개해요.',
        img: 'https://prismic-image-proxy.krrt.io/karrot/f25a287d-a97e-4040-8b8f-62e616d266bd_service_05.jpg',
        quote: '“동네 이웃과 일자리를 가장 따뜻하고 안전하게 연결하고, 새로운 수익화와 전사 과제를 주도적으로 풀어나갑니다.”',
        teams: [
          {
            name: '당근알바팀',
            desc: '당근알바팀은 동네 이웃과 일자리를 가장 따뜻하고 안전하게 연결하고 있어요.<br/>우리는 유저의 신뢰를 데이터로 증명하고, 경험으로 완성하는 것을 목표로 해요. 💪'
          },
          {
            name: '버티컬팀',
            desc: '<strong>버티컬팀은?</strong><br/><br/>당근의 <strong>중고차와 부동산 사업</strong>을 운영하며, 회사의 <strong>매출과 수익화</strong>를 담당하는 팀이에요.<br/>“동네에서 믿고 거래할 수 있는 경험”을 만드는 것이 핵심 목표예요.'
          },
          {
            name: 'X팀',
            desc: '<strong>우리팀은 이런 일을 하고 있어요.</strong><br/><br/>우리는 당근서비스 전반에서 발생하는 전사 이벤트와 담당이 모호한 업무들을 살펴보고, <em>적절한 팀이 책임지고 처리할 수 있도록 흐름과 기준을 정리하는 역할</em>을 하고 있어요.<br/><br/>당장의 이슈를 넘기는 것보다, 왜 문제가 발생했는지 구조를 확인하고 <strong>같은 상황이 반복되지 않도록 R/R과 운영 프로세스를 정비하는 것</strong>을 중요하게 생각해요.<br/><br/>우리의 가장 중요한 우선순위는 <strong>1) 전사 이벤트나 예외 상황에서 발생하는 이슈를 빠르게 파악</strong>하고, <strong>2) 이후에는 명확한 기준과 운영 구조를 통해 안정적으로 대응할 수 있는 환경을 만드는 것</strong>이에요.'
          }
        ],
        crossLinks: [
          { text: '프로덕트 그룹 소개 바로가기', href: '/teams/product' },
          { text: '사업운영그룹 소개 바로가기', href: '/teams/business' },
          { text: '경영지원그룹 소개 바로가기', href: '/teams/support' }
        ]
      },
      {
        pagePath: '/teams/support',
        pageName: '경영지원 그룹 소개',
        badge: 'Management Support Group',
        title: '당근서비스의<br/>경영지원 그룹을 소개해요.',
        img: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
        quote: '“조직의 성장 파트너로서 구성원이 업무에 온전히 몰입할 수 있는 즐거운 문화와 최상의 환경을 지원합니다.”',
        teams: [
          {
            name: '성장문화팀',
            desc: '성장문화팀은 CX조직의 성장을 돕는 ‘조직 성장 파트너’예요.<br/><br/>• 문화로 즐겁고 몰입도 높은 업무 환경을 만들어요.<br/>• 교육과 품질을 통해 구성원의 문제 해결 역량과 고객 경험을 높여요.<br/>• 데이터 분석을 바탕으로 더 정확한 의사결정과 지속적인 개선을 지원해요.'
          },
          {
            name: '피플팀',
            desc: '피플팀은 구성원이 업무에 온전히 몰입할 수 있도록 든든한 업무 환경과 기반을 지원하는 팀이에요.<br/><br/>• GA(총무) 및 쾌적한 오피스 인프라 환경 구축<br/>• HR 정책 및 인사 운영 관리<br/>• 공정하고 신속한 Payroll(급여) 및 복리후생 지원<br/>• 우수한 동료를 발굴하는 채용 매니지먼트<br/>• 스마트한 업무 환경을 위한 IT Management를 책임집니다.'
          }
        ],
        crossLinks: [
          { text: '프로덕트 그룹 소개 바로가기', href: '/teams/product' },
          { text: '사업운영그룹 소개 바로가기', href: '/teams/business' },
          { text: '독립 그룹 소개 바로가기', href: '/teams/vertical' }
        ]
      }
    ];

    let pending = subpages.length;
    subpages.forEach(sub => {
      db.get('SELECT COUNT(*) as cnt FROM pages WHERE page_path = ?', [sub.pagePath], (err, row) => {
        if (!err && row && row.cnt === 0) {
          const html = sub.isApply ? getApplyTemplateHtml() : (sub.isProcess ? getProcessTemplateHtml() : getGroupTemplateHtml({
            groupBadge: sub.badge,
            groupTitle: sub.title,
            groupImg: sub.img,
            groupQuote: sub.quote,
            teams: sub.teams,
            crossLinks: sub.crossLinks
          }));
          const stmt = db.prepare(`
            INSERT INTO pages (version_name, page_path, page_name, html, css, components_json, seo_title, seo_description, favicon_url, is_published)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          `);
          stmt.run(
            `공식 배포 (${sub.pageName})`,
            sub.pagePath,
            sub.pageName,
            html,
            getOfficialCss(),
            '{}',
            `${sub.pageName} - 당근서비스 채용`,
            `당근서비스 ${sub.pageName}을 소개합니다.`,
            '/images/favicon-192.png',
            () => {
              pending--;
              if (pending === 0) resolve();
            }
          );
        } else {
          pending--;
          if (pending === 0) resolve();
        }
      });
    });
  });
}

// Function to immediately update and publish all pages with the latest official texts
function syncAllOfficialContent() {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Update Main Page (/)
      const mainHtml = getOfficialHtml();
      const mainCss = getOfficialCss();
      await new Promise((res, rej) => {
        db.run(
          `INSERT INTO pages (version_name, page_path, page_name, html, css, components_json, seo_title, seo_description, favicon_url, is_published)
           VALUES (?, '/', '메인 페이지', ?, ?, '{}', '당근서비스 채용 - 당근다운 경험이 완성되는 당근서비스', '당근서비스에 합류하세요. 당근다운 경험이 완성되는 여정을 함께할 동료를 찾습니다.', '/images/favicon-192.png', 1)`,
          ['공식 배포 (7대 인재상 & 4대 그룹 반영)', mainHtml, mainCss],
          function (err) {
            if (err) return rej(err);
            // unpublish older versions of /
            const newId = this.lastID;
            db.run('UPDATE pages SET is_published = 0 WHERE page_path = ? AND id != ?', ['/', newId], () => res());
          }
        );
      });

      // 2. Subpages to sync
      const subpages = [
        {
          pagePath: '/teams/product',
          pageName: 'Product 그룹 소개',
          badge: 'Product Group',
          title: '당근서비스의<br/>프로덕트 그룹을 소개해요.',
          img: 'https://prismic-image-proxy.krrt.io/karrot/f92b5275-92ec-4ce0-b196-c71dc36239c3_service_01.jpg',
          quote: '“우리는 기술과 데이터로 동네 이웃의 따뜻한 연결을 가장 안전하고 편리하게 완성합니다.”',
          teams: [
            {
              name: '중고거래팀',
              desc: '당근에서 동네 이웃들과 가깝고 따뜻한 거래 경험을 제공해요.<br/>동네인증, 매너온도는 물론 머신러닝 기술을 통한 게시글 분석으로 모두가 안전하게 거래할 수 있도록 노력하고 있어요.'
            },
            {
              name: '커뮤니티팀 &amp; POI운영팀',
              desc: '🗣️ <strong>커뮤니티팀</strong>은 동네생활, 모임, 아파트, 온라인 카페라는 당근의 커뮤니티 서비스 전반을 운영하는 팀이에요. 사용자가 커뮤니티에서 안전하고 즐겁게 활동하실 수 있도록 문의·신고 대응, 정책 운영, 운영 품질 개선을 담당하고 있어요.<br/><br/>📍 <strong>POI운영팀</strong>은 동네지도에 노출되는 장소 정보의 정확도와 신뢰도를 관리하는 팀이에요. 가게·시설 정보가 실제 이용 맥락에 맞게 보여질 수 있도록 유저 제안, 장소 정보, 유효성 데이터를 검수하고 운영 기준을 개선하고 있어요.'
            },
            {
              name: '대외민원운영팀',
              desc: '• 당근과 협업을 하는 많은 대내외 기관과 소통하며 다양한 업무를 수행해요.<br/>• 발생한 대외적인 이슈들을 분석하며, 향후 발생을 방지하기 위한 대안을 고민하며 안정적인 서비스를 운영하기 위해 노력해요.<br/>• 당근서비스 오피스를 방문하는 민원인을 직접 응대하고 문제를 해결해요.'
            },
            {
              name: '분쟁조정팀',
              desc: '분쟁조정팀은 거래 과정에서 발생하는 거래 분쟁에 적극적으로 개입을 해 거래분쟁 경험을 최소화하는 팀이에요.'
            }
          ],
          crossLinks: [
            { text: '사업운영그룹 소개 바로가기', href: '/teams/business' },
            { text: '독립 그룹 소개 바로가기', href: '/teams/vertical' },
            { text: '경영지원그룹 소개 바로가기', href: '/teams/support' }
          ]
        },
        {
          pagePath: '/teams/business',
          pageName: 'Business 그룹 소개',
          badge: 'Business Group',
          title: '당근서비스의<br/>사업운영 그룹을 소개해요.',
          img: 'https://prismic-image-proxy.krrt.io/karrot/10d0e07e-9bcf-48a8-b375-fcd43b533606_service_03.jpg',
          quote: '“명확한 기준과 안정적인 운영 구조를 통해 사업자와 이용자 모두가 안심할 수 있는 비즈니스 환경을 만듭니다.”',
          teams: [
            {
              name: '광고팀',
              desc: '<strong>우리 팀은 이런 일을 하고 있어요.</strong><br/><br/>우리는 <strong>1) 당근 서비스 내 광고 심사와 관련 고객 대응을 담당</strong>하며, 당근의 광고주가 신뢰할 수 있는 방식으로 안전하게 광고를 집행할 수 있도록 <strong>2) 심사/대응의 기준과 운영 흐름을 정리하고 개선하는 역할</strong>을 하고 있어요.<br/>단기적인 이슈 처리보다는, 왜 문제가 발생했는지를 구조적으로 살펴 심사 기준과 프로세스를 정비해 같은 이슈가 반복되지 않도록 하는 것을 중요하게 생각해요.<br/><br/><strong>우리의 목표</strong>는 <em>명확한 기준과 안정적인 운영 구조를 통해 광고주와 이용자 모두가 안심할 수 있는 비즈니스 환경을 만드는 것</em>이에요.'
            },
            {
              name: '로컬비즈니스팀',
              desc: '<strong>우리 팀은 이런 일을 하고 있어요.</strong><br/><br/>우리는 <strong>1) 로컬비즈 전 영역에 걸쳐 비즈프로필 사업자와 서비스 이용자에게 최고의 이용 경험을 제공하기 위해, 고객 접점에서의 심사·대응 업무를 담당</strong>하며 <strong>2) 이를 바탕으로 신뢰할 수 있는 운영 기준과 안정적인 프로세스를 정립·개선하는 역할</strong>을 하고 있어요.<br/><br/>단기적인 이슈 처리에 머물지 않고, 부정적 경험과 반복되는 문의의 구조적 원인을 파악해 심사 기준과 운영 프로세스를 정비함으로써 같은 문제가 재발하지 않도록 하는 것을 중요하게 생각해요.<br/>또한 <strong>신규 서비스가 안정적으로 운영에 안착할 수 있도록 운영 프레임을 구축</strong>하고, 데이터에 기반한 문제 정의와 협업 구조를 통해 고객 중심·데이터 중심의 업무 문화를 만들어가고 있어요.<br/><br/>우리의 목표는 <strong>명확한 기준과 안정적인 운영 구조를 통해 사업자와 이용자 모두가 안심할 수 있는 비즈니스 환경을 만드는 것</strong>이에요.'
            },
            {
              name: '페이팀',
              desc: '<strong>페이팀에 오신 것을 환영해요!</strong><br/><br/>당근에서 이웃 간 연결이 실제 거래로 완성되는 순간에는 결제와 신뢰가 필요해요. 당근페이는 중고거래 과정에서 대금을 안전하고 편리하게 주고받을 수 있도록 지원하며, 거래에 대한 불안과 번거로움을 줄여 더 많은 연결이 실제 거래로 이어질 수 있게 해요.<br/><br/>당근페이의 역할은 중고거래에만 머물지 않아요. 우리동네 가게 결제, 픽업, 포인트 사용과 각종 편의 서비스까지 당근 안에서 이루어지는 다양한 활동을 금융 경험으로 연결하고 있어요. <strong>당근페이는 하나의 결제 기능을 넘어, 당근의 서비스와 비즈니스가 확장될 수 있도록 뒷받침하는 핵심 기반</strong>이에요.<br/><br/>페이팀은 고객이 이 금융 경험을 안심하고 이용할 수 있도록 결제 과정의 문제를 해결하고 이상거래와 금융피해를 예방해요. 한 건의 문의를 처리하는 데 그치지 않고, “왜 이 문제가 발생했을까?”, “고객이 다시 문의하지 않도록 무엇을 바꿔야 할까?”를 고민하며 운영 정책과 프로세스를 정비하고 제품과 시스템의 개선으로 연결해요.<br/><br/>새로운 금융 서비스가 확장될수록 기존 기준만으로 해결하기 어려운 고객 문제와 운영 리스크도 함께 생겨요. 고객의 목소리와 데이터를 바탕으로 문제를 정의하고, 필요한 운영 기준과 해결 방식을 처음부터 만들어가며 당근페이의 신뢰와 성장을 이끌어가요.'
            }
          ],
          crossLinks: [
            { text: '프로덕트 그룹 소개 바로가기', href: '/teams/product' },
            { text: '독립 그룹 소개 바로가기', href: '/teams/vertical' },
            { text: '경영지원그룹 소개 바로가기', href: '/teams/support' }
          ]
        },
        {
          pagePath: '/teams/vertical',
          pageName: '독립 그룹 소개',
          badge: 'Independent Group',
          title: '당근서비스의<br/>독립 그룹을 소개해요.',
          img: 'https://prismic-image-proxy.krrt.io/karrot/f25a287d-a97e-4040-8b8f-62e616d266bd_service_05.jpg',
          quote: '“동네 이웃과 일자리를 가장 따뜻하고 안전하게 연결하고, 새로운 수익화와 전사 과제를 주도적으로 풀어나갑니다.”',
          teams: [
            {
              name: '당근알바팀',
              desc: '당근알바팀은 동네 이웃과 일자리를 가장 따뜻하고 안전하게 연결하고 있어요.<br/>우리는 유저의 신뢰를 데이터로 증명하고, 경험으로 완성하는 것을 목표로 해요. 💪'
            },
            {
              name: '버티컬팀',
              desc: '<strong>버티컬팀은?</strong><br/><br/>당근의 <strong>중고차와 부동산 사업</strong>을 운영하며, 회사의 <strong>매출과 수익화</strong>를 담당하는 팀이에요.<br/>“동네에서 믿고 거래할 수 있는 경험”을 만드는 것이 핵심 목표예요.'
            },
            {
              name: 'X팀',
              desc: '<strong>우리팀은 이런 일을 하고 있어요.</strong><br/><br/>우리는 당근서비스 전반에서 발생하는 전사 이벤트와 담당이 모호한 업무들을 살펴보고, <em>적절한 팀이 책임지고 처리할 수 있도록 흐름과 기준을 정리하는 역할</em>을 하고 있어요.<br/><br/>당장의 이슈를 넘기는 것보다, 왜 문제가 발생했는지 구조를 확인하고 <strong>같은 상황이 반복되지 않도록 R/R과 운영 프로세스를 정비하는 것</strong>을 중요하게 생각해요.<br/><br/>우리의 가장 중요한 우선순위는 <strong>1) 전사 이벤트나 예외 상황에서 발생하는 이슈를 빠르게 파악</strong>하고, <strong>2) 이후에는 명확한 기준과 운영 구조를 통해 안정적으로 대응할 수 있는 환경을 만드는 것</strong>이에요.'
            }
          ],
          crossLinks: [
            { text: '프로덕트 그룹 소개 바로가기', href: '/teams/product' },
            { text: '사업운영그룹 소개 바로가기', href: '/teams/business' },
            { text: '경영지원그룹 소개 바로가기', href: '/teams/support' }
          ]
        },
        {
          pagePath: '/teams/support',
          pageName: '경영지원 그룹 소개',
          badge: 'Management Support Group',
          title: '당근서비스의<br/>경영지원 그룹을 소개해요.',
          img: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
          quote: '“조직의 성장 파트너로서 구성원이 업무에 온전히 몰입할 수 있는 즐거운 문화와 최상의 환경을 지원합니다.”',
          teams: [
            {
              name: '성장문화팀',
              desc: '성장문화팀은 CX조직의 성장을 돕는 ‘조직 성장 파트너’예요.<br/><br/>• 문화로 즐겁고 몰입도 높은 업무 환경을 만들어요.<br/>• 교육과 품질을 통해 구성원의 문제 해결 역량과 고객 경험을 높여요.<br/>• 데이터 분석을 바탕으로 더 정확한 의사결정과 지속적인 개선을 지원해요.'
            },
            {
              name: '피플팀',
              desc: '피플팀은 구성원이 업무에 온전히 몰입할 수 있도록 든든한 업무 환경과 기반을 지원하는 팀이에요.<br/><br/>• GA(총무) 및 쾌적한 오피스 인프라 환경 구축<br/>• HR 정책 및 인사 운영 관리<br/>• 공정하고 신속한 Payroll(급여) 및 복리후생 지원<br/>• 우수한 동료를 발굴하는 채용 매니지먼트<br/>• 스마트한 업무 환경을 위한 IT Management를 책임집니다.'
            }
          ],
          crossLinks: [
            { text: '프로덕트 그룹 소개 바로가기', href: '/teams/product' },
            { text: '사업운영그룹 소개 바로가기', href: '/teams/business' },
            { text: '독립 그룹 소개 바로가기', href: '/teams/vertical' }
          ]
        }
      ];

      for (const sub of subpages) {
        const subHtml = getGroupTemplateHtml({
          groupBadge: sub.badge,
          groupTitle: sub.title,
          groupImg: sub.img,
          groupQuote: sub.quote,
          teams: sub.teams,
          crossLinks: sub.crossLinks
        });
        await new Promise((res, rej) => {
          db.run(
            `INSERT INTO pages (version_name, page_path, page_name, html, css, components_json, seo_title, seo_description, favicon_url, is_published)
             VALUES (?, ?, ?, ?, ?, '{}', ?, ?, '/images/favicon-192.png', 1)`,
            [`공식 배포 (${sub.pageName})`, sub.pagePath, sub.pageName, subHtml, mainCss, `${sub.pageName} - 당근서비스 채용`, `당근서비스 ${sub.pageName}을 소개합니다.`],
            function (err) {
              if (err) return rej(err);
              const newId = this.lastID;
              db.run('UPDATE pages SET is_published = 0 WHERE page_path = ? AND id != ?', [sub.pagePath, newId], () => res());
            }
          );
        });
      }

      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

function getRichTemplateData() {
  return seedDefaultPage();
}

// ── Article Database CRUD & Seed Functions ──────────────────────

function getAllArticles({ status, tag } = {}) {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT id, slug, title, subtitle, thumbnail_url, author, tags, status, published_at, created_at, updated_at FROM articles WHERE 1=1';
    const params = [];
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    sql += ' ORDER BY COALESCE(published_at, created_at) DESC';
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      let results = (rows || []).map(r => ({
        ...r,
        tags: (function() { try { return JSON.parse(r.tags || '[]'); } catch(e) { return []; } })()
      }));
      if (tag) {
        results = results.filter(r => r.tags.includes(tag));
      }
      resolve(results);
    });
  });
}

function getArticleBySlug(slug) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM articles WHERE slug = ?', [slug], (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(null);
      row.tags = (function() { try { return JSON.parse(row.tags || '[]'); } catch(e) { return []; } })();
      resolve(row);
    });
  });
}

function getArticleById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM articles WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(null);
      row.tags = (function() { try { return JSON.parse(row.tags || '[]'); } catch(e) { return []; } })();
      resolve(row);
    });
  });
}

function createArticle({ slug, title, subtitle, thumbnail_url, author, content, content_html, tags, status, published_at }) {
  return new Promise((resolve, reject) => {
    const tagsStr = typeof tags === 'string' ? tags : JSON.stringify(tags || []);
    const pubDate = published_at || new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO articles (slug, title, subtitle, thumbnail_url, author, content, content_html, tags, status, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      slug,
      title,
      subtitle || '',
      thumbnail_url || '',
      author || '당근서비스팀',
      content || '{}',
      content_html || '',
      tagsStr,
      status || 'draft',
      pubDate,
      function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, slug });
      }
    );
  });
}

function updateArticle(id, { slug, title, subtitle, thumbnail_url, author, content, content_html, tags, status, published_at }) {
  return new Promise((resolve, reject) => {
    const tagsStr = typeof tags === 'string' ? tags : JSON.stringify(tags || []);
    const stmt = db.prepare(`
      UPDATE articles
      SET slug = ?, title = ?, subtitle = ?, thumbnail_url = ?, author = ?, content = ?, content_html = ?, tags = ?, status = ?, published_at = COALESCE(?, published_at), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(
      slug,
      title,
      subtitle || '',
      thumbnail_url || '',
      author || '당근서비스팀',
      content || '{}',
      content_html || '',
      tagsStr,
      status || 'draft',
      published_at || null,
      id,
      function (err) {
        if (err) reject(err);
        else resolve({ success: true, changes: this.changes });
      }
    );
  });
}

function toggleArticleStatus(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT status FROM articles WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error('Article not found'));
      const newStatus = row.status === 'published' ? 'draft' : 'published';
      db.run('UPDATE articles SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, id], function (err2) {
        if (err2) return reject(err2);
        resolve({ success: true, status: newStatus });
      });
    });
  });
}

function deleteArticle(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM articles WHERE id = ?', [id], function (err) {
      if (err) reject(err);
      else resolve({ success: true, changes: this.changes });
    });
  });
}

function seedInitialArticle() {
  const initialHtml = `
    <h3>🥕 당근서비스 이사 D-7</h3>
    <p>새로운 공간에서의 첫 출근을 앞두고, 당근서비스 구성원들은 어떤 순간을 가장 기대하고 있었을까요?</p>
    <blockquote>
      <p>👧🏻Bella : “바라만 봐도 여유가 생길 수 있는 통창이 있었으면 좋겠어요!”</p>
      <p>👩🏻Vivian : “잠깐의 휴식을 취할 수 있거나, 모두가 함께 모일 수 있는 라운지가 있으면 정말 좋을 것 같아요!”</p>
    </blockquote>
    <p>새로운 공간에 대한 기대감이 하나 둘 모여, 이사 준비 기간 내내 우리를 설레게 했어요.</p>
    <hr>
    <h3>🚚 당근서비스 이사 D-day</h3>
    <p>2024년 6월 3일, 유난히도 뜨거웠던 초여름.<br>설레는 기다림 끝에 드디어 당근서비스가 새 오피스로 이사했어요!</p>
    <p>‘설명이 필요 없는 고객 만족’을 향해 쉼 없이 달려온 구성원들에게 더 나은 업무 환경을 선물하는 뜻깊은 순간이었죠.<br>새로운 오피스에 첫 발을 내딛던 그날, 당근서비스 전 구성원이 주인공이 되어 함께 축하하는 자리를 가졌어요.</p>
    <p><img src="https://opening-attachments.greetinghr.com/2025-09-09/bd37f014-69f3-4f49-8673-270d6c4a0936/image.png.webp" alt="새로운 오피스 전경"></p>
    <p><img src="https://opening-attachments.greetinghr.com/2025-09-09/618ef705-d975-45e4-bd25-1704e8eb3c04/IMG_2014.jpg.webp" alt="라운지 공간"></p>
    <hr>
    <h3>🎉 구성원 모두가 주인공이 된 하루</h3>
    <p>이삿날을 맞아, 구성원들을 위한 깜짝 이벤트도 준비했어요.</p>
    <ul>
      <li>🥮 이사 떡, 컵 과일, 축하 케이크로 달콤하게 시작</li>
      <li>🎁 웰컴 키트로 새로운 자리에 앉는 순간까지 특별하게</li>
      <li>📸 당근 포토존에서 남긴 웃음 가득한 인증샷</li>
      <li>🏆 당근서비스의 시상식에서 탄생한 깜짝 수상자들!</li>
    </ul>
    <p>그리고 가장 반응이 뜨거웠던... 당근 팀의 오피스 이전 축하 영상까지!</p>
    <p>모두가 함께 웃고 즐기며, 새로운 공간에서 특별한 첫 추억을 쌓았어요.</p>
    <hr>
    <h3>🌱 새로운 출발선 위의 당근서비스</h3>
    <p>이번 이사는 단순히 장소를 옮긴 것이 아니라, 당근서비스 구성원 모두가 더 쾌적한 공간에서 더 큰 가능성을 펼칠 수 있는 출발선이 되었어요.</p>
    <p>무엇보다도 전 구성원이 함께 모여, 우리가 걸어온 길과 앞으로 나아갈 방향을 되돌아보는 소중한 시간이기도 했어요.</p>
    <p>앞으로 새로운 오피스에서 피어날 당근서비스의 이야기들, 많이 기대해 주세요! 🧡</p>
  `.trim();

  const initialJson = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "🥕 당근서비스 이사 D-7" }]
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "새로운 공간에서의 첫 출근을 앞두고, 당근서비스 구성원들은 어떤 순간을 가장 기대하고 있었을까요?" }]
      },
      {
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "👧🏻Bella : “바라만 봐도 여유가 생길 수 있는 통창이 있었으면 좋겠어요!”" }]
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "👩🏻Vivian : “잠깐의 휴식을 취할 수 있거나, 모두가 함께 모일 수 있는 라운지가 있으면 정말 좋을 것 같아요!”" }]
          }
        ]
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "새로운 공간에 대한 기대감이 하나 둘 모여, 이사 준비 기간 내내 우리를 설레게 했어요." }]
      },
      { type: "horizontalRule" },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "🚚 당근서비스 이사 D-day" }]
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "2024년 6월 3일, 유난히도 뜨거웠던 초여름. 설레는 기다림 끝에 드디어 당근서비스가 새 오피스로 이사했어요!" }]
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "‘설명이 필요 없는 고객 만족’을 향해 쉼 없이 달려온 구성원들에게 더 나은 업무 환경을 선물하는 뜻깊은 순간이었죠. 새로운 오피스에 첫 발을 내딛던 그날, 당근서비스 전 구성원이 주인공이 되어 함께 축하하는 자리를 가졌어요." }]
      },
      {
        type: "image",
        attrs: {
          src: "https://opening-attachments.greetinghr.com/2025-09-09/bd37f014-69f3-4f49-8673-270d6c4a0936/image.png.webp",
          alt: "새로운 오피스 전경"
        }
      },
      {
        type: "image",
        attrs: {
          src: "https://opening-attachments.greetinghr.com/2025-09-09/618ef705-d975-45e4-bd25-1704e8eb3c04/IMG_2014.jpg.webp",
          alt: "라운지 공간"
        }
      },
      { type: "horizontalRule" },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "🎉 구성원 모두가 주인공이 된 하루" }]
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "이삿날을 맞아, 구성원들을 위한 깜짝 이벤트도 준비했어요." }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "🥮 이사 떡, 컵 과일, 축하 케이크로 달콤하게 시작" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "🎁 웰컴 키트로 새로운 자리에 앉는 순간까지 특별하게" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "📸 당근 포토존에서 남긴 웃음 가득한 인증샷" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "🏆 당근서비스의 시상식에서 탄생한 깜짝 수상자들!" }] }]
          }
        ]
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "그리고 가장 반응이 뜨거웠던... 당근 팀의 오피스 이전 축하 영상까지!" }]
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "모두가 함께 웃고 즐기며, 새로운 공간에서 특별한 첫 추억을 쌓았어요." }]
      },
      { type: "horizontalRule" },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "🌱 새로운 출발선 위의 당근서비스" }]
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "이번 이사는 단순히 장소를 옮긴 것이 아니라, 당근서비스 구성원 모두가 더 쾌적한 공간에서 더 큰 가능성을 펼칠 수 있는 출발선이 되었어요." }]
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "무엇보다도 전 구성원이 함께 모여, 우리가 걸어온 길과 앞으로 나아갈 방향을 되돌아보는 소중한 시간이기도 했어요." }]
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "앞으로 새로운 오피스에서 피어날 당근서비스의 이야기들, 많이 기대해 주세요! 🧡" }]
      }
    ]
  };

  return createArticle({
    slug: 'inside1',
    title: '새로운 오피스, 그리고 새로운 시작',
    subtitle: '더 좋은 환경에서 업무에 집중할 수 있도록 시작된 오피스 이전',
    thumbnail_url: 'https://opening-attachments.greetinghr.com/2025-10-29/10d70084-3e78-4969-8c59-3e0747a70d94/IMG_2029.jpeg(1).png.webp',
    author: '당근서비스팀',
    content: JSON.stringify(initialJson),
    content_html: initialHtml,
    tags: ['Culture', '오피스'],
    status: 'published'
  });
}

async function seedAllArticles() {
  const existing = await getArticleBySlug('inside1');
  if (!existing) {
    await seedInitialArticle();
  }
}

module.exports = {
  initDb,
  normalizePath,
  savePageDraft,
  publishPage,
  rollbackPage,
  getPublishedPage,
  getLatestPage,
  getAllPages,
  getAllVersions,
  getVersionById,
  createSubPage,
  updatePageSettings,
  deletePage,
  getGroupTemplateHtml,
  getBlankTemplateHtml,
  getProcessTemplateHtml,
  getApplyTemplateHtml,
  seedDefaultSubPages,
  syncAllOfficialContent,
  getRichTemplateData,
  getOfficialHtml,
  getOfficialCss,
  getAllArticles,
  getArticleBySlug,
  getArticleById,
  createArticle,
  updateArticle,
  toggleArticleStatus,
  deleteArticle,
  seedInitialArticle,
  seedAllArticles
};

