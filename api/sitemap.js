// Serves /sitemap.xml (see the rewrite in vercel.json). Products are read live from
// Shopify so new pieces appear without a redeploy; the page list below is static.
const SITE = 'https://www.nokustudio.in';
const SHOP = 'https://6b5390-f8.myshopify.com/api/2024-04/graphql.json';
const TOKEN = '7b62ad5d7d665bebe383ff2d3c36c0b0'; // public Storefront token, same one the site uses

// ponytail: hand-kept list, add new pages here
const PAGES = [
  '', 'products', 'projects', 'materials', 'stillness', 'explorations', 'memories',
  'about', 'sustainability', 'contact', 'shipping', 'returns', 'privacy', 'terms',
  'projects/banyan-house', 'projects/deodar-house', 'projects/mango-house',
  'projects/oak-house', 'projects/parijata-house', 'projects/temple-tree-house',
];

const QUERY = `{ products(first: 250) { edges { node {
  handle title updatedAt featuredImage { url }
  variants(first: 50) { edges { node { price { amount } } } }
} } } }`;

async function productUrls() {
  const res = await fetch(SHOP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': TOKEN },
    body: JSON.stringify({ query: QUERY }),
  });
  const json = await res.json();
  return json.data.products.edges
    .map(e => e.node)
    // Same draft/test filter as the products page
    .filter(p => p.featuredImage?.url
      && p.variants.edges.some(v => parseFloat(v.node.price.amount) > 0)
      && !/draft|test/i.test(p.title))
    .map(p => ({ loc: `${SITE}/product?handle=${encodeURIComponent(p.handle)}`, lastmod: p.updatedAt.slice(0, 10) }));
}

const esc = s => s.replace(/&/g, '&amp;');

module.exports = async function handler(req, res) {
  let products = [];
  try {
    products = await productUrls();
  } catch (err) {
    console.error('Sitemap: Shopify fetch failed, serving pages only', err);
  }
  const urls = [...PAGES.map(p => ({ loc: `${SITE}/${p}` })), ...products];
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urls.map(u => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')
    + '\n</urlset>\n';

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');
  res.status(200).send(xml);
};
