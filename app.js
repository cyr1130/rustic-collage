/* ============================================================
   Rustic Collage — 페이지 동작
   ============================================================ */

(function () {
  'use strict';

  // ---------- Liquid Glass — SVG 굴절 필터 주입 ----------
  // backdrop-filter: url(#rc-liquid-glass) 로 nav가 참조함
  (function injectLiquidGlassFilter() {
    if (document.getElementById('rc-liquid-glass-svg')) return;
    var SVG_NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('id', 'rc-liquid-glass-svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    svg.innerHTML =
      '<filter id="rc-liquid-glass" x="0%" y="0%" width="100%" height="100%">' +
        // 1) 더 큰 패턴의 굴절 노이즈 (자글자글함 ↓)
        '<feTurbulence type="fractalNoise" baseFrequency="0.006 0.006" numOctaves="1" seed="92" result="turb"/>' +
        // 2) 노이즈를 더 강하게 부드럽게 — 미세한 노이즈 흔적 제거
        '<feGaussianBlur in="turb" stdDeviation="4" result="softTurb"/>' +
        // 3) 굴절 강도도 살짝 줄여 자연스럽게
        '<feDisplacementMap in="SourceGraphic" in2="softTurb" scale="30" xChannelSelector="R" yChannelSelector="G" result="displaced"/>' +
        // 4) 굴절된 결과에 frosted glass 블러
        '<feGaussianBlur in="displaced" stdDeviation="6" result="frosted"/>' +
        // 5) 채도 부스트 (saturate ~ 130%)
        '<feColorMatrix in="frosted" type="matrix" values="' +
          '1.3 0 0 0 0 ' +
          '0 1.3 0 0 0 ' +
          '0 0 1.3 0 0 ' +
          '0 0 0 1 0"/>' +
      '</filter>';
    (document.body || document.documentElement).appendChild(svg);
  })();

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

  // ---------- Adaptive Nav Tone — nav 뒤 배경의 밝기를 샘플링해서 글자색 자동 전환 ----------
  // 옵션 C(캔버스 픽셀 샘플링): 무거우면 이 블록만 제거하면 원래대로 돌아감.
  (function adaptiveNavTone() {
    if (!nav) return;
    var pending = false;
    var lastTone = null; // 'light' | 'dark'

    function schedule() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        update();
      });
    }

    function update() {
      var rect = nav.getBoundingClientRect();
      // nav 바닥에서 살짝 아래 지점을 샘플
      var sampleY = Math.max(0, Math.min(window.innerHeight - 1, rect.bottom + 4));
      var samples = 7;
      var lums = [];
      // 샘플 동안 nav가 elementsFromPoint에 안 잡히도록 잠깐 포인터 무시
      var prevPE = nav.style.pointerEvents;
      nav.style.pointerEvents = 'none';
      for (var i = 0; i < samples; i++) {
        var x = rect.left + (rect.width * (i + 0.5) / samples);
        var lum = sampleAt(x, sampleY);
        if (lum != null) lums.push(lum);
      }
      nav.style.pointerEvents = prevPE;

      var tone;
      if (lums.length) {
        var avg = lums.reduce(function (a, b) { return a + b; }, 0) / lums.length;
        tone = avg > 0.55 ? 'light' : 'dark';
      } else {
        // 샘플 실패(전부 cross-origin 등) — body 클래스로 폴백
        tone = document.body.classList.contains('subpage--light') ? 'light' : 'dark';
      }
      if (tone === lastTone) return;
      lastTone = tone;
      if (tone === 'light') {
        nav.classList.add('nav--on-light');
        nav.classList.remove('nav--on-dark');
      } else {
        nav.classList.add('nav--on-dark');
        nav.classList.remove('nav--on-light');
      }
    }

    function sampleAt(x, y) {
      var stack = (typeof document.elementsFromPoint === 'function')
        ? document.elementsFromPoint(x, y)
        : [document.elementFromPoint(x, y)];
      for (var i = 0; i < stack.length; i++) {
        var el = stack[i];
        if (!el || nav.contains(el)) continue;

        // 이미지 위라면 캔버스로 픽셀 샘플 시도
        if (el.tagName === 'IMG') {
          var lum = sampleImage(el, x, y);
          if (lum != null) return lum;
          // 실패(cross-origin 오염 등) → 부모 체인의 background-color로 진행
        }
        // 부모 체인 — 첫 불투명 background-color 사용
        var node = el;
        while (node && node !== document.documentElement) {
          var cs = getComputedStyle(node);
          var l = parseRgbLuminance(cs.backgroundColor);
          if (l != null) return l;
          node = node.parentElement;
        }
      }
      return null;
    }

    function sampleImage(img, x, y) {
      if (!img.complete || !img.naturalWidth) return null;
      try {
        var r = img.getBoundingClientRect();
        var px = (x - r.left) / r.width;
        var py = (y - r.top) / r.height;
        if (px < 0 || px > 1 || py < 0 || py > 1) return null;
        var sx = Math.max(0, Math.min(img.naturalWidth - 1, Math.floor(px * img.naturalWidth)));
        var sy = Math.max(0, Math.min(img.naturalHeight - 1, Math.floor(py * img.naturalHeight)));
        var c = document.createElement('canvas');
        c.width = 1; c.height = 1;
        var ctx = c.getContext('2d');
        ctx.drawImage(img, sx, sy, 1, 1, 0, 0, 1, 1);
        var p = ctx.getImageData(0, 0, 1, 1).data;
        if (p[3] === 0) return null;
        return relativeLuminance(p[0], p[1], p[2]);
      } catch (e) {
        return null; // tainted canvas (CORS)
      }
    }

    function parseRgbLuminance(str) {
      if (!str) return null;
      var m = str.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\s*\)/);
      if (!m) return null;
      var a = m[4] != null ? parseFloat(m[4]) : 1;
      if (a < 0.05) return null; // 사실상 투명
      return relativeLuminance(+m[1], +m[2], +m[3]);
    }

    function relativeLuminance(r, g, b) {
      function lin(c) {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      }
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    }

    document.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // 초기 + 이미지 로딩 후 한 번 더
    setTimeout(update, 80);
    window.addEventListener('load', function () { setTimeout(update, 120); });
  })();

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
