// Moved out of projects.html so the site's CSP can forbid inline scripts.
// ════════ HORIZONTAL SCROLL ENGINE ════════
(function() {
  const wrapper = document.getElementById('project_wrapper');
  const heightContainer = document.getElementById('project_height');
  const track = document.getElementById('track_flex');
  const panels = document.querySelectorAll('.panel');
  const progressEl = document.getElementById('scroll-progress');
  const hintEl = document.getElementById('scroll-hint');
  const dots = document.querySelectorAll('.progress-dot');
  const counter = document.getElementById('progress-counter');
  const panelCount = panels.length;
  const GAP = 0; // Separation gap between projects in pixels

  if (panelCount === 0) return;

  let ticking = false;
  let initialized = false;

  function initScroll() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      if (initialized) {
        track.style.transform = '';
        heightContainer.style.height = '';
        progressEl.classList.remove('visible');
        hintEl.classList.remove('visible');
        initialized = false;
      }
      return;
    }

    // Desktop initialization
    heightContainer.style.height = (panelCount * 100) + 'vh';
    initialized = true;
    updateScroll();
  }

  function updateScroll() {
    if (!initialized) return;

    const wrapperRect = heightContainer.getBoundingClientRect();
    const scrollableDistance = heightContainer.offsetHeight - window.innerHeight;
    
    // How far we've scrolled into the wrapper (0 to 1)
    const scrollProgress = Math.max(0, Math.min(1, -wrapperRect.top / scrollableDistance));
    
    // Translate the track including the gap between projects
    const maxTranslate = (panelCount - 1) * (window.innerWidth + GAP);
    const translateX = scrollProgress * maxTranslate;
    track.style.transform = `translateX(-${translateX}px)`;

    // Determine active panel
    const activeIndex = Math.min(
      panelCount - 1,
      Math.floor(scrollProgress * panelCount)
    );

    // Update dots
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === activeIndex);
    });

    // Update counter
    counter.textContent = String(activeIndex + 1).padStart(2, '0') + ' / ' + String(panelCount).padStart(2, '0');

    // Hide scroll hint after first panel; also hide when outside wrapper
    if (scrollProgress > 0.1 || wrapperRect.top > window.innerHeight || wrapperRect.bottom < 0) {
      hintEl.classList.remove('visible');
    } else {
      hintEl.classList.add('visible');
    }

    // Show/hide progress based on scroll wrapper visibility
    if (wrapperRect.top > window.innerHeight || wrapperRect.bottom < 0) {
      progressEl.classList.remove('visible');
    } else {
      progressEl.classList.add('visible');
    }

    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!initialized) return;
    if (!ticking) {
      requestAnimationFrame(updateScroll);
      ticking = true;
    }
  }, { passive: true });

  // Initial call
  initScroll();

  // Recalculate on resize
  window.addEventListener('resize', function() {
    initScroll();
  });
})();

// ════════ PAGE TRANSITIONS ENGINE ════════
document.addEventListener('DOMContentLoaded', () => {
  const projectLinks = document.querySelectorAll('.project_link');
  projectLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      if (e.metaKey || e.ctrlKey || e.button === 1) return;

      e.preventDefault();
      const targetUrl = this.getAttribute('href');
      const card = this.querySelector('.project_card');
      const img = this.querySelector('.g_visual_img');
      if (!card || !img) {
        window.location.href = targetUrl;
        return;
      }

      // Reduced motion: skip the zoom entirely, just go.
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.location.href = targetUrl;
        return;
      }

      const rect = card.getBoundingClientRect();

      // Zoom overlay animation
      const overlay = document.createElement('div');
      overlay.className = 'page-transition-overlay';

      const transCard = document.createElement('div');
      transCard.className = 'transition-card';
      transCard.style.top = rect.top + 'px';
      transCard.style.left = rect.left + 'px';
      transCard.style.width = rect.width + 'px';
      transCard.style.height = rect.height + 'px';

      // Uniform "cover" scale from the card's rect to the viewport, plus the
      // translation that centres the scaled card. Transform-only, so the
      // browser composites it instead of relaying out the page each frame.
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.max(vw / rect.width, vh / rect.height);
      transCard.style.setProperty('--tc-scale', scale);
      transCard.style.setProperty('--tc-dx', ((vw - rect.width * scale) / 2 - rect.left) + 'px');
      transCard.style.setProperty('--tc-dy', ((vh - rect.height * scale) / 2 - rect.top) + 'px');

      const transImg = document.createElement('img');
      transImg.className = 'transition-img';
      transImg.src = img.src;

      transCard.appendChild(transImg);
      overlay.appendChild(transCard);
      document.body.appendChild(overlay);

      // Force reflow to trigger CSS transition
      overlay.offsetHeight;

      overlay.classList.add('active');
      transCard.classList.add('is-zooming');

      // Navigate when the zoom actually finishes rather than on a fixed
      // timer, with a timeout guard in case transitionend never fires.
      let navigated = false;
      const go = () => {
        if (navigated) return;
        navigated = true;
        window.location.href = targetUrl;
      };
      transCard.addEventListener('transitionend', (ev) => {
        if (ev.propertyName === 'transform') go();
      });
      setTimeout(go, 600);
    });
  });

  // BFCache restore: clean up transitions
  window.addEventListener('pageshow', () => {
    document.querySelectorAll('.page-transition-overlay').forEach(el => el.remove());
  });
});
