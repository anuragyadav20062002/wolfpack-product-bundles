import { action } from "../../../app/routes/api/api.attribution";
import { matchLineItemsToBundles } from "../../../app/lib/analytics/bundle-matcher.server";

jest.mock("../../../app/lib/analytics/bundle-matcher.server", () => ({
  matchLineItemsToBundles: jest.fn(),
  normalizeToOrderGid: (orderId: string) => (
    orderId.startsWith("gid://shopify/Order/")
      ? orderId
      : `gid://shopify/Order/${orderId}`
  ),
}));

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  default: {
    orderAttribution: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
  },
}));

const mockMatchLineItemsToBundles = matchLineItemsToBundles as jest.MockedFunction<typeof matchLineItemsToBundles>;
const getDb = () => require("../../../app/db.server").default;

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("https://app.example.com/api/attribution", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("api.attribution", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMatchLineItemsToBundles.mockResolvedValue([]);
  });

  it("persists sanitized custom UTM attributes on attribution rows", async () => {
    const response = await action({
      request: makeRequest({
        orderId: "123",
        shopId: "test.myshopify.com",
        totalPrice: "10.00",
        currencyCode: "USD",
        customUtmAttributes: {
          utm_influencer: "sam",
          "Partner-ID": "partner-1",
          email: "blocked@example.com",
        },
      }),
      params: {},
      context: {},
    });

    expect(response.status).toBe(200);
    expect(getDb().orderAttribution.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        customUtmAttributes: {
          utm_influencer: "sam",
          "partner-id": "partner-1",
        },
      }),
    });
  });
});
