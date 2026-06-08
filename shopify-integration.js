/**
 * Shopify Headless Storefront API Integration
 * Noku Studio Barstool Landing Page
 */

// ─── SHOPIFY STOREFRONT API CREDENTIALS ───
// REPLACE THESE WITH YOUR ACTUAL SHOPIFY CREDENTIALS TO CONNECT LIVE INVENTORY
const SHOPIFY_CONFIG = {
  storefrontAccessToken: '7b62ad5d7d665bebe383ff2d3c36c0b0',
  shopDomain: '6b5390-f8.myshopify.com',
  apiVersion: '2024-04',
  productHandle: 'barstool', // Shopify product handle
  currencySymbol: '₹',
  defaultPrice: 24500
};

// Display-only products list (from noku_products.xlsx)
const DISPLAY_ONLY_HANDLES = [
  'dining-table',
  'sofa-2',
  'lounge-sofa',
  'poster-bed',
  'rod-bed-with-curved-headboard',
  'round-dining-table'
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
    "dining table",
    "dining-table",
    "grooved sofa",
    "grooved-sofa",
    "lounge sofa",
    "lounge-sofa",
    "poster bed",
    "poster-bed",
    "rod bed",
    "rod-bed",
    "round dining table",
    "round-dining-table"
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
    "40589461749818", "41286332940346", "41286333497402", "40593555587130", "40593555619898", "41221041684538", "40593555718202", "41221044699194", "40593555685434", "40589542981690",
    "40593555521594", "41221044666426", "41221043814458", "41221043847226", "41221043945530", "41221043912762", "41221044961338", "41221043879994", "41221043716154", "41221043748922",
    "41221044928570", "41221043552314", "41221043585082", "41221043683386", "41221043650618", "41221044895802", "41221043617850", "41221043454010", "41221043486778", "41221044863034",
    "40573731110970", "40612651040826", "40612651073594", "40612651106362", "40612651139130", "40612651237434", "40612651270202", "41241721045050", "41241721471034", "41241721503802",
    "41241721536570", "41241721569338", "41241721602106", "41241721667642", "41241721700410", "41241721765946", "41241721143354", "41241721176122", "41241721208890", "41241721241658",
    "41241721274426", "41241721339962", "41241721372730", "41241721438266", "40589458997306", "40593536712762", "41221039456314", "41221038014522", "41221038080058", "41221039489082",
    "41221038047290", "41221039521850", "41221038932026", "41221038964794", "41221039849530", "41221039063098", "41221039128634", "41221039882298", "41221039095866", "41221039915066",
    "41221038637114", "41221038669882", "41221039751226", "41221038768186", "41221038833722", "41221039783994", "41221038800954", "41221039816762", "40589542391866", "41241712951354",
    "41241712918586", "40583460683834", "41241713999930", "41241713967162"
  ];
  
  if (item.variantId) {
    const vIdString = String(item.variantId);
    for (const id of displayVariantIds) {
      if (vIdString.includes(id)) return true;
    }
  }
  
  return false;
}

// State of variants fetched from Shopify Storefront API
let shopifyProductVariants = [];
let isShopifyConnected = false;

// Featured products data from Shopify Storefront API (Phase 2)
let featuredProductsData = {};

// Fallback registry for featured products (Phase 2)
const FEATURED_PRODUCTS_FALLBACK = {
  'sofa-2': {
    title: 'Grooved Sofa',
    price: 81000,
    variantId: 'gid://shopify/ProductVariant/mock-sofa-default',
    image: 'https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c99b2583745be71136547_Noku_ofStillness_Sofa_grooved_02.jpeg',
    variantTitle: 'Solid Walnut / Belgian Linen'
  },
  'lounge-chair': {
    title: 'Lounge Chair',
    price: 49500,
    variantId: 'gid://shopify/ProductVariant/mock-lounge-default',
    image: 'https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c7724c1a8d27260d62288_Noku_ofStillness_Lounge_chair_02.jpeg',
    variantTitle: 'Solid Teak / Cane / Linen'
  },
  'dining-chair': {
    title: 'Dining Chair',
    price: 11500,
    variantId: 'gid://shopify/ProductVariant/mock-dining-default',
    image: 'https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c99b2583745be7113654a_Noku_ofStillness_Dining_chair_03.jpeg',
    variantTitle: 'Solid Walnut / Natural Fabric'
  },
  'modern-study-table': {
    title: 'Study Table',
    price: 35000,
    variantId: 'gid://shopify/ProductVariant/mock-study-default',
    image: 'https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c7d6f73c94da715b34a92_Noku_ofStillness_Study_table_03.jpeg',
    variantTitle: 'Solid Teak / Brass Details'
  },
  'barstool': {
    title: 'Barstool',
    price: 21000,
    variantId: 'gid://shopify/ProductVariant/40585660366906',
    image: 'https://cdn.prod.website-files.com/667fb0113927090bb47059e6/67cfdbb331dba957c997c00e_5d1622c83584a245197f9005889b2b06_Noku_ofStillness_Barstool_03%20copy.webp',
    variantTitle: 'Teak / Leather - Cognac'
  },
  'classic-study-table': {
    title: 'Classic Study Table',
    price: 41500,
    variantId: 'gid://shopify/ProductVariant/40573722853434',
    image: 'https://cdn.prod.website-files.com/667fb0113927090bb47059e6/69c00e7f4ffc4c910059d042_Study%20Table%2019%20C.png',
    variantTitle: 'Solid Teak'
  },
  'side-table': {
    title: 'Side Table',
    price: 21000,
    variantId: 'gid://shopify/ProductVariant/40583459569722',
    image: 'https://cdn.prod.website-files.com/667fb0113927090bb47059e6/69c00d403fa184eebc59c05c_Side%20Table%2042%20B.png',
    variantTitle: 'Solid Teak'
  },
  'lounge-sofa': {
    title: 'Lounge Sofa',
    price: 119500,
    variantId: 'gid://shopify/ProductVariant/40573731110970',
    image: 'https://cdn.shopify.com/s/files/1/0565/9954/3866/files/Noku_ofStillness_Sofa_04.webp?v=1769765673',
    variantTitle: 'Teak / Leather - Cognac'
  },
  'upholstered-bench': {
    title: 'Upholstered Bench',
    price: 25500,
    variantId: 'gid://shopify/ProductVariant/40583462649914',
    image: 'https://cdn.shopify.com/s/files/1/0565/9954/3866/files/DSC09382.webp?v=1769766216',
    variantTitle: 'Teak / Leather - Cognac'
  },
  'rod-bed-with-curved-headboard': {
    title: 'Rod Bed',
    price: 81000,
    variantId: 'gid://shopify/ProductVariant/40589542391866',
    image: 'https://cdn.prod.website-files.com/667fb0113927090bb47059e6/69c00dd8733454553abc99bc_Bed%2042%20A.png',
    variantTitle: 'Solid Teak'
  },
  'poster-bed': {
    title: 'Poster Bed',
    price: 142000,
    variantId: 'gid://shopify/ProductVariant/40589458997306',
    image: 'https://cdn.prod.website-files.com/667fb0113927090bb47059e6/69c00dd8733454553abc99bc_Bed%2042%20A.png',
    variantTitle: 'Teak / Leather - Cognac'
  }
};

