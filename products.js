/**
 * Noku Studio — All Products Page Controller
 * Handles dynamic fetching from Shopify Storefront API, local fallbacks,
 * client-side search/filtering, and persistent cart synchronization.
 */

// ─── SHOPIFY STOREFRONT API CREDENTIALS ───
const SHOPIFY_CONFIG = window.SHOPIFY_CONFIG || {
  storefrontAccessToken: '7b62ad5d7d665bebe383ff2d3c36c0b0',
  shopDomain: '6b5390-f8.myshopify.com',
  apiVersion: '2024-04',
  currencySymbol: '₹',
  defaultPrice: 24500
};


// Display-only products list (from noku_products.xlsx)
const DISPLAY_ONLY_HANDLES = [
  'sofa-2',
  'rod-bed-with-curved-headboard'
];

function isDisplayOnly(handle) {
  if (!handle) return false;
  return DISPLAY_ONLY_HANDLES.includes(handle.toLowerCase().trim());
}

function isDisplayItem(item) {
  if (!item) return false;
  const handle = item.handle ? item.handle.toLowerCase().trim() : '';
  const title = item.title ? item.title.toLowerCase().trim() : '';
  
  const displayTitles = [
    "grooved sofa",
    "grooved-sofa",
    "rod bed",
    "rod-bed"
  ];
  
  if (handle && DISPLAY_ONLY_HANDLES.includes(handle)) return true;
  if (title && displayTitles.includes(title)) return true;
  
  if (item.id) {
    const itemIdLower = item.id.toLowerCase();
    for (const h of DISPLAY_ONLY_HANDLES) {
      if (itemIdLower.includes(h)) return true;
    }
  }
  
  const displayVariantIds = [
    "41221043814458", "41221043847226", "41221043945530", "41221043912762", "41221044961338", "41221043879994", "41221043716154", "41221043748922", "41221044928570", "40593555587130",
    "40593555619898", "41221041684538", "40593555718202", "41221044699194", "40593555685434", "40589542981690", "40593555521594", "41221044666426", "41221043552314", "41221043585082",
    "41221043683386", "41221043650618", "41221044895802", "41221043617850", "41221043454010", "41221043486778", "41221044863034", "41241712951354", "40589542391866", "41241712918586"
  ];
  
  if (item.variantId) {
    const vIdString = String(item.variantId);
    for (const id of displayVariantIds) {
      if (vIdString.includes(id)) return true;
    }
  }
  
  return false;
}

