/**
 * Daangn Service Careers - Runtime Client Interactions
 * This script runs reliably on public pages regardless of builder HTML modifications.
 */

// ── 1. Hero sticky scroll zoom & text transition (about.daangn.com 스타일) ────
(function() {
  if (typeof window === 'undefined') return;

  function initHeroScroll() {
    var track = document.getElementById('daangnHeroTrack');
    var title1 = document.getElementById('daangnHeroTitle1');
    var videoBox = document.getElementById('daangnHeroVideoBox');
    var scrim = document.getElementById('daangnHeroScrim');
    var title2 = document.getElementById('daangnHeroTitle2');
    var header = document.querySelector('.header__HeaderContainer-sc-bdd24b93-1') || document.querySelector('header');

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
      var isMobile = winW <= 768;
      var initialW = isMobile ? (winW - 32) : Math.min(1060, winW - 48);
      var titleH = title1 ? title1.offsetHeight : (isMobile ? 90 : 130);
      var titleTop = title1 ? title1.offsetTop : (isMobile ? 24 : 40);
      var initialMarginTop = Math.max(isMobile ? 120 : 150, Math.min(isMobile ? 150 : 210, titleTop + titleH + 16));
      var availableH = Math.max(180, winH - initialMarginTop - (isMobile ? 24 : 48));
      var initialH = isMobile
        ? Math.min(Math.round(initialW * 9 / 16), availableH)
        : Math.min(620, Math.max(340, Math.round(Math.min(availableH, winH * 0.52))));

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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroScroll);
  } else {
    initHeroScroll();
  }
})();

// ── 2. Questions Carousel Controller (로컬의 질문들 상단 고정 & 스크롤 연동 슬라이딩) ────
(function() {
  if (typeof window === 'undefined') return;

  function initQuestionsCarousel() {
    var section = document.getElementById('questionsSection') || document.querySelector('.daangn-questions-section');
    var track = document.getElementById('questionsTrack') || document.getElementById('questions-track');
    var btnPrev = document.getElementById('questionsPrevBtn');
    var btnNext = document.getElementById('questionsNextBtn');
    if (!track) return;

    var currentIndex = 0;
    var isManual = false;
    var manualTimer = null;

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

    // Scroll-driven horizontal sliding while pinned at the top
    function updateScrollProgress() {
      if (!section || window.innerWidth <= 768) return;
      if (isManual) return; // User recently clicked arrows

      var rect = section.getBoundingClientRect();
      var pinTop = 60; // GNB header height
      var pinHeight = window.innerHeight - pinTop;
      var totalPinTravel = section.offsetHeight - pinHeight;
      if (totalPinTravel <= 0) return;

      var scrolled = pinTop - rect.top;
      var p = scrolled / totalPinTravel;

      if (p <= 0.12) {
        if (currentIndex !== 0) {
          currentIndex = 0;
          updateCarousel();
        }
        return;
      }

      var maxIdx = getMaxIndex();
      if (p >= 0.88) {
        if (currentIndex !== maxIdx) {
          currentIndex = maxIdx;
          updateCarousel();
        }
        return;
      }

      // Inside the pinned scroll zone (p between 0.12 and 0.88):
      // Progressively shift through the question cards
      var progress = Math.max(0, Math.min(1, (p - 0.12) / 0.76));
      var targetIdx = Math.round(progress * maxIdx);
      if (targetIdx !== currentIndex) {
        currentIndex = targetIdx;
        updateCarousel();
      }
    }

    window.questionsCarousel = function(direction) {
      isManual = true;
      clearTimeout(manualTimer);
      manualTimer = setTimeout(function() {
        isManual = false;
      }, 2500);

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

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', function() {
      updateCarousel();
      updateScrollProgress();
    });
    setTimeout(function() {
      updateCarousel();
      updateScrollProgress();
    }, 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuestionsCarousel);
  } else {
    initQuestionsCarousel();
  }
})();

