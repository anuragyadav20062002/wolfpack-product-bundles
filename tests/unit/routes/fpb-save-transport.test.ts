import { serializeFpbSaveSteps } from "../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/fpb-save-transport";

describe("serializeFpbSaveSteps", () => {
  it("keeps the save/runtime fields and drops bulky picker-only fields", () => {
    const steps = [
      {
        id: "step-1",
        name: "Pick one",
        pageTitle: "Choose your product",
        minQuantity: "1",
        maxQuantity: "3",
        enabled: true,
        displayVariantsAsIndividual: true,
        multiLangData: { en: { name: "Pick one" } },
        stepImage: "https://cdn.example.test/step.png",
        filters: [{ label: "Featured", value: "featured" }],
        products: [{ id: "gid://shopify/Product/legacy" }],
        collections: [{ id: "gid://shopify/Collection/stale", title: "Stale" }],
        StepProduct: [
          {
            id: "gid://shopify/Product/123",
            graphqlId: "gid://shopify/Product/123",
            handle: "test-product",
            title: "Test Product",
            descriptionHtml: "<p>Rich description</p>",
            imageUrl: "https://cdn.example.test/product.jpg",
            images: [
              { originalSrc: "https://cdn.example.test/product.jpg", width: 1600, height: 1600 },
              { originalSrc: "https://cdn.example.test/unused.jpg" },
            ],
            featuredImage: { url: "https://cdn.example.test/featured.jpg", altText: "Alt text" },
            options: [{ name: "Size", values: ["S", "M"] }],
            variants: [
              {
                id: "gid://shopify/ProductVariant/111",
                title: "Small",
                price: "19.99",
                compareAtPrice: "24.99",
                availableForSale: true,
                selectedOptions: [{ name: "Size", value: "S" }],
                image: { url: "https://cdn.example.test/variant.jpg", width: 1200 },
                inventoryItem: { tracked: true },
              },
            ],
            media: { nodes: [{ id: "media-1" }] },
            metafields: { nodes: [{ key: "large" }] },
            variantsConnection: { edges: [{ node: { id: "unused" } }] },
          },
        ],
        StepCategory: [
          {
            id: "category-1",
            name: "Category",
            title: "Category",
            subTitle: "Sub",
            sortOrder: 0,
            products: [{ id: "gid://shopify/Product/123" }],
            selectedProducts: [{ id: "gid://shopify/Product/123", title: "Test Product" }],
            collectionsSelectedData: [
              {
                id: "gid://shopify/Collection/222",
                collectionId: "222",
                admin_graphql_api_id: "gid://shopify/Collection/222",
                handle: "collection",
                title: "Collection",
                rules: [{ column: "tag" }],
              },
            ],
            conditions: [{ type: "quantity", operator: ">=", value: "1" }],
            categoryBanner: "https://cdn.example.test/banner.jpg",
            multiLangData: { en: { title: "Category" } },
            productsConnection: { edges: [{ node: { id: "unused" } }] },
          },
        ],
        addonLabel: "legacy add-on",
        freeGiftName: "legacy gift",
      },
    ];

    const result = serializeFpbSaveSteps(steps, {
      "step-1": [{ id: "gid://shopify/Collection/999", handle: "fresh", title: "Fresh" }],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "step-1",
      name: "Pick one",
      pageTitle: "Choose your product",
      minQuantity: "1",
      maxQuantity: "3",
      enabled: true,
      displayVariantsAsIndividual: true,
      isFreeGift: false,
      freeGiftName: null,
      addonLabel: null,
      addonTitle: null,
      addonIconUrl: null,
      addonDisplayFree: false,
      addonTiers: [],
      collections: [{ id: "gid://shopify/Collection/999", handle: "fresh", title: "Fresh" }],
    });
    expect(result[0].StepProduct[0]).toMatchObject({
      id: "gid://shopify/Product/123",
      graphqlId: "gid://shopify/Product/123",
      handle: "test-product",
      title: "Test Product",
      descriptionHtml: "<p>Rich description</p>",
      imageUrl: "https://cdn.example.test/product.jpg",
      images: [{ originalSrc: "https://cdn.example.test/product.jpg" }],
      featuredImage: { url: "https://cdn.example.test/featured.jpg" },
      options: [{ name: "Size", values: ["S", "M"] }],
      variants: [
        {
          id: "gid://shopify/ProductVariant/111",
          title: "Small",
          price: "19.99",
          compareAtPrice: "24.99",
          available: true,
          option1: "S",
          image: { src: "https://cdn.example.test/variant.jpg" },
        },
      ],
    });
    expect(result[0].StepProduct[0]).not.toHaveProperty("media");
    expect(result[0].StepProduct[0]).not.toHaveProperty("metafields");
    expect(result[0].StepProduct[0]).not.toHaveProperty("variantsConnection");
    expect(result[0].StepCategory[0]).toMatchObject({
      id: "category-1",
      title: "Category",
      products: [{ id: "gid://shopify/Product/123" }],
      selectedProducts: [{ id: "gid://shopify/Product/123", title: "Test Product" }],
      collectionsSelectedData: [
        {
          id: "gid://shopify/Collection/222",
          collectionId: "222",
          admin_graphql_api_id: "gid://shopify/Collection/222",
          handle: "collection",
          title: "Collection",
        },
      ],
    });
    expect(result[0].StepCategory[0]).not.toHaveProperty("productsConnection");
  });
});
