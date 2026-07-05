/**
 * E2E scaffold:
 * - Create a new FPB bundle from create handler
 * - Save that bundle with EB parity Free Gift & Add Ons contract
 * - Verify persisted contract and metafield-sync payload
 */

import { handleCreateBundle } from "../../app/routes/app/app.dashboard/handlers/handlers.server";
import { handleSaveBundle } from "../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server";
import { updateBundleProductMetafields } from "../../app/services/bundles/metafield-sync.server";

jest.mock("../../app/db.server", () => ({
  __esModule: true,
  default: {
    shop: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    bundle: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    session: {},
  },
}));

jest.mock("../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    startTimer: jest.fn(() => jest.fn()),
  },
}));

jest.mock("../../app/services/widget-installation.server", () => ({
  WidgetInstallationService: {
    createFullPageBundle: jest.fn(),
    validateProductBundleWidgetSetup: jest.fn().mockResolvedValue({
      widgetInstalled: false,
      requiresOneTimeSetup: false,
      message: "",
    }),
  },
}));

jest.mock("../../app/services/bundles/metafield-sync.server", () => ({
  updateBundleProductMetafields: jest.fn().mockResolvedValue(undefined),
  updateComponentProductMetafields: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../app/services/bundles/standard-metafields.server", () => ({
  convertBundleToStandardMetafields: jest.fn().mockResolvedValue({
    metafields: {},
    errors: [],
  }),
  updateProductStandardMetafields: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../app/utils/variant-lookup.server", () => ({
  getBundleProductVariantId: jest.fn().mockResolvedValue("gid://shopify/ProductVariant/999"),
}));

jest.mock("../../app/lib/tier-config-validator.server", () => ({
  validateTierConfig: jest.fn().mockResolvedValue(null),
}));

jest.mock("../../app/lib/css-sanitizer", () => ({
  processCss: jest.fn(() => ({
    sanitizedCss: "",
    isValid: true,
    warnings: [],
    syntaxErrors: [],
  })),
}));

jest.mock("../../app/services/theme-colors.server", () => ({
  syncThemeColors: jest.fn().mockResolvedValue(undefined),
}));

jest.mock(
  "../../app/services/widget-installation/widget-full-page-bundle.server",
  () => ({
    writeBundleConfigPageMetafield: jest.fn().mockResolvedValue(undefined),
    renamePageHandle: jest.fn(),
    publishPreviewPage: jest.fn(),
    getPreviewPageUrl: jest.fn(),
  }),
);

jest.mock("../../app/services/bundles/pricing-calculation.server", () => ({
  calculateBundlePrice: jest.fn().mockResolvedValue("99.99"),
  updateBundleProductPrice: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../app/services/theme-template.server", () => ({
  ThemeTemplateService: { ensureTemplates: jest.fn() },
}));

const db = require("../../app/db.server").default as any;

const mockSession = {
  shop: "test-shop.myshopify.com",
  accessToken: "token",
} as any;

function buildCreateAdmin() {
  return {
    graphql: jest
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            productCreate: {
              product: {
                id: "gid://shopify/Product/1001",
                handle: "fpb-fresh-bundle",
              },
              userErrors: [],
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            publications: { edges: [] },
          },
        }),
      }),
  };
}

const createAdmin = buildCreateAdmin() as any;

const saveAdmin = {
  graphql: jest.fn().mockResolvedValue({
    json: async () => ({
      data: {
        productUpdate: {
          product: { id: "gid://shopify/Product/1001", status: "ACTIVE" },
          userErrors: [],
        },
      },
    }),
  }),
} as any;

function buildCreateFormData() {
  const fd = new FormData();
  fd.set("bundleName", "Fresh Free-Gift Add-on Bundle");
  fd.set("bundleType", "full_page");
  return fd;
}

