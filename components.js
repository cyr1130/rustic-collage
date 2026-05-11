/* ============================================================
   Rustic Collage — 공통 Web Components
   <rc-nav></rc-nav>, <rc-footer></rc-footer>
   여기 한 곳만 수정하면 6개 페이지(index/about/collection/projects/contact/project-detail) 동시 반영.
   ============================================================ */

(function () {
  'use strict';

  if (!('customElements' in window)) return;

  // ---------- NAV (header + backdrop + drawer) ----------
  const NAV_HTML = `
    <header class="nav" id="nav">
      <div class="nav__inner">
        <a class="nav__brand" href="index.html">Rustic Collage</a>
        <nav class="nav__menu" aria-label="Primary">
          <a href="./about.html">About</a>
          <a href="./collection.html">Collage Collection</a>
          <a href="./projects.html">Projects</a>
          <a href="./notice.html">Notice</a>
          <a href="./contact.html">Contact</a>
        </nav>
        <button class="nav__toggle" type="button" aria-label="메뉴 열기" aria-expanded="false" aria-controls="nav-drawer">
          <span class="nav__toggle-bar"></span>
          <span class="nav__toggle-bar"></span>
        </button>
      </div>
    </header>
    <div class="nav__backdrop" aria-hidden="true"></div>
    <aside class="nav__drawer" id="nav-drawer" aria-hidden="true">
      <nav class="nav__drawer-menu" aria-label="모바일 메뉴">
        <a href="./about.html">About</a>
        <a href="./collection.html">Collage Collection</a>
        <a href="./projects.html">Projects</a>
        <a href="./notice.html">Notice</a>
        <a href="./contact.html">Contact</a>
      </nav>
      <div class="nav__drawer-social">
        <a href="https://www.instagram.com/rustic_collage" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5"/>
            <circle cx="12" cy="12" r="4"/>
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
          </svg>
        </a>
      </div>
    </aside>
  `;

  // ---------- FOOTER ----------
  const FOOTER_HTML = `
    <footer class="footer">
      <div class="container footer__inner">
        <div class="footer__brand">
          <h2 class="footer__title">Rustic Collage</h2>
          <div class="footer__contacts">
            <a id="footer-email" href="mailto:dbfldbfl11301130@gmail.com">dbfldbfl11301130@gmail.com</a>
            <a id="footer-phone" href="tel:01023940980">01023940980</a>
          </div>
          <a class="footer__address" href="https://map.naver.com/p/search/대구%20서구%20달서천로%20234" target="_blank" rel="noopener noreferrer">대구 서구 달서천로 234, 4층</a>
        </div>
        <div class="footer__bottom">
          <p class="footer__copyright">Copyright © 2026 Rustic Collage. All rights reserved.</p>
          <a class="footer__social" href="https://www.instagram.com/rustic_collage" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  `;

  // ---------- 커스텀 엘리먼트 정의 ----------
  // light DOM(this.innerHTML) 사용 — 기존 CSS/JS 셀렉터가 그대로 동작.
  class RCNav extends HTMLElement {
    connectedCallback() {
      if (this._rcMounted) return;
      this._rcMounted = true;
      this.innerHTML = NAV_HTML;
    }
  }
  class RCFooter extends HTMLElement {
    connectedCallback() {
      if (this._rcMounted) return;
      this._rcMounted = true;
      this.innerHTML = FOOTER_HTML;
    }
  }

  if (!customElements.get('rc-nav')) customElements.define('rc-nav', RCNav);
  if (!customElements.get('rc-footer')) customElements.define('rc-footer', RCFooter);
})();