// ─── FALLBACK PRODUCT CATALOG DATA ───
// Used immediately for instant render, and as a fallback if the API is offline.
const FALLBACK_PRODUCTS = [
  {
    id: "gid://shopify/Product/7325874651194",
    title: "Grooved Sofa",
    handle: "sofa-2",
    description: "A meditation on silence. Mid-Century proportions paired with honest joinery. Rooted in our Chandigarh lineage, reimagined for contemporary living.",
    productType: "sofa",
    tags: ["sofa", "fabric", "leather"],
    collections: { edges: [{ node: { title: "Of Stillness", handle: "of-stillness" } }] },
    featuredImage: {
      url: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c99b2583745be71136547_Noku_ofStillness_Sofa_grooved_02.jpeg",
      altText: "Grooved Sofa"
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/40593555587130",
            title: "Teak / Fabric - Charcoal",
            price: { amount: "81000.0", currencyCode: "INR" }
          }
        }
      ]
    }
  },
  {
    id: "gid://shopify/Product/7319571562554",
    title: "Bask Chair",
    handle: "lounge-chair",
    description: "Celebrating mid-century restraint and fine craftsmanship. An elegant visual weight with refined lines.",
    productType: "chair",
    tags: ["chair", "lounge", "fabric", "leather"],
    collections: { edges: [{ node: { title: "Of Stillness", handle: "of-stillness" } }] },
    featuredImage: {
      url: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c7724c1a8d27260d62288_Noku_ofStillness_Lounge_chair_02.jpeg",
      altText: "Bask Chair"
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/40593534910522",
            title: "Teak / Fabric - Cloud",
            price: { amount: "49500.0", currencyCode: "INR" }
          }
        }
      ]
    }
  },
  {
    id: "gid://shopify/Product/7365013274682",
    title: "Ripple Chair",
    handle: "dining-chair",
    description: "Lightweight dining joinery in warm hardwood finishes. Perfect blend of comfort and structural honesty.",
    productType: "chair",
    tags: ["chair", "dining"],
    collections: { edges: [{ node: { title: "Of Stillness", handle: "of-stillness" } }] },
    featuredImage: {
      url: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c99b2583745be7113654a_Noku_ofStillness_Dining_chair_03.jpeg",
      altText: "Ripple Chair"
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/41218821881914",
            title: "Teak",
            price: { amount: "11500.0", currencyCode: "INR" }
          }
        }
      ]
    }
  },
  {
    id: "gid://shopify/Product/7320294064186",
    title: "Stylus Table",
    handle: "modern-study-table",
    description: "Premium solid teak workstation with elegant brass detailing. Built to inspire intent and focus.",
    productType: "table",
    tags: ["table", "study", "brass"],
    collections: { edges: [{ node: { title: "Of Stillness", handle: "of-stillness" } }] },
    featuredImage: {
      url: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c7d6f73c94da715b34a92_Noku_ofStillness_Study_table_03.jpeg",
      altText: "Stylus Table"
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/40573725409338",
            title: "Teak",
            price: { amount: "35000.0", currencyCode: "INR" }
          }
        }
      ]
    }
  },
  {
    id: "gid://shopify/Product/7320281120826",
    title: "Stilt Barstool",
    handle: "barstool",
    description: "A design statement of quiet elegance, wood, and upholstery. Handmade in India.",
    productType: "barstool",
    tags: ["barstool", "leather", "fabric"],
    collections: { edges: [{ node: { title: "Of Stillness", handle: "of-stillness" } }] },
    featuredImage: {
      url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/67cfdbb331dba957c997c00e_5d1622c83584a245197f9005889b2b06_Noku_ofStillness_Barstool_03%20copy.webp",
      altText: "Stilt Barstool"
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/40585660366906",
            title: "Teak / Leather - Cognac",
            price: { amount: "21000.0", currencyCode: "INR" }
          }
        }
      ]
    }
  },
  {
    id: "gid://shopify/Product/7320292196410",
    title: "Quill Study Table",
    handle: "classic-study-table",
    description: "Vernacular lines combined with modern ergonomics. Features solid joinery and drawer space.",
    productType: "table",
    tags: ["table", "study"],
    collections: { edges: [{ node: { title: "Of Memories", handle: "of-memories" } }] },
    featuredImage: {
      url: "https://cdn.shopify.com/s/files/1/0565/9954/3866/files/T1_DSC09354.jpg?v=1769765035",
      altText: "Quill Study Table"
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/40573722853434",
            title: "Teak",
            price: { amount: "41500.0", currencyCode: "INR" }
          }
        }
      ]
    }
  },
  {
    id: "gid://shopify/Product/7323011874874",
    title: "Nook Side Table",
    handle: "side-table",
    description: "Compact design block with elegant, clean lines, ideal as a bedside companion or sofa accompaniment.",
    productType: "side table",
    tags: ["side table", "table"],
    collections: { edges: [{ node: { title: "Of Stillness", handle: "of-stillness" } }] },
    featuredImage: {
      url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/69c00d403fa184eebc59c05c_Side%20Table%2042%20B.png",
      altText: "Nook Side Table"
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/40583459569722",
            title: "Teak",
            price: { amount: "21000.0", currencyCode: "INR" }
          }
        }
      ]
    }
  },
  {
    id: "gid://shopify/Product/7325875505978",
    title: "Dune Sofa",
    handle: "lounge-sofa",
    description: "Deep, comfortable, and beautifully finished sofa. A warm center point for your living room conversations.",
    productType: "sofa",
    tags: ["sofa", "lounge", "fabric", "leather"],
    collections: { edges: [{ node: { title: "Of Memories", handle: "of-memories" } }] },
    featuredImage: {
      url: "https://cdn.shopify.com/s/files/1/0565/9954/3866/files/Noku_ofStillness_Sofa_04.webp?v=1769765673", // reusable quality placeholder
      altText: "Dune Sofa"
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/40573731110970",
            title: "Teak / Leather - Cognac",
            price: { amount: "119500.0", currencyCode: "INR" }
          }
        }
      ]
    }
  },
  {
    id: "gid://shopify/Product/7323012792378",
    title: "Float Bench",
    handle: "upholstered-bench",
    description: "Elegant seating block with options for premium fabrics or leather, detailed with fine line stitch work.",
    productType: "bench",
    tags: ["bench", "fabric", "leather"],
    collections: { edges: [{ node: { title: "Of Memories", handle: "of-memories" } }] },
    featuredImage: {
      url: "https://cdn.shopify.com/s/files/1/0565/9954/3866/files/DSC09382.webp?v=1769766216", // fallback visual
      altText: "Float Bench"
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/40583462649914",
            title: "Teak / Leather - Cognac",
            price: { amount: "25500.0", currencyCode: "INR" }
          }
        }
      ]
    }
  },
  {
    id: "gid://shopify/Product/7323013152826",
    title: "Rod Bed",
    handle: "rod-bed-with-curved-headboard",
    description: "Curved headboard bed with subtle spindle rod structures. Celebrating Chandigarh-heritage craft.",
    productType: "bed",
    tags: ["bed"],
    collections: { edges: [{ node: { title: "Of Memories", handle: "of-memories" } }] },
    featuredImage: {
      url: "https://cdn.shopify.com/s/files/1/0565/9954/3866/files/Rodbed3.png?v=1774860971",
      altText: "Rod Bed"
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/40589542391866",
            title: "Teak",
            price: { amount: "81000.0", currencyCode: "INR" }
          }
        }
      ]
    }
  },
  {
    id: "gid://shopify/Product/7325876781114",
    title: "Arbor Poster Bed",
    handle: "poster-bed",
    description: "Timeless four-poster bed framing your rest. Built in solid teak and ash structures.",
    productType: "bed",
    tags: ["bed"],
    collections: { edges: [{ node: { title: "Of Stillness", handle: "of-stillness" } }] },
    featuredImage: {
      url: "https://cdn.shopify.com/s/files/1/0565/9954/3866/files/Poster_bed_with_mattress_iso.webp?v=1769772487", // fallback visual
      altText: "Arbor Poster Bed"
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/40589458997306",
            title: "Teak / Leather - Cognac",
            price: { amount: "142000.0", currencyCode: "INR" }
          }
        }
      ]
    }
  },
  {
    id: "gid://shopify/Product/7323012333626",
    title: "Eclipse Dining Table",
    handle: "round-dining-table",
    description: "Centring dining spaces with a soft, round circular form. Features rich grain patterns in solid wood.",
    productType: "table",
    tags: ["table", "dining"],
    collections: { edges: [{ node: { title: "Of Exploration", handle: "of-exploration" } }] },
    featuredImage: {
      url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/69c00d403fa184eebc59c05c_Side%20Table%2042%20B.png", // fallback
      altText: "Eclipse Dining Table"
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/40583460683834",
            title: "Teak",
            price: { amount: "47000.0", currencyCode: "INR" }
          }
        }
      ]
    }
  }
];

