let editor;
let currentPageData = {
  id: null,
  seoTitle: '당근서비스 채용 - 당근다운 경험이 완성되는 당근서비스',
  seoDescription: '당근서비스에 합류하세요. 당근다운 경험이 완성되는 여정을 함께할 동료를 찾습니다.',
  faviconUrl: '/images/favicon-192.png',
  isPublished: 0
};

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize GrapesJS Editor
  editor = grapesjs.init({
    container: '#gjs',
    fromElement: false,
    height: '100%',
    width: 'auto',
    storageManager: false, // We handle storage via DB API
    blockManager: {
      appendTo: '#gjs',
    },
    canvas: {
      styles: [
        '/css/fonts.css',
        'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css',
        '/css/daangn-theme.css',
        '/css/builder-canvas.css'
      ],
      scripts: []
    }
  });

  // Customize Link Component Traits for intuitive URL Editing
  const domc = editor.DomComponents;
  domc.addType('link', {
    model: {
      defaults: {
        traits: [
          {
            type: 'text',
            name: 'href',
            label: '🔗 링크 URL (Href)',
            placeholder: 'https://careers.daangn.com/jobs/123'
          },
          {
            type: 'select',
            name: 'target',
            label: '↗️ 열기 방식',
            options: [
              { value: '_self', name: '현재 창에서 열기 (_self)' },
              { value: '_blank', name: '새 탭/새 창에서 열기 (_blank)' }
            ]
          },
          {
            type: 'text',
            name: 'title',
            label: '📝 툴팁 텍스트 (Title)'
          }
        ]
      }
    }
  });

  // Customize Promo Sticker Traits for intuitive Delay Seconds Setting
  domc.addType('daangn-floating-promo', {
    isComponent: el => {
      if (!el || !el.getAttribute) return false;
      return (el.classList && el.classList.contains('daangn-floating-promo')) || el.id === 'daangnFloatingPromo';
    },
    model: {
      defaults: {
        name: '하단 플로팅 스티커 배너',
        traits: [
          {
            type: 'number',
            name: 'data-delay-seconds',
            label: '⏱️ 노출 지연 시간 (초)',
            placeholder: '5',
            min: 0,
            max: 60,
            step: 1
          }
        ]
      }
    }
  });

  domc.addType('daangn-promo-card', {
    isComponent: el => {
      if (!el || !el.getAttribute) return false;
      return (el.classList && el.classList.contains('daangn-promo-card')) || el.hasAttribute('data-campaign-promo');
    },
    model: {
      defaults: {
        name: '스티커 카드',
        traits: [
          {
            type: 'number',
            name: 'data-delay-seconds',
            label: '⏱️ 노출 지연 시간 (초)',
            placeholder: '5',
            min: 0,
            max: 60,
            step: 1
          }
        ]
      }
    }
  });

  // Customize Header Dropdown Group Trait for intuitive previewing/editing
  domc.addType('header-menu-item-group', {
    isComponent: el => {
      if (!el || !el.getAttribute) return false;
      return (el.classList && el.classList.contains('header-menu-item-group'));
    },
    model: {
      defaults: {
        name: '헤더 메뉴 드롭다운 그룹',
        traits: [
          {
            type: 'select',
            name: 'data-state',
            label: '📂 서브메뉴 펼치기',
            options: [
              { value: 'closed', name: '기본 (접힘)' },
              { value: 'open', name: '펼쳐서 편집하기 (열림)' }
            ]
          }
        ]
      },
      init() {
        this.on('change:data-state', () => {
          const state = this.get('data-state');
          const el = this.getEl();
          if (el) {
            if (state === 'open') el.classList.add('is-open');
            else el.classList.remove('is-open');
          }
        });
      }
    }
  });

  // When clicking or selecting menu items in canvas, open dropdown so items are visible and editable
  editor.on('component:selected', (model) => {
    const el = model.getEl();
    if (!el) return;
    if (el.classList && (el.classList.contains('header-dropdown-trigger') || el.closest('.header-dropdown-trigger'))) {
      const group = el.closest('.header-menu-item-group');
      if (group) group.classList.toggle('is-open');
    } else if (el.closest && el.closest('.header-dropdown-menu')) {
      const group = el.closest('.header-menu-item-group');
      if (group) group.classList.add('is-open');
    }
  });

  // Register Custom Blocks for Daangn Recruitment
  registerSeedBlocks(editor);

  // Canvas 준비 후 페이지 로드 (CSS 주입 타이밍 보장)
  editor.on('canvas:frame:load', async () => {
    await loadCurrentPage();
    loadVersionHistory();
  });
});

