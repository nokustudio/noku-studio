// Moved out of index.html so the site's CSP can forbid inline scripts.
// ════════ DRAFT HERO: featured products ════════
(function () {
  // ponytail: hardcoded from the live Storefront API (custom.featured = true, purchasemode checked 2026-11-03) — read from Shopify before this replaces index.
  // box = where the furniture sits inside its cutout frame, as fractions [top, right, bottom, left]; measured from the pixels. Re-measure if a cutout is re-shot.
  const LIST = [
    { handle: 'lounge-chair', buyable: true, name: 'Bask Chair', coll: 'Of Stillness', from: 41000, tint: '#e3dcd3', box: [.253, .940, .825, .110], cut: 'Lounge_chair_-_teak_frame_-_cognac.png' },
    { handle: 'sofa-2', buyable: false, name: 'Grooved Sofa', coll: 'Of Stillness', from: 65000, tint: '#e2dfd7', box: [.382, .904, .703, .133], cut: 'grsofa-t-linen.png?v=1793784133' },
    { handle: 'round-dining-chair', buyable: true, name: 'Lunar Chair', coll: 'Of Stillness', from: 14000, tint: '#ddddd4', box: [.132, .818, .835, .168], cut: 'rdc-t-olive.png' },
    { handle: 'barstool', buyable: true, name: 'Stilt Barstool', coll: 'Of Stillness', from: 18000, tint: '#e1d9d2', box: [.181, .796, .779, .270], cut: 'barst-t-cognac.png' },
  ];
  const CDN = 'https://cdn.shopify.com/s/files/1/0565/9954/3866/files/';
  // the CDN caches for a year: when a file is replaced in Shopify, add its new ?v= to `cut` above or browsers keep the old image
  const src = (f, w) => `${CDN}${f}${f.includes('?') ? '&' : '?'}width=${w}`;
  // the widest frame fitPieces() draws (the sofa) in device pixels, up to the 1684px originals: the full file on 4K, about 1200 on 1080p, 1000 on phones.
  // Read from the screen, not the window, so maximising never leaves a blurry image. The CDN sends these as WebP.
  const PIECE_W = Math.min(1684, Math.ceil(Math.min(screen.height * 1.04, screen.width * .84) * devicePixelRatio / 100) * 100) || 1684;   // screen reads 0 while a page loads hidden
  const pad = n => String(n).padStart(2, '0');
  const inr = n => '₹' + n.toLocaleString('en-IN');
  const url = p => `product.html?handle=${p.handle}`;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const hero = $('.fh'), words = $('.fh-words'), piece = $('.fh-piece'), now = $('.fh-now'), thumbs = $('.fh-thumbs'), apBtn = $('.fh-ap');
  LIST.forEach((p, i) => {
    // Buy-vs-Inquire mirrors the Shopify custom.purchasemode metafield, as on the live site
    const second = p.buyable
      ? `<a class="fh-pill solid" href="${url(p)}">Buy now</a>`   // ponytail: lands on the product page to pick a variant; one-tap checkout needs a default variant id
      : `<a class="fh-pill solid" href="${url(p)}&inquire=true">Inquire</a>`;
    words.insertAdjacentHTML('beforeend', `<div class="fh-word">${p.name}</div>`);
    piece.insertAdjacentHTML('beforeend', `<img class="fh-blend" src="${src(p.cut, PIECE_W)}" alt="${p.name}" decoding="async">`);
    now.insertAdjacentHTML('beforeend', `<div>
      <span class="fh-m"><span class="fh-sub" style="--i:0"><span class="fh-sr">${p.name}, </span>${pad(i + 1)} — ${p.coll} · <b>From ${inr(p.from)}</b></span></span>
      <span class="fh-m"><span class="fh-acts" style="--i:1"><a class="fh-pill" href="${url(p)}">View</a>${second}</span></span></div>`);
    apBtn.insertAdjacentHTML('beforebegin', `<button class="fh-tbtn" type="button" aria-label="Show ${p.name}"><span class="fh-tb" style="--tint:${p.tint}"><img class="fh-blend" src="${src(p.cut, 160)}" alt=""></span><span class="fh-bar"><i></i></span></button>`);
  });
  const W = $$('.fh-word', words), I = $$('img', piece), N = $$(':scope > div', now), B = $$('.fh-tbtn', thumbs), bars = $$('.fh-bar i', thumbs);
  let cur = -1;
  function show(i) {
    if (i === cur) return;
    [W, I, N].forEach(set => set.forEach((el, j) => { el.classList.toggle('on', j === i); el.classList.toggle('was', j === cur); }));
    N.forEach((el, j) => el.inert = j !== i);          // hidden slides' buttons stay out of the tab order
    B.forEach((b, j) => b.setAttribute('aria-current', j === i));
    bars.forEach(b => b.style.transform = 'scaleX(0)');
    hero.style.setProperty('--tint', LIST[i].tint);
    cur = i;
  }
  show(0);

  // Autoplay with a visible timer. Pauses on hover/focus, when the tab is hidden,
  // when the hero scrolls out of view, and via the pause button (WCAG 2.2.2).
  let t = 0, last = 0, hovered = false, focused = false, visible = true, user = !reduce;
  const DUR = 5500, running = () => user && !hovered && !focused && visible && !document.hidden;
  const frame = ts => {
    if (running()) { t += Math.min(250, ts - (last || ts)); if (t >= DUR) { t = 0; show((cur + 1) % LIST.length); } bars[cur].style.transform = `scaleX(${t / DUR})`; }
    last = ts; requestAnimationFrame(frame);
  };
  [thumbs, now].forEach(el => {
    el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hovered = true; });
    el.addEventListener('pointerleave', () => hovered = false);
  });
  hero.addEventListener('focusin', e => focused = e.target.matches(':focus-visible'));
  hero.addEventListener('focusout', () => focused = false);
  new IntersectionObserver(([e]) => visible = e.isIntersecting, { threshold: .4 }).observe(hero);
  const paint = () => {
    apBtn.setAttribute('aria-label', user ? 'Pause slideshow' : 'Play slideshow');
    apBtn.innerHTML = user ? '<svg viewBox="0 0 10 10"><rect x="1.5" y=".5" width="2.4" height="9" rx="1.2"/><rect x="6.1" y=".5" width="2.4" height="9" rx="1.2"/></svg>'
                           : '<svg viewBox="0 0 10 10"><path d="M2.6 1.2a.9.9 0 0 1 1.35-.78l5.2 3.8a.9.9 0 0 1 0 1.56l-5.2 3.8A.9.9 0 0 1 2.6 8.8z"/></svg>';
  };
  apBtn.addEventListener('click', () => { user = !user; paint(); });
  paint(); requestAnimationFrame(frame);
  B.forEach((b, i) => b.addEventListener('click', () => { show(i); t = 0; bars[i].style.transform = 'scaleX(0)'; }));

  // Every cutout has a different margin of backdrop, so fit each by its furniture box, not its frame:
  // centred both ways in the space between nav and name, chairs sized by height, wide pieces capped by width.
  const fitPieces = () => {
    const Wd = piece.clientWidth, H = piece.clientHeight, maxW = Math.min(Wd * .9, H * 1.3);
    I.forEach((img, i) => {
      const [tp, r, b, l] = LIST[i].box, ar = img.naturalWidth / img.naturalHeight || 2 / 3;
      const h = .72 * Math.min(H / (b - tp), maxW / ((r - l) * ar));    // rendered frame height, 28% under the full fit
      Object.assign(img.style, { height: `${h}px`, left: `${Wd / 2 - (l + r) / 2 * ar * h}px`, top: `${(H - (b - tp) * h) / 2 - tp * h}px` });
    });
  };
  new ResizeObserver(fitPieces).observe(piece);
  I.forEach(img => img.decode().catch(() => {}).then(fitPieces));

  // reveal once fonts + the first piece are in (hard cap so it never hangs)
  Promise.race([
    Promise.all([document.fonts.ready, I[0].decode().catch(() => {})]),
    new Promise(r => setTimeout(r, 1400)),
  ]).then(() => hero.classList.add('fh-ready'));
})();
