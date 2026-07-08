import {
  handlePrepareStorefrontPreview,
  handleSyncStorefrontNow,
} from "../../../app/routes/app/shared/storefront-sync-action.server";
import { syncBundleStorefrontNow } from "../../../app/services/bundles/storefront-sync.server";

jest.mock("../../../app/services/bundles/storefront-sync.server", () => ({
  syncBundleStorefrontNow: jest.fn().mockResolvedValue({
    skipped: false,
    synced: true,
    stats: { bundleType: "full_page" },
  }),
}));

const mockSyncBundleStorefrontNow =
  syncBundleStorefrontNow as jest.MockedFunction<typeof syncBundleStorefrontNow>;

const admin = { graphql: jest.fn() } as any;
const session = { shop: "test.myshopify.com" } as any;

describe("storefront sync action handlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSyncBundleStorefrontNow.mockResolvedValue({
      skipped: false,
      synced: true,
      stats: { bundleType: "full_page" },
    } as any);
  });

  it("syncs immediately and returns a compact EB-style response", async () => {
    const response = await handleSyncStorefrontNow(
      admin,
      session,
      "bundle-1",
      "full_page",
      "sync_bundle",
    );
    const body = await response.json();

    expect(mockSyncBundleStorefrontNow).toHaveBeenCalledWith({
      admin,
      shopDomain: "test.myshopify.com",
      bundleId: "bundle-1",
      bundleType: "full_page",
      reason: "sync_bundle",
    });
    expect(body).toEqual({
      success: true,
      statusCode: 200,
      synced: true,
      message: "Updated Successfully!",
    });
    expect(body).not.toHaveProperty("storefrontSync");
    expect(body).not.toHaveProperty("attemptId");
    expect(body).not.toHaveProperty("stats");
  });

  it("prepares preview with one direct sync and no status payload", async () => {
    const response = await handlePrepareStorefrontPreview(
      admin,
      session,
      "bundle-1",
      "product_page",
    );
    const body = await response.json();

    expect(mockSyncBundleStorefrontNow).toHaveBeenCalledWith({
      admin,
      shopDomain: "test.myshopify.com",
      bundleId: "bundle-1",
      bundleType: "product_page",
      reason: "preview",
    });
    expect(body).toEqual({
      success: true,
      statusCode: 200,
      ready: true,
      message: "success",
    });
    expect(body).not.toHaveProperty("storefrontSync");
    expect(body).not.toHaveProperty("queued");
    expect(body).not.toHaveProperty("stats");
  });

  it("returns a compact error when direct sync fails", async () => {
    mockSyncBundleStorefrontNow.mockRejectedValueOnce(new Error("publish failed"));

    const response = await handlePrepareStorefrontPreview(
      admin,
      session,
      "bundle-1",
      "full_page",
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      statusCode: 500,
      error: "publish failed",
    });
    expect(body).not.toHaveProperty("storefrontSync");
    expect(body).not.toHaveProperty("attemptId");
  });
});
