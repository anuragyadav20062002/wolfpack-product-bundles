import { createHmac } from "node:crypto";
import { loader } from "../../../app/routes/api/api.cart-transform-heal";
import { CartTransformService } from "../../../app/services/cart-transform-service.server";
import { unauthenticated } from "../../../app/shopify.server";

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../../app/services/cart-transform-service.server", () => ({
  CartTransformService: {
    activateForNewInstallation: jest.fn(),
  },
}));

jest.mock("../../../app/shopify.server", () => ({
  unauthenticated: {
    admin: jest.fn(),
  },
}));

function makeSignedRequest(shop = "test-shop.myshopify.com") {
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
    createHmac("sha256", "test_api_secret").update(message).digest("hex")
  );

  return new Request(
    `https://${shop}/apps/product-bundles/api/cart-transform-heal?${params.toString()}`
  );
}

describe("cart transform storefront self-heal route", () => {
  const originalSecret = process.env.SHOPIFY_API_SECRET;
  const mockUnauthenticatedAdmin = unauthenticated.admin as jest.Mock;
  const mockActivateForNewInstallation =
    CartTransformService.activateForNewInstallation as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SHOPIFY_API_SECRET = "test_api_secret";
    mockUnauthenticatedAdmin.mockResolvedValue({ admin: { graphql: jest.fn() } });
    mockActivateForNewInstallation.mockResolvedValue({
      success: true,
      alreadyExists: true,
      cartTransformId: "gid://shopify/CartTransform/1",
    });

    const globalObject = globalThis as typeof globalThis & {
      __wolfpackCartTransformHealCache?: Map<string, number>;
    };
    globalObject.__wolfpackCartTransformHealCache?.clear();
  });

  afterAll(() => {
    process.env.SHOPIFY_API_SECRET = originalSecret;
  });

  it("accepts a correctly signed Shopify app-proxy request", async () => {
    const response = (await loader({
      request: makeSignedRequest(),
      params: {},
      context: {},
    } as any)) as Response;

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      alreadyExists: true,
      cartTransformId: "gid://shopify/CartTransform/1",
    });
    expect(mockUnauthenticatedAdmin).toHaveBeenCalledWith("test-shop.myshopify.com");
    expect(mockActivateForNewInstallation).toHaveBeenCalledWith(
      { graphql: expect.any(Function) },
      "test-shop.myshopify.com"
    );
  });

  it("rejects invalid app-proxy signatures before activation", async () => {
    const request = makeSignedRequest("bad-signature-shop.myshopify.com");
    const url = new URL(request.url);
    url.searchParams.set("signature", "bad-signature");

    const response = (await loader({
      request: new Request(url.toString()),
      params: {},
      context: {},
    } as any)) as Response;

    expect(response.status).toBe(400);
    expect(mockActivateForNewInstallation).not.toHaveBeenCalled();
  });
});
