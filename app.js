/* ============================================================
   Rustic Collage — 페이지 동작
   ============================================================ */

(function () {
  'use strict';

  // ---------- Nav: 스크롤 시 블러/스타일 전환 ----------
  var nav = document.getElementById('nav');
  var lastY = -1;
  var threshold = 20;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset || 0;
    if (Math.abs(y - lastY) < 2) return;
    lastY = y;
    if (!nav) return;
    if (y > threshold) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  }

  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Mobile drawer: 햄버거 토글 ----------
  var toggle = document.querySelector('.nav__toggle');
  var drawer = document.getElementById('nav-drawer');
  var backdrop = document.querySelector('.nav__backdrop');
  var body = document.body;

  function openMenu() {
    body.classList.add('menu-open');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', '메뉴 닫기');
    }
    if (drawer) drawer.setAttribute('aria-hidden', 'false');
  }
  function closeMenu() {
    body.classList.remove('menu-open');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', '메뉴 열기');
    }
    if (drawer) drawer.setAttribute('aria-hidden', 'true');
  }
  function toggleMenu() {
    if (body.classList.contains('menu-open')) closeMenu();
    else openMenu();
  }

  if (toggle) toggle.addEventListener('click', toggleMenu);

  // 드로어 안의 링크 클릭 시 닫기 (앵커 이동 시 자연스럽게)
  if (drawer) {
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
  }

  // 백드롭 클릭 시 닫기
  if (backdrop) backdrop.addEventListener('click', closeMenu);

  // ESC 키로 닫기
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && body.classList.contains('menu-open')) closeMenu();
  });

  // 데스크톱 폭으로 리사이즈되면 드로어 자동 닫기
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 768 && body.classList.contains('menu-open')) {
      closeMenu();
    }
  });

  // ---------- 타이틀 글자 스태거 (스크롤 진입 시 1회) ----------
  function splitTitleIntoLetters(el) {
    if (!el || el.dataset.split === '1') return;
    var text = el.textContent;
    el.textContent = '';
    text.split('').forEach(function (c, i) {
      if (c === ' ') {
        el.appendChild(document.createTextNode(' '));
      } else {
        var s = document.createElement('span');
        s.className = 'ltr';
        s.textContent = c;
        s.style.transitionDelay = (i * 35) + 'ms';
        el.appendChild(s);
      }
    });
    el.dataset.split = '1';
  }

  var titles = document.querySelectorAll('.collection__title, .projects__title');
  titles.forEach(splitTitleIntoLetters);

  if ('IntersectionObserver' in window && titles.length) {
    var titleIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          titleIO.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.3,
      rootMargin: '0px 0px -40px 0px',
    });
    titles.forEach(function (el) { titleIO.observe(el); });
  } else {
    titles.forEach(function (el) { el.classList.add('is-revealed'); });
  }

  // ---------- Contact 섹션: 스크롤 진입/이탈 시 양방향 애니메이션 ----------
  var contactSection = document.querySelector('.contact');
  if (contactSection) {
    if ('IntersectionObserver' in window) {
      var contactIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          } else {
            entry.target.classList.remove('is-revealed');
          }
        });
      }, {
        threshold: 0.2,
        rootMargin: '0px 0px -60px 0px',
      });
      contactIO.observe(contactSection);
    } else {
      contactSection.classList.add('is-revealed');
    }
  }

  // ---------- Contact 폼 — Formsubmit 비동기 전송 + 피드백 ----------
  var contactForm = document.querySelector('.contact__form');
  if (contactForm) {
    var feedbackEl = contactForm.querySelector('.contact__feedback');
    var submitEl = contactForm.querySelector('.contact__submit');
    var defaultLabel = submitEl ? submitEl.textContent : 'SUBMIT';

    function showFeedback(type, text) {
      if (!feedbackEl) return;
      feedbackEl.textContent = text;
      feedbackEl.className = 'contact__feedback contact__feedback--' + type;
      feedbackEl.hidden = false;
    }
    function clearFeedback() {
      if (!feedbackEl) return;
      feedbackEl.hidden = true;
      feedbackEl.className = 'contact__feedback';
    }

    contactForm.addEventListener('submit', function (e) {
      // 클라이언트 기본 검증 (required) 확인
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }
      e.preventDefault();
      clearFeedback();
      if (submitEl) {
        submitEl.disabled = true;
        submitEl.textContent = 'SENDING…';
      }

      fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { Accept: 'application/json' },
      })
        .then(function (res) {
          if (!res.ok) throw new Error('http_' + res.status);
          return res.json().catch(function () { return {}; });
        })
        .then(function () {
          contactForm.reset();
          // 성공 — 별도 피드백 메시지 없이 버튼 텍스트만 변경
          if (submitEl) {
            submitEl.disabled = true;
            submitEl.textContent = 'COMPLETED';
          }
        })
        .catch(function () {
          showFeedback('error', '전송에 실패했습니다. 잠시 후 다시 시도해주시거나, 직접 이메일로 연락 부탁드립니다.');
          // 에러 시에만 버튼 원상복구해서 재시도 가능
          if (submitEl) {
            submitEl.disabled = false;
            submitEl.textContent = defaultLabel;
          }
        });
    });
  }

  // ---------- Brand → 홈으로 ----------
  // 서브페이지: ./ 로 자연 네비게이션 (HTML href가 처리)
  // 홈에서 클릭 시: 새로고침 대신 부드러운 스크롤 업
  var brand = document.querySelector('.nav__brand');
  if (brand) {
    brand.addEventListener('click', function (e) {
      var path = window.location.pathname;
      var isHome =
        path === '/' ||
        path === '' ||
        path.endsWith('/index.html') ||
        path.endsWith('/');
      if (isHome) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (body.classList.contains('menu-open')) closeMenu();
      }
    });
  }

  // ---------- 풋터 이메일 — site-config.json 에서 동적 갱신 (모든 페이지 공통) ----------
  // index.html은 별도 스크립트로 hero/contact 영역까지 갱신하므로 그쪽이 우선,
  // 하위 페이지(about/collection/projects/project-detail/contact)는 풋터만 가지고 있어 여기서 갱신.
  (function syncFooterEmail() {
    var footerEmail = document.getElementById('footer-email');
    if (!footerEmail) return;
    // 정적/하위 페이지 위치 기준으로 site-config 경로 결정
    fetch('./site-config.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (cfg) {
        if (!cfg || !cfg.email) return;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cfg.email)) return;
        footerEmail.href = 'mailto:' + cfg.email;
        footerEmail.textContent = cfg.email;
      })
      .catch(function () { /* 무시 */ });
  })();
})();
