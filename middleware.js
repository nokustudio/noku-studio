// Vercel routing middleware. Static files win over vercel.json rewrites, so the static
// product.html would always be served for /product; this sends /product to
// api/product.js instead (it fills in the product's <head>, see that file).
// x-middleware-rewrite is the header @vercel/functions' rewrite() sets; used directly
// to avoid adding a dependency. Local dev (python http.server) ignores this file.
export const config = { matcher: '/product' };

export default function middleware(request) {
  const url = new URL(request.url);
  url.pathname = '/api/product';
  return new Response(null, { headers: { 'x-middleware-rewrite': url.toString() } });
}
