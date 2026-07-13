import { formatBundleForWidget } from "../../../app/lib/bundle-formatter.server";

// Minimal DB bundle fixture
const makeBundle = (overrides: Record<string, unknown> = {}) => ({
  id: "bundle-1",
  name: "Test Bundle",
  description: "A test bundle",
  status: "ACTIVE",
  bundleType: "full_page",
  fullPageLayout: "FOOTER_BOTTOM",
  shopifyProductId: "gid://shopify/Product/123",
  promoBannerBgImage: null,
  loadingGif: null,
  tierConfig: null,
  showStepTimeline: null,
  steps: [],
  pricing: null,
  ...overrides,
});

const makeStep = (overrides: Record<string, unknown> = {}) => ({
  id: "step-1",
  name: "Pick a product",
  position: 1,
  minQuantity: 1,
  maxQuantity: 1,
  enabled: true,
  displayVariantsAsIndividual: false,
  collections: [],
  conditionType: null,
  conditionOperator: null,
  conditionValue: null,
  conditionOperator2: null,
  conditionValue2: null,
  isFreeGift: false,
  freeGiftName: null,
  isDefault: false,
  defaultVariantId: null,
  StepProduct: [],
  ...overrides,
});

const makeStepProduct = (overrides: Record<string, unknown> = {}) => ({
  productId: "gid://shopify/Product/999",
  title: "My Product",
  imageUrl: "https://cdn.shopify.com/img.jpg",
  minQuantity: null,
  maxQuantity: null,
  position: 0,
  variants: [],
  ...overrides,
});