// ─── LOCAL STATE ───
let productsList = [...FALLBACK_PRODUCTS];
let activeFilters = {
  search: "",
  collection: "all",
  space: "all",
  type: "all",
  material: "all",
  sort: "featured"
};

// Persistent Cart LocalStorage key
let cart = JSON.parse(localStorage.getItem('noku_cart')) || [];

// ─── API FETCH LOGIC ───
const ALL_PRODUCTS_QUERY = `
  query getAllProductsWithMetadata {
    products(first: 100) {
      edges {
        node {
          id
          title
          handle
          description
          productType
          tags
          collections(first: 5) {
            edges {
              node {
                id
                title
                handle
              }
            }
          }
          featuredImage {
            url
            altText
          }
          featuredVariant: metafield(namespace: "custom", key: "featured_variant") {
            reference {
              ... on ProductVariant {
                id
                title
                price {
                  amount
                  currencyCode
                }
                image {
                  url
                }
              }
            }
          }
          variants(first: 50) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                image {
                  url
                }
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }
    }
  }
`;

async function fetchProductsFromShopify() {
  const { storefrontAccessToken, shopDomain, apiVersion } = SHOPIFY_CONFIG;
  const url = `https://${shopDomain}/api/${apiVersion}/graphql.json`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken
      },
      body: JSON.stringify({ query: ALL_PRODUCTS_QUERY })
    });

    if (!response.ok) {
      console.warn("Shopify API responded with status", response.status);
      return;
    }

    const result = await response.json();
    if (result.errors) {
      console.error("Shopify Storefront GraphQL errors:", result.errors);
      return;
    }

    const fetched = (result.data?.products?.edges?.map(edge => edge.node) || [])
      .filter(p => {
        // Exclude draft/test products (no image, zero-priced variants, or "draft"/"test" in title)
        const hasNoImage = !p.featuredImage || !p.featuredImage.url;
        const allVariantsZeroPrice = p.variants?.edges?.length > 0 && 
          p.variants.edges.every(vEdge => parseFloat(vEdge.node.price?.amount || '0') === 0);
        const hasDraftTitle = p.title && (p.title.toLowerCase().includes('draft') || p.title.toLowerCase().includes('test'));
        return !(hasNoImage || allVariantsZeroPrice || hasDraftTitle);
      });
    if (fetched.length > 0) {
      console.log(`Loaded ${fetched.length} live products from Shopify.`);
      // Override fallback with live products
      productsList = fetched;
      renderProductsGrid();
      setupDynamicFilters();
    }
  } catch (err) {
    console.error("Failed to connect to Shopify Storefront API. Using fallback data.", err);
  }
}

// ─── MAPPING HELPERS FOR FILTERING ───

function getProductSpace(p) {
  const type = (p.productType || '').toLowerCase();
  const handle = (p.handle || '').toLowerCase();
  const desc = (p.description || '').toLowerCase();
  
  if (handle.includes('sofa') || type.includes('sofa') || handle.includes('lounge') || type.includes('lounge') || handle.includes('side-table') || type.includes('side table') || handle.includes('bench') || type.includes('bench')) {
    return 'Living Room';
  }
  if (handle.includes('dining') || type.includes('dining') || handle.includes('chair') || type.includes('chair') || handle.includes('table') && !handle.includes('study')) {
    return 'Dining Room';
  }
  if (handle.includes('bed') || type.includes('bed') || handle.includes('bedroom')) {
    return 'Bedroom';
  }
  if (handle.includes('study') || type.includes('study') || handle.includes('desk') || type.includes('table') || type.includes('office') || handle.includes('chair')) {
    return 'Study';
  }
  return 'Living Room';
}

