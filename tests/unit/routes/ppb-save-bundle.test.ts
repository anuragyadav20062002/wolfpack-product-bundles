/**
 * Unit tests — PPB handleSaveBundle
 *
 * Spec: test-spec/edit-bundle-flow.spec.md § Suite 4
 * Issue: [edit-bundle-flow-tests-1]
 */

import { handleSaveBundle } from "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server";
import {
  updateBundleProductMetafields,
  updateComponentProductMetafields,
} from "../../../app/services/bundles/metafield-sync.server";

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

jest.mock("../../../app/services/theme-colors.server", () => ({
  syncThemeColors: jest.fn().mockResolvedValue(undefined),
}));

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

jest.mock("../../../app/lib/css-sanitizer", () => ({
  processCss: jest.fn((css: string) => ({
    sanitizedCss: css,
    isValid: true,
    warnings: [],
    syntaxErrors: [],
  })),
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

function makeStep(
  overrides: Partial<{
    id: string;
    pageTitle: string;
    multiLangData: Record<string, Record<string, string>>;
    StepProduct: any[];
    StepCategory: any[];
    collections: any[];
  }> = {}
) {
  return {
    id: "step-1",
    name: "Step 1",
    pageTitle: "",
    minQuantity: "1",
    maxQuantity: "5",
    enabled: true,
    products: [],
    collections: [],
    StepProduct: [],
    StepCategory: [],
    ...overrides,
  };
}

function makeDiscountData(overrides: Record<string, unknown> = {}) {
  return {
    discountEnabled: false,
    discountType: "percentage_off",
    discountRules: [],
    showFooter: true,
    discountMessagingEnabled: false,
    ruleMessages: {},
    displayOptions: null,
    ...overrides,
  };
}

function makeFormData(overrides: Record<string, string | null> = {}): FormData {
  const fd = new FormData();
  fd.set("bundleName", "PPB Bundle");
  fd.set("bundleDescription", "A PPB bundle");
  fd.set("bundleStatus", "draft");
  fd.set("stepsData", JSON.stringify([makeStep()]));
  fd.set("discountData", JSON.stringify(makeDiscountData()));
  fd.set("stepConditions", "{}");
  fd.set("showProductPrices", "true");
  fd.set("allowQuantityChanges", "true");
  fd.set("cartRedirectToCheckout", "false");
  fd.set("showCompareAtPrices", "false");
  fd.set("sdkMode", "false");
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null) fd.delete(k);
    else fd.set(k, v);
  }
  return fd;
}

function makeUpdatedBundle(overrides: Record<string, unknown> = {}) {
  return {
    id: "bundle-1",
    name: "PPB Bundle",
    description: "A PPB bundle",
    status: "draft",
    shopifyProductId: null,
    shopifyProductHandle: null,
    bundleType: "product_page",
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
      description: "",
      buttonText: "Buy With Bundle",
      displayConfiguration: {
        showOnAllBundleProducts: true,
        selectedProducts: [],
        showOnSpecificProductPages: [],
        collectionsSelectedData: [],
        showOnSpecificCollectionPages: [],
      },
      useLinkProductAsDefaultProduct: false,
    },
    upsellConfiguration: {
      isEnabled: true,
      title: "Build Your Bundle & Save More",
      subTitle: "",
      displayConfiguration: {
        showOnAllBundleProducts: true,
        selectedProducts: [],
        showOnSpecificProductPages: [],
        collectionsSelectedData: [],
        showOnSpecificCollectionPages: [],
      },
      useLinkProductAsDefaultProduct: false,
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
  getDb().bundle.findUnique.mockResolvedValue({ shopifyProductId: null, shopifyProductHandle: null });
  getDb().bundle.update.mockResolvedValue(makeUpdatedBundle());
});

describe("PPB handleSaveBundle — no shopifyProductId (skips metafields)", () => {
  it("returns success JSON on happy path", async () => {
    const res = await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData()
    );
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toMatch(/saved successfully/i);
  });

  it("returns 400 before Prisma when bundle status is empty", async () => {
    const res = await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData({ bundleStatus: "" })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/invalid bundle status/i);
    expect(getDb().bundle.update).not.toHaveBeenCalled();
  });

  it("does NOT call metafield services when shopifyProductId is absent", async () => {
    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", makeFormData());
    expect(updateBundleProductMetafields).not.toHaveBeenCalled();
    expect(updateComponentProductMetafields).not.toHaveBeenCalled();
  });

  it("auto-activates when a step has StepProduct", async () => {
    const stepsData = [
      makeStep({
        StepProduct: [
          { id: "gid://shopify/Product/111", title: "Item A", imageUrl: null },
        ],
      }),
    ];
    await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData({ stepsData: JSON.stringify(stepsData) })
    );
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "active" }),
      })
    );
  });

  it("auto-activates when a StepCategory contains products", async () => {
    const stepsData = [
      makeStep({
        StepCategory: [
          {
            name: "Cat A",
            sortOrder: 0,
            products: [{ id: "gid://shopify/Product/222", title: "P" }],
            collections: [],
          },
        ],
      }),
    ];
    await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData({ stepsData: JSON.stringify(stepsData) })
    );
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "active" }),
      })
    );
  });

  it("does NOT auto-activate when StepCategory exists but is empty", async () => {
    const stepsData = [
      makeStep({
        StepCategory: [{ name: "Empty", sortOrder: 0, products: [], collections: [] }],
      }),
    ];
    await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData({ stepsData: JSON.stringify(stepsData) })
    );
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "draft" }),
      })
    );
  });

  it("passes gift message fields to DB update when giftMessagesEnabled is true", async () => {
    const fd = makeFormData({
      giftMessagesEnabled: "true",
      giftMessageProductId: "gid://shopify/Product/999",
      giftMessageProductTitle: "Gift Card",
      giftMessageEnableSenderRecipient: "true",
      giftMessageMandatory: "false",
      giftMessageEnableLimit: "false",
      giftMessageSendEmail: "false",
    });
    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          giftMessagesEnabled: true,
          giftMessageProductId: "gid://shopify/Product/999",
        }),
      })
    );
  });

  it("passes variantSelectorEnabled=false to DB when form has false", async () => {
    const fd = makeFormData({ variantSelectorEnabled: "false" });
    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ variantSelectorEnabled: false }),
      })
    );
  });

  it("creates StepCategory records in DB with correct shape", async () => {
    const categoryCondition = { type: "quantity", condition: "greaterThanOrEqualTo", value: "01" };
    const categoryProduct = {
      id: "gid://shopify/Product/777",
      productId: "777",
      graphqlId: "gid://shopify/Product/777",
      handle: "widget",
      title: "Widget",
      variants: [{ variantGraphqlId: "gid://shopify/ProductVariant/888" }],
    };
    const selectedCollection = {
      id: "gid://shopify/Collection/333",
      handle: "frontpage",
      title: "Home page",
      productsCount: 1,
    };
    const stepsData = [
      makeStep({
        StepCategory: [
          {
            categoryId: "category98476",
            name: "Cat B",
            title: "Pick audit items",
            subTitle: "Choose products",
            categoryRank: 1,
            conditions: [categoryCondition],
            autoNextStepOnConditionMet: true,
            products: [categoryProduct],
            collections: [],
            collectionsData: [],
            collectionsSelectedData: [selectedCollection],
            categoryBanner: "https://cdn.example/category.png",
            displayVariantsAsIndividualProducts: true,
            displayVariantsAsSwatches: true,
            multiLangData: { en: { title: "Pick audit items" } },
          },
        ],
      }),
    ];
    await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData({ stepsData: JSON.stringify(stepsData) })
    );
    const updateCall = getDb().bundle.update.mock.calls[0][0];
    const stepCreate = updateCall.data.steps.create[0];
    expect(stepCreate.StepCategory.create[0]).toMatchObject({
      id: "category98476",
      name: "Cat B",
      title: "Pick audit items",
      subTitle: "Choose products",
      sortOrder: 1,
      categoryRank: 1,
      conditions: [categoryCondition],
      autoNextStepOnConditionMet: true,
      products: [categoryProduct],
      collections: [selectedCollection],
      collectionsData: [],
      collectionsSelectedData: [selectedCollection],
      categoryBanner: "https://cdn.example/category.png",
      displayVariantsAsIndividualProducts: true,
      displayVariantsAsSwatches: true,
      multiLangData: { en: { title: "Pick audit items" } },
    });
  });

  it("persists Product Page Step Title and translations to the step record", async () => {
    const stepsData = [
      makeStep({
        pageTitle: "Build audit bundle",
        multiLangData: {
          es: {
            productPageStepText: "Paso auditoria",
            productPageSubtext: "Construye paquete auditoria",
          },
        },
        StepProduct: [
          { id: "gid://shopify/Product/111", title: "Item A", imageUrl: null },
        ],
      }),
    ];

    await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData({ stepsData: JSON.stringify(stepsData) }),
    );

    const updateCall = getDb().bundle.update.mock.calls[0][0];
    expect(updateCall.data.steps.create[0]).toEqual(
      expect.objectContaining({
        pageTitle: "Build audit bundle",
        multiLangData: {
          es: {
            productPageStepText: "Paso auditoria",
            productPageSubtext: "Construye paquete auditoria",
          },
        },
      }),
    );
  });

  it("returns 500 when a StepProduct has a UUID ID", async () => {
    const stepsData = [
      makeStep({
        StepProduct: [
          {
            id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            title: "Bad",
            imageUrl: null,
          },
        ],
      }),
    ];
    const res = await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData({ stepsData: JSON.stringify(stepsData) })
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/corrupted browser state/i);
  });

  it("returns 500 and error message when DB throws", async () => {
    getDb().bundle.update.mockRejectedValue(new Error("Prisma error"));
    const res = await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData()
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Prisma error");
  });

  it("stores fixedBundlePrice on rule when discountType is fixed_bundle_price", async () => {
    const discountData = makeDiscountData({
      discountEnabled: true,
      discountType: "fixed_bundle_price",
      discountRules: [{ id: "rule-1", price: "79.00" }],
    });
    const fd = makeFormData({ discountData: JSON.stringify(discountData) });
    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const updateCall = getDb().bundle.update.mock.calls[0][0];
    const pricingRules = updateCall.data.pricing.upsert.create.rules;
    expect(pricingRules[0].fixedBundlePrice).toBe(79);
  });

  it("derives direct boxSelection from Product Page quantity discount display options", async () => {
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
      displayOptions: {
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

    await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData({ discountData: JSON.stringify(discountData) }),
    );

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
    expect(updateCall.data.pricing.upsert.create.displayOptions).toEqual(discountData.displayOptions);
  });

  it("clears direct boxSelection for Product Page Buy X, get Y discounts", async () => {
    const discountData = makeDiscountData({
      discountEnabled: true,
      discountType: "buy_x_get_y",
      discountRules: [
        {
          id: "rule-bxy",
          conditionType: "quantity",
          conditionValue: 2,
          customerBuys: 2,
          customerGets: 1,
          discountValue: 100,
          bxyDiscountType: "percentage",
          bxyApplyMode: "lowest_priced",
        },
      ],
      displayOptions: {
        bundleQuantityOptions: {
          enabled: true,
          defaultRuleId: "rule-bxy",
          optionsByRuleId: {
            "rule-bxy": { label: "Box of 2", subtext: "100% off" },
          },
          optionsByLocaleByRuleId: {},
        },
      },
    });

    await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData({ discountData: JSON.stringify(discountData) }),
    );

    const updateCall = getDb().bundle.update.mock.calls[0][0];
    expect(updateCall.data.boxSelection).toBeNull();
  });

  it("persists Product Page discount success, tier, display, and locale message contracts", async () => {
    const discountData = makeDiscountData({
      discountEnabled: true,
      discountType: "percentage_off",
      discountRules: [
        { id: "rule-2", conditionType: "quantity", conditionValue: 2, discountValue: 5 },
      ],
      discountMessagingEnabled: true,
      ruleMessages: {
        "rule-2": {
          discountText: "Add {{discountConditionDiff}} product(s) to save {{discountValue}}{{discountValueUnit}}!",
          successMessage: "Success! Your {{discountValue}}{{discountValueUnit}} discount has been applied to your cart.",
        },
      },
      successMessage: "Success! Your {{discountValue}}{{discountValueUnit}} discount has been applied to your cart.",
      successMessageByLocale: {
        fr: "Votre remise est appliquee.",
      },
      tierTextByRuleId: {
        "rule-2": { tierText: "2 Pack", tierSubtext: "Save 5%" },
      },
      tierTextByLocaleByRuleId: {
        fr: { "rule-2": { tierText: "Pack de 2", tierSubtext: "Economisez 5%" } },
      },
      ruleMessagesByLocale: {
        fr: {
          "rule-2": {
            discountText: "Ajoutez {{discountConditionDiff}} produit(s).",
            successMessage: "Votre remise est appliquee.",
          },
        },
      },
      displayOptions: {
        bundleQuantityOptions: { enabled: false, defaultRuleId: null, optionsByRuleId: {}, optionsByLocaleByRuleId: {} },
        progressBar: {
          enabled: true,
          type: "step_based",
          progressText: "Add {{conditionText}} to unlock {{discountText}}",
          successText: "{{discountText}} unlocked",
        },
      },
    });

    await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData({ discountData: JSON.stringify(discountData) }),
    );

    const updateCall = getDb().bundle.update.mock.calls[0][0];
    expect(updateCall.data.pricing.upsert.create.messages).toEqual({
      showDiscountDisplay: true,
      showDiscountMessaging: true,
      ruleMessages: discountData.ruleMessages,
      successMessage: discountData.successMessage,
      successMessageByLocale: discountData.successMessageByLocale,
      displayOptions: discountData.displayOptions,
      tierTextByRuleId: discountData.tierTextByRuleId,
      tierTextByLocaleByRuleId: discountData.tierTextByLocaleByRuleId,
    });
    expect(updateCall.data.pricing.upsert.create.ruleMessagesByLocale).toEqual(discountData.ruleMessagesByLocale);
    expect(updateCall.data.pricing.upsert.update.messages).toEqual(updateCall.data.pricing.upsert.create.messages);
    expect(updateCall.data.pricing.upsert.update.ruleMessagesByLocale).toEqual(discountData.ruleMessagesByLocale);
  });

  it("persists Product Page direct Bundle Visibility config", async () => {
    const bundleUpsellConfig = makeBundleUpsellConfig();

    await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData({ bundleUpsellConfig: JSON.stringify(bundleUpsellConfig) }),
    );

    const updateCall = getDb().bundle.update.mock.calls[0][0];
    expect(updateCall.data.bundleUpsellConfig).toEqual(bundleUpsellConfig);
  });
});