// Register Custom Blocks tailored for Daangn Service Recruitment
function registerSeedBlocks(editor) {
  const bm = editor.BlockManager;

  // Category 0: 당근서비스 공식 프로덕션 컴포넌트
  bm.add('daangn-header', {
    label: '🧭 상단 헤더 (GNB 내비게이션 & 드롭다운)',
    category: '당근서비스 공식 프로덕션 컴포넌트',
    content: `
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
    `
  });

  bm.add('daangn-footer', {
    label: '🏢 하단 푸터 (Footer 정보)',
    category: '당근서비스 공식 프로덕션 컴포넌트',
    content: `
      <footer id="daangnFooter" class="daangn-global-footer">
        <div class="daangn-footer-logo-wrapper">
          <img src="/images/daangn-service-logo.png" alt="당근서비스" class="daangn-footer-logo" />
        </div>
        <p class="daangn-footer-company">(주) 당근서비스</p>
        <p class="daangn-footer-address">서울특별시 서초구 강남대로 327, 대륭서초타워 14층 | careers.daangnservice.com</p>
      </footer>
    `
  });

  bm.add('daangn-official-hero', {
    label: '🔥 메인 비디오 Hero 배너',
    category: '당근서비스 공식 프로덕션 컴포넌트',
    content: `
      <section style="background-color: #ffffff; padding-top: 60px; text-align: center; color: #212124;">
        <div style="max-width: 1200px; margin: 0 auto; padding: 0 24px;">
          <h1 style="font-size: 64px; font-weight: 800; line-height: 1.25; margin: 0 0 32px; color: #212124;"><span style="color: #FF6F0F;">당근</span>다운 경험이<br/>완성되는<span style="color: #FF6F0F;">당근서비스</span></h1>
          <div style="border-radius: 24px; overflow: hidden; max-width: 1000px; margin: 0 auto; box-shadow: 0 20px 40px rgba(0,0,0,0.08); border: 1px solid #EAEBEE;">
            <video autoplay loop muted playsinline style="width: 100%; display: block; background: #f7f9fa;">
              <source src="https://opening-attachments.greetinghr.com/2025-09-05/5d5028c2-cdcf-4704-af25-1fd2302ccdba/aHTuFEMqNJQqH1nx_video_cartoon.CPwTwaNX(1).mp4" type="video/mp4">
            </video>
          </div>
        </div>
      </section>
    `
  });

  bm.add('daangn-questions-intro', {
    label: '💡 로컬의 질문들 (3개 노출 슬라이딩 캐러셀)',
    category: '당근서비스 공식 프로덕션 컴포넌트',
    content: `
      <section style="background-color: #ffffff; padding: 100px 0 40px;">
        <div style="text-align: center; padding: 0 24px; margin-bottom: 36px;">
          <h2 style="font-size: 44px; font-weight: 800; color: #212124; margin: 0 0 16px; letter-spacing: -0.5px;">당근서비스가 고민하는 로컬의 질문들</h2>
          <img src="https://careers-prismic-image-proxy.krrt.io/karrot/aiqUKKlQnVZVENN4_%E1%84%85%E1%85%A9%E1%84%8F%E1%85%A5%E1%86%AF%E1%84%8B%E1%85%B4%E1%84%8C%E1%85%B5%E1%86%AF%E1%84%86%E1%85%AE%E1%86%AB%E1%84%83%E1%85%B3%E1%86%AF_%E1%84%8E%E1%85%A5%E1%86%BA%E1%84%91%E1%85%B3%E1%84%85%E1%85%A6%E1%84%8B%E1%85%B5%E1%86%B7.png?auto=compress&w=960&fit=max&fm=webp" alt="로컬의 질문들 일러스트" style="max-width: 540px; width: 90%; display: block; margin: 0 auto;" />
        </div>
        <div class="daangn-questions-carousel">
          <button id="questionsPrevBtn" class="daangn-carousel-arrow daangn-carousel-arrow-prev" aria-label="이전 질문">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button id="questionsNextBtn" class="daangn-carousel-arrow daangn-carousel-arrow-next" aria-label="다음 질문">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <div class="daangn-questions-viewport">
            <div id="questionsTrack" class="daangn-questions-track">
              <div class="daangn-question-card">
                <p class="daangn-question-text">전국 어딘가에 딱 하나 있는 물건과 그걸 알아본 사람을, 채팅 한 번 없이 거래까지 어떻게 연결할까요?</p>
                <div class="daangn-question-author">중고거래 · Adeline</div>
              </div>
              <div class="daangn-question-card">
                <p class="daangn-question-text">5분짜리 거래는 익숙해졌는데, 처음 보는 이웃과 한 시간 넘게 취향과 취미를 나누려면 무엇이 필요할까요?</p>
                <div class="daangn-question-author">모임 · Luana</div>
              </div>
              <div class="daangn-question-card">
                <p class="daangn-question-text">'길을 찾는 지도'가 아니라 '동네 생활을 위한 지도'라면, 콘텐츠는 어떤 맥락으로 보여야 할까요?</p>
                <div class="daangn-question-author">동네지도 · Audrey</div>
              </div>
              <div class="daangn-question-card">
                <p class="daangn-question-text">벌레 한 마리 잡는 데 5분이면 와줄 이웃과의 거리를 어떻게 허물어야, 현관문을 열게 될까요?</p>
                <div class="daangn-question-author">알바 · Jennie</div>
              </div>
              <div class="daangn-question-card">
                <p class="daangn-question-text">수만 개 매물 중 나에게 딱 맞는 동네와 딱 맞는 집을, 몇 번의 클릭으로 찾아낼 수 있을까요?</p>
                <div class="daangn-question-author">부동산 · Sam</div>
              </div>
              <div class="daangn-question-card">
                <p class="daangn-question-text">수천만 원의 거래가, 10분 거리 동네 주차장에서 일어날 수 있는 신뢰 관계를 어떻게 구축할까요?</p>
                <div class="daangn-question-author">중고차 · Zoe</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `
  });

  bm.add('daangn-official-search', {
    label: '🔍 키워드 검색바 & 소개',
    category: '당근서비스 공식 프로덕션 컴포넌트',
    content: `
      <section style="background-color: #131B19; padding: 100px 0; text-align: center; color: #fff;">
        <div style="max-width: 1040px; margin: 0 auto; padding: 0 24px;">
          <h2 style="font-size: 44px; font-weight: 800; color: #888888; margin-bottom: 24px;">로컬에 <span style="color: #FF6F0F;">중고거래 / 부동산 / 알바 / 커머스</span>를 더하면</h2>
          <p style="font-size: 20px; color: #aaaaaa; line-height: 1.7; max-width: 800px; margin: 0 auto 48px;">
            로컬에 닿는 순간, 모든 것이 개발거리가 됩니다.<br/>
            수천만의 일상을 바꾼 중고거래를 넘어 커뮤니티, 구인구직, 비즈니스, 금융까지<br/>
            끝없이 펼쳐진 하이퍼로컬 인프라, 이 거대한 현장의 빌더를 찾습니다.
          </p>
          <form action="/jobs/" style="max-width: 700px; margin: 0 auto; display: flex; align-items: center; background: rgba(255, 255, 255, 0.1); border-radius: 40px; padding: 8px 24px; border: 1px solid rgba(255, 255, 255, 0.2);">
            <input type="text" placeholder="직무, 기술, 주요 업무 등 검색" style="flex: 1; background: transparent; border: none; outline: none; color: #fff; font-size: 18px; padding: 12px 16px;" />
            <button type="submit" style="background: #FF6F0F; color: #fff; border: none; border-radius: 24px; padding: 12px 24px; font-weight: 700; font-size: 16px; cursor: pointer;">검색하기</button>
          </form>
        </div>
      </section>
    `
  });

  bm.add('daangn-culture-section', {
    label: '🏢 일하는 방식 전체 섹션 (CULTURE)',
    category: '당근서비스 공식 프로덕션 컴포넌트',
    content: `
      <section id="culture" class="daangn-culture-section">
        <div class="daangn-culture-container">
          <div class="daangn-culture-header">
            <span class="daangn-culture-header-badge">DAANGN CULTURE</span>
            <h2 class="daangn-culture-header-title">소수정예 팀의 경계 없는 몰입</h2>
            <p class="daangn-culture-header-desc">
              동네를 개발거리로 보는 빌더의 상상력은 100m 앞 현장까지 뻗어 나갑니다.<br/>
              한 사람이 직무의 경계를 넘어 문제를 직접 해결하고,<br/>
              그 변화는 수천만의 일상에 가장 빠르게 닿습니다. 당근서비스가 일하는 방식입니다.
            </p>
          </div>
          <div class="daangn-culture-list">
            <div class="daangn-culture-item">
              <div class="daangn-culture-item-content">
                <span class="daangn-culture-item-badge">01 · 일하는 방식</span>
                <h3 class="daangn-culture-item-title">신뢰와 충돌</h3>
                <p class="daangn-culture-item-desc">서로 다른 관점이 충돌할 때 더 나은 답이 탄생합니다. 치열하게 의견을 나누고, 결정된 방향에는 전적으로 몰입하여 최고의 결과를 만들어냅니다.</p>
              </div>
              <div class="daangn-culture-item-media">
                <img src="https://careers-prismic-image-proxy.krrt.io/karrot/ai_1Fo1P9HI4Ug1L_%E1%84%89%E1%85%B5%E1%86%AB%E1%84%85%E1%85%AC%E1%84%8B%E1%85%AA%E1%84%8E%E1%85%AE%E1%86%BC%E1%84%83%E1%85%A9%E1%86%AF_F.png?auto=compress&w=900&fit=max&fm=webp" alt="신뢰와 충돌" class="daangn-culture-item-img" />
              </div>
            </div>
            <div class="daangn-culture-item">
              <div class="daangn-culture-item-content">
                <span class="daangn-culture-item-badge">02 · 일하는 방식</span>
                <h3 class="daangn-culture-item-title">빌더십</h3>
                <p class="daangn-culture-item-desc">직무의 경계를 넘어 문제를 직접 발견하고 해결하는 사람들이 있습니다. 시키는 일에 머물지 않고, 스스로 주인이 되어 프로덕트와 서비스를 직접 만들어갑니다.</p>
              </div>
              <div class="daangn-culture-item-media">
                <img src="/images/builder-spirit.webp" alt="빌더십" class="daangn-culture-item-img" />
              </div>
            </div>
          </div>
        </div>
      </section>
    `
  });

  bm.add('daangn-sticky-card', {
    label: '🌱 일하는 방식 스티키 카드 (이미지 1개 + 글)',
    category: '당근서비스 공식 프로덕션 컴포넌트',
    content: `
      <div class="daangn-sticky-card" data-label="새로운 가치">
        <div class="daangn-sticky-card-media">
          <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80" alt="새로운 가치" class="daangn-sticky-card-img" />
        </div>
        <div class="daangn-sticky-card-caption">
          <span class="daangn-sticky-card-tag">06 · 일하는 방식</span>
          <h3 class="daangn-sticky-card-title">새로운 가치</h3>
          <p class="daangn-sticky-card-desc">당근서비스 팀이 함께 만들어가는 가치와 일하는 방식을 소개하는 문구를 여기에 작성하세요. 1개의 이미지와 글을 자유롭게 편집할 수 있습니다.</p>
        </div>
      </div>
    `
  });

  bm.add('daangn-culture-item', {
    label: '🌱 일하는 방식 섹션 (이미지 1개 + 글)',
    category: '당근서비스 공식 프로덕션 컴포넌트',
    content: `
      <div class="daangn-culture-item">
        <div class="daangn-culture-item-content">
          <span class="daangn-culture-item-badge">06 · 일하는 방식</span>
          <h3 class="daangn-culture-item-title">새로운 일하는 방식</h3>
          <p class="daangn-culture-item-desc">당근서비스 팀이 함께 만들어가는 가치와 일하는 방식을 소개하는 문구를 여기에 작성하세요. 1개의 이미지와 글을 자유롭게 편집할 수 있습니다.</p>
        </div>
        <div class="daangn-culture-item-media">
          <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80" alt="새로운 일하는 방식" class="daangn-culture-item-img" />
        </div>
      </div>
    `
  });

  bm.add('daangn-promo-sticker', {
    label: '🏷️ 하단 플로팅 배너 (스티커)',
    category: '당근서비스 공식 프로덕션 컴포넌트',
    content: `
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
    `
  });

  bm.add('daangn-team-intro', {
    label: '👥 팀 소개 (3개 노출 슬라이딩 캐러셀)',
    category: '당근서비스 공식 프로덕션 컴포넌트',
    content: `
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
            <button id="teamPrevBtn" class="daangn-carousel-arrow daangn-carousel-arrow-prev" aria-label="이전 팀">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button id="teamNextBtn" class="daangn-carousel-arrow daangn-carousel-arrow-next" aria-label="다음 팀">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>

            <div class="daangn-team-viewport">
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
                  <img src="https://prismic-image-proxy.krrt.io/karrot/1e36a8e6-39e3-4a12-8766-73e3e9ad53b6_service_02.jpg" alt="동네생활 커뮤니티 팀" class="daangn-team-card-img" />
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
                  <img src="https://prismic-image-proxy.krrt.io/karrot/10d0e07e-9bcf-48a8-b375-fcd43b533606_service_03.jpg" alt="로컬비즈니스 팀" class="daangn-team-card-img" />
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
    `
  });

  bm.add('daangn-stories-carousel', {
    label: '📰 인사이드 당근서비스 (슬라이드 캐러셀)',
    category: '당근서비스 공식 프로덕션 컴포넌트',
    content: `
      <section id="inside" style="background-color: #ffffff; padding: 40px 24px 100px;">
        <div style="max-width: 1140px; margin: 0 auto; position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px;">
            <div>
              <span style="font-size: 14px; font-weight: 800; color: #FF6F0F; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">INSIDE STORY</span>
              <h2 style="font-size: 38px; font-weight: 800; color: #212124; margin: 0; letter-spacing: -0.5px;">인사이드 당근서비스</h2>
              <p style="font-size: 16px; color: #868B94; margin: 8px 0 0; line-height: 1.5;">따뜻한 경험을 만드는 당근서비스와 구성원의 생생한 성장 이야기를 들려드릴게요.</p>
            </div>
            <a href="https://daangnservice.career.greetinghr.com/ko/inside" target="_blank" rel="noopener noreferrer" class="daangn-more-link" style="display: inline-flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 600; color: #4D5159; text-decoration: none;">전체 이야기 보기 ➔</a>
          </div>
          <div class="daangn-stories-carousel">
            <button id="storiesPrevBtn" class="daangn-carousel-arrow daangn-carousel-arrow-prev" aria-label="이전 이야기">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button id="storiesNextBtn" class="daangn-carousel-arrow daangn-carousel-arrow-next" aria-label="다음 이야기">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <div class="daangn-stories-viewport">
              <div id="storiesTrack" class="daangn-stories-track">
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
              </div>
            </div>
          </div>
        </div>
      </section>
    `
  });

  bm.add('seed-job-list', {
    label: '🍊 채용 공고 카드 리스트',
    category: 'SEED 채용 컴포넌트',
    content: `
      <section class="seed-section" style="padding: 80px 0; background-color: #F7F9FA;">
        <div class="seed-container" style="max-width: 1040px; margin: 0 auto; padding: 0 24px;">
          <h2 style="font-size: 32px; font-weight: 800; text-align: center; margin-bottom: 12px;">열려있는 영입 공고</h2>
          <p style="font-size: 18px; color: #555; text-align: center; margin-bottom: 48px;">지금 바로 당신의 뛰어난 역량을 보여줄 수 있는 팀에 합류하세요.</p>
          <div style="display: flex; flex-direction: column; gap: 16px; max-width: 800px; margin: 0 auto;">
            <div style="background: #ffffff; border: 1px solid #E9ECEF; border-radius: 12px; padding: 24px 32px; display: flex; align-items: center; justify-content: space-between;">
              <div>
                <span style="font-size: 13px; font-weight: 700; color: #FF6F0F; margin-bottom: 4px; display: block;">Customer Experience</span>
                <h3 style="font-size: 19px; font-weight: 700; margin: 0 0 6px;">CX 매니저 (커뮤니티 운영/고객상담)</h3>
                <p style="font-size: 14px; color: #777; margin: 0;">정규직 · 서울 서초구 · 경력 무관</p>
              </div>
              <a href="#" style="padding: 10px 20px; font-size: 14px; font-weight: 700; color: #FF6F0F; border: 1px solid #FF6F0F; border-radius: 8px; text-decoration: none;">지원하기</a>
            </div>
            <div style="background: #ffffff; border: 1px solid #E9ECEF; border-radius: 12px; padding: 24px 32px; display: flex; align-items: center; justify-content: space-between;">
              <div>
                <span style="font-size: 13px; font-weight: 700; color: #FF6F0F; margin-bottom: 4px; display: block;">Operations & Strategy</span>
                <h3 style="font-size: 19px; font-weight: 700; margin: 0 0 6px;">서비스 운영 엔지니어 (Service Ops)</h3>
                <p style="font-size: 14px; color: #777; margin: 0;">정규직 · 서울 서초구 · 경력 2년 이상</p>
              </div>
              <a href="#" style="padding: 10px 20px; font-size: 14px; font-weight: 700; color: #FF6F0F; border: 1px solid #FF6F0F; border-radius: 8px; text-decoration: none;">지원하기</a>
            </div>
          </div>
        </div>
      </section>
    `
  });

  bm.add('seed-benefits', {
    label: '🍊 복리후생 Icon Grid',
    category: 'SEED 채용 컴포넌트',
    content: `
      <section style="padding: 80px 0; background: #ffffff;">
        <div style="max-width: 1040px; margin: 0 auto; padding: 0 24px;">
          <h2 style="font-size: 32px; font-weight: 800; text-align: center; margin-bottom: 48px;">복지 및 혜택</h2>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
            <div style="padding: 24px; border-radius: 12px; background: #FFF9F5; border: 1px solid #FFE0CC; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 12px;">💻</div>
              <h4 style="font-size: 17px; font-weight: 700; margin: 0 0 8px;">최신 장비 지원</h4>
              <p style="font-size: 14px; color: #666; margin: 0;">최신형 맥북 프로 및 4K 고화질 모니터 지급</p>
            </div>
            <div style="padding: 24px; border-radius: 12px; background: #FFF9F5; border: 1px solid #FFE0CC; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 12px;">🌴</div>
              <h4 style="font-size: 17px; font-weight: 700; margin: 0 0 8px;">자유로운 연차</h4>
              <p style="font-size: 14px; color: #666; margin: 0;">승인 없는 연차 사용 및 반차/반반차 자유 선택</p>
            </div>
            <div style="padding: 24px; border-radius: 12px; background: #FFF9F5; border: 1px solid #FFE0CC; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 12px;">🍱</div>
              <h4 style="font-size: 17px; font-weight: 700; margin: 0 0 8px;">식대 및 간식지원</h4>
              <p style="font-size: 14px; color: #666; margin: 0;">점심/저녁 식대 무제한 지원 및 무제한 무상 간식바</p>
            </div>
            <div style="padding: 24px; border-radius: 12px; background: #FFF9F5; border: 1px solid #FFE0CC; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 12px;">📚</div>
              <h4 style="font-size: 17px; font-weight: 700; margin: 0 0 8px;">성장 지원금</h4>
              <p style="font-size: 14px; color: #666; margin: 0;">도서 구매, 외부 강의, 컨퍼런스 참가비 전액 지원</p>
            </div>
          </div>
        </div>
      </section>
    `
  });

  bm.add('seed-video-embed', {
    label: '🎥 당근서비스팀 영상 플레이어',
    category: 'SEED 미디어 & 스토리',
    content: `
      <section class="seed-section" style="padding: 80px 0; background: #FFF7F2; text-align: center;">
        <div class="seed-container" style="max-width: 900px; margin: 0 auto; padding: 0 24px;">
          <span style="display: inline-block; background: rgba(255,111,15,0.1); color: #FF6F0F; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 20px; margin-bottom: 16px;">DAANGNSERVICE TEAM STORY</span>
          <h2 style="font-size: 32px; font-weight: 800; margin-bottom: 16px; color: #111;">당근서비스팀이 일하는 문화를 영상으로 만나보세요</h2>
          <p style="font-size: 18px; color: #555; margin-bottom: 36px;">이웃과 사람을 연결하는 당근서비스 크루들의 생생한 하루 이야기입니다.</p>
          <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 16px; box-shadow: 0 12px 32px rgba(0,0,0,0.12);">
            <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="당근서비스팀 스토리 영상" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        </div>
      </section>
    `
  });

  bm.add('seed-process-grid', {
    label: '🍊 영입 절차 4단계 Grid',
    category: 'SEED 채용 컴포넌트',
    content: `
      <section class="seed-section" style="padding: 80px 0; background: #ffffff;">
        <div class="seed-container" style="max-width: 1040px; margin: 0 auto; padding: 0 24px;">
          <h2 style="font-size: 32px; font-weight: 800; text-align: center; margin-bottom: 12px;">합류 여정 (영입 절차)</h2>
          <p style="font-size: 18px; color: #555; text-align: center; margin-bottom: 48px;">당근서비스와 동료가 되는 4단계 영입 과정입니다.</p>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
            <div style="background: #F7F9FA; border: 1px solid #E9ECEF; border-radius: 12px; padding: 24px; position: relative;">
              <span style="font-size: 24px; font-weight: 800; color: #FF6F0F; display: block; margin-bottom: 8px;">01</span>
              <h4 style="font-size: 18px; font-weight: 700; margin: 0 0 8px;">서류 전형</h4>
              <p style="font-size: 14px; color: #666; margin: 0; line-height: 1.5;">지원서와 경력기술서를 바탕으로 직무 관련 역량을 종합 검토합니다.</p>
            </div>
            <div style="background: #F7F9FA; border: 1px solid #E9ECEF; border-radius: 12px; padding: 24px; position: relative;">
              <span style="font-size: 24px; font-weight: 800; color: #FF6F0F; display: block; margin-bottom: 8px;">02</span>
              <h4 style="font-size: 18px; font-weight: 700; margin: 0 0 8px;">직무 인터뷰</h4>
              <p style="font-size: 14px; color: #666; margin: 0; line-height: 1.5;">팀 동료들과 함께 실무 역량과 과제, 경험을 나누는 깊이 있는 면접입니다.</p>
            </div>
            <div style="background: #F7F9FA; border: 1px solid #E9ECEF; border-radius: 12px; padding: 24px; position: relative;">
              <span style="font-size: 24px; font-weight: 800; color: #FF6F0F; display: block; margin-bottom: 8px;">03</span>
              <h4 style="font-size: 18px; font-weight: 700; margin: 0 0 8px;">컬처핏 인터뷰</h4>
              <p style="font-size: 14px; color: #666; margin: 0; line-height: 1.5;">당근서비스의 가치관, 업무 방식 및 팀 시너지에 대한 이야기를 함께 나눕니다.</p>
            </div>
            <div style="background: #FFF9F5; border: 1px solid #FFE0CC; border-radius: 12px; padding: 24px; position: relative;">
              <span style="font-size: 24px; font-weight: 800; color: #FF6F0F; display: block; margin-bottom: 8px;">04</span>
              <h4 style="font-size: 18px; font-weight: 700; margin: 0 0 8px; color: #FF6F0F;">최종 합격</h4>
              <p style="font-size: 14px; color: #666; margin: 0; line-height: 1.5;">처우 협의 후 공식 입사 오퍼레터를 발송하고 새로운 합류를 환영합니다.</p>
            </div>
          </div>
        </div>
      </section>
    `
  });

  bm.add('seed-image-text-split', {
    label: '🖼️ 이미지 + 텍스트 2열 스토리',
    category: 'SEED 미디어 & 스토리',
    content: `
      <section style="padding: 80px 0; background: #ffffff;">
        <div style="max-width: 1040px; margin: 0 auto; padding: 0 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center;">
          <div>
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80" alt="당근서비스팀 미팅" style="width: 100%; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08);" />
          </div>
          <div>
            <span style="font-size: 13px; font-weight: 700; color: #FF6F0F; text-transform: uppercase; letter-spacing: 0.5px;">CULTURE & TEAMWORK</span>
            <h2 style="font-size: 32px; font-weight: 800; margin: 12px 0 16px; line-height: 1.3;">개인의 성장이 팀의 성장이 되는 일터</h2>
            <p style="font-size: 16px; color: #555; line-height: 1.7; margin-bottom: 24px;">당근서비스는 팀원 한 사람 한 사람이 가진 잠재력을 극대화할 수 있도록 존중과 주도성을 배려합니다. 더 나은 이웃 경험을 만드는 여정에 함께하세요.</p>
            <a href="#openings" style="display: inline-flex; align-items: center; justify-content: center; padding: 12px 24px; font-size: 15px; font-weight: 700; background-color: #FF6F0F; color: #fff; border-radius: 8px; text-decoration: none;">팀원 인터뷰 읽어보기</a>
          </div>
        </div>
      </section>
    `
  });

  // Category 2: 레이아웃 기본 요소
  bm.add('layout-1col', {
    label: '📄 1열 컨테이너',
    category: '기본 레이아웃',
    content: `<div style="max-width: 1040px; margin: 0 auto; padding: 40px 24px;">여기 내용을 입력하세요.</div>`
  });

  bm.add('layout-2col', {
    label: '📄 2열 컨테이너',
    category: '기본 레이아웃',
    content: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 1040px; margin: 0 auto; padding: 40px 24px;">
        <div style="padding: 20px; border: 1px dashed #ccc;">좌측 콘텐츠</div>
        <div style="padding: 20px; border: 1px dashed #ccc;">우측 콘텐츠</div>
      </div>
    `
  });

  bm.add('base-button', {
    label: '🔘 SEED 당근서비스 버튼',
    category: '기본 레이아웃',
    content: `<a href="#" style="display: inline-flex; align-items: center; justify-content: center; padding: 14px 28px; font-size: 16px; font-weight: 700; border-radius: 8px; text-decoration: none; background-color: #FF6F0F; color: #ffffff;">버튼 텍스트</a>`
  });

  bm.add('base-image', {
    label: '🖼️ 이미지 단독',
    category: '기본 레이아웃',
    content: `<img src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80" alt="이미지" style="max-width: 100%; border-radius: 12px; display: block; margin: 0 auto;" />`
  });

  bm.add('base-video', {
    label: '🎥 비디오 플레이어',
    category: '기본 레이아웃',
    content: `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px; max-width: 1040px; margin: 0 auto;"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allowfullscreen></iframe></div>`
  });
}

