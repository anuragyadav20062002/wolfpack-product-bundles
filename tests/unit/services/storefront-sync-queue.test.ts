import {
  enqueueBundleStorefrontSync,
  formatBundleStorefrontSync,
} from "../../../app/services/bundles/storefront-sync.server";
import { inngest } from "../../../app/inngest/client";

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    bundle: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../../../app/inngest/client", () => ({
  inngest: {
    send: jest.fn(),
  },
}));

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const getDb = () => require("../../../app/db.server").default;
const mockSend = inngest.send as jest.MockedFunction<typeof inngest.send>;

describe("storefront sync queue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(1720440000000);
    getDb().bundle.update.mockImplementation(async ({ data }: any) => ({
      id: "bundle-1",
      storefrontSyncStatus: data.storefrontSyncStatus,
      storefrontSyncAttemptId: data.storefrontSyncAttemptId,
      storefrontSyncLastError: data.storefrontSyncLastError ?? null,
      storefrontSyncQueuedAt: data.storefrontSyncQueuedAt ?? null,
      storefrontSyncStartedAt: data.storefrontSyncStartedAt ?? null,
      storefrontSyncedAt: data.storefrontSyncedAt ?? null,
      storefrontSyncFailedAt: data.storefrontSyncFailedAt ?? null,
      storefrontSyncStats: data.storefrontSyncStats ?? null,
    }));
    mockSend.mockResolvedValue({ ids: ["evt-1"] } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("marks the bundle queued and sends the lightweight storefront-sync event", async () => {
    const result = await enqueueBundleStorefrontSync({
      shopDomain: "test.myshopify.com",
      bundleId: "bundle-1",
      bundleType: "full_page",
      reason: "save",
    });

    expect(getDb().bundle.update).toHaveBeenCalledWith({
      where: { id: "bundle-1", shopId: "test.myshopify.com" },
      data: expect.objectContaining({
        storefrontSyncStatus: "queued",
        storefrontSyncLastError: null,
        storefrontSyncStats: null,
        storefrontSyncAttemptId: "bundle-1:1720440000000",
      }),
    });
    expect(mockSend).toHaveBeenCalledWith({
      name: "bundle/storefront-sync.requested",
      data: {
        shopDomain: "test.myshopify.com",
        bundleId: "bundle-1",
        bundleType: "full_page",
        reason: "save",
        attemptId: "bundle-1:1720440000000",
      },
    });
    expect(result).toMatchObject({
      status: "queued",
      attemptId: "bundle-1:1720440000000",
    });
  });

  it("keeps save callers successful but records failed status when enqueue throws", async () => {
    mockSend.mockRejectedValue(new Error("missing event key"));

    const result = await enqueueBundleStorefrontSync({
      shopDomain: "test.myshopify.com",
      bundleId: "bundle-1",
      bundleType: "product_page",
      reason: "retry",
    });

    expect(getDb().bundle.update).toHaveBeenLastCalledWith({
      where: { id: "bundle-1", shopId: "test.myshopify.com" },
      data: expect.objectContaining({
        storefrontSyncStatus: "failed",
        storefrontSyncLastError: "missing event key",
        storefrontSyncAttemptId: "bundle-1:1720440000000",
      }),
    });
    expect(result).toMatchObject({
      status: "failed",
      attemptId: "bundle-1:1720440000000",
      error: "missing event key",
    });
  });

  it("formats nullable bundle state for Admin loaders", () => {
    expect(formatBundleStorefrontSync({})).toEqual({
      status: "synced",
      attemptId: null,
      error: null,
      queuedAt: null,
      startedAt: null,
      syncedAt: null,
      failedAt: null,
      stats: null,
    });
  });
});
