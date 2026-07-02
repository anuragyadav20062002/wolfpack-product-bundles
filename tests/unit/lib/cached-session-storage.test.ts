import { Session } from "@shopify/shopify-api";
import { CachedSessionStorage } from "../../../app/lib/cached-session-storage.server";

jest.mock("../../../app/services/offline-token.server", () => {
  const actual = jest.requireActual("../../../app/services/offline-token.server");
  return {
    ...actual,
    refreshOfflineSession: jest.fn(),
  };
});

const offlineTokenModule = jest.requireMock("../../../app/services/offline-token.server") as {
  refreshOfflineSession: jest.Mock;
};

function buildSession(id = "offline_test.myshopify.com") {
  return new Session({
    id,
    shop: "test.myshopify.com",
    state: "state",
    isOnline: false,
    accessToken: "shpat_test",
    scope: "read_products",
  });
}

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "offline_test.myshopify.com",
    shop: "test.myshopify.com",
    state: "state",
    isOnline: false,
    scope: "read_products",
    expires: null,
    accessToken: "shpat_test",
    refreshToken: null,
    refreshTokenExpiresAt: null,
    storefrontAccessToken: null,
    userId: null,
    firstName: null,
    lastName: null,
    email: null,
    accountOwner: false,
    locale: null,
    collaborator: false,
    emailVerified: false,
    ...overrides,
  };
}

function makePrisma(row: ReturnType<typeof makeRow> | null = makeRow()) {
  return {
    session: {
      findUnique: jest.fn().mockResolvedValue(row),
      upsert: jest.fn().mockResolvedValue(row),
      delete: jest.fn().mockResolvedValue(undefined),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(1),
    },
  };
}

describe("CachedSessionStorage.loadSession", () => {
  it("returns undefined and does not cache when the row is missing", async () => {
    const prisma = makePrisma(null);
    const storage = new CachedSessionStorage(prisma as any, 60_000);

    const result = await storage.loadSession("missing-id");

    expect(result).toBeUndefined();
    await storage.loadSession("missing-id");
    expect(prisma.session.findUnique).toHaveBeenCalledTimes(2);
  });

  it("fetches from Prisma once and returns cached result on the second call", async () => {
    const prisma = makePrisma();
    const storage = new CachedSessionStorage(prisma as any, 60_000);

    const first = await storage.loadSession("offline_test.myshopify.com");
    const second = await storage.loadSession("offline_test.myshopify.com");

    expect(first?.accessToken).toBe("shpat_test");
    expect(second?.accessToken).toBe("shpat_test");
    expect(prisma.session.findUnique).toHaveBeenCalledTimes(1);
  });

  it("retries once when Prisma reports a stale closed connection", async () => {
    const prisma = makePrisma();
    prisma.session.findUnique
      .mockRejectedValueOnce(new Error("Invalid `prisma.session.findUnique()` invocation:\n\nServer has closed the connection."))
      .mockResolvedValueOnce(makeRow());
    const storage = new CachedSessionStorage(prisma as any, 60_000);

    const result = await storage.loadSession("offline_test.myshopify.com");

    expect(result?.accessToken).toBe("shpat_test");
    expect(prisma.session.findUnique).toHaveBeenCalledTimes(2);
  });

  it("refreshes an expiring offline session before returning it", async () => {
    const expiresSoon = new Date(Date.now() + 1_000);
    const refreshExpiresAt = new Date(Date.now() + 60_000);
    const prisma = makePrisma(
      makeRow({
        expires: expiresSoon,
        refreshToken: "refresh-token",
        refreshTokenExpiresAt: refreshExpiresAt,
      }),
    );
    const storage = new CachedSessionStorage(prisma as any, 60_000);
    const refreshedRow = makeRow({
      accessToken: "shpat_refreshed",
      expires: new Date(Date.now() + 60 * 60 * 1000),
      refreshToken: "refresh-token-2",
      refreshTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    offlineTokenModule.refreshOfflineSession.mockResolvedValue(refreshedRow);

    const result = await storage.loadSession("offline_test.myshopify.com");

    expect(offlineTokenModule.refreshOfflineSession).toHaveBeenCalledTimes(1);
    expect(result?.accessToken).toBe("shpat_refreshed");
  });
});

describe("CachedSessionStorage.storeSession", () => {
  it("upserts the session row and populates the cache", async () => {
    const prisma = makePrisma();
    const storage = new CachedSessionStorage(prisma as any, 60_000);
    const session = buildSession();

    const result = await storage.storeSession(session);
    const cached = await storage.loadSession(session.id);

    expect(result).toBe(true);
    expect(prisma.session.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.session.findUnique).not.toHaveBeenCalled();
    expect(cached?.accessToken).toBe("shpat_test");
  });
});

describe("CachedSessionStorage deletes", () => {
  it("evicts a cached session on deleteSession", async () => {
    const prisma = makePrisma();
    const storage = new CachedSessionStorage(prisma as any, 60_000);

    await storage.loadSession("offline_test.myshopify.com");
    await storage.deleteSession("offline_test.myshopify.com");
    await storage.loadSession("offline_test.myshopify.com");

    expect(prisma.session.delete).toHaveBeenCalledWith({
      where: { id: "offline_test.myshopify.com" },
    });
    expect(prisma.session.findUnique).toHaveBeenCalledTimes(2);
  });

  it("evicts all requested ids on deleteSessions", async () => {
    const prisma = makePrisma();
    const storage = new CachedSessionStorage(prisma as any, 60_000);

    await storage.loadSession("offline_test.myshopify.com");
    await storage.deleteSessions(["offline_test.myshopify.com"]);
    await storage.loadSession("offline_test.myshopify.com");

    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["offline_test.myshopify.com"] } },
    });
    expect(prisma.session.findUnique).toHaveBeenCalledTimes(2);
  });
});

