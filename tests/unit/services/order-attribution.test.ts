/**
 * Tests for orders/create webhook handler (Phase 3 - UTM Attribution)
 *
 * The handler is a no-op stub — attribution is handled by the Web Pixel
 * POST to /api/attribution. These tests verify the handler responds
 * correctly without attempting database operations.
 */

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {},
}));

jest.mock("../../../app/shopify.server", () => ({
  __esModule: true,
  default: {},
}));

import { handleOrderCreate } from "../../../app/services/webhooks/handlers/orders.server";

describe("handleOrderCreate", () => {
  it("skips when no payload", async () => {
    const result = await handleOrderCreate("shop.myshopify.com", null);
    expect(result.success).toBe(true);
    expect(result.message).toContain("No payload");
  });

  it("returns success for any order payload", async () => {
    const result = await handleOrderCreate("shop.myshopify.com", {
      id: 123,
      admin_graphql_api_id: "gid://shopify/Order/123",
      name: "#1001",
      total_price: "48.75",
      line_items: [],
    });
    expect(result.success).toBe(true);
    expect(result.message).toContain("web pixel");
  });
});
