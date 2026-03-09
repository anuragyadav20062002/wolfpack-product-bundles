/**
 * Tests for orders/create webhook handler (Phase 3 - UTM Attribution)
 */

// Mock dependencies before imports
const mockDb = {
  orderAttribution: {
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
  },
  bundle: {
    findMany: jest.fn(),
  },
};

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: mockDb,
}));

jest.mock("../../../app/shopify.server", () => ({
  __esModule: true,
  default: {},
}));

import { handleOrderCreate } from "../../../app/services/webhooks/handlers/orders.server";

describe("handleOrderCreate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.orderAttribution.findFirst.mockResolvedValue(null);
    mockDb.orderAttribution.create.mockResolvedValue({});
    mockDb.orderAttribution.createMany.mockResolvedValue({ count: 1 });
    mockDb.bundle.findMany.mockResolvedValue([]);
  });

  it("skips when no payload", async () => {
    const result = await handleOrderCreate("shop.myshopify.com", null);
    expect(result.success).toBe(true);
    expect(result.message).toContain("No payload");
  });

  it("skips when no UTM data in order", async () => {
    const result = await handleOrderCreate("shop.myshopify.com", {
      id: 123,
      note_attributes: [],
      line_items: [],
    });
    expect(result.success).toBe(true);
    expect(result.message).toContain("No UTM attribution");
  });

  it("creates attribution record when UTM data exists", async () => {
    const payload = {
      id: 123,
      admin_graphql_api_id: "gid://shopify/Order/123",
      name: "#1001",
      total_price: "48.75",
      currency: "USD",
      note_attributes: [
        { name: "_wolfpack_utm_source", value: "google" },
        { name: "_wolfpack_utm_medium", value: "cpc" },
        { name: "_wolfpack_utm_campaign", value: "coffee_bundle_ads" },
      ],
      line_items: [],
    };

    const result = await handleOrderCreate("shop.myshopify.com", payload);

    expect(result.success).toBe(true);
    expect(mockDb.orderAttribution.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shopId: "shop.myshopify.com",
        orderId: "gid://shopify/Order/123",
        orderNumber: "#1001",
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "coffee_bundle_ads",
        revenue: 4875,
        currency: "USD",
      }),
    });
  });

  it("matches line items to bundle products", async () => {
    mockDb.bundle.findMany.mockResolvedValue([
      { id: "bundle-1" },
      { id: "bundle-2" },
    ]);

    const payload = {
      id: 456,
      admin_graphql_api_id: "gid://shopify/Order/456",
      name: "#1002",
      total_price: "99.00",
      currency: "USD",
      note_attributes: [
        { name: "_wolfpack_utm_source", value: "facebook" },
      ],
      line_items: [
        { product_id: 111 },
        { product_id: 222 },
      ],
    };

    const result = await handleOrderCreate("shop.myshopify.com", payload);

    expect(result.success).toBe(true);
    expect(mockDb.bundle.findMany).toHaveBeenCalledWith({
      where: {
        shopId: "shop.myshopify.com",
        shopifyProductId: {
          in: ["gid://shopify/Product/111", "gid://shopify/Product/222"],
        },
      },
      select: { id: true },
    });
    expect(mockDb.orderAttribution.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ bundleId: "bundle-1" }),
        expect.objectContaining({ bundleId: "bundle-2" }),
      ]),
    });
  });

  it("skips when attribution already exists for order", async () => {
    mockDb.orderAttribution.findFirst.mockResolvedValue({ id: "existing" });

    const payload = {
      id: 789,
      admin_graphql_api_id: "gid://shopify/Order/789",
      note_attributes: [
        { name: "_wolfpack_utm_source", value: "google" },
      ],
      line_items: [],
      total_price: "50.00",
    };

    const result = await handleOrderCreate("shop.myshopify.com", payload);

    expect(result.success).toBe(true);
    expect(result.message).toContain("already recorded");
    expect(mockDb.orderAttribution.create).not.toHaveBeenCalled();
  });

  it("handles errors gracefully", async () => {
    mockDb.orderAttribution.findFirst.mockRejectedValue(new Error("DB down"));

    const payload = {
      id: 999,
      note_attributes: [
        { name: "_wolfpack_utm_source", value: "tiktok" },
      ],
      line_items: [],
      total_price: "10.00",
    };

    const result = await handleOrderCreate("shop.myshopify.com", payload);
    expect(result.success).toBe(false);
  });
});
