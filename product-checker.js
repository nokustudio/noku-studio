/**
 * Standalone Shopify Inventory and Price Checker
 * Checks Storefront API and compares with local JSON cache.
 */

const fs = require('fs');
const path = require('path');

// Storefront API Configuration
const SHOPIFY_CONFIG = {
  storefrontAccessToken: '7b62ad5d7d665bebe383ff2d3c36c0b0',
  shopDomain: '6b5390-f8.myshopify.com',
  apiVersion: '2024-04',
  cacheFilename: 'product_cache.json'
};

const cachePath = path.join(__dirname, SHOPIFY_CONFIG.cacheFilename);

// Helper to format currency values
function formatPrice(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
}

// Storefront GraphQL Query to fetch all products and their variants
const PRODUCTS_QUERY = `
  query getAllProducts {
    products(first: 100) {
      edges {
        node {
          id
          title
          handle
          variants(first: 100) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
`;

async function runInventoryCheck() {
  console.log('--------------------------------------------------');
  console.log('Noku Studio Shopify Inventory Checker Starting...');
  console.log('--------------------------------------------------');

  // 1. Load Local Cache
  let cache = {};
  let isCacheNew = true;

  if (fs.existsSync(cachePath)) {
    try {
      const cacheRaw = fs.readFileSync(cachePath, 'utf8');
      cache = JSON.parse(cacheRaw);
      isCacheNew = false;
      console.log(`Loaded existing product cache containing ${Object.keys(cache).length} products.`);
    } catch (err) {
      console.warn('Failed to parse existing cache file. Starting fresh.', err.message);
    }
  } else {
    console.log('No existing product cache file found. Fresh cache will be created.');
  }

  // 2. Fetch Active Products from Shopify Storefront API
  const url = `https://${SHOPIFY_CONFIG.shopDomain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`;
  
  let currentProducts = {};
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken
      },
      body: JSON.stringify({ query: PRODUCTS_QUERY })
    });
    
    if (!response.ok) {
      console.error(`HTTP request failed: ${response.statusText}`);
      return;
    }
    
    const result = await response.json();
    
    if (result.errors) {
      console.error('GraphQL Query Errors:', JSON.stringify(result.errors, null, 2));
      return;
    }
    
    const productsList = result.data?.products?.edges || [];
    
    // Normalize response data into a registry map
    productsList.forEach(edge => {
      const p = edge.node;
      const variants = {};
      
      p.variants.edges.forEach(vEdge => {
        const v = vEdge.node;
        variants[v.id] = {
          title: v.title,
          price: parseFloat(v.price.amount)
        };
      });
      
      currentProducts[p.id] = {
        title: p.title,
        handle: p.handle,
        variants
      };
    });
    
    console.log(`Fetched ${Object.keys(currentProducts).length} active products from Shopify.`);
    
  } catch (err) {
    console.error('Connection or fetch failure:', err.message);
    return;
  }

  // 3. Compare current list with cache data
  if (isCacheNew) {
    console.log('\nInitial cache established. Creating registry file.');
  } else {
    console.log('\n--- Comparing Inventory Differences ---');
    let additions = [];
    let deletions = [];
    let priceUpdates = [];
    let variantChanges = [];

    // Find Additions & Price/Variant Updates
    for (const [pId, pData] of Object.entries(currentProducts)) {
      if (!cache[pId]) {
        additions.push(`[NEW PRODUCT] ${pData.title} (handle: ${pData.handle})`);
        continue;
      }
      
      const cachedProduct = cache[pId];
      
      // Compare variants
      for (const [vId, vData] of Object.entries(pData.variants)) {
        if (!cachedProduct.variants[vId]) {
          variantChanges.push(`[NEW VARIANT] In ${pData.title}: "${vData.title}" initialized at ${formatPrice(vData.price)}`);
          continue;
        }
        
        const cachedVariant = cachedProduct.variants[vId];
        if (cachedVariant.price !== vData.price) {
          priceUpdates.push(
            `[PRICE UPDATE] In ${pData.title} (Variant "${vData.title}"):\n` +
            `  Price changed from ${formatPrice(cachedVariant.price)} to ${formatPrice(vData.price)}`
          );
        }
      }
      
      // Check for deleted variants in cached product
      for (const vId of Object.keys(cachedProduct.variants)) {
        if (!pData.variants[vId]) {
          variantChanges.push(`[DELETED VARIANT] In ${pData.title}: Variant ID ${vId} was removed`);
        }
      }
    }

    // Find Deletions
    for (const [pId, pData] of Object.entries(cache)) {
      if (!currentProducts[pId]) {
        deletions.push(`[DELETED PRODUCT] ${pData.title} (handle: ${pData.handle})`);
      }
    }

    // Print Differences Report
    let hasChanges = false;
    
    if (additions.length > 0) {
      hasChanges = true;
      console.log('\nAdded Products:');
      additions.forEach(msg => console.log(`  ${msg}`));
    }
    
    if (deletions.length > 0) {
      hasChanges = true;
      console.log('\nRemoved Products:');
      deletions.forEach(msg => console.log(`  ${msg}`));
    }

    if (variantChanges.length > 0) {
      hasChanges = true;
      console.log('\nVariant Modifications:');
      variantChanges.forEach(msg => console.log(`  ${msg}`));
    }
    
    if (priceUpdates.length > 0) {
      hasChanges = true;
      console.log('\nPrice Changes:');
      priceUpdates.forEach(msg => console.log(`  ${msg}`));
    }

    if (!hasChanges) {
      console.log('No additions, deletions, or pricing updates found.');
    }
  }

  // 4. Update local cache file on disk
  try {
    fs.writeFileSync(cachePath, JSON.stringify(currentProducts, null, 2), 'utf8');
    console.log(`\nSuccessfully updated cache file: ${SHOPIFY_CONFIG.cacheFilename}`);
  } catch (err) {
    console.error('Failed to write update to cache file:', err.message);
  }
  
  console.log('--------------------------------------------------');
}

runInventoryCheck();
