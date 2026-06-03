/**
 * Unit tests — FPB handleSaveBundle
 *
 * Spec: test-spec/edit-bundle-flow.spec.md § Suite 3
 * Issue: [edit-bundle-flow-tests-1]
 */

import fs from "node:fs";
import path from "node:path";
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
const configureRouteSource = () =>
  fs.readFileSync(
    path.join(
      process.cwd(),
      "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx",
    ),
    "utf8",
  );

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
    });

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

  it("syncs direct full-page bundleUpsellConfig into bundle product metafields", async () => {
    const bundleUpsellConfig = makeBundleUpsellConfig();
    getDb().bundle.update.mockResolvedValue(
      makeUpdatedBundle({
        shopifyProductId: PRODUCT_ID,
        bundleUpsellConfig,
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
      }),
    );

    await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeFormData({
        stepsData: JSON.stringify(makeStepWithProduct()),
        bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
        bundleUpsellConfig: JSON.stringify(bundleUpsellConfig),
      }),
    );

    expect(updateBundleProductMetafields).toHaveBeenCalledWith(
      MOCK_ADMIN,
      PRODUCT_ID,
      expect.objectContaining({ bundleUpsellConfig }),
    );
  });

  it("syncs parent product status with Shopify's current product update mutation", async () => {
    const fd = makeFormData({
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
    });

    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);

    const statusCall = MOCK_ADMIN.graphql.mock.calls.find(([query]) =>
      String(query).includes("productUpdate")
    );
    expect(statusCall).toBeDefined();
    expect(statusCall?.[1]).toEqual(
      expect.objectContaining({
        variables: expect.objectContaining({
          product: expect.objectContaining({
            id: PRODUCT_ID,
            status: "ACTIVE",
            descriptionHtml: expect.any(String),
          }),
        }),
      }),
    );
  });

  it("syncs parent product status to ACTIVE then UNLISTED for unlisted status", async () => {
    const unlistedStatuses: string[] = [];
    MOCK_ADMIN.graphql.mockImplementation(async (query: string, variables: any) => {
      if (String(query).includes("productUpdate")) {
        unlistedStatuses.push(String(variables?.variables?.product?.status));
      }
      return Promise.resolve({
        json: async () => ({
          data: {
            productUpdate: {
              product: { id: PRODUCT_ID, status: variables?.variables?.product?.status },
              userErrors: [],
            },
          },
        }),
      });
    });

    const fd = makeFormData({
      bundleStatus: "unlisted",
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
    });

    const res = await handleSaveBundle(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      fd,
    );
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(unlistedStatuses).toEqual(["ACTIVE", "UNLISTED"]);
    expect(MOCK_ADMIN.graphql).toHaveBeenCalledWith(
      expect.any(String),
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

  it("activates bundle parent products through a requiresComponents sequence when Shopify rejects unsupported channels", async () => {
    MOCK_ADMIN.graphql.mockImplementation((query: string, variables: any) => {
      if (String(query).includes("productUpdate") && variables?.variables?.product?.status === "ACTIVE") {
        const directStatusCalls = MOCK_ADMIN.graphql.mock.calls.filter(([calledQuery]) =>
          String(calledQuery).includes("productUpdate")
        ).length;

        if (directStatusCalls === 1) {
          return Promise.resolve({
            json: async () => ({
              data: {
                productUpdate: {
                  product: { id: PRODUCT_ID, status: "DRAFT" },
                  userErrors: [
                    {
                      field: ["resourcePublications", "channelId"],
                      message: "Resource publications channel ChatGPT does not support bundle products",
                    },
                  ],
                },
              },
            }),
          });
        }
      }

      if (String(query).includes("productVariantsBulkUpdate")) {
        return Promise.resolve({
          json: async () => ({
            data: {
              productVariantsBulkUpdate: {
                productVariants: [
                  {
                    id: "gid://shopify/ProductVariant/999",
                    requiresComponents: variables.variables.variants[0].requiresComponents,
                  },
                ],
                userErrors: [],
              },
            },
          }),
        });
      }

      return Promise.resolve({
        json: async () => ({
          data: {
            productUpdate: {
              product: { id: PRODUCT_ID, status: "ACTIVE" },
              userErrors: [],
            },
          },
        }),
      });
    });

    const fd = makeFormData({
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
    });

    await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);

    const variantUpdates = MOCK_ADMIN.graphql.mock.calls
      .filter(([query]) => String(query).includes("productVariantsBulkUpdate"))
      .map(([, options]) => options.variables.variants[0].requiresComponents);

    expect(variantUpdates).toEqual([false, true]);
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

  it("keeps StepCategory products under categories in full-page standard config", async () => {
    const categoryProduct = {
      id: "gid://shopify/Product/789",
      title: "Category Product",
      variants: [{ id: "gid://shopify/ProductVariant/987", title: "Default" }],
    };
    const selectedCollection = {
      id: "gid://shopify/Collection/456",
      handle: "category-collection",
      title: "Category Collection",
    };
    getDb().bundle.update.mockResolvedValue(
      makeUpdatedBundle({
        shopifyProductId: PRODUCT_ID,
        steps: [
          {
            id: "step-db-1",
            name: "Step 1",
            products: [],
            collections: [],
            StepProduct: [],
            StepCategory: [
              {
                id: "category98476",
                name: "Category 1",
                title: "Category 1",
                sortOrder: 0,
                products: [categoryProduct],
                selectedProducts: [],
                collections: [],
                collectionsData: [],
                collectionsSelectedData: [selectedCollection],
              },
            ],
          },
        ],
      })
    );

    const fd = makeFormData({
      stepsData: JSON.stringify(makeStepsData({
        StepCategory: [
          {
            id: "category98476",
            title: "Category 1",
            products: [categoryProduct],
            collectionsSelectedData: [selectedCollection],
          },
        ],
      })),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
    });
    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const body = await res.json();

    expect(body.success).toBe(true);
    const standardConfig = (convertBundleToStandardMetafields as jest.Mock).mock.calls[0][1];
    expect(standardConfig.steps[0].products).toEqual([]);
    expect(standardConfig.steps[0].collections).toEqual([]);
    expect(standardConfig.steps[0].categories[0].products).toEqual([{
      id: "gid://shopify/Product/789",
      title: "Category Product",
    }]);
    expect(standardConfig.steps[0].categories[0].collectionsSelectedData).toEqual([selectedCollection]);
  });

  it("passes direct bundle summary text config into metafield sync", async () => {
    const bundleTextConfig = {
      bundleSummary: {
        title: "Your Custom Box",
        subTitle: "Review your selected items",
      },
    };
    getDb().bundle.update.mockResolvedValue(
      makeUpdatedBundle({
        shopifyProductId: PRODUCT_ID,
        bundleTextConfig,
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

    const fd = makeFormData({
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
      bundleTextConfig: JSON.stringify(bundleTextConfig),
    });
    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(updateBundleProductMetafields).toHaveBeenCalledWith(
      MOCK_ADMIN,
      PRODUCT_ID,
      expect.objectContaining({ bundleTextConfig }),
    );
  });

  it("persists direct quantity validation and product slots config into metafield sync", async () => {
    const validateQuantityPerProduct = {
      isEnabled: true,
      allowedQuantity: 2,
    };
    getDb().bundle.update.mockResolvedValue(
      makeUpdatedBundle({
        shopifyProductId: PRODUCT_ID,
        productSlotsEnabled: true,
        validateQuantityPerProduct,
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

    const fd = makeFormData({
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
      productSlotsEnabled: "true",
      validateQuantityPerProduct: JSON.stringify(validateQuantityPerProduct),
    });
    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(updateBundleProductMetafields).toHaveBeenCalledWith(
      MOCK_ADMIN,
      PRODUCT_ID,
      expect.objectContaining({
        productSlotsEnabled: true,
        validateQuantityPerProduct,
      }),
    );
  });

  it("passes step translations into bundle product metafield sync", async () => {
    const multiLangData = {
      es: {
        productPageStepText: "Paso auditoria",
        productPageSubtext: "Construye paquete auditoria",
      },
    };
    getDb().bundle.update.mockResolvedValue(
      makeUpdatedBundle({
        shopifyProductId: PRODUCT_ID,
        steps: [
          {
            id: "step-db-1",
            name: "Step 1",
            multiLangData,
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

    const fd = makeFormData({
      stepsData: JSON.stringify(makeStepsData({
        multiLangData,
        StepProduct: [
          {
            id: "gid://shopify/Product/456",
            title: "Component",
            imageUrl: null,
          },
        ],
      })),
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
            name: "Step 1",
            multiLangData,
          }),
        ],
      }),
    );
  });

  it("persists Step Config image and passes stepImage into bundle product metafield sync", async () => {
    const stepImage = "https://cdn.example.test/fpb-step-config.png";
    getDb().bundle.update.mockResolvedValue(
      makeUpdatedBundle({
        shopifyProductId: PRODUCT_ID,
        steps: [
          {
            id: "step-db-1",
            name: "Step 1",
            timelineIconUrl: stepImage,
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

    const fd = makeFormData({
      stepsData: JSON.stringify(makeStepsData({
        stepImage,
        StepProduct: [
          {
            id: "gid://shopify/Product/456",
            title: "Component",
            imageUrl: null,
          },
        ],
      })),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
    });
    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const body = await res.json();
    const updateCall = getDb().bundle.update.mock.calls[0][0];
    const metafieldConfig = (updateBundleProductMetafields as jest.Mock).mock.calls[0][2];

    expect(body.success).toBe(true);
    expect(updateCall.data.steps.create[0].timelineIconUrl).toBe(stepImage);
    expect(metafieldConfig.steps[0]).not.toHaveProperty("timelineIconUrl");
    expect(updateBundleProductMetafields).toHaveBeenCalledWith(
      MOCK_ADMIN,
      PRODUCT_ID,
      expect.objectContaining({
        steps: [
          expect.objectContaining({
            name: "Step 1",
            stepImage,
          }),
        ],
      }),
    );
  });

  it("persists direct add-ons personalization config and passes it into metafield sync", async () => {
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
                handle: "14k-dangling-obsidian-earrings",
                title: "14k Dangling Obsidian Earrings",
                variants: [
                  {
                    variantId: "45038877868228",
                    variantGraphqlId: "gid://shopify/ProductVariant/45038877868228",
                    price: "829.00",
                    variantTitle: "Default Title",
                  },
                ],
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
            ineligibleState: "Add product(s) worth at least {{addonsConditionDiff}} {{currencyUnit}} more to claim {{addonsDiscountValue}}{{addonsDiscountValueUnit}} off on Add ons",
            eligibleState: "Congrats you are eligible for {{addonsDiscountValue}}{{addonsDiscountValueUnit}} off on Add ons",
          },
        },
      },
    };
    getDb().bundle.update.mockResolvedValue(
      makeUpdatedBundle({
        shopifyProductId: PRODUCT_ID,
        personalizationData,
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

    const fd = makeFormData({
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
      personalizationData: JSON.stringify(personalizationData),
    });
    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ personalizationData }),
      })
    );
    expect(updateBundleProductMetafields).toHaveBeenCalledWith(
      MOCK_ADMIN,
      PRODUCT_ID,
      expect.objectContaining({ personalizationData }),
    );
  });

  it("persists direct message personalization config and passes it into metafield sync", async () => {
    const personalizationData = {
      isPersonalizationEnabled: true,
      giftMessage: {
        isGiftMessageEnabled: true,
        isSenderAndRecipientNameEnabled: true,
        giftMessageCharacterLimit: "120",
        isGiftMessageMandatory: true,
        isVideoMessageEnabled: false,
        isEmailEnabled: false,
        messageProduct: {
          isMessageProductEnabled: true,
          status: "unlisted",
          product: {
            id: "gid://shopify/Product/8600867012804",
            title: "Message",
            variants: [
              {
                id: "gid://shopify/ProductVariant/46177973534916",
                title: "Message",
                price: "0.00",
                taxable: false,
                inventory_policy: "continue",
              },
            ],
          },
        },
      },
    };
    getDb().bundle.update.mockResolvedValue(
      makeUpdatedBundle({
        shopifyProductId: PRODUCT_ID,
        personalizationData,
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

    const fd = makeFormData({
      stepsData: JSON.stringify(makeStepWithProduct()),
      bundleProduct: JSON.stringify({ id: PRODUCT_ID }),
      personalizationData: JSON.stringify(personalizationData),
    });
    const res = await handleSaveBundle(MOCK_ADMIN, MOCK_SESSION, "bundle-1", fd);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(getDb().bundle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ personalizationData }),
      })
    );
    expect(updateBundleProductMetafields).toHaveBeenCalledWith(
      MOCK_ADMIN,
      PRODUCT_ID,
      expect.objectContaining({ personalizationData }),
    );
  });

  it("passes direct box-selection config into bundle variant metafield sync", async () => {
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
    getDb().bundle.update.mockImplementationOnce(async (args: any) =>
      makeUpdatedBundle({
        shopifyProductId: PRODUCT_ID,
        boxSelection: args.data.boxSelection,
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
      tierTextByRuleId: {
        "rule-2": { tierText: "2 Pack", tierSubtext: "Save 5%" },
      },
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
          messages: expect.objectContaining({
            tierTextByRuleId: {
              "rule-2": { tierText: "2 Pack", tierSubtext: "Save 5%" },
            },
          }),
        }),
      }),
    );
  });

  it("serializes messages through the direct personalization draft instead of generic copy overrides", () => {
    const source = configureRouteSource();

    expect(source).toContain("buildGiftMessageDraftFromPersonalizationData");
    expect(source).toContain("buildPersonalizationDataFromDraft(addonDraft, addonMessages, giftMessageDraft)");
    expect(source).toContain("giftMessage: buildGiftMessageConfigFromDraft(giftMessageDraft)");
    expect(source).not.toContain("textOverrides.giftMessageEnabled");
    expect(source).not.toContain('setMessageOverride("giftMessageEnabled"');
  });

  it("keeps add-ons discount defaults independent from free-gift display state", () => {
    const source = configureRouteSource();

    expect(source).toContain("const discountValue = Number(tier?.discount?.value ?? tier?.discountValue ?? 0) || 0;");
    expect(source).toContain("discountValue: 0,");
    expect(source).not.toContain("tier?.displayFree ? 100 : 0");
    expect(source).not.toContain("step.addonDisplayFree !== false ? 100 : 0");
  });

  it("keeps direct add-ons state independent from paid step data", () => {
    const source = configureRouteSource();

    expect(source).toContain("buildPersonalizationDataFromDraft(addonDraft, addonMessages, giftMessageDraft)");
    expect(source).toContain("isFreeGift: false,");
    expect(source).not.toContain('stepsState.updateStepField(step.id, "isFreeGift"');
    expect(source).not.toContain("buildPersonalizationDataFromStep(personalizationStep");
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
