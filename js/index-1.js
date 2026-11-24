// Moved out of index.html so the site's CSP can forbid inline scripts.
// Closing: scroll drives the film opening and the footer sheet. The film itself just loops.
(function () {
  const sec = document.querySelector('.cl'), run = sec.querySelector('.cl-run'), ft = document.getElementById('footer');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp01 = n => Math.min(Math.max(n, 0), 1);
  const ease = q => (1 - Math.cos(Math.PI * q)) / 2;   // starts and settles gently, at most ~.65px of travel per px scrolled on desktop
  let h = 0, y = 0, frame = 0, last = 0;

  const paint = () => {
    const q = ease(clamp01((y - h * .61) / (h * .39)));   // 0–48% opens the film, 48–61% holds it full screen, 61–100% raises the sheet
    sec.style.setProperty('--p', clamp01(y / (h * .48)).toFixed(4));
    sec.style.setProperty('--q', q.toFixed(4));
    sec.style.setProperty('--rise', ((1 - q) * 100).toFixed(2) + '%');
  };
  // eases toward the scroll position, so a wheel's stepped jumps reach the page as one smooth move
  const tick = t => {
    const to = -sec.getBoundingClientRect().top, k = 1 - Math.exp(-Math.max(t - last, 0) / 120);
    last = t;
    y += (to - y) * k;
    if (Math.abs(to - y) < .5) { y = to; frame = 0; } else frame = requestAnimationFrame(tick);
    paint();
  };
  const onScroll = () => { if (h && !frame) { last = performance.now(); frame = requestAnimationFrame(tick); } };
  const measure = () => {
    // a sheet taller than the screen (or reduced motion) stays in normal flow: sticky would hide its top for good
    sec.classList.toggle('cl-on', !reduce && ft.offsetHeight < innerHeight);
    sec.style.setProperty('--ft-h', ft.offsetHeight + 'px');
    h = sec.classList.contains('cl-on') ? run.offsetHeight : 0;
    ['--p', '--q', '--rise'].forEach(v => sec.style.removeProperty(v));
    if (h) { y = -sec.getBoundingClientRect().top; paint(); }
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', measure);
  // keyboard users: tabbing into the footer brings it up (after the browser's own scroll to the focused link, which would otherwise undo this)
  ft.addEventListener('focusin', () => setTimeout(() => { if (h) scrollTo({ top: scrollY + sec.getBoundingClientRect().bottom - innerHeight, behavior: 'instant' }); }, 50));
  measure();
})();
