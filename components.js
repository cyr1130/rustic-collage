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
        </nav>
        <button class="nav__toggle" type="button" aria-label="메뉴 열기" aria-expanded="false" aria-controls="nav-drawer">
          <span class="nav__toggle-bar"></span>
          <span class="nav__toggle-bar"></span>
        </button>
      </div>
    </header>
    <div class="nav__backdrop" aria-hidden="true"></div>
    <aside class="nav__drawer" id="nav-drawer" aria-hidden="true">
      <button class="nav__drawer-close" type="button" aria-label="메뉴 닫기">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
      <nav class="nav__drawer-menu" aria-label="모바일 메뉴">
        <a href="./about.html">About</a>
        <a href="./collection.html">Collage Collection</a>
        <a href="./projects.html">Projects</a>
        <a href="./notice.html">Notice</a>
      </nav>
      <div class="nav__drawer-social">
        <a href="https://www.instagram.com/rustic_collage" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5"/>
            <circle cx="12" cy="12" r="4"/>
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
          </svg>
        </a>
        <a href="https://blog.naver.com/rustic_collage" target="_blank" rel="noopener noreferrer" aria-label="Naver Blog">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 924.43 1000" fill="currentColor" aria-hidden="true">
            <path d="M344.06,286.98c-70.27,0-135.39,22.03-188.86,59.55V70.18H0v858.3h155.2v-42.62c53.47,37.51,118.59,59.55,188.86,59.55,181.82,0,329.21-147.39,329.21-329.21s-147.4-329.22-329.21-329.22h0ZM329.28,801.62c-99.13,0-179.49-83.08-179.49-185.56s80.36-185.56,179.49-185.56,179.49,83.08,179.49,185.56-80.36,185.56-179.49,185.56h0ZM862.35,0h62.08v1000h-62.08V0Z"/>
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
          <div class="footer__socials">
            <a class="footer__social" href="https://www.instagram.com/rustic_collage" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a class="footer__social" href="https://blog.naver.com/rustic_collage" target="_blank" rel="noopener noreferrer" aria-label="Naver Blog">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 924.43 1000" fill="currentColor" aria-hidden="true">
                <path d="M344.06,286.98c-70.27,0-135.39,22.03-188.86,59.55V70.18H0v858.3h155.2v-42.62c53.47,37.51,118.59,59.55,188.86,59.55,181.82,0,329.21-147.39,329.21-329.21s-147.4-329.22-329.21-329.22h0ZM329.28,801.62c-99.13,0-179.49-83.08-179.49-185.56s80.36-185.56,179.49-185.56,179.49,83.08,179.49,185.56-80.36,185.56-179.49,185.56h0ZM862.35,0h62.08v1000h-62.08V0Z"/>
              </svg>
            </a>
          </div>
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
