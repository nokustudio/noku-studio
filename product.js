/**
 * Noku Studio — Dynamic Product Detail Controller
 * Fetches product metadata, images, and variants from Shopify Storefront API.
 * Synchronizes options selection, gallery previews, cart drawers, and local checkouts.
 */

// ─── SHOPIFY STOREFRONT API CREDENTIALS ───
const SHOPIFY_CONFIG = {
  storefrontAccessToken: '7b62ad5d7d665bebe383ff2d3c36c0b0',
  shopDomain: '6b5390-f8.myshopify.com',
  apiVersion: '2024-04',
  currencySymbol: '₹',
  defaultPrice: 24500
};

// Global State
let currentProduct = null;
let selectedOptions = {};
let activeImageIndex = 0;
let cart = JSON.parse(localStorage.getItem('noku_cart')) || [];

// Fallback Product Database (Matches catalog products.js)
const FALLBACK_PRODUCTS_DB = {
  "sofa-2": {
    id: "gid://shopify/Product/7325874651194",
    title: "Grooved Sofa",
    handle: "sofa-2",
    description: "A meditation on silence. Mid-Century proportions paired with honest joinery. Rooted in our Chandigarh lineage, reimagined for contemporary living.",
    productType: "sofa",
    tags: ["sofa", "fabric", "leather"],
    dimension: "167.5cm x 78.5cm x 84.5cm",
    collections: { edges: [{ node: { title: "Of Stillness", handle: "of-stillness" } }] },
    images: {
      edges: [
        { node: { url: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c99b2583745be71136547_Noku_ofStillness_Sofa_grooved_02.jpeg", altText: "Grooved Sofa Main" } },
        { node: { url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/697c99b2583745be71136547_Noku_ofStillness_Sofa_grooved_02.jpeg", altText: "Grooved Sofa Side" } }
      ]
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/40593555587130",
            title: "Teak / Fabric - Charcoal",
            price: { amount: "81000.0", currencyCode: "INR" },
            image: { url: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c99b2583745be71136547_Noku_ofStillness_Sofa_grooved_02.jpeg" },
            selectedOptions: [
              { name: "Wood", value: "Teak" },
              { name: "Upholstery", value: "Fabric - Charcoal" }
            ]
          }
        }
      ]
    },
    options: [
      { name: "Wood", values: ["Teak"] },
      { name: "Upholstery", values: ["Fabric - Charcoal"] }
    ]
  },
  "lounge-chair": {
    id: "gid://shopify/Product/7319571562554",
    title: "Lounge Chair",
    handle: "lounge-chair",
    description: "Celebrating mid-century restraint and fine craftsmanship. An elegant visual weight with refined lines. Structured for ultimate ergonomic support.",
    productType: "chair",
    tags: ["chair", "lounge", "fabric", "leather"],
    dimension: "64.5cm x 83cm x 91.5cm",
    collections: { edges: [{ node: { title: "Of Stillness", handle: "of-stillness" } }] },
    images: {
      edges: [
        { node: { url: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c7724c1a8d27260d62288_Noku_ofStillness_Lounge_chair_02.jpeg", altText: "Lounge Chair Angle" } },
        { node: { url: "https://cdn.shopify.com/s/files/1/0565/9954/3866/files/Lounge_chair_-_teak_frame_-_linen.png?v=1774675403", altText: "Lounge Chair Teak Linen" } },
        { node: { url: "https://cdn.shopify.com/s/files/1/0565/9954/3866/files/Lounge_chair_-_whiteash_-_linen.png?v=1774676886", altText: "Lounge Chair Ash Linen" } }
      ]
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/40593534910522",
            title: "Teak / Fabric - Cloud",
            price: { amount: "49500.0", currencyCode: "INR" },
            image: { url: "https://cdn.shopify.com/s/files/1/0565/9954/3866/files/Lounge_chair_-_teak_frame_-_cloud.png?v=1774675403" },
            selectedOptions: [
              { name: "Wood", value: "Teak" },
              { name: "Upholstery", value: "Fabric - Cloud" }
            ]
          }
        },
        {
          node: {
            id: "gid://shopify/ProductVariant/40593534910523",
            title: "Teak / Fabric - Rubik Linen",
            price: { amount: "52000.0", currencyCode: "INR" },
            image: { url: "https://cdn.shopify.com/s/files/1/0565/9954/3866/files/Lounge_chair_-_teak_frame_-_linen.png?v=1774675403" },
            selectedOptions: [
              { name: "Wood", value: "Teak" },
              { name: "Upholstery", value: "Fabric - Rubik Linen" }
            ]
          }
        },
        {
          node: {
            id: "gid://shopify/ProductVariant/40593534910524",
            title: "White Ash / Fabric - Rubik Linen",
            price: { amount: "48000.0", currencyCode: "INR" },
            image: { url: "https://cdn.shopify.com/s/files/1/0565/9954/3866/files/Lounge_chair_-_whiteash_-_linen.png?v=1774676886" },
            selectedOptions: [
              { name: "Wood", value: "White Ash" },
              { name: "Upholstery", value: "Fabric - Rubik Linen" }
            ]
          }
        }
      ]
    },
    options: [
      { name: "Wood", values: ["Teak", "White Ash"] },
      { name: "Upholstery", values: ["Fabric - Cloud", "Fabric - Rubik Linen"] }
    ]
  },
  "dining-chair": {
    id: "gid://shopify/Product/7365013274682",
    title: "Dining Chair",
    handle: "dining-chair",
    description: "Lightweight dining joinery in warm hardwood finishes. Perfect blend of comfort and structural honesty. Reinterpreted Chandigarh style.",
    productType: "chair",
    tags: ["chair", "dining"],
    dimension: "45cm x 51.5cm x 83.5cm",
    collections: { edges: [{ node: { title: "Of Stillness", handle: "of-stillness" } }] },
    images: {
      edges: [
        { node: { url: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c99b2583745be7113654a_Noku_ofStillness_Dining_chair_03.jpeg", altText: "Dining Chair Front" } }
      ]
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/41218821881914",
            title: "Teak",
            price: { amount: "11500.0", currencyCode: "INR" },
            image: { url: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c99b2583745be7113654a_Noku_ofStillness_Dining_chair_03.jpeg" },
            selectedOptions: [
              { name: "Wood", value: "Teak" }
            ]
          }
        }
      ]
    },
    options: [
      { name: "Wood", values: ["Teak"] }
    ]
  },
  "modern-study-table": {
    id: "gid://shopify/Product/7320294064186",
    title: "Study Table",
    handle: "modern-study-table",
    description: "Premium solid teak workstation with elegant brass detailing. Built to inspire intent and focus.",
    productType: "table",
    tags: ["table", "study", "brass"],
    dimension: "143.5cm x 55cm x 76.5cm",
    collections: { edges: [{ node: { title: "Of Stillness", handle: "of-stillness" } }] },
    images: {
      edges: [
        { node: { url: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c7d6f73c94da715b34a92_Noku_ofStillness_Study_table_03.jpeg", altText: "Study Table ISO" } }
      ]
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/40573725409338",
            title: "Teak",
            price: { amount: "35000.0", currencyCode: "INR" },
            image: { url: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c7d6f73c94da715b34a92_Noku_ofStillness_Study_table_03.jpeg" },
            selectedOptions: [
              { name: "Wood", value: "Teak" }
            ]
          }
        }
      ]
    },
    options: [
      { name: "Wood", values: ["Teak"] }
    ]
  },
  "barstool": {
    id: "gid://shopify/Product/7320281120826",
    title: "Barstool",
    handle: "barstool",
    description: "A design statement of quiet elegance, wood, and upholstery. Handmade in India. Ergonomically shaped for dining counters.",
    productType: "barstool",
    tags: ["barstool", "leather", "fabric"],
    dimension: "51.5cm x 49.5cm x 93cm",
    collections: { edges: [{ node: { title: "Of Stillness", handle: "of-stillness" } }] },
    images: {
      edges: [
        { node: { url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/67cfdbb331dba957c997c00e_5d1622c83584a245197f9005889b2b06_Noku_ofStillness_Barstool_03%20copy.webp", altText: "Barstool Front" } }
      ]
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/40585660366906",
            title: "Teak / Leather - Cognac",
            price: { amount: "21000.0", currencyCode: "INR" },
            image: { url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/67cfdbb331dba957c997c00e_5d1622c83584a245197f9005889b2b06_Noku_ofStillness_Barstool_03%20copy.webp" },
            selectedOptions: [
              { name: "Wood", value: "Teak" },
              { name: "Upholstery", value: "Leather - Cognac" }
            ]
          }
        }
      ]
    },
    options: [
      { name: "Wood", values: ["Teak"] },
      { name: "Upholstery", values: ["Leather - Cognac"] }
    ]
  },
  "classic-study-table": {
    id: "gid://shopify/Product/7320292196410",
    title: "Classic Study Table",
    handle: "classic-study-table",
    description: "Vernacular lines combined with modern ergonomics. Features solid joinery and drawer space.",
    productType: "table",
    tags: ["table", "study"],
    dimension: "130cm x 60cm x 76cm",
    collections: { edges: [{ node: { title: "Of Memories", handle: "of-memories" } }] },
    images: {
      edges: [
        { node: { url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/69c00e7f4ffc4c910059d042_Study%20Table%2019%20C.png", altText: "Classic Study Table" } }
      ]
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/40573722853434",
            title: "Teak",
            price: { amount: "41500.0", currencyCode: "INR" },
            image: { url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/69c00e7f4ffc4c910059d042_Study%20Table%2019%20C.png" },
            selectedOptions: [
              { name: "Wood", value: "Teak" }
            ]
          }
        }
      ]
    },
    options: [
      { name: "Wood", values: ["Teak"] }
    ]
  },
  "side-table": {
    id: "gid://shopify/Product/7323011874874",
    title: "Side Table",
    handle: "side-table",
    description: "Compact design block with elegant, clean lines, ideal as a bedside companion or sofa accompaniment.",
    productType: "side table",
    tags: ["side table", "table"],
    dimension: "48cm x 48cm x 48.5cm",
    collections: { edges: [{ node: { title: "Of Stillness", handle: "of-stillness" } }] },
    images: {
      edges: [
        { node: { url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/69c00d403fa184eebc59c05c_Side%20Table%2042%20B.png", altText: "Side Table" } }
      ]
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/40583459569722",
            title: "Teak",
            price: { amount: "21000.0", currencyCode: "INR" },
            image: { url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/69c00d403fa184eebc59c05c_Side%20Table%2042%20B.png" },
            selectedOptions: [
              { name: "Wood", value: "Teak" }
            ]
          }
        }
      ]
    },
    options: [
      { name: "Wood", values: ["Teak"] }
    ]
  },
  "lounge-sofa": {
    id: "gid://shopify/Product/7325875505978",
    title: "Lounge Sofa",
    handle: "lounge-sofa",
    description: "Deep, comfortable, and beautifully finished sofa. A warm center point for your living room conversations.",
    productType: "sofa",
    tags: ["sofa", "lounge", "fabric", "leather"],
    dimension: "164cm x 78.5cm x 81.5cm",
    collections: { edges: [{ node: { title: "Of Memories", handle: "of-memories" } }] },
    images: {
      edges: [
        { node: { url: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c99b2583745be71136547_Noku_ofStillness_Sofa_grooved_02.jpeg", altText: "Lounge Sofa" } }
      ]
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/40573731110970",
            title: "Teak / Leather - Cognac",
            price: { amount: "119500.0", currencyCode: "INR" },
            image: { url: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c99b2583745be71136547_Noku_ofStillness_Sofa_grooved_02.jpeg" },
            selectedOptions: [
              { name: "Wood", value: "Teak" },
              { name: "Upholstery", value: "Leather - Cognac" }
            ]
          }
        }
      ]
    },
    options: [
      { name: "Wood", values: ["Teak"] },
      { name: "Upholstery", values: ["Leather - Cognac"] }
    ]
  },
  "upholstered-bench": {
    id: "gid://shopify/Product/7323012792378",
    title: "Upholstered Bench",
    handle: "upholstered-bench",
    description: "Elegant seating block with options for premium fabrics or leather, detailed with fine line stitch work.",
    productType: "bench",
    tags: ["bench", "fabric", "leather"],
    dimension: "143cm x 38cm x 46cm",
    collections: { edges: [{ node: { title: "Of Memories", handle: "of-memories" } }] },
    images: {
      edges: [
        { node: { url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/69c00d41cd825187ac22552f_Chair%2042%20A.png", altText: "Upholstered Bench" } }
      ]
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/40583462649914",
            title: "Teak / Leather - Cognac",
            price: { amount: "25500.0", currencyCode: "INR" },
            image: { url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/69c00d41cd825187ac22552f_Chair%2042%20A.png" },
            selectedOptions: [
              { name: "Wood", value: "Teak" },
              { name: "Upholstery", value: "Leather - Cognac" }
            ]
          }
        }
      ]
    },
    options: [
      { name: "Wood", values: ["Teak"] },
      { name: "Upholstery", values: ["Leather - Cognac"] }
    ]
  },
  "rod-bed-with-curved-headboard": {
    id: "gid://shopify/Product/7323013152826",
    title: "Rod Bed",
    handle: "rod-bed-with-curved-headboard",
    description: "Curved headboard bed with subtle spindle rod structures. Celebrating Chandigarh-heritage craft.",
    productType: "bed",
    tags: ["bed"],
    dimension: "194cm x 206.5cm x 91.5cm",
    collections: { edges: [{ node: { title: "Of Memories", handle: "of-memories" } }] },
    images: {
      edges: [
        { node: { url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/69c00dd8733454553abc99bc_Bed%2042%20A.png", altText: "Rod Bed" } }
      ]
    },
    variants: {
      edges: [
        {
          node: {
            id: "gid://shopify/ProductVariant/40583464583290",
            title: "Teak",
            price: { amount: "89500.0", currencyCode: "INR" },
            image: { url: "https://cdn.prod.website-files.com/667fb0113927090bb47059e6/69c00dd8733454553abc99bc_Bed%2042%20A.png" },
            selectedOptions: [
              { name: "Wood", value: "Teak" }
            ]
          }
        }
      ]
    },
    options: [
      { name: "Wood", values: ["Teak"] }
    ]
  }
};

// ─── MATERIALS LOOKUP REGISTER (From noku-materials.js context) ───
// Fallback local registry if window.NokuMaterials or global is not active
const LOCAL_MATERIALS_REGISTRY = {
  wood: [
    { id: "teak", name: "Teak", subtitle: "Tectona grandis", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68271f7bdd608f15ab8b132e_6684d13be6fded236edf434c_66784913da68c8264ab3b661_Reclaimed%252520Teak.png", desc: "Renowned for its rich golden to medium brown hues that deepen with age, teak's straight grain and coarse texture exude timeless elegance. Naturally resistant to water, rot, and pests." },
    { id: "honne", name: "Honne", subtitle: "Intsia bijuga", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68271f7bd362cf5fcc6f199f_6684d13a007aa9790384b31a_667849249a616f8ae8e17198_Honne.png", desc: "Characterized by rich, golden to reddish-brown color, which deepens over time, adding warmth and character. Notably resistant to decay, termites, and fungal attacks." },
    { id: "matti", name: "Matti", subtitle: "Terminalia elliptica", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68271f7bfe70716c8309c5ce_6684d13a9c12b76d06f85c52_667849369e20be0b462e46bc_Bhilwara.png", desc: "Also known as Indian Laurel, this hardwood ranges in colour from deep brown to almost black, with a grain reminiscent of walnut. Dense and heavy, offering exceptional strength." },
    { id: "pinewood", name: "Pinewood", subtitle: "Pinus spp", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68271f7b5e5a5bcc3b3b458a_67c94441373cbaa21b613a32_Pine%2520wood%2520texture.jpeg", desc: "A pale yellow to light brown softwood with a straight to slightly wavy grain and medium-to-coarse texture. Easy to work with and sturdy, ideal for fine joinery." },
    { id: "white-ash", name: "White Ash", subtitle: "Fraxinus americana", preview: "https://cdn.shopify.com/s/files/1/0565/9954/3866/files/Lounge_chair_-_whiteash_-_linen.png?v=1774676886", desc: "A strong, durable hardwood with a prominent open grain and light cream color. Offers modern aesthetics with organic grain texture." },
    { id: "reclaimed-teak", name: "Reclaimed Teak", subtitle: "Recycled Tectona grandis", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68271f7bdd608f15ab8b132e_6684d13be6fded236edf434c_66784913da68c8264ab3b661_Reclaimed%252520Teak.png", desc: "Beautiful aged teak salvaged from vintage structures. Offers deep patina, character marks, and exceptional stability." }
  ],
  leather: [
    { id: "glory-honey", name: "Glory Honey", subtitle: "Premium Hide", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/66cec28e6c0a94cedbd36d0a_Glory%20Honey.jpeg", desc: "A celebration of nature's glorious irregularities. This naked hide becomes your lifelong canvas, absorbing every encounter and moulding by each touch." },
    { id: "vagabond-cognac", name: "Vagabond Cognac", subtitle: "Full-Grain Leather", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68271f7b7de43506beb353c0_66cec1611ea4dfc3029cb4d7_Vagabond%2520Cognac.jpeg", desc: "A premium full-grain leather with rich, deep brown color and a luxurious feel. Its natural grain showcases the hide's unique textures with a smooth, supple touch." },
    { id: "montana-chestnut", name: "Montana Chestnut", subtitle: "Aniline Leather", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/6827205822401f3fb50795e0_66cec2f5d466a439da82b609_Montana%2520Chestnut.jpeg", desc: "Aniline finish that retains natural textures and grain. Soaked in oils and well moisturized for a natural sheen, cushiony appearance, and supple feel." },
    { id: "emperor-brick", name: "Emperor Brick", subtitle: "Natural Grain Hide", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68272058381cbcd3e131788e_66cec26058701322df701984_Emperor%2520Brick.jpeg", desc: "A thick hide with good body in a completely natural grain. Plush and pleasing to the touch, the grains command attention while forgiving small incidents." },
    { id: "eternity-olive", name: "Eternity Olive", subtitle: "Soft Pliable Hide", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68272058ea1975a65ccf41a6_66cec1aafc679d086da87306_Eternity%2520Olive.jpeg", desc: "Soft and pliable hides that drape like a dream. A cloudy two-tone effect and deep earthy tones combine with natural sheen." }
  ],
  fabric: [
    { id: "butter", name: "Butter", subtitle: "Easy-Clean Coating", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/682720157de43506beb3e391_67c6caa80801b708fdf2e726_DDecor%2520Comfort%25203%2520Rustic%2520Basketry%2520Butter.jpeg", desc: "Soft warm fabric with special easy-clean coating for high endurance, ideal for busy spaces." },
    { id: "blush", name: "Blush", subtitle: "Herringbone Pattern", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68272015403a98807dabdf75_66d5aca6a935ad183c8e3d5c_Blush.jpeg", desc: "Muted fabric with a subtle Herringbone pattern that adds visual texture to your cushions." },
    { id: "rosebud", name: "Rosebud", subtitle: "Classic Indoor Fabric", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/682720164dfecc77247f0b23_66cec38e223f22ca60d7f61e_Rosebud.png", desc: "Casual yet classic, Rosebud is versatile as an indoor fabric, great for interiors with a muted colour palette." },
    { id: "rubik-linen", name: "Rubik Linen", subtitle: "Textured Linen", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/6827201614898a0f1ef8fae8_66cec3b3736f9095d2f47d8a_Rubik%2520Linen.jpeg", desc: "Textured and soft fabric for bright interiors; contrasts beautifully with our dark wood options." },
    { id: "silver", name: "Silver", subtitle: "Herringbone Velvet Finish", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/6827201675c9ffb28b97be67_67c6c947f251ade2c21f630b_Marion%2520Silver%2520website%2520image.png", desc: "Classy and understated fabric with a subtle Herringbone pattern and velvet-like finish." },
    { id: "cloud", name: "Cloud", subtitle: "Reserved Grey Linen", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/6827201686cd6c20f65bfebd_66cec3c0b4b431d8064591dc_Cloud.jpeg", desc: "Linen option with a reserved grey finish to match any and every interiors palette." },
    { id: "opal", name: "Opal", subtitle: "Bold Hue Fabric", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68272016ea1975a65ccf045a_66cec3a0d44c5c37471c6e72_Opal.png", desc: "Bright and bold hue perfect for adding invigorating pops of colour to furniture and cushions." },
    { id: "vienna", name: "Vienna", subtitle: "Understated Opulence Velvet", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68272016e349c81eb78deae0_67c1868f9234871b00513025_Vienna%2520Army.jpeg", desc: "Soft, velvety touch adding subtle luminosity and understated luxury to living spaces." },
    { id: "flute", name: "Flute", subtitle: "Deep Navy Striped Fabric", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/682720157c98d145afc53748_66d5acbf57e9afbb44cfa786_Flute.jpeg", desc: "Striking lines in deep navy to add a vibrant texture to the furniture and space." },
    { id: "charcoal", name: "Charcoal", subtitle: "Plush Chenille Yarn", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/6827201786586d244fb7e451_66cec368f97fa4893227f3a2_Charcoal.png", desc: "Its chenille yarn offers a plush, multi-tonal finish, perfect for premium upholstery." }
  ],
  cane: [
    { id: "woven-cane", name: "Woven Cane", subtitle: "Natural Rattan Vine", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68271f7b453b55e1b9a21c03_6684d13aa6725a68337cc74f_66784e83c198b5a75b916393_Cane%252520Weave.png", desc: "Crafted from rattan vine, woven cane brings light and airy beauty with warm tones and surprising durability." }
  ],
  metals: [
    { id: "brass", name: "Brass", subtitle: "Copper-Zinc Alloy", preview: "https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/68271f7c4efe0f82a1ee7847_67c94a5ccae97b8acf9ee4bd_brass-rod-port.jpeg", desc: "A versatile copper-zinc alloy known for its golden-yellow color and luster. Develops a natural patina over time." }
  ]
};

// Find matching material from local/global registry
function findMaterialDetails(optValue) {
  if (!optValue) return null;
  const normValue = optValue.toLowerCase().trim();
  
  // Clean up option value (remove "Fabric - ", "Leather - ", etc.)
  const cleanVal = normValue
    .replace(/^fabric\s*-\s*/, '')
    .replace(/^leather\s*-\s*/, '')
    .replace(/[^a-z0-9]/g, '');

  for (const cat of ['wood', 'leather', 'fabric', 'cane', 'metals']) {
    const list = LOCAL_MATERIALS_REGISTRY[cat];
    for (const item of list) {
      const normId = item.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (cleanVal === normId || cleanVal === normName || normName.includes(cleanVal) || cleanVal.includes(normName)) {
        return { ...item, category: cat };
      }
    }
  }
  return null;
}

// ─── SHOPIFY GRAPHQL API QUERY client ───
async function fetchFromShopify(query, variables = {}) {
  const url = `https://${SHOPIFY_CONFIG.shopDomain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken
      },
      body: JSON.stringify({ query, variables })
    });
    if (!response.ok) {
      console.warn('Shopify storefront response failed:', response.statusText);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch from Shopify:', error);
    return null;
  }
}

// ─── CONTROLLER BOOTSTRAP ───
document.addEventListener('DOMContentLoaded', () => {
  // Extract handle from query param
  const urlParams = new URLSearchParams(window.location.search);
  const handle = urlParams.get('handle') || 'lounge-chair';

  // Bind cart drawer buttons
  const cartToggleBtn = document.getElementById('cart-toggle');
  const cartCloseBtn = document.getElementById('cart-close');
  const cartOverlay = document.getElementById('cart-overlay');
  const checkoutBtn = document.getElementById('checkout-btn');
  const cartItemsContainer = document.getElementById('cart-items-container');

  if (cartToggleBtn) cartToggleBtn.addEventListener('click', openCartDrawer);
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCartDrawer);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);
  if (checkoutBtn) checkoutBtn.addEventListener('click', proceedToCheckout);

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

  // Bind storage events
  window.addEventListener('storage', updateCartUI);

  // Mobile navigation menu toggle
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // Initialize
  updateCartUI();
  loadProduct(handle);
});

// ─── LOAD PRODUCT DATA ───
async function loadProduct(handle) {
  const query = `
    query getProductByHandle($handle: String!) {
      product(handle: $handle) {
        id
        title
        description
        handle
        productType
        tags
        collections(first: 3) {
          edges {
            node {
              title
              handle
            }
          }
        }
        metafield(namespace: "custom", key: "dimension") {
          value
        }
        images(first: 30) {
          edges {
            node {
              url
              altText
            }
          }
        }
        variants(first: 100) {
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
        options {
          name
          values
        }
      }
    }
  `;

  let productData = null;

  try {
    const res = await fetchFromShopify(query, { handle });
    if (res && res.data && res.data.product) {
      productData = res.data.product;
      console.log('Successfully fetched live Shopify product:', productData.title);
    }
  } catch (err) {
    console.warn('GraphQL product fetch failed. Using local database.', err);
  }

  // Fallback if storefront API returns nothing
  if (!productData) {
    productData = FALLBACK_PRODUCTS_DB[handle];
    if (!productData) {
      // Final fallback if the requested handle doesn't exist
      productData = FALLBACK_PRODUCTS_DB['lounge-chair'];
      console.warn(`Handle "${handle}" not found. Falling back to lounge-chair.`);
    } else {
      console.log('Loaded product from offline fallback DB:', productData.title);
    }
  }

  currentProduct = productData;
  
  // Set initial selected options
  currentProduct.options.forEach(opt => {
    selectedOptions[opt.name] = opt.values[0];
  });

  renderProductPage();
  loadRelatedProducts();
}

// ─── RENDER DETAILED INTERFACE ───
function renderProductPage() {
  const detailContainer = document.getElementById('product-detail-container');
  if (!detailContainer) return;

  // Extract collection title
  let collectionTitle = 'Noku Pieces';
  if (currentProduct.collections && currentProduct.collections.edges.length > 0) {
    collectionTitle = currentProduct.collections.edges[0].node.title;
  }

  // Find initial variant
  const initialVariant = findMatchingVariant();
  const initialPrice = initialVariant ? parseFloat(initialVariant.price.amount) : SHOPIFY_CONFIG.defaultPrice;

  // Get image URLs list
  const imageUrls = currentProduct.images.edges.map(e => e.node.url);
  if (imageUrls.length === 0) {
    imageUrls.push('https://cdn.prod.website-files.com/668005cedc17dd78060b98a8/697c7724c1a8d27260d62288_Noku_ofStillness_Lounge_chair_02.jpeg');
  }

  // Create Gallery HTML
  let thumbnailsHtml = '';
  imageUrls.forEach((url, idx) => {
    thumbnailsHtml += `
      <div class="thumbnail-item ${idx === 0 ? 'active' : ''}" data-index="${idx}">
        <img src="${url}" alt="Thumbnail ${idx + 1}">
      </div>
    `;
  });

  // Create Options selector HTML
  let optionsHtml = '';
  currentProduct.options.forEach(opt => {
    const isWood = opt.name.toLowerCase() === 'wood' || opt.name.toLowerCase() === 'finish';
    const isUpholstery = opt.name.toLowerCase() === 'upholstery' || opt.name.toLowerCase() === 'cushion';

    optionsHtml += `
      <div class="option-group" data-option-name="${opt.name}">
        <div class="option-label-row">
          <span class="option-title">${opt.name}</span>
          <span class="option-selected-val" id="selected-val-${opt.name.replace(/\s+/g, '')}">${selectedOptions[opt.name]}</span>
        </div>
        <div class="swatches-row">
    `;

    opt.values.forEach(val => {
      const mat = findMaterialDetails(val);
      const isActive = selectedOptions[opt.name] === val;

      if ((isWood || isUpholstery) && mat && mat.preview) {
        // Render rich swatch circle
        optionsHtml += `
          <div class="swatch-circle ${isActive ? 'active' : ''}" 
               data-value="${val}" 
               data-option="${opt.name}"
               title="${val}" 
               style="background-image: url('${mat.preview}');">
          </div>
        `;
      } else {
        // Render text pill button
        optionsHtml += `
          <button class="swatch-pill ${isActive ? 'active' : ''}" 
                  data-value="${val}" 
                  data-option="${opt.name}">
            ${val}
          </button>
        `;
      }
    });

    optionsHtml += `
        </div>
      </div>
    `;
  });

  // Load dimension string from metafield or fallback spec
  const dimensionStr = (currentProduct.metafield && currentProduct.metafield.value) || currentProduct.dimension || "Not specified";

  // Re-write layout contents
  detailContainer.innerHTML = `
    <!-- Gallery block -->
    <div class="product-gallery">
      <div class="main-image-viewport" id="main-viewport">
        <img id="main-product-image" src="${imageUrls[0]}" alt="${currentProduct.title}">
      </div>
      <div class="thumbnail-list" id="thumbnails-container">
        ${thumbnailsHtml}
      </div>
    </div>

    <!-- Info Column -->
    <div class="product-info-panel">
      <div class="product-header-block">
        <span class="collection-eyebrow">${collectionTitle}</span>
        <h1 class="product-title-text">${currentProduct.title}</h1>
        <div id="product-price-display" class="product-price-text">${formatCurrency(initialPrice)}</div>
      </div>

      <div class="product-desc-text">
        ${currentProduct.description}
      </div>

      <!-- Selectors group -->
      <div class="options-container" id="options-selectors-container">
        ${optionsHtml}
      </div>

      <!-- Detailed Swatch Description Block -->
      <div id="selected-materials-box" class="material-details-box" style="display: none;">
        <h3 class="box-title">Material Details</h3>
        <div class="material-details-grid" id="materials-grid-container">
          <!-- Filled dynamically when swatches are selected -->
        </div>
      </div>

      <!-- Dimensions Block -->
      <div class="option-group">
        <span class="option-title">Dimensions</span>
        <div class="dimensions-display-row">
          <svg class="dim-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
            <line x1="15" y1="3" x2="15" y2="21"></line>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="3" y1="15" x2="21" y2="15"></line>
          </svg>
          <span class="dimensions-val">${dimensionStr}</span>
        </div>
      </div>

      <!-- Purchase Controls -->
      <div class="purchase-controls">
        <div class="quantity-selector-wrap">
          <span class="qty-label">Quantity</span>
          <div class="qty-counter">
            <button id="detail-qty-dec" class="qty-counter-btn" aria-label="Decrease quantity">-</button>
            <input type="number" id="detail-qty-val" class="qty-counter-val" value="1" min="1" readonly>
            <button id="detail-qty-inc" class="qty-counter-btn" aria-label="Increase quantity">+</button>
          </div>
        </div>

        <div class="action-buttons-wrap">
          <button id="btn-add-cart" class="btn-primary-action">Add to Cart</button>
          <button id="btn-buy-now" class="btn-secondary-action">Buy Now</button>
        </div>
      </div>
    </div>
  `;

  // Bind quantity action controls
  const decBtn = document.getElementById('detail-qty-dec');
  const incBtn = document.getElementById('detail-qty-inc');
  const qtyInput = document.getElementById('detail-qty-val');

  if (decBtn && incBtn && qtyInput) {
    decBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value) || 1;
      if (val > 1) qtyInput.value = val - 1;
    });
    incBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value) || 1;
      qtyInput.value = val + 1;
    });
  }

  // Bind Add to Cart / Buy Now buttons
  const addCartBtn = document.getElementById('btn-add-cart');
  const buyNowBtn = document.getElementById('btn-buy-now');

  if (addCartBtn) {
    addCartBtn.addEventListener('click', () => {
      const activeVariant = findMatchingVariant();
      const qty = parseInt(qtyInput.value) || 1;
      addCurrentItemToCart(activeVariant, qty);
    });
  }

  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      const activeVariant = findMatchingVariant();
      const qty = parseInt(qtyInput.value) || 1;
      addCurrentItemToCart(activeVariant, qty, false); // add to cart without opening drawer
      proceedToCheckout();
    });
  }

  // Bind Gallery image thumbs
  const thumbs = document.querySelectorAll('.thumbnail-item');
  const mainImage = document.getElementById('main-product-image');
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      const idx = parseInt(thumb.dataset.index);
      activeImageIndex = idx;
      
      // Animate transition smoothly
      mainImage.style.opacity = '0.3';
      setTimeout(() => {
        mainImage.src = imageUrls[idx];
        mainImage.style.opacity = '1';
      }, 150);
    });
  });

  // Bind option swatch selection events
  const swatches = document.querySelectorAll('.swatch-circle, .swatch-pill');
  swatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      const optName = swatch.dataset.option;
      const optVal = swatch.dataset.value;
      
      // Update selected options map
      selectedOptions[optName] = optVal;
      
      // Recalculate options view
      const group = swatch.closest('.option-group');
      group.querySelectorAll('.swatch-circle, .swatch-pill').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      
      const valLabel = document.getElementById(`selected-val-${optName.replace(/\s+/g, '')}`);
      if (valLabel) valLabel.textContent = optVal;

      // Update variant display values (price + image + materials info card)
      updateVariantDisplays();
    });
  });

  // Initial draw of materials card info
  updateVariantDisplays(true);
}

// ─── UPDATE VARIANT SPECIFICS ───
function updateVariantDisplays(isInitial = false) {
  const matched = findMatchingVariant();
  if (!matched) return;

  // Update Price
  const priceDisplay = document.getElementById('product-price-display');
  if (priceDisplay) {
    priceDisplay.textContent = formatCurrency(parseFloat(matched.price.amount));
  }

  // Sync Featured image if variant has an image
  if (matched.image && matched.image.url) {
    const mainImage = document.getElementById('main-product-image');
    if (mainImage && mainImage.src !== matched.image.url) {
      mainImage.style.opacity = '0.3';
      setTimeout(() => {
        mainImage.src = matched.image.url;
        mainImage.style.opacity = '1';
      }, 150);
      
      // De-activate current thumbs
      document.querySelectorAll('.thumbnail-item').forEach(t => t.classList.remove('active'));
    }
  }

  // Update "For each product, show only the material of the variant displayed"
  const materialBox = document.getElementById('selected-materials-box');
  const materialsGrid = document.getElementById('materials-grid-container');

  if (materialBox && materialsGrid) {
    let gridHtml = '';
    let foundAny = false;

    matched.selectedOptions.forEach(opt => {
      const mat = findMaterialDetails(opt.value);
      if (mat) {
        foundAny = true;
        gridHtml += `
          <div class="material-detail-item">
            <div class="material-header">
              <div class="material-swatch" style="background-image: url('${mat.preview}');"></div>
              <div>
                <div class="material-name">${mat.name}</div>
                <div class="material-sub">${mat.subtitle || ''}</div>
              </div>
            </div>
            <p class="material-desc">${mat.desc}</p>
          </div>
        `;
      }
    });

    if (foundAny) {
      materialsGrid.innerHTML = gridHtml;
      materialBox.style.display = 'flex';
    } else {
      materialBox.style.display = 'none';
    }
  }
}

// Helper to match active selected options with product variants list
function findMatchingVariant() {
  if (!currentProduct || !currentProduct.variants) return null;
  
  const matchedEdge = currentProduct.variants.edges.find(edge => {
    const v = edge.node;
    return v.selectedOptions.every(opt => {
      return selectedOptions[opt.name] === opt.value;
    });
  });

  return matchedEdge ? matchedEdge.node : currentProduct.variants.edges[0]?.node;
}

// ─── ADD TO STORAGE CART DRAWERS ───
function addCurrentItemToCart(variant, quantity = 1, triggerDrawer = true) {
  if (!currentProduct || !variant) return;

  // Create unique cart item key
  const optionsLabel = variant.selectedOptions.map(o => o.value).join(' / ');
  const cartItemId = `prod-${currentProduct.id}-${variant.id}`.replace(/[^a-zA-Z0-9-]/g, '');

  const existingIndex = cart.findIndex(item => item.id === cartItemId || item.variantId === variant.id);

  if (existingIndex > -1) {
    cart[existingIndex].quantity += quantity;
  } else {
    // Determine thumbnail image
    const image = (variant.image && variant.image.url) || currentProduct.images.edges[0]?.node.url || '';
    
    cart.push({
      id: cartItemId,
      title: currentProduct.title,
      price: parseFloat(variant.price.amount),
      image: image,
      variantId: variant.id,
      quantity: quantity,
      options: {
        variantTitle: optionsLabel
      }
    });
  }

  saveCart();
  if (triggerDrawer) {
    openCartDrawer();
  }
}

function saveCart() {
  localStorage.setItem('noku_cart', JSON.stringify(cart));
  updateCartUI();
  // Trigger storage sync across windows
  window.dispatchEvent(new Event('storage'));
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

// ─── CHECKOUT LOGIC ───
async function proceedToCheckout() {
  if (cart.length === 0) return;
  
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Preparing Checkout...';
  }

  // Create Cart Create Shopify Storefront API Mutation
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

  const lines = cart.map(item => {
    let rawVariantId = item.variantId;
    if (!rawVariantId.startsWith('gid://shopify/ProductVariant/')) {
      // Fallback checkout variant ID if checkout code has a mock ID
      rawVariantId = 'gid://shopify/ProductVariant/40593534910522'; 
    }
    return {
      merchandiseId: rawVariantId,
      quantity: item.quantity
    };
  });

  try {
    const res = await fetchFromShopify(mutation, { input: { lines } });
    if (res && res.data && res.data.cartCreate && res.data.cartCreate.cart) {
      const checkoutUrl = res.data.cartCreate.cart.checkoutUrl;
      console.log('Redirecting to Shopify Checkout:', checkoutUrl);
      window.location.href = checkoutUrl;
      return;
    }
  } catch (err) {
    console.warn("Shopify Checkout mutation failed. Running simulation fallback.", err);
  }

  // Fallback Simulation Dialog Modal
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

// ─── CART UI UPDATER ───
function updateCartUI() {
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartCountBadge = document.getElementById('cart-count-badge');
  const cartSubtotalEl = document.getElementById('cart-subtotal');
  const checkoutBtn = document.getElementById('checkout-btn');

  // Load from local storage
  cart = JSON.parse(localStorage.getItem('noku_cart')) || [];

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCountBadge) {
    cartCountBadge.textContent = totalItems;
  }

  if (!cartItemsContainer) return;
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

// ─── LOAD RELATED PIECES GRID ───
async function loadRelatedProducts() {
  const grid = document.getElementById('related-products-grid');
  if (!grid) return;

  const currentHandle = currentProduct.handle;
  let productsList = [];

  // Query Shopify Storefront API for products in the collection
  if (currentProduct.collections && currentProduct.collections.edges.length > 0) {
    const collHandle = currentProduct.collections.edges[0].node.handle;
    const query = `
      query getCollectionProducts($handle: String!) {
        collection(handle: $handle) {
          products(first: 10) {
            edges {
              node {
                id
                title
                handle
                description
                productType
                tags
                featuredImage {
                  url
                  altText
                }
                variants(first: 20) {
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
      const res = await fetchFromShopify(query, { handle: collHandle });
      if (res && res.data && res.data.collection && res.data.collection.products) {
        productsList = res.data.collection.products.edges
          .map(e => e.node)
          .filter(p => p.handle !== currentHandle);
      }
    } catch (err) {
      console.warn("Failed to fetch related products from API:", err);
    }
  }

  // Fallback to offline products list in same collection
  if (productsList.length === 0) {
    const collTitle = (currentProduct.collections && currentProduct.collections.edges[0]?.node.title) || '';
    productsList = Object.values(FALLBACK_PRODUCTS_DB).filter(p => {
      const isSameCollection = p.collections.edges.some(c => c.node.title === collTitle);
      return isSameCollection && p.handle !== currentHandle;
    });
  }

  // Display top 3 products
  const displayProducts = productsList.slice(0, 3);

  if (displayProducts.length === 0) {
    // fallback to any 3 products in database if no collection match
    displayProducts.push(...Object.values(FALLBACK_PRODUCTS_DB).filter(p => p.handle !== currentHandle).slice(0, 3));
  }

  grid.innerHTML = '';

  displayProducts.forEach(p => {
    const priceVal = p.variants.edges[0]?.node.price.amount || SHOPIFY_CONFIG.defaultPrice;
    const imgUrl = (p.featuredImage && p.featuredImage.url) || p.images?.edges[0]?.node.url || '';
    
    // Extract variant materials string
    let materialsStr = 'Solid Hardwood';
    if (p.variants.edges[0]?.node.selectedOptions) {
      materialsStr = p.variants.edges[0].node.selectedOptions.map(o => o.value).join(' / ');
    } else if (p.variants.edges[0]?.node.title !== 'Default Title') {
      materialsStr = p.variants.edges[0]?.node.title || '';
    }

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <a href="product.html?handle=${p.handle}" class="product-card-img-wrap">
        <img src="${imgUrl}" alt="${p.title}" loading="lazy">
      </a>
      <div class="product-card-body">
        <div class="product-card-header">
          <a href="product.html?handle=${p.handle}" class="product-name">${p.title}</a>
          <div class="product-materials">${materialsStr}</div>
        </div>
        <div class="product-buy-row">
          <div class="product-price">${formatCurrency(parseFloat(priceVal))}</div>
          <button class="product-add-to-cart-btn" data-handle="${p.handle}">Details</button>
        </div>
      </div>
    `;

    card.querySelector('.product-add-to-cart-btn').addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = `product.html?handle=${p.handle}`;
    });

    grid.appendChild(card);
  });
}

// ─── GENERAL HELPERS ───
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
}
