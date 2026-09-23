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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroScroll);
  } else {
    initHeroScroll();
  }
})();

// ── 2. Questions Carousel Controller (로컬의 질문들 3개 노출 슬라이딩) ────
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

// ── 3. Sticky scroll culture interactive updater (오늘의집 레퍼런스 스타일) ────
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
          item.onclick = function() { window.scrollToStickyCard(idx); };
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
