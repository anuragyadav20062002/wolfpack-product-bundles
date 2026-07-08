/**
 * Unit tests — FPB handleSaveBundle
 *
 * Spec: test-spec/edit-bundle-flow.spec.md § Suite 3
 * Issue: [edit-bundle-flow-tests-1]
 */

import { handleSaveBundle } from "../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server";
import { AddOnDiscountFunctionService } from "../../../app/services/addon-discount-function-service.server";
import {
  updateBundleProductMetafields,
  updateComponentProductMetafields,
} from "../../../app/services/bundles/metafield-sync.server";
import { enqueueBundleStorefrontSync } from "../../../app/services/bundles/storefront-sync.server";
import {
  refreshFullPageBundlePageBody,
  writeBundleConfigPageMetafield,
} from "../../../app/services/widget-installation/widget-full-page-bundle.server";

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    bundle: { findUnique: jest.fn(), update: jest.fn() },
  },
}));

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    startTimer: jest.fn(() => jest.fn()),
  },
}));

jest.mock("../../../app/services/bundles/metafield-sync.server", () => ({
  updateBundleProductMetafields: jest.fn().mockResolvedValue(undefined),
  updateComponentProductMetafields: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../app/services/bundles/storefront-sync.server", () => ({
  enqueueBundleStorefrontSync: jest.fn().mockResolvedValue({
    status: "queued",
    attemptId: "attempt-1",
    error: null,
    queuedAt: new Date("2026-07-08T00:00:00.000Z"),
    startedAt: null,
    syncedAt: null,
    failedAt: null,
    stats: null,
  }),
}));

jest.mock("../../../app/services/addon-discount-function-service.server", () => ({
  AddOnDiscountFunctionService: {
    completeSetup: jest.fn().mockResolvedValue({ success: true }),
  },
}));

jest.mock("../../../app/services/bundles/standard-metafields.server", () => ({
  convertBundleToStandardMetafields: jest
    .fn()
    .mockResolvedValue({ metafields: {}, errors: [] }),
  updateProductStandardMetafields: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../app/utils/variant-lookup.server", () => ({
  getBundleProductVariantId: jest
    .fn()
    .mockResolvedValue("gid://shopify/ProductVariant/999"),
}));

jest.mock("../../../app/lib/tier-config-validator.server", () => ({
  validateTierConfig: jest.fn().mockResolvedValue(null),
}));

jest.mock("../../../app/lib/css-sanitizer", () => ({
  processCss: jest.fn((css: string) => ({
    sanitizedCss: css.replace(/<script/gi, ""),
    isValid: true,
    warnings: [],
    syntaxErrors: [],
  })),
}));

jest.mock("../../../app/services/theme-colors.server", () => ({
  syncThemeColors: jest.fn().mockResolvedValue(undefined),
}));

jest.mock(
  "../../../app/services/widget-installation/widget-full-page-bundle.server",
  () => ({
    writeBundleConfigPageMetafield: jest.fn().mockResolvedValue(undefined),
    refreshFullPageBundlePageBody: jest.fn().mockResolvedValue({ success: true }),
    renamePageHandle: jest.fn(),
    publishPreviewPage: jest.fn(),
    getPreviewPageUrl: jest.fn(),
  })
);

jest.mock("../../../app/services/widget-installation.server", () => ({
  WidgetInstallationService: {
    createFullPageBundle: jest.fn(),
    validateProductBundleWidgetSetup: jest.fn(),
  },
}));

jest.mock("../../../app/services/bundles/pricing-calculation.server", () => ({
  calculateBundlePrice: jest.fn().mockResolvedValue("99.99"),
  updateBundleProductPrice: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../app/services/theme-template.server", () => ({
  ThemeTemplateService: { ensureTemplates: jest.fn() },
}));

const getDb = () => require("../../../app/db.server").default;

const MOCK_SESSION = {
  shop: "test-shop.myshopify.com",
  accessToken: "test-token",
} as any;

const MOCK_ADMIN = {
  graphql: jest.fn().mockResolvedValue({
    json: async () => ({
      data: {
        productUpdate: {
          product: { id: "gid://shopify/Product/1", status: "ACTIVE" },
          userErrors: [],
        },
      },
    }),
  }),
} as any;

