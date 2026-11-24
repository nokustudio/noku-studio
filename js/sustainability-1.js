// Moved out of sustainability.html so the site's CSP can forbid inline scripts.
document.addEventListener('DOMContentLoaded', () => {
  // Handle smooth scrolling for jump links
  const jumpLinks = document.querySelectorAll('.sus-overview-links a');
  jumpLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      if (targetSection) {
        const navbarHeight = document.getElementById('navbar').offsetHeight || 70;
        const targetPos = targetSection.getBoundingClientRect().top + window.scrollY - navbarHeight - 20;
        window.scrollTo({
          top: targetPos,
          behavior: 'smooth'
        });
      }
    });
  });
});
