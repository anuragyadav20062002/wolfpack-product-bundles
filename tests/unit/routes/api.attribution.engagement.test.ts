import { createHmac } from "node:crypto";
import { action, loader } from "../../../app/routes/api/api.attribution.engagement";

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    bundleEngagement: {
      createMany: jest.fn(),
    },
  },
}));

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("../../../app/services/app-events.server", () => ({
  recordBusinessEvent: jest.fn(),
}));

const getDb = () => require("../../../app/db.server").default;
const mockCreateMany = () => getDb().bundleEngagement.createMany as jest.MockedFunction<any>;
const mockRecordBusinessEvent = () =>
  require("../../../app/services/app-events.server").recordBusinessEvent as jest.MockedFunction<any>;

function makeSignedRequest(
  body: Record<string, unknown>,
  shop = "test-shop.myshopify.com",
  options: { badSignature?: boolean; method?: string; origin?: string } = {},
) {
  const params = new URLSearchParams({
    shop,
    path_prefix: "/apps/product-bundles",
    timestamp: "1770000000",
  });

  const message = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join("");

  const signature = options.badSignature
    ? "bad-signature"
    : createHmac("sha256", "test_api_secret").update(message).digest("hex");

  params.set("signature", signature);

  return new Request(
    `https://${shop}/apps/product-bundles/api/attribution/engagement?${params.toString()}`,
    {
      method: options.method ?? "POST",
      headers: {
        ...(options.origin ? { Origin: options.origin } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
}

describe("api.attribution.engagement", () => {
  const originalSecret = process.env.SHOPIFY_API_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SHOPIFY_API_SECRET = "test_api_secret";
    mockCreateMany().mockResolvedValue({ count: 1 });
  });

  afterAll(() => {
    process.env.SHOPIFY_API_SECRET = originalSecret;
  });

  it("writes a single bundle engagement for a valid signed payload", async () => {
    const response = await action({
      request: makeSignedRequest({
        shopId: "test-shop.myshopify.com",
        bundleId: "bundle-123",
        sessionId: "session-1",
        presetId: "classic",
        bundleType: "product_page",
        eventName: "wpb:session-engaged",
        landingPage: "/products/sample",
        userAgent: "test-agent",
      }),
      params: {},
      context: {},
    } as any) as Response;

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(mockCreateMany()).toHaveBeenCalledWith({
      data: [{
        shopId: "test-shop.myshopify.com",
        bundleId: "bundle-123",
        sessionId: "session-1",
        presetId: "classic",
        bundleType: "product_page",
        eventName: "wpb:session-engaged",
        landingPage: "/products/sample",
        userAgent: "test-agent",
      }],
      skipDuplicates: true,
    });
    expect(mockRecordBusinessEvent()).toHaveBeenCalledWith(expect.objectContaining({
      eventHandle: "bundle_engaged",
      shopDomain: "test-shop.myshopify.com",
      bundleId: "bundle-123",
      bundleType: "product_page",
      surface: "storefront",
      actor: "buyer",
      sendToShopify: false,
    }));
  });

  it("rejects unsigned or invalid app-proxy requests", async () => {
    const response = await action({
      request: makeSignedRequest({
        shopId: "test-shop.myshopify.com",
        bundleId: "bundle-123",
        sessionId: "session-1",
        eventName: "wpb:session-engaged",
      }, "test-shop.myshopify.com", { badSignature: true }),
      params: {},
      context: {},
    } as any) as Response;

    expect(response.status).toBe(400);
    expect(mockCreateMany()).not.toHaveBeenCalled();
  });

  it("rejects requests where payload shopId does not match signed shop", async () => {
    const response = await action({
      request: makeSignedRequest({
        shopId: "attacker.myshopify.com",
        bundleId: "bundle-123",
        sessionId: "session-1",
        eventName: "wpb:session-engaged",
      }, "test-shop.myshopify.com"),
      params: {},
      context: {},
    } as any) as Response;

    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Shop mismatch");
    expect(mockCreateMany()).not.toHaveBeenCalled();
  });

  it("rejects invalid payloads and required fields", async () => {
    const response = await action({
      request: makeSignedRequest({
        shopId: "test-shop.myshopify.com",
        sessionId: "session-1",
      }),
      params: {},
      context: {},
    } as any) as Response;

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Missing or invalid required field");
    expect(mockCreateMany()).not.toHaveBeenCalled();
    expect(mockRecordBusinessEvent()).toHaveBeenCalledWith(expect.objectContaining({
      eventHandle: "engagement_failed",
      shopDomain: "test-shop.myshopify.com",
      surface: "storefront",
      actor: "buyer",
      errorCode: "invalid_payload",
    }));
  });

  it("records engagement_failed when persistence fails", async () => {
    mockCreateMany().mockRejectedValueOnce(new Error("db down"));

    const response = await action({
      request: makeSignedRequest({
        shopId: "test-shop.myshopify.com",
        bundleId: "bundle-123",
        sessionId: "session-1",
        eventName: "wpb:session-engaged",
      }),
      params: {},
      context: {},
    } as any) as Response;

    expect(response.status).toBe(500);
    expect(mockRecordBusinessEvent()).toHaveBeenCalledWith(expect.objectContaining({
      eventHandle: "engagement_failed",
      shopDomain: "test-shop.myshopify.com",
      bundleId: "bundle-123",
      errorCode: "persist_failed",
    }));
  });

  it("returns CORS preflight response for OPTIONS requests", async () => {
    const response = await loader({
      request: makeSignedRequest({}, "test-shop.myshopify.com", {
        method: "OPTIONS",
        origin: "https://test-shop.myshopify.com",
      }),
      params: {},
      context: {},
    } as any) as Response;

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://test-shop.myshopify.com");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe("POST, OPTIONS");
    expect(response.headers.get("Vary")).toBe("Origin");
  });
});