// Full Fallback catalog from products.js
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
            id: "gid://shopify/ProductVariant/mock-sofa-default",
            title: "Solid Walnut / Belgian Linen",
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
            id: "gid://shopify/ProductVariant/mock-lounge-default",
            title: "Solid Teak / Cane / Linen",
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
            id: "gid://shopify/ProductVariant/mock-dining-default",
            title: "Solid Walnut / Natural Fabric",
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
            id: "gid://shopify/ProductVariant/mock-study-default",
            title: "Solid Teak / Brass Details",
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
            title: "Solid Teak",
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
            title: "Solid Teak",
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
      url: "https://cdn.shopify.com/s/files/1/0565/9954/3866/files/Noku_ofStillness_Sofa_04.webp?v=1769765673",
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
      url: "https://cdn.shopify.com/s/files/1/0565/9954/3866/files/DSC09382.webp?v=1769766216",
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
            title: "Solid Teak",
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
      url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/69c00dd8733454553abc99bc_Bed%2042%20A.png",
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
  }
];

// ─── PERSISTENT LOCAL STORAGE CART ───
let cart = JSON.parse(localStorage.getItem('noku_cart')) || [];

// Save cart to LocalStorage
function saveCart() {
  localStorage.setItem('noku_cart', JSON.stringify(cart));
  updateCartUI();
  // Sync to other tabs/pages
  window.dispatchEvent(new Event('storage'));
}

// ─── SHOPIFY GRAPHQL FETCH CLIENT ───
async function fetchFromShopify(query, variables = {}) {
  const { storefrontAccessToken, shopDomain, apiVersion } = SHOPIFY_CONFIG;
  
  // Check if credentials are still placeholder
  if (
    storefrontAccessToken.includes('YOUR_STOREFRONT_') ||
    shopDomain.includes('your-store-name')
  ) {
    return null;
  }
  
  const url = `https://${shopDomain}/api/${apiVersion}/graphql.json`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken
      },
      body: JSON.stringify({ query, variables })
    });
    
    if (!response.ok) {
      console.warn('Shopify API response error:', response.statusText);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch from Shopify Storefront API:', error);
    return null;
  }
}

// Fetch variants data from Shopify on load
async function loadShopifyProductData() {
  const query = `
    query getProductAndFeatured($handle: String!) {
      product(handle: $handle) {
        id
        title
        variants(first: 100) {
          edges {
            node {
              id
              title
              price {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
              image {
                url
              }
            }
          }
        }
      }
      sofa: product(handle: "sofa-2") {
        id
        title
        featuredImage {
          url
        }
        variants(first: 10) {
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
            }
          }
        }
      }
      loungeChair: product(handle: "lounge-chair") {
        id
        title
        featuredImage {
          url
        }
        variants(first: 10) {
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
            }
          }
        }
      }
      diningChair: product(handle: "dining-chair") {
        id
        title
        featuredImage {
          url
        }
        variants(first: 10) {
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
            }
          }
        }
      }
      studyTable: product(handle: "modern-study-table") {
        id
        title
        featuredImage {
          url
        }
        variants(first: 10) {
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
            }
          }
        }
      }
      barstool: product(handle: "barstool") {
        id
        title
        variants(first: 10) {
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
            }
          }
        }
      }
      classicStudyTable: product(handle: "classic-study-table") {
        id
        title
        variants(first: 10) {
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
            }
          }
        }
      }
      sideTable: product(handle: "side-table") {
        id
        title
        variants(first: 10) {
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
            }
          }
        }
      }
      loungeSofa: product(handle: "lounge-sofa") {
        id
        title
        variants(first: 10) {
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
            }
          }
        }
      }
      upholsteredBench: product(handle: "upholstered-bench") {
        id
        title
        variants(first: 10) {
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
            }
          }
        }
      }
      rodBed: product(handle: "rod-bed-with-curved-headboard") {
        id
        title
        variants(first: 10) {
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
            }
          }
        }
      }
      posterBed: product(handle: "poster-bed") {
        id
        title
        variants(first: 10) {
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
            }
          }
        }
      }
    }
  `;
  
  const data = await fetchFromShopify(query, { handle: SHOPIFY_CONFIG.productHandle });
  
  console.log('Shopify Storefront API Response:', data);
  
  if (data && data.data && data.data.product) {
    shopifyProductVariants = data.data.product.variants.edges.map(edge => edge.node);
    isShopifyConnected = true;
    console.log('Successfully connected to Shopify Storefront API. Loaded product variants.');
    
    // Store featured products data
    featuredProductsData = {
      'sofa-2': data.data.sofa,
      'lounge-chair': data.data.loungeChair,
      'dining-chair': data.data.diningChair,
      'modern-study-table': data.data.studyTable,
      'barstool': data.data.barstool,
      'classic-study-table': data.data.classicStudyTable,
      'side-table': data.data.sideTable,
      'lounge-sofa': data.data.loungeSofa,
      'upholstered-bench': data.data.upholsteredBench,
      'rod-bed-with-curved-headboard': data.data.rodBed,
      'poster-bed': data.data.posterBed
    };
    
    // Sync local carousel images with live Shopify CDN URLs
    updateCarouselImagesToShopify();
    
    // Update featured products UI
    updateFeaturedProductsUI();
  } else {
    if (!data) {
      console.warn('Shopify API connection failed. Check your shop domain, network, or access token.');
    } else if (data.errors) {
      console.error('Shopify API returned GraphQL errors:', data.errors);
    } else if (data.data && !data.data.product) {
      console.warn(`Shopify connected, but product with handle "${SHOPIFY_CONFIG.productHandle}" was not found.`);
    }
    console.log('Using simulated local inventory.');
    
    // Ensure featured products UI runs in simulation/fallback mode
    updateFeaturedProductsUI();
  }
  // Dispatch custom event to notify secondary landing page that product data is loaded
  window.dispatchEvent(new CustomEvent('shopifyloaded'));
}


