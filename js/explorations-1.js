// Moved out of explorations.html so the site's CSP can forbid inline scripts.
// Dynamic rendering of Of Exploration products from Shopify/fallback
document.addEventListener('DOMContentLoaded', () => {
  renderCollectionProducts('of-exploration', 'exploration-products-grid');
});
