import { action } from "../../../app/routes/api/api.widget-error";

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    error: jest.fn(),
  },
}));

jest.mock("../../../app/services/app-events.server", () => ({
  recordBusinessEvent: jest.fn(),
}));

const mockRecordBusinessEvent = () =>
  require("../../../app/services/app-events.server").recordBusinessEvent as jest.MockedFunction<any>;

describe("api.widget-error App Events instrumentation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("records a redacted widget runtime error event", async () => {
    const response = await action({
      request: new Request("https://app.example.com/apps/product-bundles/api/widget-error", {
        method: "POST",
        body: JSON.stringify({
          message: "TypeError: failed at https://shop.myshopify.com/products/private?customer=1",
          bundleId: "bundle-123",
          bundleType: "full_page",
          shop: "shop.myshopify.com",
          url: "https://shop.myshopify.com/products/private?customer=1",
        }),
      }),
      params: {},
      context: {},
    } as any) as Response;

    expect(response.status).toBe(200);
    expect(mockRecordBusinessEvent()).toHaveBeenCalledWith(expect.objectContaining({
      eventHandle: "widget_runtime_error_reported",
      shopDomain: "shop.myshopify.com",
      bundleId: "bundle-123",
      bundleType: "full_page",
      surface: "storefront",
      actor: "buyer",
      errorCode: "widget_runtime_error",
      attributes: expect.objectContaining({
        category: "type_error",
      }),
    }));
    expect(mockRecordBusinessEvent().mock.calls[0][0].attributes.message).not.toContain("customer=1");
    expect(mockRecordBusinessEvent().mock.calls[0][0].attributes).not.toHaveProperty("url");
  });
});
