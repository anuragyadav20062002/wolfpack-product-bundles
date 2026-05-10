/**
 * Unit Tests: step.filters pass-through in bundle_ui_config metafield
 *
 * Verifies that bundle-product.server.ts writes step.filters into
 * the steps array of the bundle_ui_config metafield payload.
 */

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    startTimer: jest.fn(() => jest.fn()),
  },
}));

jest.mock("../../../app/utils/variant-lookup.server", () => ({
  getFirstVariantId: jest.fn().mockResolvedValue({
    success: true,
    variantId: "gid://shopify/ProductVariant/1",
    price: "10.00",
  }),
  batchGetFirstVariantsWithPrices: jest.fn().mockResolvedValue(new Map()),
}));

import { updateBundleProductMetafields } from "../../../app/services/bundles/metafield-sync/operations/bundle-product.server";
import { BundleType } from "../../../app/constants/bundle";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBundle(stepFilters?: { label: string; collectionHandle: string }[] | null) {
  return {
    id: "bundle-1",
    bundleId: "bundle-1",
    name: "Test Bundle",
    description: "",
    status: "active",
    bundleType: BundleType.FULL_PAGE,
    shopifyProductId: "gid://shopify/Product/999",
    shopifyPageHandle: "test-bundle",
    steps: [
      {
        id: "step-1",
        name: "Step 1",
        position: 0,
        minQuantity: 1,
        maxQuantity: 1,
        StepProduct: [{ productId: "gid://shopify/Product/123" }],
        collections: [],
        filters: stepFilters !== undefined ? stepFilters : null,
      },
    ],
    pricing: {
      enabled: false,
      method: "percentage_off",
      rules: null,
      showFooter: false,
      showProgressBar: false,
      messages: null,
    },
    promoBannerBgImage: null,
    promoBannerBgImageCrop: null,
    loadingGif: null,
    tierConfig: null,
    showStepTimeline: null,
    floatingBadgeEnabled: false,
    floatingBadgeText: "",
    textOverrides: null,
    textOverridesByLocale: null,
    sdkMode: false,
  } as any;
}

function makeAdmin() {
  return {
    graphql: jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        data: {
          metafieldsSet: { metafields: [{ key: "bundle_ui_config", value: "{}" }], userErrors: [] },
          productUpdate: { product: null },
          productVariantsBulkUpdate: { productVariants: [] },
          collection: null,
        },
      }),
    }),
  };
}

function getWrittenSteps(admin: ReturnType<typeof makeAdmin>): any[] | null {
  for (const call of (admin.graphql as jest.Mock).mock.calls) {
    const variables = call[1]?.variables;
    if (!variables?.metafields) continue;
    const uiConfig = variables.metafields.find((m: any) => m.key === "bundle_ui_config");
    if (uiConfig) {
      const parsed = JSON.parse(uiConfig.value);
      return parsed.steps ?? null;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("updateBundleProductMetafields — step.filters pass-through", () => {
  it("includes filters: null when step has no filters", async () => {
    const admin = makeAdmin();
    await updateBundleProductMetafields(admin as any, "gid://shopify/Product/999", makeBundle(null), "shop.myshopify.com");
    const steps = getWrittenSteps(admin);
    expect(steps).not.toBeNull();
    expect(steps![0].filters).toBeNull();
  });

  it("includes filters array when step has filters configured", async () => {
    const filters = [
      { label: "Shirts", collectionHandle: "mens-shirts" },
      { label: "Pants", collectionHandle: "mens-pants" },
    ];
    const admin = makeAdmin();
    await updateBundleProductMetafields(admin as any, "gid://shopify/Product/999", makeBundle(filters), "shop.myshopify.com");
    const steps = getWrittenSteps(admin);
    expect(steps![0].filters).toEqual(filters);
  });

  it("includes filters: null when step.filters is undefined", async () => {
    const admin = makeAdmin();
    const bundle = makeBundle();
    delete (bundle as any).steps[0].filters;
    await updateBundleProductMetafields(admin as any, "gid://shopify/Product/999", bundle, "shop.myshopify.com");
    const steps = getWrittenSteps(admin);
    expect(steps![0].filters).toBeNull();
  });
});