function buildSaveFormData(personalizationDataFixture: ReturnType<typeof buildPersonalizationData>) {
  const stepsData = [
    {
      id: "step-1",
      name: "Bundle Product",
      minQuantity: "1",
      maxQuantity: "4",
      enabled: true,
      StepProduct: [
        {
          id: "gid://shopify/Product/456",
          title: "Bundle Headphones",
          imageUrl: null,
        },
      ],
      StepCategory: [],
      products: [],
      collections: [],
    },
    {
      id: "step-2",
      name: "Add On",
      minQuantity: "1",
      maxQuantity: "1",
      enabled: true,
      isFreeGift: true,
      addonLabel: "Add On",
      addonTitle: "Choose a gift",
      addonAddText: "Add Gift",
      addonReplaceText: "Replace Gift",
      addonIconUrl: "https://cdn.example.test/addon-step-icon.png",
      addonDisplayFree: false,
      addonUnlockAfterCompletion: true,
      StepProduct: [],
      StepCategory: [],
      products: [],
      collections: [],
    },
  ];

  const fd = new FormData();
  fd.set("bundleName", "Fresh Free-Gift Add-on Bundle");
  fd.set("bundleDescription", "EB parity baseline for checkout add-on lines");
  fd.set("bundleStatus", "draft");
  fd.set("stepsData", JSON.stringify(stepsData));
  fd.set("discountData", JSON.stringify({
    discountEnabled: false,
    discountType: "percentage_off",
    discountRules: [],
    showFooter: true,
    showDiscountProgressBar: false,
    discountMessagingEnabled: false,
    ruleMessages: {},
    pricingDisplayOptions: null,
    ruleMessagesByLocale: null,
  }));
  fd.set("stepConditions", "{}");
  fd.set("bundleProduct", JSON.stringify({ id: "gid://shopify/Product/1001" }));
  fd.set("personalizationData", JSON.stringify(personalizationDataFixture));
  fd.set("searchBarEnabled", "false");
  fd.set("showProductPrices", "true");
  fd.set("showCompareAtPrices", "false");
  fd.set("floatingBadgeEnabled", "false");
  fd.set("floatingBadgeText", "");
  fd.set("allowQuantityChanges", "true");
  fd.set("cartRedirectToCheckout", "false");
  fd.set("validateQuantityPerProduct", JSON.stringify({
    isEnabled: false,
    allowedQuantity: 1,
  }));
  return fd;
}

function buildPersonalizationData() {
  return {
    isPersonalizationEnabled: true,
    personalizeStepText: "Add On",
    personalizePageSubtext: "",
    stepImage: "https://cdn.example.test/addon-step-icon.png",
    addonProducts: {
      isEnabled: true,
      title: "Add ON",
      type: "MULTI_TIER",
      tiers: [
        {
          tierId: "tier-1",
          title: "Tier 1",
          selectedAddonProducts: [
            {
              id: "gid://shopify/Product/901",
              productId: "901",
              graphqlId: "gid://shopify/Product/901",
              handle: "add-on-earrings",
              title: "Gift Earrings",
              variants: [
                {
                  variantId: "555",
                  variantGraphqlId: "gid://shopify/ProductVariant/555",
                  price: "829.00",
                  variantTitle: "Default",
                },
              ],
            },
          ],
          eligibilityCondition: {
            type: "QUANTITY",
            value: 3,
            isValidateEligibilityConditionEnabled: true,
          },
          discount: {
            type: "PERCENTAGE",
            value: 10,
          },
          displayVariantsAsIndividualProducts_addons: false,
          conditions: [],
        },
        {
          tierId: "tier-2",
          title: "Tier 2",
          selectedAddonProducts: [
            {
              id: "gid://shopify/Product/902",
              productId: "902",
              graphqlId: "gid://shopify/Product/902",
              handle: "premium-gift-case",
              title: "Gift Case",
              variants: [
                {
                  variantId: "556",
                  variantGraphqlId: "gid://shopify/ProductVariant/556",
                  price: "1299.00",
                  variantTitle: "Default",
                },
              ],
            },
          ],
          eligibilityCondition: {
            type: "QUANTITY",
            value: 6,
            isValidateEligibilityConditionEnabled: true,
          },
          discount: {
            type: "PERCENTAGE",
            value: 100,
          },
          displayVariantsAsIndividualProducts_addons: false,
          conditions: [],
        },
      ],
      multiLangData: {},
      addonsMessaging: {
        isEnabled: true,
        tier1: {
          ineligibleState: "Add {{addonsConditionDiff}} more product(s) to claim {{addonsDiscountValue}}{{addonsDiscountValueUnit}} off on Add ons",
          eligibleState: "Congrats you are eligible for {{addonsDiscountValue}}{{addonsDiscountValueUnit}} off on Add ons",
        },
        tier2: {
          ineligibleState: "Add {{addonsConditionDiff}} more product(s) to claim {{addonsDiscountValue}}{{addonsDiscountValueUnit}} off on Add ons",
          eligibleState: "Congrats you are eligible for {{addonsDiscountValue}}{{addonsDiscountValueUnit}} off on Add ons",
        },
      },
    },
  };
}

function buildPersonalizationDataWithZeroThreshold() {
  return {
    ...buildPersonalizationData(),
    addonProducts: {
      ...buildPersonalizationData().addonProducts,
      tiers: [
        {
          ...buildPersonalizationData().addonProducts.tiers[0],
          eligibilityCondition: {
            ...buildPersonalizationData().addonProducts.tiers[0].eligibilityCondition,
            value: 0,
          },
        },
        ...buildPersonalizationData().addonProducts.tiers.slice(1),
      ],
    },
  };
}

