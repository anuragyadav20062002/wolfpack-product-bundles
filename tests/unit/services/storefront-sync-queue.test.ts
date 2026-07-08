import {
  compactBundleForConfigureResponse,
  formatBundleStorefrontSync,
  syncBundleStorefrontNow,
} from "../../../app/services/bundles/storefront-sync.server";
import { inngest } from "../../../app/inngest/client";

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    bundle: {
      update: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../../../app/inngest/client", () => ({
  inngest: {
    send: jest.fn(),
  },
}));

jest.mock("../../../app/services/cart-transform-service.server", () => ({
  CartTransformService: {
    completeSetup: jest.fn().mockResolvedValue({
      success: true,
      cartTransformId: "gid://shopify/CartTransform/1",
    }),
  },
}));

jest.mock("../../../app/services/bundles/metafield-sync.server", () => ({
  updateBundleProductMetafields: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../app/services/bundles/standard-metafields.server", () => ({
  convertBundleToStandardMetafields: jest.fn().mockResolvedValue({
    metafields: {},
    errors: [],
  }),
  updateProductStandardMetafields: jest.fn().mockResolvedValue(undefined),
}));

jest.mock(
  "../../../app/services/widget-installation/widget-full-page-bundle.server",
  () => ({
    refreshFullPageBundlePageBody: jest.fn().mockResolvedValue({ success: true }),
    writeBundleConfigPageMetafield: jest.fn().mockResolvedValue(undefined),
  }),
);

jest.mock("../../../app/services/theme-colors.server", () => ({
  syncThemeColors: jest.fn().mockResolvedValue(undefined),
}));

jest.mock(
  "../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/product-status.server",
  () => ({
    syncFpbProductStatus: jest.fn().mockResolvedValue(undefined),
  }),
);

jest.mock(
  "../../../app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/shared.server",
  () => ({
    buildFullPageBundleMetafieldConfig: jest.fn().mockReturnValue({}),
  }),
);

jest.mock(
  "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/runtime-config.server",
  () => ({
    buildSyncBundleConfiguration: jest.fn().mockReturnValue({}),
  }),
);

jest.mock(
  "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/product-sync.server",
  () => ({
    syncBundleProductToShopify: jest.fn().mockResolvedValue({
      handle: "daily-essentials",
    }),
  }),
);

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const getDb = () => require("../../../app/db.server").default;
const mockSend = inngest.send as jest.MockedFunction<typeof inngest.send>;