function makeStepsData(
  overrides: Partial<{
    id: string;
    stepImage: string | null;
    multiLangData: Record<string, Record<string, string>>;
    products: any[];
    StepProduct: any[];
    StepCategory: any[];
    collections: any[];
  }> = {}
) {
  return [
    {
      id: "step-1",
      name: "Step 1",
      minQuantity: "1",
      maxQuantity: "5",
      enabled: true,
      products: [],
      collections: [],
      StepProduct: [],
      StepCategory: [],
      ...overrides,
    },
  ];
}

function makeDiscountData(overrides: Record<string, unknown> = {}) {
  return {
    discountEnabled: false,
    discountType: "percentage_off",
    discountRules: [],
    showFooter: true,
    showDiscountProgressBar: false,
    discountMessagingEnabled: false,
    ruleMessages: {},
    pricingDisplayOptions: null,
    ruleMessagesByLocale: null,
    ...overrides,
  };
}

function makeFormData(overrides: Record<string, string | null> = {}): FormData {
  const fd = new FormData();
  fd.set("bundleName", "Test Bundle");
  fd.set("bundleDescription", "A test bundle");
  fd.set("bundleStatus", "draft");
  fd.set("stepsData", JSON.stringify(makeStepsData()));
  fd.set("discountData", JSON.stringify(makeDiscountData()));
  fd.set("stepConditions", "{}");
  fd.set("showProductPrices", "true");
  fd.set("allowQuantityChanges", "true");
  fd.set("searchBarEnabled", "false");
  fd.set("floatingBadgeEnabled", "false");
  fd.set("floatingBadgeText", "");
  fd.set("showCompareAtPrices", "false");
  fd.set("cartRedirectToCheckout", "false");
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null) fd.delete(k);
    else fd.set(k, v);
  }
  return fd;
}

function makeUpdatedBundle(overrides: Record<string, unknown> = {}) {
  return {
    id: "bundle-1",
    name: "Test Bundle",
    description: "A test bundle",
    status: "draft",
    shopifyProductId: null,
    shopifyPageId: null,
    bundleType: "full_page",
    fullPageLayout: "footer_bottom",
    templateName: null,
    steps: [],
    pricing: null,
    ...overrides,
  };
}

function makeBundleUpsellConfig(overrides: Record<string, unknown> = {}) {
  return {
    multiLangText: {},
    widgetConfiguration: {
      isEnabled: true,
      type: "OFFER_WIDGET",
      imageUrl: "https://cdn.example.test/widget.png",
      title: "Bundle & Save",
      description: "Complete the look",
      buttonText: "Buy with Bundle",
      displayConfiguration: {
        showOnAllBundleProducts: false,
        selectedProducts: [
          {
            id: "gid://shopify/Product/111",
            productId: "111",
            graphqlId: "gid://shopify/Product/111",
            handle: "gift-card",
            title: "Gift Card",
            variants: [],
          },
        ],
        showOnSpecificProductPages: [
          {
            productId: "111",
            graphqlId: "gid://shopify/Product/111",
            handle: "gift-card",
            title: "Gift Card",
            variants: [],
            images: [],
          },
        ],
        collectionsSelectedData: [],
        showOnSpecificCollectionPages: [],
      },
      useLinkProductAsDefaultProduct: true,
      languageMode: "MULTIPLE",
    },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  MOCK_ADMIN.graphql.mockResolvedValue({
    json: async () => ({
      data: {
        productUpdate: {
          product: { id: "gid://shopify/Product/1", status: "ACTIVE" },
          userErrors: [],
        },
      },
    }),
  });
});

