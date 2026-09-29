let editor;
let currentPath = '/';
let currentPageName = '메인 페이지';
let allPagesList = [];

// URL query parameter 'path' 확인
try {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('path') && urlParams.get('path')) {
    currentPath = urlParams.get('path');
  }
} catch (e) {}

let currentPageData = {
  id: null,
  seoTitle: '당근서비스 채용 - 당근다운 경험이 완성되는 당근서비스',
  seoDescription: '당근서비스에 합류하세요. 당근다운 경험이 완성되는 여정을 함께할 동료를 찾습니다.',
  faviconUrl: '/images/favicon-192.png',
  isPublished: 0
};

// Ensure outermost window never scrolls off the top navbar
window.addEventListener('scroll', () => {
  if (window.scrollY !== 0 || window.scrollX !== 0) {
    window.scrollTo(0, 0);
  }
}, { passive: true });

document.addEventListener('DOMContentLoaded', async () => {
  window.scrollTo(0, 0);
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

  // Customize Sticky Value Item Component Traits
  domc.addType('sticky-value-item', {
    isComponent: el => el && el.classList && el.classList.contains('sticky-value-item'),
    model: {
      defaults: {
        name: '일하는 방식 가치 항목',
        editable: true,
        droppable: false,
        draggable: '#stickyValueList'
      }
    }
  });

  // Customize Sticky Card Component Traits
  domc.addType('daangn-sticky-card', {
    isComponent: el => el && el.classList && el.classList.contains('daangn-sticky-card'),
    model: {
      defaults: {
        name: '일하는 방식 스티키 카드',
        droppable: true,
        draggable: '#stickyCardsStack',
        traits: [
          {
            type: 'text',
            name: 'data-label',
            label: '🏷️ 가치 명칭'
          }
        ]
      }
    }
  });

  // Customize Inside Story Card Component Type
  domc.addType('daangn-story-card', {
    isComponent: el => {
      if (!el || !el.getAttribute) return false;
      return (el.classList && el.classList.contains('daangn-story-card')) || el.hasAttribute('data-article-slug');
    },
    model: {
      defaults: {
        name: '인사이드 아티클 카드',
        traits: [
          {
            type: 'select',
            name: 'data-article-slug',
            label: '📚 CMS 아티클 연동',
            options: [
              { value: '', name: '🚫 미선택 (준비 중 안내)' }
            ]
          }
        ]
      },
      init() {
        this.on('change:data-article-slug', () => {
          const slug = this.get('data-article-slug') ?? (this.getAttributes()['data-article-slug'] || '');
          applyCmsArticleToCard(this, slug);
        });
      }
    }
  });

  // Command to open Article Picker Modal
  editor.Commands.add('open-article-picker', {
    run(ed, sender, opts) {
      const selected = (opts && opts.target) ? opts.target : ed.getSelected();
      let cardComp = selected;
      if (cardComp && cardComp.getEl && cardComp.getEl() && !cardComp.getEl().classList.contains('daangn-story-card')) {
        cardComp = cardComp.closest('.daangn-story-card') || cardComp;
      }
      openArticlePickerModal(cardComp);
    }
  });

  // Command to toggle default opened state for process track on live site
  editor.Commands.add('toggle-track-open-default', {
    run(ed) {
      const selected = ed.getSelected();
      if (!selected) return;
      const el = selected.getEl();
      const track = el ? (el.classList.contains('daangn-process-track-item') ? el : el.closest('.daangn-process-track-item')) : null;
      if (track) {
        track.classList.toggle('is-open');
        const isOpen = track.classList.contains('is-open');
        alert(isOpen ? '이 트랙은 실제 사이트 접속 시 기본으로 펼쳐진 상태로 노출됩니다.' : '이 트랙은 실제 사이트 접속 시 기본으로 접힌 상태로 노출됩니다.');
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

    // 채용 절차 트랙 선택 시 툴바에 '실제 사이트 기본 펼침/접힘 토글' 버튼 제공
    if (el.classList && (el.classList.contains('daangn-process-track-item') || el.closest('.daangn-process-track-item'))) {
      const tb = model.get('toolbar') || [];
      if (!tb.some(item => item.command === 'toggle-track-open-default')) {
        model.set('toolbar', [
          {
            attributes: { class: 'fa fa-arrows-v', title: '실제 사이트 기본 펼침/접힘 설정' },
            command: 'toggle-track-open-default'
          },
          ...tb
        ]);
      }
    }

    // 인사이드 아티클 카드 선택 시 Trait 갱신 및 툴바 버튼 추가
    let cardComp = model;
    if (el.classList && !el.classList.contains('daangn-story-card')) {
      const closestCardEl = el.closest('.daangn-story-card');
      if (closestCardEl) {
        cardComp = model.closest('.daangn-story-card') || model;
      }
    }

    if (cardComp && (cardComp.get('type') === 'daangn-story-card' || (cardComp.getEl && cardComp.getEl() && cardComp.getEl().classList.contains('daangn-story-card')))) {
      updateStoryCardTraitOptions(cardComp);
      const tb = cardComp.get('toolbar') || [];
      if (!tb.some(item => item.command === 'open-article-picker')) {
        cardComp.set('toolbar', [
          {
            attributes: { class: 'gjs-toolbar-btn-article-picker', title: '클릭하여 아티클을 선택할 수 있는 팝업 창을 엽니다' },
            command: 'open-article-picker',
            label: '<span style="display:inline-flex;align-items:center;gap:5px;background:#FF6F0F;color:#ffffff;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:800;letter-spacing:-0.2px;">📚 아티클 선택 / 변경 (팝업)</span>'
          },
          ...tb
        ]);
      }
    }
  });

  // Register Custom Blocks for Daangn Recruitment
  registerSeedBlocks(editor);

  // Canvas 준비 후 페이지 로드 (CSS 주입 타이밍 보장)
  editor.on('canvas:frame:load', async () => {
    await loadPagesList();
    await loadCurrentPage(currentPath);
    loadVersionHistory(currentPath);
    loadCmsArticles();
    setTimeout(() => {
      initCultureSectionSync(editor);
      bindStoryCardCanvasEvents(editor);
      bindProcessPageCanvasEvents(editor);
    }, 200);
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
    `
  });

  bm.add('daangn-footer', {
    label: '🏢 하단 푸터 (Footer 정보)',
    category: '당근서비스 공식 프로덕션 컴포넌트',
    content: `
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

  bm.add('daangn-team-groups', {
    label: '👥 4대 그룹 소개 카드 (호버 줌 & 서브페이지 링크)',
    category: '당근서비스 공식 프로덕션 컴포넌트',
    content: `
      <section id="team" style="background-color: #ffffff; padding: 100px 24px 60px;">
        <div style="max-width: 1140px; margin: 0 auto; position: relative;">
          <div style="margin-bottom: 28px;">
            <div>
              <span style="font-size: 14px; font-weight: 800; color: #FF6F0F; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">OUR TEAMS</span>
              <h2 style="font-size: 38px; font-weight: 800; color: #212124; margin: 0; letter-spacing: -0.5px;">팀 소개</h2>
              <p style="font-size: 16px; color: #868B94; margin: 8px 0 0; line-height: 1.5;">당근서비스는 목적 조직인 그룹 단위로 유기적으로 협업하며 일하고 있어요.</p>
            </div>
          </div>

          <div class="daangn-team-groups-grid">
            <a href="/teams/product" class="daangn-team-group-card">
              <img src="https://prismic-image-proxy.krrt.io/karrot/f92b5275-92ec-4ce0-b196-c71dc36239c3_service_01.jpg" alt="프로덕트그룹" class="daangn-team-group-card-img" />
              <div class="daangn-team-group-card-overlay"></div>
              <div class="daangn-team-group-card-content">
                <h3 class="daangn-team-group-card-title">Product</h3>
                <p class="daangn-team-group-card-desc">중고거래, 커뮤니티, POI, 대외민원, 분쟁조정 등 핵심 프로덕트 경험을 완성해요.</p>
                <span class="daangn-team-group-card-action">그룹 소개 보기 ➔</span>
              </div>
            </a>
            <a href="/teams/business" class="daangn-team-group-card">
              <img src="https://prismic-image-proxy.krrt.io/karrot/10d0e07e-9bcf-48a8-b375-fcd43b533606_service_03.jpg" alt="사업운영그룹" class="daangn-team-group-card-img" />
              <div class="daangn-team-group-card-overlay"></div>
              <div class="daangn-team-group-card-content">
                <h3 class="daangn-team-group-card-title">Business</h3>
                <p class="daangn-team-group-card-desc">광고, 로컬비즈니스, 당근페이 등 비즈니스와 금융 생태계를 견인해요.</p>
                <span class="daangn-team-group-card-action">그룹 소개 보기 ➔</span>
              </div>
            </a>
            <a href="/teams/vertical" class="daangn-team-group-card">
              <img src="https://prismic-image-proxy.krrt.io/karrot/f25a287d-a97e-4040-8b8f-62e616d266bd_service_05.jpg" alt="독립그룹" class="daangn-team-group-card-img" />
              <div class="daangn-team-group-card-overlay"></div>
              <div class="daangn-team-group-card-content">
                <h3 class="daangn-team-group-card-title">Independent</h3>
                <p class="daangn-team-group-card-desc">당근알바, 중고차·부동산 버티컬, 전사 X과제 등 도전적 영역을 선도해요.</p>
                <span class="daangn-team-group-card-action">그룹 소개 보기 ➔</span>
              </div>
            </a>
            <a href="/teams/support" class="daangn-team-group-card">
              <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80" alt="경영지원그룹" class="daangn-team-group-card-img" />
              <div class="daangn-team-group-card-overlay"></div>
              <div class="daangn-team-group-card-content">
                <h3 class="daangn-team-group-card-title">Support</h3>
                <p class="daangn-team-group-card-desc">성장문화, 피플(HR, GA, IT) 등 구성원의 성장과 몰입을 파트너십으로 지원해요.</p>
                <span class="daangn-team-group-card-action">그룹 소개 보기 ➔</span>
              </div>
            </a>
          </div>
        </div>
      </section>
    `
  });

  bm.add('daangn-group-subpage-hero', {
    label: '🏢 그룹 소개 본문 (Image 2 레이아웃)',
    category: '당근서비스 공식 프로덕션 컴포넌트',
    content: `
      <div class="daangn-group-page-main">
        <div class="daangn-group-container">
          <div class="daangn-group-badge">Product Group</div>
          <h1 class="daangn-group-title">당근서비스의<br/>프로덕트 그룹을 소개해요.</h1>
          
          <div class="daangn-group-hero-media">
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80" alt="그룹 대표 이미지" class="daangn-group-hero-img" />
          </div>

          <div class="daangn-group-quote">
            “그룹장이 본인 그룹을 소개하는 코멘트 한 줄”
          </div>

          <div class="daangn-group-teams-section">
            <div class="daangn-group-team-item">
              <span class="daangn-group-team-name">중고거래는~</span>
              <p class="daangn-group-team-desc">안전하고 따뜻한 중고거래 환경을 구축하고 신뢰도 높은 거래 경험을 완성해 나갑니다.</p>
            </div>
            <div class="daangn-group-team-item">
              <span class="daangn-group-team-name">커뮤니티는~</span>
              <p class="daangn-group-team-desc">동네생활과 이웃 간 따뜻한 교류와 소통을 이끄는 커뮤니티 공간을 운영합니다.</p>
            </div>
            <div class="daangn-group-team-item">
              <span class="daangn-group-team-name">분쟁조정은~</span>
              <p class="daangn-group-team-desc">이웃 간 분쟁과 오해를 공정하고 신속하게 중재하여 안심할 수 있는 환경을 만듭니다.</p>
            </div>
            <div class="daangn-group-team-item">
              <span class="daangn-group-team-name">바로구매는~</span>
              <p class="daangn-group-team-desc">채팅 없이도 빠르고 간편하게 결제하고 구매할 수 있는 혁신적인 거래 경험을 지원합니다.</p>
            </div>
            <div class="daangn-group-team-item">
              <span class="daangn-group-team-name">대외민원운영팀은~</span>
              <p class="daangn-group-team-desc">대외 유관기관 및 고객의 주요 민원을 책임감 있게 전담하여 신속하게 대응합니다.</p>
            </div>
          </div>

          <div class="daangn-group-nav-links">
            <a href="/teams/business" class="daangn-group-nav-link">사업운영그룹 소개 바로가기 ➔</a>
            <a href="/teams/vertical" class="daangn-group-nav-link">독립 그룹 소개 바로가기 ➔</a>
          </div>
        </div>
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

// ── Multi-Page Navigation & Selector Engine ───────────────────

// Load all pages from server
async function loadPagesList() {
  try {
    const res = await apiFetch('/api/admin/pages');
    const data = await res.json();
    if (data.pages && Array.isArray(data.pages)) {
      allPagesList = data.pages;
      
      // Match current page name from DB
      const matched = allPagesList.find(p => p.page_path === currentPath);
      if (matched) {
        currentPageName = matched.page_name || (currentPath === '/' ? '메인 페이지' : currentPath);
      }

      updatePageSelectorUI();
      renderPagesDropdown();
    }
  } catch (err) {
    console.error('Failed to load pages list:', err);
  }
}

// Update Top Toolbar Page Display
function updatePageSelectorUI() {
  const nameEl = document.getElementById('currentSelectedPageName');
  const pathEl = document.getElementById('currentSelectedPagePath');
  if (nameEl) nameEl.textContent = currentPageName;
  if (pathEl) pathEl.textContent = currentPath;
}

// Render Dropdown List of Pages
function renderPagesDropdown() {
  const listEl = document.getElementById('pageDropdownList');
  if (!listEl) return;
  listEl.innerHTML = '';

  allPagesList.forEach(p => {
    const item = document.createElement('div');
    const isCurrent = p.page_path === currentPath;
    item.className = `page-dropdown-item ${isCurrent ? 'active' : ''}`;
    item.onclick = () => {
      togglePageDropdown(false);
      switchPage(p.page_path, p.page_name);
    };

    const statusBadge = p.is_published 
      ? '<span class="page-item-badge badge-published">배포중</span>'
      : '<span class="page-item-badge badge-draft">Draft</span>';

    item.innerHTML = `
      <div class="page-item-main">
        <span class="page-item-icon">${p.page_path === '/' ? '🏠' : '📄'}</span>
        <div class="page-item-meta">
          <span class="page-item-title">${p.page_name || (p.page_path === '/' ? '메인 페이지' : p.page_path)}</span>
          <span class="page-item-slug">${p.page_path}</span>
        </div>
      </div>
      ${statusBadge}
    `;
    listEl.appendChild(item);
  });
}

// Toggle Dropdown Menu
function togglePageDropdown(force) {
  const wrapper = document.getElementById('pageSelectorWrapper');
  const dropdown = document.getElementById('pageSelectorDropdown');
  if (!dropdown || !wrapper) return;
  const shouldOpen = (typeof force === 'boolean') ? force : !wrapper.classList.contains('is-open');
  if (shouldOpen) {
    wrapper.classList.add('is-open');
    dropdown.classList.add('show');
  } else {
    wrapper.classList.remove('is-open');
    dropdown.classList.remove('show');
  }
}

// Close Dropdown when clicking outside
document.addEventListener('click', (e) => {
  const wrapper = document.getElementById('pageSelectorWrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    togglePageDropdown(false);
  }
});

// Switch active editing page in GrapesJS canvas
async function switchPage(newPath, newName) {
  if (newPath === currentPath) return;

  currentPath = newPath;
  currentPageName = newName || (newPath === '/' ? '메인 페이지' : newPath);
  updatePageSelectorUI();
  renderPagesDropdown();

  // Update browser URL query parameter without full reload
  try {
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('path', newPath);
    window.history.pushState({}, '', newUrl);
  } catch (e) {}

  await loadCurrentPage(currentPath);
  loadVersionHistory(currentPath);
}

// Open modal to create a new sub-page
function openNewPageModal() {
  togglePageDropdown(false);
  document.getElementById('newPageNameInput').value = '';
  document.getElementById('newPagePathInput').value = '/teams/';
  document.getElementById('newPageTemplateSelect').value = 'group';
  document.getElementById('newPageModal').style.display = 'flex';
}

function closeNewPageModal() {
  document.getElementById('newPageModal').style.display = 'none';
}

async function createNewPageSubmit() {
  const pageName = document.getElementById('newPageNameInput').value.trim();
  let pagePath = document.getElementById('newPagePathInput').value.trim();
  const templateType = document.getElementById('newPageTemplateSelect').value;

  if (!pageName) {
    alert('페이지 이름을 입력해주세요.');
    return;
  }
  if (!pagePath || !pagePath.startsWith('/')) {
    alert('URL 경로는 반드시 "/" 로 시작해야 합니다. (예: /teams/design)');
    return;
  }

  try {
    const res = await apiFetch('/api/admin/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageName, pagePath, templateType })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || '페이지 생성에 실패했습니다.');
      return;
    }

    closeNewPageModal();
    alert(`🎉 [${pageName}] 하위 페이지가 생성되었습니다!\n해당 페이지 편집 화면으로 전환합니다.`);
    await loadPagesList();
    await switchPage(pagePath, pageName);
  } catch (err) {
    console.error('Create page error:', err);
    alert('페이지 생성 중 오류가 발생했습니다.');
  }
}

// Open modal to configure current page (rename, slug, delete)
function openPageSettingsModal() {
  togglePageDropdown(false);
  document.getElementById('editPageNameInput').value = currentPageName;
  document.getElementById('editPagePathInput').value = currentPath;
  
  const isMain = currentPath === '/';
  const pathInput = document.getElementById('editPagePathInput');
  const deleteSec = document.getElementById('deletePageSection');
  const notice = document.getElementById('editPagePathNotice');

  if (isMain) {
    pathInput.disabled = true;
    notice.textContent = '메인 페이지의 URL 경로는 "/" 로 고정되어 변경할 수 없습니다.';
    if (deleteSec) deleteSec.style.display = 'none';
  } else {
    pathInput.disabled = false;
    notice.textContent = 'URL 경로를 변경하면 기존 배포 URL이 새 주소로 변경됩니다. (예: /teams/design)';
    if (deleteSec) deleteSec.style.display = 'block';
  }

  document.getElementById('pageSettingsModal').style.display = 'flex';
}

function closePageSettingsModal() {
  document.getElementById('pageSettingsModal').style.display = 'none';
}

async function savePageSettingsSubmit() {
  const newName = document.getElementById('editPageNameInput').value.trim();
  let newPath = document.getElementById('editPagePathInput').value.trim();

  if (!newName) {
    alert('페이지 이름을 입력해주세요.');
    return;
  }
  if (currentPath === '/') {
    newPath = '/';
  } else {
    if (!newPath || !newPath.startsWith('/')) {
      alert('URL 경로는 반드시 "/" 로 시작해야 합니다. (예: /teams/design)');
      return;
    }
  }

  try {
    const res = await apiFetch('/api/admin/pages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oldPath: currentPath,
        newPath,
        pageName: newName
      })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || '페이지 설정 변경에 실패했습니다.');
      return;
    }

    closePageSettingsModal();
    alert('✅ 페이지 설정이 성공적으로 저장되었습니다.');
    currentPath = newPath;
    currentPageName = newName;
    updatePageSelectorUI();

    try {
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('path', newPath);
      window.history.pushState({}, '', newUrl);
    } catch (e) {}

    await loadPagesList();
  } catch (err) {
    console.error('Update page settings error:', err);
    alert('페이지 설정 저장 중 오류가 발생했습니다.');
  }
}

async function deleteCurrentPageSubmit() {
  if (currentPath === '/') {
    alert('메인 페이지는 삭제할 수 없습니다.');
    return;
  }

  if (!confirm(`정말로 [${currentPageName}] (${currentPath}) 페이지와 모든 버전 기록을 완전히 삭제하시겠습니까?`)) {
    return;
  }

  try {
    const res = await apiFetch('/api/admin/pages', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagePath: currentPath })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || '페이지 삭제에 실패했습니다.');
      return;
    }

    closePageSettingsModal();
    alert('🗑️ 페이지가 삭제되었습니다. 메인 페이지로 이동합니다.');
    await loadPagesList();
    await switchPage('/', '메인 페이지');
  } catch (err) {
    console.error('Delete page error:', err);
    alert('페이지 삭제 중 오류가 발생했습니다.');
  }
}

// Load currently published or draft page from server for target path
async function loadCurrentPage(targetPath = currentPath) {
  try {
    const res = await apiFetch(`/api/admin/current-page?path=${encodeURIComponent(targetPath)}`);
    const data = await res.json();
    if (data.page) {
      currentPageData = data.page;
      currentPath = data.page.page_path || targetPath;
      currentPageName = data.page.page_name || (currentPath === '/' ? '메인 페이지' : currentPath);
      updatePageSelectorUI();
      renderPagesDropdown();

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
      setTimeout(() => {
        initCultureSectionSync(editor);
        bindStoryCardCanvasEvents(editor);
        bindProcessPageCanvasEvents(editor);
      }, 150);
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
    badge.textContent = `🟢 배포중 (${versionName || 'v1.0'})`;
  } else {
    badge.className = 'status-badge status-draft';
    badge.textContent = `🟡 임시 저장 (${versionName || 'Draft'})`;
  }
}

// Clean builder helper elements before saving/publishing to DB
function cleanHtmlForSave(html) {
  if (!html) return '';
  return html
    .replace(/<button[^>]*class="[^"]*btn-add-culture-card[^"]*"[^>]*>.*?<\/button>/gis, '')
    .replace(/<button[^>]*class="[^"]*btn-card-article-picker[^"]*"[^>]*>.*?<\/button>/gis, '');
}

// Save draft
async function saveDraft() {
  const html = cleanHtmlForSave(editor.getHtml());
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
        pagePath: currentPath,
        pageName: currentPageName,
        versionName: `수정본 (${new Date().toLocaleTimeString('ko-KR')})`
      })
    });
    const data = await res.json();
    if (data.success) {
      currentPageData.id = data.id;
      currentPageData.isPublished = 0;
      updateStatusBadge(0, `Draft #${data.id}`);
      loadVersionHistory(currentPath);
      await loadPagesList();
      alert(`✅ [${currentPageName}] (${currentPath}) 페이지가 성공적으로 임시 저장되었습니다!`);
    }
  } catch (err) {
    if (err.message !== 'Unauthorized') {
      alert('임시 저장 중 오류가 발생했습니다.');
    }
  }
}

// Publish page immediately
async function publishPage() {
  if (!confirm(`현재 편집 중인 [${currentPageName}] (${currentPath}) 페이지를 퍼블릭 사이트에 즉시 배포하시겠습니까?`)) return;

  const html = cleanHtmlForSave(editor.getHtml());
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
        pagePath: currentPath,
        pageName: currentPageName,
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
      loadVersionHistory(currentPath);
      await loadPagesList();
      alert(`🚀 [${currentPageName}] (${currentPath}) 페이지가 성공적으로 퍼블릭에 즉시 반영되었습니다!`);
    }
  } catch (err) {
    if (err.message !== 'Unauthorized') {
      alert('배포 중 오류가 발생했습니다.');
    }
  }
}

// Load Version History list into drawer
async function loadVersionHistory(targetPath = currentPath) {
  try {
    const res = await apiFetch(`/api/admin/versions?path=${encodeURIComponent(targetPath)}`);
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
      await loadCurrentPage(currentPath);
      await loadVersionHistory(currentPath);
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
    const res = await apiFetch('/api/admin/reset-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagePath: currentPath })
    });
    const data = await res.json();
    if (data.success && data.page) {
      editor.setComponents(data.page.html || '');
      injectPageCssToCanvas(data.page.css || '');
      currentPageData = data.page;
      updateStatusBadge(0, `Draft #${data.page.id}`);
      loadVersionHistory(currentPath);
      alert('🍊 템플릿이 성공적으로 적용되었습니다!');
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
  modal.style.display = 'flex';
  const targetUrl = (currentPath === '/' ? '/' : currentPath) + '?_t=' + Date.now();
  frame.src = targetUrl;
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

// ── 당근서비스가 일하는 방식 (좌측 가치 목록 ↔ 우측 카드 유기적 양방향 연동 엔진) ──
let isSyncingCulture = false;

function initCultureSectionSync(editorInstance) {
  if (!editorInstance) return;
  const ed = editorInstance;
  let canvasDoc;
  try {
    canvasDoc = ed.Canvas.getDocument();
  } catch (e) {
    return;
  }
  if (!canvasDoc) return;

  // 1. 좌측 패널 하단에 [+ 새 가치 및 카드 추가] 버튼 생성
  function ensureAddButton() {
    const leftPanel = canvasDoc.querySelector('.daangn-sticky-left');
    const list = canvasDoc.getElementById('stickyValueList');
    if (!leftPanel || !list) return;

    let addBtn = leftPanel.querySelector('.btn-add-culture-card');
    if (!addBtn) {
      addBtn = canvasDoc.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'btn-add-culture-card';
      addBtn.innerHTML = '<span>➕</span> 새로운 가치 및 카드 추가';
      addBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addNewCultureItemAndCard();
      };
      leftPanel.appendChild(addBtn);
    }
  }

  // 2. 새 가치(좌측) 및 카드(우측) 동시 추가
  function addNewCultureItemAndCard(title = '새로운 가치') {
    if (isSyncingCulture) return;
    isSyncingCulture = true;

    try {
      const list = canvasDoc.getElementById('stickyValueList');
      const stack = canvasDoc.getElementById('stickyCardsStack');
      if (!list || !stack) return;

      const existingCards = stack.querySelectorAll('.daangn-sticky-card');
      const newIdx = existingCards.length;
      const tagNum = String(newIdx + 1).padStart(2, '0');

      const wrapper = ed.DomComponents.getWrapper();
      const listComp = wrapper.find('#stickyValueList')[0];
      const stackComp = wrapper.find('#stickyCardsStack')[0];

      const newLeftHtml = `<div class="sticky-value-item" data-index="${newIdx}" onclick="scrollToStickyCard(${newIdx})">${title}</div>`;
      const newCardHtml = `
        <div class="daangn-sticky-card" data-index="${newIdx}" data-label="${title}">
          <div class="daangn-sticky-card-media">
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80" alt="${title}" class="daangn-sticky-card-img" />
          </div>
          <div class="daangn-sticky-card-caption">
            <span class="daangn-sticky-card-tag">${tagNum} · 일하는 방식</span>
            <h3 class="daangn-sticky-card-title">${title}</h3>
            <p class="daangn-sticky-card-desc">당근서비스 팀이 함께 만들어가는 가치와 일하는 방식을 소개하는 문구를 여기에 작성하세요. 1개의 이미지와 글을 자유롭게 편집할 수 있습니다.</p>
          </div>
        </div>
      `;

      if (listComp && stackComp) {
        listComp.append(newLeftHtml);
        const addedCards = stackComp.append(newCardHtml);
        if (addedCards && addedCards.length) {
          ed.select(addedCards[0]);
          const cardEl = addedCards[0].getEl();
          if (cardEl) {
            cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      } else {
        list.insertAdjacentHTML('beforeend', newLeftHtml);
        stack.insertAdjacentHTML('beforeend', newCardHtml);
      }

      bindItemEvents();
    } finally {
      isSyncingCulture = false;
    }
  }

  // 3. 타이핑 입력 시 양방향 텍스트 실시간 동기화
  function handleInput(e) {
    if (isSyncingCulture) return;
    const target = e.target;
    if (!target) return;

    // A. 좌측 네비 텍스트 수정 -> 우측 카드의 제목 및 data-label 동시 업데이트
    const leftItem = target.classList && target.classList.contains('sticky-value-item') 
      ? target 
      : (target.closest && target.closest('.sticky-value-item'));

    if (leftItem) {
      const list = canvasDoc.getElementById('stickyValueList');
      const stack = canvasDoc.getElementById('stickyCardsStack');
      if (!list || !stack) return;

      const items = Array.from(list.querySelectorAll('.sticky-value-item'));
      const idx = items.indexOf(leftItem);
      if (idx !== -1) {
        const cards = stack.querySelectorAll('.daangn-sticky-card');
        if (cards[idx]) {
          const cardTitle = cards[idx].querySelector('.daangn-sticky-card-title');
          const newText = leftItem.textContent.trim();
          if (cardTitle && cardTitle.textContent.trim() !== newText) {
            isSyncingCulture = true;
            cardTitle.textContent = newText;
            cards[idx].setAttribute('data-label', newText);
            isSyncingCulture = false;
          }
        }
      }
      return;
    }

    // B. 우측 카드 제목 수정 -> 좌측 네비 텍스트 동시 업데이트
    if (target.classList && target.classList.contains('daangn-sticky-card-title')) {
      const card = target.closest('.daangn-sticky-card');
      const list = canvasDoc.getElementById('stickyValueList');
      const stack = canvasDoc.getElementById('stickyCardsStack');
      if (card && list && stack) {
        const cards = Array.from(stack.querySelectorAll('.daangn-sticky-card'));
        const idx = cards.indexOf(card);
        if (idx !== -1) {
          const items = list.querySelectorAll('.sticky-value-item');
          const newText = target.textContent.trim();
          if (items[idx] && items[idx].textContent.trim() !== newText) {
            isSyncingCulture = true;
            items[idx].textContent = newText;
            card.setAttribute('data-label', newText);
            isSyncingCulture = false;
          }
        }
      }
    }
  }

  // 4. 아이템 이벤트 바인딩 (직접 텍스트 편집, 클릭 시 해당 카드로 스크롤, Enter 시 새 카드 생성)
  function bindItemEvents() {
    const leftPanel = canvasDoc.querySelector('.daangn-sticky-left');
    if (leftPanel) {
      // "당근서비스가 일하는 방식" 상단 제목도 직접 클릭하여 편집 가능
      const titleSpan = leftPanel.querySelector('span');
      if (titleSpan) {
        titleSpan.setAttribute('contenteditable', 'true');
      }
    }

    const list = canvasDoc.getElementById('stickyValueList');
    const stack = canvasDoc.getElementById('stickyCardsStack');
    if (!list || !stack) return;

    const items = list.querySelectorAll('.sticky-value-item');
    items.forEach((item, idx) => {
      item.setAttribute('contenteditable', 'true');

      // 클릭 시 해당 카드 위치로 스크롤 및 활성화
      item.onclick = (e) => {
        items.forEach((it, i) => it.classList.toggle('is-active', i === idx));
        const cards = stack.querySelectorAll('.daangn-sticky-card');
        if (cards[idx]) {
          cards[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      };

      // 텍스트 수정 중 Enter를 누르면 다음 새 가치 및 카드를 즉시 생성
      item.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addNewCultureItemAndCard();
        }
      };
    });
  }

  // 5. 컴포넌트 추가/삭제 감지하여 양쪽 개수 동기화
  ed.off('component:remove:culture');
  ed.on('component:remove:culture', function onCompRemove(model) {
    if (isSyncingCulture || !model) return;
    const classes = model.get('classes') || [];
    const classStr = typeof classes.pluck === 'function' ? classes.pluck('name').join(' ') : String(classes);

    if (classStr.includes('daangn-sticky-card')) {
      isSyncingCulture = true;
      setTimeout(() => {
        syncLeftListFromCards();
        isSyncingCulture = false;
      }, 50);
    } else if (classStr.includes('sticky-value-item')) {
      isSyncingCulture = true;
      setTimeout(() => {
        syncCardsFromLeftList();
        isSyncingCulture = false;
      }, 50);
    }
  });

  function syncLeftListFromCards() {
    const list = canvasDoc.getElementById('stickyValueList');
    const stack = canvasDoc.getElementById('stickyCardsStack');
    if (!list || !stack) return;

    const cards = stack.querySelectorAll('.daangn-sticky-card');
    const wrapper = ed.DomComponents.getWrapper();
    const listComp = wrapper.find('#stickyValueList')[0];
    if (!listComp) return;

    listComp.empty();
    cards.forEach((card, idx) => {
      const titleEl = card.querySelector('.daangn-sticky-card-title');
      const title = titleEl ? titleEl.textContent.trim() : `가치 ${idx + 1}`;
      listComp.append(`<div class="sticky-value-item${idx === 0 ? ' is-active' : ''}" data-index="${idx}" onclick="scrollToStickyCard(${idx})">${title}</div>`);
    });
    bindItemEvents();
  }

  function syncCardsFromLeftList() {
    const list = canvasDoc.getElementById('stickyValueList');
    const stack = canvasDoc.getElementById('stickyCardsStack');
    if (!list || !stack) return;

    const items = list.querySelectorAll('.sticky-value-item');
    const cards = stack.querySelectorAll('.daangn-sticky-card');
    const wrapper = ed.DomComponents.getWrapper();
    const stackComp = wrapper.find('#stickyCardsStack')[0];
    if (!stackComp) return;

    if (items.length < cards.length) {
      const cardComps = stackComp.components();
      while (cardComps.length > items.length) {
        cardComps.at(cardComps.length - 1).destroy();
      }
    }
    bindItemEvents();
  }

  // Event Listeners 바인딩
  canvasDoc.removeEventListener('input', handleInput);
  canvasDoc.addEventListener('input', handleInput, true);

  ensureAddButton();
  bindItemEvents();
}

// ── 인사이드 당근서비스 아티클 관리 CMS 연동 엔진 ─────────────────────
let cmsArticlesList = [];
let activeStoryCardComponent = null;

function bindStoryCardCanvasEvents(editorInstance) {
  if (!editorInstance) return;
  try {
    const canvasDoc = editorInstance.Canvas.getDocument();
    if (!canvasDoc) return;
    canvasDoc.removeEventListener('dblclick', handleStoryCardDblClick);
    canvasDoc.addEventListener('dblclick', handleStoryCardDblClick);

    // 각 아티클 카드 하단에 직관적인 [📰 아티클 선택 / 변경 (팝업)] 버튼 주입
    ensureStoryCardPickerButtons(canvasDoc, editorInstance);
  } catch (e) {}
}

function handleStoryCardDblClick(e) {
  const cardEl = e.target.closest('.daangn-story-card');
  if (cardEl) {
    e.preventDefault();
    e.stopPropagation();
    const wrapper = editor.DomComponents.getWrapper();
    const allComps = wrapper.find('.daangn-story-card');
    const comp = allComps.find(c => c.getEl() === cardEl) || editor.getSelected();
    openArticlePickerModal(comp);
  }
}

function ensureStoryCardPickerButtons(canvasDoc, editorInstance) {
  if (!canvasDoc) return;
  const cards = canvasDoc.querySelectorAll('.daangn-story-card');
  cards.forEach(card => {
    let btn = card.querySelector('.btn-card-article-picker');
    if (!btn) {
      btn = canvasDoc.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-card-article-picker';
      btn.innerHTML = '<span>📰 아티클 선택 / 변경 (팝업)</span>';
      btn.title = '클릭하면 팝업 창이 열려 원하는 아티클을 선택할 수 있습니다.';
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const wrapper = editorInstance.DomComponents.getWrapper();
        const allComps = wrapper.find('.daangn-story-card');
        const comp = allComps.find(c => c.getEl() === card) || editorInstance.getSelected();
        openArticlePickerModal(comp);
      };
      const content = card.querySelector('.daangn-story-content') || card;
      content.appendChild(btn);
    }
  });
}

async function loadCmsArticles() {
  try {
    const res = await fetch('/api/articles');
    const data = await res.json();
    cmsArticlesList = data.articles || [];
    renderArticlePickerModalList();
  } catch (err) {
    console.error('CMS 아티클 목록 불러오기 실패:', err);
  }
}

function updateStoryCardTraitOptions(comp) {
  if (!comp) return;
  const options = [
    { value: '', name: '🚫 미선택 ("더 좋은 콘텐츠를 준비 중이에요")' },
    ...cmsArticlesList.map(a => ({
      value: a.slug,
      name: `${a.title} (/${a.slug})`
    }))
  ];
  const trait = comp.getTrait('data-article-slug');
  if (trait) {
    trait.set('options', options);
  }
}

function openArticlePickerModal(cardComp) {
  activeStoryCardComponent = cardComp || editor.getSelected();
  if (activeStoryCardComponent && activeStoryCardComponent.getEl && activeStoryCardComponent.getEl()) {
    const el = activeStoryCardComponent.getEl();
    if (!el.classList.contains('daangn-story-card')) {
      activeStoryCardComponent = activeStoryCardComponent.closest('.daangn-story-card') || activeStoryCardComponent;
    }
  }

  let currentSlug = '';
  if (activeStoryCardComponent) {
    const attrs = activeStoryCardComponent.getAttributes() || {};
    currentSlug = attrs['data-article-slug'] || activeStoryCardComponent.get('data-article-slug') || '';
  }

  currentPickerPage = 1;
  currentPickerKeyword = '';
  const searchInput = document.getElementById('articlePickerSearch');
  if (searchInput) searchInput.value = '';

  renderArticlePickerModalList(currentSlug, '', 1);

  const modal = document.getElementById('articlePickerModal');
  if (modal) modal.style.display = 'flex';
}

function closeArticlePickerModal() {
  const modal = document.getElementById('articlePickerModal');
  if (modal) modal.style.display = 'none';
  activeStoryCardComponent = null;
}

function selectCmsArticleForCard(slug) {
  if (activeStoryCardComponent) {
    applyCmsArticleToCard(activeStoryCardComponent, slug);
    editor.trigger('change:canvas');
    setTimeout(() => {
      bindStoryCardCanvasEvents(editor);
    }, 100);
  }
  closeArticlePickerModal();
}

const ARTICLE_PICKER_PAGE_SIZE = 5;
let currentPickerPage = 1;
let currentPickerSelectedSlug = '';
let currentPickerKeyword = '';

function filterArticlePickerModalList(keyword) {
  currentPickerKeyword = keyword || '';
  currentPickerPage = 1;
  renderArticlePickerModalList(currentPickerSelectedSlug, currentPickerKeyword, 1);
}

function changeArticlePickerPage(page) {
  currentPickerPage = page;
  renderArticlePickerModalList(currentPickerSelectedSlug, currentPickerKeyword, currentPickerPage);
}

function renderArticlePickerModalList(selectedSlug = '', searchKeyword = '', targetPage = 1) {
  if (selectedSlug !== undefined) currentPickerSelectedSlug = selectedSlug;
  const container = document.getElementById('articlePickerList');
  const paginationContainer = document.getElementById('articlePickerPagination');
  if (!container) return;

  if (!cmsArticlesList || cmsArticlesList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 32px 16px; color: #868B94;">
        <p style="font-size: 15px; margin-bottom: 8px;">등록된 CMS 아티클이 없습니다.</p>
        <a href="/admin/articles" target="_blank" style="color: #FF6F0F; font-weight: 700; text-decoration: underline;">아티클 관리에서 첫 아티클 작성하기 ➔</a>
      </div>
    `;
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  const kw = (searchKeyword !== undefined ? searchKeyword : currentPickerKeyword).trim().toLowerCase();
  const filtered = kw ? cmsArticlesList.filter(a => {
    const title = (a.title || '').toLowerCase();
    const sub = (a.subtitle || '').toLowerCase();
    const cat = (a.category || (a.tags && a.tags.join(' ')) || '').toLowerCase();
    return title.includes(kw) || sub.includes(kw) || cat.includes(kw) || a.slug.toLowerCase().includes(kw);
  }) : cmsArticlesList;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 28px 16px; color: #868B94; font-size: 14px;">
        '${searchKeyword}' 검색 결과가 없습니다.
      </div>
    `;
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  // 최대 5개 단위 페이징 계산
  const totalPages = Math.ceil(filtered.length / ARTICLE_PICKER_PAGE_SIZE) || 1;
  currentPickerPage = Math.max(1, Math.min(targetPage || currentPickerPage, totalPages));
  const startIndex = (currentPickerPage - 1) * ARTICLE_PICKER_PAGE_SIZE;
  const pagedArticles = filtered.slice(startIndex, startIndex + ARTICLE_PICKER_PAGE_SIZE);

  container.innerHTML = pagedArticles.map(a => {
    const isCurrent = a.slug === currentPickerSelectedSlug;
    const cat = (a.tags && a.tags[0]) || a.category || '인사이드';
    const thumb = a.thumbnail_url || '/images/article-placeholder.svg';
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: ${isCurrent ? '#FFF3EB' : '#FFFFFF'}; border: 1.5px solid ${isCurrent ? '#FF6F0F' : '#EAECEF'}; border-radius: 12px; gap: 14px; transition: all 0.2s;">
        <div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0;">
          <img src="${thumb}" alt="${a.title}" style="width: 72px; height: 50px; border-radius: 8px; object-fit: cover; flex-shrink: 0; background: #F2F3F7;" />
          <div style="min-width: 0; flex: 1;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="font-size: 11px; font-weight: 700; color: #FF6F0F; background: #FFF0E6; padding: 2px 6px; border-radius: 4px;">${cat}</span>
              <span style="font-size: 11px; color: #868B94; font-family: monospace;">/${a.slug}</span>
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #212124; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${a.title}</div>
            ${a.subtitle ? `<div style="font-size: 12px; color: #868B94; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">${a.subtitle}</div>` : ''}
          </div>
        </div>
        <button type="button" class="btn ${isCurrent ? 'btn-primary' : 'btn-outline'}" style="flex-shrink: 0; font-size: 13px; font-weight: 700; padding: 8px 16px; border-radius: 8px; cursor: pointer; ${isCurrent ? 'background: #FF6F0F; color: #fff; border: none;' : 'border: 1px solid #D1D3D8; color: #212124; background: #fff;'}" onclick="selectCmsArticleForCard('${a.slug}')">
          ${isCurrent ? '✓ 현재 선택됨' : '이 아티클 연결'}
        </button>
      </div>
    `;
  }).join('');

  // 5개 초과 시 페이지네이션 버튼 렌더링
  if (paginationContainer) {
    if (totalPages > 1) {
      let pagesHtml = `
        <button type="button" class="btn-picker-page-nav" ${currentPickerPage === 1 ? 'disabled' : ''} onclick="changeArticlePickerPage(${currentPickerPage - 1})" title="이전 페이지">〈</button>
      `;
      for (let i = 1; i <= totalPages; i++) {
        pagesHtml += `
          <button type="button" class="btn-picker-page-num ${i === currentPickerPage ? 'active' : ''}" onclick="changeArticlePickerPage(${i})">${i}</button>
        `;
      }
      pagesHtml += `
        <button type="button" class="btn-picker-page-nav" ${currentPickerPage === totalPages ? 'disabled' : ''} onclick="changeArticlePickerPage(${currentPickerPage + 1})" title="다음 페이지">〉</button>
        <span style="font-size: 12px; color: #868B94; margin-left: 8px;">(총 ${filtered.length}개 · ${currentPickerPage}/${totalPages}P)</span>
      `;
      paginationContainer.innerHTML = pagesHtml;
    } else {
      paginationContainer.innerHTML = '';
    }
  }
}

function applyCmsArticleToCard(cardComp, slug) {
  if (!cardComp) return;
  slug = (slug || '').trim();

  const article = cmsArticlesList.find(a => a.slug === slug);
  const cardEl = cardComp.getEl ? cardComp.getEl() : null;

  if (slug && article) {
    cardComp.addAttributes({
      'data-article-slug': slug,
      'href': '/articles/' + slug
    });
    cardComp.removeClass('is-placeholder');

    if (cardEl) {
      cardEl.classList.remove('is-placeholder');
      cardEl.setAttribute('data-article-slug', slug);
      cardEl.setAttribute('href', '/articles/' + slug);

      const imgEl = cardEl.querySelector('.daangn-story-img');
      if (imgEl && article.thumbnail_url) {
        imgEl.src = article.thumbnail_url;
        imgEl.alt = article.title;
      }
      const titleEl = cardEl.querySelector('.daangn-story-title');
      if (titleEl) titleEl.textContent = article.title;

      const subEl = cardEl.querySelector('.daangn-story-sub');
      if (subEl) subEl.textContent = article.subtitle || '';

      const tagEl = cardEl.querySelector('.daangn-story-tag');
      if (tagEl) {
        const cat = (article.tags && article.tags[0]) || article.category || '인사이드';
        tagEl.textContent = cat;
      }
    }

    const imgComp = cardComp.find ? cardComp.find('.daangn-story-img')[0] : null;
    if (imgComp && article.thumbnail_url) {
      imgComp.set({ src: article.thumbnail_url });
      imgComp.addAttributes({ src: article.thumbnail_url, alt: article.title });
    }
    const titleComp = cardComp.find ? cardComp.find('.daangn-story-title')[0] : null;
    if (titleComp) {
      titleComp.components(article.title);
    }
    const subComp = cardComp.find ? cardComp.find('.daangn-story-sub')[0] : null;
    if (subComp) {
      subComp.components(article.subtitle || '');
    }
    const tagComp = cardComp.find ? cardComp.find('.daangn-story-tag')[0] : null;
    if (tagComp) {
      const cat = (article.tags && article.tags[0]) || article.category || '인사이드';
      tagComp.components(cat);
    }
  } else {
    // Placeholder state: "더 좋은 콘텐츠를 준비 중이에요"
    cardComp.addAttributes({
      'data-article-slug': '',
      'href': 'javascript:void(0)'
    });
    cardComp.addClass('is-placeholder');

    if (cardEl) {
      cardEl.classList.add('is-placeholder');
      cardEl.setAttribute('data-article-slug', '');
      cardEl.setAttribute('href', 'javascript:void(0)');

      const imgEl = cardEl.querySelector('.daangn-story-img');
      if (imgEl) {
        imgEl.src = '/images/article-placeholder.svg';
        imgEl.alt = '준비중';
      }
      const titleEl = cardEl.querySelector('.daangn-story-title');
      if (titleEl) titleEl.textContent = '준비중';

      const subEl = cardEl.querySelector('.daangn-story-sub');
      if (subEl) subEl.textContent = '새로운 당근서비스 이야기를 기대해 주세요.';

      const tagEl = cardEl.querySelector('.daangn-story-tag');
      if (tagEl) tagEl.textContent = '준비중';
    }

    const imgComp = cardComp.find ? cardComp.find('.daangn-story-img')[0] : null;
    if (imgComp) {
      imgComp.set({ src: '/images/article-placeholder.svg' });
      imgComp.addAttributes({ src: '/images/article-placeholder.svg', alt: '준비중' });
    }
    const titleComp = cardComp.find ? cardComp.find('.daangn-story-title')[0] : null;
    if (titleComp) titleComp.components('준비중');

    const subComp = cardComp.find ? cardComp.find('.daangn-story-sub')[0] : null;
    if (subComp) subComp.components('새로운 당근서비스 이야기를 기대해 주세요.');

    const tagComp = cardComp.find ? cardComp.find('.daangn-story-tag')[0] : null;
    if (tagComp) tagComp.components('준비 중');
  }

  const trait = cardComp.getTrait ? cardComp.getTrait('data-article-slug') : null;
  if (trait) {
    trait.set('value', slug || '');
  }
}

// Global exports for modal buttons in admin.html
window.openArticlePickerModal = openArticlePickerModal;
window.closeArticlePickerModal = closeArticlePickerModal;
window.selectCmsArticleForCard = selectCmsArticleForCard;
window.applyCmsArticleToCard = applyCmsArticleToCard;
window.filterArticlePickerModalList = filterArticlePickerModalList;
window.changeArticlePickerPage = changeArticlePickerPage;

// ── 채용 절차(합류 여정) 및 FAQ 빌더 캔버스 텍스트 편집 연동 엔진 ─────────────
function bindProcessPageCanvasEvents(editorInstance) {
  if (!editorInstance) return;
  try {
    const canvasDoc = editorInstance.Canvas.getDocument();
    if (!canvasDoc) return;

    // 1. 합류 여정 트랙 아이템 편집 지원
    const trackItems = canvasDoc.querySelectorAll('.daangn-process-track-item');
    trackItems.forEach(item => {
      // '더보기' 버튼 멘트 (span) 직접 편집 가능하도록 설정
      const toggleBtn = item.querySelector('.daangn-process-toggle-btn');
      if (toggleBtn) {
        const span = toggleBtn.querySelector('span');
        if (span) {
          span.setAttribute('contenteditable', 'true');
          span.setAttribute('title', '클릭하여 더보기 멘트를 직접 수정할 수 있습니다');
        }
      }

      // 더보기 내부 각 단계별 제목(h4) 및 상세 설명(p) 직접 편집 가능하도록 설정
      const steps = item.querySelectorAll('.daangn-process-detail-step');
      steps.forEach(step => {
        const h4 = step.querySelector('h4');
        if (h4) {
          h4.setAttribute('contenteditable', 'true');
          h4.setAttribute('title', '클릭하여 단계 제목을 직접 수정할 수 있습니다');
        }
        const ps = step.querySelectorAll('p');
        ps.forEach(p => {
          p.setAttribute('contenteditable', 'true');
          p.setAttribute('title', '클릭하여 단계별 상세 안내 멘트를 직접 수정할 수 있습니다');
        });
      });
    });

    // 2. FAQ 질문 및 답변 영역 편집 지원
    const faqItems = canvasDoc.querySelectorAll('.daangn-faq-item');
    faqItems.forEach(item => {
      const qText = item.querySelector('.faq-q-text');
      if (qText) {
        qText.setAttribute('contenteditable', 'true');
        qText.setAttribute('title', '클릭하여 질문 내용을 직접 수정할 수 있습니다');
      }
      const ansPs = item.querySelectorAll('.daangn-faq-answer-content p');
      ansPs.forEach(p => {
        p.setAttribute('contenteditable', 'true');
        p.setAttribute('title', '클릭하여 답변 내용을 직접 수정할 수 있습니다');
      });
    });

    // 3. contenteditable 입력 시 GrapesJS 컴포넌트 모델 동기화
    const handleCanvasTextInput = (e) => {
      const target = e.target;
      if (!target || !target.isContentEditable) return;
      if (target.closest('.daangn-process-track-item') || target.closest('.daangn-faq-item')) {
        const comp = editorInstance.getSelected() || (editorInstance.Components && editorInstance.Components.getComponent(target));
        if (comp && comp.set) {
          comp.set('content', target.innerHTML);
        }
      }
    };
    canvasDoc.removeEventListener('input', handleCanvasTextInput);
    canvasDoc.addEventListener('input', handleCanvasTextInput, true);
  } catch (err) {
    console.warn('bindProcessPageCanvasEvents error:', err);
  }
}

