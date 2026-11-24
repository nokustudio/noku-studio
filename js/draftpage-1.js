// Moved out of draftpage.html so the site's CSP can forbid inline scripts.
// Gate the hero entrance on the loading screen finishing (script.js calls
// window.nokuHeroReady). Defined here, not in script.js, so a failed
// three.js CDN can't leave the hero copy stuck at opacity 0 — the timeout
// is a hard floor that reveals it regardless.
(function () {
  var reveal = function () { document.documentElement.classList.add('hero-ready'); };
  window.nokuHeroReady = reveal;
  setTimeout(reveal, 3000);
})();