// Helper for API calls with automatic 401 Unauthorized handling
async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    alert('🔒 로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  return res;
}

// Load currently published or draft page from server
async function loadCurrentPage() {
  try {
    const res = await apiFetch('/api/admin/current-page');
    const data = await res.json();
    if (data.page) {
      currentPageData = data.page;
      editor.setComponents(data.page.html || '');
      
      // GrapesJS setStyle() 대신 canvas iframe에 직접 <style> 태그 주입
      // (GrapesJS CSS 파서가 복잡한 CSS를 손상시키는 문제 방지)
      injectPageCssToCanvas(data.page.css || '');
      
      document.getElementById('seoTitleInput').value = data.page.seo_title || '';
      document.getElementById('seoDescInput').value = data.page.seo_description || '';
      
      const faviconUrl = data.page.favicon_url || '/images/favicon-192.png';
      const favInput = document.getElementById('seoFaviconInput');
      if (favInput) favInput.value = faviconUrl;
      updateFaviconPreview(faviconUrl);
      
      updateStatusBadge(data.page.is_published, data.page.version_name);
    }
  } catch (err) {
    console.error('Page load error:', err);
  }
}

// DB CSS를 GrapesJS canvas iframe의 <head>에 직접 주입
function injectPageCssToCanvas(css) {
  if (!css) return;
  try {
    const canvasDoc = editor.Canvas.getDocument();
    // 기존 주입 스타일 제거
    const existing = canvasDoc.getElementById('__page-css__');
    if (existing) existing.remove();
    // 새 스타일 태그 주입
    const style = canvasDoc.createElement('style');
    style.id = '__page-css__';
    style.textContent = css;
    canvasDoc.head.appendChild(style);
  } catch (e) {
    // fallback: GrapesJS setStyle 사용
    editor.setStyle(css);
  }
}


