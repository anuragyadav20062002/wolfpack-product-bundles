jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    businessEvent: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock("../../../app/services/app-events.server", () => ({
  ensureShopIdentity: jest.fn(),
  recordBusinessEvent: jest.fn(),
}));

const getDb = () => require("../../../app/db.server").default;
const getAppEvents = () => require("../../../app/services/app-events.server");

describe("bundle preview event service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAppEvents().ensureShopIdentity.mockResolvedValue("gid://shopify/Shop/1");
    getAppEvents().recordBusinessEvent.mockResolvedValue({});
  });

  it("records the first bundle preview with bundle link, type, status, and id", async () => {
    getDb().businessEvent.findFirst.mockResolvedValue(null);
    const { recordFirstBundlePreviewEvent } = await import("../../../app/services/bundles/bundle-preview-event.server");

    const result = await recordFirstBundlePreviewEvent({
      admin: { graphql: jest.fn() } as any,
      shopDomain: "test-shop.myshopify.com",
      bundle: {
        id: "bundle-1",
        bundleType: "full_page",
        status: "draft",
      },
      bundleLink: "https://test-shop.myshopify.com/pages/preview-bundle",
      routeFamily: "fpb_configure",
    });

    expect(result).toBe(true);
    expect(getAppEvents().recordBusinessEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventHandle: "bundle_previewed",
      shopDomain: "test-shop.myshopify.com",
      shopifyShopGid: "gid://shopify/Shop/1",
      bundleId: "bundle-1",
      bundleType: "full_page",
      surface: "admin",
      actor: "merchant",
      routeFamily: "fpb_configure",
      result: "success",
      idempotencyKey: "bundle-previewed:bundle-1",
      attributes: expect.objectContaining({
        bundle_status: "draft",
        bundle_link: "https://test-shop.myshopify.com/pages/preview-bundle",
      }),
    }));
  });

  it("does not record a duplicate first-preview event for the same bundle", async () => {
    getDb().businessEvent.findFirst.mockResolvedValue({ id: "event-1" });
    const { recordFirstBundlePreviewEvent } = await import("../../../app/services/bundles/bundle-preview-event.server");

    const result = await recordFirstBundlePreviewEvent({
      admin: { graphql: jest.fn() } as any,
      shopDomain: "test-shop.myshopify.com",
      bundle: {
        id: "bundle-1",
        bundleType: "product_page",
        status: "active",
      },
      bundleLink: "https://test-shop.myshopify.com/products/bundle-product",
      routeFamily: "ppb_configure",
    });

    expect(result).toBe(false);
    expect(getAppEvents().ensureShopIdentity).not.toHaveBeenCalled();
    expect(getAppEvents().recordBusinessEvent).not.toHaveBeenCalled();
  });
});

export {};
