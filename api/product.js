// Serves /product?handle=… (see the rewrite in vercel.json). It sends the normal
// product.html, but with that product's title, description, canonical and Product
// structured data already in the <head>, so Google gets them even when its renderer
// can't reach Shopify from the browser. The page's own JS still builds everything else.
const fs = require('fs');
const path = require('path');

const SITE = 'https://www.nokustudio.in';
const SHOP = 'https://6b5390-f8.myshopify.com/api/2024-04/graphql.json';
const TOKEN = '7b62ad5d7d665bebe383ff2d3c36c0b0'; // public Storefront token, same one the site uses

const TEMPLATE = fs.readFileSync(path.join(process.cwd(), 'product.html'), 'utf8');

const QUERY = `query ($handle: String!) { product(handle: $handle) {
  handle title description
  images(first: 5) { edges { node { url } } }
  variants(first: 100) { edges { node { price { amount } } } }
} }`;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function shorten(text) {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  return t.length > 155 ? t.slice(0, 152).replace(/\s+\S*$/, '') + '…' : t;
}

function render(p) {
  const url = `${SITE}/product?handle=${encodeURIComponent(p.handle)}`;
  const desc = shorten(p.description);
  const prices = p.variants.edges.map(e => parseFloat(e.node.price.amount)).filter(n => n > 0);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    description: (p.description || '').replace(/\s+/g, ' ').trim() || undefined,
    image: p.images.edges.map(e => e.node.url),
    url,
    brand: { '@type': 'Brand', name: 'Noku Studio' },
    offers: prices.length ? {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: prices.length,
      seller: { '@id': `${SITE}/#business` },
    } : undefined,
  };

  let html = TEMPLATE.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(p.title)} — Handcrafted Furniture | Noku Studio</title>`);
  if (desc) html = html.replace(/<meta\s+name="description"[\s\S]*?>/, `<meta name="description" content="${esc(desc)}">`);
  // "<" escaped so a description can never close the script tag
  const head = `  <link rel="canonical" href="${esc(url)}">\n`
    + `  <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>\n`;
  return html.replace('</head>', head + '</head>');
}

module.exports = async function handler(req, res) {
  const handle = String(req.query.handle || '');
  let status = 200;
  let html = TEMPLATE;

  if (handle) {
    try {
      const r = await fetch(SHOP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': TOKEN },
        body: JSON.stringify({ query: QUERY, variables: { handle } }),
      });
      const product = (await r.json()).data?.product;
      if (product) html = render(product);
      else status = 404; // no such piece: page still shows its stand-in, but Google won't index it
    } catch (err) {
      // Shopify unreachable: send the plain page and let the browser JS handle it as before
      console.error('Product SSR: Shopify fetch failed', err);
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(status).send(html);
};