describe("FPB handleSaveBundle — no shopifyProductId (skips metafields)", () => {
  beforeEach(() => {
    getDb().bundle.findUnique.mockResolvedValue({ shopifyProductId: null });
    getDb().bundle.update.mockResolvedValue(makeUpdatedBundle());
  });

  it("returns success JSON on happy path", async () => {
    const res = await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData()
    );
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.message).toMatch(/saved successfully/i);
  });

  it("calls db.bundle.update with the correct name and description", async () => {
    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", makeFormData());
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Test Bundle",
          description: "A test bundle",
        }),
      })
    );
  });

  it("does not persist legacy fullPageLayout from old save payloads", async () => {
    await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData({ fullPageLayout: "footer_bottom" }),
    );

    const updateArgs = getDb().bundle.update.mock.calls[0][0];
    expect(updateArgs.data).not.toHaveProperty("fullPageLayout");
  });

  it("persists direct bundleUpsellConfig from current full-page visibility controls", async () => {
    const bundleUpsellConfig = makeBundleUpsellConfig();
    await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData({ bundleUpsellConfig: JSON.stringify(bundleUpsellConfig) }),
    );

    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ bundleUpsellConfig }),
      }),
    );
  });

  it("sanitizes bundleLevelCss before saving", async () => {
    const { processCss } = require("../../../app/lib/css-sanitizer");
    await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData({
        bundleLevelCss: "<script>alert(1)</script>#bundle-builder-app { outline: 1px solid red; }",
      }),
    );

    expect(processCss).toHaveBeenCalledWith(
      "<script>alert(1)</script>#bundle-builder-app { outline: 1px solid red; }",
    );
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bundleLevelCss: ">alert(1)</script>#bundle-builder-app { outline: 1px solid red; }",
        }),
      }),
    );
  });

  it("stores null for empty bundleLevelCss", async () => {
    await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData({ bundleLevelCss: "" }),
    );

    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bundleLevelCss: null,
        }),
      }),
    );
  });

  it("does NOT call metafield services when shopifyProductId is absent", async () => {
    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", makeFormData());
    expect(updateBundleProductMetafields).not.toHaveBeenCalled();
    expect(updateComponentProductMetafields).not.toHaveBeenCalled();
    expect(enqueueBundleStorefrontSync).toHaveBeenCalledWith({
      shopDomain: MOCK_SESSION.shop,
      bundleId: "bundle-1",
      bundleType: "full_page",
      reason: "save",
    });
  });

  it("enqueues storefront sync instead of refreshing the full-page marker body inline", async () => {
    const updatedBundle = makeUpdatedBundle({
      shopifyPageId: "gid://shopify/Page/123",
      shopifyPageHandle: "test-bundle",
      bundleDesignPresetId: "CLASSIC",
    });
    getDb().bundle.update.mockResolvedValue(updatedBundle);

    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", makeFormData());

    expect(refreshFullPageBundlePageBody).not.toHaveBeenCalled();
    expect(writeBundleConfigPageMetafield).not.toHaveBeenCalled();
    expect(enqueueBundleStorefrontSync).toHaveBeenCalledWith({
      shopDomain: MOCK_SESSION.shop,
      bundleId: "bundle-1",
      bundleType: "full_page",
      reason: "save",
    });
  });

  it("passes variantSelectorEnabled=false to DB when form has false", async () => {
    await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData({ variantSelectorEnabled: "false" }),
    );

    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ variantSelectorEnabled: false }),
      }),
    );
  });

  it("auto-activates a draft bundle when a step has StepProduct", async () => {
    const stepsData = makeStepsData({
      StepProduct: [
        { id: "gid://shopify/Product/111", title: "Product A", imageUrl: null },
      ],
    });
    const fd = makeFormData({ stepsData: JSON.stringify(stepsData) });
    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "active" }),
      })
    );
  });

  it("auto-activates a draft bundle when a step category has products", async () => {
    const stepsData = makeStepsData({
      StepCategory: [
        {
          id: "category12345",
          title: "Category A",
          products: [
            { id: "gid://shopify/Product/222", title: "Product B", imageUrl: null },
          ],
          collections: [],
          collectionsSelectedData: [],
        },
      ],
    });
    const fd = makeFormData({ stepsData: JSON.stringify(stepsData) });
    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "active" }),
      })
    );
  });

  it("does NOT auto-activate when steps have no products or collections", async () => {
    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", makeFormData());
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "draft" }),
      })
    );
  });

  it("auto-activates when a step has collections", async () => {
    const stepsData = makeStepsData({
      collections: [{ id: "gid://shopify/Collection/1", handle: "shirts", title: "Shirts" }],
    });
    const fd = makeFormData({ stepsData: JSON.stringify(stepsData) });
    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "active" }),
      })
    );
  });

  it("activates the add-on discount function when add-ons are enabled", async () => {
    const personalizationData = {
      isPersonalizationEnabled: true,
      personalizeStepText: "Add On",
      addonProducts: {
        isEnabled: true,
        title: "Add On",
        tiers: [
          {
            tierId: "tier1",
            discount: { type: "PERCENTAGE", value: "10" },
            products: [{ id: "gid://shopify/Product/111" }],
          },
        ],
      },
    };
    const fd = makeFormData({
      personalizationData: JSON.stringify(personalizationData),
    });

    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);

    expect(AddOnDiscountFunctionService.completeSetup).toHaveBeenCalledWith(
      MOCK_ADMIN,
      MOCK_SESSION.shop,
    );
  });

  it("does not activate the add-on discount function when add-ons are disabled", async () => {
    const personalizationData = {
      isPersonalizationEnabled: true,
      personalizeStepText: "Add On",
      addonProducts: {
        isEnabled: false,
        title: "Add On",
        tiers: [],
      },
    };
    const fd = makeFormData({
      personalizationData: JSON.stringify(personalizationData),
    });

    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);

    expect(AddOnDiscountFunctionService.completeSetup).not.toHaveBeenCalled();
  });

  it("creates nested StepCategory records when categories are present", async () => {
    const categoryProduct = {
      id: "gid://shopify/Product/222",
      productId: "222",
      graphqlId: "gid://shopify/Product/222",
      handle: "product",
      title: "P",
      variants: [{ variantGraphqlId: "gid://shopify/ProductVariant/333" }],
    };
    const selectedCollection = {
      id: "gid://shopify/Collection/444",
      handle: "frontpage",
      title: "Home page",
    };
    const condition = { type: "quantity", condition: "greaterThanOrEqualTo", value: "01" };
    const stepsData = makeStepsData({
      multiLangData: {
        es: {
          productPageStepText: "Paso auditoria",
          productPageSubtext: "Construye paquete auditoria",
        },
      },
      StepCategory: [
        {
          categoryId: "category21087",
          title: "Category A",
          subTitle: "Pick FPB products",
          categoryImg: "https://cdn.example/category-icon.png",
          sortOrder: 0,
          products: [categoryProduct],
          selectedProducts: [],
          collectionsData: [],
          collectionsSelectedData: [selectedCollection],
          collections: [],
          categoryBanner: "https://cdn.example/banner.png",
          conditions: [condition],
          autoNextStepOnConditionMet: true,
          multiLangData: { en: { title: "Category A" } },
        },
      ],
    });
    const fd = makeFormData({ stepsData: JSON.stringify(stepsData) });
    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const updateCall = getDb().bundle.update.mock.calls[0][0];
    const stepCreate = updateCall.data.steps.create[0];
    expect(stepCreate.multiLangData).toEqual({
      es: {
        productPageStepText: "Paso auditoria",
        productPageSubtext: "Construye paquete auditoria",
      },
    });
    expect(stepCreate.StepCategory.create).toHaveLength(1);
    expect(stepCreate.StepCategory.create[0]).toMatchObject({
      id: "category21087",
      name: "Category A",
      title: "Category A",
      subTitle: "Pick FPB products",
      categoryImg: "https://cdn.example/category-icon.png",
      sortOrder: 0,
      categoryRank: null,
      products: [categoryProduct],
      selectedProducts: [],
      collections: [selectedCollection],
      collectionsData: [],
      collectionsSelectedData: [selectedCollection],
      categoryBanner: "https://cdn.example/banner.png",
      conditions: [condition],
      autoNextStepOnConditionMet: true,
      multiLangData: { en: { title: "Category A" } },
    });
  });

  it("persists the canonical step-level variants-as-individual selector", async () => {
    const stepsData = makeStepsData({
      displayVariantsAsIndividual: true,
      StepProduct: [
        {
          id: "gid://shopify/Product/222",
          title: "Item A",
          imageUrl: null,
        },
      ],
    } as any);

    await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData({ stepsData: JSON.stringify(stepsData) }),
    );

    const updateCall = getDb().bundle.update.mock.calls[0][0];
    expect(updateCall.data.steps.create[0]).toMatchObject({
      displayVariantsAsIndividual: true,
    });
  });

  it("stores fixedBundlePrice on rule when discountType is fixed_bundle_price", async () => {
    const discountData = makeDiscountData({
      discountEnabled: true,
      discountType: "fixed_bundle_price",
      discountRules: [{ id: "rule-1", discountValue: 4999 }],
    });
    const fd = makeFormData({ discountData: JSON.stringify(discountData) });
    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const updateCall = getDb().bundle.update.mock.calls[0][0];
    const pricingRules = updateCall.data.pricing.upsert.create.rules;
    expect(pricingRules[0].fixedBundlePrice).toBe(4999);
  });

  it("returns 500 when a product ID is a UUID (corrupted browser state)", async () => {
    const stepsData = makeStepsData({
      StepProduct: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          title: "Bad Product",
          imageUrl: null,
        },
      ],
    });
    const fd = makeFormData({ stepsData: JSON.stringify(stepsData) });
    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    expect(res.status).toBe(500);
    const body = await res.json() as any;
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/corrupted browser state/i);
  });

  it("returns 500 and propagates the error message when DB throws", async () => {
    getDb().bundle.update.mockRejectedValue(new Error("DB connection lost"));
    const res = await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData()
    );
    expect(res.status).toBe(500);
    const body = await res.json() as any;
    expect(body.success).toBe(false);
    expect(body.error).toContain("DB connection lost");
  });

  it("saves showStepTimeline as the parsed boolean value", async () => {
    const fd = makeFormData({ showStepTimeline: "true" });
    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const updateCall = getDb().bundle.update.mock.calls[0][0];
    expect(updateCall.data.showStepTimeline).toBe(true);
  });

  it("truncates floatingBadgeText to 60 characters", async () => {
    const longText = "A".repeat(100);
    const fd = makeFormData({ floatingBadgeText: longText });
    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const updateCall = getDb().bundle.update.mock.calls[0][0];
    expect(updateCall.data.floatingBadgeText).toHaveLength(60);
  });

  it("saves direct bundle summary text config", async () => {
    const bundleTextConfig = {
      bundleSummary: {
        title: "Your Custom Box",
        subTitle: "Review your selected items",
      },
    };
    const fd = makeFormData({ bundleTextConfig: JSON.stringify(bundleTextConfig) });
    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const updateCall = getDb().bundle.update.mock.calls[0][0];
    expect(updateCall.data.bundleTextConfig).toEqual(bundleTextConfig);
  });

  it("persists step-rule auto-next on full-page steps", async () => {
    const stepConditions = {
      "step-1": [{
        id: "rule-1",
        type: "quantity",
        operator: "equal_to",
        value: "2",
        autoNext: "true",
      }],
    };
    const fd = makeFormData({ stepConditions: JSON.stringify(stepConditions) });

    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);

    const updateCall = getDb().bundle.update.mock.calls[0][0];
    expect(updateCall.data.steps.create[0]).toMatchObject({
      conditionType: "quantity",
      conditionOperator: "equal_to",
      conditionValue: 2,
      autoNextStepOnConditionMet: true,
    });
  });

  it("saves direct box-selection config from percentage quantity display options", async () => {
    const discountData = makeDiscountData({
      discountEnabled: true,
      discountType: "percentage_off",
      discountRules: [
        {
          id: "rule-2",
          conditionType: "quantity",
          conditionValue: 2,
          discountValue: 5,
        },
      ],
      showDiscountProgressBar: true,
      discountMessagingEnabled: true,
      pricingDisplayOptions: {
        bundleQuantityOptions: {
          enabled: true,
          defaultRuleId: "rule-2",
          optionsByRuleId: {
            "rule-2": { label: "Box of 2", subtext: "5% off" },
          },
          optionsByLocaleByRuleId: {},
        },
        progressBar: {
          enabled: true,
          type: "step_based",
          progressText: "Add {{discountConditionDiff}} product(s) to save {{discountValue}}{{discountValueUnit}}!",
          successText: "Success! Your {{discountValue}}{{discountValueUnit}} discount has been applied to your cart.",
        },
      },
    });
    const fd = makeFormData({ discountData: JSON.stringify(discountData) });

    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);

    const updateCall = getDb().bundle.update.mock.calls[0][0];
    expect(updateCall.data.boxSelection).toEqual({
      isEnabled: true,
      validateBoxSelectionQuantity: false,
      rules: [
        {
          ruleId: "rule-2",
          boxQuantity: 2,
          boxLabel: "Box of 2",
          boxSubtext: "5% off",
          isDefaultSelected: true,
        },
      ],
    });
  });

  it("persists the progress display option as disabled when the progress checkbox is off", async () => {
    const discountData = makeDiscountData({
      discountEnabled: true,
      discountType: "fixed_amount_off",
      discountRules: [
        {
          id: "rule-2",
          conditionType: "quantity",
          conditionValue: 2,
          discountValue: 5,
        },
      ],
      showDiscountProgressBar: false,
      pricingDisplayOptions: {
        bundleQuantityOptions: {
          enabled: true,
          defaultRuleId: "rule-2",
          optionsByRuleId: {
            "rule-2": { label: "Box of 2", subtext: "$5 off" },
          },
          optionsByLocaleByRuleId: {},
        },
        progressBar: {
          enabled: true,
          type: "step_based",
          progressText: "Add {{conditionText}} to unlock {{discountText}}",
          successText: "{{discountText}} unlocked",
        },
      },
    });
    const fd = makeFormData({ discountData: JSON.stringify(discountData) });

    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);

    const updateCall = getDb().bundle.update.mock.calls[0][0];
    expect(
      updateCall.data.pricing.upsert.update.messages.displayOptions.progressBar.enabled,
    ).toBe(false);
  });

  it("wires Bundle Settings quantity validation into direct box-selection config", async () => {
    const discountData = makeDiscountData({
      discountEnabled: true,
      discountType: "percentage_off",
      discountRules: [
        {
          id: "rule-2",
          conditionType: "quantity",
          conditionValue: 2,
          discountValue: 5,
        },
      ],
      pricingDisplayOptions: {
        bundleQuantityOptions: {
          enabled: true,
          defaultRuleId: "rule-2",
          optionsByRuleId: {
            "rule-2": { label: "Box of 2", subtext: "5% off" },
          },
          optionsByLocaleByRuleId: {},
        },
        progressBar: {
          enabled: true,
          type: "step_based",
          progressText: "Add {{conditionText}} to unlock {{discountText}}",
          successText: "{{discountText}} unlocked",
        },
      },
    });
    const fd = makeFormData({
      discountData: JSON.stringify(discountData),
      productSlotsEnabled: "true",
      validateQuantityPerProduct: JSON.stringify({ isEnabled: true, allowedQuantity: 1 }),
    });

    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);

    const updateCall = getDb().bundle.update.mock.calls[0][0];
    expect(updateCall.data.boxSelection).toMatchObject({
      isEnabled: true,
      validateBoxSelectionQuantity: true,
      rules: [
        expect.objectContaining({
          ruleId: "rule-2",
          boxQuantity: 2,
        }),
      ],
    });
  });

  it("keeps Product Slots independent from box-selection quantity validation", async () => {
    const discountData = makeDiscountData({
      discountEnabled: true,
      discountType: "percentage_off",
      discountRules: [
        {
          id: "rule-2",
          conditionType: "quantity",
          conditionValue: 2,
          discountValue: 5,
        },
      ],
      pricingDisplayOptions: {
        bundleQuantityOptions: {
          enabled: true,
          defaultRuleId: "rule-2",
          optionsByRuleId: {
            "rule-2": { label: "Box of 2", subtext: "5% off" },
          },
          optionsByLocaleByRuleId: {},
        },
      },
    });

    const fd = makeFormData({
      discountData: JSON.stringify(discountData),
      productSlotsEnabled: "true",
      validateQuantityPerProduct: JSON.stringify({ isEnabled: false, allowedQuantity: 1 }),
    });

    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);

    const updateCall = getDb().bundle.update.mock.calls[0][0];
    expect(updateCall.data.productSlotsEnabled).toBe(true);
    expect(updateCall.data.validateQuantityPerProduct).toEqual({ isEnabled: false, allowedQuantity: 1 });
    expect(updateCall.data.boxSelection).toMatchObject({
      isEnabled: true,
      validateBoxSelectionQuantity: false,
    });
  });

  it("enables box-selection quantity validation even when Product Slots are disabled", async () => {
    const discountData = makeDiscountData({
      discountEnabled: true,
      discountType: "percentage_off",
      discountRules: [
        {
          id: "rule-2",
          conditionType: "quantity",
          conditionValue: 2,
          discountValue: 5,
        },
      ],
      pricingDisplayOptions: {
        bundleQuantityOptions: {
          enabled: true,
          defaultRuleId: "rule-2",
          optionsByRuleId: {
            "rule-2": { label: "Box of 2", subtext: "5% off" },
          },
          optionsByLocaleByRuleId: {},
        },
      },
    });

    const fd = makeFormData({
      discountData: JSON.stringify(discountData),
      productSlotsEnabled: "false",
      validateQuantityPerProduct: JSON.stringify({ isEnabled: true, allowedQuantity: 1 }),
    });

    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);

    const updateCall = getDb().bundle.update.mock.calls[0][0];
    expect(updateCall.data.productSlotsEnabled).toBe(false);
    expect(updateCall.data.validateQuantityPerProduct).toEqual({ isEnabled: true, allowedQuantity: 1 });
    expect(updateCall.data.boxSelection).toMatchObject({
      isEnabled: true,
      validateBoxSelectionQuantity: true,
    });
  });

  it("clears direct box-selection config when the discount method is Buy X, get Y", async () => {
    const discountData = makeDiscountData({
      discountEnabled: true,
      discountType: "buy_x_get_y",
      discountRules: [
        {
          id: "rule-bxy",
          conditionType: "quantity",
          conditionValue: 2,
          discountValue: 100,
          customerBuys: 2,
          customerGets: 1,
        },
      ],
      pricingDisplayOptions: {
        bundleQuantityOptions: {
          enabled: true,
          defaultRuleId: "rule-bxy",
          optionsByRuleId: {
            "rule-bxy": { label: "Box of 2", subtext: "Free item" },
          },
          optionsByLocaleByRuleId: {},
        },
        progressBar: {
          enabled: true,
          type: "step_based",
          progressText: "Add {{discountConditionDiff}} product(s)",
          successText: "Success",
        },
      },
    });
    const fd = makeFormData({ discountData: JSON.stringify(discountData) });

    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);

    const updateCall = getDb().bundle.update.mock.calls[0][0];
    expect(updateCall.data.boxSelection).toBeNull();
  });
});

