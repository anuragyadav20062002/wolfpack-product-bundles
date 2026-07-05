import { createHmac } from "node:crypto";
import { action } from "../../../app/routes/api/api.checkout-integration-discount-code";
import { CheckoutIntegrationDiscountCodeService } from "../../../app/services/checkout-integration-discount-code-service.server";
import { unauthenticated } from "../../../app/shopify.server";

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../../app/services/checkout-integration-discount-code-service.server", () => ({
  CheckoutIntegrationDiscountCodeService: {
    createForProvider: jest.fn(),
  },
}));

jest.mock("../../../app/lib/checkout-integrations", () => ({
  isSupportedCheckoutIntegrationProvider: (value: unknown) => (
    value === "gokwik"
    || value === "shopflo"
    || value === "zecpay"
    || value === "shiprocket_fastrr"
  ),
}));

jest.mock("../../../app/shopify.server", () => ({
  unauthenticated: {
    admin: jest.fn(),
  },
}));

function makeSignedRequest(body: Record<string, unknown>, shop = "test-shop.myshopify.com") {
  const params = new URLSearchParams({
    shop,
    path_prefix: "/apps/product-bundles",
    timestamp: "1770000000",
  });

  const message = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join("");

  params.set(
    "signature",
    createHmac("sha256", "test_api_secret").update(message).digest("hex"),
  );

  return new Request(
    `https://${shop}/apps/product-bundles/api/checkout-integration-discount-code?${params.toString()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

describe("checkout integration discount code route", () => {
  const originalSecret = process.env.SHOPIFY_API_SECRET;
  const mockUnauthenticatedAdmin = unauthenticated.admin as jest.Mock;
  const mockCreateForProvider = CheckoutIntegrationDiscountCodeService.createForProvider as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SHOPIFY_API_SECRET = "test_api_secret";
    mockUnauthenticatedAdmin.mockResolvedValue({ admin: { graphql: jest.fn() } });
    mockCreateForProvider.mockResolvedValue({
      success: true,
      providerId: "gokwik",
      discountId: "gid://shopify/DiscountCodeNode/1",
      code: "WPB-GOKWIK-12345678",
      expiresAt: "2026-07-02T10:30:00.000Z",
    });
  });

  afterAll(() => {
    process.env.SHOPIFY_API_SECRET = originalSecret;
  });

  it("creates a discount code for a signed storefront request", async () => {
    const response = await action({
      request: makeSignedRequest({ providerId: "gokwik" }),
      params: {},
      context: {},
    } as any) as Response;

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      providerId: "gokwik",
      code: "WPB-GOKWIK-12345678",
      expiresAt: "2026-07-02T10:30:00.000Z",
    });
    expect(mockUnauthenticatedAdmin).toHaveBeenCalledWith("test-shop.myshopify.com");
    expect(mockCreateForProvider).toHaveBeenCalledWith(
      { graphql: expect.any(Function) },
      "test-shop.myshopify.com",
      "gokwik",
    );
  });

  it("rejects unsupported providers before calling Admin", async () => {
    const response = await action({
      request: makeSignedRequest({ providerId: "unknown" }),
      params: {},
      context: {},
    } as any) as Response;

    expect(response.status).toBe(400);
    expect(mockUnauthenticatedAdmin).not.toHaveBeenCalled();
    expect(mockCreateForProvider).not.toHaveBeenCalled();
  });

  it("rejects unsigned storefront requests", async () => {
    const request = makeSignedRequest({ providerId: "gokwik" });
    const url = new URL(request.url);
    url.searchParams.set("signature", "bad-signature");

    const response = await action({
      request: new Request(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: "gokwik" }),
      }),
      params: {},
      context: {},
    } as any) as Response;

    expect(response.status).toBe(400);
    expect(mockUnauthenticatedAdmin).not.toHaveBeenCalled();
  });

  it("accepts article-listed checkout handoff providers that require discount codes", async () => {
    const response = await action({
      request: makeSignedRequest({ providerId: "shiprocket_fastrr" }),
      params: {},
      context: {},
    } as any) as Response;

    expect(response.status).toBe(200);
    expect(mockCreateForProvider).toHaveBeenCalledWith(
      { graphql: expect.any(Function) },
      "test-shop.myshopify.com",
      "shiprocket_fastrr",
    );
  });
});
