/**
 * Unit Tests: BundleUiMessaging.showDiscountProgressBar in metafield sync
 *
 * Verifies that bundle-product.server.ts writes showDiscountProgressBar into
 * the messaging object of the bundle_ui_config metafield payload.
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
// Fixture
// ---------------------------------------------------------------------------

function makeBundle(showProgressBar?: boolean) {
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
      },
    ],
    pricing: {
      enabled: true,
      method: "percentage_off",
      rules: null,
      showFooter: true,
      showProgressBar: showProgressBar ?? false,
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

// ---------------------------------------------------------------------------
// Admin mock — captures graphql call variables
// ---------------------------------------------------------------------------

function makeAdmin() {
  return {
    graphql: jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        data: {
          metafieldsSet: { metafields: [{ key: "bundle_ui_config", value: "{}" }], userErrors: [] },
          productUpdate: { product: null },
          productVariantsBulkUpdate: { productVariants: [] },
        },
      }),
    }),
  };
}

function getWrittenMessaging(admin: ReturnType<typeof makeAdmin>): Record<string, unknown> | null {
  for (const call of (admin.graphql as jest.Mock).mock.calls) {
    const variables = call[1]?.variables;
    if (!variables?.metafields) continue;
    const uiConfig = variables.metafields.find((m: any) => m.key === "bundle_ui_config");
    if (uiConfig) {
      const parsed = JSON.parse(uiConfig.value);
      return parsed.messaging ?? null;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("updateBundleProductMetafields — showDiscountProgressBar", () => {
  it("writes showDiscountProgressBar: false when showProgressBar is false", async () => {
    const admin = makeAdmin();
    await updateBundleProductMetafields(admin as any, "gid://shopify/Product/999", makeBundle(false), "shop.myshopify.com");
    const messaging = getWrittenMessaging(admin);
    expect(messaging).not.toBeNull();
    expect(messaging!.showDiscountProgressBar).toBe(false);
  });

  it("writes showDiscountProgressBar: true when showProgressBar is true", async () => {
    const admin = makeAdmin();
    await updateBundleProductMetafields(admin as any, "gid://shopify/Product/999", makeBundle(true), "shop.myshopify.com");
    const messaging = getWrittenMessaging(admin);
    expect(messaging!.showDiscountProgressBar).toBe(true);
  });

  it("defaults showDiscountProgressBar to false when showProgressBar is undefined", async () => {
    const admin = makeAdmin();
    const bundle = makeBundle();
    delete (bundle as any).pricing.showProgressBar;
    await updateBundleProductMetafields(admin as any, "gid://shopify/Product/999", bundle);
    const messaging = getWrittenMessaging(admin);
    expect(messaging!.showDiscountProgressBar).toBe(false);
  });
});
