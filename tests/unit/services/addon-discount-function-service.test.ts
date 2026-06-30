import { AddOnDiscountFunctionService } from "../../../app/services/addon-discount-function-service.server";
import { createMockGraphQLResponse, mockShopifyAdmin } from "../../setup";

const MOCK_DISCOUNT_FUNCTION_ID = "gid://shopify/ShopifyFunction/addon-discount-1";

function addOnFunctionsMock() {
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

function addOnFunctionsEmptyMock() {
  return createMockGraphQLResponse({
    shopifyFunctions: { edges: [] },
  });
}

describe("AddOnDiscountFunctionService", () => {
  const shopDomain = "test-shop.myshopify.com";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates the automatic app discount when none exists", async () => {
    mockShopifyAdmin.graphql
      .mockResolvedValueOnce(addOnFunctionsMock())
      .mockResolvedValueOnce(createMockGraphQLResponse({
        discountNodes: { edges: [] },
      }))
      .mockResolvedValueOnce(createMockGraphQLResponse({
        discountAutomaticAppCreate: {
          automaticAppDiscount: {
            discountId: "gid://shopify/DiscountAutomaticNode/1",
            title: "Add On",
            status: "ACTIVE",
            appDiscountType: { functionId: MOCK_DISCOUNT_FUNCTION_ID },
            combinesWith: {
              orderDiscounts: true,
              productDiscounts: true,
              shippingDiscounts: false,
            },
          },
          userErrors: [],
        },
      }));

    const result = await AddOnDiscountFunctionService.completeSetup(
      mockShopifyAdmin,
      shopDomain,
    );

    expect(result.success).toBe(true);
    expect(result.discountId).toBe("gid://shopify/DiscountAutomaticNode/1");
    expect(result.alreadyExists).toBeFalsy();
    expect(mockShopifyAdmin.graphql).toHaveBeenCalledTimes(3);

    const createCall = mockShopifyAdmin.graphql.mock.calls[2];
    expect(createCall[0]).toContain("discountAutomaticAppCreate");
    expect(createCall[1].variables.automaticAppDiscount).toMatchObject({
      title: "Add On",
      functionId: MOCK_DISCOUNT_FUNCTION_ID,
      discountClasses: ["PRODUCT"],
      combinesWith: {
        orderDiscounts: true,
        productDiscounts: true,
        shippingDiscounts: false,
      },
    });
    expect(createCall[1].variables.automaticAppDiscount.startsAt).toEqual(expect.any(String));
  });

  it("does not create a duplicate when the automatic app discount already exists", async () => {
    mockShopifyAdmin.graphql
      .mockResolvedValueOnce(addOnFunctionsMock())
      .mockResolvedValueOnce(createMockGraphQLResponse({
        discountNodes: {
          edges: [{
            node: {
              id: "gid://shopify/DiscountAutomaticNode/existing-node",
              discount: {
                __typename: "DiscountAutomaticApp",
                title: "Add On",
                status: "ACTIVE",
                appDiscountType: { functionId: MOCK_DISCOUNT_FUNCTION_ID },
              },
            },
          }],
        },
      }));

    const result = await AddOnDiscountFunctionService.completeSetup(
      mockShopifyAdmin,
      shopDomain,
    );

    expect(result.success).toBe(true);
    expect(result.discountId).toBe("gid://shopify/DiscountAutomaticNode/existing-node");
    expect(result.alreadyExists).toBe(true);
    expect(mockShopifyAdmin.graphql).toHaveBeenCalledTimes(2);
  });

  it("returns failure when the add-on discount function is not deployed", async () => {
    mockShopifyAdmin.graphql.mockResolvedValueOnce(addOnFunctionsEmptyMock());

    const result = await AddOnDiscountFunctionService.completeSetup(
      mockShopifyAdmin,
      shopDomain,
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("bundle-discount-function");
    expect(mockShopifyAdmin.graphql).toHaveBeenCalledTimes(1);
  });

  it("surfaces automatic discount creation user errors", async () => {
    mockShopifyAdmin.graphql
      .mockResolvedValueOnce(addOnFunctionsMock())
      .mockResolvedValueOnce(createMockGraphQLResponse({
        discountNodes: { edges: [] },
      }))
      .mockResolvedValueOnce(createMockGraphQLResponse({
        discountAutomaticAppCreate: {
          automaticAppDiscount: null,
          userErrors: [{ field: ["functionId"], message: "Function not found" }],
        },
      }));

    const result = await AddOnDiscountFunctionService.completeSetup(
      mockShopifyAdmin,
      shopDomain,
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Function not found");
  });
});
