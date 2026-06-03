/**
 * site.js — Shared site chrome for every Noku Studio page.
 *
 * Consolidates the two behaviours that were previously copy-pasted into every
 * page's inline <script> (and into script.js on the homepage):
 *   1. Navbar "scrolled" state toggle.
 *   2. Reveal-on-scroll for `.reveal-el` (single, unified trigger config).
 *
 * Page-specific logic (3D hero, timelines, collection grids, etc.) stays inline
 * or in its own file. Mobile-menu and cart wiring live in shopify-integration.js.
 */
(function () {
  'use strict';

  // ─── 1. Navbar scrolled state ───
  var navbar = document.getElementById('navbar');
  if (navbar) {
    var lastScrolled = null;
    var syncNav = function () {
      var scrolled = window.scrollY > 40;
      if (scrolled !== lastScrolled) {
        lastScrolled = scrolled;
        navbar.classList.toggle('scrolled', scrolled);
      }
    };
    syncNav();
    window.addEventListener('scroll', syncNav, { passive: true });
  }

  // ─── 2. Reveal-on-scroll (.reveal-el → .is-revealed) ───
  function initReveal() {
    var els = document.querySelectorAll('.reveal-el');
    if (!els.length) return;

    // No-IO fallback: just show everything.
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    els.forEach(function (el) { observer.observe(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal);
  } else {
    initReveal();
  }
})();
