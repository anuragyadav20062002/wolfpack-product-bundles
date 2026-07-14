import {
  getStorefrontConfigLoadPlan,
  mapTemplateSelection,
  resolveProductPageRenderFilledSlotsAsHorizontalStacked,
} from "../../../app/lib/bundle-config/template-selection";
import { deriveControlDependencies } from "../../../app/lib/bundle-config/control-dependencies";
import { buildCategoryContract } from "../../../app/lib/bundle-config/category-contracts";
import {
  formatStepCategoriesForRuntime,
  formatStepCategoryForRuntime,
} from "../../../app/lib/bundle-config/category-runtime";
import { serializeCartLineDisplayProperties } from "../../../app/lib/bundle-config/cart-line-messaging";

describe("mapTemplateSelection", () => {
  it.each([
    ["standard", "FBP_SIDE_FOOTER", "STANDARD", null],
    ["classic", "FBP_SIDE_FOOTER", "CLASSIC", null],
    ["compact", "FBP_SIDE_FOOTER", "COMPACT", null],
    ["horizontal", "FBP_SIDE_FOOTER", "HORIZONTAL", null],
  ])("maps full-page %s", (templateKey, bundleDesignTemplate, bundleDesignPresetId, templateId) => {
    expect(mapTemplateSelection("full_page", templateKey as any)).toEqual({
      bundleDesignTemplate,
      bundleDesignPresetId,
      templateId,
    });
  });

  it.each([
    ["product-list", "PDP_INPAGE", "CASCADE", "CASCADE"],
    ["product-grid", "PDP_INPAGE", "COGNIVE", "COGNIVE"],
    ["horizontal-slots", "PDP_MODAL", "MODAL", "MODAL"],
    ["vertical-slots", "PDP_MODAL", "SIMPLIFIED", "SIMPLIFIED"],
  ])("maps product-page %s", (templateKey, bundleDesignTemplate, bundleDesignPresetId, templateId) => {
    expect(mapTemplateSelection("product_page", templateKey as any)).toEqual({
      bundleDesignTemplate,
      bundleDesignPresetId,
      templateId,
    });
  });

  it("rejects a template key that is not valid for the bundle type", () => {
    expect(() => mapTemplateSelection("full_page", "product-grid")).toThrow(/template/i);
  });
});

describe("resolveProductPageRenderFilledSlotsAsHorizontalStacked", () => {
  it("maps EB horizontal modal slots to horizontally stacked selected slots", () => {
    expect(resolveProductPageRenderFilledSlotsAsHorizontalStacked("PDP_MODAL", "MODAL")).toBe(true);
  });

  it("maps EB vertical modal slots to vertically stacked selected slots", () => {
    expect(resolveProductPageRenderFilledSlotsAsHorizontalStacked("PDP_MODAL", "SIMPLIFIED")).toBe(false);
  });

  it("does not emit a modal slot orientation for in-page templates", () => {
    expect(resolveProductPageRenderFilledSlotsAsHorizontalStacked("PDP_INPAGE", "CASCADE")).toBeNull();
  });
});

