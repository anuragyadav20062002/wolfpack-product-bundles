export {};

const mockDb = {
  bundle: { deleteMany: jest.fn() },
  session: { deleteMany: jest.fn() },
  designSettings: { deleteMany: jest.fn() },
  queuedJob: { deleteMany: jest.fn() },
  complianceRecord: { deleteMany: jest.fn() },
  webhookEvent: { deleteMany: jest.fn() },
  businessEvent: { deleteMany: jest.fn() },
  shop: { deleteMany: jest.fn() },
  orderAttribution: { deleteMany: jest.fn() },
  bundleEngagement: { deleteMany: jest.fn() },
};

const mockGetCachedShopifyShopGid = jest.fn();
const mockRecordBusinessEvent = jest.fn();

jest.mock("../../../../app/db.server", () => ({
  __esModule: true,
  default: mockDb,
}));

jest.mock("../../../../app/services/app-events.server", () => ({
  getCachedShopifyShopGid: mockGetCachedShopifyShopGid,
  recordBusinessEvent: mockRecordBusinessEvent,
}));

jest.mock("../../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("handleAppUninstalled", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.bundle.deleteMany.mockResolvedValue({ count: 2 });
    mockDb.session.deleteMany.mockResolvedValue({ count: 1 });
    mockDb.designSettings.deleteMany.mockResolvedValue({ count: 1 });
    mockDb.queuedJob.deleteMany.mockResolvedValue({ count: 1 });
    mockDb.complianceRecord.deleteMany.mockResolvedValue({ count: 1 });
    mockDb.webhookEvent.deleteMany.mockResolvedValue({ count: 3 });
    mockDb.businessEvent.deleteMany.mockResolvedValue({ count: 12 });
    mockDb.shop.deleteMany.mockResolvedValue({ count: 1 });
    mockGetCachedShopifyShopGid.mockResolvedValue("gid://shopify/Shop/123");
    mockRecordBusinessEvent.mockResolvedValue({ id: "business-event-1" });
  });

  it("cleans operational uninstall data while preserving attribution and engagement analytics", async () => {
    const { handleAppUninstalled } = await import(
      "../../../../app/services/webhooks/handlers/lifecycle.server"
    );

    const result = await handleAppUninstalled(
      "merchant.myshopify.com",
      { id: 123 },
      "current-webhook-event-id"
    );

    expect(result).toEqual({
      success: true,
      message: "App uninstalled, cleaned up 2 bundles and all shop data",
    });
    expect(mockDb.bundle.deleteMany).toHaveBeenCalledWith({
      where: { shopId: "merchant.myshopify.com" },
    });
    expect(mockDb.session.deleteMany).toHaveBeenCalledWith({
      where: { shop: "merchant.myshopify.com" },
    });
    expect(mockDb.designSettings.deleteMany).toHaveBeenCalledWith({
      where: { shopId: "merchant.myshopify.com" },
    });
    expect(mockDb.queuedJob.deleteMany).toHaveBeenCalledWith({
      where: { shopId: "merchant.myshopify.com" },
    });
    expect(mockDb.complianceRecord.deleteMany).toHaveBeenCalledWith({
      where: { shop: "merchant.myshopify.com" },
    });
    expect(mockDb.webhookEvent.deleteMany).toHaveBeenCalledWith({
      where: {
        shopDomain: "merchant.myshopify.com",
        id: { not: "current-webhook-event-id" },
      },
    });
    expect(mockDb.businessEvent.deleteMany).toHaveBeenCalledWith({
      where: { shopDomain: "merchant.myshopify.com" },
    });
    expect(mockDb.shop.deleteMany).toHaveBeenCalledWith({
      where: { shopDomain: "merchant.myshopify.com" },
    });
    expect(mockDb.orderAttribution.deleteMany).not.toHaveBeenCalled();
    expect(mockDb.bundleEngagement.deleteMany).not.toHaveBeenCalled();
  });

  it("records app_uninstalled after deleting old BusinessEvent rows so the uninstall marker survives", async () => {
    const { handleAppUninstalled } = await import(
      "../../../../app/services/webhooks/handlers/lifecycle.server"
    );

    await handleAppUninstalled("merchant.myshopify.com", {}, "current-webhook-event-id");

    expect(mockRecordBusinessEvent).toHaveBeenCalledWith({
      eventHandle: "app_uninstalled",
      shopDomain: "merchant.myshopify.com",
      shopifyShopGid: "gid://shopify/Shop/123",
      surface: "webhook",
      actor: "webhook",
      routeFamily: "lifecycle_webhook",
      result: "success",
      attributes: {
        topic: "APP_UNINSTALLED",
      },
    });
    const businessEventDeleteOrder = mockDb.businessEvent.deleteMany.mock.invocationCallOrder[0];
    const uninstallEventRecordOrder = mockRecordBusinessEvent.mock.invocationCallOrder[0];
    expect(businessEventDeleteOrder).toBeLessThan(uninstallEventRecordOrder);
  });
});