// Update top navbar status badge
function updateStatusBadge(isPublished, versionName) {
  const badge = document.getElementById('statusBadge');
  if (isPublished) {
    badge.className = 'status-badge status-published';
    badge.textContent = `🟢 퍼블릭 배포중 (${versionName || 'v1.0'})`;
  } else {
    badge.className = 'status-badge status-draft';
    badge.textContent = `🟡 임시 저장 상태 (${versionName || 'Draft'})`;
  }
}

// Save draft
async function saveDraft() {
  const html = editor.getHtml();
  const css = editor.getCss();
  const componentsJson = JSON.stringify(editor.getComponents());
  const seoTitle = document.getElementById('seoTitleInput').value;
  const seoDescription = document.getElementById('seoDescInput').value;
  const faviconUrl = document.getElementById('seoFaviconInput') ? document.getElementById('seoFaviconInput').value.trim() : (currentPageData.favicon_url || '/images/favicon-192.png');

  try {
    const res = await apiFetch('/api/admin/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html,
        css,
        componentsJson,
        seoTitle,
        seoDescription,
        faviconUrl,
        versionName: `수정본 (${new Date().toLocaleTimeString('ko-KR')})`
      })
    });
    const data = await res.json();
    if (data.success) {
      currentPageData.id = data.id;
      currentPageData.isPublished = 0;
      updateStatusBadge(0, `Draft #${data.id}`);
      loadVersionHistory();
      alert('✅ 성공적으로 임시 저장되었습니다!');
    }
  } catch (err) {
    if (err.message !== 'Unauthorized') {
      alert('임시 저장 중 오류가 발생했습니다.');
    }
  }
}

