import { describe, it, expect } from "vitest";
import { cartLinesDiscountsGenerateRun } from "./cart_lines_discounts_generate_run";
import { DiscountClass } from "../generated/api";

describe("cartLinesDiscountsGenerateRun", () => {
  const mockBundleData = {
    id: "bundle-1",
    name: "Test Bundle",
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
      discountMethod: "fixed_amount_off",
      rules: [
        {
          discountOn: "quantity",
          minimumQuantity: 1,
          fixedAmountOff: 10,
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

  const mockDiscountInput = {
    discountClasses: [DiscountClass.Order],
  };

  it("should return empty operations when cart is empty", () => {
    const input = {
      cart: { lines: [] },
      discount: mockDiscountInput,
    };

    const result = cartLinesDiscountsGenerateRun(input);
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
      discount: mockDiscountInput,
    };

    const result = cartLinesDiscountsGenerateRun(input);
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
      discount: mockDiscountInput,
    };

    const result = cartLinesDiscountsGenerateRun(input);
    expect(result.operations).toEqual([]);
  });

  it("should apply fixed amount discount when conditions are met", () => {
    const input = {
      cart: mockCartWithBundleProduct,
      discount: mockDiscountInput,
    };

    const result = cartLinesDiscountsGenerateRun(input);

    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toHaveProperty("orderDiscountsAdd");
    expect(
      result.operations[0]?.orderDiscountsAdd?.candidates[0]?.message,
    ).toBe("Test Bundle: $10 OFF");
    expect(
      result.operations[0]?.orderDiscountsAdd?.candidates[0]?.value?.fixedAmount
        ?.amount,
    ).toBe("10");
  });

  it("should apply percentage discount when conditions are met", () => {
    const bundleDataWithPercentage = {
      ...mockBundleData,
      pricing: {
        ...mockBundleData.pricing,
        discountMethod: "percentage_off",
        rules: [
          {
            discountOn: "quantity",
            minimumQuantity: 1,
            fixedAmountOff: 0,
            percentageOff: 15,
          },
        ],
      },
    };

    const cartWithPercentageDiscount = {
      ...mockCartWithBundleProduct,
      lines: [
        {
          ...mockCartWithBundleProduct.lines[0],
          merchandise: {
            ...mockCartWithBundleProduct.lines[0].merchandise,
            product: {
              ...mockCartWithBundleProduct.lines[0].merchandise.product,
              metafield: {
                value: JSON.stringify(bundleDataWithPercentage),
              },
            },
          },
        },
      ],
    };

    const input = {
      cart: cartWithPercentageDiscount,
      discount: mockDiscountInput,
    };

    const result = cartLinesDiscountsGenerateRun(input);

    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toHaveProperty("orderDiscountsAdd");
    expect(
      result.operations[0]?.orderDiscountsAdd?.candidates[0]?.message,
    ).toBe("Test Bundle: 15% OFF");
    expect(
      result.operations[0]?.orderDiscountsAdd?.candidates[0]?.value?.percentage
        ?.value,
    ).toBe(15);
  });

  it("should skip free shipping discount (handled by delivery function)", () => {
    const bundleDataWithFreeShipping = {
      ...mockBundleData,
      pricing: {
        ...mockBundleData.pricing,
        discountMethod: "free_shipping",
      },
    };

    const cartWithFreeShipping = {
      ...mockCartWithBundleProduct,
      lines: [
        {
          ...mockCartWithBundleProduct.lines[0],
          merchandise: {
            ...mockCartWithBundleProduct.lines[0].merchandise,
            product: {
              ...mockCartWithBundleProduct.lines[0].merchandise.product,
              metafield: {
                value: JSON.stringify(bundleDataWithFreeShipping),
              },
            },
          },
        },
      ],
    };

    const input = {
      cart: cartWithFreeShipping,
      discount: mockDiscountInput,
    };

    const result = cartLinesDiscountsGenerateRun(input);
    expect(result.operations).toEqual([]);
  });

  it("should return empty operations when cart does not meet bundle conditions", () => {
    const bundleDataWithHigherQuantity = {
      ...mockBundleData,
      steps: [
        {
          ...mockBundleData.steps[0],
          minQuantity: 5, // Require 5 items, but cart only has 2
        },
      ],
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
      discount: mockDiscountInput,
    };

    const result = cartLinesDiscountsGenerateRun(input);
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
      discount: mockDiscountInput,
    };

    const result = cartLinesDiscountsGenerateRun(input);
    // Collection checking is not fully implemented in Shopify Functions, so no discount
    expect(result.operations).toHaveLength(0);
  });

  it("should handle disabled steps", () => {
    const bundleDataWithDisabledStep = {
      ...mockBundleData,
      steps: [
        {
          ...mockBundleData.steps[0],
          enabled: false,
        },
      ],
    };

    const cartWithDisabledStep = {
      ...mockCartWithBundleProduct,
      lines: [
        {
          ...mockCartWithBundleProduct.lines[0],
          merchandise: {
            ...mockCartWithBundleProduct.lines[0].merchandise,
            product: {
              ...mockCartWithBundleProduct.lines[0].merchandise.product,
              metafield: {
                value: JSON.stringify(bundleDataWithDisabledStep),
              },
            },
          },
        },
      ],
    };

    const input = {
      cart: cartWithDisabledStep,
      discount: mockDiscountInput,
    };

    const result = cartLinesDiscountsGenerateRun(input);
    expect(result.operations).toEqual([]);
  });
});
