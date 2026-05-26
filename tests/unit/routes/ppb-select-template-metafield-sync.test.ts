/**
 * Unit tests -- PPB Select Template metafield sync
 *
 * Spec: test-spec/eb-ui-clone-rewrite.spec.md
 */

import { handleUpdateBundleDesignTemplate } from "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server";
import {
  updateBundleProductMetafields,
  updateComponentProductMetafields,
} from "../../../app/services/bundles/metafield-sync.server";

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    bundle: { update: jest.fn() },
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

jest.mock("../../../app/services/bundles/pricing-calculation.server", () => ({
  calculateBundlePrice: jest.fn().mockResolvedValue("99.99"),
  updateBundleProductPrice: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../app/services/bundles/standard-metafields.server", () => ({
  convertBundleToStandardMetafields: jest.fn().mockResolvedValue({ metafields: {}, errors: [] }),
  updateProductStandardMetafields: jest.fn().mockResolvedValue(undefined),
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

const MOCK_ADMIN = {
  graphql: jest.fn(),
} as any;

const MOCK_SESSION = {
  shop: "test-shop.myshopify.com",
} as any;

function makeForm(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return fd;
}

describe("PPB Select Template metafield sync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rewrites bundle product metafields with the saved template config", async () => {
    getDb().bundle.update.mockResolvedValue({
      id: "bundle-1",
      name: "Product Page Bundle",
      description: "Description",
      status: "active",
      templateName: null,
      bundleType: "product_page",
      shopifyProductId: "gid://shopify/Product/123",
      bundleDesignTemplate: "PDP_INPAGE",
      bundleDesignPresetId: "CASCADE",
      defaultProductsData: { isDefaultProductsEnabled: true },
      bundleTextConfig: { bundleSummary: { title: "Summary", subTitle: "Sub" } },
      validateQuantityPerProduct: { isEnabled: true, allowedQuantity: 1 },
      individualSellingPlanSelection: { isEnabled: false, showFor: "ALL_PRODUCTS" },
      useSingleStepCategoriesAsBundleSteps: false,
      steps: [
        {
          id: "step-1",
          name: "Step 1",
          position: 1,
          minQuantity: 1,
          maxQuantity: 1,
          StepProduct: [{ productId: "gid://shopify/Product/456", title: "Component" }],
          StepCategory: [],
          collections: [],
        },
      ],
      pricing: {
        enabled: true,
        method: "buy_x_get_y",
        rules: [{ id: "rule-1", customerBuys: 2, customerGets: 1, discountValue: 100 }],
        messages: {},
      },
    });

    const response = await handleUpdateBundleDesignTemplate(
      MOCK_ADMIN,
      MOCK_SESSION,
      "bundle-1",
      makeForm({
        bundleDesignTemplate: "PDP_INPAGE",
        bundleDesignPresetId: "CASCADE",
      }),
    );
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(getDb().bundle.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "bundle-1", shopId: "test-shop.myshopify.com" },
      data: {
        bundleDesignTemplate: "PDP_INPAGE",
        bundleDesignPresetId: "CASCADE",
      },
    }));

    expect(updateComponentProductMetafields).toHaveBeenCalledWith(
      MOCK_ADMIN,
      "gid://shopify/Product/123",
      expect.any(Object),
    );
    expect(updateBundleProductMetafields).toHaveBeenCalledWith(
      MOCK_ADMIN,
      "gid://shopify/Product/123",
      expect.objectContaining({
        bundleDesignTemplate: "PDP_INPAGE",
        bundleDesignPresetId: "CASCADE",
        bundleDesignTemplateData: { templateId: "CASCADE" },
        defaultProductsData: { isDefaultProductsEnabled: true },
        bundleTextConfig: { bundleSummary: { title: "Summary", subTitle: "Sub" } },
        validateQuantityPerProduct: { isEnabled: true, allowedQuantity: 1 },
      }),
    );
  });
});
