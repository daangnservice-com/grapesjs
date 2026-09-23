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
      db.run(`
        CREATE TABLE IF NOT EXISTS pages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version_name TEXT NOT NULL,
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
        
        // Add favicon_url column to existing database if missing
        db.run(`ALTER TABLE pages ADD COLUMN favicon_url TEXT DEFAULT '/images/favicon-192.png'`, () => {
          // Check if there is at least one initial seed page
          db.get('SELECT COUNT(*) as count FROM pages', (err, row) => {
            if (err) return reject(err);
            if (row.count === 0) {
              seedDefaultPage().then(resolve).catch(reject);
            } else {
              resolve();
            }
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
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU header-dropdown-trigger" onclick="this.parentElement.classList.toggle('is-open')">
              <span class="sc-aYaIB gigtVE">팀 소개</span>
              <svg class="header-chevron-icon" viewBox="0 0 16 16" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="header-dropdown-menu">
              <a href="#team-product" class="header-dropdown-item">프로덕트</a>
              <a href="#team-biz" class="header-dropdown-item">사업운영</a>
              <a href="#team-independent" class="header-dropdown-item">독립</a>
            </div>
          </div>

          <!-- 3. 콘텐츠 (People / Culture / CX) -->
          <div class="header-menu-item-group">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU header-dropdown-trigger" onclick="this.parentElement.classList.toggle('is-open')">
              <span class="sc-aYaIB gigtVE">콘텐츠</span>
              <svg class="header-chevron-icon" viewBox="0 0 16 16" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="header-dropdown-menu">
              <a href="#content-people" class="header-dropdown-item">People</a>
              <a href="#content-culture" class="header-dropdown-item">Culture</a>
              <a href="#content-cx" class="header-dropdown-item">CX</a>
            </div>
          </div>

          <!-- 4. 채용 절차 (프로세스 / 자주묻는질문) -->
          <div class="header-menu-item-group">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cIuITU header-dropdown-trigger" onclick="this.parentElement.classList.toggle('is-open')">
              <span class="sc-aYaIB gigtVE">채용 절차</span>
              <svg class="header-chevron-icon" viewBox="0 0 16 16" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="header-dropdown-menu">
              <a href="#process" class="header-dropdown-item">프로세스</a>
              <a href="#faq" class="header-dropdown-item">자주묻는질문</a>
            </div>
          </div>

          <!-- 5. 채용 공고 (공고 리스트) -->
          <div class="header-menu-item-group">
            <button type="button" class="header__MenuItemContainer-sc-bdd24b93-0 cbRJON header-dropdown-trigger" onclick="this.parentElement.classList.toggle('is-open')">
              <span class="sc-aYaIB gigtVE">채용 공고</span>
              <svg class="header-chevron-icon" viewBox="0 0 16 16" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="header-dropdown-menu">
              <a href="https://daangnservice.career.greetinghr.com/" target="_blank" class="header-dropdown-item">공고 리스트</a>
            </div>
          </div>
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

  <!-- LOCAL QUESTIONS SECTION (당근서비스가 고민하는 로컬의 질문들 - 3개 노출 슬라이딩 캐러셀) -->
  <section style="background-color: #ffffff; padding: 100px 0 80px;">
    <div style="text-align: center; padding: 0 24px; margin-bottom: 36px;">
      <h2 style="font-size: 44px; font-weight: 800; color: #212124; margin: 0 0 16px; letter-spacing: -0.5px;">당근서비스가 고민하는 로컬의 질문들</h2>
      <img src="https://careers-prismic-image-proxy.krrt.io/karrot/aiqUKKlQnVZVENN4_%E1%84%85%E1%85%A9%E1%84%8F%E1%85%A5%E1%86%AF%E1%84%8B%E1%85%B4%E1%84%8C%E1%85%B5%E1%86%AF%E1%84%86%E1%85%AE%E1%86%AB%E1%84%83%E1%85%B3%E1%86%AF_%E1%84%8E%E1%85%A5%E1%86%BA%E1%84%91%E1%85%B3%E1%84%85%E1%85%A6%E1%84%8B%E1%85%B5%E1%86%B7.png?auto=compress&w=960&fit=max&fm=webp" alt="로컬의 질문들 일러스트" style="max-width: 540px; width: 90%; display: block; margin: 0 auto;" />
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
  </section>

  <!-- CULTURE STICKY SCROLL SECTION (당근서비스가 일하는 방식: 좌측 고정 네비 + 우측 스티키 카드 스택) -->
  <section id="culture" style="background-color: #ffffff; padding: 80px 0 140px;">
    <div style="max-width: 1120px; margin: 0 auto; padding: 0 24px;">
      <h2 style="font-size: 44px; font-weight: 800; text-align: center; color: #212124; margin-bottom: 16px;">소수정예 팀의 경계 없는 몰입</h2>
      <p style="font-size: 18px; color: #868B94; text-align: center; max-width: 760px; margin: 0 auto 72px; line-height: 1.6;">
        동네를 개발거리로 보는 빌더의 상상력은 100m 앞 현장까지 뻗어 나갑니다.<br/>
        한 사람이 직무의 경계를 넘어 문제를 직접 해결하고,<br/>
        그 변화는 수천만의 일상에 가장 빠르게 닿습니다. 당근서비스가 일하는 방식입니다.
      </p>
      <!-- Sticky container: left interactive sticky list + right sticky cards stack -->
      <div class="daangn-sticky-stack-container">
        <!-- Left sticky list -->
        <div class="daangn-sticky-left">
          <span style="font-size: 14px; font-weight: 800; color: #FF6F0F; letter-spacing: 0.5px;">당근서비스가 일하는 방식</span>
          <div class="sticky-value-list" id="stickyValueList">
            <div class="sticky-value-item is-active" data-index="0" onclick="scrollToStickyCard(0)">신뢰와 충돌</div>
            <div class="sticky-value-item" data-index="1" onclick="scrollToStickyCard(1)">빌더십</div>
            <div class="sticky-value-item" data-index="2" onclick="scrollToStickyCard(2)">실행력</div>
            <div class="sticky-value-item" data-index="3" onclick="scrollToStickyCard(3)">유저 임팩트</div>
            <div class="sticky-value-item" data-index="4" onclick="scrollToStickyCard(4)">공개와 공유</div>
          </div>
          <div class="sticky-desc-box" id="stickyDescBox">
            서로 다른 관점이 충돌할 때 더 나은 답이 탄생합니다. 치열하게 의견을 나누고, 결정된 방향에는 전적으로 몰입하여 최고의 결과를 만들어냅니다.
          </div>
        </div>
        <!-- Right sticky cards stack: 섹션 1개당 1개 이미지 + 글 수정 및 자유로운 추가 가능 -->
        <div class="daangn-cards-stack" id="stickyCardsStack">
          <!-- Card 1: 신뢰와 충돌 -->
          <div class="daangn-sticky-card" data-index="0" data-label="신뢰와 충돌">
            <div class="daangn-sticky-card-media">
              <img src="https://careers-prismic-image-proxy.krrt.io/karrot/ai_1Fo1P9HI4Ug1L_%E1%84%89%E1%85%B5%E1%86%AB%E1%84%85%E1%85%AC%E1%84%8B%E1%85%AA%E1%84%8E%E1%85%AE%E1%86%BC%E1%84%83%E1%85%A9%E1%86%AF_F.png?auto=compress&w=900&fit=max&fm=webp" alt="신뢰와 충돌" class="daangn-sticky-card-img" />
            </div>
            <div class="daangn-sticky-card-caption">
              <span class="daangn-sticky-card-tag">01 · 일하는 방식</span>
              <h3 class="daangn-sticky-card-title">신뢰와 충돌</h3>
              <p class="daangn-sticky-card-desc">서로 다른 관점이 충돌할 때 더 나은 답이 탄생합니다. 치열하게 의견을 나누고, 결정된 방향에는 전적으로 몰입하여 최고의 결과를 만들어냅니다.</p>
            </div>
          </div>

          <!-- Card 2: 빌더십 -->
          <div class="daangn-sticky-card" data-index="1" data-label="빌더십">
            <div class="daangn-sticky-card-media">
              <img src="/images/builder-spirit.webp" alt="빌더십" class="daangn-sticky-card-img" />
            </div>
            <div class="daangn-sticky-card-caption">
              <span class="daangn-sticky-card-tag">02 · 일하는 방식</span>
              <h3 class="daangn-sticky-card-title">빌더십</h3>
              <p class="daangn-sticky-card-desc">직무의 경계를 넘어 문제를 직접 발견하고 해결하는 사람들이 있습니다. 시키는 일에 머물지 않고 스스로 주인이 되어 프로덕트를 만들어갑니다.</p>
            </div>
          </div>

          <!-- Card 3: 실행력 -->
          <div class="daangn-sticky-card" data-index="2" data-label="실행력">
            <div class="daangn-sticky-card-media">
              <img src="https://careers-prismic-image-proxy.krrt.io/karrot/ahhmCrK9tuLqEO1Y_%E1%84%89%E1%85%B5%E1%86%AF%E1%84%92%E1%85%A2%E1%86%BC%E1%84%85%E1%85%A7%E1%86%A8_F.png?auto=compress&w=900&fit=max&fm=webp" alt="실행력" class="daangn-sticky-card-img" />
            </div>
            <div class="daangn-sticky-card-caption">
              <span class="daangn-sticky-card-tag">03 · 일하는 방식</span>
              <h3 class="daangn-sticky-card-title">실행력</h3>
              <p class="daangn-sticky-card-desc">100m 앞 현장까지 상상력을 뻗어 빠르게 실행합니다. 긴 탁상공론 대신 작은 실행과 빠른 피드백을 통해 기민하게 개선합니다.</p>
            </div>
          </div>

          <!-- Card 4: 유저 임팩트 -->
          <div class="daangn-sticky-card" data-index="3" data-label="유저 임팩트">
            <div class="daangn-sticky-card-media">
              <img src="https://careers-prismic-image-proxy.krrt.io/karrot/ahhmDrK9tuLqEO1Z_%E1%84%8B%E1%85%B2%E1%84%8C%E1%85%A5%E1%84%8B%E1%85%B5%E1%86%B7%E1%84%91%E1%85%A2%E1%86%A8%E1%84%90%E1%85%B3_F.png?auto=compress&w=900&fit=max&fm=webp" alt="유저 임팩트" class="daangn-sticky-card-img" />
            </div>
            <div class="daangn-sticky-card-caption">
              <span class="daangn-sticky-card-tag">04 · 일하는 방식</span>
              <h3 class="daangn-sticky-card-title">유저 임팩트</h3>
              <p class="daangn-sticky-card-desc">수천만 이웃의 일상에 가장 빠르게 닿는 변화를 만듭니다. 우리의 모든 결정과 기술적 도전은 사용자에게 실질적인 가치를 줍니다.</p>
            </div>
          </div>

          <!-- Card 5: 공개와 공유 -->
          <div class="daangn-sticky-card" data-index="4" data-label="공개와 공유">
            <div class="daangn-sticky-card-media">
              <img src="https://careers-prismic-image-proxy.krrt.io/karrot/ahhl_rK9tuLqEO1U_%E1%84%80%E1%85%A9%E1%86%BC%E1%84%80%E1%85%A2%E1%84%8B%E1%85%AA%E1%84%80%E1%85%A9%E1%86%BC%E1%84%8B%E1%85%B2_F.png?auto=compress&w=900&fit=max&fm=webp" alt="공개와 공유" class="daangn-sticky-card-img" />
            </div>
            <div class="daangn-sticky-card-caption">
              <span class="daangn-sticky-card-tag">05 · 일하는 방식</span>
              <h3 class="daangn-sticky-card-title">공개와 공유</h3>
              <p class="daangn-sticky-card-desc">투명하게 공유하고 함께 성장하는 문화를 지향합니다. 모든 맥락과 정보를 공개하여 누구나 최선의 판단을 내릴 수 있습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- TEAM INTRODUCTION SECTION (당근서비스 팀 소개 - 3개 노출 슬라이딩 캐러셀) -->
  <section id="team" style="background-color: #ffffff; padding: 100px 24px 60px;">
    <div style="max-width: 1140px; margin: 0 auto; position: relative;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px;">
        <div>
          <span style="font-size: 14px; font-weight: 800; color: #FF6F0F; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">OUR TEAMS</span>
          <h2 style="font-size: 38px; font-weight: 800; color: #212124; margin: 0; letter-spacing: -0.5px;">당근서비스 팀을 소개해요</h2>
          <p style="font-size: 16px; color: #868B94; margin: 8px 0 0; line-height: 1.5;">지역 생활을 더 가깝고 편리하게, 당근 이웃의 고객 경험을 완성하는 전담 조직입니다.</p>
        </div>
        <a href="https://daangnservice.career.greetinghr.com/ko/team" target="_blank" rel="noopener noreferrer" class="daangn-more-link" style="display: inline-flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 600; color: #4D5159; text-decoration: none; transition: color 0.2s;">전체 팀 보러가기 ➔</a>
      </div>

      <div class="daangn-team-carousel">
        <!-- Prev & Next Arrows (3개 노출 슬라이딩 네비게이션) -->
        <button id="teamPrevBtn" class="daangn-carousel-arrow daangn-carousel-arrow-prev" aria-label="이전 팀">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <button id="teamNextBtn" class="daangn-carousel-arrow daangn-carousel-arrow-next" aria-label="다음 팀">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        <!-- Viewport -->
        <div class="daangn-team-viewport">
          <!-- Track with Team Cards -->
          <div id="teamTrack" class="daangn-team-track">
            <!-- Team 1: 중고거래 팀 -->
            <a href="https://daangnservice.career.greetinghr.com/ko/team" target="_blank" rel="noopener noreferrer" class="daangn-team-card">
              <img src="https://prismic-image-proxy.krrt.io/karrot/f92b5275-92ec-4ce0-b196-c71dc36239c3_service_01.jpg" alt="중고거래 팀" class="daangn-team-card-img" />
              <div class="daangn-team-card-overlay">
                <span class="daangn-team-card-badge">SECOND-HAND</span>
                <h3 class="daangn-team-card-title">중고거래 팀</h3>
                <p class="daangn-team-card-desc">안전하고 원활한 중고거래를 지원하며, 거래 과정의 피해를 예방해 누구나 안심하고 거래할 수 있는 환경을 만들어요.</p>
                <span class="daangn-team-card-link">팀 자세히 보기 ➔</span>
              </div>
            </a>

            <!-- Team 2: 동네생활 (커뮤니티) 팀 -->
            <a href="https://daangnservice.career.greetinghr.com/ko/team" target="_blank" rel="noopener noreferrer" class="daangn-team-card">
              <img src="https://prismic-image-proxy.krrt.io/karrot/1e36a8e6-39e3-4a12-8766-73e3e9ad53b6_service_02.jpg" alt="동네생활 팀" class="daangn-team-card-img" />
              <div class="daangn-team-card-overlay">
                <span class="daangn-team-card-badge">COMMUNITY</span>
                <h3 class="daangn-team-card-title">동네생활 팀</h3>
                <p class="daangn-team-card-desc">온·오프라인 모임과 동네생활을 통해 이웃 간 더욱 따뜻하고 활발한 교류가 이루어질 수 있도록 소통 공간을 운영해요.</p>
                <span class="daangn-team-card-link">팀 자세히 보기 ➔</span>
              </div>
            </a>

            <!-- Team 3: 당근알바 팀 -->
            <a href="https://daangnservice.career.greetinghr.com/ko/team" target="_blank" rel="noopener noreferrer" class="daangn-team-card">
              <img src="https://prismic-image-proxy.krrt.io/karrot/f25a287d-a97e-4040-8b8f-62e616d266bd_service_05.jpg" alt="당근알바 팀" class="daangn-team-card-img" />
              <div class="daangn-team-card-overlay">
                <span class="daangn-team-card-badge">JOBS</span>
                <h3 class="daangn-team-card-title">당근알바 팀</h3>
                <p class="daangn-team-card-desc">이웃 간 신뢰를 바탕으로 가까운 거리의 믿을 수 있는 일자리와 일손을 빠르고 안전하게 연결해요.</p>
                <span class="daangn-team-card-link">팀 자세히 보기 ➔</span>
              </div>
            </a>

            <!-- Team 4: 비즈프로필 (로컬비즈니스) 팀 -->
            <a href="https://daangnservice.career.greetinghr.com/ko/team" target="_blank" rel="noopener noreferrer" class="daangn-team-card">
              <img src="https://prismic-image-proxy.krrt.io/karrot/10d0e07e-9bcf-48a8-b375-fcd43b533606_service_03.jpg" alt="비즈프로필 팀" class="daangn-team-card-img" />
              <div class="daangn-team-card-overlay">
                <span class="daangn-team-card-badge">LOCAL BUSINESS</span>
                <h3 class="daangn-team-card-title">비즈프로필 팀</h3>
                <p class="daangn-team-card-desc">동네 가게의 소식과 쿠폰, 단골 소통을 지원하여 지역 소상공인과 동네 이웃이 함께 상생하도록 도와요.</p>
                <span class="daangn-team-card-link">팀 자세히 보기 ➔</span>
              </div>
            </a>

            <!-- Team 5: 부동산 직거래 팀 -->
            <a href="https://daangnservice.career.greetinghr.com/ko/team" target="_blank" rel="noopener noreferrer" class="daangn-team-card">
              <img src="https://prismic-image-proxy.krrt.io/karrot/20388bc0-6492-40af-9cd5-475813c19c08_service_07.jpg" alt="부동산 직거래 팀" class="daangn-team-card-img" />
              <div class="daangn-team-card-overlay">
                <span class="daangn-team-card-badge">REAL ESTATE</span>
                <h3 class="daangn-team-card-title">부동산 직거래 팀</h3>
                <p class="daangn-team-card-desc">투명한 정보와 꼼꼼한 매물 심사로 허위 매물을 걸러내고, 이웃 간 수수료 부담 없이 안심 거래하도록 도와요.</p>
                <span class="daangn-team-card-link">팀 자세히 보기 ➔</span>
              </div>
            </a>

            <!-- Team 6: 중고차 직거래 팀 -->
            <a href="https://daangnservice.career.greetinghr.com/ko/team" target="_blank" rel="noopener noreferrer" class="daangn-team-card">
              <img src="https://prismic-image-proxy.krrt.io/karrot/66cb4772-88d5-4def-9fd1-937c402ad853_service_06.jpg" alt="중고차 직거래 팀" class="daangn-team-card-img" />
              <div class="daangn-team-card-overlay">
                <span class="daangn-team-card-badge">USED CAR</span>
                <h3 class="daangn-team-card-title">중고차 직거래 팀</h3>
                <p class="daangn-team-card-desc">투명하고 객관적인 차량 정보와 안심 직거래 프로세스를 통해 누구나 합리적인 가격에 믿고 거래하도록 도와요.</p>
                <span class="daangn-team-card-link">팀 자세히 보기 ➔</span>
              </div>
            </a>

            <!-- Team 7: 페이 팀 (당근페이) -->
            <a href="https://daangnservice.career.greetinghr.com/ko/team" target="_blank" rel="noopener noreferrer" class="daangn-team-card">
              <img src="https://prismic-image-proxy.krrt.io/karrot/f4df9e8e-d7f5-42ff-818b-bc0ab23da6d7_service_08.jpg" alt="당근페이 팀" class="daangn-team-card-img" />
              <div class="daangn-team-card-overlay">
                <span class="daangn-team-card-badge">FINTECH & PAY</span>
                <h3 class="daangn-team-card-title">당근페이 팀</h3>
                <p class="daangn-team-card-desc">현금 없이 채팅창에서 바로 송금하고 결제하는 간편하고 안전한 동네 로컬 핀테크 금융 생활을 책임져요.</p>
                <span class="daangn-team-card-link">팀 자세히 보기 ➔</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- STORIES & NEWS SECTION (인사이드 당근서비스 - 하나씩 넘겨지는 카드) -->
  <section id="inside" style="background-color: #ffffff; padding: 40px 24px 100px;">
    <div style="max-width: 1140px; margin: 0 auto; position: relative;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px;">
        <div>
          <span style="font-size: 14px; font-weight: 800; color: #FF6F0F; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">INSIDE STORY</span>
          <h2 style="font-size: 38px; font-weight: 800; color: #212124; margin: 0; letter-spacing: -0.5px;">인사이드 당근서비스</h2>
          <p style="font-size: 16px; color: #868B94; margin: 8px 0 0; line-height: 1.5;">따뜻한 경험을 만드는 당근서비스와 구성원의 생생한 성장 이야기를 들려드릴게요.</p>
        </div>
        <a href="https://daangnservice.career.greetinghr.com/ko/inside" target="_blank" rel="noopener noreferrer" class="daangn-more-link" style="display: inline-flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 600; color: #4D5159; text-decoration: none; transition: color 0.2s;">전체 이야기 보기 ➔</a>
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
            <!-- Story 1: 송년회 -->
            <a href="https://daangnservice.career.greetinghr.com/ko/seasonsgreeting" target="_blank" rel="noopener noreferrer" class="daangn-story-card">
              <div class="daangn-story-img-box">
                <img src="https://opening-attachments.greetinghr.com/2025-12-31/6231bd8a-a36c-4a11-9b7c-09069110f94e/IMG_4030(1).jpg.webp" alt="2025 당근서비스 송년의 밤" class="daangn-story-img" />
              </div>
              <div class="daangn-story-info">
                <h4 class="daangn-story-title">2025 당근서비스 송년의 밤</h4>
                <p class="daangn-story-sub">함께였기에 더 빛날 수 있었던 한 해, 그 시간을 만든 주인공들</p>
                <span class="daangn-story-tag">컬처</span>
              </div>
            </a>

            <!-- Story 2: 10X 리더의 첫 걸음 -->
            <a href="https://daangnservice.career.greetinghr.com/ko/1st10x" target="_blank" rel="noopener noreferrer" class="daangn-story-card">
              <div class="daangn-story-img-box">
                <img src="https://opening-attachments.greetinghr.com/2025-12-26/878130fb-10c6-4b49-affc-dd47ef83e8e6/IMG_9775.jpg.png.webp" alt="[10X] 누구나 처음 리더가 되는 순간이 있다" class="daangn-story-img" />
              </div>
              <div class="daangn-story-info">
                <h4 class="daangn-story-title">[10X] 누구나 처음 리더가 되는 순간이 있다</h4>
                <p class="daangn-story-sub">리더의 첫 걸음, 당근서비스 CEO Brent가 전하는 리더십 이야기</p>
                <span class="daangn-story-tag">그로스</span>
              </div>
            </a>

            <!-- Story 3: 10X 앞으로 당근서비스가 가려는 길 -->
            <a href="https://daangnservice.career.greetinghr.com/ko/2nd10x" target="_blank" rel="noopener noreferrer" class="daangn-story-card">
              <div class="daangn-story-img-box">
                <img src="https://opening-attachments.greetinghr.com/2025-12-30/a1c156b1-ef07-4f59-b6c8-7a10c468a96d/IMG_0573(1).jpg.webp" alt="[10X] 앞으로 당근서비스가 가려는 길" class="daangn-story-img" />
              </div>
              <div class="daangn-story-info">
                <h4 class="daangn-story-title">[10X] 앞으로 당근서비스가 가려는 길</h4>
                <p class="daangn-story-sub">당근서비스의 향후 방향성과 비전, CEO Brent의 인사이트</p>
                <span class="daangn-story-tag">그로스</span>
              </div>
            </a>

            <!-- Story 4: 한가위 -->
            <a href="https://daangnservice.career.greetinghr.com/ko/inside3" target="_blank" rel="noopener noreferrer" class="daangn-story-card">
              <div class="daangn-story-img-box">
                <img src="https://opening-attachments.greetinghr.com/2025-10-29/b528bcb6-f3bb-40d6-abeb-239e5b7740d6/A3.png.webp" alt="당근서비스가 한가위를 맞이하는 방법" class="daangn-story-img" />
              </div>
              <div class="daangn-story-info">
                <h4 class="daangn-story-title">당근서비스가 한가위를 맞이하는 방법</h4>
                <p class="daangn-story-sub">가족과 이웃이 모여 풍요와 감사를 나누는 생생한 명절 현장</p>
                <span class="daangn-story-tag">컬처</span>
              </div>
            </a>

            <!-- Story 5: 오피스 이전 -->
            <a href="https://daangnservice.career.greetinghr.com/ko/inside1" target="_blank" rel="noopener noreferrer" class="daangn-story-card">
              <div class="daangn-story-img-box">
                <img src="https://opening-attachments.greetinghr.com/2025-10-29/10d70084-3e78-4969-8c59-3e0747a70d94/IMG_2029.jpeg(1).png.webp" alt="새로운 오피스, 그리고 새로운 시작" class="daangn-story-img" />
              </div>
              <div class="daangn-story-info">
                <h4 class="daangn-story-title">새로운 오피스, 그리고 새로운 시작</h4>
                <p class="daangn-story-sub">더 좋은 환경에서 업무에 집중할 수 있도록 시작된 오피스 이전</p>
                <span class="daangn-story-tag">컬처</span>
              </div>
            </a>

            <!-- Story 6: 문화의 날 -->
            <a href="https://daangnservice.career.greetinghr.com/ko/inside2" target="_blank" rel="noopener noreferrer" class="daangn-story-card">
              <div class="daangn-story-img-box">
                <img src="https://opening-attachments.greetinghr.com/2025-10-29/f5d79a34-ba19-43b4-85d1-961547a8d0d3/Frame21333(3)(1).jpg.webp" alt="당근서비스 8월의 문화의 날" class="daangn-story-img" />
              </div>
              <div class="daangn-story-info">
                <h4 class="daangn-story-title">당근서비스 8월의 문화의 날</h4>
                <p class="daangn-story-sub">업무에서 잠시 벗어나 에너지를 충전하는 당근서비스의 특별한 하루</p>
                <span class="daangn-story-tag">컬처</span>
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

  <!-- GLOBAL FOOTER (빌더에서 로고 이미지, 회사 정보, 주소, 저작권 문구 직접 수정 가능) -->
  <footer id="daangnFooter" class="daangn-global-footer">
    <div class="daangn-footer-logo-wrapper">
      <img src="/images/daangn-service-logo.png" alt="당근서비스" class="daangn-footer-logo" />
    </div>
    <p class="daangn-footer-company">(주) 당근서비스</p>
    <p class="daangn-footer-address">서울특별시 서초구 강남대로 327, 대륭서초타워 14층 | careers.daangnservice.com</p>
  </footer>

  <!-- FLOATING CAMPAIGN PROMO STICKER (하단 플로팅 스티커 배너) -->
  <div class="daangn-floating-promo" id="daangnFloatingPromo" data-delay-seconds="5">
    <aside data-campaign-promo="" class="daangn-promo-card" data-delay-seconds="5" aria-label="채용 캠페인 안내">
      <div class="daangn-promo-delay-badge">⏱️ 접속 후 <span id="promoDelayDisplay">5</span>초 뒤 노출</div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div class="daangn-promo-header">
          <p class="daangn-promo-title">당근 서비스코어 라이브톡
선착순 신청 오픈!</p>
          <button data-promo-close="" type="button" aria-label="닫기" class="daangn-promo-close" onclick="var p = document.getElementById('daangnFloatingPromo'); if (p) { p.style.transition = 'opacity 0.25s, transform 0.25s'; p.style.opacity = '0'; p.style.transform = 'scale(0.9) translateY(12px)'; setTimeout(function() { p.style.display = 'none'; }, 260); }">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden="true">
              <path d="M20.7071 4.70711C21.0976 4.31658 21.0976 3.68342 20.7071 3.29289C20.3166 2.90237 19.6834 2.90237 19.2929 3.29289L12 10.5858L4.70711 3.29289C4.31658 2.90237 3.68342 2.90237 3.29289 3.29289C2.90237 3.68342 2.90237 4.31658 3.29289 4.70711L10.5858 12L3.29289 19.2929C2.90237 19.6834 2.90237 20.3166 3.29289 20.7071C3.68342 21.0976 4.31658 21.0976 4.70711 20.7071L12 13.4142L19.2929 20.7071C19.6834 21.0976 20.3166 21.0976 20.7071 20.7071C21.0976 20.3166 21.0976 19.6834 20.7071 19.2929L13.4142 12L20.7071 4.70711Z" fill="currentColor"></path>
            </svg>
          </button>
        </div>
        <p class="daangn-promo-desc">외부에서 듣기 어려웠던 기술과 프로덕트 이야기
채용 꿀팁까지 놓치지 마세요!</p>
      </div>
      <div class="daangn-promo-bottom">
        <a data-promo-cta="" href="https://docs.google.com/forms/d/e/1FAIpQLSehgiSE9WxgcVhWO--adS1g2NGd2I9dy3d0t0FCTN_B6j2gjA/viewform" target="_blank" rel="noopener noreferrer" class="daangn-promo-cta">신청 바로가기</a>
        <img src="https://careers-prismic-image-proxy.krrt.io/karrot/-q2lwpcLhIrFrEb2_%E1%84%86%E1%85%A6%E1%84%8B%E1%85%B5%E1%86%AB%E1%84%91%E1%85%A1%E1%86%B8%E1%84%8B%E1%85%A5%E1%86%B8%E1%84%87%E1%85%A2%E1%84%82%E1%85%A5%E1%84%8F%E1%85%B5%E1%84%87%E1%85%B5%E1%84%8C%E1%85%AE%E1%84%8B%E1%85%A5%E1%86%AF.png?auto=compress&w=504&fit=max&fm=webp" alt="라이브톡 배너" class="daangn-promo-img" />
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
        btnPrev.style.opacity = currentIndex === 0 ? '0.25' : '1';
        btnPrev.style.pointerEvents = currentIndex === 0 ? 'none' : 'auto';
      }
      if (btnNext) {
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

function savePageDraft({ versionName, html, css, componentsJson, seoTitle, seoDescription, faviconUrl }) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO pages (version_name, html, css, components_json, seo_title, seo_description, favicon_url, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `);
    stmt.run(
      versionName || `임시 저장 (${new Date().toLocaleString('ko-KR')})`,
      html,
      css,
      componentsJson || '{}',
      seoTitle || '당근서비스 채용',
      seoDescription || '당근서비스에 합류하세요.',
      faviconUrl || '/images/favicon-192.png',
      function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
}

function publishPage(id) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('UPDATE pages SET is_published = 0', (err) => {
        if (err) return reject(err);
        db.run('UPDATE pages SET is_published = 1 WHERE id = ?', [id], (err2) => {
          if (err2) return reject(err2);
          resolve({ success: true });
        });
      });
    });
  });
}

function getPublishedPage() {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM pages WHERE is_published = 1 ORDER BY id DESC LIMIT 1', (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function getLatestPage() {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM pages ORDER BY id DESC LIMIT 1', (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function getAllVersions() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, version_name, seo_title, favicon_url, is_published, created_at FROM pages ORDER BY id DESC', (err, rows) => {
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

function getRichTemplateData() {
  return seedDefaultPage();
}

module.exports = {
  initDb,
  savePageDraft,
  publishPage,
  getPublishedPage,
  getLatestPage,
  getAllVersions,
  getVersionById,
  getRichTemplateData,
  getOfficialHtml,
  getOfficialCss
};