describe("PPB handleSaveBundle — with shopifyProductId (triggers metafields)", () => {
  const PRODUCT_ID = "gid://shopify/Product/123";

  function makeStepWithProduct() {
    return [
      makeStep({
        StepProduct: [
          { id: "gid://shopify/Product/456", title: "Component", imageUrl: null },
        ],
      }),
    ];
  }

  beforeEach(() => {
    getDb().bundle.findUnique.mockResolvedValue({
      shopifyProductId: PRODUCT_ID,
      shopifyProductHandle: "bundle-123",
    });
    getDb().bundle.update.mockResolvedValue(
      makeUpdatedBundle({
        shopifyProductId: PRODUCT_ID,
        steps: [
          {
            id: "step-db-1",
            StepProduct: [
              { productId: "gid://shopify/Product/456", title: "Component", imageUrl: null },
            ],
            StepCategory: [],
          },
        ],
      })
    );
  });

  it("calls updateComponentProductMetafields and updateBundleProductMetafields", async () => {
    const fd = makeFormData({
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID, handle: "bundle-123" }),
    });
    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(updateComponentProductMetafields).toHaveBeenCalledWith(
      MOCK_ADMIN,
      PRODUCT_ID,
      expect.any(Object)
    );
    expect(updateBundleProductMetafields).toHaveBeenCalledWith(
      MOCK_ADMIN,
      PRODUCT_ID,
      expect.any(Object)
    );
  });

  it("syncs stale unlisted bundle product descriptions with the current productUpdate mutation", async () => {
    getDb().bundle.update.mockResolvedValue(
      makeUpdatedBundle({
        status: "unlisted",
        shopifyProductId: PRODUCT_ID,
        steps: [
          {
            id: "step-db-1",
            StepProduct: [
              { productId: "gid://shopify/Product/456", title: "Component", imageUrl: null },
            ],
            StepCategory: [],
          },
        ],
      })
    );
    const fd = makeFormData({
      bundleStatus: "unlisted",
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID, handle: "bundle-123" }),
    });

    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(MOCK_ADMIN.graphql).toHaveBeenCalledWith(
      expect.stringContaining("ProductUpdateInput"),
      expect.objectContaining({
        variables: expect.objectContaining({
          product: expect.objectContaining({
            id: PRODUCT_ID,
            status: "ACTIVE",
            descriptionHtml: expect.stringContaining("Your Bundle is Unlisted"),
          }),
        }),
      }),
    );
    expect(MOCK_ADMIN.graphql).toHaveBeenCalledWith(
      expect.stringContaining("ProductUpdateInput"),
      expect.objectContaining({
        variables: expect.objectContaining({
          product: expect.objectContaining({
            id: PRODUCT_ID,
            status: "UNLISTED",
            descriptionHtml: expect.stringContaining("Your Bundle is Unlisted"),
          }),
        }),
      }),
    );
  });

  it("syncs saved bundle names to the generated product title", async () => {
    getDb().bundle.update.mockResolvedValue(
      makeUpdatedBundle({
        name: "Product Page Fixture",
        shopifyProductId: PRODUCT_ID,
        steps: [
          {
            id: "step-db-1",
            StepProduct: [
              { productId: "gid://shopify/Product/456", title: "Component", imageUrl: null },
            ],
            StepCategory: [],
          },
        ],
      })
    );
    const fd = makeFormData({
      bundleName: "Product Page Fixture",
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID, handle: "bundle-123" }),
    });

    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(MOCK_ADMIN.graphql).toHaveBeenCalledWith(
      expect.stringContaining("ProductUpdateInput"),
      expect.objectContaining({
        variables: expect.objectContaining({
          product: expect.objectContaining({
            id: PRODUCT_ID,
            title: "Product Page Fixture",
          }),
        }),
      }),
    );
  });

  it("syncs generated product metadata and persists the Shopify-returned handle", async () => {
    MOCK_ADMIN.graphql.mockImplementation(async (query: string, variables?: any) => {
      if (query.includes("GetShopName")) {
        return {
          json: async () => ({
            data: { shop: { name: "Yash-wolfpack" } },
          }),
        };
      }

      if (query.includes("GetBundleProductMedia")) {
        return {
          json: async () => ({
            data: {
              product: {
                media: {
                  nodes: [
                    {
                      id: "gid://shopify/MediaImage/current",
                      alt: "",
                      image: { url: "https://cdn.shopify.com/files/bundle-product-placeholder.png" },
                    },
                  ],
                },
              },
            },
          }),
        };
      }

      return {
        json: async () => ({
          data: {
            productUpdate: {
              product: {
                id: PRODUCT_ID,
                status: variables?.variables?.product?.status || "ACTIVE",
                handle: "wpb-complete-audit-product-page-2026-05-25",
                vendor: "Yash-wolfpack",
                productType: "product",
              },
              userErrors: [],
            },
          },
        }),
      };
    });
    getDb().bundle.update.mockResolvedValue(
      makeUpdatedBundle({
        name: "WPB Complete Audit Product Page 2026-05-25",
        shopifyProductId: PRODUCT_ID,
        shopifyProductHandle: "codex-ppb-2026-05-21",
        steps: [
          {
            id: "step-db-1",
            StepProduct: [
              { productId: "gid://shopify/Product/456", title: "Component", imageUrl: null },
            ],
            StepCategory: [],
          },
        ],
      })
    );
    const fd = makeFormData({
      bundleName: "WPB Complete Audit Product Page 2026-05-25",
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID, handle: "codex-ppb-2026-05-21" }),
    });

    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(MOCK_ADMIN.graphql).toHaveBeenCalledWith(
      expect.stringContaining("ProductUpdateInput"),
      expect.objectContaining({
        variables: expect.objectContaining({
          product: expect.objectContaining({
            id: PRODUCT_ID,
            title: "WPB Complete Audit Product Page 2026-05-25",
            handle: "wpb-complete-audit-product-page-2026-05-25",
            productType: "product",
            vendor: "Yash-wolfpack",
          }),
        }),
      }),
    );
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "bundle-1" },
        data: { shopifyProductHandle: "wpb-complete-audit-product-page-2026-05-25" },
      }),
    );
  });

  it("removes stale generated product media references after save product sync", async () => {
    MOCK_ADMIN.graphql.mockImplementation(async (query: string, variables?: any) => {
      if (query.includes("GetShopName")) {
        return {
          json: async () => ({
            data: { shop: { name: "Test Shop" } },
          }),
        };
      }

      if (query.includes("GetBundleProductMedia")) {
        return {
          json: async () => ({
            data: {
              product: {
                id: PRODUCT_ID,
                media: {
                  nodes: [
                    {
                      id: "gid://shopify/MediaImage/current",
                      alt: "",
                      image: { url: "https://cdn.shopify.com/files/bundle-product-placeholder.png" },
                    },
                    {
                      id: "gid://shopify/MediaImage/old",
                      alt: "Old Product",
                      image: { url: "https://cdn.shopify.com/files/bundle_old.png" },
                    },
                  ],
                },
              },
            },
          }),
        };
      }

      if (query.includes("fileUpdate")) {
        return {
          json: async () => ({
            data: {
              fileUpdate: {
                files: [{ id: "gid://shopify/MediaImage/old" }],
                userErrors: [],
              },
            },
          }),
        };
      }

      return {
        json: async () => ({
          data: {
            productUpdate: {
              product: {
                id: PRODUCT_ID,
                status: variables?.variables?.product?.status || "ACTIVE",
                handle: "ppb-bundle",
                vendor: "Test Shop",
                productType: "product",
              },
              userErrors: [],
            },
          },
        }),
      };
    });
    const fd = makeFormData({
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID, handle: "bundle-123" }),
    });

    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(MOCK_ADMIN.graphql).toHaveBeenCalledWith(
      expect.stringContaining("fileUpdate"),
      expect.objectContaining({
        variables: {
          files: [
            {
              id: "gid://shopify/MediaImage/old",
              referencesToRemove: [PRODUCT_ID],
            },
          ],
        },
      }),
    );
  });

  it("returns 500 when no products found in any step (with productId set)", async () => {
    getDb().bundle.update.mockResolvedValue(
      makeUpdatedBundle({
        shopifyProductId: PRODUCT_ID,
        steps: [{ id: "step-db-1", StepProduct: [], StepCategory: [], products: [], collections: [] }],
      })
    );
    const fd = makeFormData({
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
    });
    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/add products/i);
  });

  it("accepts category-backed products during metafield validation", async () => {
    getDb().bundle.update.mockResolvedValue(
      makeUpdatedBundle({
        shopifyProductId: PRODUCT_ID,
        steps: [
          {
            id: "step-db-1",
            StepProduct: [],
            StepCategory: [
              {
                name: "Category A",
                products: [{ id: "gid://shopify/Product/789", title: "Category Product" }],
                collections: [],
              },
            ],
            products: [],
            collections: [],
          },
        ],
      })
    );
    const stepsData = [
      makeStep({
        StepCategory: [
          {
            name: "Category A",
            sortOrder: 0,
            products: [{ id: "gid://shopify/Product/789", title: "Category Product" }],
            collections: [],
          },
        ],
      }),
    ];
    const fd = makeFormData({
      stepsData: JSON.stringify(stepsData),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
    });

    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(updateComponentProductMetafields).toHaveBeenCalled();
  });

  it("passes direct Bundle Settings contracts into bundle product metafield sync", async () => {
    const directContracts = {
      defaultProductsData: {
        isDefaultProductsEnabled: false,
        products: [],
      },
      validateQuantityPerProduct: {
        isEnabled: true,
        allowedQuantity: 1,
      },
      individualSellingPlanSelection: {
        isEnabled: false,
        showFor: "ALL_PRODUCTS",
      },
      bundleTextConfig: {
        bundleSummary: {
          title: "Your Bundle",
          subTitle: "Review your bundle",
        },
      },
    };
    getDb().bundle.update.mockResolvedValue(
      makeUpdatedBundle({
        shopifyProductId: PRODUCT_ID,
        steps: [
          {
            id: "step-db-1",
            StepProduct: [
              { productId: "gid://shopify/Product/456", title: "Component", imageUrl: null },
            ],
            StepCategory: [],
          },
        ],
        ...directContracts,
      })
    );
    const fd = makeFormData({
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
      defaultProductsData: JSON.stringify(directContracts.defaultProductsData),
      validateQuantityPerProduct: JSON.stringify(directContracts.validateQuantityPerProduct),
      individualSellingPlanSelection: JSON.stringify(directContracts.individualSellingPlanSelection),
      bundleTextConfig: JSON.stringify(directContracts.bundleTextConfig),
    });

    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(updateBundleProductMetafields).toHaveBeenCalledWith(
      MOCK_ADMIN,
      PRODUCT_ID,
      expect.objectContaining(directContracts),
    );
  });

  it("passes flat percentage quantity rule thresholds into bundle product metafield sync", async () => {
    getDb().bundle.update.mockResolvedValue(
      makeUpdatedBundle({
        shopifyProductId: PRODUCT_ID,
        steps: [
          {
            id: "step-db-1",
            StepProduct: [
              { productId: "gid://shopify/Product/456", title: "Component", imageUrl: null },
            ],
            StepCategory: [],
          },
        ],
      })
    );
    const discountData = makeDiscountData({
      discountEnabled: true,
      discountType: "percentage_off",
      discountRules: [
        {
          id: "rule-1",
          conditionType: "quantity",
          conditionValue: 2,
          discountValue: 5,
        },
      ],
      discountMessagingEnabled: true,
    });
    const fd = makeFormData({
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
      discountData: JSON.stringify(discountData),
    });

    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(updateBundleProductMetafields).toHaveBeenCalledWith(
      MOCK_ADMIN,
      PRODUCT_ID,
      expect.objectContaining({
        pricing: expect.objectContaining({
          method: "percentage_off",
          rules: [
            expect.objectContaining({
              id: "rule-1",
              conditionType: "quantity",
              conditionValue: 2,
              discountValue: 5,
            }),
          ],
        }),
      }),
    );
  });

  it("passes Product Page BQO and discount display contracts into bundle product metafield sync", async () => {
    const boxSelection = {
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
    };
    const displayOptions = {
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
    };
    getDb().bundle.update.mockResolvedValue(
      makeUpdatedBundle({
        shopifyProductId: PRODUCT_ID,
        boxSelection,
        steps: [
          {
            id: "step-db-1",
            StepProduct: [
              { productId: "gid://shopify/Product/456", title: "Component", imageUrl: null },
            ],
            StepCategory: [],
          },
        ],
        pricing: {
          enabled: true,
          method: "percentage_off",
          rules: [
            { id: "rule-2", conditionType: "quantity", conditionValue: 2, discountValue: 5 },
          ],
          showFooter: true,
          showProgressBar: true,
          displayOptions,
          messages: {
            showDiscountMessaging: true,
            ruleMessages: {
              "rule-2": {
                discountText: "Add {{discountConditionDiff}} product(s) to save {{discountValue}}{{discountValueUnit}}!",
                successMessage: "Success! Your {{discountValue}}{{discountValueUnit}} discount has been applied to your cart.",
              },
            },
            displayOptions,
            tierTextByRuleId: {
              "rule-2": { tierText: "2 Pack", tierSubtext: "Save 5%" },
            },
          },
        },
      }),
    );
    const discountData = makeDiscountData({
      discountEnabled: true,
      discountType: "percentage_off",
      discountRules: [
        { id: "rule-2", conditionType: "quantity", conditionValue: 2, discountValue: 5 },
      ],
      discountMessagingEnabled: true,
      displayOptions,
    });
    const fd = makeFormData({
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
      discountData: JSON.stringify(discountData),
    });

    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(updateBundleProductMetafields).toHaveBeenCalledWith(
      MOCK_ADMIN,
      PRODUCT_ID,
      expect.objectContaining({
        boxSelection,
        pricing: expect.objectContaining({
          displayOptions,
          messages: expect.objectContaining({
            showDiscountMessaging: true,
            displayOptions,
            tierTextByRuleId: {
              "rule-2": { tierText: "2 Pack", tierSubtext: "Save 5%" },
            },
          }),
        }),
      }),
    );
  });

  it("passes Product Page direct Bundle Visibility config into bundle product metafield sync", async () => {
    const bundleUpsellConfig = makeBundleUpsellConfig();
    getDb().bundle.update.mockResolvedValue(
      makeUpdatedBundle({
        shopifyProductId: PRODUCT_ID,
        bundleUpsellConfig,
        steps: [
          {
            id: "step-db-1",
            StepProduct: [
              { productId: "gid://shopify/Product/456", title: "Component", imageUrl: null },
            ],
            StepCategory: [],
          },
        ],
      }),
    );
    const fd = makeFormData({
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
      bundleUpsellConfig: JSON.stringify(bundleUpsellConfig),
    });

    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(updateBundleProductMetafields).toHaveBeenCalledWith(
      MOCK_ADMIN,
      PRODUCT_ID,
      expect.objectContaining({ bundleUpsellConfig }),
    );
  });

  it("passes saved Product Page Step Title and translations into bundle product metafield sync", async () => {
    getDb().bundle.update.mockResolvedValue(
      makeUpdatedBundle({
        shopifyProductId: PRODUCT_ID,
        steps: [
          {
            id: "step-db-1",
            name: "Step 1 - PPB Audit",
            pageTitle: "Build audit bundle",
            multiLangData: {
              es: {
                productPageStepText: "Paso auditoria",
                productPageSubtext: "Construye paquete auditoria",
              },
            },
            StepProduct: [
              { productId: "gid://shopify/Product/456", title: "Component", imageUrl: null },
            ],
            StepCategory: [],
          },
        ],
      }),
    );
    const fd = makeFormData({
      stepsData: JSON.stringify([
        makeStep({
          pageTitle: "Build audit bundle",
          multiLangData: {
            es: {
              productPageStepText: "Paso auditoria",
              productPageSubtext: "Construye paquete auditoria",
            },
          },
          StepProduct: [
            { id: "gid://shopify/Product/456", title: "Component", imageUrl: null },
          ],
        }),
      ]),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
    });

    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(updateBundleProductMetafields).toHaveBeenCalledWith(
      MOCK_ADMIN,
      PRODUCT_ID,
      expect.objectContaining({
        steps: [
          expect.objectContaining({
            name: "Step 1 - PPB Audit",
            pageTitle: "Build audit bundle",
            multiLangData: {
              es: {
                productPageStepText: "Paso auditoria",
                productPageSubtext: "Construye paquete auditoria",
              },
            },
          }),
        ],
      }),
    );
  });

  it("returns 500 when component metafield update fails (fatal)", async () => {
    (updateComponentProductMetafields as jest.Mock).mockRejectedValueOnce(
      new Error("Fatal component error")
    );
    const fd = makeFormData({
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
    });
    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    expect(res.status).toBe(500);
  });
});