function getProductMaterials(p) {
  const materials = new Set();
  
  // Tag inspection
  if (p.tags) {
    p.tags.forEach(tag => {
      const t = tag.toLowerCase();
      if (t.includes('leather')) materials.add('Leather');
      if (t.includes('fabric') || t.includes('linen') || t.includes('wool') || t.includes('velvet')) materials.add('Fabric');
      if (t.includes('cane') || t.includes('rattan')) materials.add('Cane');
      if (t.includes('brass') || t.includes('metal')) materials.add('Brass');
    });
  }
  
  // Variant Title inspection
  if (p.variants && p.variants.edges) {
    p.variants.edges.forEach(edge => {
      const title = (edge.node.title || '').toLowerCase();
      if (title.includes('teak')) materials.add('Teak Wood');
      if (title.includes('ash') || title.includes('white ash')) materials.add('White Ash');
      if (title.includes('reclaimed')) materials.add('Reclaimed Teak');
      if (title.includes('leather')) materials.add('Leather');
      if (title.includes('fabric') || title.includes('linen') || title.includes('velvet')) materials.add('Fabric');
      if (title.includes('cane')) materials.add('Cane');
    });
  }

  // Default fallbacks based on handle/type if empty
  if (materials.size === 0) {
    materials.add('Teak Wood');
  }

  return Array.from(materials);
}

function getProductTypeGroup(p) {
  const type = (p.productType || '').toLowerCase();
  const handle = (p.handle || '').toLowerCase();
  
  if (type.includes('barstool') || handle.includes('barstool')) return 'Barstools';
  if (type.includes('chair') || handle.includes('chair')) return 'Chairs';
  if (type.includes('sofa') || handle.includes('sofa')) return 'Sofas';
  if (type.includes('table') || handle.includes('table') || handle.includes('desk')) return 'Tables';
  if (type.includes('bed') || handle.includes('bed')) return 'Beds';
  if (type.includes('bench') || handle.includes('bench')) return 'Benches';
  return 'Chairs'; // default category
}

function getMinProductPrice(p) {
  if (p.variants && p.variants.edges && p.variants.edges.length > 0) {
    const prices = p.variants.edges.map(e => parseFloat(e.node.price.amount));
    return Math.min(...prices);
  }
  return SHOPIFY_CONFIG.defaultPrice;
}

// Ask the Shopify CDN to resize the image to roughly the card's display size
// instead of shipping the multi-megapixel original. Letting the browser crush a
// ~25MP file down ~13x produces jagged edges on fine details (e.g. chair legs);
// the CDN's high-quality resampling avoids that. The 4:5 crop matches the
// .gcard__media aspect ratio so no further scaling/cropping is needed in-browser.
function sizedCardImage(url, targetCssW = 480, targetCssH = 600) {
  if (!url) return url;
  try {
    const u = new URL(url, window.location.href);
    if (u.hostname.includes('cdn.shopify.com') || u.hostname.includes('cdn.shopifycdn')) {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      u.searchParams.set('width', String(Math.round(targetCssW * dpr)));
      u.searchParams.set('height', String(Math.round(targetCssH * dpr)));
      u.searchParams.set('crop', 'center');
      return u.toString();
    }
  } catch (e) { /* malformed URL — fall through */ }
  return url;
}

// ─── DOM INJECTION & GRID CONTROLLER ───

