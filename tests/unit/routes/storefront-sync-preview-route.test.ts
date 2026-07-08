import { action, loader } from "../../../app/routes/app/app.bundles.$bundleType.configure.$bundleId.prepare-preview";
import { requireAdminSession } from "../../../app/lib/auth-guards.server";
import { handlePrepareStorefrontPreview } from "../../../app/routes/app/shared/storefront-sync-action.server";

jest.mock("../../../app/lib/auth-guards.server", () => ({
  requireAdminSession: jest.fn(),
}));

jest.mock("../../../app/routes/app/shared/storefront-sync-action.server", () => ({
  handlePrepareStorefrontPreview: jest.fn(),
}));

const mockRequireAdminSession = requireAdminSession as jest.MockedFunction<
  typeof requireAdminSession
>;
const mockHandlePrepareStorefrontPreview =
  handlePrepareStorefrontPreview as jest.MockedFunction<
    typeof handlePrepareStorefrontPreview
  >;

describe("/app/bundles/:bundleType/configure/:bundleId/prepare-preview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminSession.mockResolvedValue({
      admin: { graphql: jest.fn() } as any,
      session: { shop: "test-shop.myshopify.com" } as any,
    });
    mockHandlePrepareStorefrontPreview.mockResolvedValue(
      new Response(JSON.stringify({ success: true, ready: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("prepares a full-page bundle preview through a compact JSON resource route", async () => {
    const response = await action({
      request: new Request(
        "https://app.example.com/app/bundles/full-page-bundle/configure/bundle-1/prepare-preview",
        { method: "POST" },
      ),
      params: { bundleType: "full-page-bundle", bundleId: "bundle-1" },
      context: {},
    });
    const body = await response.json();

    expect(body).toEqual({ success: true, ready: true });
    expect(mockHandlePrepareStorefrontPreview).toHaveBeenCalledWith(
      { graphql: expect.any(Function) },
      { shop: "test-shop.myshopify.com" },
      "bundle-1",
      "full_page",
    );
  });

  it("prepares a product-page bundle preview", async () => {
    await action({
      request: new Request(
        "https://app.example.com/app/bundles/product-page-bundle/configure/bundle-2/prepare-preview",
        { method: "POST" },
      ),
      params: { bundleType: "product-page-bundle", bundleId: "bundle-2" },
      context: {},
    });

    expect(mockHandlePrepareStorefrontPreview).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      "bundle-2",
      "product_page",
    );
  });

  it("rejects invalid bundle route params before auth work", async () => {
    const response = await action({
      request: new Request("https://app.example.com/app/bad", { method: "POST" }),
      params: { bundleType: "unknown", bundleId: "bundle-1" },
      context: {},
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      statusCode: 400,
      error: "Invalid bundle preview route",
    });
    expect(mockRequireAdminSession).not.toHaveBeenCalled();
  });

  it("does not allow GET requests", async () => {
    const response = await loader({
      request: new Request(
        "https://app.example.com/app/bundles/full-page-bundle/configure/bundle-1/prepare-preview",
      ),
      params: { bundleType: "full-page-bundle", bundleId: "bundle-1" },
      context: {},
    });
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body).toEqual({ success: false, error: "Method not allowed" });
  });
});
