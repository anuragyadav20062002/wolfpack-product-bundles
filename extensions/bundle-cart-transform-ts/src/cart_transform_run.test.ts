import { describe, it, expect } from "vitest";
import { cartTransformRun } from "./cart_transform_run";

describe("cartTransformRun", () => {
  it("returns empty operations for empty cart", () => {
    const input = {
      cart: {
        lines: [],
        cost: {
          totalAmount: { amount: "0", currencyCode: "USD" },
          subtotalAmount: { amount: "0", currencyCode: "USD" },
        },
      },
    };

    const result = cartTransformRun(input);
    expect(result.operations).toEqual([]);
  });

  it("returns empty operations when no bundles in cart", () => {
    const input = {
      cart: {
        lines: [
          {
            id: "line1",
            quantity: 1,
            merchandise: {
              __typename: "ProductVariant",
              id: "variant1",
              product: {
                id: "product1",
                metafield: null,
              },
            },
            cost: {
              amountPerQuantity: { amount: "10.00", currencyCode: "USD" },
              totalAmount: { amount: "10.00", currencyCode: "USD" },
            },
          },
        ],
        cost: {
          totalAmount: { amount: "10.00", currencyCode: "USD" },
          subtotalAmount: { amount: "10.00", currencyCode: "USD" },
        },
      },
    };

    const result = cartTransformRun(input);
    expect(result.operations).toEqual([]);
  });

  it("transforms bundle when conditions are met", () => {
    const bundleData = {
      id: "bundle1",
      name: "Test Bundle",
      allBundleProductIds: ["product1", "product2"],
      pricing: {
        enableDiscount: true,
        discountMethod: "fixed_amount_off",
        rules: [
          {
            discountOn: "quantity",
            minimumQuantity: 2,
            fixedAmountOff: 5.0,
            percentageOff: 0,
          },
        ],
      },
    };

    const input = {
      cart: {
        lines: [
          {
            id: "line1",
            quantity: 1,
            merchandise: {
              __typename: "ProductVariant",
              id: "variant1",
              product: {
                id: "product1",
                metafield: {
                  value: JSON.stringify(bundleData),
                },
              },
            },
            cost: {
              amountPerQuantity: { amount: "10.00", currencyCode: "USD" },
              totalAmount: { amount: "10.00", currencyCode: "USD" },
            },
          },
          {
            id: "line2",
            quantity: 1,
            merchandise: {
              __typename: "ProductVariant",
              id: "variant2",
              product: {
                id: "product2",
                metafield: {
                  value: JSON.stringify(bundleData),
                },
              },
            },
            cost: {
              amountPerQuantity: { amount: "15.00", currencyCode: "USD" },
              totalAmount: { amount: "15.00", currencyCode: "USD" },
            },
          },
        ],
        cost: {
          totalAmount: { amount: "25.00", currencyCode: "USD" },
          subtotalAmount: { amount: "25.00", currencyCode: "USD" },
        },
      },
    };

    const result = cartTransformRun(input);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toHaveProperty("merge");
  });

  it("skips transformation when bundle conditions not met", () => {
    const bundleData = {
      id: "bundle1",
      name: "Test Bundle",
      allBundleProductIds: ["product1", "product2"],
      pricing: {
        enableDiscount: true,
        discountMethod: "fixed_amount_off",
        rules: [
          {
            discountOn: "quantity",
            minimumQuantity: 3, // Requires 3 items, but only 2 in cart
            fixedAmountOff: 5.0,
            percentageOff: 0,
          },
        ],
      },
    };

    const input = {
      cart: {
        lines: [
          {
            id: "line1",
            quantity: 1,
            merchandise: {
              __typename: "ProductVariant",
              id: "variant1",
              product: {
                id: "product1",
                metafield: {
                  value: JSON.stringify(bundleData),
                },
              },
            },
            cost: {
              amountPerQuantity: { amount: "10.00", currencyCode: "USD" },
              totalAmount: { amount: "10.00", currencyCode: "USD" },
            },
          },
          {
            id: "line2",
            quantity: 1,
            merchandise: {
              __typename: "ProductVariant",
              id: "variant2",
              product: {
                id: "product2",
                metafield: {
                  value: JSON.stringify(bundleData),
                },
              },
            },
            cost: {
              amountPerQuantity: { amount: "15.00", currencyCode: "USD" },
              totalAmount: { amount: "15.00", currencyCode: "USD" },
            },
          },
        ],
        cost: {
          totalAmount: { amount: "25.00", currencyCode: "USD" },
          subtotalAmount: { amount: "25.00", currencyCode: "USD" },
        },
      },
    };

    const result = cartTransformRun(input);
    expect(result.operations).toEqual([]);
  });

  it("handles percentage discount correctly", () => {
    const bundleData = {
      id: "bundle1",
      name: "Percentage Bundle",
      allBundleProductIds: ["product1", "product2"],
      pricing: {
        enableDiscount: true,
        discountMethod: "percentage_off",
        rules: [
          {
            discountOn: "quantity",
            minimumQuantity: 2,
            fixedAmountOff: 0,
            percentageOff: 20,
          },
        ],
      },
    };

    const input = {
      cart: {
        lines: [
          {
            id: "line1",
            quantity: 1,
            merchandise: {
              __typename: "ProductVariant",
              id: "variant1",
              product: {
                id: "product1",
                metafield: {
                  value: JSON.stringify(bundleData),
                },
              },
            },
            cost: {
              amountPerQuantity: { amount: "10.00", currencyCode: "USD" },
              totalAmount: { amount: "10.00", currencyCode: "USD" },
            },
          },
          {
            id: "line2",
            quantity: 1,
            merchandise: {
              __typename: "ProductVariant",
              id: "variant2",
              product: {
                id: "product2",
                metafield: {
                  value: JSON.stringify(bundleData),
                },
              },
            },
            cost: {
              amountPerQuantity: { amount: "20.00", currencyCode: "USD" },
              totalAmount: { amount: "20.00", currencyCode: "USD" },
            },
          },
        ],
        cost: {
          totalAmount: { amount: "30.00", currencyCode: "USD" },
          subtotalAmount: { amount: "30.00", currencyCode: "USD" },
        },
      },
    };

    const result = cartTransformRun(input);
    expect(result.operations).toHaveLength(1);
    
    // The bundle should show savings of $6.00 (20% of $30)
    const operation = result.operations[0];
    expect(operation).toHaveProperty("merge");
    expect(operation).toHaveProperty("update");
  });
});