function renderProductsGrid() {
  const grid = document.getElementById('products-catalog-grid');
  const countEl = document.getElementById('catalog-results-count');
  if (!grid) return;

  grid.innerHTML = "";
  
  // Filter memory list
  let filtered = productsList.filter(p => {
    // 1. Search Query
    if (activeFilters.search.trim() !== "") {
      const q = activeFilters.search.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      const matchType = (p.productType || '').toLowerCase().includes(q);
      const matchTags = p.tags ? p.tags.some(t => t.toLowerCase().includes(q)) : false;
      if (!matchTitle && !matchDesc && !matchType && !matchTags) return false;
    }

    // 2. Collection filter
    if (activeFilters.collection !== "all") {
      const matchColl = p.collections?.edges?.some(edge => 
        edge.node.title.toLowerCase().includes(activeFilters.collection) ||
        edge.node.handle.toLowerCase().includes(activeFilters.collection)
      );
      if (!matchColl) return false;
    }

    // 3. Space filter
    if (activeFilters.space !== "all") {
      const space = getProductSpace(p).toLowerCase();
      if (!space.includes(activeFilters.space.toLowerCase())) return false;
    }

    // 4. Furniture Type filter
    if (activeFilters.type !== "all") {
      const type = getProductTypeGroup(p).toLowerCase();
      if (!type.includes(activeFilters.type.toLowerCase())) return false;
    }

    // 5. Material filter
    if (activeFilters.material !== "all") {
      const materials = getProductMaterials(p).map(m => m.toLowerCase());
      const selected = activeFilters.material.toLowerCase();
      const matchMat = materials.some(m => m.includes(selected));
      if (!matchMat) return false;
    }

    return true;
  });

  // Sort list
  if (activeFilters.sort === 'name-asc') {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  } else if (activeFilters.sort === 'name-desc') {
    filtered.sort((a, b) => b.title.localeCompare(a.title));
  } else if (activeFilters.sort === 'price-asc') {
    filtered.sort((a, b) => {
      const priceA = a.variants?.edges?.[0]?.node ? parseFloat(a.variants.edges[0].node.price.amount) : SHOPIFY_CONFIG.defaultPrice;
      const priceB = b.variants?.edges?.[0]?.node ? parseFloat(b.variants.edges[0].node.price.amount) : SHOPIFY_CONFIG.defaultPrice;
      return priceA - priceB;
    });
  } else if (activeFilters.sort === 'price-desc') {
    filtered.sort((a, b) => {
      const priceA = a.variants?.edges?.[0]?.node ? parseFloat(a.variants.edges[0].node.price.amount) : SHOPIFY_CONFIG.defaultPrice;
      const priceB = b.variants?.edges?.[0]?.node ? parseFloat(b.variants.edges[0].node.price.amount) : SHOPIFY_CONFIG.defaultPrice;
      return priceB - priceA;
    });
  }

  // Update results count
  if (countEl) {
    countEl.textContent = `${filtered.length} Piece${filtered.length === 1 ? '' : 's'} found`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="catalog-empty-state">
        <h3>No matching pieces found</h3>
        <p>Try resetting filters or expanding your search query.</p>
        <button class="btn-reset-filters" onclick="resetAllFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  // Render cards
  filtered.forEach((p, idx) => {
    const card = document.createElement('a');
    card.href = `product.html?handle=${encodeURIComponent(p.handle)}`;
    card.className = `gcard reveal-el is-revealed`; // reveal immediately
    card.style.animationDelay = `${(idx % 4) * 0.1}s`;
    
    // Drive the card off one coherent variant so the photo and the material label
    // can't disagree. Priority: the merchant's custom.featured_variant pick, then the
    // first variant that carries its own Shopify image (its photo matches its title),
    // then the first variant.
    const variantEdges = p.variants?.edges || [];
    const cardVariant = p.featuredVariant?.reference
      || (variantEdges.find(e => e.node.image && e.node.image.url) || variantEdges[0])?.node;
    const displayPrice = cardVariant ? parseFloat(cardVariant.price.amount) : SHOPIFY_CONFIG.defaultPrice;
    // Keep the full variant title (incl. the "- Colour" suffix) so the eyebrow names
    // the exact fabric/leather shown, e.g. "White Ash / Leather - Cognac".
    const displayMaterial = cardVariant ? cardVariant.title : 'Solid Wood Finish';
    const eyebrowMaterial = displayMaterial;
    // Show the variant's own image so it matches the material named below; only fall
    // back to the product featured image when the variant carries no image.
    const rawImage = (cardVariant && cardVariant.image && cardVariant.image.url) || p.featuredImage?.url || 'https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c99b2583745be71136547_Noku_ofStillness_Sofa_grooved_02.jpeg';
    const defaultImage = sizedCardImage(rawImage);
    const defaultVariantId = cardVariant ? cardVariant.id : `gid://shopify/ProductVariant/fallback-${p.handle}`;

    const isDisplay = isDisplayOnly(p.handle);

    card.innerHTML = `
      <div class="gcard__media">
        <div class="gcard__media-inner">
          <img src="${safeUrl(defaultImage)}" alt="${escHtml(p.title)}" loading="lazy">
        </div>
        ${isDisplay ? `
        <button class="gcard__add gcard__inquire"
                data-handle="${escHtml(p.handle)}"
                aria-label="Inquire about ${escHtml(p.title)}">
          Inquire <svg class="ico-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="8 7 17 7 17 16"></polyline></svg>
        </button>
        ` : `
        <button class="gcard__add"
                data-id="${escHtml(p.id)}"
                data-variant-id="${escHtml(defaultVariantId)}"
                data-title="${escHtml(p.title)}"
                data-price="${displayPrice}"
                data-image="${safeUrl(defaultImage)}"
                data-materials="${escHtml(displayMaterial)}"
                aria-label="Add ${escHtml(p.title)} to Cart">
          Add <svg class="ico-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="8 7 17 7 17 16"></polyline></svg>
        </button>
        `}
      </div>
      <p class="gcard__cat">${escHtml(eyebrowMaterial)}</p>
      <h3 class="gcard__name">${escHtml(p.title)}</h3>
      <p class="gcard__price">${formatCurrency(displayPrice)}</p>
    `;
    
    // Bind Add to Cart / Inquire action
    const btn = card.querySelector('.gcard__add');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault(); // Prevent navigating to product.html when clicking Add to Cart
      
      if (isDisplay) {
        window.location.href = `product.html?handle=${encodeURIComponent(p.handle)}&inquire=true`;
        return;
      }
      
      const variantId = btn.dataset.variantId;
      const title = btn.dataset.title;
      const price = parseFloat(btn.dataset.price);
      const image = btn.dataset.image;
      const materials = btn.dataset.materials;
      
      addItemToCart(p.id, title, price, image, variantId, materials);
    });

    grid.appendChild(card);
  });
}

// Setup filter values dynamically from loaded product listing (for future scaling)
function setupDynamicFilters() {
  // If we want to dynamically hide filter options that are not present, we can code it here.
  // Currently, we keep static high-end checkboxes/radio choices as designed.
}

// ─── FILTER EVENT LISTENERS ───

