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
    StepProduct: any[];
    StepCategory: any[];
    collections: any[];
  }> = {}
) {
  return {
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