// Sync local carousel variant images to active Shopify CDN URLs
function updateCarouselImagesToShopify() {
  if (!isShopifyConnected || shopifyProductVariants.length === 0) return;
  
  const carouselTrack = document.querySelector('#configurator .carousel-track, .narrative-carousel-track');
  if (!carouselTrack) return;
  
  const cards = document.querySelectorAll('.carousel-card');
  const woodLabel = document.querySelector('.selected-wood-label');
  const wood = woodLabel ? woodLabel.textContent.trim() : 'Teak';
  
  cards.forEach(card => {
    const cushion = card.dataset.cushion;
    const formattedCushion = cushion.charAt(0).toUpperCase() + cushion.slice(1);
    
    const variant = getProductVariant(wood, formattedCushion);
    if (variant && variant.image) {
      const imgWrap = card.querySelector('.carousel-card-img-wrap');
      if (imgWrap) {
        let img = imgWrap.querySelector('img');
        if (!img) {
          img = document.createElement('img');
          imgWrap.appendChild(img);
        }
        if (img.src !== variant.image) {
          img.src = variant.image;
          img.alt = `Barstool ${wood} ${cushion}`;
        }
      }
    }
  });
  
  // Sync the highlighted card image with the scatter parallax image
  const activeCard = document.querySelector('.carousel-card.highlighted');
  if (activeCard) {
    const activeCardImg = activeCard.querySelector('.carousel-card-img-wrap img');
    const scatterImg = document.querySelector('.radial-scatter__item.barstool-item img');
    if (scatterImg) {
      if (activeCardImg) {
        scatterImg.src = activeCardImg.src;
        scatterImg.style.display = '';
      } else {
        scatterImg.src = '';
        scatterImg.style.display = 'none';
      }
    }
  }
}

// Request a downscaled variant from the Shopify CDN so we never load the multi-MP
// originals (the raw files are ~4000x6000px). cdn.shopify.com honours width/height/crop
// transform params, returning a properly sized image. Non-Shopify hosts are returned as-is.
function sizeShopifyImage(url, width, height) {
  if (!url) return url;
  try {
    const u = new URL(url, window.location.href);
    if (u.hostname.includes('cdn.shopify.com') || u.hostname.includes('cdn.shopifycdn')) {
      u.searchParams.set('width', String(width));
      if (height) {
        u.searchParams.set('height', String(height));
        u.searchParams.set('crop', 'center');
      }
      return u.toString();
    }
  } catch (e) { /* malformed URL — fall through */ }
  return url;
}

// Inject (or update) the card image inside the placeholder wrap. The <img> is created
// on demand so the markup ships as an empty placeholder and only renders an image once
// Shopify data resolves.
function setFeaturedCardImage(card, imageSrc, altText) {
  const imgWrap = card.querySelector('.product-card-img-wrap');
  if (!imgWrap) return;

  if (!imageSrc) {
    const existing = imgWrap.querySelector('img');
    if (existing) existing.remove(); // keep clean placeholder when nothing resolves
    return;
  }

  const sized = sizeShopifyImage(imageSrc, 800, 1000);
  let img = imgWrap.querySelector('img');
  if (!img) {
    img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 800;
    img.height = 1000;
    imgWrap.appendChild(img);
  }
  if (img.getAttribute('src') !== sized) img.src = sized;
  img.alt = altText || '';
}

// Helper to find the best matching variant from a list of Shopify variants based on text description
function findBestMatchingVariant(variants, originalMaterials) {
  if (!variants || variants.length === 0 || !originalMaterials) return null;

  // Clean and split the query into lowercase alphanumeric words
  const cleanQuery = originalMaterials.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const queryTokens = cleanQuery.split(/\s+/).filter(t => t.length > 0);
  
  // Ignore common helper words
  const stopWords = new Set(['and', 'or', 'with', 'a', 'of', 'solid', 'the', '/']);
  const queryKeywords = queryTokens.filter(t => !stopWords.has(t));

  if (queryKeywords.length === 0) return variants[0];

  let bestVariant = null;
  let maxMatchCount = -1;

  for (const variant of variants) {
    const variantTitleClean = variant.title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const variantTokens = variantTitleClean.split(/\s+/).filter(t => t.length > 0 && !stopWords.has(t));
    
    // Count matches
    let matchCount = 0;
    for (const kw of queryKeywords) {
      if (variantTokens.includes(kw)) {
        matchCount++;
      }
    }

    if (matchCount > maxMatchCount) {
      maxMatchCount = matchCount;
      bestVariant = variant;
    } else if (matchCount === maxMatchCount && bestVariant) {
      // Tie breaker: prefer the one where variant title has shorter length (more concise match)
      const currentTokens = bestVariant.title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length > 0 && !stopWords.has(t));
      if (variantTokens.length < currentTokens.length) {
        bestVariant = variant;
      }
    }
  }

  return maxMatchCount > 0 ? bestVariant : variants[0];
}