function bindFilterEvents() {
  // 1. Search Bar
  const searchInput = document.getElementById('search-catalog');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      activeFilters.search = e.target.value;
      renderProductsGrid();
    });
  }

  // 2. Collection Selection
  const collectionButtons = document.querySelectorAll('.filter-collection-btn');
  collectionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      collectionButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilters.collection = btn.dataset.value;
      renderProductsGrid();
    });
  });

  // 3. Space Selection (Select dropdown)
  const spaceSelect = document.getElementById('filter-space-select');
  if (spaceSelect) {
    spaceSelect.addEventListener('change', (e) => {
      activeFilters.space = e.target.value;
      renderProductsGrid();
    });
  }

  // 4. Type Selector (Select dropdown)
  const typeSelect = document.getElementById('filter-type-select');
  if (typeSelect) {
    typeSelect.addEventListener('change', (e) => {
      activeFilters.type = e.target.value;
      renderProductsGrid();
    });
  }

  // 5. Material Selector
  const materialPills = document.querySelectorAll('.material-pill');
  materialPills.forEach(pill => {
    pill.addEventListener('click', () => {
      materialPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilters.material = pill.dataset.value;
      renderProductsGrid();
    });
  });

  // 6. Sort Select dropdown
  const sortSelect = document.getElementById('sort-products');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeFilters.sort = e.target.value;
      renderProductsGrid();
    });
  }
}

function resetAllFilters() {
  activeFilters = {
    search: "",
    collection: "all",
    space: "all",
    type: "all",
    material: "all",
    sort: "featured"
  };

  // Reset UI elements
  const searchInput = document.getElementById('search-catalog');
  if (searchInput) searchInput.value = "";

  document.querySelectorAll('.filter-collection-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === 'all');
  });

  const spaceSelect = document.getElementById('filter-space-select');
  if (spaceSelect) spaceSelect.value = "all";

  const typeSelect = document.getElementById('filter-type-select');
  if (typeSelect) typeSelect.value = "all";

  const sortSelect = document.getElementById('sort-products');
  if (sortSelect) sortSelect.value = "featured";

  document.querySelectorAll('.material-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === 'all');
  });

  renderProductsGrid();
}

// Make resetAllFilters globally accessible
window.resetAllFilters = resetAllFilters;

// ─── CART DRAWER ACTION CONTROLLERS ───

function saveCart() {
  localStorage.setItem('noku_cart', JSON.stringify(cart));
  updateCartUI();
  
  // Sync to other tabs/index.html through a custom event trigger
  window.dispatchEvent(new Event('storage'));
}

function addItemToCart(productId, title, price, image, variantId, materials) {
  if (isDisplayItem({ id: productId, title: title, variantId: variantId })) {
    alert("This item is for display only and cannot be added to the cart.");
    return;
  }
  const cartItemId = `prod-${productId}-${variantId}`.replace(/[^a-zA-Z0-9-]/g, '');
  const existingIndex = cart.findIndex(item => item.id === cartItemId || item.variantId === variantId);

  if (existingIndex > -1) {
    cart[existingIndex].quantity += 1;
  } else {
    cart.push({
      id: cartItemId,
      title: title,
      price: price,
      image: image,
      variantId: variantId,
      quantity: 1,
      options: {
        variantTitle: materials || "Solid Wood Finish"
      }
    });
  }

  saveCart();
  openCartDrawer();
}

function updateItemQuantity(itemId, change) {
  const index = cart.findIndex(item => item.id === itemId);
  if (index > -1) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    } else if (cart[index].quantity > 99) {
      cart[index].quantity = 99; // clamp to a sane maximum
    }
    saveCart();
  }
}

function removeItemFromCart(itemId) {
  const index = cart.findIndex(item => item.id === itemId);
  if (index > -1) {
    cart.splice(index, 1);
    saveCart();
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
}

// Escape text before it is interpolated into an innerHTML template. Catalog
// titles/materials come from Shopify and cart contents come from localStorage,
// so both are untrusted from the page's point of view.
function escHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Only allow http(s) URLs into src / background-image; blocks javascript:,
// data:text/html etc. and neutralises any attribute-breaking quote.
function safeUrl(rawUrl) {
  if (!rawUrl) return '';
  try {
    const u = new URL(rawUrl, window.location.href);
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      return escHtml(u.href);
    }
  } catch (e) { /* malformed — drop it */ }
  return '';
}

// Only ever navigate to a checkout URL on one of Shopify's own domains. The URL
// comes back from the cartCreate API response; validating the host before
// redirecting prevents a tampered/injected response from sending the buyer to a
// look-alike phishing payment page.
function isTrustedCheckoutUrl(rawUrl) {
  try {
    const u = new URL(rawUrl, window.location.href);
    if (u.protocol !== 'https:') return false;
    const h = u.hostname.toLowerCase();
    return h === SHOPIFY_CONFIG.shopDomain.toLowerCase() ||
           h.endsWith('.myshopify.com') ||
           h.endsWith('.shopify.com') ||
           h === 'shop.app' || h.endsWith('.shop.app');
  } catch (e) {
    return false;
  }
}

