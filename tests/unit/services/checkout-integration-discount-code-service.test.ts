import {
  CHECKOUT_INTEGRATION_DISCOUNT_CODE_TTL_MS,
  CHECKOUT_INTEGRATION_DISCOUNT_PREFIX,
  CheckoutIntegrationDiscountCodeService,
} from "../../../app/services/checkout-integration-discount-code-service.server";
import { createMockGraphQLResponse, mockShopifyAdmin } from "../../setup";

const MOCK_DISCOUNT_FUNCTION_ID = "gid://shopify/ShopifyFunction/discount-function-1";

function discountFunctionMock() {
  return createMockGraphQLResponse({
    shopifyFunctions: {
      edges: [{
        node: {
          id: MOCK_DISCOUNT_FUNCTION_ID,
          title: "bundle-discount-function",
          apiType: "discount",
          description: "bundle-discount-function",
        },
      }],
    },
  });
}

describe("CheckoutIntegrationDiscountCodeService", () => {
  const shopDomain = "test-shop.myshopify.com";

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(Date.UTC(2026, 6, 2, 10, 0, 0));
    jest.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("12345678-90ab-cdef-1234-567890abcdef");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("creates a one-use app discount code for a supported checkout integration", async () => {
    mockShopifyAdmin.graphql
      .mockResolvedValueOnce(discountFunctionMock())
      .mockResolvedValueOnce(createMockGraphQLResponse({
        discountCodeAppCreate: {
          codeAppDiscount: {
            discountId: "gid://shopify/DiscountCodeNode/1",
            codes: { nodes: [{ code: "WPB-GOKWIK-12345678" }] },
            endsAt: "2026-07-02T10:30:00.000Z",
          },
          userErrors: [],
        },
      }));

    const result = await CheckoutIntegrationDiscountCodeService.createForProvider(
      mockShopifyAdmin,
      shopDomain,
      "gokwik",
    );

    expect(result).toMatchObject({
      success: true,
      providerId: "gokwik",
      discountId: "gid://shopify/DiscountCodeNode/1",
      code: "WPB-GOKWIK-12345678",
      expiresAt: "2026-07-02T10:30:00.000Z",
    });

    const createCall = mockShopifyAdmin.graphql.mock.calls[1];
    expect(createCall[0]).toContain("discountCodeAppCreate");
    expect(createCall[1].variables.codeAppDiscount).toMatchObject({
      title: "WPB checkout integration - GoKwik",
      code: `${CHECKOUT_INTEGRATION_DISCOUNT_PREFIX}GOKWIK-12345678`,
      functionId: MOCK_DISCOUNT_FUNCTION_ID,
      usageLimit: 1,
      appliesOncePerCustomer: false,
      discountClasses: ["PRODUCT"],
      combinesWith: {
        orderDiscounts: true,
        productDiscounts: true,
        shippingDiscounts: false,
      },
    });
    expect(createCall[1].variables.codeAppDiscount.startsAt).toBe("2026-07-02T09:59:00.000Z");
    expect(createCall[1].variables.codeAppDiscount.endsAt).toBe(
      new Date(Date.UTC(2026, 6, 2, 10, 0, 0) + CHECKOUT_INTEGRATION_DISCOUNT_CODE_TTL_MS).toISOString(),
    );
    expect(createCall[1].variables.codeAppDiscount.metafields).toEqual([
      expect.objectContaining({
        namespace: "$app",
        key: "checkout_integration_config",
        type: "json",
        value: JSON.stringify({
          mode: "checkout_integration",
          providerId: "gokwik",
          shopDomain,
          ttlMs: CHECKOUT_INTEGRATION_DISCOUNT_CODE_TTL_MS,
        }),
      }),
    ]);
  });

  it("does not create a code when the discount function is missing", async () => {
    mockShopifyAdmin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
      shopifyFunctions: { edges: [] },
    }));

    const result = await CheckoutIntegrationDiscountCodeService.createForProvider(
      mockShopifyAdmin,
      shopDomain,
      "shopflo",
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("bundle-discount-function");
    expect(mockShopifyAdmin.graphql).toHaveBeenCalledTimes(1);
  });

  it("surfaces Shopify user errors", async () => {
    mockShopifyAdmin.graphql
      .mockResolvedValueOnce(discountFunctionMock())
      .mockResolvedValueOnce(createMockGraphQLResponse({
        discountCodeAppCreate: {
          codeAppDiscount: null,
          userErrors: [{ field: ["functionId"], message: "Function not found" }],
        },
      }));

    const result = await CheckoutIntegrationDiscountCodeService.createForProvider(
      mockShopifyAdmin,
      shopDomain,
      "shopflo",
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Function not found");
  });

  it("creates deterministic discount metadata for Shiprocket and Fastrr handoff", async () => {
    mockShopifyAdmin.graphql
      .mockResolvedValueOnce(discountFunctionMock())
      .mockResolvedValueOnce(createMockGraphQLResponse({
        discountCodeAppCreate: {
          codeAppDiscount: {
            discountId: "gid://shopify/DiscountCodeNode/2",
            codes: { nodes: [{ code: "WPB-SHIPROCKET_FASTRR-12345678" }] },
            endsAt: "2026-07-02T10:30:00.000Z",
          },
          userErrors: [],
        },
      }));

    await CheckoutIntegrationDiscountCodeService.createForProvider(
      mockShopifyAdmin,
      shopDomain,
      "shiprocket_fastrr",
    );

    const createCall = mockShopifyAdmin.graphql.mock.calls[1];
    expect(createCall[1].variables.codeAppDiscount).toMatchObject({
      title: "WPB checkout integration - Shiprocket / Fastrr",
      code: "WPB-SHIPROCKET_FASTRR-12345678",
    });
    expect(JSON.parse(createCall[1].variables.codeAppDiscount.metafields[0].value)).toMatchObject({
      providerId: "shiprocket_fastrr",
    });
  });
});
