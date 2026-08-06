(function () {
  /**
   * Noku Studio — Materials Guide Controller
   * Pulls active material definitions and configurations from Shopify headless Storefront API.
   * Maps Shopify product variants dynamically to display "Used In Pieces" for each material.
   */

  // ─── SHOPIFY STOREFRONT API CREDENTIALS ───
  const SHOPIFY_CONFIG = {
    storefrontAccessToken: '7b62ad5d7d665bebe383ff2d3c36c0b0',
    shopDomain: '6b5390-f8.myshopify.com',
    apiVersion: '2024-04',
    currencySymbol: '₹',
    defaultPrice: 24500
  };

  // ─── MATERIALS METADATA REGISTRY (Loaded from noku-materials.js) ───
  const MATERIALS_REGISTRY = window.NokuMaterials || {};

  // ─── OFFLINE FALLBACK PRODUCTS DATABASE ───
  const FALLBACK_PRODUCTS = [
    {
      title: "Bask Chair",
      handle: "lounge-chair",
      featuredImage: { url: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c7724c1a8d27260d62288_Noku_ofStillness_Lounge_chair_02.jpeg" },
      priceRange: { minVariantPrice: { amount: "49500" } },
      tags: ["chair", "leather", "lounge", "cane", "wood"],
      options: [
        { name: "Wood", values: ["Teak", "White Ash", "Reclaimed teak"] },
        { name: "Upholstery", values: ["Fabric - Cloud", "Fabric - Rubik Linen", "Fabric - Charcoal", "Fabric - Opal", "Fabric - Vienna", "Fabric - Blush", "Leather - Cognac", "Leather - Olive", "Leather - Brick"] }
      ]
    },
    {
      title: "Stilt Barstool",
      handle: "barstool",
      featuredImage: { url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/67cfdbb331dba957c997c00e_5d1622c83584a245197f9005889b2b06_Noku_ofStillness_Barstool_03%20copy.webp" },
      priceRange: { minVariantPrice: { amount: "21000" } },
      tags: ["barstool", "chair", "wood", "leather", "fabric"],
      options: [
        { name: "Wood", values: ["Teak", "White Ash", "Reclaimed teak"] },
        { name: "Upholstery", values: ["Leather - Cognac", "Leather - Chestnut", "Leather - Olive", "Fabric - Charcoal", "Fabric - Opal", "Fabric - Rubik Linen", "Fabric - Blush", "Fabric - Vienna"] }
      ]
    },
    {
      title: "Grooved Sofa",
      handle: "sofa-2",
      featuredImage: { url: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c99b2583745be71136547_Noku_ofStillness_Sofa_grooved_02.jpeg" },
      priceRange: { minVariantPrice: { amount: "81000" } },
      tags: ["sofa", "fabric", "leather", "wood"],
      options: [
        { name: "Wood", values: ["Teak", "White Ash", "Reclaimed teak"] },
        { name: "Upholstery", values: ["Fabric - Charcoal", "Fabric - Opal", "Fabric - Vienna", "Fabric - Blush", "Fabric - Silver", "Fabric - Rubik Linen", "Leather - Cognac", "Leather - Brick", "Leather - Honey"] }
      ]
    },
    {
      title: "Stylus Table",
      handle: "modern-study-table",
      featuredImage: { url: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c7d6f73c94da715b34a92_Noku_ofStillness_Study_table_03.jpeg" },
      priceRange: { minVariantPrice: { amount: "35000" } },
      tags: ["table", "study", "brass", "wood"],
      options: [
        { name: "Wood", values: ["Teak", "White Ash", "Reclaimed teak"] }
      ]
    },
    {
      title: "Eclipse Dining Table",
      handle: "round-dining-table",
      featuredImage: { url: "https://cdn.mut-images.com/not-found.jpg" }, // generic fallback if empty
      priceRange: { minVariantPrice: { amount: "47000" } },
      tags: ["table", "dining", "brass", "wood"],
      options: [
        { name: "Wood", values: ["Teak", "White Ash", "Reclaimed teak"] }
      ]
    }
  ];

  // ─── STATE VARIABLES ───
  let productsList = [];
  const categoryStates = {
    wood: { selected: null },
    leather: { selected: null },
    fabric: { selected: null },
    cane: { selected: null },
    metals: { selected: null }
  };

  // ─── SHOPIFY GRAPHQL API client ───
  async function fetchProductsFromShopify() {
    const { storefrontAccessToken, shopDomain, apiVersion } = SHOPIFY_CONFIG;
    const url = `https://${shopDomain}/api/${apiVersion}/graphql.json`;
    
    const query = `
      query {
        products(first: 100) {
          edges {
            node {
              id
              title
              handle
              featuredImage {
                url
              }
              purchaseMode: metafield(namespace: "custom", key: "purchasemode") { value }
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              tags
              options {
                name
                values
              }
              variants(first: 100) {
                edges {
                  node {
                    id
                    title
                    price {
                      amount
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

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': storefrontAccessToken
        },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        console.warn("Shopify API responded with status:", response.status);
        return false;
      }
      
      const result = await response.json();
      if (result.errors) {
        console.error("Shopify Storefront GraphQL errors:", result.errors);
        return false;
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
        console.log(`Successfully fetched ${fetched.length} live products from Shopify.`);
        productsList = fetched;
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to connect to Shopify. Using fallback database.", err);
      return false;
    }
  }

  // ─── LIVE MATERIAL METADATA (Shopify metaobjects) ───
  // Pulls images, descriptions and scientific names from the "wood" and "option"
  // metaobject definitions, then overlays them onto MATERIALS_REGISTRY by id so
  // every swatch/description on the page reflects the Shopify source of truth.
  // Local registry values survive only where Shopify has none (e.g. Matti has no
  // image, Brass has no metaobject, Woven Cane has no description/scientific name).
  async function fetchMaterialMetaobjects() {
    const { storefrontAccessToken, shopDomain, apiVersion } = SHOPIFY_CONFIG;
    const url = `https://${shopDomain}/api/${apiVersion}/graphql.json`;
    const query = `{
      woods: metaobjects(type: "wood", first: 20) {
        edges { node { fields { key value reference { ... on MediaImage { image { url } } } } } }
      }
      options: metaobjects(type: "option", first: 30) {
        edges { node { fields { key value reference { ... on MediaImage { image { url } } } } } }
      }
    }`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': storefrontAccessToken
        },
        body: JSON.stringify({ query })
      });
      if (!response.ok) return null;
      const result = await response.json();
      if (result.errors || !result.data) return null;

      const byId = {};
      const ingest = (edges) => {
        (edges || []).forEach((edge) => {
          const fields = edge.node.fields;
          const get = (k) => fields.find((f) => f.key === k);
          const name = get('name')?.value;
          if (!name) return;
          const id = getMatchedId(name);
          const imgUrl = get('image')?.reference?.image?.url;
          const entry = byId[id] || {};
          if (imgUrl) entry.preview = imgUrl;
          if (get('description')?.value) entry.desc = get('description').value;
          if (get('scientific_name')?.value) entry.subtitle = get('scientific_name').value;
          byId[id] = entry;
        });
      };
      ingest(result.data.woods?.edges);
      ingest(result.data.options?.edges);
      return byId;
    } catch (err) {
      console.warn('Material metaobject fetch failed; using local registry.', err);
      return null;
    }
  }

  // Overlays Shopify metaobject data onto the local registry, in place.
  function applyMaterialOverlay(byId) {
    if (!byId) return;
    Object.keys(MATERIALS_REGISTRY).forEach((cat) => {
      MATERIALS_REGISTRY[cat].forEach((item) => {
        const live = byId[item.id];
        if (!live) return;
        if (live.preview) item.preview = live.preview;
        if (live.desc) item.desc = live.desc;
        if (live.subtitle) item.subtitle = live.subtitle;
      });
    });
  }

  // ─── CROSS-REFERENCE / MATCHING LOGIC ───
  // Converts a Shopify option value (e.g. "Fabric - Cloud", "Leather - Cognac") into a registry ID key match.
  function getMatchedId(value) {
    if (!value) return '';
    const norm = value.toLowerCase().trim()
      .replace(/^fabric\s*-\s*/, '')
      .replace(/^leather\s*-\s*/, '')
      .replace(/[^a-z0-9-]/g, '');

    if (norm.includes('cognac')) return 'vagabond-cognac';
    if (norm.includes('honey')) return 'glory-honey';
    if (norm.includes('chestnut')) return 'montana-chestnut';
    if (norm.includes('brick')) return 'emperor-brick';
    if (norm.includes('olive')) return 'eternity-olive';
    if (norm.includes('whiteash')) return 'white-ash';
    if (norm.includes('reclaimedteak')) return 'reclaimed-teak';
    if (norm.includes('rubiklinen')) return 'rubik-linen';
    if (norm.includes('wovencane')) return 'woven-cane';

    return norm;
  }


  function getFilterUrl(category, item) {
    const baseUrl = 'products.html';
    const cleanId = item.id.toLowerCase();
    if (category === 'wood') {
      if (cleanId === 'white-ash') return `${baseUrl}?material=white%20ash`;
      if (cleanId === 'reclaimed-teak') return `${baseUrl}?material=reclaimed`;
      if (cleanId === 'teak') return `${baseUrl}?material=teak`;
      return `${baseUrl}?search=${encodeURIComponent(item.name)}`;
    }
    if (category === 'leather') {
      return `${baseUrl}?material=leather`;
    }
    if (category === 'fabric') {
      return `${baseUrl}?material=fabric`;
    }
    if (category === 'cane') {
      return `${baseUrl}?search=cane`;
    }
    if (category === 'metals') {
      return `${baseUrl}?search=brass`;
    }
    return baseUrl;
  }

  function isWoodOption(optName, optValue) {
    const nameLower = optName.toLowerCase();
    if (nameLower.includes('wood') || nameLower.includes('finish')) return true;
    
    const mapped = getMatchedId(optValue);
    if (mapped && MATERIALS_REGISTRY.wood.some(item => item.id === mapped)) {
      return true;
    }
    return false;
  }

  function isUpholsteryOption(optName, optValue) {
    const nameLower = optName.toLowerCase();
    if (nameLower.includes('upholstery') || nameLower.includes('cushion')) return true;
    
    const mapped = getMatchedId(optValue);
    if (mapped) {
      if (MATERIALS_REGISTRY.leather.some(item => item.id === mapped) || 
          MATERIALS_REGISTRY.fabric.some(item => item.id === mapped) ||
          MATERIALS_REGISTRY.cane.some(item => item.id === mapped)) {
        return true;
      }
    }
    return false;
  }

  // Finds list of products that use a specific material item
  function getProductsUsingMaterial(category, materialId, materialName) {
    const matchedProducts = [];
    const normId = materialId.toLowerCase();
    const normName = materialName.toLowerCase();

    productsList.forEach(p => {
      let uses = false;

      // Check Wood and Upholstery options
      if (p.options) {
        p.options.forEach(opt => {
          const optNameLower = opt.name.toLowerCase();
          
          let hasWoodValue = opt.values.some(val => {
            const mapped = getMatchedId(val);
            return mapped && MATERIALS_REGISTRY.wood.some(item => item.id === mapped);
          });
          let hasUphValue = opt.values.some(val => {
            const mapped = getMatchedId(val);
            return mapped && (
              MATERIALS_REGISTRY.leather.some(item => item.id === mapped) ||
              MATERIALS_REGISTRY.fabric.some(item => item.id === mapped) ||
              MATERIALS_REGISTRY.cane.some(item => item.id === mapped)
            );
          });

          const isWood = optNameLower.includes('wood') || optNameLower.includes('finish') || optNameLower.includes('color') || optNameLower.includes('material') || hasWoodValue;
          const isUpholstery = optNameLower.includes('upholstery') || optNameLower.includes('cushion') || optNameLower.includes('color') || optNameLower.includes('material') || hasUphValue;

          if (category === 'wood' && isWood) {
            opt.values.forEach(val => {
              const mappedVal = getMatchedId(val);
              const valNorm = val.toLowerCase().replace(/[^a-z0-9]/g, '');
              const targetNorm = materialId.toLowerCase().replace(/[^a-z0-9]/g, '');
              
              let matches = false;
              if (targetNorm === 'reclaimedteak') {
                matches = (mappedVal === 'reclaimed-teak' || valNorm === 'reclaimedteak' || valNorm.includes('reclaimedteak'));
              } else if (targetNorm === 'teak') {
                matches = (mappedVal === 'teak' || valNorm === 'teak' || valNorm === 'solidteak' || valNorm.includes('teak')) && !valNorm.includes('reclaimed');
              } else {
                matches = (mappedVal === normId || valNorm === targetNorm || valNorm.includes(targetNorm) || targetNorm.includes(valNorm));
              }
              if (matches) {
                uses = true;
              }
            });
          }

          if (category === 'leather' && isUpholstery) {
            opt.values.forEach(val => {
              const mappedVal = getMatchedId(val);
              if (mappedVal === normId) {
                uses = true;
              }
            });
          }

          if (category === 'fabric' && isUpholstery) {
            opt.values.forEach(val => {
              const mappedVal = getMatchedId(val);
              if (mappedVal === normId) {
                uses = true;
              }
            });
          }
        });
      }

      // Special checks for Cane and Metals (tags, titles, descriptions)
      if (category === 'cane') {
        const titleMatches = p.title.toLowerCase().includes('cane') || p.title.toLowerCase().includes('rattan');
        const tagMatches = p.tags ? p.tags.some(t => t.toLowerCase().includes('cane') || t.toLowerCase().includes('rattan')) : false;
        if (titleMatches || tagMatches) {
          uses = true;
        }
      }

      if (category === 'metals') {
        const titleMatches = p.title.toLowerCase().includes(normName) || p.title.toLowerCase().includes('metal') || p.title.toLowerCase().includes('brass');
        const tagMatches = p.tags ? p.tags.some(t => t.toLowerCase().includes(normName) || t.toLowerCase().includes('metal') || t.toLowerCase().includes('brass')) : false;
        if (titleMatches || tagMatches) {
          uses = true;
        }
      }

      if (uses) {
        // Avoid duplicate cards
        if (!matchedProducts.some(mp => mp.handle === p.handle)) {
          matchedProducts.push(p);
        }
      }
    });

    return matchedProducts;
  }

  // Finds variant image that matches selected material finish or upholstery combinations
  function getVariantImage(product, category, materialId, materialName) {
    if (!product.variants || !product.variants.edges || product.variants.edges.length === 0) {
      return product.featuredImage?.url || 'https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c7724c1a8d27260d62288_Noku_ofStillness_Lounge_chair_02.jpeg';
    }

    const normId = materialId.toLowerCase();
    const normName = materialName.toLowerCase();

    let bestMatchImage = null;
    let fallbackImage = null;

    for (let i = 0; i < product.variants.edges.length; i++) {
      const v = product.variants.edges[i].node;
      if (!v.image || !v.image.url) continue;

      if (!fallbackImage) {
        fallbackImage = v.image.url;
      }

      let matchesWood = false;
      let matchesUpholstery = false;
      let isTeakWood = false;

      if (v.selectedOptions) {
        v.selectedOptions.forEach(opt => {
          const optName = opt.name.toLowerCase();
          const optVal = opt.value.toLowerCase();
          
          const isWoodOpt = isWoodOption(opt.name, opt.value);
          const isUphOpt = isUpholsteryOption(opt.name, opt.value);

          // Check if option is Wood or Finish
          if (isWoodOpt) {
            const mappedWood = getMatchedId(opt.value);
            const valNorm = opt.value.toLowerCase().replace(/[^a-z0-9]/g, '');
            const targetNorm = materialId.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            if (targetNorm === 'reclaimedteak') {
              matchesWood = (mappedWood === 'reclaimed-teak' || valNorm === 'reclaimedteak' || valNorm.includes('reclaimedteak'));
            } else if (targetNorm === 'teak') {
              matchesWood = (mappedWood === 'teak' || valNorm === 'teak' || valNorm === 'solidteak' || valNorm.includes('teak')) && !valNorm.includes('reclaimed');
            } else {
              matchesWood = (mappedWood === normId || valNorm === targetNorm || valNorm.includes(targetNorm) || targetNorm.includes(valNorm));
            }
            if (mappedWood === 'teak') {
              isTeakWood = true;
            }
          }

          // Check if option is Upholstery or Cushion
          if (isUphOpt) {
            const mappedUph = getMatchedId(opt.value);
            if (mappedUph === normId || optVal.includes(normId) || normId.includes(optVal)) {
              matchesUpholstery = true;
            }
          }
        });
      }

      // Match rules
      if (category === 'wood') {
        if (matchesWood) {
          return v.image.url;
        }
      } else if (category === 'leather' || category === 'fabric') {
        if (matchesUpholstery) {
          // If Upholstery matches and Wood is Teak, return immediately
          if (isTeakWood) {
            return v.image.url;
          }
          // Otherwise, save as best match Upholstery variant
          if (!bestMatchImage) {
            bestMatchImage = v.image.url;
          }
        }
      } else {
        const titleMatch = v.title.toLowerCase().includes(normName) || v.title.toLowerCase().includes(normId);
        if (titleMatch) {
          return v.image.url;
        }
      }
    }

    if (bestMatchImage) return bestMatchImage;
    return product.featuredImage?.url || fallbackImage || 'https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c7724c1a8d27260d62288_Noku_ofStillness_Lounge_chair_02.jpeg';
  }

  // ─── DOM RENDER CONTROLLER ───

  function renderSwatchesGrid(category) {
    const grid = document.getElementById(`${category}-swatches-grid`);
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const categoryItems = MATERIALS_REGISTRY[category];
    if (!categoryItems || categoryItems.length === 0) return;

    const selectedItem = categoryStates[category].selected;

    categoryItems.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = `swatch-card${selectedItem && selectedItem.id === item.id ? ' active' : ''}`;
      card.setAttribute('data-id', item.id);

      const bg = document.createElement('div');
      bg.className = `swatch-bg ${item.class || ''}`;
      if (item.preview) {
        bg.style.backgroundImage = `url('${item.preview}')`;
        bg.style.backgroundSize = 'cover';
        bg.style.backgroundPosition = 'center';
      }

      const label = document.createElement('div');
      label.className = 'swatch-label';
      label.textContent = item.name;

      card.appendChild(bg);
      card.appendChild(label);
      
      // Add Click listener
      card.addEventListener('click', () => {
        // Toggle active states
        const activeCards = grid.querySelectorAll('.swatch-card');
        activeCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        categoryStates[category].selected = item;
        renderMaterialDetails(category, item);
      });

      grid.appendChild(card);
    });
  }

  function renderMaterialDetails(category, item) {
    const titleEl = document.getElementById(`${category}-detail-title`);
    const subtitleEl = document.getElementById(`${category}-detail-subtitle`);
    const descEl = document.getElementById(`${category}-detail-desc`);
    const imgEl = document.getElementById(`${category}-detail-img`);
    
    const usedPiecesBlock = document.getElementById(`${category}-used-pieces-block`);
    const usedProductsGrid = document.getElementById(`${category}-used-products`);

    if (!item) return;

    // Detail contents update
    if (titleEl) titleEl.textContent = item.name;
    if (subtitleEl) {
      subtitleEl.textContent = item.subtitle || '';
      subtitleEl.style.display = item.subtitle ? 'block' : 'none';
    }
    if (descEl) descEl.textContent = item.desc;

    // Image transitions
    if (imgEl && item.preview) {
      imgEl.style.opacity = '0';
      imgEl.style.transform = 'scale(0.97)';
      setTimeout(() => {
        imgEl.src = item.preview;
        imgEl.alt = `${item.name} Preview`;
        imgEl.style.opacity = '1';
        imgEl.style.transform = 'scale(1)';
      }, 150);
    }

    // Render Used In Pieces dynamic block
    const relatedProducts = getProductsUsingMaterial(category, item.id, item.name);
    
    // Clear any existing Discover More links
    if (usedPiecesBlock) {
      const existingLink = usedPiecesBlock.querySelector('.discover-more-link');
      if (existingLink) existingLink.remove();
    }

    if (relatedProducts.length > 0 && usedProductsGrid && usedPiecesBlock) {
      usedProductsGrid.innerHTML = '';
      usedPiecesBlock.style.display = 'flex';

      // Slice to show a maximum of 4 products
      const displayProducts = relatedProducts.slice(0, 4);

      displayProducts.forEach(p => {
        const priceVal = p.priceRange?.minVariantPrice?.amount ? parseFloat(p.priceRange.minVariantPrice.amount) : SHOPIFY_CONFIG.defaultPrice;
        const imgUrl = getVariantImage(p, category, item.id, item.name);
        
        // Buy-vs-Inquire follows the Shopify custom.purchasemode metafield (isPurchasable
        // is defined in shopify-integration.js, loaded before this file on materials.html).
        const isDisplay = !isPurchasable(p);
        let productUrl = `product.html?handle=${p.handle}${isDisplay ? '&inquire=true' : ''}`;
        if (category === 'wood') {
          productUrl += `&wood=${encodeURIComponent(item.id)}`;
        } else if (category === 'leather' || category === 'fabric') {
          productUrl += `&upholstery=${encodeURIComponent(item.id)}`;
        }

        const pCard = document.createElement('a');
        pCard.href = productUrl;
        pCard.className = 'gcard';
        pCard.innerHTML = `
          <div class="gcard__media">
            <div class="gcard__media-inner">
              <img src="${imgUrl}" alt="${p.title}" loading="lazy">
            </div>
            <button class="gcard__add" data-handle="${p.handle}">Details <svg class="ico-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="8 7 17 7 17 16"></polyline></svg></button>
          </div>
          <p class="gcard__cat">Piece</p>
          <h3 class="gcard__name">${p.title}</h3>
        `;
        pCard.querySelector('.gcard__add').addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = productUrl;
        });
        usedProductsGrid.appendChild(pCard);
      });

      // Show "Discover More" link if there are related products
      if (relatedProducts.length > 0) {
        const moreLink = document.createElement('a');
        moreLink.className = 'discover-more-link';
        moreLink.href = getFilterUrl(category, item);
        if (relatedProducts.length > 4) {
          moreLink.innerHTML = `Discover More Pieces (+${relatedProducts.length - 4}) <span>→</span>`;
        } else {
          moreLink.innerHTML = `Discover More Pieces <span>→</span>`;
        }
        usedPiecesBlock.appendChild(moreLink);
      }
    } else if (usedPiecesBlock) {
      // If no related products found, hide block
      usedProductsGrid.innerHTML = '';
      usedPiecesBlock.style.display = 'none';
    }
  }

  // Format currency INR helper
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // ─── BOOTSTRAP INITIALIZATION ───

  async function init() {
    // 1. Fetch live product data and material metaobjects from Shopify in parallel
    const [liveSuccess, materialOverlay] = await Promise.all([
      fetchProductsFromShopify(),
      fetchMaterialMetaobjects()
    ]);
    if (!liveSuccess) {
      // Fallback if shopify storefront is offline
      productsList = [...FALLBACK_PRODUCTS];
    }
    // Overlay live images / descriptions / scientific names onto the registry
    if (materialOverlay) {
      applyMaterialOverlay(materialOverlay);
      
      // Exclusively show wood, fabric, and leather categories from Shopify metaobjects
      MATERIALS_REGISTRY.wood = MATERIALS_REGISTRY.wood.filter(item => materialOverlay[item.id]);
      MATERIALS_REGISTRY.leather = MATERIALS_REGISTRY.leather.filter(item => materialOverlay[item.id]);
      MATERIALS_REGISTRY.fabric = MATERIALS_REGISTRY.fabric.filter(item => materialOverlay[item.id]);
    }

    // 2. Initialize and render each category section
    const categories = ['wood', 'leather', 'fabric', 'cane', 'metals'];
    categories.forEach(category => {
      const defaultItem = MATERIALS_REGISTRY[category][0];
      categoryStates[category].selected = defaultItem;
      renderSwatchesGrid(category);
      renderMaterialDetails(category, defaultItem);
    });

    // Sync Cart badge on load
    syncCartBadge();
    window.addEventListener('storage', syncCartBadge);
  }

  // ─── CART NAVIGATION SYNCER ───

  function syncCartBadge() {
    const cartBadge = document.getElementById('cart-count-badge');
    if (!cartBadge) return;
    const cartData = JSON.parse(localStorage.getItem('noku_cart')) || [];
    const totalCount = cartData.reduce((acc, item) => acc + item.quantity, 0);
    cartBadge.textContent = totalCount;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