// Update Featured Product Cards pricing and images from Shopify Storefront API
function updateFeaturedProductsUI() {
  const cards = document.querySelectorAll('.product-card[data-handle]');
  
  cards.forEach(card => {
    const handle = card.getAttribute('data-handle');
    let title = '';
    let price = 0;
    let imageSrc = '';
    let variantId = '';
    let variantTitle = '';
    
    // Store original materials text to ensure we don't lose it upon repeated calls
    const materialsEl = card.querySelector('.product-materials');
    let originalMaterials = card.getAttribute('data-original-materials');
    if (!originalMaterials && materialsEl) {
      originalMaterials = materialsEl.textContent.trim();
      card.setAttribute('data-original-materials', originalMaterials);
    }
    
    const liveProduct = featuredProductsData[handle];
    if (isShopifyConnected && liveProduct) {
      title = liveProduct.title;
      
      const variants = liveProduct.variants?.edges.map(edge => edge.node) || [];
      const bestVariant = findBestMatchingVariant(variants, originalMaterials);
      
      if (bestVariant) {
        price = parseFloat(bestVariant.price.amount);
        variantId = bestVariant.id;
        variantTitle = bestVariant.title;
        imageSrc = bestVariant.image ? bestVariant.image.url : (liveProduct.featuredImage?.url || '');
      } else {
        const firstVariant = liveProduct.variants?.edges[0]?.node;
        if (firstVariant) {
          price = parseFloat(firstVariant.price.amount);
          variantId = firstVariant.id;
          variantTitle = firstVariant.title;
        }
        imageSrc = liveProduct.featuredImage?.url
          || (firstVariant && firstVariant.image ? firstVariant.image.url : '');
      }
      
      // Save matched variant credentials to DOM
      card.setAttribute('data-variant-id', variantId);
      card.setAttribute('data-variant-price', price.toString());
      card.setAttribute('data-variant-title', variantTitle);
      card.setAttribute('data-variant-image', imageSrc);
    } else {
      const fallback = FEATURED_PRODUCTS_FALLBACK[handle];
      if (fallback) {
        title = fallback.title;
        price = fallback.price;
        variantId = fallback.variantId;
        variantTitle = fallback.variantTitle;
        // Intentionally NOT using fallback.image here: those are the multi-MP Webflow
        // originals that caused the scroll re-decode flashing. The featured card image
        // is sourced only from the live Shopify CDN; offline it stays a clean placeholder.
        imageSrc = '';
        
        // Save fallback credentials to DOM
        card.setAttribute('data-variant-id', variantId);
        card.setAttribute('data-variant-price', price.toString());
        card.setAttribute('data-variant-title', variantTitle);
        card.setAttribute('data-variant-image', fallback.image || '');
      }
    }
    
    const nameEl = card.querySelector('.product-name');
    if (nameEl && title) {
      nameEl.textContent = title;
    }

    const priceEl = card.querySelector('.product-price');
    if (priceEl) {
      priceEl.textContent = formatCurrency(price);
    }

    const materialsElAfter = card.querySelector('.product-materials');
    if (materialsElAfter && variantTitle) {
      materialsElAfter.textContent = variantTitle;
    }

    // Inject the Shopify image into the placeholder container (sized via CDN params)
    setFeaturedCardImage(card, imageSrc, title);

    // Replace Add to Cart button with Inquire link for display-only items
    const buyRow = card.querySelector('.product-buy-row');
    if (buyRow) {
      const isDisplay = isDisplayOnly(handle);
      const addBtn = buyRow.querySelector('.product-add-to-cart-btn');
      const inquireBtn = buyRow.querySelector('.product-inquire-btn');
      
      if (isDisplay) {
        if (addBtn) addBtn.remove();
        if (!inquireBtn) {
          const newInquireBtn = document.createElement('a');
          newInquireBtn.className = 'product-inquire-btn';
          newInquireBtn.href = `product.html?handle=${handle}&inquire=true`;
          newInquireBtn.textContent = 'Inquire';
          buyRow.appendChild(newInquireBtn);
        }
      } else {
        if (inquireBtn) inquireBtn.remove();
        if (!addBtn) {
          const newAddBtn = document.createElement('button');
          newAddBtn.className = 'product-add-to-cart-btn';
          newAddBtn.setAttribute('aria-label', `Add ${title || 'Item'} to Cart`);
          newAddBtn.textContent = 'Add to Cart';
          buyRow.appendChild(newAddBtn);
        }
      }
    }
  });
  
  // Dispatch a custom event so script.js can re-center the featured products carousel
  window.dispatchEvent(new CustomEvent('featuredproductsloaded'));
}