describe("storefront sync direct flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(1720440000000);
    getDb().bundle.update.mockImplementation(async ({ data }: any) => ({
      id: "bundle-1",
      storefrontSyncStatus: data.storefrontSyncStatus,
      storefrontSyncAttemptId: data.storefrontSyncAttemptId,
      storefrontSyncLastError: data.storefrontSyncLastError ?? null,
      storefrontSyncQueuedAt: data.storefrontSyncQueuedAt ?? null,
      storefrontSyncStartedAt: data.storefrontSyncStartedAt ?? null,
      storefrontSyncedAt: data.storefrontSyncedAt ?? null,
      storefrontSyncFailedAt: data.storefrontSyncFailedAt ?? null,
      storefrontSyncStats: data.storefrontSyncStats ?? null,
    }));
    getDb().bundle.updateMany.mockResolvedValue({ count: 1 });
    getDb().bundle.findUnique.mockResolvedValue({
      id: "bundle-1",
      shopId: "test.myshopify.com",
      bundleType: "full_page",
      status: "active",
      name: "Daily Essentials",
      description: null,
      shopifyProductId: "gid://shopify/Product/1",
      shopifyProductHandle: "daily-essentials",
      shopifyPageId: "gid://shopify/Page/1",
      shopifyPageHandle: "daily-essentials",
      steps: [],
      pricing: null,
    });
    mockSend.mockResolvedValue({ ids: ["evt-1"] } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("syncs storefront data directly without sending a queue event", async () => {
    const result = await syncBundleStorefrontNow({
      admin: { graphql: jest.fn() } as any,
      shopDomain: "test.myshopify.com",
      bundleId: "bundle-1",
      bundleType: "full_page",
      reason: "save",
    });

    expect(getDb().bundle.update).toHaveBeenCalledWith({
      where: { id: "bundle-1", shopId: "test.myshopify.com" },
      data: expect.objectContaining({
        storefrontSyncStatus: "syncing",
        storefrontSyncLastError: null,
        storefrontSyncStats: null,
        storefrontSyncAttemptId: "bundle-1:1720440000000",
      }),
    });
    expect(mockSend).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      skipped: false,
      synced: true,
    });
    expect(getDb().bundle.updateMany).toHaveBeenCalledWith({
      where: {
        id: "bundle-1",
        shopId: "test.myshopify.com",
        storefrontSyncAttemptId: "bundle-1:1720440000000",
      },
      data: expect.objectContaining({
        storefrontSyncStatus: "synced",
        storefrontSyncLastError: null,
      }),
    });
  });

  it("records failed status when direct sync throws", async () => {
    const { CartTransformService } = require("../../../app/services/cart-transform-service.server");
    CartTransformService.completeSetup.mockResolvedValueOnce({
      success: false,
      error: "Cart Transform activation failed",
    });

    await expect(
      syncBundleStorefrontNow({
        admin: { graphql: jest.fn() } as any,
        shopDomain: "test.myshopify.com",
        bundleId: "bundle-1",
        bundleType: "product_page",
        reason: "save",
      }),
    ).rejects.toThrow("Cart Transform activation failed");

    expect(getDb().bundle.updateMany).toHaveBeenLastCalledWith({
      where: {
        id: "bundle-1",
        shopId: "test.myshopify.com",
        storefrontSyncAttemptId: "bundle-1:1720440000000",
      },
      data: expect.objectContaining({
        storefrontSyncStatus: "failed",
        storefrontSyncLastError: "Cart Transform activation failed",
      }),
    });
  });

  it("formats nullable bundle state for Admin loaders", () => {
    expect(formatBundleStorefrontSync({})).toEqual({
      status: "synced",
      attemptId: null,
      error: null,
      queuedAt: null,
      startedAt: null,
      syncedAt: null,
      failedAt: null,
      stats: null,
    });
  });

  it("returns a compact configure response bundle without graph or sync internals", () => {
    const result = compactBundleForConfigureResponse({
      id: "bundle-1",
      bundleType: "full_page",
      status: "active",
      name: "Daily Essentials",
      description: "Bundle copy",
      shopifyProductId: "gid://shopify/Product/1",
      shopifyProductHandle: "daily-essentials",
      shopifyPageId: "gid://shopify/Page/1",
      shopifyPageHandle: "daily-essentials",
      shopifyPreviewPageId: "gid://shopify/Page/2",
      shopifyPreviewPageHandle: "preview-daily-essentials",
      storefrontSyncStatus: "synced",
      storefrontSyncAttemptId: "attempt-1",
      steps: [{ id: "step-1" }],
      pricing: { id: "pricing-1" },
    });

    expect(result).toEqual({
      id: "bundle-1",
      bundleType: "full_page",
      status: "active",
      name: "Daily Essentials",
      description: "Bundle copy",
      shopifyProductId: "gid://shopify/Product/1",
      shopifyProductHandle: "daily-essentials",
      shopifyPageId: "gid://shopify/Page/1",
      shopifyPageHandle: "daily-essentials",
      shopifyPreviewPageId: "gid://shopify/Page/2",
      shopifyPreviewPageHandle: "preview-daily-essentials",
    });
    expect(result).not.toHaveProperty("steps");
    expect(result).not.toHaveProperty("pricing");
    expect(result).not.toHaveProperty("storefrontSyncStatus");
    expect(result).not.toHaveProperty("storefrontSyncAttemptId");
  });
});
