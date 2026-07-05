import {
  acquireExpiringOfflineSessionFromIdToken,
  ensureShopHasExpiringOfflineSession,
  migrateOfflineSessionToExpiring,
} from "../../../app/services/offline-token.server";

const originalFetch = global.fetch;
const originalApiKey = process.env.SHOPIFY_API_KEY;
const originalApiSecret = process.env.SHOPIFY_API_SECRET;

function makePrisma(record: Record<string, unknown> | null = null) {
  return {
    session: {
      findFirst: jest.fn().mockResolvedValue(record),
      upsert: jest.fn().mockResolvedValue(record),
    },
  };
}

function makeStorage() {
  return {
    storeSession: jest.fn().mockResolvedValue(true),
  };
}

function tokenResponse() {
  return new Response(JSON.stringify({
    access_token: "shpat_expiring",
    expires_in: 3600,
    refresh_token: "shprt_refresh",
    refresh_token_expires_in: 7776000,
    scope: "read_products,write_products",
  }), { status: 200 });
}

function postedBody() {
  const body = (global.fetch as jest.Mock).mock.calls[0][1].body as URLSearchParams;
  return Object.fromEntries(body.entries());
}

describe("offline token service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SHOPIFY_API_KEY = "client-id";
    process.env.SHOPIFY_API_SECRET = "client-secret";
    global.fetch = jest.fn().mockResolvedValue(tokenResponse()) as jest.Mock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  afterAll(() => {
    process.env.SHOPIFY_API_KEY = originalApiKey;
    process.env.SHOPIFY_API_SECRET = originalApiSecret;
  });

  it("acquires a new expiring offline token from an ID token", async () => {
    const prisma = makePrisma();
    const storage = makeStorage();

    const result = await acquireExpiringOfflineSessionFromIdToken(
      prisma as any,
      "test-shop.myshopify.com",
      "browser-session-id-token",
      storage,
    );

    expect(result.accessToken).toBe("shpat_expiring");
    expect(postedBody()).toMatchObject({
      client_id: "client-id",
      client_secret: "client-secret",
      grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
      subject_token: "browser-session-id-token",
      subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
      requested_token_type: "urn:shopify:params:oauth:token-type:offline-access-token",
      expiring: "1",
    });
    expect(prisma.session.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "offline_test-shop.myshopify.com" },
      create: expect.objectContaining({
        id: "offline_test-shop.myshopify.com",
        shop: "test-shop.myshopify.com",
        isOnline: false,
        accessToken: "shpat_expiring",
        refreshToken: "shprt_refresh",
      }),
    }));
    expect(storage.storeSession).toHaveBeenCalledWith(expect.objectContaining({
      id: "offline_test-shop.myshopify.com",
      shop: "test-shop.myshopify.com",
      isOnline: false,
      accessToken: "shpat_expiring",
    }));
  });

  it("migrates an existing non-expiring offline token with expiring token exchange", async () => {
    const prisma = makePrisma();
    const storage = makeStorage();

    await migrateOfflineSessionToExpiring(prisma as any, {
      id: "offline_test-shop.myshopify.com",
      shop: "test-shop.myshopify.com",
      state: "",
      isOnline: false,
      scope: "read_products",
      expires: null,
      accessToken: "shpat_legacy",
      refreshToken: null,
      refreshTokenExpiresAt: null,
      storefrontAccessToken: null,
    }, storage);

    expect(postedBody()).toMatchObject({
      subject_token: "shpat_legacy",
      subject_token_type: "urn:shopify:params:oauth:token-type:offline-access-token",
      requested_token_type: "urn:shopify:params:oauth:token-type:offline-access-token",
      expiring: "1",
    });
  });

  it("ensures a shop acquires an expiring offline token when no offline row exists and an ID token is available", async () => {
    const prisma = makePrisma(null);
    const storage = makeStorage();

    const result = await ensureShopHasExpiringOfflineSession(
      prisma as any,
      "test-shop.myshopify.com",
      storage,
      { idToken: "browser-session-id-token" },
    );

    expect(result?.accessToken).toBe("shpat_expiring");
    expect(postedBody()).toMatchObject({
      subject_token: "browser-session-id-token",
      subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
      expiring: "1",
    });
  });

  it("does not fabricate an offline session when no row or ID token is available", async () => {
    const prisma = makePrisma(null);
    const storage = makeStorage();

    const result = await ensureShopHasExpiringOfflineSession(
      prisma as any,
      "test-shop.myshopify.com",
      storage,
    );

    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(storage.storeSession).not.toHaveBeenCalled();
  });

  it("refreshes an offline session with incomplete expiring token metadata during ensure", async () => {
    const prisma = makePrisma({
      id: "offline_test-shop.myshopify.com",
      shop: "test-shop.myshopify.com",
      state: "",
      isOnline: false,
      scope: "read_products",
      expires: null,
      accessToken: "shpat_partial",
      refreshToken: "shprt_existing",
      refreshTokenExpiresAt: null,
      storefrontAccessToken: null,
    });
    const storage = makeStorage();

    const result = await ensureShopHasExpiringOfflineSession(
      prisma as any,
      "test-shop.myshopify.com",
      storage,
    );

    expect(result?.accessToken).toBe("shpat_expiring");
    expect(postedBody()).toMatchObject({
      grant_type: "refresh_token",
      refresh_token: "shprt_existing",
    });
    expect(storage.storeSession).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: "shpat_expiring",
      refreshToken: "shprt_refresh",
    }));
  });
});
