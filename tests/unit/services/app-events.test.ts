jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    businessEvent: {
      create: jest.fn(),
      update: jest.fn(),
    },
    shop: {
      findUnique: jest.fn(),
      update: jest.fn(),
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

const getDb = () => require("../../../app/db.server").default;

describe("app-events service", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      SHOPIFY_API_KEY: "client-id",
      SHOPIFY_API_SECRET: "client-secret",
      SHOPIFY_APP_EVENTS_API_VERSION: "unstable",
    };
    delete process.env.SHOPIFY_APP_EVENTS_ENABLED;
    getDb().businessEvent.create.mockResolvedValue({
      id: "event-row-1",
      eventHandle: "bundle_saved",
      shopDomain: "shop.myshopify.com",
      shopifyShopGid: "gid://shopify/Shop/1",
      idempotencyKey: "key-1",
      occurredAt: new Date("2026-06-21T00:00:00.000Z"),
      attributes: {},
    });
    getDb().businessEvent.update.mockResolvedValue({});
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it("sanitizes attributes before persistence and Shopify delivery", async () => {
    process.env.SHOPIFY_APP_EVENTS_ENABLED = "true";
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "token", expires_in: 300 }), { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 202 }));

    const { recordBusinessEvent } = await import("../../../app/services/app-events.server");
    const longValue = "x".repeat(160);
    await recordBusinessEvent({
      eventHandle: "bundle_saved",
      shopDomain: "shop.myshopify.com",
      shopifyShopGid: "gid://shopify/Shop/1",
      attributes: {
        safe_one: "ok",
        email: "merchant@example.com",
        stack: "Error\n at secret",
        nested: { bad: true },
        list: ["bad"],
        long_value: longValue,
        a: 1,
        b: true,
        c: null,
        d: "d",
        e: "e",
        f: "f",
        g: "g",
        h: "h",
        i: "i",
        j: "j",
        k: "k",
        l: "l",
      },
    });

    const createArgs = getDb().businessEvent.create.mock.calls[0][0].data;
    expect(Object.keys(createArgs.attributes)).toHaveLength(15);
    expect(createArgs.attributes.email).toBeUndefined();
    expect(createArgs.attributes.stack).toBeUndefined();
    expect(createArgs.attributes.nested).toBeUndefined();
    expect(createArgs.attributes.list).toBeUndefined();
    expect(createArgs.attributes.long_value).toHaveLength(128);

    const eventPost = (global.fetch as jest.Mock).mock.calls[1];
    const payload = JSON.parse(eventPost[1].body);
    expect(payload.attributes).toEqual(createArgs.attributes);
  });

  it("persists internally and skips network delivery when Shopify sink is disabled", async () => {
    const { recordBusinessEvent } = await import("../../../app/services/app-events.server");

    await recordBusinessEvent({
      eventHandle: "bundle_saved",
      shopDomain: "shop.myshopify.com",
      shopifyShopGid: "gid://shopify/Shop/1",
      attributes: { result: "success" },
    });

    expect(getDb().businessEvent.create).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(getDb().businessEvent.update).not.toHaveBeenCalled();
  });

  it("posts App Events payload to the configured Shopify API version", async () => {
    process.env.SHOPIFY_APP_EVENTS_ENABLED = "true";
    process.env.SHOPIFY_APP_EVENTS_API_VERSION = "2026-01";
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "token", expires_in: 300 }), { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 202 }));

    const { emitShopifyAppEvent } = await import("../../../app/services/app-events.server");
    const result = await emitShopifyAppEvent({
      eventHandle: "bundle_saved",
      shopifyShopGid: "gid://shopify/Shop/1",
      idempotencyKey: "stable-key",
      occurredAt: new Date("2026-06-21T00:00:00.000Z"),
      attributes: { schema_version: 1, result: "success" },
    });

    expect(result.status).toBe("delivered");
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe("https://api.shopify.com/auth/access_token");
    expect((global.fetch as jest.Mock).mock.calls[1][0]).toBe("https://api.shopify.com/app/2026-01/events");
    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[1][1].body)).toEqual({
      shop_id: "gid://shopify/Shop/1",
      event_handle: "bundle_saved",
      timestamp: "2026-06-21T00:00:00.000Z",
      idempotency_key: "stable-key",
      attributes: { schema_version: 1, result: "success" },
    });
  });

  it("caches bearer tokens within their lifetime", async () => {
    process.env.SHOPIFY_APP_EVENTS_ENABLED = "true";
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "token", expires_in: 300 }), { status: 200 }))
      .mockResolvedValue(new Response("", { status: 202 }));

    const { emitShopifyAppEvent } = await import("../../../app/services/app-events.server");
    await emitShopifyAppEvent({
      eventHandle: "bundle_saved",
      shopifyShopGid: "gid://shopify/Shop/1",
      idempotencyKey: "stable-key-1",
      occurredAt: new Date(),
      attributes: {},
    });
    await emitShopifyAppEvent({
      eventHandle: "bundle_saved",
      shopifyShopGid: "gid://shopify/Shop/1",
      idempotencyKey: "stable-key-2",
      occurredAt: new Date(),
      attributes: {},
    });

    expect((global.fetch as jest.Mock).mock.calls.filter(([url]) => url === "https://api.shopify.com/auth/access_token")).toHaveLength(1);
  });

  it("retries retryable Shopify responses and never throws", async () => {
    process.env.SHOPIFY_APP_EVENTS_ENABLED = "true";
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "token", expires_in: 300 }), { status: 200 }))
      .mockResolvedValueOnce(new Response("conflict", { status: 409 }))
      .mockResolvedValueOnce(new Response("", { status: 202 }));

    const { emitShopifyAppEvent } = await import("../../../app/services/app-events.server");
    const result = await emitShopifyAppEvent({
      eventHandle: "bundle_saved",
      shopifyShopGid: "gid://shopify/Shop/1",
      idempotencyKey: "stable-key",
      occurredAt: new Date(),
      attributes: {},
    });

    expect(result.status).toBe("delivered");
    expect((global.fetch as jest.Mock).mock.calls.filter(([url]) => url === "https://api.shopify.com/app/unstable/events")).toHaveLength(2);
  });

  it("returns failed delivery for permanent Shopify errors without throwing", async () => {
    process.env.SHOPIFY_APP_EVENTS_ENABLED = "true";
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "token", expires_in: 300 }), { status: 200 }))
      .mockResolvedValueOnce(new Response("bad request", { status: 400 }));

    const { emitShopifyAppEvent } = await import("../../../app/services/app-events.server");
    const result = await emitShopifyAppEvent({
      eventHandle: "bundle_saved",
      shopifyShopGid: "gid://shopify/Shop/1",
      idempotencyKey: "stable-key",
      occurredAt: new Date(),
      attributes: {},
    });

    expect(result.status).toBe("failed");
    expect(result.error).toContain("400");
  });

  it("builds deterministic idempotency keys within Shopify's 64 character limit", async () => {
    const { buildIdempotencyKey } = await import("../../../app/services/app-events.server");

    const key = buildIdempotencyKey({
      shopifyShopGid: "gid://shopify/Shop/" + "1".repeat(100),
      eventHandle: "bundle_saved_with_a_very_long_handle_for_testing",
      bundleId: "bundle-" + "2".repeat(100),
      correlationId: "correlation-" + "3".repeat(100),
      occurredAt: new Date("2026-06-21T00:00:00.000Z"),
    });

    expect(key.length).toBeLessThanOrEqual(64);
    expect(key).toBe(buildIdempotencyKey({
      shopifyShopGid: "gid://shopify/Shop/" + "1".repeat(100),
      eventHandle: "bundle_saved_with_a_very_long_handle_for_testing",
      bundleId: "bundle-" + "2".repeat(100),
      correlationId: "correlation-" + "3".repeat(100),
      occurredAt: new Date("2026-06-21T00:00:00.000Z"),
    }));
  });

  it("queries and caches Shopify shop identity when missing locally", async () => {
    getDb().shop.findUnique.mockResolvedValueOnce({ shopifyShopGid: null });
    getDb().shop.update.mockResolvedValue({ shopifyShopGid: "gid://shopify/Shop/9" });
    const admin = {
      graphql: jest.fn().mockResolvedValue(new Response(JSON.stringify({
        data: { shop: { id: "gid://shopify/Shop/9" } },
      }), { status: 200 })),
    };

    const { ensureShopIdentity } = await import("../../../app/services/app-events.server");
    const shopGid = await ensureShopIdentity(admin as any, "shop.myshopify.com");

    expect(shopGid).toBe("gid://shopify/Shop/9");
    expect(admin.graphql).toHaveBeenCalledWith("query WpbAppEventsShopIdentity { shop { id } }");
    expect(getDb().shop.update).toHaveBeenCalledWith({
      where: { shopDomain: "shop.myshopify.com" },
      data: { shopifyShopGid: "gid://shopify/Shop/9" },
    });
  });
});