// ── 3. Culture Cards: Scroll-Capture Switch (절대 스크롤 위치 기반 카드 전환) ──
(function() {
  if (typeof window === 'undefined') return;

  var SCROLL_PER_CARD = 420; // 가변형 반응 속도 (기존 600px 과도한 수직 이동 축소)
  var BOTTOM_PAD = 20; // 카드 하단과 뷰포트 하단 사이 여백 (px)

  var section, innerWrapper, stack, cards, navItems, container;
  var sectionDocTop = 0;
  var stickyTop = 260;
  var initialized = false;

  function calcStickyTop() {
    var headerEl = document.getElementById('daangnCultureHeader');
    if (headerEl) {
      return Math.round(headerEl.offsetHeight + 60 + 16);
    }
    return 260;
  }

  function getRequiredHeight() {
    return (cards.length - 1) * SCROLL_PER_CARD + Math.min(window.innerHeight - stickyTop, 520) + 40;
  }

  function applyPositioning() {
    if (!cards || !cards.length) return;

    if (window.innerWidth <= 900) {
      if (innerWrapper) innerWrapper.style.minHeight = 'auto';
      if (section) section.style.minHeight = 'auto';
      if (stack) stack.style.minHeight = 'auto';
      if (container) {
        container.style.position = 'relative';
        container.style.top = 'auto';
      }
      cards.forEach(function(c) {
        c.style.position = 'relative';
        c.style.opacity = '1';
        c.style.transform = 'none';
        c.classList.add('is-active');
      });
      return;
    }

    // 카드 높이 측정 (이미지 로드 후 정확한 높이)
    var maxH = 0;
    cards.forEach(function(c) {
      c.style.visibility = 'hidden';
      c.classList.add('is-active');
      if (c.offsetHeight > maxH) maxH = c.offsetHeight;
      c.classList.remove('is-active');
      c.style.visibility = '';
    });
    if (!maxH) return;

    if (stack) stack.style.minHeight = (maxH + 8) + 'px';

    stickyTop = calcStickyTop();

    var h = getRequiredHeight();
    if (innerWrapper) innerWrapper.style.minHeight = h + 'px';
    section.style.minHeight = (h + 40) + 'px';

    if (container) {
      container.style.position = 'sticky';
      container.style.top = stickyTop + 'px';
    }
  }

  function init() {
    section = document.getElementById('culture') || document.querySelector('.daangn-culture-section');
    if (!section) return;

    innerWrapper = section.querySelector(':scope > div');
    stack = document.getElementById('stickyCardsStack');
    cards = Array.from(section.querySelectorAll('.daangn-sticky-card'));
    navItems = Array.from(section.querySelectorAll('.sticky-value-item'));
    if (!cards.length) return;

    sectionDocTop = section.getBoundingClientRect().top + window.scrollY;

    container = section.querySelector('.daangn-sticky-stack-container');
    if (container) {
      container.style.position = 'sticky';
      container.style.top = stickyTop + 'px';
    }

    // 1차 측정 (DOMContentLoaded - 이미지 없을 수 있음)
    applyPositioning();

    setCard(0);
    initialized = true;
  }

  function setCard(idx) {
    idx = Math.max(0, Math.min(idx, cards.length - 1));
    cards.forEach(function(c, i) { c.classList.toggle('is-active', i === idx); });
    navItems.forEach(function(n, i) { n.classList.toggle('is-active', i === idx); });
  }

  window.scrollToStickyCard = function(idx) {
    if (!initialized) return;
    window.scrollTo({ top: sectionDocTop + idx * SCROLL_PER_CARD, behavior: 'smooth' });
  };

  window.addEventListener('scroll', function() {
    if (!initialized) return;
    var progress = window.scrollY - sectionDocTop;
    if (progress < 0) { setCard(0); return; }
    setCard(Math.floor(progress / SCROLL_PER_CARD));
  }, { passive: true });

  window.addEventListener('resize', function() {
    if (!section || !cards.length) return;
    sectionDocTop = section.getBoundingClientRect().top + window.scrollY;
    applyPositioning();
  }, { passive: true });

  // window.load: 이미지 로드 완료 후 정확한 카드 높이로 재계산
  window.addEventListener('load', function() {
    if (initialized) applyPositioning();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();



// ── 4. Team Carousel Controller (팀 소개 3개 노출 슬라이딩) ─────────
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

// ── 5. Stories Carousel Controller (소식과 이야기 하나씩 넘겨지기) ────
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

// ── 6. Floating Campaign Promo Timer Controller (지연 시간 후 노출) ────
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

// ── 7. Header Dropdown Submenu Click & Outside Click Controller ─────
(function() {
  if (typeof window === 'undefined') return;

  function initHeaderDropdowns() {
    var groups = document.querySelectorAll('.header-menu-item-group');

    groups.forEach(function(group) {
      var btn = group.querySelector('.header-dropdown-trigger');
      if (btn) {
        btn.removeAttribute('onclick');
        btn.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          var wasOpen = group.classList.contains('is-open');
          groups.forEach(function(g) { g.classList.remove('is-open'); });
          if (!wasOpen) {
            group.classList.add('is-open');
          }
        };
      }

      var menu = group.querySelector('.header-dropdown-menu');
      if (menu) {
        menu.addEventListener('click', function(e) {
          if (e.target.closest && e.target.closest('.header-dropdown-item')) {
            group.classList.remove('is-open');
          }
        });
      }
    });

    document.addEventListener('click', function(e) {
      if (!e.target.closest || !e.target.closest('.header-menu-item-group')) {
        groups.forEach(function(g) { g.classList.remove('is-open'); });
      }
    });

    var mobileBtn = document.querySelector('.header__MobileMenuButtonStyled-sc-bdd24b93-4') || document.querySelector('[data-testid="모바일_메뉴_버튼"]');
    var mobileMenu = document.querySelector('.mobile-view__MobileView-sc-bb2ed92c-0.gJVwBD');
    if (mobileBtn && mobileMenu) {
      mobileBtn.removeAttribute('onclick');
      mobileBtn.onclick = function(e) {
        e.stopPropagation();
        mobileMenu.classList.toggle('is-open');
      };
    }

    // Auto highlight active route in header
    try {
      var path = window.location.pathname.replace(/\/$/, '') || '/';
      var homeBtn = document.querySelector('button[name="홈"]');
      var allGroups = document.querySelectorAll('.header-menu-item-group');
      if (homeBtn) homeBtn.classList.remove('is-active');
      allGroups.forEach(function(g) { g.classList.remove('is-active'); });

      if (path === '' || path === '/') {
        if (homeBtn) homeBtn.classList.add('is-active');
      } else if (path.startsWith('/teams')) {
        allGroups.forEach(function(g) {
          var t = g.querySelector('.header-dropdown-trigger span');
          if (t && t.textContent.trim() === '팀 소개') g.classList.add('is-active');
        });
      } else if (path.startsWith('/articles')) {
        allGroups.forEach(function(g) {
          var t = g.querySelector('.header-dropdown-trigger span');
          if (t && t.textContent.trim() === '콘텐츠') g.classList.add('is-active');
        });
      } else if (path.startsWith('/process')) {
        allGroups.forEach(function(g) {
          var t = g.querySelector('.header-dropdown-trigger span');
          if (t && t.textContent.trim() === '채용 절차') g.classList.add('is-active');
        });
      }
    } catch (err) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderDropdowns);
  } else {
    initHeaderDropdowns();
  }
})();

// ── 8. Inside Story Cards Dynamic CMS Article Sync ──────────────────
(function() {
  if (typeof window === 'undefined') return;

  async function syncInsideStoryCards() {
    var storyCards = document.querySelectorAll('.daangn-story-card');
    if (!storyCards.length) return;

    try {
      var res = await fetch('/api/articles');
      var data = await res.json();
      var articles = data.articles || [];
      var articleMap = {};
      articles.forEach(function(a) { articleMap[a.slug] = a; });

      storyCards.forEach(function(card) {
        var slug = card.getAttribute('data-article-slug');
        if (slug && articleMap[slug]) {
          var a = articleMap[slug];
          card.classList.remove('is-placeholder');
          card.href = '/articles/' + a.slug;
          var img = card.querySelector('.daangn-story-img');
          if (img && a.thumbnail_url) { img.src = a.thumbnail_url; img.alt = a.title; }
          var title = card.querySelector('.daangn-story-title');
          if (title) title.textContent = a.title;
          var sub = card.querySelector('.daangn-story-sub');
          if (sub && a.subtitle) sub.textContent = a.subtitle;
          var tag = card.querySelector('.daangn-story-tag');
          if (tag && a.tags && a.tags[0]) tag.textContent = a.tags[0];
        } else if (slug === '' || card.classList.contains('is-placeholder')) {
          card.classList.add('is-placeholder');
          card.href = 'javascript:void(0)';
          var img = card.querySelector('.daangn-story-img');
          if (img) { img.src = '/images/article-placeholder.svg'; img.alt = '준비중'; }
          var title = card.querySelector('.daangn-story-title');
          if (title) title.textContent = '준비중';
          var sub = card.querySelector('.daangn-story-sub');
          if (sub) sub.textContent = '새로운 당근서비스 이야기를 기대해 주세요.';
          var tag = card.querySelector('.daangn-story-tag');
          if (tag) tag.textContent = '준비중';
        }
      });
    } catch (err) {
      // Graceful fallback to pre-rendered HTML
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncInsideStoryCards);
  } else {
    syncInsideStoryCards();
  }
})();


// ── 9. Sticky Cards - Precise Last Card Margin (Viewport-Responsive Fix) ──
// CSS margin-bottom: 60vh on last card causes excessive whitespace at large viewports.
// The minimum needed: viewport_height - sticky_top(340px) + 40px (post-stack buffer).
// This JS calculates the exact value and overrides the CSS inline.

// ── 10. Process Journey Toggles & FAQ Accordions Controller ──────────────────
(function() {
  if (typeof window === 'undefined') return;

  function initProcessAndFaqInteractions() {
    // 이벤트 위임을 사용하여 동적 렌더링 및 모든 뷰포트/디바이스에서 항상 안정적으로 동작
    document.addEventListener('click', function(e) {
      // 1. 채용 프로세스 (합류 여정) '더보기' / '접기' 토글
      var processBtn = e.target.closest('.daangn-process-toggle-btn');
      if (processBtn) {
        e.preventDefault();
        var item = processBtn.closest('.daangn-process-track-item');
        if (item) {
          var isOpen = item.classList.toggle('is-open');
          var textSpan = processBtn.querySelector('span');
          if (textSpan) {
            var currentText = textSpan.textContent.trim();
            if (isOpen && currentText === '더보기') {
              textSpan.textContent = '접기';
            } else if (!isOpen && currentText === '접기') {
              textSpan.textContent = '더보기';
            }
          }
        }
        return;
      }

      // 2. 자주 묻는 질문 (FAQ) 아코디언 토글
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
    document.addEventListener('DOMContentLoaded', initProcessAndFaqInteractions);
  } else {
    initProcessAndFaqInteractions();
  }
})();

