import { createHmac } from "node:crypto";
import { action } from "../../../app/routes/api/api.cart-transform-runtime-token";
import prisma from "../../../app/db.server";
import {
  generateCartTransformRuntimeTokenSecret,
  verifyRuntimeCartToken,
} from "../../../app/services/cart-transform-runtime-token.server";
import { getBundleProductVariantId } from "../../../app/utils/variant-lookup.server";

jest.mock("../../../app/db.server", () => ({
  bundle: {
    findFirst: jest.fn(),
  },
}));

jest.mock("../../../app/shopify.server", () => ({
  unauthenticated: {
    admin: jest.fn().mockResolvedValue({ admin: { graphql: jest.fn() } }),
  },
}));

jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../../app/utils/variant-lookup.server", () => ({
  getBundleProductVariantId: jest.fn(),
}));

const mockGetBundleProductVariantId = getBundleProductVariantId as jest.Mock;
const mockDb = prisma as any;

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
    `https://${shop}/apps/product-bundles/api/cart-transform-runtime-token?${params.toString()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

function makeBundle(overrides: Record<string, unknown> = {}) {
  return {
    id: "bundle-1",
    shopId: "test-shop.myshopify.com",
    bundleType: "product_page",
    name: "Mix Bundle",
    shopifyProductId: "gid://shopify/Product/PARENT",
    steps: [
      {
        StepProduct: [
          {
            productId: "gid://shopify/Product/1",
            variants: [{ id: "gid://shopify/ProductVariant/101" }],
          },
        ],
        StepCategory: [],
      },
    ],
    pricing: {
      enabled: true,
      method: "percentage_off",
      rules: [{ conditionType: "quantity", conditionValue: 1, discountValue: 20 }],
    },
    personalizationData: null,
    ...overrides,
  };
}

describe("cart transform runtime token route", () => {
  const originalSecret = process.env.SHOPIFY_API_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SHOPIFY_API_SECRET = "test_api_secret";
    mockDb.bundle.findFirst.mockResolvedValue(makeBundle());
    mockGetBundleProductVariantId.mockResolvedValue("gid://shopify/ProductVariant/PARENT");
  });

  afterAll(() => {
    process.env.SHOPIFY_API_SECRET = originalSecret;
  });

  it("rejects invalid app-proxy signatures", async () => {
    const request = makeSignedRequest({
      bundleId: "bundle-1",
      bundleType: "product_page",
      offerGroupId: "MIX-bundle-1_ABC",
      components: [{ variantId: "101", quantity: 1 }],
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
    expect(mockDb.bundle.findFirst).not.toHaveBeenCalled();
  });

  it("rejects selected variants that are not in the bundle", async () => {
    const response = await action({
      request: makeSignedRequest({
        bundleId: "bundle-1",
        bundleType: "product_page",
        offerGroupId: "MIX-bundle-1_ABC",
        components: [{ variantId: "999", quantity: 1 }],
      }),
      params: {},
      context: {},
    } as any) as Response;

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/invalid runtime token payload/i);
  });

  it("returns a token for a valid product-page runtime selection", async () => {
    const response = await action({
      request: makeSignedRequest({
        bundleId: "bundle-1",
        bundleType: "product_page",
        offerGroupId: "MIX-bundle-1_ABC",
        components: [{ variantId: "101", quantity: 1 }],
      }),
      params: {},
      context: {},
    } as any) as Response;

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(typeof body.token).toBe("string");
    const secret = generateCartTransformRuntimeTokenSecret("test-shop.myshopify.com", "test_api_secret");
    expect(verifyRuntimeCartToken(body.token, secret)).toMatchObject({
      shop: "test-shop.myshopify.com",
      bundleId: "bundle-1",
      bundleType: "product_page",
      offerGroupId: "MIX-bundle-1_ABC",
      parentVariantId: "gid://shopify/ProductVariant/PARENT",
      components: [{ variantId: "gid://shopify/ProductVariant/101", quantity: 1 }],
    });
  });

  it("returns a token for a product-page selection hydrated from a configured category product", async () => {
    mockDb.bundle.findFirst.mockResolvedValue(makeBundle({
      steps: [
        {
          StepProduct: [],
          StepCategory: [
            {
              products: [
                {
                  id: "gid://shopify/Product/5",
                  variants: [],
                },
              ],
            },
          ],
        },
      ],
    }));

    const response = await action({
      request: makeSignedRequest({
        bundleId: "bundle-1",
        bundleType: "product_page",
        offerGroupId: "MIX-bundle-1_ABC",
        components: [{ variantId: 501, productId: "gid://shopify/Product/5", quantity: 1 }],
      }),
      params: {},
      context: {},
    } as any) as Response;

    expect(response.status).toBe(200);
    const body = await response.json();
    const secret = generateCartTransformRuntimeTokenSecret("test-shop.myshopify.com", "test_api_secret");
    expect(verifyRuntimeCartToken(body.token, secret)).toMatchObject({
      bundleType: "product_page",
      offerGroupId: "MIX-bundle-1_ABC",
      components: [{ variantId: "gid://shopify/ProductVariant/501", quantity: 1 }],
    });
  });

  it("returns a token for a valid full-page runtime selection", async () => {
    mockDb.bundle.findFirst.mockResolvedValue(makeBundle({ bundleType: "full_page" }));

    const response = await action({
      request: makeSignedRequest({
        bundleId: "bundle-1",
        bundleType: "full_page",
        offerGroupId: "FBP-bundle-1_ABC",
        components: [{ variantId: "gid://shopify/ProductVariant/101", quantity: 2 }],
      }),
      params: {},
      context: {},
    } as any) as Response;

    expect(response.status).toBe(200);
    const body = await response.json();
    const secret = generateCartTransformRuntimeTokenSecret("test-shop.myshopify.com", "test_api_secret");
    expect(verifyRuntimeCartToken(body.token, secret)).toMatchObject({
      bundleType: "full_page",
      offerGroupId: "FBP-bundle-1_ABC",
      components: [{ variantId: "gid://shopify/ProductVariant/101", quantity: 2 }],
    });
  });
});