// Add a featured product item to the cart
function addFeaturedItemToCart(handle) {
  if (isDisplayOnly(handle)) {
    alert("This item is for display only and cannot be added to the cart.");
    return;
  }
  
  const card = document.querySelector(`.product-card[data-handle="${handle}"]`);
  let title = '';
  let price = 0;
  let variantId = '';
  let variantTitle = '';
  let imageSrc = '';
  
  const liveProduct = featuredProductsData[handle];
  if (isShopifyConnected && liveProduct) {
    title = liveProduct.title;
    
    // Attempt to read matched variant details from card's data attributes
    if (card && card.getAttribute('data-variant-id')) {
      variantId = card.getAttribute('data-variant-id');
      price = parseFloat(card.getAttribute('data-variant-price') || '0');
      variantTitle = card.getAttribute('data-variant-title') || '';
      imageSrc = card.getAttribute('data-variant-image') || '';
    } else {
      // Fallback matching if data attributes aren't present yet
      const materialsEl = card ? card.querySelector('.product-materials') : null;
      const originalMaterials = card ? (card.getAttribute('data-original-materials') || (materialsEl ? materialsEl.textContent.trim() : '')) : '';
      const variants = liveProduct.variants?.edges.map(e => e.node) || [];
      const bestVariant = findBestMatchingVariant(variants, originalMaterials);
      
      if (bestVariant) {
        price = parseFloat(bestVariant.price.amount);
        variantId = bestVariant.id;
        variantTitle = bestVariant.title;
        imageSrc = bestVariant.image ? bestVariant.image.url : (liveProduct.featuredImage?.url || '');
      }
    }
  } else {
    // Offline simulation mode
    const fallback = FEATURED_PRODUCTS_FALLBACK[handle];
    if (fallback) {
      title = fallback.title;
      price = fallback.price;
      variantId = fallback.variantId;
      variantTitle = fallback.variantTitle;
      imageSrc = fallback.image;
    }
  }
  
  if (!variantId) return;
  
  const cartItemId = `featured-${handle}`;
  const existingItemIndex = cart.findIndex(item => item.id === cartItemId || item.variantId === variantId);
  
  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += 1;
  } else {
    if (!imageSrc) {
      const img = card ? card.querySelector('.product-card-img-wrap img') : null;
      if (img) imageSrc = img.src;
    }
    
    cart.push({
      id: cartItemId,
      title: title,
      variantId: variantId,
      price: price,
      quantity: 1,
      options: {
        variantTitle: variantTitle
      },
      image: sizeShopifyImage(imageSrc, 200, 250)
    });
  }
  
  saveCart();
  openCartDrawer();
}


/**
 * Dynamic Collection Products Renderer
 * Fetches all products (live from Shopify or from FALLBACK_PRODUCTS),
 * filters them by the specified collection handle (e.g. 'of-stillness' or 'of-memories'),
 * and renders them into the specified grid container.
 */
async function renderCollectionProducts(collectionHandle, gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  grid.innerHTML = '<div class="loader-placeholder" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--muted); font-family: var(--font-body);">Resolving collection pieces...</div>';

  let products = [];

  // Try to fetch live from Shopify Storefront API directly
  try {
    const query = `
      query getCollectionProducts {
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
                  }
                }
              }
            }
          }
        }
      }
    `;
    const data = await fetchFromShopify(query);
    if (data && data.data && data.data.products) {
      const fetched = data.data.products.edges.map(edge => edge.node);
      products = fetched.filter(p => {
        // Exclude draft/test products (no image, zero-priced variants, or "draft"/"test" in title)
        const hasNoImage = !p.featuredImage || !p.featuredImage.url;
        const allVariantsZeroPrice = p.variants?.edges?.length > 0 && 
          p.variants.edges.every(vEdge => parseFloat(vEdge.node.price?.amount || '0') === 0);
        const hasDraftTitle = p.title && (p.title.toLowerCase().includes('draft') || p.title.toLowerCase().includes('test'));
        
        if (hasNoImage || allVariantsZeroPrice || hasDraftTitle) {
          return false;
        }

        return p.collections?.edges?.some(edge => {
          const h = edge.node.handle.toLowerCase();
          const t = edge.node.title.toLowerCase();
          const target = collectionHandle.toLowerCase();
          return h === target || 
                 h.replace(/-/g, '') === target.replace(/-/g, '') ||
                 t.replace(/\s+/g, '-').includes(target) ||
                 t.replace(/\s+/g, '').includes(target.replace(/-/g, ''));
        });
      });
      console.log(`Resolved ${products.length} live products for collection "${collectionHandle}".`);
    }
  } catch (err) {
    console.warn("Shopify collection fetch failed. Falling back to local data.", err);
  }

  // Fall back to local catalog if offline or Shopify fetch returned nothing
  if (products.length === 0) {
    products = FALLBACK_PRODUCTS.filter(p => 
      p.collections?.edges?.some(edge => {
        const h = edge.node.handle.toLowerCase();
        const t = edge.node.title.toLowerCase();
        const target = collectionHandle.toLowerCase();
        return h === target || 
               h.replace(/-/g, '') === target.replace(/-/g, '') ||
               t.replace(/\s+/g, '-').includes(target) ||
               t.replace(/\s+/g, '').includes(target.replace(/-/g, ''));
      })
    );
    console.log(`Resolved ${products.length} fallback products for collection "${collectionHandle}".`);
  }

  // Clear placeholder and render products
  grid.innerHTML = '';

  if (products.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding: 40px; color: var(--muted); font-family: var(--font-body);">No pieces currently available in this collection.</div>';
    return;
  }

  products.forEach((p, idx) => {
    const card = document.createElement('a');
    card.href = `product.html?handle=${p.handle}`;
    card.className = `gcard reveal-el is-revealed`;
    card.style.animationDelay = `${(idx % 4) * 0.1}s`;
    card.setAttribute('data-handle', p.handle);

    const firstVariant = p.variants?.edges?.[0]?.node;
    const price = firstVariant ? parseFloat(firstVariant.price.amount) : SHOPIFY_CONFIG.defaultPrice;
    const defaultVariantId = firstVariant ? firstVariant.id : `gid://shopify/ProductVariant/fallback-${p.handle}`;
    
    // Format currency to Indian Rupees format
    const displayPrice = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);

    const displayMaterial = firstVariant ? firstVariant.title : (p.tags ? p.tags.join(' / ') : 'Solid Hardwood');
    const imageUrl = p.featuredImage?.url || 'https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c99b2583745be71136547_Noku_ofStillness_Sofa_grooved_02.jpeg';

    const isDisplay = isDisplayOnly(p.handle);

    card.innerHTML = `
      <div class="gcard__media">
        <div class="gcard__media-inner">
          <img src="${imageUrl}" alt="${p.title}" loading="lazy">
        </div>
        ${isDisplay ? `
        <button class="gcard__add gcard__inquire" 
                data-handle="${p.handle}"
                aria-label="Inquire about ${p.title}">
          Inquire <svg class="ico-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="8 7 17 7 17 16"></polyline></svg>
        </button>
        ` : `
        <button class="gcard__add" 
                data-id="${p.id}" 
                data-variant-id="${defaultVariantId}"
                data-title="${p.title}" 
                data-price="${price}" 
                data-image="${imageUrl}"
                data-materials="${displayMaterial}"
                aria-label="Add ${p.title} to Cart">
          Add <svg class="ico-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="8 7 17 7 17 16"></polyline></svg>
        </button>
        `}
      </div>
      <p class="gcard__cat" style="text-transform: none;">${displayMaterial}</p>
      <h3 class="gcard__name">${p.title}</h3>
      <p class="gcard__price">${displayPrice}</p>
    `;

    // Bind local click events to this dynamic card's Add to Cart / Inquire button
    const btn = card.querySelector('.gcard__add');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      if (isDisplay) {
        window.location.href = `product.html?handle=${p.handle}&inquire=true`;
        return;
      }
      
      addFeaturedItemToCart(p.handle);
    });

    grid.appendChild(card);
  });
}

