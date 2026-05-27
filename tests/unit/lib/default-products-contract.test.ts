import {
  buildDefaultProductEntryFromPicker,
  normalizeDefaultProductsData,
} from "../../../app/lib/bundle-config/default-products";

describe("default products direct contract", () => {
  it("maps Shopify product-picker output to the direct defaultProductsData shape", () => {
    const entry = buildDefaultProductEntryFromPicker({
      id: "gid://shopify/Product/8322625700036",
      title: "18k Bloom Earrings",
      handle: "18k-bloom-earrings",
      images: [{ originalSrc: "https://cdn.example/earrings.jpg" }],
      variants: [
        {
          id: "gid://shopify/ProductVariant/45038876459204",
          title: "Default Title",
          price: "579.00",
          inventoryQuantity: 13,
        },
      ],
      hasOnlyDefaultVariant: true,
    });

    expect(entry).toEqual({
      productId: "8322625700036",
      graphqlId: "gid://shopify/Product/8322625700036",
      handle: "18k-bloom-earrings",
      title: "18k Bloom Earrings",
      images: [{ originalSrc: "https://cdn.example/earrings.jpg" }],
      variants: [
        {
          variantId: "45038876459204",
          variantGraphqlId: "gid://shopify/ProductVariant/45038876459204",
          inventoryQuantity: 13,
          price: "579.00",
        },
      ],
      hasOnlyDefaultVariant: true,
      requiredQuantity: 1,
    });
  });

  it("serializes one available picker variant for a multi-variant default product", () => {
    const entry = buildDefaultProductEntryFromPicker({
      id: "gid://shopify/Product/9427287703811",
      title: "Multi Variant Case",
      handle: "multi-variant-case",
      variants: [
        {
          id: "gid://shopify/ProductVariant/48191691424003",
          price: "123.00",
          inventoryQuantity: 0,
          availableForSale: false,
        },
        {
          id: "gid://shopify/ProductVariant/48191691456771",
          price: "123.00",
          inventoryQuantity: 0,
          availableForSale: true,
        },
      ],
    });

    expect(entry?.variants).toEqual([
      {
        variantId: "48191691456771",
        variantGraphqlId: "gid://shopify/ProductVariant/48191691456771",
        inventoryQuantity: 0,
        price: "123.00",
      },
    ]);
  });

  it("normalizes disabled default products without carrying stale products", () => {
    expect(normalizeDefaultProductsData({
      isDefaultProductsEnabled: false,
      defaultProductsTitle: "Preselected audit products",
      products: [{ productId: "8322625700036" }],
    })).toEqual({});
  });

  it("preserves the enabled title and normalized products", () => {
    expect(normalizeDefaultProductsData({
      isDefaultProductsEnabled: true,
      defaultProductsTitle: "Preselected audit products",
      products: [
        {
          productId: "8322625700036",
          graphqlId: "gid://shopify/Product/8322625700036",
          title: "18k Bloom Earrings",
          variants: [
            {
              variantId: "45038876459204",
              variantGraphqlId: "gid://shopify/ProductVariant/45038876459204",
              price: "579.00",
            },
          ],
          requiredQuantity: 1,
        },
      ],
    })).toMatchObject({
      isDefaultProductsEnabled: true,
      defaultProductsTitle: "Preselected audit products",
      products: [
        {
          productId: "8322625700036",
          graphqlId: "gid://shopify/Product/8322625700036",
          title: "18k Bloom Earrings",
          variants: [
            {
              variantId: "45038876459204",
              variantGraphqlId: "gid://shopify/ProductVariant/45038876459204",
              price: "579.00",
            },
          ],
          requiredQuantity: 1,
        },
      ],
    });
  });
});
