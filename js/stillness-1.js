// Moved out of stillness.html so the site's CSP can forbid inline scripts.
// Dynamic rendering of Of Stillness products from Shopify/fallback
document.addEventListener('DOMContentLoaded', () => {
  renderCollectionProducts('of-stillness', 'stillness-products-grid');
});