describe("FPB handleSaveBundle — with shopifyProductId (enqueues storefront sync)", () => {
  const PRODUCT_ID = "gid://shopify/Product/123";

  function makeStepWithProduct() {
    return makeStepsData({
      StepProduct: [
        { id: "gid://shopify/Product/456", title: "Component", imageUrl: null },
      ],
    });
  }

  beforeEach(() => {
    getDb().bundle.findUnique.mockResolvedValue({ shopifyProductId: PRODUCT_ID });
    getDb().bundle.update.mockResolvedValue(
      makeUpdatedBundle({
        shopifyProductId: PRODUCT_ID,
        steps: [
          {
            id: "step-db-1",
            name: "Step 1",
            StepProduct: [
              {
                productId: "gid://shopify/Product/456",
                title: "Component",
                imageUrl: null,
              },
            ],
            StepCategory: [],
          },
        ],
      })
    );
  });

  it("saves the bundle and enqueues storefront sync instead of writing Shopify metafields inline", async () => {
    const fd = makeFormData({
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
    });

    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const body = await res.json() as any;

    expect(body.success).toBe(true);
    expect(body.storefrontSync).toEqual(expect.objectContaining({
      status: "queued",
      attemptId: "attempt-1",
      error: null,
    }));
    expect(enqueueBundleStorefrontSync).toHaveBeenCalledWith({
      shopDomain: MOCK_SESSION.shop,
      bundleId: "bundle-1",
      bundleType: "full_page",
      reason: "save",
    });
    expect(updateComponentProductMetafields).not.toHaveBeenCalled();
    expect(updateBundleProductMetafields).not.toHaveBeenCalled();
    expect(refreshFullPageBundlePageBody).not.toHaveBeenCalled();
    expect(writeBundleConfigPageMetafield).not.toHaveBeenCalled();
    expect(MOCK_ADMIN.graphql).not.toHaveBeenCalled();
  });

  it("keeps the save successful and surfaces failed sync status when enqueue fails", async () => {
    (enqueueBundleStorefrontSync as jest.Mock).mockResolvedValueOnce({
      status: "failed",
      attemptId: "attempt-failed",
      error: "fetch failed",
      queuedAt: new Date("2026-07-08T00:00:00.000Z"),
      startedAt: null,
      syncedAt: null,
      failedAt: new Date("2026-07-08T00:00:01.000Z"),
      stats: null,
    });

    const res = await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData({
        stepsData: JSON.stringify(makeStepWithProduct()),
        bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
      }),
    );
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.storefrontSync).toEqual(expect.objectContaining({
      status: "failed",
      attemptId: "attempt-failed",
      error: "fetch failed",
    }));
  });

  it("does not reject save inline when component products are missing from the saved bundle", async () => {
    getDb().bundle.update.mockResolvedValue(
      makeUpdatedBundle({
        shopifyProductId: PRODUCT_ID,
        steps: [{ id: "step-db-1", StepProduct: [], StepCategory: [], products: [], collections: [] }],
      })
    );

    const res = await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData({ bundleProduct: JSON.stringify({ id: PRODUCT_ID }) }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(enqueueBundleStorefrontSync).toHaveBeenCalledWith(expect.objectContaining({
      bundleType: "full_page",
      reason: "save",
    }));
  });
});
