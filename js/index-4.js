// Moved out of index.html so the site's CSP can forbid inline scripts.
// ════════ DRAFT: Our Pieces — every product except the four in the hero, live from Shopify ════════
(function () {
  const HERO = ['lounge-chair', 'sofa-2', 'round-dining-chair', 'barstool'];
  const section = document.getElementById('our-pieces'), grid = section.querySelector('.op-grid');
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const query = `{ products(first: 50) { edges { node { handle title productType featuredImage { url }
    priceRange { minVariantPrice { amount } }
    featuredVariant: metafield(namespace: "custom", key: "featured_variant") { reference { ... on ProductVariant { title image { url } } } }
    variants(first: 50) { edges { node { title image { url } } } } } } } }`;
  // the card the products page draws: products.js renderProductsGrid() picks the variant the same way
  const cardVariant = p => p.featuredVariant?.reference || (p.variants.edges.find(e => e.node.image?.url) || p.variants.edges[0])?.node;

  fetchFromShopify(query).then(data => {
    const all = (data?.data?.products?.edges || []).map(e => e.node);
    // one piece per category, categories the hero doesn't already show first; one row of four
    const type = p => (p.productType || p.handle).toLowerCase().trim();
    const heroTypes = all.filter(p => HERO.includes(p.handle)).map(type), seen = new Set();
    const items = all
      .filter(p => !HERO.includes(p.handle) && p.featuredImage && +p.priceRange.minVariantPrice.amount > 0)   // skips unpriced placeholders
      .filter(p => !seen.has(type(p)) && seen.add(type(p)))
      .sort((a, b) => heroTypes.includes(type(a)) - heroTypes.includes(type(b)))
      .slice(0, 4);
    if (!items.length) { grid.hidden = true; return; }       // offline: the See all button still leads on
    grid.innerHTML = items.map((p, i) => `
      <a class="product-card" href="product.html?handle=${encodeURIComponent(p.handle)}" style="--i:${i % 4}">
        <div class="product-card-img-wrap"><img src="${safeUrl(sizeShopifyImage(cardVariant(p)?.image?.url || p.featuredImage.url, 800, 1000))}" alt="${escHtml(p.title)}" loading="lazy" decoding="async" width="800" height="1000"></div>
        <div class="product-card-body">
          <div class="product-card-header-row"><h3 class="product-name">${escHtml(p.title)}</h3><span class="product-price">From ${inr(p.priceRange.minVariantPrice.amount)}</span></div>
          <div class="product-card-footer-row"><span class="product-materials">${escHtml(cardVariant(p)?.title || '')}</span></div>
        </div>
      </a>`).join('');
    // cards rise in as each row scrolls into view
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    grid.querySelectorAll('.product-card').forEach(c => io.observe(c));
  });
})();
