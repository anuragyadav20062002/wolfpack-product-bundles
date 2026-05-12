import { action } from "../../../app/routes/app/app.bundles.create/route";
import { authenticate } from "../../../app/shopify.server";
import { handleCreateBundle } from "../../../app/routes/app/app.dashboard/handlers/handlers.server";

jest.mock("../../../app/shopify.server", () => ({
  authenticate: {
    admin: jest.fn(),
  },
}));

jest.mock(
  "../../../app/routes/app/app.dashboard/handlers/handlers.server",
  () => ({
    handleCreateBundle: jest.fn(),
  })
);

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    startTimer: jest.fn(() => jest.fn()),
  },
}));

const mockAuthenticate = authenticate as jest.Mocked<typeof authenticate>;
const mockHandleCreateBundle = handleCreateBundle as jest.MockedFunction<typeof handleCreateBundle>;

function makeRequest(fields: Record<string, string> = {}) {
  const formData = new FormData();
  formData.append("_action", "createBundle");
  for (const [k, v] of Object.entries(fields)) {
    formData.append(k, v);
  }
  return new Request("https://test.myshopify.com/app/bundles/create", {
    method: "POST",
    body: formData,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  (mockAuthenticate.admin as jest.MockedFunction<any>).mockResolvedValue({
    admin: {},
    session: { shop: "test-shop.myshopify.com" },
  });
});

describe("app.bundles.create action", () => {
  it("redirects to configure page on successful bundle creation", async () => {
    mockHandleCreateBundle.mockResolvedValue({
      json: () => ({
        success: true,
        bundleId: "bundle-abc",
        bundleProductId: "gid://shopify/Product/1",
        redirectTo: "/app/bundles/create/configure/bundle-abc",
        widgetStatus: { checked: false },
      }),
      status: 200,
    } as any);

    const request = makeRequest({
      bundleName: "My Test Bundle",
      bundleType: "product_page",
    });

    const response = await action({ request, params: {}, context: {} } as any);

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "/app/bundles/create/configure/bundle-abc"
    );
  });

  it("returns error json when handleCreateBundle returns an error response", async () => {
    const errorResponse = new Response(
      JSON.stringify({ error: "Bundle name is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
    mockHandleCreateBundle.mockResolvedValue(errorResponse as any);

    const request = makeRequest({ bundleName: "", bundleType: "product_page" });
    const response = await action({ request, params: {}, context: {} } as any);

    expect(response.status).toBe(400);
    const body = await (response as Response).json();
    expect(body.error).toBe("Bundle name is required");
  });

  it("returns error json when subscription limit exceeded", async () => {
    const limitResponse = new Response(
      JSON.stringify({ error: "Bundle limit reached. Upgrade to create more bundles." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
    mockHandleCreateBundle.mockResolvedValue(limitResponse as any);

    const request = makeRequest({
      bundleName: "Another Bundle",
      bundleType: "product_page",
    });
    const response = await action({ request, params: {}, context: {} } as any);

    expect(response.status).toBe(403);
    const body = await (response as Response).json();
    expect(body.error).toContain("limit");
  });

  it("passes formData through to handleCreateBundle", async () => {
    const successResponse = new Response(
      JSON.stringify({
        success: true,
        bundleId: "bundle-xyz",
        bundleProductId: "gid://shopify/Product/2",
        redirectTo: "/app/bundles/create/configure/bundle-xyz",
        widgetStatus: { checked: false },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    mockHandleCreateBundle.mockResolvedValue(successResponse as any);

    const request = makeRequest({
      bundleName: "Full Page Test",
      bundleType: "full_page",
      fullPageLayout: "footer_side",
      description: "A description",
    });

    await action({ request, params: {}, context: {} } as any);

    expect(mockHandleCreateBundle).toHaveBeenCalledTimes(1);
    const [, , calledFormData] = mockHandleCreateBundle.mock.calls[0];
    expect(calledFormData.get("bundleName")).toBe("Full Page Test");
    expect(calledFormData.get("bundleType")).toBe("full_page");
    expect(calledFormData.get("fullPageLayout")).toBe("footer_side");
  });
});
