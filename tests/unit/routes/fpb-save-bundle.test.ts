/**
 * Unit tests — FPB handleSaveBundle
 *
 * Spec: test-spec/edit-bundle-flow.spec.md § Suite 3
 * Issue: [edit-bundle-flow-tests-1]
 */

import { handleSaveBundle } from "../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server";
import {
  updateBundleProductMetafields,
  updateComponentProductMetafields,
} from "../../../app/services/bundles/metafield-sync.server";
import { convertBundleToStandardMetafields } from "../../../app/services/bundles/standard-metafields.server";

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

jest.mock("../../../app/lib/tier-config-validator.server", () => ({
  validateTierConfig: jest.fn().mockResolvedValue(null),
}));

jest.mock("../../../app/services/theme-colors.server", () => ({
  syncThemeColors: jest.fn().mockResolvedValue(undefined),
}));

jest.mock(
  "../../../app/services/widget-installation/widget-full-page-bundle.server",
  () => ({
    writeBundleConfigPageMetafield: jest.fn().mockResolvedValue(undefined),
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
    const body = await res.json();
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

  it("does NOT call metafield services when shopifyProductId is absent", async () => {
    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", makeFormData());
    expect(updateBundleProductMetafields).not.toHaveBeenCalled();
    expect(updateComponentProductMetafields).not.toHaveBeenCalled();
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

  it("creates nested StepCategory records when categories are present", async () => {
    const stepsData = makeStepsData({
      StepCategory: [
        {
          name: "Category A",
          sortOrder: 0,
          products: [{ id: "gid://shopify/Product/222", title: "P" }],
          collections: [],
        },
      ],
    });
    const fd = makeFormData({ stepsData: JSON.stringify(stepsData) });
    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const updateCall = getDb().bundle.update.mock.calls[0][0];
    const stepCreate = updateCall.data.steps.create[0];
    expect(stepCreate.StepCategory.create).toHaveLength(1);
    expect(stepCreate.StepCategory.create[0].name).toBe("Category A");
  });

  it("stores fixedBundlePrice on rule when discountType is fixed_bundle_price", async () => {
    const discountData = makeDiscountData({
      discountEnabled: true,
      discountType: "fixed_bundle_price",
      discountRules: [{ id: "rule-1", price: "49.99" }],
    });
    const fd = makeFormData({ discountData: JSON.stringify(discountData) });
    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const updateCall = getDb().bundle.update.mock.calls[0][0];
    const pricingRules = updateCall.data.pricing.upsert.create.rules;
    expect(pricingRules[0].fixedBundlePrice).toBe(49.99);
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
    const body = await res.json();
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
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("DB connection lost");
  });

  it("resets showStepTimeline to null when fewer than 2 tier pills are configured", async () => {
    const fd = makeFormData({
      tierConfigData: JSON.stringify([{ id: "tier-1", label: "Save 10%" }]),
      showStepTimeline: "true",
    });
    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const updateCall = getDb().bundle.update.mock.calls[0][0];
    expect(updateCall.data.showStepTimeline).toBeNull();
  });

  it("truncates floatingBadgeText to 60 characters", async () => {
    const longText = "A".repeat(100);
    const fd = makeFormData({ floatingBadgeText: longText });
    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const updateCall = getDb().bundle.update.mock.calls[0][0];
    expect(updateCall.data.floatingBadgeText).toHaveLength(60);
  });
});

describe("FPB handleSaveBundle — with shopifyProductId (triggers metafields)", () => {
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

  it("calls updateComponentProductMetafields and updateBundleProductMetafields on success", async () => {
    const fd = makeFormData({
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
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

  it("returns 500 when no products found in any step", async () => {
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

  it("returns success when standard metafield update fails (non-fatal)", async () => {
    (convertBundleToStandardMetafields as jest.Mock).mockRejectedValueOnce(
      new Error("Standard metafield error")
    );
    const fd = makeFormData({
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
    });
    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 500 when component metafield update fails (fatal)", async () => {
    (updateComponentProductMetafields as jest.Mock).mockRejectedValueOnce(
      new Error("Component metafield failure")
    );
    const fd = makeFormData({
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
    });
    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 500 when bundle variant metafield update fails (fatal)", async () => {
    (updateBundleProductMetafields as jest.Mock).mockRejectedValueOnce(
      new Error("Variant metafield failure")
    );
    const fd = makeFormData({
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
    });
    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    expect(res.status).toBe(500);
  });
});
