// Vercel routing middleware. Static files win over vercel.json rewrites, so the static
// product.html / products.html would always be served; this sends /product to
// api/product.js (fills in the product's <head>) and /products to api/products.js (draws
// the catalogue grid). x-middleware-rewrite is the header @vercel/functions' rewrite()
// sets; used directly to avoid adding a dependency. Local dev (python http.server)
// ignores this file.
export const config = { matcher: ['/product', '/products'] };

export default function middleware(request) {
  const url = new URL(request.url);
  url.pathname = url.pathname === '/products' ? '/api/products' : '/api/product';
  return new Response(null, { headers: { 'x-middleware-rewrite': url.toString() } });
}
