import {
  buildFpbBaseConfig,
  buildFullPageBundleMetafieldConfig,
} from "../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/shared.server";

describe("FPB runtime metafield config", () => {
  const product = {
    id: "gid://shopify/Product/123",
    title: "Runtime Product",
    imageUrl: "https://cdn.shopify.com/product.jpg",
    price: 1999,
    compareAtPrice: 2499,
    variants: [
      {
        id: "gid://shopify/ProductVariant/111",
        title: "Small",
        price: 1999,
        compareAtPrice: 2499,
        available: true,
      },
      {
        id: "gid://shopify/ProductVariant/222",
        title: "Large",
        price: 2199,
        available: true,
      },
    ],
  };

  it("preserves enriched products in the full-page metafield config", () => {
    const config = buildFullPageBundleMetafieldConfig({
      id: "bundle-1",
      name: "Bundle",
      description: "",
      status: "active",
      bundleType: "full_page",
      fullPageLayout: null,
      templateName: null,
      shopifyProductId: "gid://shopify/Product/999",
      shopifyPageHandle: "bundle",
      steps: [
        {
          id: "step-1",
          name: "Step 1",
          StepProduct: [product],
          StepCategory: [
            {
              id: "cat-1",
              title: "Category 1",
              products: [{ id: "gid://shopify/Product/123" }],
            },
          ],
        },
      ],
      pricing: null,
    });

    expect(config.steps[0].products[0]).toMatchObject({
      id: "gid://shopify/Product/123",
      price: 1999,
      compareAtPrice: 2499,
      variants: expect.arrayContaining([
        expect.objectContaining({ id: "gid://shopify/ProductVariant/111", price: 1999 }),
        expect.objectContaining({ id: "gid://shopify/ProductVariant/222", price: 2199 }),
      ]),
    });
    expect(config.steps[0].categories[0].products[0]).toMatchObject({
      id: "gid://shopify/Product/123",
      price: 1999,
      variants: expect.arrayContaining([
        expect.objectContaining({ id: "gid://shopify/ProductVariant/111", price: 1999 }),
      ]),
    });
  });

  it("preserves fixedBundlePrice in base config pricing rules", () => {
    const config = buildFpbBaseConfig(
      {
        id: "bundle-1",
        name: "Bundle",
        description: "",
        status: "active",
        bundleType: "full_page",
        fullPageLayout: null,
        templateName: null,
        shopifyProductId: "gid://shopify/Product/999",
        shopifyPageHandle: "bundle",
      },
      [
        {
          id: "step-1",
          name: "Step 1",
          StepProduct: [product],
        },
      ],
      {},
      {
        discountEnabled: true,
        discountType: "fixed_bundle_price",
        discountRules: [
          {
            id: "rule-1",
            conditionType: "quantity",
            conditionValue: 2,
            discountValue: 770,
            fixedBundlePrice: 4999,
          },
        ],
      },
      "gid://shopify/ProductVariant/999",
    );

    expect(config.steps[0].products[0]).toMatchObject({
      id: "gid://shopify/Product/123",
      price: 1999,
      variants: expect.arrayContaining([
        expect.objectContaining({ id: "gid://shopify/ProductVariant/111", price: 1999 }),
      ]),
    });
    expect(config.pricing.rules[0]).toMatchObject({
      discountValue: 770,
      fixedBundlePrice: 4999,
    });
  });
});