describe("deriveControlDependencies", () => {
  it("keeps category rules hidden until more than one category exists", () => {
    expect(deriveControlDependencies({
      categoryCount: 1,
      ruleMode: "category",
    }).categoryRulesVisible).toBe(false);
  });

  it("tracks category rule visibility from the current draft category count", () => {
    expect(deriveControlDependencies({
      categoryCount: 1,
    }).categoryRulesVisible).toBe(false);

    expect(deriveControlDependencies({
      categoryCount: 2,
    }).categoryRulesVisible).toBe(true);

    expect(deriveControlDependencies({
      categoryCount: 1,
    }).categoryRulesVisible).toBe(false);
  });

  it("makes step and category rule modes mutually exclusive", () => {
    expect(deriveControlDependencies({
      categoryCount: 2,
      ruleMode: "category",
    })).toMatchObject({
      categoryRulesVisible: true,
      stepRulesDisabled: true,
      categoryRulesDisabled: false,
    });

    expect(deriveControlDependencies({
      categoryCount: 2,
      ruleMode: "step",
    })).toMatchObject({
      categoryRulesVisible: true,
      stepRulesDisabled: false,
      categoryRulesDisabled: true,
    });
  });

  it("gates discount messaging and discount display format", () => {
    expect(deriveControlDependencies({
      discountEnabled: false,
      discountDisplayEnabled: false,
    })).toMatchObject({
      discountMessagingEnabled: false,
      discountFormatEnabled: false,
    });
  });

  it("enables bundle quantity options only for non-BXY quantity rules", () => {
    expect(deriveControlDependencies({
      discountEnabled: true,
      discountMode: "percentage",
      ruleBasis: "quantity",
    }).bundleQuantityOptionsEnabled).toBe(true);

    expect(deriveControlDependencies({
      discountEnabled: true,
      discountMode: "percentage",
      ruleBasis: "amount",
    }).bundleQuantityOptionsEnabled).toBe(false);

    expect(deriveControlDependencies({
      discountEnabled: true,
      discountMode: "buy_x_get_y",
      ruleBasis: "quantity",
    })).toMatchObject({
      bundleQuantityOptionsEnabled: false,
      boxSelectionCleared: true,
    });
  });

  it("gates progress, quantity, and default product detail controls", () => {
    expect(deriveControlDependencies({
      progressType: "step_based",
      quantityValidationEnabled: true,
      preselectedProductsEnabled: true,
    })).toMatchObject({
      progressTierTextVisible: true,
      maxQuantityEnabled: true,
      defaultProductDetailsEnabled: true,
    });

    expect(deriveControlDependencies({
      progressType: "simple",
      quantityValidationEnabled: false,
      preselectedProductsEnabled: false,
    })).toMatchObject({
      progressTierTextVisible: false,
      maxQuantityEnabled: false,
      defaultProductDetailsEnabled: false,
    });
  });
});

describe("buildCategoryContract", () => {
  const product = {
    id: "gid://shopify/Product/111",
    productId: "111",
    graphqlId: "gid://shopify/Product/111",
    handle: "rings",
    variants: [{ variantGraphqlId: "gid://shopify/ProductVariant/222" }],
    title: "Rings",
  };

  const collection = {
    id: "gid://shopify/Collection/333",
    handle: "sets",
    title: "Sets",
  };

  const condition = { type: "quantity", condition: "greaterThanOrEqualTo", value: "01" };

  it("builds a full-page direct-products category", () => {
    expect(buildCategoryContract({
      bundleType: "full_page",
      categoryId: "category1",
      name: "Rings",
      title: "Rings",
      subTitle: "Pick one",
      products: [product],
      collectionsSelectedData: [collection],
      conditions: [condition],
      categoryBanner: "https://cdn.example/banner.png",
      categoryImg: "https://cdn.example/icon.png",
      autoNextStepOnConditionMet: true,
      multiLangData: { en: { title: "Rings" } },
    })).toEqual({
      categoryId: "category1",
      title: "Rings",
      subTitle: "Pick one",
      categoryImg: "https://cdn.example/icon.png",
      conditions: [condition],
      autoNextStepOnConditionMet: true,
      products: [product],
      selectedProducts: [],
      collectionsData: [],
      collectionsSelectedData: [collection],
      categoryBanner: "https://cdn.example/banner.png",
      multiLangData: { en: { title: "Rings" } },
    });
  });

  it("builds a full-page collection category", () => {
    expect(buildCategoryContract({
      bundleType: "full_page",
      categoryId: "category2",
      name: "Sets",
      products: [],
      collectionsSelectedData: [collection],
    })).toEqual({
      categoryId: "category2",
      title: "Sets",
      subTitle: "",
      categoryImg: "",
      conditions: [],
      autoNextStepOnConditionMet: false,
      products: [],
      selectedProducts: [],
      collectionsData: [],
      collectionsSelectedData: [collection],
      categoryBanner: "",
      multiLangData: {},
    });
  });

  it("builds a product-page direct-products category with variant flags", () => {
    expect(buildCategoryContract({
      bundleType: "product_page",
      categoryId: "category3",
      title: "Featured",
      subTitle: "Pick featured items",
      name: "Featured products",
      rank: 2,
      products: [product],
      collectionsSelectedData: [collection],
      conditions: [condition],
      categoryBanner: "https://cdn.example/category.png",
      displayVariantsAsIndividualProducts: true,
      displayVariantsAsSwatches: true,
      autoNextStepOnConditionMet: true,
      multiLangData: { en: { name: "Featured products" } },
    })).toEqual({
      categoryId: "category3",
      title: "Featured",
      subTitle: "Pick featured items",
      name: "Featured products",
      categoryRank: 2,
      conditions: [condition],
      autoNextStepOnConditionMet: true,
      products: [product],
      collectionsData: [],
      collectionsSelectedData: [collection],
      categoryBanner: "https://cdn.example/category.png",
      displayVariantsAsIndividualProducts: true,
      displayVariantsAsSwatches: true,
      multiLangData: { en: { name: "Featured products" } },
    });
  });

  it("builds a product-page collection category", () => {
    expect(buildCategoryContract({
      bundleType: "product_page",
      categoryId: "category4",
      name: "Collections",
      products: [],
      collectionsSelectedData: [collection],
    })).toMatchObject({
      products: [],
      collectionsData: [],
      collectionsSelectedData: [collection],
      conditions: [],
      subTitle: "",
      categoryBanner: "",
      displayVariantsAsIndividualProducts: false,
      displayVariantsAsSwatches: false,
      multiLangData: {},
    });
  });
});