// Map selected wood + cushion option to Shopify Variant ID and Price
function getProductVariant(woodName, cushionName) {
  // Normalize names for comparison
  const normWood = woodName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normCushion = cushionName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (isShopifyConnected && shopifyProductVariants.length > 0) {
    // Try to find matching variant based on options
    const matched = shopifyProductVariants.find(variant => {
      let matchesWood = false;
      let matchesCushion = false;
      
      variant.selectedOptions.forEach(opt => {
        const name = opt.name.toLowerCase();
        const val = opt.value.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (name.includes('wood') || name.includes('finish') || name.includes('color') || name.includes('material')) {
          if (normWood === 'reclaimedteak') {
            matchesWood = val === 'reclaimedteak' || val.includes('reclaimedteak');
          } else if (normWood === 'teak') {
            matchesWood = (val === 'teak' || val === 'solidteak' || val.includes('teak')) && !val.includes('reclaimed');
          } else {
            matchesWood = val.includes(normWood) || normWood.includes(val);
          }
        } else {
          matchesCushion = val.includes(normCushion) || normCushion.includes(val);
        }
      });
      
      return matchesWood && matchesCushion;
    });
    
    if (matched) {
      return {
        id: matched.id,
        price: parseFloat(matched.price.amount),
        image: matched.image ? matched.image.url : null
      };
    }
  }
  
  // Fallback / Mock variant matching
  return {
    id: `gid://shopify/ProductVariant/mock-barstool-${normWood}-${normCushion}`,
    price: SHOPIFY_CONFIG.defaultPrice,
    image: null
  };
}

// ─── CART MANIPULATION ACTIONS ───

// Add item to cart
function addItemToCart(productTitle, woodFinish, cushionOption, imageUrl) {
  const variant = getProductVariant(woodFinish, cushionOption);
  const cartItemId = `barstool-${woodFinish.toLowerCase()}-${cushionOption.toLowerCase()}`;
  
  const existingItemIndex = cart.findIndex(item => item.id === cartItemId || item.variantId === variant.id);
  
  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += 1;
  } else {
    cart.push({
      id: cartItemId,
      title: productTitle,
      variantId: variant.id,
      price: variant.price,
      quantity: 1,
      options: {
        wood: woodFinish,
        cushion: cushionOption
      },
      image: variant.image || imageUrl
    });
  }
  
  saveCart();
  openCartDrawer();
}

// Update item quantity
function updateItemQuantity(itemId, change) {
  const itemIndex = cart.findIndex(item => item.id === itemId);
  if (itemIndex > -1) {
    cart[itemIndex].quantity += change;
    if (cart[itemIndex].quantity <= 0) {
      cart.splice(itemIndex, 1);
    }
    saveCart();
  }
}

// Remove item from cart
function removeItemFromCart(itemId) {
  const itemIndex = cart.findIndex(item => item.id === itemId);
  if (itemIndex > -1) {
    cart.splice(itemIndex, 1);
    saveCart();
  }
}

// Format currency helper
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
}

// ─── CART UI CONTROLLER ───

const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const cartToggleBtn = document.getElementById('cart-toggle');
const cartCloseBtn = document.getElementById('cart-close');
const cartCountBadge = document.getElementById('cart-count-badge');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartSubtotalEl = document.getElementById('cart-subtotal');
const checkoutBtn = document.getElementById('checkout-btn');

function openCartDrawer() {
  if (cartDrawer && cartOverlay) {
    cartDrawer.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Lock main scroll
  }
}

function closeCartDrawer() {
  if (cartDrawer && cartOverlay) {
    cartDrawer.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Unlock main scroll
  }
}

