import { describe, expect, it } from "@jest/globals";

import {
  getStorefrontConfigLoadPlan,
  mapTemplateSelection,
  resolveProductPageRenderFilledSlotsAsHorizontalStacked,
} from "../../../app/lib/bundle-config/evidence-template-mapping";
import { deriveControlDependencies } from "../../../app/lib/bundle-config/control-dependencies";
import { buildCategoryContract } from "../../../app/lib/bundle-config/category-contracts";
import { formatStepCategoryForRuntime } from "../../../app/lib/bundle-config/category-runtime";
import { serializeCartLineDisplayProperties } from "../../../app/lib/bundle-config/cart-line-messaging";

describe("mapTemplateSelection", () => {
  it.each([
    ["standard", "FBP_SIDE_FOOTER", "DEFAULT", null],
    ["classic", "FBP_SIDE_FOOTER", "CLASSIC", null],
    ["compact", "FBP_SIDE_FOOTER", "COMPACT", null],
    ["horizontal", "FBP_SIDE_FOOTER", "HORIZONTAL", null],
  ] as const)("maps full-page %s", (templateKey, bundleDesignTemplate, bundleDesignPresetId, templateId) => {
    expect(mapTemplateSelection("full_page", templateKey)).toEqual({
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
  ] as const)("maps product-page %s", (templateKey, bundleDesignTemplate, bundleDesignPresetId, templateId) => {
    expect(mapTemplateSelection("product_page", templateKey)).toEqual({
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
  it("compacts hydrated Admin products for runtime/metafield output", () => {
    const hydratedProduct = {
      id: "gid://shopify/Product/111",
      productId: "111",
      graphqlId: "gid://shopify/Product/111",
      handle: "rings",
      title: "Rings",
      images: [{ originalSrc: "https://cdn.example/ring.jpg" }],
      variants: [
        {
          id: "gid://shopify/ProductVariant/222",
          price: "10.00",
          image: { originalSrc: "https://cdn.example/variant.jpg" },
          selectedOptions: [{ name: "Size", value: "6" }],
        },
      ],
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
      },
    ]);
    expect(runtime.selectedProducts).toEqual(runtime.products);
    expect(JSON.stringify(runtime)).not.toContain("variants");
    expect(JSON.stringify(runtime)).not.toContain("images");
    expect(JSON.stringify(runtime).length).toBeLessThan(800);
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