function updateCartUI() {
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartCountBadge = document.getElementById('cart-count-badge');
  const cartSubtotalEl = document.getElementById('cart-subtotal');
  const checkoutBtn = document.getElementById('checkout-btn');

  if (!cartItemsContainer) return;

  // Enforce cart display policy proactively
  let localCart = JSON.parse(localStorage.getItem('noku_cart')) || [];
  const displayHandles = [
    'sofa-2',
    'rod-bed-with-curved-headboard'
];
  const displayTitles = [
    "grooved sofa",
    "grooved-sofa",
    "rod bed",
    "rod-bed"
  ];
  const filteredCart = localCart.filter(item => {
    if (!item) return false;
    const handle = item.handle ? item.handle.toLowerCase().trim() : '';
    const title = item.title ? item.title.toLowerCase().trim() : '';
    if (handle && displayHandles.includes(handle)) return false;
    if (title && displayTitles.includes(title)) return false;
    if (item.id) {
      const itemIdLower = item.id.toLowerCase();
      for (const h of displayHandles) {
        if (itemIdLower.includes(h)) return false;
      }
    }
    if (item.variantId) {
      const vIdString = String(item.variantId);
      const displayVariantIds = [
    "41221043814458", "41221043847226", "41221043945530", "41221043912762", "41221044961338", "41221043879994", "41221043716154", "41221043748922", "41221044928570", "40593555587130",
    "40593555619898", "41221041684538", "40593555718202", "41221044699194", "40593555685434", "40589542981690", "40593555521594", "41221044666426", "41221043552314", "41221043585082",
    "41221043683386", "41221043650618", "41221044895802", "41221043617850", "41221043454010", "41221043486778", "41221044863034", "41241712951354", "40589542391866", "41241712918586"
  ];
      for (const id of displayVariantIds) {
        if (vIdString.includes(id)) return false;
      }
    }
    return true;
  });

  if (filteredCart.length !== localCart.length) {
    localStorage.setItem('noku_cart', JSON.stringify(filteredCart));
    cart = filteredCart;
  } else {
    cart = localCart;
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCountBadge) {
    cartCountBadge.textContent = totalItems;
  }

  cartItemsContainer.innerHTML = '';

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `<div class="cart-empty-message">Your cart is currently empty.</div>`;
    if (cartSubtotalEl) cartSubtotalEl.textContent = formatCurrency(0);
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Cart is Empty';
    }
    return;
  }

  let subtotal = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item';
    itemEl.innerHTML = `
      <div class="cart-item-img-wrap">
        <img src="${safeUrl(item.image)}" alt="${escHtml(item.title)}">
      </div>
      <div class="cart-item-details">
        <h4 class="cart-item-name">${escHtml(item.title)}</h4>
        <span class="cart-item-variants">${item.options.wood && item.options.cushion ? `${escHtml(item.options.wood)} / ${escHtml(item.options.cushion)}` : escHtml(item.options.variantTitle || '')}</span>
        <span class="cart-item-price">${formatCurrency(item.price)}</span>
        <div class="cart-item-actions">
          <div class="quantity-control">
            <button class="qty-btn dec-qty-btn" data-id="${escHtml(item.id)}" aria-label="Decrease quantity">-</button>
            <span class="qty-val">${item.quantity}</span>
            <button class="qty-btn inc-qty-btn" data-id="${escHtml(item.id)}" aria-label="Increase quantity">+</button>
          </div>
          <button class="cart-item-remove" data-id="${escHtml(item.id)}">Remove</button>
        </div>
      </div>
    `;

    cartItemsContainer.appendChild(itemEl);
  });

  if (cartSubtotalEl) {
    cartSubtotalEl.textContent = formatCurrency(subtotal);
  }

  if (checkoutBtn) {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'Proceed to Checkout';
  }
}

