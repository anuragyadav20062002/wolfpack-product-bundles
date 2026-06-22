import { action as createAction } from "../../../app/routes/api/api.billing.create";
import { action as cancelAction } from "../../../app/routes/api/api.billing.cancel";
import { requireAdminSession } from "../../../app/lib/auth-guards.server";
import { BillingService } from "../../../app/services/billing.server";

jest.mock("../../../app/lib/auth-guards.server", () => ({
  requireAdminSession: jest.fn(),
}));

jest.mock("../../../app/services/billing.server", () => ({
  BillingService: {
    createSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
  },
}));

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../../app/services/app-events.server", () => ({
  recordBusinessEvent: jest.fn(),
  ensureShopIdentity: jest.fn().mockResolvedValue("gid://shopify/Shop/1"),
}));

const mockRequireAdminSession = requireAdminSession as jest.MockedFunction<typeof requireAdminSession>;
const mockCreateSubscription = BillingService.createSubscription as jest.MockedFunction<any>;
const mockCancelSubscription = BillingService.cancelSubscription as jest.MockedFunction<any>;
const mockRecordBusinessEvent = () =>
  require("../../../app/services/app-events.server").recordBusinessEvent as jest.MockedFunction<any>;

describe("billing App Events instrumentation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminSession.mockResolvedValue({
      admin: { graphql: jest.fn() },
      session: { shop: "shop.myshopify.com" },
    } as any);
  });

  it("records billing upgrade started and upgraded on create success", async () => {
    mockCreateSubscription.mockResolvedValue({
      success: true,
      confirmationUrl: "https://shopify.example/confirm",
      subscriptionId: "gid://shopify/AppSubscription/1",
    });

    const response = await createAction({
      request: new Request("https://app.example.com/api/billing/create", {
        method: "POST",
        body: JSON.stringify({ plan: "grow", returnUrl: "https://app.example.com/billing/confirm" }),
      }),
      params: {},
      context: {},
    } as any) as Response;

    expect(response.status).toBe(200);
    expect(mockRecordBusinessEvent()).toHaveBeenCalledWith(expect.objectContaining({
      eventHandle: "billing_upgrade_started",
      shopDomain: "shop.myshopify.com",
      shopifyShopGid: "gid://shopify/Shop/1",
      attributes: expect.objectContaining({ to_plan: "grow" }),
    }));
    expect(mockRecordBusinessEvent()).toHaveBeenCalledWith(expect.objectContaining({
      eventHandle: "billing_upgraded",
      result: "success",
    }));
  });

  it("records billing upgrade failed on service failure", async () => {
    mockCreateSubscription.mockResolvedValue({ success: false, error: "Billing unavailable" });

    const response = await createAction({
      request: new Request("https://app.example.com/api/billing/create", {
        method: "POST",
        body: JSON.stringify({ plan: "grow", returnUrl: "https://app.example.com/billing/confirm" }),
      }),
      params: {},
      context: {},
    } as any) as Response;

    expect(response.status).toBe(400);
    expect(mockRecordBusinessEvent()).toHaveBeenCalledWith(expect.objectContaining({
      eventHandle: "billing_upgrade_failed",
      errorCode: "subscription_create_failed",
      result: "failure",
    }));
  });

  it("records billing cancel started and cancelled on cancel success", async () => {
    mockCancelSubscription.mockResolvedValue({ success: true });

    const response = await cancelAction({
      request: new Request("https://app.example.com/api/billing/cancel", { method: "POST" }),
      params: {},
      context: {},
    } as any) as Response;

    expect(response.status).toBe(200);
    expect(mockRecordBusinessEvent()).toHaveBeenCalledWith(expect.objectContaining({
      eventHandle: "billing_cancel_started",
      shopDomain: "shop.myshopify.com",
    }));
    expect(mockRecordBusinessEvent()).toHaveBeenCalledWith(expect.objectContaining({
      eventHandle: "billing_cancelled",
      result: "success",
    }));
  });
});