describe("formatStepCategoryForRuntime", () => {
  it("preserves render-critical category product data for runtime/metafield output", () => {
    const hydratedProduct = {
      id: "gid://shopify/Product/111",
      productId: "111",
      graphqlId: "gid://shopify/Product/111",
      handle: "rings",
      title: "Rings",
      imageUrl: "https://cdn.example/ring-card.jpg",
      description: "Detailed ring description",
      descriptionHtml: "<p>Detailed ring description</p>",
      price: "10.00",
      weight: 2,
      weightUnit: "KILOGRAMS",
      vendor: "Admin-only vendor",
      createdAt: "2026-06-05T00:00:00Z",
      images: [
        { originalSrc: "https://cdn.example/ring.jpg", altText: "Ring" },
        { originalSrc: "https://cdn.example/ring-extra.jpg" },
      ],
      options: [
        { name: "Size", values: ["6", "7"], adminOnly: "strip me" },
      ],
      variants: Array.from({ length: 12 }, (_, index) => ({
        id: `gid://shopify/ProductVariant/${222 + index}`,
        title: `Size ${index + 6}`,
        price: "10.00",
        compareAtPrice: "12.00",
        weight: 125 + index,
        weightUnit: "GRAMS",
        availableForSale: true,
        quantityAvailable: 5,
        option1: String(index + 6),
        image: {
          originalSrc: `https://cdn.example/variant-${index}.jpg`,
          altText: "Variant image",
          width: 1200,
          height: 1200,
        },
        selectedOptions: [{ name: "Size", value: String(index + 6) }],
        inventoryPolicy: "DENY",
        sku: `SKU-${index}`,
        metafields: Array.from({ length: 5 }, (_, metaIndex) => ({
          key: `meta-${metaIndex}`,
          value: "x".repeat(250),
        })),
      })),
    };

    const runtime = formatStepCategoryForRuntime({
      id: "category-db-1",
      name: "Rings",
      products: [hydratedProduct],
      selectedProducts: [hydratedProduct],
    }, 0);

    expect(runtime.products).toEqual([
      {
        id: "gid://shopify/Product/111",
        productId: "111",
        graphqlId: "gid://shopify/Product/111",
        handle: "rings",
        title: "Rings",
        imageUrl: "https://cdn.example/ring-card.jpg",
        description: "Detailed ring description",
        descriptionHtml: "<p>Detailed ring description</p>",
        price: "10.00",
        weight: 2,
        weightUnit: "KILOGRAMS",
        images: [{ originalSrc: "https://cdn.example/ring.jpg" }],
        options: [{ name: "Size", values: ["6", "7"] }],
        variants: expect.arrayContaining([
          {
            id: "gid://shopify/ProductVariant/222",
            title: "Size 6",
            price: "10.00",
            compareAtPrice: "12.00",
            weight: 125,
            weightUnit: "GRAMS",
            available: true,
            quantityAvailable: 5,
            option1: "6",
            image: { src: "https://cdn.example/variant-0.jpg" },
          },
        ]),
      },
    ]);
    expect(runtime.products[0].variants).toHaveLength(12);
    expect(JSON.stringify(runtime.products[0])).not.toContain("selectedOptions");
    expect(JSON.stringify(runtime.products[0])).not.toContain("metafields");
    expect(JSON.stringify(runtime.products[0])).not.toContain("inventoryPolicy");
    expect(Buffer.byteLength(JSON.stringify(runtime.products[0]), "utf8")).toBeLessThan(6500);
    expect(runtime.selectedProducts).toEqual(runtime.products);
  });

  it("derives compact option fields from selectedOptions without exposing the raw array", () => {
    const hydratedProduct = {
      id: "gid://shopify/Product/222",
      title: "Black Crew Neck T-Shirt",
      variants: [
        {
          id: "gid://shopify/ProductVariant/333",
          title: "S / Black",
          price: "30.00",
          availableForSale: true,
          selectedOptions: [
            { name: "Size", value: "S" },
            { name: "Color", value: "Black" },
          ],
        },
        {
          id: "gid://shopify/ProductVariant/444",
          title: "M / Navy",
          price: "30.00",
          availableForSale: true,
          selectedOptions: [
            { name: "Size", value: "M" },
            { name: "Color", value: "Navy" },
          ],
        },
      ],
    };

    const runtime = formatStepCategoryForRuntime({
      id: "category-db-1",
      name: "Shirts",
      products: [hydratedProduct],
    }, 0);

    expect(runtime.products[0].options).toEqual([
      { name: "Size" },
      { name: "Color" },
    ]);
    expect(runtime.products[0].variants).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "gid://shopify/ProductVariant/333", option1: "S", option2: "Black" }),
      expect.objectContaining({ id: "gid://shopify/ProductVariant/444", option1: "M", option2: "Navy" }),
    ]));
    expect(JSON.stringify(runtime.products[0])).not.toContain("selectedOptions");
  });

  it("enriches category product stubs from raw step product sources", () => {
    const runtime = formatStepCategoriesForRuntime({
      StepCategory: [
        {
          id: "category-db-1",
          name: "Rings",
          products: [{ id: "gid://shopify/Product/111", title: "Category title" }],
        },
      ],
    }, [
      {
        id: "step-product-db-row",
        productId: "gid://shopify/Product/111",
        title: "Step title",
        imageUrl: "https://cdn.example/ring-card.jpg",
        description: "Source product description",
        price: "10.00",
        variants: [{ id: "gid://shopify/ProductVariant/222", price: "10.00", available: true }],
      },
    ]);

    expect(runtime[0].products).toEqual([
      {
        id: "gid://shopify/Product/111",
        productId: "gid://shopify/Product/111",
        title: "Category title",
        imageUrl: "https://cdn.example/ring-card.jpg",
        description: "Source product description",
        price: "10.00",
        variants: [{ id: "gid://shopify/ProductVariant/222", price: "10.00", available: true }],
      },
    ]);
  });
});

