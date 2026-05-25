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

  // ─── FULL MATERIALS METADATA REGISTRY ───
  // Enriched with high-quality descriptions, botanical/technical names, classes, and image previews.
  const MATERIALS_REGISTRY = {
    wood: [
      {
        id: "teak",
        name: "Teak",
        subtitle: "Tectona grandis",
        desc: "Renowned for its rich golden to medium brown hues that deepen with age, teak's straight grain and coarse texture exude timeless elegance. Naturally resistant to water, rot, and pests, its durability ensures lasting beauty with minimal upkeep.",
        class: "swatch-wood-teak",
        preview: "Resources/material images/Wood/Teak.png"
      },
      {
        id: "honne",
        name: "Honne",
        subtitle: "Intsia bijuga",
        desc: "It is characterized by rich, golden to reddish-brown color, which deepens over time, adding warmth and character to any furniture piece. Its straight grain and fine, even texture make it ideal for crafting high-quality furniture, flooring, and cabinetry. Notably resistant to decay, termites, and fungal attacks, ensuring longevity and minimal maintenance.",
        class: "swatch-wood-honne",
        preview: "Resources/material images/Wood/Honne.png"
      },
      {
        id: "matti",
        name: "Matti",
        subtitle: "Terminalia elliptica",
        desc: "Also known as Indian Laurel, this hardwood ranges in colour from deep brown to almost black, with a grain and texture reminiscent of walnut. Dense and heavy, it offers exceptional strength and durability.",
        class: "swatch-wood-matti",
        preview: "Resources/material images/Wood/Bhilwara.png"
      },
      {
        id: "reclaimed-teak",
        name: "Reclaimed Teak",
        subtitle: "Tectona grandis (Reclaimed)",
        desc: "Sourced from old structures, reclaimed teak showcases a beautiful seasoned character with unique nail holes and weathered grains. Offering the same exceptional durability and water resistance as fresh teak, it is a sustainable choice that tells a story of its own.",
        class: "swatch-wood-reclaimed-teak",
        preview: "Resources/material images/Wood/Reclaimed teak.jpg"
      },
      {
        id: "white-ash",
        name: "White Ash",
        subtitle: "Fraxinus americana",
        desc: "A strong, durable hardwood with a prominent open grain and light cream color. Offers modern aesthetics with organic grain texture.",
        class: "swatch-wood-white-ash",
        preview: "https://cdn.shopify.com/s/files/1/0565/9954/3866/files/Lounge_chair_-_whiteash_-_linen.png?v=1774676886"
      },
      {
        id: "pinewood",
        name: "Pinewood",
        subtitle: "Pinus spp",
        desc: "A pale yellow to light brown softwood with a straight to slightly wavy grain and medium-to-coarse texture. Easy to work with and sturdy, ideal for fine joinery.",
        class: "",
        preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68271f7b5e5a5bcc3b3b458a_67c94441373cbaa21b613a32_Pine%2520wood%2520texture.jpeg"
      }
    ],
    leather: [
      {
        id: "glory-honey",
        name: "Glory Honey",
        subtitle: "Premium Hide",
        desc: "Glory is a celebration of nature’s glorious irregularities and the stories that every hide has to say. This naked hide will remain your lifelong canvas meticulously absorbing every cosy encounter and unplanned accident. Glory is moulded by each touch of yours as you leave a distinct mark on the world.",
        class: "swatch-leather-glory-honey",
        preview: "Resources/material images/Leather/Glory Honey.jpeg"
      },
      {
        id: "vagabond-cognac",
        name: "Vagabond Cognac",
        subtitle: "Full-Grain Leather",
        desc: "Vagabond Cognac leather is a premium, full-grain leather known for its rich, deep brown color and luxurious feel. This leather is prized for its natural, uncorrected grain, which showcases the unique characteristics and textures of the hide. With a smooth, supple touch and a slight sheen, Vagabond Cognac leather exudes sophistication and timeless elegance.",
        class: "swatch-leather-vagabond-cognac",
        preview: "Resources/material images/Leather/Vagabond Cognac.jpeg"
      },
      {
        id: "montana-chestnut",
        name: "Montana Chestnut",
        subtitle: "Aniline Leather",
        desc: "Only the most premium of hides make for an aniline finish that retains the natural textures and unique grain patterns. This plush aniline leather is soaked in oils and well moisturized to give it a natural sheen and a strong pull-up effect. Montana has a cushiony appearance and a supple feel lending it a well-rounded appearance.",
        class: "swatch-leather-montana-chestnut",
        preview: "Resources/material images/Leather/Montana Chestnut.jpg"
      },
      {
        id: "emperor-brick",
        name: "Emperor Brick",
        subtitle: "Natural Grain Hide",
        desc: "The Emperor is a thick hide with good body in a completely natural grain. It is plush and pleasing to the touch. The high drama of the grains against the texture commands your attention immediately. It also has the forgiving properties of a benevolent emperor, pardoning small and big incidents magnanimously.",
        class: "swatch-leather-emperor-brick",
        preview: "Resources/material images/Leather/Emperor Brick.jpeg"
      },
      {
        id: "eternity-olive",
        name: "Eternity Olive",
        subtitle: "Soft Pliable Hide",
        desc: "Eternity’s soft and pliable hides, drape like a dream, making it a craftsman’s delight. This hide’s cloudy two tone effect and deep earthy tones combined with its natural sheen make for a spot of shine and sophistication in any sleek setting. Eternity is for those with a keen eye for timeless designs.",
        class: "swatch-leather-eternity-olive",
        preview: "Resources/material images/Leather/Eternity Olive.jpeg"
      }
    ],
    fabric: [
      {
        id: "butter",
        name: "Butter",
        subtitle: "Easy-Clean Coating",
        desc: "Soft warm fabric with special easy-clean coating for high endurance, ideal for parents and pet-owners.",
        class: "swatch-fabric-butter",
        preview: "Resources/material images/Fabric/DDecor Comfort 3 Rustic Basketry Butter.jpg"
      },
      {
        id: "blush",
        name: "Blush",
        subtitle: "Herringbone Pattern",
        desc: "Muted fabric with a subtle Herringbone pattern that adds visual texture to your cushions.",
        class: "swatch-fabric-blush",
        preview: "Resources/material images/Fabric/Blush.jpeg"
      },
      {
        id: "rosebud",
        name: "Rosebud",
        subtitle: "Classic Indoor Fabric",
        desc: "Casual yet classic, Rosebud is versatile as an indoor fabric, great for interiors with a muted colour palette.",
        class: "swatch-fabric-rosebud",
        preview: "Resources/material images/Fabric/Rosebud.png"
      },
      {
        id: "rubik-linen",
        name: "Rubik Linen",
        subtitle: "Textured Linen",
        desc: "Textured and soft fabric for bright interiors and contrasts well with our wood options.",
        class: "swatch-fabric-rubik-linen",
        preview: "Resources/material images/Fabric/Rubik Linen.jpg"
      },
      {
        id: "silver",
        name: "Silver",
        subtitle: "Herringbone Velvet Finish",
        desc: "Classy and understated fabric with a subtle Herringbone pattern and velvet-like finish.",
        class: "swatch-fabric-silver",
        preview: "Resources/material images/Fabric/Silver.jpeg"
      },
      {
        id: "cloud",
        name: "Cloud",
        subtitle: "Reserved Grey Linen",
        desc: "Linen option with a reserved grey finish to match any and every interiors palette.",
        class: "swatch-fabric-cloud",
        preview: "Resources/material images/Fabric/Cloud.jpg"
      },
      {
        id: "opal",
        name: "Opal",
        subtitle: "Bold Hue Fabric",
        desc: "Bright and bold hue perfect for adding invigorating pops of colour to the furniture and cushions.",
        class: "swatch-fabric-opal",
        preview: "Resources/material images/Fabric/Opal.png"
      },
      {
        id: "vienna",
        name: "Vienna",
        subtitle: "Understated Opulence Velvet",
        desc: "Ideal for upholstery with understated opulence, soft, velvety touch adding subtle luminosity to traditional and contemporary living spaces.",
        class: "swatch-fabric-vienna",
        preview: "Resources/material images/Fabric/Vienna Army.jpg"
      },
      {
        id: "flute",
        name: "Flute",
        subtitle: "Deep Navy Striped Fabric",
        desc: "Striking lines in deep navy to add a vibrant texture to the furniture and space.",
        class: "swatch-fabric-flute",
        preview: "Resources/material images/Fabric/Flute.jpeg"
      },
      {
        id: "charcoal",
        name: "Charcoal",
        subtitle: "Plush Chenille Yarn",
        desc: "Its chenille yarn offers a plush, multi-tonal finish which is perfect for all upholstery uses such as sofas or chairs.",
        class: "swatch-fabric-charcoal",
        preview: "Resources/material images/Fabric/Charcoal.png"
      }
    ],
    cane: [
      {
        id: "woven-cane",
        name: "Woven Cane",
        subtitle: "Natural Rattan Vine",
        desc: "Woven cane, a natural material crafted from rattan vine, brings light and airy beauty to furniture. Its warm tones, unique textures, and surprising durability make it a versatile choice for any style, from coastal chic to mid-century modern. It's lightweight, breathable for comfort, and requires minimal care - perfect for adding a touch of natural elegance to your home.",
        class: "swatch-cane-woven-cane",
        preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68271f7b453b55e1b9a21c03_6684d13aa6725a68337cc74f_66784e83c198b5a75b916393_Cane%252520Weave.png"
      }
    ],
    metals: [
      {
        id: "brass",
        name: "Brass",
        subtitle: "Copper-Zinc Alloy",
        desc: "Brass is a versatile metal alloy primarily composed of copper and zinc, known for its golden-yellow color and attractive luster. It has a smooth texture and can develop a natural patina over time. With its moderate density, brass is both strong and malleable, making it ideal for intricate designs.",
        class: "swatch-metals-brass",
        preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68271f7c4efe0f82a1ee7847_67c94a5ccae97b8acf9ee4bd_brass-rod-port.jpeg"
      }
    ]
  };

  // ─── OFFLINE FALLBACK PRODUCTS DATABASE ───
  const FALLBACK_PRODUCTS = [
    {
      title: "Lounge Chair",
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
      title: "Barstool",
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
      title: "Study Table",
      handle: "modern-study-table",
      featuredImage: { url: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c7d6f73c94da715b34a92_Noku_ofStillness_Study_table_03.jpeg" },
      priceRange: { minVariantPrice: { amount: "35000" } },
      tags: ["table", "study", "brass", "wood"],
      options: [
        { name: "Wood", values: ["Teak", "White Ash", "Reclaimed teak"] }
      ]
    },
    {
      title: "Round Dining Table",
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
  let currentCategory = 'wood';
  let selectedMaterial = null;

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
      
      const fetched = result.data?.products?.edges?.map(edge => edge.node) || [];
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
          const isWood = opt.name.toLowerCase() === 'wood' || opt.name.toLowerCase() === 'finish';
          const isUpholstery = opt.name.toLowerCase() === 'upholstery' || opt.name.toLowerCase() === 'cushion';

          if (category === 'wood' && isWood) {
            opt.values.forEach(val => {
              const mappedVal = getMatchedId(val);
              if (mappedVal === normId || val.toLowerCase().includes(normId) || normId.includes(val.toLowerCase())) {
                uses = true;
              }
            });
          }

          if (category === 'leather' && isUpholstery) {
            opt.values.forEach(val => {
              if (val.toLowerCase().includes('leather')) {
                const mappedVal = getMatchedId(val);
                if (mappedVal === normId) {
                  uses = true;
                }
              }
            });
          }

          if (category === 'fabric' && isUpholstery) {
            opt.values.forEach(val => {
              if (val.toLowerCase().includes('fabric') || val.toLowerCase().includes('linen') || val.toLowerCase().includes('velvet') || val.toLowerCase().includes('striped')) {
                const mappedVal = getMatchedId(val);
                if (mappedVal === normId) {
                  uses = true;
                }
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

  // ─── DOM RENDER CONTROLLER ───

  function renderSwatchesGrid() {
    const grid = document.getElementById('materials-swatches-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const categoryItems = MATERIALS_REGISTRY[currentCategory];
    if (!categoryItems || categoryItems.length === 0) return;

    categoryItems.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = `swatch-card${selectedMaterial && selectedMaterial.id === item.id ? ' active' : ''}`;
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
        
        selectedMaterial = item;
        renderMaterialDetails(item);
      });

      grid.appendChild(card);
    });
  }

  function renderMaterialDetails(item) {
    const titleEl = document.getElementById('material-detail-title');
    const categoryEl = document.getElementById('material-detail-category');
    const subtitleEl = document.getElementById('material-detail-subtitle');
    const descEl = document.getElementById('material-detail-desc');
    const imgEl = document.getElementById('material-detail-img');
    
    const usedPiecesBlock = document.getElementById('material-used-pieces-block');
    const usedProductsGrid = document.getElementById('material-used-products');

    if (!item) return;

    // Detail contents update
    if (titleEl) titleEl.textContent = item.name;
    if (categoryEl) {
      let catLabel = 'Wood Finish';
      if (currentCategory === 'leather') catLabel = 'Premium Leather';
      else if (currentCategory === 'fabric') catLabel = 'Natural Fabric';
      else if (currentCategory === 'cane') catLabel = 'Natural Rattan / Cane';
      else if (currentCategory === 'metals') catLabel = 'Sourcing Metal / Details';
      categoryEl.textContent = catLabel;
    }
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
    const relatedProducts = getProductsUsingMaterial(currentCategory, item.id, item.name);
    
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
        const imgUrl = p.featuredImage?.url || 'https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c7724c1a8d27260d62288_Noku_ofStillness_Lounge_chair_02.jpeg';
        
        const pCard = document.createElement('a');
        pCard.href = `product.html?handle=${p.handle}`;
        pCard.className = 'used-product-card';
        pCard.innerHTML = `
          <div class="used-product-img-wrap">
            <img src="${imgUrl}" alt="${p.title}" loading="lazy">
          </div>
          <div class="used-product-info">
            <span class="used-product-name">${p.title}</span>
            <span class="used-product-price">${formatCurrency(priceVal)}</span>
          </div>
        `;
        usedProductsGrid.appendChild(pCard);
      });

      // Show "Discover More" link if there are related products
      if (relatedProducts.length > 0) {
        const moreLink = document.createElement('a');
        moreLink.className = 'discover-more-link';
        moreLink.href = getFilterUrl(currentCategory, item);
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
    // Bind category pills click events
    const categoryPills = document.querySelectorAll('.materials-pill');
    categoryPills.forEach(pill => {
      pill.addEventListener('click', () => {
        categoryPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        
        currentCategory = pill.getAttribute('data-category');
        
        // Default select first item in new category
        const firstItem = MATERIALS_REGISTRY[currentCategory][0];
        selectedMaterial = firstItem;
        
        renderSwatchesGrid();
        renderMaterialDetails(firstItem);
      });
    });

    // 1. Fetch live product data from Shopify
    const liveSuccess = await fetchProductsFromShopify();
    if (!liveSuccess) {
      // Fallback if shopify storefront is offline
      productsList = [...FALLBACK_PRODUCTS];
    }

    // 2. Set default active selections and render
    const defaultCategory = 'wood';
    const defaultItem = MATERIALS_REGISTRY[defaultCategory][0];
    currentCategory = defaultCategory;
    selectedMaterial = defaultItem;

    renderSwatchesGrid();
    renderMaterialDetails(defaultItem);

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
