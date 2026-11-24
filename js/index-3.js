// Moved out of index.html so the site's CSP can forbid inline scripts.
// What this page used to take from script.js, which now belongs to the 3D barstool page only (/draftpage)
(function () {
  // Collections links jump straight there
  const collections = document.getElementById('collections');
  document.querySelectorAll('a[href*="#collections"]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    collections.scrollIntoView({ behavior: 'instant' });
    history.pushState(null, '', '#collections');
  }));
  // workshop film: loads when near, plays only while on screen
  const v = document.getElementById('workshop-video');
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return v.pause();
    const s = v.querySelector('source');
    if (s.dataset.src) { s.src = s.dataset.src; delete s.dataset.src; v.load(); }
    v.play().catch(() => {});
  }, { rootMargin: '200px' }).observe(v);
})();