// Publish page immediately to /
async function publishPage() {
  if (!confirm('현재 편집 내용을 퍼블릭 채용 사이트에 즉시 배포하시겠습니까?')) return;

  const html = editor.getHtml();
  const css = editor.getCss();
  const componentsJson = JSON.stringify(editor.getComponents());
  const seoTitle = document.getElementById('seoTitleInput').value;
  const seoDescription = document.getElementById('seoDescInput').value;
  const faviconUrl = document.getElementById('seoFaviconInput') ? document.getElementById('seoFaviconInput').value.trim() : (currentPageData.favicon_url || '/images/favicon-192.png');

  try {
    // Save draft first
    const saveRes = await apiFetch('/api/admin/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html,
        css,
        componentsJson,
        seoTitle,
        seoDescription,
        faviconUrl,
        versionName: `정식 배포 (${new Date().toLocaleDateString('ko-KR')} ${new Date().toLocaleTimeString('ko-KR')})`
      })
    });
    const saveData = await saveRes.json();

    // Now publish this version
    const pubRes = await apiFetch('/api/admin/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: saveData.id })
    });
    const pubData = await pubRes.json();

    if (pubData.success) {
      currentPageData.id = saveData.id;
      currentPageData.isPublished = 1;
      updateStatusBadge(1, `v${saveData.id}`);
      loadVersionHistory();
      alert('🚀 퍼블릭 채용 페이지(careers.daangnservice.com)에 성공적으로 즉시 반영되었습니다!');
    }
  } catch (err) {
    if (err.message !== 'Unauthorized') {
      alert('배포 중 오류가 발생했습니다.');
    }
  }
}