describe("CachedSessionStorage passthrough methods", () => {
  it("loads sessions by shop from Prisma", async () => {
    const prisma = makePrisma();
    prisma.session.findMany.mockResolvedValue([makeRow()]);
    const storage = new CachedSessionStorage(prisma as any, 60_000);

    const result = await storage.findSessionsByShop("test.myshopify.com");

    expect(result).toHaveLength(1);
    expect(prisma.session.findMany).toHaveBeenCalledWith({
      where: { shop: "test.myshopify.com" },
      take: 25,
      orderBy: [{ expires: "desc" }],
    });
  });

  it("checks readiness via Prisma", async () => {
    const prisma = makePrisma();
    const storage = new CachedSessionStorage(prisma as any, 60_000);

    await expect(storage.isReady()).resolves.toBe(true);
    expect(prisma.session.count).toHaveBeenCalledTimes(1);
  });
});

describe("CachedSessionStorage refresh resilience", () => {
  function makeExpiringRow() {
    return makeRow({
      expires: new Date(Date.now() + 1_000),
      refreshToken: "refresh-token",
      refreshTokenExpiresAt: new Date(Date.now() + 60_000),
    });
  }

  it("drops the row and returns undefined when refresh fails with HTTP 401", async () => {
    const prisma = makePrisma(makeExpiringRow());
    const storage = new CachedSessionStorage(prisma as any, 60_000);
    offlineTokenModule.refreshOfflineSession.mockRejectedValueOnce(
      new Error(
        "Offline token request failed: 401 This request requires an active refresh_token",
      ),
    );

    const result = await storage.loadSession("offline_test.myshopify.com");

    expect(result).toBeUndefined();
    expect(prisma.session.delete).toHaveBeenCalledWith({
      where: { id: "offline_test.myshopify.com" },
    });
  });

  it("drops the row when refresh fails with invalid_grant", async () => {
    const prisma = makePrisma(makeExpiringRow());
    const storage = new CachedSessionStorage(prisma as any, 60_000);
    offlineTokenModule.refreshOfflineSession.mockRejectedValueOnce(
      new Error("Offline token request failed: 400 invalid_grant"),
    );

    const result = await storage.loadSession("offline_test.myshopify.com");

    expect(result).toBeUndefined();
    expect(prisma.session.delete).toHaveBeenCalledTimes(1);
  });

  it("returns the stale row on a transient refresh failure (no delete)", async () => {
    const prisma = makePrisma(makeExpiringRow());
    const storage = new CachedSessionStorage(prisma as any, 60_000);
    offlineTokenModule.refreshOfflineSession.mockRejectedValueOnce(
      new Error("fetch failed"),
    );

    const result = await storage.loadSession("offline_test.myshopify.com");

    expect(result?.accessToken).toBe("shpat_test");
    expect(prisma.session.delete).not.toHaveBeenCalled();
  });

  it("filters out a bad row in findSessionsByShop while keeping the healthy one", async () => {
    const badRow = {
      ...makeExpiringRow(),
      id: "offline_bad.myshopify.com",
    };
    const goodRow = makeRow({
      id: "offline_good.myshopify.com",
      accessToken: "shpat_good",
    });
    const prisma = makePrisma();
    prisma.session.findMany.mockResolvedValue([badRow, goodRow]);
    offlineTokenModule.refreshOfflineSession.mockRejectedValueOnce(
      new Error(
        "Offline token request failed: 401 This request requires an active refresh_token",
      ),
    );
    const storage = new CachedSessionStorage(prisma as any, 60_000);

    const result = await storage.findSessionsByShop("test.myshopify.com");

    expect(result).toHaveLength(1);
    expect(result[0].accessToken).toBe("shpat_good");
    expect(prisma.session.delete).toHaveBeenCalledWith({
      where: { id: "offline_bad.myshopify.com" },
    });
  });
});
