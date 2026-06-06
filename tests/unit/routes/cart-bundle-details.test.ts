import { createHmac } from "node:crypto";
import {
  action,
  mergeBundleDetailsValue,
  normalizeCartId,
  sanitizeDisplayProperties,
} from "../../../app/routes/api/api.cart-bundle-details";
import { getOfflineSessionForShop } from "../../../app/services/offline-token.server";
import { createStorefrontAccessToken } from "../../../app/services/storefront-token.server";

jest.mock("../../../app/db.server", () => ({}));

jest.mock("../../../app/shopify.server", () => ({
  sessionStorage: {},
}));

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../../app/services/offline-token.server", () => ({
  getOfflineSessionForShop: jest.fn(),
}));

jest.mock("../../../app/services/storefront-token.server", () => ({
  createStorefrontAccessToken: jest.fn(),
}));

const mockGetOfflineSessionForShop = getOfflineSessionForShop as jest.Mock;
const mockCreateStorefrontAccessToken = createStorefrontAccessToken as jest.Mock;

function makeSignedRequest(body: Record<string, unknown>, shop = "test-shop.myshopify.com") {
  const params = new URLSearchParams({
    shop,
    path_prefix: "/apps/product-bundles",
    timestamp: "1770000000",
  });

  const message = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join("");

  params.set(
    "signature",
    createHmac("sha256", "test_api_secret").update(message).digest("hex"),
  );

  return new Request(
    `https://${shop}/apps/product-bundles/api/cart-bundle-details?${params.toString()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

describe("cart bundle_details metafield route helpers", () => {
  it("normalizes Ajax cart token into Storefront cart ID", () => {
    expect(normalizeCartId(null, "cart-token")).toBe("gid://shopify/Cart/cart-token");
    expect(normalizeCartId("gid://shopify/Cart/existing", null)).toBe("gid://shopify/Cart/existing");
  });

  it("sanitizes scalar display properties only", () => {
    expect(sanitizeDisplayProperties({
      Items: "1 x Product",
      Box: 1,
      Nested: { value: "no" },
      Empty: null,
    })).toEqual({
      Items: "1 x Product",
      Box: "1",
    });
  });

  it("merges bundle details into existing JSON object", () => {
    const merged = mergeBundleDetailsValue(
      JSON.stringify({ "FBP-1_ABC": { displayProperties: { Items: "Old" } } }),
      "MIX-2_DEF",
      { Items: "New" },
    );

    expect(merged).toEqual({
      "FBP-1_ABC": { displayProperties: { Items: "Old" } },
      "MIX-2_DEF": { displayProperties: { Items: "New" } },
    });
  });
});

describe("cart bundle_details metafield route", () => {
  const originalSecret = process.env.SHOPIFY_API_SECRET;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SHOPIFY_API_SECRET = "test_api_secret";
    mockGetOfflineSessionForShop.mockResolvedValue({
      accessToken: "admin-token",
      storefrontAccessToken: "sf-token",
    });
    mockCreateStorefrontAccessToken.mockResolvedValue("new-sf-token");
    global.fetch = jest.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: {
          cart: {
            metafields: [{
              key: "bundle_details",
              type: "json",
              value: JSON.stringify({ "FBP-1_ABC": { displayProperties: { Items: "Old" } } }),
            }],
          },
        },
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: {
          cartMetafieldsSet: {
            metafields: [{ key: "bundle_details", type: "json", value: "{}" }],
            userErrors: [],
          },
        },
      }), { status: 200 })) as jest.Mock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  afterAll(() => {
    process.env.SHOPIFY_API_SECRET = originalSecret;
  });

  it("merges bundle_details for a signed app-proxy request", async () => {
    const response = await action({
      request: makeSignedRequest({
        cartToken: "cart-token",
        bundleDetailsKey: "MIX-2_DEF",
        displayProperties: { Items: "1 x Product" },
      }),
      params: {},
      context: {},
    } as any) as Response;

    expect(response.status).toBe(200);
    expect(mockGetOfflineSessionForShop).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect((global.fetch as jest.Mock).mock.calls[1][0]).toBe("https://test-shop.myshopify.com/api/2025-01/graphql.json");

    const mutationBody = JSON.parse((global.fetch as jest.Mock).mock.calls[1][1].body);
    expect(mutationBody.variables.metafields[0]).toMatchObject({
      ownerId: "gid://shopify/Cart/cart-token",
      key: "bundle_details",
      type: "json",
    });
    expect(JSON.parse(mutationBody.variables.metafields[0].value)).toEqual({
      "FBP-1_ABC": { displayProperties: { Items: "Old" } },
      "MIX-2_DEF": { displayProperties: { Items: "1 x Product" } },
    });
  });

  it("creates a Storefront token on demand when the offline session is missing one", async () => {
    mockGetOfflineSessionForShop
      .mockResolvedValueOnce({
        accessToken: "admin-token",
        storefrontAccessToken: null,
      })
      .mockResolvedValueOnce({
        accessToken: "admin-token",
        storefrontAccessToken: "new-sf-token",
      });

    const response = await action({
      request: makeSignedRequest({
        cartToken: "cart-token",
        bundleDetailsKey: "MIX-2_DEF",
        displayProperties: { Items: "1 x Product" },
      }),
      params: {},
      context: {},
    } as any) as Response;

    expect(response.status).toBe(200);
    expect(mockCreateStorefrontAccessToken).toHaveBeenCalledWith(expect.objectContaining({
      graphql: expect.any(Function),
    }), "test-shop.myshopify.com");
    expect((global.fetch as jest.Mock).mock.calls[0][1].headers["X-Shopify-Storefront-Access-Token"]).toBe("new-sf-token");
  });

  it("rejects invalid app-proxy signatures", async () => {
    const request = makeSignedRequest({
      cartToken: "cart-token",
      bundleDetailsKey: "MIX-2_DEF",
      displayProperties: { Items: "1 x Product" },
    });
    const url = new URL(request.url);
    url.searchParams.set("signature", "bad-signature");

    const response = await action({
      request: new Request(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      params: {},
      context: {},
    } as any) as Response;

    expect(response.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("rejects missing bundle key", async () => {
    const response = await action({
      request: makeSignedRequest({
        cartToken: "cart-token",
        displayProperties: { Items: "1 x Product" },
      }),
      params: {},
      context: {},
    } as any) as Response;

    expect(response.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