describe("formatBundleForWidget", () => {
  it("returns top-level bundle fields", () => {
    const result = formatBundleForWidget(makeBundle() as any);
    expect(result.id).toBe("bundle-1");
    expect(result.name).toBe("Test Bundle");
    expect(result.bundleType).toBe("full_page");
    expect(result.status).toBe("ACTIVE");
    expect(result.pricing).toBeNull();
    expect(result.steps).toHaveLength(0);
  });

  it("omits the legacy fullPageLayout field from widget payloads", () => {
    const bundle = makeBundle({ fullPageLayout: "footer_bottom" });
    const result = formatBundleForWidget(bundle as any);
    expect(result).not.toHaveProperty("fullPageLayout");
  });

  it("defaults full-page bundles to Standard Design when template fields are absent", () => {
    const result = formatBundleForWidget(makeBundle({
      bundleDesignTemplate: null,
      bundleDesignPresetId: null,
    }) as any);

    expect(result.bundleDesignTemplate).toBe("FBP_SIDE_FOOTER");
    expect(result.bundleDesignPresetId).toBe("STANDARD");
    expect(result.bundleDesignTemplateData).toBeNull();
  });

  it("emits the saved product slot icon URL for storefront empty slots", () => {
    const result = formatBundleForWidget(makeBundle({
      productSlotIconUrl: "https://cdn.example.test/slot-icon.png",
    }) as any);

    expect(result.productSlotIconUrl).toBe("https://cdn.example.test/slot-icon.png");
  });

  it("emits the saved bundle-level variant selector setting", () => {
    const result = formatBundleForWidget(makeBundle({
      variantSelectorEnabled: false,
    }) as any);

    expect(result.variantSelectorEnabled).toBe(false);
  });

  it("defaults the bundle-level variant selector setting to enabled", () => {
    const result = formatBundleForWidget(makeBundle({
      variantSelectorEnabled: undefined,
    }) as any);

    expect(result.variantSelectorEnabled).toBe(true);
  });

  it("projects the persisted compare-at setting to the product-page runtime key", () => {
    const result = formatBundleForWidget(makeBundle({
      bundleType: "product_page",
      showCompareAtPrices: true,
    }) as any);

    expect(result.showProductComparedAtPrice).toBe(true);
    expect(result).not.toHaveProperty("showCompareAtPrices");
  });

  it("emits the saved loading GIF for storefront runtime", () => {
    const result = formatBundleForWidget(makeBundle({
      loadingGif: "https://cdn.example.test/loading.gif",
    }) as any);

    expect(result.loadingGif).toBe("https://cdn.example.test/loading.gif");
  });

  it("emits per-bundle Bundle Level CSS for FPB storefront runtime", () => {
    const css = "#bundle-builder-app { outline: 1px solid rgb(255, 0, 204); }";
    const result = formatBundleForWidget(makeBundle({
      bundleType: "full_page",
      bundleLevelCss: css,
    }) as any);

    expect(result.bundleLevelCss).toBe(css);
  });

  it("emits per-bundle Bundle Level CSS for PPB storefront runtime", () => {
    const css = ".bundle-widget-product-page { outline: 1px solid rgb(0, 200, 255); }";
    const result = formatBundleForWidget(makeBundle({
      bundleType: "product_page",
      bundleLevelCss: css,
    }) as any);

    expect(result.bundleLevelCss).toBe(css);
  });

  it("emits null bundleLevelCss when the bundle has no Bundle Level CSS", () => {
    const result = formatBundleForWidget(makeBundle({
      bundleType: "product_page",
      bundleLevelCss: null,
    }) as any);

    expect(result.bundleLevelCss).toBeNull();
  });

  it("converts variant price strings to integer cents", () => {
    const step = makeStep({
      StepProduct: [
        makeStepProduct({
          variants: [{ id: "gid://shopify/ProductVariant/42", price: "19.99", title: "S" }],
        }),
      ],
    });
    const result = formatBundleForWidget(makeBundle({ steps: [step] }) as any);
    const product = result.steps[0].products[0];
    expect(product.price).toBe(1999);
    expect(product.variants[0].price).toBe(1999);
  });

  it("extracts numeric ID from Shopify GID for variant id", () => {
    const step = makeStep({
      StepProduct: [
        makeStepProduct({
          variants: [{ id: "gid://shopify/ProductVariant/789", price: "10.00", title: "M" }],
        }),
      ],
    });
    const result = formatBundleForWidget(makeBundle({ steps: [step] }) as any);
    expect(result.steps[0].products[0].variants[0].id).toBe("789");
    expect(result.steps[0].products[0].variants[0].gid).toBe("gid://shopify/ProductVariant/789");
  });

  it("handles null compareAtPrice", () => {
    const step = makeStep({
      StepProduct: [
        makeStepProduct({
          variants: [{ id: "gid://shopify/ProductVariant/1", price: "5.00", compareAtPrice: null, title: "L" }],
        }),
      ],
    });
    const result = formatBundleForWidget(makeBundle({ steps: [step] }) as any);
    expect(result.steps[0].products[0].compareAtPrice).toBeNull();
    expect(result.steps[0].products[0].variants[0].compareAtPrice).toBeNull();
  });

  it("handles step with no products", () => {
    const result = formatBundleForWidget(makeBundle({ steps: [makeStep()] }) as any);
    expect(result.steps[0].products).toHaveLength(0);
  });

  it("includes saved step page title for Full Page storefront content", () => {
    const step = makeStep({ pageTitle: "Choose your jewelry" });
    const result = formatBundleForWidget(makeBundle({ steps: [step] }) as any);
    expect(result.steps[0].pageTitle).toBe("Choose your jewelry");
  });

  it("maps stored Step Config image to public stepImage only", () => {
    const step = makeStep({ timelineIconUrl: "https://cdn.example.test/step.png" });
    const result = formatBundleForWidget(makeBundle({ steps: [step] }) as any);
    expect(result.steps[0].stepImage).toBe("https://cdn.example.test/step.png");
    expect(result.steps[0]).not.toHaveProperty("timelineIconUrl");
  });

  it("prefers direct stepImage when both stepImage and timelineIconUrl are present", () => {
    const step = makeStep({
      stepImage: "https://cdn.example.test/step-direct.png",
      timelineIconUrl: "https://cdn.example.test/step-legacy.png",
    });
    const result = formatBundleForWidget(makeBundle({ steps: [step] }) as any);
    expect(result.steps[0].stepImage).toBe("https://cdn.example.test/step-direct.png");
  });

  it("keeps category-backed products under categories for storefront runtime", () => {
    const step = makeStep({
      StepProduct: [],
      StepCategory: [
        {
          products: [
            {
              id: "gid://shopify/Product/9427287703811",
              title: "123Luxury Armor Matte Case",
              imageUrl: "https://cdn.shopify.com/category-product.jpg",
              variants: [
                {
                  id: "gid://shopify/ProductVariant/48191691456771",
                  price: "123.00",
                  compareAtPrice: "246.00",
                  title: "Dark Blue / For iphone 6 6S Plus",
                  availableForSale: true,
                  image: { originalSrc: "https://cdn.shopify.com/variant.jpg" },
                },
              ],
            },
          ],
        },
      ],
    });

    const result = formatBundleForWidget(makeBundle({
      bundleType: "product_page",
      steps: [step],
    }) as any);

    expect(result.steps[0].products).toEqual([]);
    expect((result.steps[0].categories as any[])[0].products).toEqual([
      expect.objectContaining({
        id: "gid://shopify/Product/9427287703811",
        title: "123Luxury Armor Matte Case",
      }),
    ]);
  });

  it("promotes category products into full-page step products when StepProduct is empty", () => {
    const highVariantProduct = Array.from({ length: 11 }, (_, index) => ({
      id: `gid://shopify/ProductVariant/${48191691456771 + index}`,
      price: "123.00",
      compareAtPrice: "246.00",
      title: `Dark Blue / For iphone 6 6S Plus #${index + 1}`,
      availableForSale: true,
      image: { originalSrc: "https://cdn.shopify.com/variant.jpg" },
    }));

    const step = makeStep({
      StepProduct: [],
      StepCategory: [
        {
          id: "category98476",
          title: "Pick audit items",
          products: [
            {
              id: "gid://shopify/Product/9427287703811",
              title: "123Luxury Armor Matte Case",
              imageUrl: "https://cdn.shopify.com/category-product.jpg",
              variants: highVariantProduct,
            },
          ],
        },
      ],
    });

    const result = formatBundleForWidget(makeBundle({ steps: [step] }) as any);
    const product = result.steps[0].products[0];

    expect(result.steps[0].products).toHaveLength(1);
    expect(product).toMatchObject({
      id: "gid://shopify/Product/9427287703811",
      title: "123Luxury Armor Matte Case",
      featuredImage: { url: "https://cdn.shopify.com/category-product.jpg" },
      price: 12300,
      available: true,
    });
    expect(product.variants).toHaveLength(11);
    expect(product.variants[0]).toMatchObject({
      id: "48191691456771",
      gid: "gid://shopify/ProductVariant/48191691456771",
      title: "Dark Blue / For iphone 6 6S Plus #1",
      price: 12300,
      compareAtPrice: 24600,
      available: true,
      image: { url: "https://cdn.shopify.com/variant.jpg" },
    });
  });

  it("preserves hydrated category fields for storefront runtime", () => {
    const condition = { type: "quantity", condition: "greaterThanOrEqualTo", value: "01" };
    const selectedCollection = { id: "gid://shopify/Collection/333", handle: "frontpage", title: "Home page" };
    const categoryProduct = {
      id: "gid://shopify/Product/9427287703811",
      title: "123Luxury Armor Matte Case",
      variants: [{ id: "gid://shopify/ProductVariant/48191691456771", price: "123.00" }],
    };
    const step = makeStep({
      StepCategory: [
        {
          id: "category98476",
          name: "Category 1 Direct Product Category",
          title: "Pick audit items",
          subTitle: "Choose audit products",
          sortOrder: 1,
          categoryRank: 1,
          products: [categoryProduct],
          selectedProducts: [],
          collections: [selectedCollection],
          collectionsData: [],
          collectionsSelectedData: [selectedCollection],
          conditions: [condition],
          categoryBanner: "https://cdn.example/category.png",
          categoryImg: "https://cdn.example/icon.png",
          autoNextStepOnConditionMet: true,
          displayVariantsAsIndividualProducts: true,
          displayVariantsAsSwatches: false,
          multiLangData: { en: { title: "Pick audit items" } },
        },
      ],
    });

    const result = formatBundleForWidget(makeBundle({ steps: [step] }) as any);

    expect(result.steps[0].categories).toEqual([
      {
        categoryId: "category98476",
        name: "Category 1 Direct Product Category",
        title: "Pick audit items",
        subTitle: "Choose audit products",
        rank: 1,
        categoryRank: 1,
        products: [
          {
            id: "gid://shopify/Product/9427287703811",
            title: "123Luxury Armor Matte Case",
            variants: [
              {
                id: "gid://shopify/ProductVariant/48191691456771",
                price: "123.00",
              },
            ],
          },
        ],
        selectedProducts: [],
        collections: [selectedCollection],
        collectionsData: [],
        collectionsSelectedData: [selectedCollection],
        conditions: [condition],
        categoryBanner: "https://cdn.example/category.png",
        categoryImg: "https://cdn.example/icon.png",
        autoNextStepOnConditionMet: true,
        displayVariantsAsIndividualProducts: true,
        displayVariantsAsSwatches: false,
        multiLangData: { en: { title: "Pick audit items" } },
      },
    ]);
  });

  it("includes pricing when present", () => {
    const pricing = {
      enabled: true,
      method: "percentage_off",
      rules: [{ quantity: 2, discountValue: 10 }],
      showFooter: true,
      messages: { progress: "Add {n} more" },
    };
    const result = formatBundleForWidget(makeBundle({ pricing }) as any);
    expect(result.pricing).not.toBeNull();
    expect(result.pricing!.method).toBe("percentage_off");
    expect(result.pricing!.rules).toHaveLength(1);
  });

  it("includes full-page design fields without a product-page template data wrapper", () => {
    const result = formatBundleForWidget(makeBundle({
      bundleDesignTemplate: "FBP_SIDE_FOOTER",
      bundleDesignPresetId: "STANDARD",
    }) as any);

    expect(result.bundleDesignTemplate).toBe("FBP_SIDE_FOOTER");
    expect(result.bundleDesignPresetId).toBe("STANDARD");
    expect(result.bundleDesignTemplateData).toBeNull();
  });

  it("bridges product-page design preset into runtime template data", () => {
    const result = formatBundleForWidget(makeBundle({
      bundleType: "product_page",
      bundleDesignTemplate: "PDP_INPAGE",
      bundleDesignPresetId: "CASCADE",
    }) as any);

    expect(result.bundleDesignTemplate).toBe("PDP_INPAGE");
    expect(result.bundleDesignPresetId).toBe("CASCADE");
    expect(result.bundleDesignTemplateData).toEqual({ templateId: "CASCADE" });
  });

  it("exposes reference modal slot orientation for product-page horizontal slots", () => {
    const result = formatBundleForWidget(makeBundle({
      bundleType: "product_page",
      bundleDesignTemplate: "PDP_MODAL",
      bundleDesignPresetId: "MODAL",
    }) as any);

    expect(result.bundleDesignTemplateData).toEqual({ templateId: "MODAL" });
    expect(result.renderFilledSlotsAsHorizontalStacked).toBe(true);
  });

  it("exposes reference modal slot orientation for product-page vertical slots", () => {
    const result = formatBundleForWidget(makeBundle({
      bundleType: "product_page",
      bundleDesignTemplate: "PDP_MODAL",
      bundleDesignPresetId: "SIMPLIFIED",
    }) as any);

    expect(result.bundleDesignTemplateData).toEqual({ templateId: "SIMPLIFIED" });
    expect(result.renderFilledSlotsAsHorizontalStacked).toBe(false);
  });

  it("includes direct product-page bundle settings contracts without FPB Product Slots", () => {
    const defaultProductsData = {
      isDefaultProductsEnabled: true,
      defaultProductsTitle: "Preselected audit products",
      products: [
        {
          productId: "8322625700036",
          graphqlId: "gid://shopify/Product/8322625700036",
          handle: "18k-bloom-earrings",
          variants: [
            {
              variantId: "45038876459204",
              variantGraphqlId: "gid://shopify/ProductVariant/45038876459204",
              inventoryQuantity: 13,
              price: "579.00",
            },
          ],
          hasOnlyDefaultVariant: true,
          title: "18k Bloom Earrings",
          requiredQuantity: 1,
        },
      ],
    };
    const validateQuantityPerProduct = { isEnabled: true, allowedQuantity: 1 };
    const individualSellingPlanSelection = { isEnabled: false, showFor: "ALL_PRODUCTS" };
    const bundleTextConfig = {
      bundleSummary: {
        title: "Your Bundle",
        subTitle: "Review your bundle",
      },
    };

    const result = formatBundleForWidget(makeBundle({
      bundleType: "product_page",
      defaultProductsData,
      validateQuantityPerProduct,
      productSlotsEnabled: true,
      productSlotIconUrl: "https://cdn.example.test/slot-icon.png",
      individualSellingPlanSelection,
      bundleTextConfig,
    }) as any);

    expect(result.defaultProductsData).toEqual(defaultProductsData);
    expect(result.validateQuantityPerProduct).toEqual(validateQuantityPerProduct);
    expect(result.productSlotsEnabled).toBe(false);
    expect(result.productSlotIconUrl).toBeNull();
    expect(result.individualSellingPlanSelection).toEqual(individualSellingPlanSelection);
    expect(result.bundleTextConfig).toEqual(bundleTextConfig);
  });

  it("includes direct full-page add-ons personalization contract", () => {
    const personalizationData = {
      isPersonalizationEnabled: true,
      addonProducts: {
        isEnabled: true,
        title: "Optional audit extras",
        type: "MULTI_TIER",
        tiers: [
          {
            tierId: "tier74285",
            title: "Audit Tier 1",
            selectedAddonProducts: [
              {
                id: "gid://shopify/Product/8322626126020",
                productId: "8322626126020",
                graphqlId: "gid://shopify/Product/8322626126020",
                title: "14k Dangling Obsidian Earrings",
              },
            ],
            eligibilityCondition: {
              type: "AMOUNT",
              value: 1,
              isValidateEligibilityConditionEnabled: true,
            },
            discount: { type: "PERCENTAGE", value: 10 },
            displayVariantsAsIndividualProducts_addons: false,
            conditions: [],
          },
        ],
        multiLangData: {},
        addonsMessaging: {
          isEnabled: true,
          tier1: {
            ineligibleState: "Add product(s) worth at least ##addonsConditionDiff## ##currencyUnit## more to claim ##addonsDiscountValue####addonsDiscountValueUnit## off on Add ons",
            eligibleState: "Congrats you are eligible for ##addonsDiscountValue####addonsDiscountValueUnit## off on Add ons",
          },
        },
      },
    };

    const result = formatBundleForWidget(makeBundle({ personalizationData }) as any);

    expect(result.personalizationData).toEqual(personalizationData);
  });

  it("uses empty array for missing step collections", () => {
    const step = makeStep({ collections: undefined });
    const result = formatBundleForWidget(makeBundle({ steps: [step] }) as any);
    expect(result.steps[0].collections).toEqual([]);
  });

  it("sets featuredImage from imageUrl when present", () => {
    const step = makeStep({
      StepProduct: [makeStepProduct({ imageUrl: "https://cdn.shopify.com/test.jpg" })],
    });
    const result = formatBundleForWidget(makeBundle({ steps: [step] }) as any);
    const p = result.steps[0].products[0];
    expect(p.featuredImage).toEqual({ url: "https://cdn.shopify.com/test.jpg" });
  });

  it("sets featuredImage to null when imageUrl is absent", () => {
    const step = makeStep({
      StepProduct: [makeStepProduct({ imageUrl: null })],
    });
    const result = formatBundleForWidget(makeBundle({ steps: [step] }) as any);
    const p = result.steps[0].products[0];
    expect(p.featuredImage).toBeNull();
  });
});
