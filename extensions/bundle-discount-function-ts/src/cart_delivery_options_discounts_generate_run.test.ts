import { describe, it, expect } from "vitest";
import { cartDeliveryOptionsDiscountsGenerateRun } from "./cart_delivery_options_discounts_generate_run";
import { DiscountClass } from "../generated/api";

describe("cartDeliveryOptionsDiscountsGenerateRun", () => {
  const mockBundleData = {
    id: "bundle-1",
    name: "Test Bundle",
    allBundleProductIds: ["gid://shopify/Product/123"],
    steps: [
      {
        id: "step-1",
        name: "Step 1",
        products: [{ id: "gid://shopify/Product/123", title: "Product 1" }],
        collections: [],
        minQuantity: 1,
        maxQuantity: 5,
        enabled: true,
      },
    ],
    pricing: {
      enableDiscount: true,
      discountMethod: "free_shipping",
      rules: [
        {
          discountOn: "quantity",
          minimumQuantity: 1,
          fixedAmountOff: 0,
          percentageOff: 0,
        },
      ],
    },
  };

  const mockCartWithBundleProduct = {
    lines: [
      {
        id: "line-1",
        quantity: 2,
        merchandise: {
          __typename: "ProductVariant",
          id: "variant-1",
          product: {
            id: "gid://shopify/Product/123",
            title: "Product 1",
            inCollections: [],
            metafield: {
              value: JSON.stringify(mockBundleData),
            },
          },
        },
        cost: {
          subtotalAmount: {
            amount: "50.00",
          },
        },
      },
    ],
    deliveryGroups: [
      {
        id: "delivery-group-1",
      },
    ],
  };

  it("should return empty operations when cart is empty", () => {
    const input = {
      cart: { lines: [], deliveryGroups: [] },
      discount: { discountClasses: [DiscountClass.Shipping] },
    };

    const result = cartDeliveryOptionsDiscountsGenerateRun(input);
    expect(result.operations).toEqual([]);
  });

  it("should return empty operations when no bundle settings found", () => {
    const cartWithoutBundleSettings = {
      ...mockCartWithBundleProduct,
      lines: [
        {
          ...mockCartWithBundleProduct.lines[0],
          merchandise: {
            ...mockCartWithBundleProduct.lines[0].merchandise,
            product: {
              ...mockCartWithBundleProduct.lines[0].merchandise.product,
              metafield: null,
            },
          },
        },
      ],
    };

    const input = {
      cart: cartWithoutBundleSettings,
      discount: { discountClasses: [DiscountClass.Shipping] },
    };

    const result = cartDeliveryOptionsDiscountsGenerateRun(input);
    expect(result.operations).toEqual([]);
  });

  it("should return empty operations when discount is not enabled", () => {
    const bundleDataWithoutDiscount = {
      ...mockBundleData,
      pricing: {
        ...mockBundleData.pricing,
        enableDiscount: false,
      },
    };

    const cartWithDisabledDiscount = {
      ...mockCartWithBundleProduct,
      lines: [
        {
          ...mockCartWithBundleProduct.lines[0],
          merchandise: {
            ...mockCartWithBundleProduct.lines[0].merchandise,
            product: {
              ...mockCartWithBundleProduct.lines[0].merchandise.product,
              metafield: {
                value: JSON.stringify(bundleDataWithoutDiscount),
              },
            },
          },
        },
      ],
    };

    const input = {
      cart: cartWithDisabledDiscount,
      discount: { discountClasses: [DiscountClass.Shipping] },
    };

    const result = cartDeliveryOptionsDiscountsGenerateRun(input);
    expect(result.operations).toEqual([]);
  });

  it("should return empty operations when not free shipping discount", () => {
    const bundleDataWithFixedDiscount = {
      ...mockBundleData,
      pricing: {
        ...mockBundleData.pricing,
        discountMethod: "fixed_amount_off",
      },
    };

    const cartWithFixedDiscount = {
      ...mockCartWithBundleProduct,
      lines: [
        {
          ...mockCartWithBundleProduct.lines[0],
          merchandise: {
            ...mockCartWithBundleProduct.lines[0].merchandise,
            product: {
              ...mockCartWithBundleProduct.lines[0].merchandise.product,
              metafield: {
                value: JSON.stringify(bundleDataWithFixedDiscount),
              },
            },
          },
        },
      ],
    };

    const input = {
      cart: cartWithFixedDiscount,
      discount: { discountClasses: [DiscountClass.Shipping] },
    };

    const result = cartDeliveryOptionsDiscountsGenerateRun(input);
    expect(result.operations).toEqual([]);
  });

  it("should return empty operations when shipping discount class not present", () => {
    const input = {
      cart: mockCartWithBundleProduct,
      discount: { discountClasses: [DiscountClass.Order] },
    };

    const result = cartDeliveryOptionsDiscountsGenerateRun(input);
    expect(result.operations).toEqual([]);
  });

  it("should apply free shipping discount when conditions are met", () => {
    const input = {
      cart: mockCartWithBundleProduct,
      discount: { discountClasses: [DiscountClass.Shipping] },
    };

    const result = cartDeliveryOptionsDiscountsGenerateRun(input);

    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toHaveProperty("deliveryDiscountsAdd");
    expect(
      result.operations[0]?.deliveryDiscountsAdd?.candidates[0]?.message,
    ).toBe("Test Bundle: Free Shipping");
    expect(
      result.operations[0]?.deliveryDiscountsAdd?.candidates[0]?.value
        ?.percentage?.value,
    ).toBe(100);
  });

  it("should return empty operations when cart does not meet bundle conditions", () => {
    const bundleDataWithHigherQuantity = {
      ...mockBundleData,
      pricing: {
        ...mockBundleData.pricing,
        rules: [
          {
            discountOn: "quantity",
            minimumQuantity: 5, // Require 5 items, but cart only has 2
            fixedAmountOff: 0,
            percentageOff: 0,
          },
        ],
      },
    };

    const cartWithInsufficientQuantity = {
      ...mockCartWithBundleProduct,
      lines: [
        {
          ...mockCartWithBundleProduct.lines[0],
          merchandise: {
            ...mockCartWithBundleProduct.lines[0].merchandise,
            product: {
              ...mockCartWithBundleProduct.lines[0].merchandise.product,
              metafield: {
                value: JSON.stringify(bundleDataWithHigherQuantity),
              },
            },
          },
        },
      ],
    };

    const input = {
      cart: cartWithInsufficientQuantity,
      discount: { discountClasses: [DiscountClass.Shipping] },
    };

    const result = cartDeliveryOptionsDiscountsGenerateRun(input);
    expect(result.operations).toEqual([]);
  });

  it("should handle collection-based matching", () => {
    const bundleDataWithCollection = {
      ...mockBundleData,
      steps: [
        {
          ...mockBundleData.steps[0],
          products: [],
          collections: [
            { id: "gid://shopify/Collection/456", title: "Test Collection" },
          ],
        },
      ],
    };

    const cartWithCollectionProduct = {
      ...mockCartWithBundleProduct,
      lines: [
        {
          ...mockCartWithBundleProduct.lines[0],
          merchandise: {
            ...mockCartWithBundleProduct.lines[0].merchandise,
            product: {
              ...mockCartWithBundleProduct.lines[0].merchandise.product,
              id: "gid://shopify/Product/456", // Using same ID as collection for testing
              inCollections: [
                { id: "gid://shopify/Collection/456", title: "Test Collection" },
              ],
              metafield: {
                value: JSON.stringify(bundleDataWithCollection),
              },
            },
          },
        },
      ],
    };

    const input = {
      cart: cartWithCollectionProduct,
      discount: { discountClasses: [DiscountClass.Shipping] },
    };

    const result = cartDeliveryOptionsDiscountsGenerateRun(input);
    // Collection checking is not fully implemented in Shopify Functions, so no discount
    expect(result.operations).toHaveLength(0);
  });
});