// Update entire cart UI elements
function updateCartUI() {
  // Enforce cart display policy proactively
  let localCart = JSON.parse(localStorage.getItem('noku_cart')) || [];
  const displayHandles = [
    'dining-table',
    'sofa-2',
    'lounge-sofa',
    'poster-bed',
    'rod-bed-with-curved-headboard',
    'round-dining-table'
];
  const displayTitles = [
    "dining table",
    "dining-table",
    "grooved sofa",
    "grooved-sofa",
    "lounge sofa",
    "lounge-sofa",
    "poster bed",
    "poster-bed",
    "rod bed",
    "rod-bed",
    "round dining table",
    "round-dining-table"
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
    "40589461749818", "41286332940346", "41286333497402", "40593555587130", "40593555619898", "41221041684538", "40593555718202", "41221044699194", "40593555685434", "40589542981690",
    "40593555521594", "41221044666426", "41221043814458", "41221043847226", "41221043945530", "41221043912762", "41221044961338", "41221043879994", "41221043716154", "41221043748922",
    "41221044928570", "41221043552314", "41221043585082", "41221043683386", "41221043650618", "41221044895802", "41221043617850", "41221043454010", "41221043486778", "41221044863034",
    "40573731110970", "40612651040826", "40612651073594", "40612651106362", "40612651139130", "40612651237434", "40612651270202", "41241721045050", "41241721471034", "41241721503802",
    "41241721536570", "41241721569338", "41241721602106", "41241721667642", "41241721700410", "41241721765946", "41241721143354", "41241721176122", "41241721208890", "41241721241658",
    "41241721274426", "41241721339962", "41241721372730", "41241721438266", "40589458997306", "40593536712762", "41221039456314", "41221038014522", "41221038080058", "41221039489082",
    "41221038047290", "41221039521850", "41221038932026", "41221038964794", "41221039849530", "41221039063098", "41221039128634", "41221039882298", "41221039095866", "41221039915066",
    "41221038637114", "41221038669882", "41221039751226", "41221038768186", "41221038833722", "41221039783994", "41221038800954", "41221039816762", "40589542391866", "41241712951354",
    "41241712918586", "40583460683834", "41241713999930", "41241713967162"
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

  if (!cartItemsContainer) return;
  
  // Update badge count
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCountBadge) {
    cartCountBadge.textContent = totalItems;
    cartCountBadge.style.transform = 'scale(1.2)';
    setTimeout(() => {
      cartCountBadge.style.transform = 'scale(1)';
    }, 200);
  }
  
  // Clear item list
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
  
  // Render each item
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
        <span class="cart-item-variants">${item.options.wood && item.options.cushion ? `${item.options.wood} / ${item.options.cushion} Cushion` : (item.options.variantTitle || '')}</span>
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
  
  // Update subtotal
  if (cartSubtotalEl) {
    cartSubtotalEl.textContent = formatCurrency(subtotal);
  }
  
  if (checkoutBtn) {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'Proceed to Checkout';
  }
}

