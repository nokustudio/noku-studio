// The Shopify query for one product page. Shared so the browser (product.js) and the
// server (api/product.js, which embeds the result in the page) ask for exactly the same data.
(function (root) {
  const QUERY = `
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
        purchaseMode: metafield(namespace: "custom", key: "purchasemode") {
          value
        }
        woodFinishMetafield: metafield(namespace: "custom", key: "wood_finish") {
          value
        }
        dimensionImagesMetafield: metafield(namespace: "custom", key: "dimension_images") {
          references(first: 10) {
            edges {
              node {
                ... on MediaImage {
                  image {
                    url
                  }
                }
              }
            }
          }
        }
        media(first: 10) {
          edges {
            node {
              mediaContentType
              ... on Model3d {
                id
                alt
                sources {
                  url
                  format
                  mimeType
                }
              }
            }
          }
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
  if (typeof module !== 'undefined' && module.exports) module.exports = QUERY;
  else root.NOKU_PRODUCT_QUERY = QUERY;
})(this);
