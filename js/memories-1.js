// Moved out of memories.html so the site's CSP can forbid inline scripts.
// Dynamic rendering of Of Memories products from Shopify/fallback
document.addEventListener('DOMContentLoaded', () => {
  renderCollectionProducts('of-memories', 'memories-products-grid');
});
