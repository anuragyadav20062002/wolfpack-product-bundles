export {};

const mockDb = {
  webhookEvent: {
    findUnique: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockHandleProductDelete = jest.fn();
const mockHandleProductUpdate = jest.fn();
const mockHandleInventoryUpdate = jest.fn();
const mockHandleOrderCreate = jest.fn();

jest.mock("../../../../app/db.server", () => ({
  __esModule: true,
  default: mockDb,
}));

jest.mock("../../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../../../app/services/webhooks/handlers/subscription.server", () => ({
  handleSubscriptionUpdate: jest.fn(),
  handleSubscriptionCancelled: jest.fn(),
  handleSubscriptionApproachingCap: jest.fn(),
  handlePurchaseUpdate: jest.fn(),
}));

jest.mock("../../../../app/services/webhooks/handlers/product.server", () => ({
  handleProductUpdate: mockHandleProductUpdate,
  handleProductDelete: mockHandleProductDelete,
}));

jest.mock("../../../../app/services/webhooks/handlers/gdpr.server", () => ({
  handleCustomerDataRequest: jest.fn(),
  handleCustomerRedact: jest.fn(),
  handleShopRedact: jest.fn(),
}));

jest.mock("../../../../app/services/webhooks/handlers/lifecycle.server", () => ({
  handleAppUninstalled: jest.fn(),
  handleScopesUpdate: jest.fn(),
}));

jest.mock("../../../../app/services/webhooks/handlers/inventory.server", () => ({
  handleInventoryUpdate: mockHandleInventoryUpdate,
}));

jest.mock("../../../../app/services/webhooks/handlers/orders.server", () => ({
  handleOrderCreate: mockHandleOrderCreate,
}));

function buildMessage(topic: string, payload: unknown, webhookId?: string) {
  return {
    data: Buffer.from(JSON.stringify(payload)).toString("base64"),
    attributes: {
      "X-Shopify-Topic": topic,
      "X-Shopify-Shop-Domain": "merchant.myshopify.com",
      ...(webhookId ? { "X-Shopify-Webhook-Id": webhookId } : {}),
    },
  };
}

describe("WebhookProcessor retired topic ingestion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.webhookEvent.findUnique.mockResolvedValue(null);
    mockDb.webhookEvent.create.mockResolvedValue({ id: "webhook-event-1" });
    mockDb.webhookEvent.updateMany.mockResolvedValue({ count: 1 });
    mockHandleProductDelete.mockResolvedValue({
      success: true,
      message: "Product deleted",
    });
  });

  it.each(["products/update", "inventory_levels/update", "orders/create"])(
    "returns success without storing retired high-volume topic %s",
    async (topic) => {
      const { WebhookProcessor } = await import(
        "../../../../app/services/webhooks/processor.server"
      );

      const result = await WebhookProcessor.processPubSubMessage(
        buildMessage(topic, { id: 123, variants: [{ id: 456 }] })
      );

      expect(result).toEqual({
        success: true,
        message: `Ignored retired webhook topic: ${topic}`,
      });
      expect(mockDb.webhookEvent.create).not.toHaveBeenCalled();
      expect(mockDb.webhookEvent.updateMany).not.toHaveBeenCalled();
      expect(mockHandleProductUpdate).not.toHaveBeenCalled();
      expect(mockHandleInventoryUpdate).not.toHaveBeenCalled();
      expect(mockHandleOrderCreate).not.toHaveBeenCalled();
    }
  );

  it("still persists and processes active product delete webhooks", async () => {
    const { WebhookProcessor } = await import(
      "../../../../app/services/webhooks/processor.server"
    );

    const result = await WebhookProcessor.processPubSubMessage(
      buildMessage("products/delete", { id: 123 }, "wh-123")
    );

    expect(result).toEqual({
      success: true,
      message: "Product deleted",
    });
    expect(mockDb.webhookEvent.create).toHaveBeenCalledWith({
      data: {
        shopDomain: "merchant.myshopify.com",
        topic: "products/delete",
        webhookId: "wh-123",
        payload: { id: 123 },
        processed: false,
      },
    });
    expect(mockHandleProductDelete).toHaveBeenCalledWith(
      "merchant.myshopify.com",
      { id: 123 }
    );
    expect(mockDb.webhookEvent.updateMany).toHaveBeenCalledWith({
      where: { id: "webhook-event-1" },
      data: {
        processed: true,
        processedAt: expect.any(Date),
        error: null,
      },
    });
  });
});
