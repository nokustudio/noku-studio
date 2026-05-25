/**
 * Noku Studio — All Products Page Controller
 * Handles dynamic fetching from Shopify Storefront API, local fallbacks,
 * client-side search/filtering, and persistent cart synchronization.
 */

// ─── SHOPIFY STOREFRONT API CREDENTIALS ───
const SHOPIFY_CONFIG = {
  storefrontAccessToken: '7b62ad5d7d665bebe383ff2d3c36c0b0',
  shopDomain: '6b5390-f8.myshopify.com',
  apiVersion: '2024-04',
  currencySymbol: '₹',
  defaultPrice: 24500
};

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
    title: "Lounge Chair",
    handle: "lounge-chair",
    description: "Celebrating mid-century restraint and fine craftsmanship. An elegant visual weight with refined lines.",
    productType: "chair",
    tags: ["chair", "lounge", "fabric", "leather"],
    collections: { edges: [{ node: { title: "Of Stillness", handle: "of-stillness" } }] },
    featuredImage: {
      url: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c7724c1a8d27260d62288_Noku_ofStillness_Lounge_chair_02.jpeg",
      altText: "Lounge Chair"
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
    title: "Dining Chair",
    handle: "dining-chair",
    description: "Lightweight dining joinery in warm hardwood finishes. Perfect blend of comfort and structural honesty.",
    productType: "chair",
    tags: ["chair", "dining"],
    collections: { edges: [{ node: { title: "Of Stillness", handle: "of-stillness" } }] },
    featuredImage: {
      url: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c99b2583745be7113654a_Noku_ofStillness_Dining_chair_03.jpeg",
      altText: "Dining Chair"
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
    title: "Study Table",
    handle: "modern-study-table",
    description: "Premium solid teak workstation with elegant brass detailing. Built to inspire intent and focus.",
    productType: "table",
    tags: ["table", "study", "brass"],
    collections: { edges: [{ node: { title: "Of Stillness", handle: "of-stillness" } }] },
    featuredImage: {
      url: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c7d6f73c94da715b34a92_Noku_ofStillness_Study_table_03.jpeg",
      altText: "Study Table"
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
    title: "Barstool",
    handle: "barstool",
    description: "A design statement of quiet elegance, wood, and upholstery. Handmade in India.",
    productType: "barstool",
    tags: ["barstool", "leather", "fabric"],
    collections: { edges: [{ node: { title: "Of Stillness", handle: "of-stillness" } }] },
    featuredImage: {
      url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/67cfdbb331dba957c997c00e_5d1622c83584a245197f9005889b2b06_Noku_ofStillness_Barstool_03%20copy.webp",
      altText: "Barstool"
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
    title: "Classic Study Table",
    handle: "classic-study-table",
    description: "Vernacular lines combined with modern ergonomics. Features solid joinery and drawer space.",
    productType: "table",
    tags: ["table", "study"],
    collections: { edges: [{ node: { title: "Of Memories", handle: "of-memories" } }] },
    featuredImage: {
      url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/69c00e7f4ffc4c910059d042_Study%20Table%2019%20C.png",
      altText: "Classic Study Table"
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
    title: "Side Table",
    handle: "side-table",
    description: "Compact design block with elegant, clean lines, ideal as a bedside companion or sofa accompaniment.",
    productType: "side table",
    tags: ["side table", "table"],
    collections: { edges: [{ node: { title: "Of Stillness", handle: "of-stillness" } }] },
    featuredImage: {
      url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/69c00d403fa184eebc59c05c_Side%20Table%2042%20B.png",
      altText: "Side Table"
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
    title: "Lounge Sofa",
    handle: "lounge-sofa",
    description: "Deep, comfortable, and beautifully finished sofa. A warm center point for your living room conversations.",
    productType: "sofa",
    tags: ["sofa", "lounge", "fabric", "leather"],
    collections: { edges: [{ node: { title: "Of Memories", handle: "of-memories" } }] },
    featuredImage: {
      url: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c99b2583745be71136547_Noku_ofStillness_Sofa_grooved_02.jpeg", // reusable quality placeholder
      altText: "Lounge Sofa"
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
    title: "Upholstered Bench",
    handle: "upholstered-bench",
    description: "Elegant seating block with options for premium fabrics or leather, detailed with fine line stitch work.",
    productType: "bench",
    tags: ["bench", "fabric", "leather"],
    collections: { edges: [{ node: { title: "Of Memories", handle: "of-memories" } }] },
    featuredImage: {
      url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/69c00d41cd825187ac22552f_Chair%2042%20A.png", // fallback visual
      altText: "Upholstered Bench"
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
      url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/69c00dd8733454553abc99bc_Bed%2042%20A.png",
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
    title: "Poster Bed",
    handle: "poster-bed",
    description: "Timeless four-poster bed framing your rest. Built in solid teak and ash structures.",
    productType: "bed",
    tags: ["bed"],
    collections: { edges: [{ node: { title: "Of Stillness", handle: "of-stillness" } }] },
    featuredImage: {
      url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/69c00dd8733454553abc99bc_Bed%2042%20A.png", // fallback visual
      altText: "Poster Bed"
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
    title: "Round Dining Table",
    handle: "round-dining-table",
    description: "Centring dining spaces with a soft, round circular form. Features rich grain patterns in solid wood.",
    productType: "table",
    tags: ["table", "dining"],
    collections: { edges: [{ node: { title: "Of Exploration", handle: "of-exploration" } }] },
    featuredImage: {
      url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/69c00d403fa184eebc59c05c_Side%20Table%2042%20B.png", // fallback
      altText: "Round Dining Table"
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

    const fetched = result.data?.products?.edges?.map(edge => edge.node) || [];
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
    const card = document.createElement('div');
    card.className = `product-card reveal-el is-revealed`; // reveal immediately
    card.style.animationDelay = `${(idx % 4) * 0.1}s`;
    
    const firstVariant = p.variants?.edges?.[0]?.node;
    const displayPrice = firstVariant ? parseFloat(firstVariant.price.amount) : SHOPIFY_CONFIG.defaultPrice;
    const displayMaterial = firstVariant ? firstVariant.title : 'Solid Wood Finish';
    const defaultImage = p.featuredImage?.url || (firstVariant && firstVariant.image ? firstVariant.image.url : 'https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c99b2583745be71136547_Noku_ofStillness_Sofa_grooved_02.jpeg');
    const defaultVariantId = firstVariant ? firstVariant.id : `gid://shopify/ProductVariant/fallback-${p.handle}`;

    card.innerHTML = `
      <a href="product.html?handle=${p.handle}" class="product-card-img-wrap">
        <img src="${defaultImage}" alt="${p.title}" loading="lazy">
      </a>
      <div class="product-card-body">
        <div class="product-card-header">
          <a href="product.html?handle=${p.handle}" class="product-name">${p.title}</a>
          <span class="product-materials">${displayMaterial}</span>
        </div>
        <div class="product-buy-row">
          <span class="product-price">${formatCurrency(displayPrice)}</span>
          <button class="product-add-to-cart-btn" 
                  data-id="${p.id}" 
                  data-variant-id="${defaultVariantId}"
                  data-title="${p.title}" 
                  data-price="${displayPrice}" 
                  data-image="${defaultImage}"
                  data-materials="${displayMaterial}"
                  aria-label="Add ${p.title} to Cart">
            Add to Cart
          </button>
        </div>
      </div>
    `;
    
    // Bind Add to Cart action
    const btn = card.querySelector('.product-add-to-cart-btn');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
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

function updateCartUI() {
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartCountBadge = document.getElementById('cart-count-badge');
  const cartSubtotalEl = document.getElementById('cart-subtotal');
  const checkoutBtn = document.getElementById('checkout-btn');

  if (!cartItemsContainer) return;

  // Sync state
  cart = JSON.parse(localStorage.getItem('noku_cart')) || [];

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
        <img src="${item.image}" alt="${item.title}">
      </div>
      <div class="cart-item-details">
        <h4 class="cart-item-name">${item.title}</h4>
        <span class="cart-item-variants">${item.options.wood && item.options.cushion ? `${item.options.wood} / ${item.options.cushion}` : (item.options.variantTitle || '')}</span>
        <span class="cart-item-price">${formatCurrency(item.price)}</span>
        <div class="cart-item-actions">
          <div class="quantity-control">
            <button class="qty-btn dec-qty-btn" data-id="${item.id}" aria-label="Decrease quantity">-</button>
            <span class="qty-val">${item.quantity}</span>
            <button class="qty-btn inc-qty-btn" data-id="${item.id}" aria-label="Increase quantity">+</button>
          </div>
          <button class="cart-item-remove" data-id="${item.id}">Remove</button>
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
      console.log('Redirecting to Shopify Checkout:', checkoutUrl);
      window.location.href = checkoutUrl;
      return;
    }
  } catch (err) {
    console.warn("Shopify Checkout mutation failed. Running simulation fallback.", err);
  }

  // Fallback Simulation Drawer Modal
  setTimeout(() => {
    const itemsDescription = cart.map(item => 
      `- ${item.title}: Qty ${item.quantity} @ ${formatCurrency(item.price)}`
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

  // Mobile navigation menu toggle
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
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