// Load Version History list into drawer
async function loadVersionHistory() {
  try {
    const res = await apiFetch('/api/admin/versions');
    const data = await res.json();
    const versionList = document.getElementById('versionList');
    versionList.innerHTML = '';

    if (!data.versions || data.versions.length === 0) {
      versionList.innerHTML = '<p style="color:#888; font-size:14px;">저장된 버전 내역이 없습니다.</p>';
      return;
    }

    data.versions.forEach(ver => {
      const card = document.createElement('div');
      card.className = `version-item ${ver.is_published ? 'active-version' : ''}`;
      
      const publishedTag = ver.is_published ? '<span style="background:#137333; color:#fff; font-size:11px; padding:2px 6px; border-radius:4px; font-weight:700;">현재 퍼블릭 배포중</span>' : '';

      card.innerHTML = `
        <div class="version-item-header">
          <span class="version-title">#${ver.id} ${ver.version_name}</span>
          ${publishedTag}
        </div>
        <div class="version-date">${new Date(ver.created_at).toLocaleString('ko-KR')}</div>
        <div class="version-actions">
          <button class="btn-rollback" onclick="rollbackToVersion(${ver.id})">이 버전으로 롤백 및 배포</button>
        </div>
      `;
      versionList.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load version history:', err);
  }
}

// Rollback version
async function rollbackToVersion(id) {
  if (!confirm(`버전 #${id} 로 롤백하고 퍼블릭 페이지에 반영하시겠습니까?`)) return;

  try {
    const res = await apiFetch(`/api/admin/rollback/${id}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert(`✅ 버전 #${id} 로 롤백하여 퍼블릭 사이트에 배포되었습니다!`);
      await loadCurrentPage();
      await loadVersionHistory();
      toggleHistoryDrawer();
    }
  } catch (err) {
    if (err.message !== 'Unauthorized') {
      alert('롤백 중 오류가 발생했습니다.');
    }
  }
}

// Reset active canvas to full Daangn Video/Image template
async function resetToRichTemplate() {
  if (!confirm('현재 캔버스를 당근서비스 공식 영상 및 미디어가 포함된 풀 템플릿으로 교체하시겠습니까?')) return;

  try {
    const res = await apiFetch('/api/admin/reset-template', { method: 'POST' });
    const data = await res.json();
    if (data.success && data.page) {
      editor.setComponents(data.page.html || '');
      editor.setStyle(data.page.css || '');
      currentPageData = data.page;
      updateStatusBadge(0, `Draft #${data.page.id}`);
      loadVersionHistory();
      alert('🍊 당근서비스 풀 템플릿(영상, 스토리, 4단계 프로세스, 공고 카드)이 성공적으로 적용되었습니다!');
    }
  } catch (err) {
    if (err.message !== 'Unauthorized') {
      alert('템플릿 적용 중 오류가 발생했습니다.');
    }
  }
}

// Drawers & Modals Control
function toggleHistoryDrawer() {
  document.getElementById('historyDrawer').classList.toggle('open');
}

function toggleSEOModal() {
  const modal = document.getElementById('seoModal');
  modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function updateFaviconPreview(url) {
  const preview = document.getElementById('seoFaviconPreview');
  if (preview) {
    preview.src = url || '/images/favicon-192.png';
  }
}

function setFaviconPreset(url) {
  const input = document.getElementById('seoFaviconInput');
  if (input) {
    input.value = url;
    updateFaviconPreview(url);
  }
}

function saveSEOMeta() {
  const favInput = document.getElementById('seoFaviconInput');
  if (favInput) {
    currentPageData.favicon_url = favInput.value.trim() || '/images/favicon-192.png';
    updateFaviconPreview(currentPageData.favicon_url);
  }
  toggleSEOModal();
  alert('✅ SEO 메타태그 및 파비콘 설정이 반영되었습니다.\n[임시 저장] 또는 [즉시 배포하기]를 누르면 최종 저장 및 배포됩니다.');
}

function togglePromoDelayModal() {
  const modal = document.getElementById('promoDelayModal');
  if (!modal) return;
  const isOpening = modal.style.display !== 'flex';
  modal.style.display = isOpening ? 'flex' : 'none';

  if (isOpening) {
    try {
      const canvasDoc = editor.Canvas.getDocument();
      const promoEl = canvasDoc.getElementById('daangnFloatingPromo') || canvasDoc.querySelector('.daangn-floating-promo');
      const cardEl = canvasDoc.querySelector('[data-campaign-promo]') || canvasDoc.querySelector('.daangn-promo-card');
      const currentDelay = (promoEl && promoEl.getAttribute('data-delay-seconds')) ||
                           (cardEl && cardEl.getAttribute('data-delay-seconds')) || '5';
      document.getElementById('promoDelayInput').value = currentDelay;
    } catch (e) {
      console.warn('Could not read delay from canvas', e);
    }
  }
}

function savePromoDelaySetting() {
  const input = document.getElementById('promoDelayInput');
  const delaySec = Math.max(0, parseFloat(input.value) || 0);

  try {
    const canvasDoc = editor.Canvas.getDocument();
    const promoEl = canvasDoc.getElementById('daangnFloatingPromo') || canvasDoc.querySelector('.daangn-floating-promo');
    const cardEl = canvasDoc.querySelector('[data-campaign-promo]') || canvasDoc.querySelector('.daangn-promo-card');

    if (promoEl) {
      promoEl.setAttribute('data-delay-seconds', delaySec.toString());
    }
    if (cardEl) {
      cardEl.setAttribute('data-delay-seconds', delaySec.toString());
    }

    const badgeDisplay = canvasDoc.getElementById('promoDelayDisplay');
    if (badgeDisplay) {
      badgeDisplay.textContent = delaySec.toString();
    }

    // Sync with GrapesJS components
    const wrapper = editor.getWrapper();
    const promoComp = wrapper.find('#daangnFloatingPromo')[0] || wrapper.find('.daangn-floating-promo')[0];
    if (promoComp) {
      promoComp.addAttributes({ 'data-delay-seconds': delaySec.toString() });
    }
    const cardComp = wrapper.find('[data-campaign-promo]')[0] || wrapper.find('.daangn-promo-card')[0];
    if (cardComp) {
      cardComp.addAttributes({ 'data-delay-seconds': delaySec.toString() });
    }
  } catch (e) {
    console.error('Error applying promo delay to canvas', e);
  }

  togglePromoDelayModal();
  alert(`⏱️ 팝업 노출 지연 시간이 [${delaySec}초]로 설정되었습니다.\n우측 상단의 '🚀 즉시 배포하기'를 누르면 라이브 사이트에 적용됩니다!`);
}

function openPreviewModal() {
  const modal = document.getElementById('previewModal');
  const frame = document.getElementById('previewFrame');
  // 실제 public 페이지를 직접 로드 (GrapesJS HTML 재직렬화 오류 방지)
  modal.style.display = 'flex';
  frame.src = '/?_t=' + Date.now();
}

function closePreviewModal() {
  document.getElementById('previewModal').style.display = 'none';
}

function logout() {
  if (confirm('로그아웃 하시겠습니까?')) {
    fetch('/api/auth/logout', { method: 'POST' }).then(() => {
      window.location.href = '/login';
    });
  }
}
