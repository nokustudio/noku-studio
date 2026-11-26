// Serves /products (middleware.js sends it here). It sends the normal products.html with
// the catalogue grid already drawn, so Google sees a real link to every piece, and with the
// catalogue data embedded so products.js doesn't fetch it again. products.js then takes
// over the grid (filters, sort, cart) exactly as before.
const fs = require('fs');
const path = require('path');
const { QUERY, isListed } = require('../products-query.js');

const SHOP = 'https://6b5390-f8.myshopify.com/api/2024-04/graphql.json';
const TOKEN = '7b62ad5d7d665bebe383ff2d3c36c0b0'; // public Storefront token, same one the site uses
const FALLBACK_IMAGE = 'https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c99b2583745be71136547_Noku_ofStillness_Sofa_grooved_02.jpeg';

const TEMPLATE = fs.readFileSync(path.join(process.cwd(), 'products.html'), 'utf8');

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));
const inr = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);
const ARROW = '<svg class="ico-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="8 7 17 7 17 16"></polyline></svg>';

// Same 4:5 Shopify CDN crop as products.js's sizedCardImage at 2x, so on most screens the
// browser's re-render asks for the very same image URL.
function cardImage(url) {
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return '';
    if (u.hostname.includes('cdn.shopify.com') || u.hostname.includes('cdn.shopifycdn')) {
      u.searchParams.set('width', '960');
      u.searchParams.set('height', '1200');
      u.searchParams.set('crop', 'center');
    }
    return u.href;
  } catch (e) { return ''; }
}

// Mirrors the card renderProductsGrid() in products.js builds; keep the two in step.
function card(p) {
  const edges = p.variants?.edges || [];
  const v = p.featuredVariant?.reference || (edges.find(e => e.node.image && e.node.image.url) || edges[0])?.node;
  const price = v ? parseFloat(v.price.amount) : 24500;
  const material = v ? v.title : 'Solid Wood Finish';
  const img = cardImage((v && v.image && v.image.url) || p.featuredImage?.url || FALLBACK_IMAGE);
  const href = `product?handle=${encodeURIComponent(p.handle)}`;
  const button = p.purchaseMode?.value === 'true'
    ? `<button class="gcard__add" data-id="${esc(p.id)}" data-variant-id="${esc(v ? v.id : '')}" data-title="${esc(p.title)}" data-price="${price}" data-image="${esc(img)}" data-materials="${esc(material)}" aria-label="Add ${esc(p.title)} to Cart">Add ${ARROW}</button>`
    : `<button class="gcard__add gcard__inquire" data-handle="${esc(p.handle)}" aria-label="Inquire about ${esc(p.title)}">Inquire ${ARROW}</button>`;
  return `<a href="${esc(href)}" class="gcard">
      <div class="gcard__media">
        <div class="gcard__media-inner">
          <img src="${esc(img)}" alt="${esc(p.title)}" loading="lazy">
        </div>
        ${button}
      </div>
      <p class="gcard__cat">${esc(material)}</p>
      <h3 class="gcard__name">${esc(p.title)}</h3>
      <p class="gcard__price">${inr(price)}</p>
    </a>`;
}

function render(products) {
  const listed = (products.edges || []).map(e => e.node).filter(isListed);
  if (!listed.length) return TEMPLATE;
  // "<" escaped so Shopify text can never close the script tag. type application/json is a
  // data block, never executed, so the CSP needs no 'unsafe-inline' for it.
  const json = JSON.stringify(products).replace(/</g, '\\u003c');
  return TEMPLATE
    .replace('Loading products...', `${listed.length} Piece${listed.length === 1 ? '' : 's'} found`)
    // The grid's own closing </div> is the first one followed directly by </section>.
    .replace(/(<div id="products-catalog-grid"[^>]*>)[\s\S]*?(<\/div>\s*<\/section>)/,
      (m, open, close) => `${open}\n${listed.map(card).join('\n')}\n${close}`)
    .replace('</head>', `  <script type="application/json" id="noku-products-data">${json}</script>\n</head>`);
}

module.exports = async function handler(req, res) {
  let html = TEMPLATE;
  try {
    const r = await fetch(SHOP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': TOKEN },
      body: JSON.stringify({ query: QUERY }),
    });
    const products = (await r.json()).data?.products;
    if (products) html = render(products);
  } catch (err) {
    // Shopify unreachable: send the plain page and let the browser JS load products as before
    console.error('Products SSR: Shopify fetch failed', err);
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // ponytail: 5 min edge cache; a Shopify change shows on /products within ~5 min.
  // Shorten s-maxage if that's too slow, or add a Shopify webhook that purges it.
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
  res.status(200).send(html);
};
