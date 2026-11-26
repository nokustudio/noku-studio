// The Shopify query for the /products catalogue, and which results count as real pieces.
// Shared so the browser (products.js) and the server (api/products.js, which renders the
// grid and embeds the result in the page) agree on exactly the same data.
(function (root) {
  const QUERY = `
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
          purchaseMode: metafield(namespace: "custom", key: "purchasemode") { value }
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

  // Leave out draft/test products: no image, every variant priced at zero, or
  // "draft"/"test" in the title.
  function isListed(p) {
    const hasNoImage = !p.featuredImage || !p.featuredImage.url;
    const allVariantsZeroPrice = p.variants?.edges?.length > 0 &&
      p.variants.edges.every(vEdge => parseFloat(vEdge.node.price?.amount || '0') === 0);
    const hasDraftTitle = p.title && (p.title.toLowerCase().includes('draft') || p.title.toLowerCase().includes('test'));
    return !(hasNoImage || allVariantsZeroPrice || hasDraftTitle);
  }

  const api = { QUERY, isListed };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.NOKU_PRODUCTS = api;
})(this);
