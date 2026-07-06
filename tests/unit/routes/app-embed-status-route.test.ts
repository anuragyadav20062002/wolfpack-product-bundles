import { action } from "../../../app/routes/app/app.app-embed-status";
import { requireAdminSession } from "../../../app/lib/auth-guards.server";
import { fetchEmbedData } from "../../../app/lib/bundle-configure-loader.server";

jest.mock("../../../app/lib/auth-guards.server", () => ({
  requireAdminSession: jest.fn(),
}));

jest.mock("../../../app/lib/bundle-configure-loader.server", () => ({
  fetchEmbedData: jest.fn(),
}));

const mockRequireAdminSession = requireAdminSession as jest.MockedFunction<
  typeof requireAdminSession
>;
const mockFetchEmbedData = fetchEmbedData as jest.MockedFunction<
  typeof fetchEmbedData
>;

describe("/app/app-embed-status action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SHOPIFY_API_KEY = "test-api-key";
  });

  it("returns the live app embed status as JSON without using configure document actions", async () => {
    const admin = { graphql: jest.fn() } as any;
    mockRequireAdminSession.mockResolvedValue({
      admin,
      session: { shop: "test-shop.myshopify.com" } as any,
    });
    mockFetchEmbedData.mockResolvedValue({
      appEmbedEnabled: true,
      themeEditorUrl: "https://test-shop.myshopify.com/admin/themes/1/editor",
    });

    const response = await action({
      request: new Request("https://app.example.com/app/app-embed-status", {
        method: "POST",
      }),
      params: {},
      context: {},
    });
    const body = await response.json();

    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({
      success: true,
      appEmbedEnabled: true,
      themeEditorUrl: "https://test-shop.myshopify.com/admin/themes/1/editor",
    });
    expect(mockFetchEmbedData).toHaveBeenCalledWith(
      admin,
      "test-shop.myshopify.com",
      "test-api-key",
      "bundle-app-embed",
    );
  });
});