function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  if (drawer && overlay) {
    drawer.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  if (drawer && overlay) {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ─── LIVE SHOPIFY CHECKOUT CREATOR ───
async function proceedToCheckout() {
  updateCartUI();
  if (cart.length === 0) return;
  
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Preparing Checkout...';
  }

  // Try connecting live to Shopify Cart Create Mutation
  const mutation = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  // Format cart lines, filter out custom ids
  const lines = cart.map(item => {
    let rawVariantId = item.variantId;
    // ensure Shopify variant ID starts with gid://
    if (!rawVariantId.startsWith('gid://shopify/ProductVariant/')) {
      // Use Lounge Chair default if it was a fallback ID
      rawVariantId = 'gid://shopify/ProductVariant/40593534910522'; 
    }
    return {
      merchandiseId: rawVariantId,
      quantity: item.quantity
    };
  });

  try {
    const response = await fetch(`https://${SHOPIFY_CONFIG.shopDomain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken
      },
      body: JSON.stringify({ query: mutation, variables: { input: { lines } } })
    });

    const data = await response.json();
    if (data && data.data && data.data.cartCreate && data.data.cartCreate.cart) {
      const checkoutUrl = data.data.cartCreate.cart.checkoutUrl;
      if (isTrustedCheckoutUrl(checkoutUrl)) {
        window.location.href = checkoutUrl;
        return;
      }
      console.error('Refusing to redirect to an untrusted checkout URL:', checkoutUrl);
      const cb = document.getElementById('checkout-btn');
      if (cb) { cb.disabled = false; cb.textContent = 'Proceed to Checkout'; }
      return;
    }
  } catch (err) {
    console.warn("Shopify Checkout mutation failed. Running simulation fallback.", err);
  }

  // Fallback Simulation Drawer Modal
  setTimeout(() => {
    const itemsDescription = cart.map(item =>
      `- ${escHtml(item.title)}: Qty ${item.quantity} @ ${formatCurrency(item.price)}`
    ).join('\n');
    
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const alertModal = document.createElement('div');
    alertModal.className = "simulated-modal-overlay";
    alertModal.style.position = 'fixed';
    alertModal.style.inset = '0';
    alertModal.style.backgroundColor = 'rgba(44, 38, 34, 0.4)';
    alertModal.style.zIndex = '10000';
    alertModal.style.display = 'flex';
    alertModal.style.alignItems = 'center';
    alertModal.style.justifyContent = 'center';
    alertModal.style.padding = '20px';
    
    alertModal.innerHTML = `
      <div style="background-color: #F4F1EC; border: 1px solid #D8D2C8; border-radius: 16px; max-width: 500px; width: 100%; padding: 40px; box-shadow: 0 20px 50px rgba(44,38,34,0.15); font-family: var(--font-body), serif; color: #2C2622;">
        <h3 style="font-family: var(--font-display), sans-serif; text-transform: uppercase; font-weight: 300; letter-spacing: 2px; color: #a27b5c; margin-bottom: 24px;">Shopify Checkout Simulation</h3>
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px; opacity: 0.9;">
          You are redirecting to Shopify. In production, the Headless Storefront API creates a secure cart and opens Shopify's checkout page with these items:
        </p>
        <pre style="background-color: #EDE6DA; border: 1px solid #D8D2C8; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 13px; line-height: 1.5; overflow-x: auto; margin-bottom: 24px; white-space: pre-wrap; color: #2C2622;">${itemsDescription}\n\nTotal: ${formatCurrency(totalAmount)}</pre>
        <div style="display: flex; gap: 16px; justify-content: flex-end;">
          <button id="modal-close" style="background: none; border: 1px solid rgba(44, 38, 34, 0.3); color: #2C2622; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Back</button>
          <button id="modal-checkout" style="background-color: #a27b5c; border: none; color: #F4F1EC; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600;">Complete Order</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(alertModal);
    
    document.getElementById('modal-close').addEventListener('click', () => {
      alertModal.remove();
      updateCartUI();
    });
    
    document.getElementById('modal-checkout').addEventListener('click', () => {
      alertModal.remove();
      cart = [];
      saveCart();
      closeCartDrawer();
      alert('Order simulated successfully! Thank you.');
    });
  }, 500);
}

// ─── INITIALIZATION ───

document.addEventListener('DOMContentLoaded', () => {
  // Bind standard layout elements
  const cartToggleBtn = document.getElementById('cart-toggle');
  const cartCloseBtn = document.getElementById('cart-close');
  const cartOverlay = document.getElementById('cart-overlay');
  const checkoutBtn = document.getElementById('checkout-btn');
  const cartItemsContainer = document.getElementById('cart-items-container');

  if (cartToggleBtn) cartToggleBtn.addEventListener('click', openCartDrawer);
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCartDrawer);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);
  if (checkoutBtn) checkoutBtn.addEventListener('click', proceedToCheckout);

  // Cart actions event delegation
  if (cartItemsContainer) {
    cartItemsContainer.addEventListener('click', (e) => {
      const btn = e.target;
      const itemId = btn.getAttribute('data-id');
      if (!itemId) return;

      if (btn.classList.contains('inc-qty-btn')) {
        updateItemQuantity(itemId, 1);
      } else if (btn.classList.contains('dec-qty-btn')) {
        updateItemQuantity(itemId, -1);
      } else if (btn.classList.contains('cart-item-remove')) {
        removeItemFromCart(itemId);
      }
    });
  }

  // Listen to storage sync from other pages
  window.addEventListener('storage', () => {
    updateCartUI();
  });

  // Mobile catalog filter dropdown toggle
  const filterToggle = document.getElementById('mobile-filter-toggle');
  const catalogSidebar = document.getElementById('catalog-sidebar');
  if (filterToggle && catalogSidebar) {
    filterToggle.addEventListener('click', () => {
      const isExpanded = catalogSidebar.classList.toggle('active');
      filterToggle.setAttribute('aria-expanded', isExpanded);
    });
  }

  // Parse URL search parameters on load
  const urlParams = new URLSearchParams(window.location.search);
  const materialParam = urlParams.get('material');
  if (materialParam) {
    activeFilters.material = materialParam;
  }
  const searchParam = urlParams.get('search');
  if (searchParam) {
    activeFilters.search = searchParam;
    const searchInput = document.getElementById('search-catalog');
    if (searchInput) searchInput.value = searchParam;
  }

  // Load and render
  updateCartUI();
  renderProductsGrid();
  bindFilterEvents();

  // Highlight correct material pill in sidebar
  if (materialParam) {
    const pills = document.querySelectorAll('.material-pill');
    pills.forEach(p => {
      p.classList.toggle('active', p.dataset.value === materialParam);
    });
  }

  fetchProductsFromShopify();
});
