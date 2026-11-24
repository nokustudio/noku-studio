// Moved out of about.html so the site's CSP can forbid inline scripts.
// Timeline vertical scroll active line animation
const timelineWrap = document.querySelector('.story-timeline-wrap');
const scrollIndicator = document.getElementById('timeline-scroll-indicator');
const progressDot = scrollIndicator ? scrollIndicator.querySelector('.timeline-progress-dot') : null;

function updateTimelineProgress() {
  if (!timelineWrap || !scrollIndicator) return;
  const rect = timelineWrap.getBoundingClientRect();
  const containerHeight = rect.height;
  const viewportHeight = window.innerHeight;
  
  // Compute relative top/bottom passed mid-viewport
  const startPos = rect.top - viewportHeight * 0.45;
  const totalScrollable = containerHeight - viewportHeight * 0.45;
  
  let progress = 0;
  if (startPos < 0) {
    progress = Math.min(100, Math.max(0, (-startPos / totalScrollable) * 100));
  }
  scrollIndicator.style.height = `${progress}%`;
  
  // Update opacity of target dot
  if (progressDot) {
    progressDot.style.opacity = progress > 0.5 ? '1' : '0';
  }
}

window.addEventListener('scroll', updateTimelineProgress, { passive: true });
window.addEventListener('resize', updateTimelineProgress, { passive: true });
updateTimelineProgress(); // Initial run
