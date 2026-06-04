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

    // Auto-stagger: grid/list siblings tend to cross the threshold on the same
    // frame, which makes a uniform fade look flat. Give each .reveal-el a small
    // delay based on its position among its direct-child .reveal-el siblings so
    // groups cascade in. Skipped when the author already set a delay-N class or
    // an inline transition-delay, and capped so long lists don't drag.
    var STAGGER_STEP = 0.06; // seconds between siblings
    var STAGGER_CAP = 6;     // max steps (~0.36s) before delay plateaus
    els.forEach(function (el) {
      var hasManualDelay = /\bdelay-\d\b/.test(el.className) ||
        (el.style && el.style.transitionDelay);
      if (!hasManualDelay && el.parentElement) {
        var sibs = el.parentElement.querySelectorAll(':scope > .reveal-el');
        if (sibs.length > 1) {
          var idx = Array.prototype.indexOf.call(sibs, el);
          if (idx > 0) {
            el.style.transitionDelay = (Math.min(idx, STAGGER_CAP) * STAGGER_STEP) + 's';
          }
        }
      }
      observer.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal);
  } else {
    initReveal();
  }
})();