describe("FPB create + configure parity flow (scaffolded E2E path)", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    db.shop.findUnique.mockResolvedValue({ firstCreateTourEligible: false });
    db.bundle.count.mockResolvedValue(1);
    db.bundle.create.mockResolvedValue({
      id: "bundle-1",
    });
    db.shop.update.mockResolvedValue({});
    createAdmin.graphql = buildCreateAdmin().graphql;
  });

  it("creates a fresh bundle and saves EB Free Gift & Add Ons payload with multi-tier contract", async () => {
    const personalizationData = buildPersonalizationData();

    const createResponse = await handleCreateBundle(
      createAdmin as any,
      mockSession,
      buildCreateFormData(),
    );
    const createBody = await createResponse.json() as { success: boolean; bundleId: string };

    expect(createResponse.status).toBe(200);
    expect(createBody.success).toBe(true);
    expect(createBody.bundleId).toBe("bundle-1");

    db.bundle.findUnique.mockResolvedValue({
      shopifyProductId: "gid://shopify/Product/1001",
    });
    db.bundle.update.mockResolvedValue({
      id: "bundle-1",
      shopifyProductId: "gid://shopify/Product/1001",
      personalizationData,
      steps: [
        {
          id: "db-step-1",
          name: "Bundle Product",
          StepProduct: [{ id: "gid://shopify/Product/456" }],
          StepCategory: [],
        },
        {
          id: "db-step-2",
          name: "Add On",
          StepProduct: [],
          StepCategory: [],
        },
      ],
    });

    const saveResponse = await handleSaveBundle(
      saveAdmin,
      mockSession,
      "bundle-1",
      buildSaveFormData(personalizationData),
    );
    const saveBody = await saveResponse.json();

    expect(saveResponse.status).toBe(200);
    expect(saveBody.success).toBe(true);

    const updateCall = db.bundle.update.mock.calls[0][0];
    expect(updateCall.data.personalizationData).toMatchObject({
      isPersonalizationEnabled: true,
      personalizeStepText: "Add On",
      addonProducts: {
        isEnabled: true,
        title: "Add ON",
        type: "MULTI_TIER",
      },
    });
    expect(updateCall.data.steps.create[1]).toMatchObject({
      name: "Add On",
      isFreeGift: true,
      addonDisplayFree: false,
      addonLabel: "Add On",
      addonTitle: "Choose a gift",
    });
    expect(updateCall.data.steps.create[1].minQuantity).toBe(1);

    const metafieldPayload = (updateBundleProductMetafields as jest.Mock).mock.calls[0][2];
    expect(metafieldPayload.personalizationData.addonProducts.tiers).toHaveLength(2);
    expect(metafieldPayload.personalizationData.addonProducts.tiers[1]).toMatchObject({
      tierId: "tier-2",
      discount: {
        type: "PERCENTAGE",
        value: 100,
      },
      eligibilityCondition: expect.objectContaining({
        type: "QUANTITY",
        value: 6,
      }),
    });
  });

  it("normalizes a zero add-on threshold to 1 when saving a fresh bundle", async () => {
    const personalizationData = buildPersonalizationDataWithZeroThreshold();

    const createResponse = await handleCreateBundle(
      createAdmin as any,
      mockSession,
      buildCreateFormData(),
    );
    const createBody = await createResponse.json() as { success: boolean; bundleId: string };

    expect(createResponse.status).toBe(200);
    expect(createBody.success).toBe(true);
    expect(createBody.bundleId).toBe("bundle-1");

    db.bundle.findUnique.mockResolvedValue({
      shopifyProductId: "gid://shopify/Product/1001",
    });
    db.bundle.update.mockResolvedValue({
      id: "bundle-1",
      shopifyProductId: "gid://shopify/Product/1001",
      personalizationData,
      steps: [
        {
          id: "db-step-1",
          name: "Bundle Product",
          StepProduct: [{ id: "gid://shopify/Product/456" }],
          StepCategory: [],
        },
        {
          id: "db-step-2",
          name: "Add On",
          StepProduct: [],
          StepCategory: [],
        },
      ],
    });

    const saveResponse = await handleSaveBundle(
      saveAdmin,
      mockSession,
      "bundle-1",
      buildSaveFormData(personalizationData),
    );
    const saveBody = await saveResponse.json();

    expect(saveResponse.status).toBe(200);
    expect(saveBody.success).toBe(true);

    const metafieldPayload = (updateBundleProductMetafields as jest.Mock).mock.calls[0][2];
    expect(metafieldPayload.personalizationData.addonProducts.tiers[0]).toMatchObject({
      eligibilityCondition: {
        type: "QUANTITY",
        value: 1,
      },
    });
  });
});