describe("serializeCartLineDisplayProperties", () => {
  const values = {
    items: "1 x Ring, 1 x Necklace",
    retailPrice: "$100.00",
    youSave: "$15.00",
  };

  it("emits public cart display properties when each setting is enabled", () => {
    expect(serializeCartLineDisplayProperties({
      isEnabled: true,
      showBundleContains: true,
      showOriginalPrice: true,
      discountDisplay: {
        isEnabled: true,
        format: "amount_percentage",
      },
    }, values)).toEqual({
      Box: "1",
      Items: values.items,
      "Retail Price": values.retailPrice,
      "You Save": values.youSave,
      _Items: "",
    });
  });

  it("keeps private item marker while omitting disabled public properties", () => {
    expect(serializeCartLineDisplayProperties({
      isEnabled: true,
      showBundleContains: false,
      showOriginalPrice: false,
      discountDisplay: {
        isEnabled: false,
        format: "amount_percentage",
      },
    }, values)).toEqual({
      Box: "1",
      _Items: "",
    });
  });
});

describe("getStorefrontConfigLoadPlan", () => {
  it("keeps the full-page load order stable", () => {
    expect(getStorefrontConfigLoadPlan("full_page")).toEqual([
      "metafield-cache",
      "proxy-api-fallback",
      "proxy-api-503-504-retry",
    ]);
  });

  it("uses the direct product-page config plan", () => {
    expect(getStorefrontConfigLoadPlan("product_page")).toEqual([
      "product-page-config",
    ]);
  });
});