// ─── CHECKOUT FLOW INTEGRATION ───
async function proceedToCheckout() {
  updateCartUI();
  if (cart.length === 0) return;
  
  if (checkoutBtn) {
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Preparing Checkout...';
  }
  
  // If Shopify is connected, use real Checkout API / Cart API
  if (isShopifyConnected) {
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
    
    const lines = cart.map(item => ({
      merchandiseId: item.variantId,
      quantity: item.quantity
    }));
    
    const data = await fetchFromShopify(mutation, { input: { lines } });
    
    if (data && data.data && data.data.cartCreate && data.data.cartCreate.cart) {
      const checkoutUrl = data.data.cartCreate.cart.checkoutUrl;
      console.log('Redirecting to Shopify Checkout:', checkoutUrl);
      window.location.href = checkoutUrl;
      return;
    } else {
      console.warn('Shopify Cart creation failed. Falling back to local simulation.', data);
    }
  }
  
  // Fallback simulated checkout message
  setTimeout(() => {
    const itemsDescription = cart.map(item => 
      `- ${item.title} (${item.options.wood} / ${item.options.cushion}): Qty ${item.quantity} @ ${formatCurrency(item.price)}`
    ).join('\n');
    
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Premium feedback overlay for simulator
    const alertModal = document.createElement('div');
    alertModal.style.position = 'fixed';
    alertModal.style.inset = '0';
    alertModal.style.backgroundColor = 'rgba(12, 10, 8, 0.9)';
    alertModal.style.zIndex = '10000';
    alertModal.style.display = 'flex';
    alertModal.style.alignItems = 'center';
    alertModal.style.justifyContent = 'center';
    alertModal.style.padding = '20px';
    
    alertModal.innerHTML = `
      <div style="background-color: var(--dark-bg, #241F1B); border: 1px solid var(--chamoisee, #a27b5c); border-radius: 16px; max-width: 500px; width: 100%; padding: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); font-family: var(--font-body, serif); color: var(--paper, #F4F1EC);">
        <h3 style="font-family: var(--font-display, sans-serif); text-transform: uppercase; font-weight: 300; letter-spacing: 2px; color: var(--chamoisee, #a27b5c); margin-bottom: 24px;">Shopify Checkout Simulation</h3>
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px; opacity: 0.9;">
          You are redirecting to Shopify. In production, the Headless Storefront API creates a secure cart and opens Shopify's checkout page with these items:
        </p>
        <pre style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 16px; border-radius: 8px; font-family: monospace; font-size: 13px; line-height: 1.5; overflow-x: auto; margin-bottom: 24px; white-space: pre-wrap; color: var(--bone, #dcd7c9);">${itemsDescription}\n\nTotal: ${formatCurrency(totalAmount)}</pre>
        <div style="display: flex; gap: 16px; justify-content: flex-end;">
          <button id="modal-close" style="background: none; border: 1px solid rgba(220, 215, 201, 0.3); color: var(--bone, #dcd7c9); padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Back</button>
          <button id="modal-checkout" style="background-color: var(--chamoisee, #a27b5c); border: none; color: var(--paper, #F4F1EC); padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600;">Complete Order</button>
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
    
  }, 1000);
}

// ─── INITIALIZE EVENT LISTENERS ───
document.addEventListener('DOMContentLoaded', () => {
  // Toggle Drawer
  if (cartToggleBtn) {
    cartToggleBtn.addEventListener('click', openCartDrawer);
  }
  
  if (cartCloseBtn) {
    cartCloseBtn.addEventListener('click', closeCartDrawer);
  }
  
  if (cartOverlay) {
    cartOverlay.addEventListener('click', closeCartDrawer);
  }
  
  // Checkout action
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', proceedToCheckout);
  }
  
  // Quantity controls and remove action via event delegation
  if (cartItemsContainer) {
    cartItemsContainer.addEventListener('click', (e) => {
      const btn = e.target;
      const itemId = btn.getAttribute('data-id');
      
      if (btn.classList.contains('inc-qty-btn')) {
        updateItemQuantity(itemId, 1);
      } else if (btn.classList.contains('dec-qty-btn')) {
        updateItemQuantity(itemId, -1);
      } else if (btn.classList.contains('cart-item-remove')) {
        removeItemFromCart(itemId);
      }
    });
  }
  
  // Buy Now button inside Customize Panel (#config-panel)
  const buyNowBtn = document.getElementById('buy-now-btn');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      const woodLabel = document.querySelector('.selected-wood-label');
      const cushionLabel = document.querySelector('.selected-cushion-label');
      
      const wood = woodLabel ? woodLabel.textContent.trim() : 'Teak';
      
      // Get cushion name (strip " Cushion" suffix if present)
      let cushion = cushionLabel ? cushionLabel.textContent.trim() : 'Linen';
      if (cushion.toLowerCase().endsWith(' cushion')) {
        cushion = cushion.substring(0, cushion.length - 8);
      }
      
      // Find current active image from the configurator carousel active card
      const activeCard = document.querySelector('.carousel-card.highlighted');
      let imageSrc = '';
      if (activeCard) {
        const img = activeCard.querySelector('img');
        if (img) imageSrc = img.src;
      }
      
      addItemToCart('Noku Barstool', wood, cushion, imageSrc);
    });
  }
  
  // Configurator Add to Cart: Hook clicks on cart icon inside the carousel cards (both tracks)
  const tracks = document.querySelectorAll('.carousel-track, .narrative-carousel-track');
  tracks.forEach(track => {
    track.addEventListener('click', (e) => {
      // Find if an add-to-cart icon or path was clicked
      const cartIcon = e.target.closest('.add-to-cart-icon');
      if (!cartIcon) return;
      
      // Stop propagation so it doesn't trigger the card highlight select handler in script.js
      e.stopPropagation();
      e.preventDefault();
      
      const card = cartIcon.closest('.carousel-card');
      if (!card) return;
      
      const cushion = card.dataset.cushion;
      const woodLabel = document.querySelector('.selected-wood-label');
      const wood = woodLabel ? woodLabel.textContent.trim() : 'Teak';
      
      const img = card.querySelector('img');
      const imageSrc = img ? img.src : '';
      
      // Format cushion name for display (e.g. blush -> Blush)
      const formattedCushion = cushion.charAt(0).toUpperCase() + cushion.slice(1);
      
      addItemToCart('Noku Barstool', wood, formattedCushion, imageSrc);
    });
  });
  
  // Featured Products Add to Cart: Hook clicks on Add to Cart buttons
  const productsGrid = document.querySelector('.products-grid, .featured-carousel-track');
  if (productsGrid) {
    productsGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.product-add-to-cart-btn');
      if (!btn) return;
      
      const card = btn.closest('.product-card');
      if (!card) return;
      
      const handle = card.getAttribute('data-handle');
      addFeaturedItemToCart(handle);
    });
  }
  
  // Set up MutationObservers to update carousel images to Shopify CDN URLs dynamically on render
  const carouselTrack = document.querySelector('#configurator .carousel-track');
  if (carouselTrack) {
    const carouselObserver = new MutationObserver(() => {
      carouselObserver.disconnect();
      updateCarouselImagesToShopify();
      carouselObserver.observe(carouselTrack, { childList: true });
    });
    carouselObserver.observe(carouselTrack, { childList: true });
  }

  const narrativeCarouselTrack = document.querySelector('.narrative-carousel-track');
  if (narrativeCarouselTrack) {
    const narrativeObserver = new MutationObserver(() => {
      narrativeObserver.disconnect();
      updateCarouselImagesToShopify();
      narrativeObserver.observe(narrativeCarouselTrack, { childList: true });
    });
    narrativeObserver.observe(narrativeCarouselTrack, { childList: true });
  }
  
  // Load Shopify storefront details
  loadShopifyProductData();
  
  // Listen to storage sync from other pages
  window.addEventListener('storage', () => {
    cart = JSON.parse(localStorage.getItem('noku_cart')) || [];
    updateCartUI();
  });


  // Initial UI Render
  updateCartUI();
});

// ─── FLOATING DEV-CONSOLE UTILITY FOR REMOTE DEBUGGING ───
if (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.protocol === 'file:'
) {
  (function() {
    const consoleDiv = document.createElement('div');
    consoleDiv.id = 'floating-debug-console';
    consoleDiv.style.position = 'fixed';
    consoleDiv.style.bottom = '10px';
    consoleDiv.style.left = '10px';
    consoleDiv.style.width = '380px';
    consoleDiv.style.maxHeight = '220px';
    consoleDiv.style.overflowY = 'auto';
    consoleDiv.style.backgroundColor = 'rgba(24, 20, 18, 0.95)';
    consoleDiv.style.color = '#EDE6DA';
    consoleDiv.style.fontFamily = 'monospace';
    consoleDiv.style.fontSize = '10px';
    consoleDiv.style.padding = '12px';
    consoleDiv.style.borderRadius = '8px';
    consoleDiv.style.zIndex = '999999';
    consoleDiv.style.border = '1px solid rgba(162, 123, 92, 0.4)';
    consoleDiv.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
    consoleDiv.style.pointerEvents = 'none'; // Click through
    document.body.appendChild(consoleDiv);
    
    function addLog(msg, type = 'log') {
      const p = document.createElement('p');
      p.style.margin = '3px 0';
      if (type === 'error') p.style.color = '#ff6b6b';
      if (type === 'warn') p.style.color = '#fcd34d';
      p.textContent = `[${type.toUpperCase()}] ${msg}`;
      consoleDiv.appendChild(p);
      consoleDiv.scrollTop = consoleDiv.scrollHeight;
    }
    
    // Intercept console
    const origLog = console.log;
    console.log = function(...args) {
      origLog.apply(console, args);
      addLog(args.join(' '));
    };
    
    const origWarn = console.warn;
    console.warn = function(...args) {
      origWarn.apply(console, args);
      addLog(args.join(' '), 'warn');
    };
    
    const origError = console.error;
    console.error = function(...args) {
      origError.apply(console, args);
      addLog(args.join(' '), 'error');
    };
    
    // Catch unhandled errors
    window.addEventListener('error', (e) => {
      addLog(`${e.message} at ${e.filename.split('/').pop()}:${e.lineno}`, 'error');
    });
  })();
}
