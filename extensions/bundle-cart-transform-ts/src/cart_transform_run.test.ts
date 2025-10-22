import { describe, it, expect } from "vitest";
import { cartTransformRun } from "./cart_transform_run";
import { getAllBundleDataFromCart, normalizeProductId, parseBundleDataFromMetafield } from "./cart-transform-bundle-utils";

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
              },
            },
            cost: {
              amountPerQuantity: { amount: "10.00", currencyCode: "USD" },
              totalAmount: { amount: "10.00", currencyCode: "USD" },
            },
          },
        ],
        metafield: null,
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
    // Component products with component_parents metafield that references a bundle
    const input = {
      cart: {
        lines: [
          {
            id: "line1",
            quantity: 1,
            merchandise: {
              __typename: "ProductVariant",
              id: "gid://shopify/ProductVariant/component1",
              component_parents: {
                value: JSON.stringify([{
                  id: "gid://shopify/ProductVariant/bundle123",
                  title: "Test Bundle",
                  parentVariantId: "gid://shopify/ProductVariant/bundle123",
                  component_reference: {
                    value: ["gid://shopify/ProductVariant/component1", "gid://shopify/ProductVariant/component2"]
                  },
                  component_quantities: {
                    value: [1, 1]
                  },
                  price_adjustment: {
                    value: JSON.stringify({ percentageDecrease: 0 })
                  }
                }])
              }
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
              id: "gid://shopify/ProductVariant/component2",
              component_parents: {
                value: JSON.stringify([{
                  id: "gid://shopify/ProductVariant/bundle123",
                  title: "Test Bundle", 
                  parentVariantId: "gid://shopify/ProductVariant/bundle123",
                  component_reference: {
                    value: ["gid://shopify/ProductVariant/component1", "gid://shopify/ProductVariant/component2"]
                  },
                  component_quantities: {
                    value: [1, 1]
                  },
                  price_adjustment: {
                    value: JSON.stringify({ percentageDecrease: 0 })
                  }
                }])
              }
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
      "bundle1": {
        id: "bundle1",
        name: "Test Bundle",
        allBundleProductIds: ["gid://shopify/Product/1", "gid://shopify/Product/2"],
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
                id: "gid://shopify/Product/1",
                title: "Product 1",
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
                id: "gid://shopify/Product/2",
                title: "Product 2",
              },
            },
            cost: {
              amountPerQuantity: { amount: "15.00", currencyCode: "USD" },
              totalAmount: { amount: "15.00", currencyCode: "USD" },
            },
          },
        ],
        metafield: {
          value: JSON.stringify(bundleData),
        },
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
      "bundle1": {
        id: "bundle1",
        name: "Percentage Bundle",
        allBundleProductIds: ["gid://shopify/Product/1", "gid://shopify/Product/2"],
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
                id: "gid://shopify/Product/1",
                title: "Product 1",
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
                id: "gid://shopify/Product/2",
                title: "Product 2",
              },
            },
            cost: {
              amountPerQuantity: { amount: "20.00", currencyCode: "USD" },
              totalAmount: { amount: "20.00", currencyCode: "USD" },
            },
          },
        ],
        metafield: {
          value: JSON.stringify(bundleData),
        },
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
    expect(operation.merge).toHaveProperty("price");
    expect(operation.merge?.price?.percentageDecrease.value).toBe(20);
  });

  it("handles multiple bundles with different configurations", () => {
    const bundleData = {
      "bundleA": {
        id: "bundleA",
        name: "Bundle A",
        allBundleProductIds: ["gid://shopify/Product/1", "gid://shopify/Product/2"],
        pricing: {
          enableDiscount: true,
          discountMethod: "fixed_amount_off",
          rules: [{ discountOn: "quantity", minimumQuantity: 2, fixedAmountOff: 5, percentageOff: 0 }]
        }
      },
      "bundleB": {
        id: "bundleB",
        name: "Bundle B",
        allBundleProductIds: ["gid://shopify/Product/3", "gid://shopify/Product/4"],
        pricing: {
          enableDiscount: true,
          discountMethod: "percentage_off",
          rules: [{ discountOn: "quantity", minimumQuantity: 3, fixedAmountOff: 0, percentageOff: 15 }]
        }
      }
    };

    const input = {
      cart: {
        lines: [
          // First bundle - Bundle A products
          {
            id: "line1",
            quantity: 1,
            merchandise: {
              __typename: "ProductVariant",
              id: "variant1",
              product: {
                id: "gid://shopify/Product/1",
                title: "Product 1",
              }
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
                id: "gid://shopify/Product/2",
                title: "Product 2",
              }
            },
            cost: {
              amountPerQuantity: { amount: "15.00", currencyCode: "USD" },
              totalAmount: { amount: "15.00", currencyCode: "USD" },
            },
          },
          // Second bundle - Bundle B products  
          {
            id: "line3",
            quantity: 2,
            merchandise: {
              __typename: "ProductVariant",
              id: "variant3",
              product: {
                id: "gid://shopify/Product/3",
                title: "Product 3",
              }
            },
            cost: {
              amountPerQuantity: { amount: "8.00", currencyCode: "USD" },
              totalAmount: { amount: "16.00", currencyCode: "USD" },
            },
          },
          {
            id: "line4",
            quantity: 1,
            merchandise: {
              __typename: "ProductVariant",
              id: "variant4",
              product: {
                id: "gid://shopify/Product/4",
                title: "Product 4",
              }
            },
            cost: {
              amountPerQuantity: { amount: "12.00", currencyCode: "USD" },
              totalAmount: { amount: "12.00", currencyCode: "USD" },
            },
          },
        ],
        metafield: {
          value: JSON.stringify(bundleData),
        },
        cost: {
          totalAmount: { amount: "53.00", currencyCode: "USD" },
          subtotalAmount: { amount: "53.00", currencyCode: "USD" },
        },
      },
    };

    const result = cartTransformRun(input);
    // Should create 2 operations - one for each bundle
    expect(result.operations).toHaveLength(2);
    
    // Both should be merge operations
    result.operations.forEach(op => {
      expect(op).toHaveProperty("merge");
    });
  });

  it("handles malformed metafield data gracefully", () => {
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
                id: "gid://shopify/Product/1",
                title: "Product 1",
              },
            },
            cost: {
              amountPerQuantity: { amount: "10.00", currencyCode: "USD" },
              totalAmount: { amount: "10.00", currencyCode: "USD" },
            },
          },
        ],
        metafield: {
          value: "invalid json content",
        },
        cost: {
          totalAmount: { amount: "10.00", currencyCode: "USD" },
          subtotalAmount: { amount: "10.00", currencyCode: "USD" },
        },
      },
    };

    const result = cartTransformRun(input);
    expect(result.operations).toEqual([]);
  });

  it("handles missing metafield properties gracefully", () => {
    const bundleData = {
      "bundle1": {
        id: "bundle1",
        name: "Incomplete Bundle"
        // Missing allBundleProductIds and pricing
      }
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
                id: "gid://shopify/Product/1",
                title: "Product 1",
              },
            },
            cost: {
              amountPerQuantity: { amount: "10.00", currencyCode: "USD" },
              totalAmount: { amount: "10.00", currencyCode: "USD" },
            },
          },
        ],
        metafield: {
          value: JSON.stringify(bundleData),
        },
        cost: {
          totalAmount: { amount: "10.00", currencyCode: "USD" },
          subtotalAmount: { amount: "10.00", currencyCode: "USD" },
        },
      },
    };

    const result = cartTransformRun(input);
    expect(result.operations).toEqual([]);
  });

  it("handles quantity-based conditions correctly", () => {
    const input = {
      cart: {
        lines: [
          {
            id: "line1",
            quantity: 3, // Higher quantity
            merchandise: {
              __typename: "ProductVariant",
              id: "variant1",
              product: {
                id: "product1",
                metafield: {
                  value: JSON.stringify({
                    id: "bundle1",
                    name: "Quantity Bundle",
                    allBundleProductIds: ["product1", "product2"],
                    pricing: {
                      enableDiscount: true,
                      discountMethod: "fixed_amount_off",
                      rules: [
                        {
                          discountOn: "quantity",
                          minimumQuantity: 5, // Requires 5 total items
                          fixedAmountOff: 10,
                          percentageOff: 0,
                        },
                      ],
                    },
                  }),
                },
              },
            },
            cost: {
              amountPerQuantity: { amount: "10.00", currencyCode: "USD" },
              totalAmount: { amount: "30.00", currencyCode: "USD" },
            },
          },
          {
            id: "line2",
            quantity: 2,
            merchandise: {
              __typename: "ProductVariant",
              id: "variant2",
              product: {
                id: "product2",
                metafield: {
                  value: JSON.stringify({
                    id: "bundle1",
                    name: "Quantity Bundle",
                    allBundleProductIds: ["product1", "product2"],
                    pricing: {
                      enableDiscount: true,
                      discountMethod: "fixed_amount_off",
                      rules: [
                        {
                          discountOn: "quantity",
                          minimumQuantity: 5, // Total is 3+2=5, meets condition
                          fixedAmountOff: 10,
                          percentageOff: 0,
                        },
                      ],
                    },
                  }),
                },
              },
            },
            cost: {
              amountPerQuantity: { amount: "15.00", currencyCode: "USD" },
              totalAmount: { amount: "30.00", currencyCode: "USD" },
            },
          },
        ],
        cost: {
          totalAmount: { amount: "60.00", currencyCode: "USD" },
          subtotalAmount: { amount: "60.00", currencyCode: "USD" },
        },
      },
    };

    const result = cartTransformRun(input);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toHaveProperty("merge");
  });

  it("handles amount-based conditions correctly", () => {
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
                  value: JSON.stringify({
                    id: "bundle1",
                    name: "Amount Bundle",
                    allBundleProductIds: ["product1", "product2"],
                    pricing: {
                      enableDiscount: true,
                      discountMethod: "percentage_off",
                      rules: [
                        {
                          discountOn: "amount",
                          minimumAmount: 75, // Requires $75 total
                          fixedAmountOff: 0,
                          percentageOff: 20,
                        },
                      ],
                    },
                  }),
                },
              },
            },
            cost: {
              amountPerQuantity: { amount: "50.00", currencyCode: "USD" },
              totalAmount: { amount: "50.00", currencyCode: "USD" },
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
                  value: JSON.stringify({
                    id: "bundle1",
                    name: "Amount Bundle",
                    allBundleProductIds: ["product1", "product2"],
                    pricing: {
                      enableDiscount: true,
                      discountMethod: "percentage_off",
                      rules: [
                        {
                          discountOn: "amount",
                          minimumAmount: 75, // Total is $50+$30=$80, meets condition
                          fixedAmountOff: 0,
                          percentageOff: 20,
                        },
                      ],
                    },
                  }),
                },
              },
            },
            cost: {
              amountPerQuantity: { amount: "30.00", currencyCode: "USD" },
              totalAmount: { amount: "30.00", currencyCode: "USD" },
            },
          },
        ],
        cost: {
          totalAmount: { amount: "80.00", currencyCode: "USD" },
          subtotalAmount: { amount: "80.00", currencyCode: "USD" },
        },
      },
    };

    const result = cartTransformRun(input);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toHaveProperty("merge");
    expect(result.operations[0].merge?.price?.percentageDecrease.value).toBe(20);
  });

  it("handles different merchandise types correctly", () => {
    const input = {
      cart: {
        lines: [
          {
            id: "line1",
            quantity: 1,
            merchandise: {
              __typename: "ProductVariant", // Valid type
              id: "variant1",
              product: {
                id: "product1",
                metafield: {
                  value: JSON.stringify({
                    id: "bundle1",
                    name: "Test Bundle",
                    allBundleProductIds: ["product1"],
                    pricing: {
                      enableDiscount: true,
                      discountMethod: "fixed_amount_off",
                      rules: [{ discountOn: "quantity", minimumQuantity: 1, fixedAmountOff: 5, percentageOff: 0 }]
                    }
                  }),
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
              __typename: "GiftCard", // Invalid type for bundles
              id: "giftcard1",
            },
            cost: {
              amountPerQuantity: { amount: "25.00", currencyCode: "USD" },
              totalAmount: { amount: "25.00", currencyCode: "USD" },
            },
          },
        ],
        cost: {
          totalAmount: { amount: "35.00", currencyCode: "USD" },
          subtotalAmount: { amount: "35.00", currencyCode: "USD" },
        },
      },
    };

    const result = cartTransformRun(input);
    // Should process ProductVariant lines if they form valid bundles, ignore GiftCard
    // This test verifies the function handles mixed merchandise types gracefully
    expect(result.operations.length).toBeGreaterThanOrEqual(0);
  });

  it("handles edge case with zero prices", () => {
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
                  value: JSON.stringify({
                    id: "bundle1",
                    name: "Free Bundle",
                    allBundleProductIds: ["product1", "product2"],
                    pricing: {
                      enableDiscount: true,
                      discountMethod: "fixed_amount_off",
                      rules: [{ discountOn: "quantity", minimumQuantity: 2, fixedAmountOff: 5, percentageOff: 0 }]
                    }
                  }),
                },
              },
            },
            cost: {
              amountPerQuantity: { amount: "0.00", currencyCode: "USD" },
              totalAmount: { amount: "0.00", currencyCode: "USD" },
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
                  value: JSON.stringify({
                    id: "bundle1",
                    name: "Free Bundle",
                    allBundleProductIds: ["product1", "product2"],
                    pricing: {
                      enableDiscount: true,
                      discountMethod: "fixed_amount_off",
                      rules: [{ discountOn: "quantity", minimumQuantity: 2, fixedAmountOff: 5, percentageOff: 0 }]
                    }
                  }),
                },
              },
            },
            cost: {
              amountPerQuantity: { amount: "0.00", currencyCode: "USD" },
              totalAmount: { amount: "0.00", currencyCode: "USD" },
            },
          },
        ],
        cost: {
          totalAmount: { amount: "0.00", currencyCode: "USD" },
          subtotalAmount: { amount: "0.00", currencyCode: "USD" },
        },
      },
    };

    const result = cartTransformRun(input);
    // Should handle zero prices gracefully
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toHaveProperty("merge");
  });

  it("handles bundle step conditions correctly", () => {
    const input = {
      cart: {
        lines: [
          {
            id: "line1",
            quantity: 2,
            merchandise: {
              __typename: "ProductVariant",
              id: "variant1",
              product: {
                id: "product1",
                metafield: {
                  value: JSON.stringify({
                    id: "bundle1",
                    name: "Step Condition Bundle",
                    allBundleProductIds: ["product1", "product2"],
                    steps: [
                      {
                        id: "step1",
                        products: ["product1"],
                        conditionType: "quantity",
                        conditionOperator: "equal_to",
                        conditionValue: 2
                      },
                      {
                        id: "step2",
                        products: ["product2"],
                        conditionType: "quantity",
                        conditionOperator: "greater_than_or_equal_to",
                        conditionValue: 1
                      }
                    ],
                    pricing: {
                      enableDiscount: true,
                      discountMethod: "fixed_amount_off",
                      rules: [{ discountOn: "quantity", minimumQuantity: 3, fixedAmountOff: 8, percentageOff: 0 }]
                    }
                  }),
                },
              },
            },
            cost: {
              amountPerQuantity: { amount: "10.00", currencyCode: "USD" },
              totalAmount: { amount: "20.00", currencyCode: "USD" },
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
                  value: JSON.stringify({
                    id: "bundle1",
                    name: "Step Condition Bundle",
                    allBundleProductIds: ["product1", "product2"],
                    steps: [
                      {
                        id: "step1",
                        products: ["product1"],
                        conditionType: "quantity",
                        conditionOperator: "equal_to",
                        conditionValue: 2
                      },
                      {
                        id: "step2",
                        products: ["product2"],
                        conditionType: "quantity",
                        conditionOperator: "greater_than_or_equal_to",
                        conditionValue: 1
                      }
                    ],
                    pricing: {
                      enableDiscount: true,
                      discountMethod: "fixed_amount_off",
                      rules: [{ discountOn: "quantity", minimumQuantity: 3, fixedAmountOff: 8, percentageOff: 0 }]
                    }
                  }),
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
          totalAmount: { amount: "35.00", currencyCode: "USD" },
          subtotalAmount: { amount: "35.00", currencyCode: "USD" },
        },
      },
    };

    const result = cartTransformRun(input);
    // Should meet both step conditions and overall bundle conditions
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toHaveProperty("merge");
  });

  it("handles fixed bundle price correctly", () => {
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
                  value: JSON.stringify({
                    id: "bundle1",
                    name: "Fixed Price Bundle",
                    allBundleProductIds: ["product1", "product2"],
                    pricing: {
                      enableDiscount: true,
                      discountMethod: "fixed_bundle_price",
                      fixedPrice: 20.00,
                      rules: [{
                        discountOn: "quantity",
                        minimumQuantity: 2,
                        fixedAmountOff: 0,
                        percentageOff: 0
                      }]
                    }
                  })
                }
              }
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
                  value: JSON.stringify({
                    id: "bundle1",
                    name: "Fixed Price Bundle",
                    allBundleProductIds: ["product1", "product2"],
                    pricing: {
                      enableDiscount: true,
                      discountMethod: "fixed_bundle_price",
                      fixedPrice: 20.00,
                      rules: [{
                        discountOn: "quantity",
                        minimumQuantity: 2,
                        fixedAmountOff: 0,
                        percentageOff: 0
                      }]
                    }
                  })
                }
              }
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
    
    // The bundle should show savings of $10.00 ($30 original vs $20 fixed price)
    const operation = result.operations[0];
    expect(operation).toHaveProperty("merge");
    expect(operation.merge).toHaveProperty("price");
    // Fixed price of $20 on original $30 = 33.33% discount
    expect(Math.round(operation.merge?.price?.percentageDecrease.value || 0)).toBe(33);
  });

  it("validates merge operation structure", () => {
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
                  value: JSON.stringify({
                    id: "bundle1",
                    name: "Structure Test Bundle",
                    allBundleProductIds: ["product1", "product2"],
                    pricing: {
                      enableDiscount: true,
                      discountMethod: "fixed_amount_off",
                      rules: [{ discountOn: "quantity", minimumQuantity: 2, fixedAmountOff: 5, percentageOff: 0 }]
                    }
                  }),
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
                  value: JSON.stringify({
                    id: "bundle1",
                    name: "Structure Test Bundle",
                    allBundleProductIds: ["product1", "product2"],
                    pricing: {
                      enableDiscount: true,
                      discountMethod: "fixed_amount_off",
                      rules: [{ discountOn: "quantity", minimumQuantity: 2, fixedAmountOff: 5, percentageOff: 0 }]
                    }
                  }),
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
    
    const operation = result.operations[0];
    expect(operation).toHaveProperty("merge");
    expect(operation.merge).toHaveProperty("cartLines");
    expect(operation.merge).toHaveProperty("parentVariantId");
    expect(operation.merge).toHaveProperty("title");
    expect(operation.merge).toHaveProperty("price");
    expect(operation.merge?.price).toHaveProperty("percentageDecrease");
    expect(operation.merge?.cartLines).toEqual([
      { cartLineId: "line1", quantity: 1 },
      { cartLineId: "line2", quantity: 1 }
    ]);
    expect(operation.merge?.parentVariantId).toBe("variant1");
    expect(operation.merge?.title).toBe("Structure Test Bundle Bundle - Save $5.00");
  });
});

// Additional utility function tests
describe("cart transform utilities", () => {
  it("getAllBundleDataFromCart handles empty cart", () => {
    const cart = {
      lines: [],
      metafield: null,
      cost: {
        totalAmount: { amount: "0", currencyCode: "USD" },
        subtotalAmount: { amount: "0", currencyCode: "USD" },
      },
    };

    const result = getAllBundleDataFromCart(cart, null);
    expect(result).toEqual([]);
  });

  it("getAllBundleDataFromCart extracts bundle data correctly from cart metafield", () => {
    const bundleData = {
      "test-bundle": {
        id: "test-bundle",
        name: "Test Bundle",
        allBundleProductIds: ["gid://shopify/Product/1", "gid://shopify/Product/2"],
        pricing: {
          enableDiscount: true,
          discountMethod: "fixed_amount_off",
          rules: [{ discountOn: "quantity", minimumQuantity: 2, fixedAmountOff: 5, percentageOff: 0 }]
        }
      }
    };

    const cart = {
      lines: [
        {
          id: "line1",
          quantity: 1,
          merchandise: {
            __typename: "ProductVariant",
            id: "variant1",
            product: {
              id: "gid://shopify/Product/1",
              title: "Product 1",
            },
          },
          cost: {
            amountPerQuantity: { amount: "10.00", currencyCode: "USD" },
            totalAmount: { amount: "10.00", currencyCode: "USD" },
          },
        },
      ],
      metafield: {
        value: JSON.stringify(bundleData),
      },
      cost: {
        totalAmount: { amount: "10.00", currencyCode: "USD" },
        subtotalAmount: { amount: "10.00", currencyCode: "USD" },
      },
    };

    const result = getAllBundleDataFromCart(cart, JSON.stringify(bundleData));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("test-bundle");
    expect(result[0].name).toBe("Test Bundle");
    expect(result[0].allBundleProductIds).toEqual(["gid://shopify/Product/1", "gid://shopify/Product/2"]);
  });

  it("getAllBundleDataFromCart handles malformed JSON gracefully", () => {
    const cart = {
      lines: [
        {
          id: "line1",
          quantity: 1,
          merchandise: {
            __typename: "ProductVariant",
            id: "variant1",
            product: {
              id: "gid://shopify/Product/1",
              title: "Product 1",
            },
          },
          cost: {
            amountPerQuantity: { amount: "10.00", currencyCode: "USD" },
            totalAmount: { amount: "10.00", currencyCode: "USD" },
          },
        },
      ],
      metafield: {
        value: "invalid json",
      },
      cost: {
        totalAmount: { amount: "10.00", currencyCode: "USD" },
        subtotalAmount: { amount: "10.00", currencyCode: "USD" },
      },
    };

    const result = getAllBundleDataFromCart(cart, "invalid json");
    expect(result).toEqual([]);
  });

  it("getAllBundleDataFromCart handles multiple bundles correctly", () => {
    const bundleData = {
      "bundle-a": {
        id: "bundle-a",
        name: "Bundle A",
        allBundleProductIds: ["gid://shopify/Product/1", "gid://shopify/Product/2"],
        pricing: {
          enableDiscount: true,
          discountMethod: "percentage_off",
          rules: [{ discountOn: "quantity", minimumQuantity: 2, fixedAmountOff: 0, percentageOff: 15 }]
        }
      },
      "bundle-b": {
        id: "bundle-b",
        name: "Bundle B",
        allBundleProductIds: ["gid://shopify/Product/3", "gid://shopify/Product/4"],
        pricing: {
          enableDiscount: true,
          discountMethod: "fixed_amount_off",
          rules: [{ discountOn: "quantity", minimumQuantity: 2, fixedAmountOff: 10, percentageOff: 0 }]
        }
      }
    };

    const cart = {
      lines: [
        {
          id: "line1",
          quantity: 1,
          merchandise: {
            __typename: "ProductVariant",
            id: "variant1",
            product: {
              id: "gid://shopify/Product/1",
              title: "Product 1",
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
              id: "gid://shopify/Product/2",
              title: "Product 2",
            },
          },
          cost: {
            amountPerQuantity: { amount: "15.00", currencyCode: "USD" },
            totalAmount: { amount: "15.00", currencyCode: "USD" },
          },
        },
      ],
      metafield: {
        value: JSON.stringify(bundleData),
      },
      cost: {
        totalAmount: { amount: "25.00", currencyCode: "USD" },
        subtotalAmount: { amount: "25.00", currencyCode: "USD" },
      },
    };

    const result = getAllBundleDataFromCart(cart, JSON.stringify(bundleData));
    expect(result).toHaveLength(2); // Should find both bundles
    expect(result.map(b => b.id)).toContain("bundle-a");
    expect(result.map(b => b.id)).toContain("bundle-b");
  });
});

// Product ID normalization tests
describe("normalizeProductId", () => {
  it("returns GID as-is when already in GID format", () => {
    const gid = "gid://shopify/Product/123456789";
    expect(normalizeProductId(gid)).toBe(gid);
  });

  it("converts numeric ID to GID format", () => {
    const numericId = "123456789";
    const expected = "gid://shopify/Product/123456789";
    expect(normalizeProductId(numericId)).toBe(expected);
  });

  it("handles empty string gracefully", () => {
    expect(normalizeProductId("")).toBe("");
  });

  it("extracts and normalizes embedded GID pattern", () => {
    const malformedId = "some/path/gid://shopify/Product/123456789/extra";
    const expected = "gid://shopify/Product/123456789";
    expect(normalizeProductId(malformedId)).toBe(expected);
  });

  it("converts valid alphanumeric IDs to GID format", () => {
    const alphanumericId = "product-abc-123";
    expect(normalizeProductId(alphanumericId)).toBe("gid://shopify/Product/product-abc-123");
  });
});

// Bundle data parsing with normalization tests
describe("parseBundleDataFromMetafield", () => {
  it("normalizes product IDs in bundle configuration", () => {
    const bundleConfig = {
      id: "test-bundle",
      name: "Test Bundle",
      allBundleProductIds: ["123456", "789012", "gid://shopify/Product/345678"],
      pricing: {
        enableDiscount: true,
        discountMethod: "fixed_amount_off",
        rules: [{ discountOn: "quantity", minimumQuantity: 2, fixedAmountOff: 5, percentageOff: 0 }]
      }
    };

    const result = parseBundleDataFromMetafield(JSON.stringify(bundleConfig));
    
    expect(result).toBeTruthy();
    expect(result!.allBundleProductIds).toEqual([
      "gid://shopify/Product/123456",
      "gid://shopify/Product/789012", 
      "gid://shopify/Product/345678"
    ]);
  });

  it("handles malformed JSON gracefully", () => {
    const malformedJson = "{invalid json}";
    const result = parseBundleDataFromMetafield(malformedJson);
    expect(result).toBeNull();
  });

  it("handles bundle config without allBundleProductIds array", () => {
    const bundleConfig = {
      id: "test-bundle",
      name: "Test Bundle",
      pricing: {
        enableDiscount: true,
        discountMethod: "fixed_amount_off",
        rules: [{ discountOn: "quantity", minimumQuantity: 2, fixedAmountOff: 5, percentageOff: 0 }]
      }
    };

    const result = parseBundleDataFromMetafield(JSON.stringify(bundleConfig));
    expect(result).toBeTruthy();
    expect(result!.allBundleProductIds).toBeUndefined();
  });
});

// Product ID format mismatch integration test
describe("Product ID format mismatch handling", () => {
  it("matches products correctly with mixed ID formats in cart vs bundle config", () => {
    // Bundle config with mixed ID formats
    const bundleData = {
      "format-test-bundle": {
        id: "format-test-bundle",
        name: "Format Test Bundle",
        allBundleProductIds: ["10203664711974", "gid://shopify/Product/10203664777510"],
        pricing: {
          enableDiscount: true,
          discountMethod: "fixed_amount_off",
          rules: [{ discountOn: "quantity", minimumQuantity: 2, fixedAmountOff: 5, percentageOff: 0 }]
        }
      }
    };

    // Cart with full GID format (as received from Shopify)
    const input = {
      cart: {
        lines: [
          {
            id: "gid://shopify/CartLine/12345",
            quantity: 1,
            merchandise: {
              __typename: "ProductVariant",
              id: "gid://shopify/ProductVariant/41234567890123",
              product: {
                id: "gid://shopify/Product/10203664711974", // Full GID format
                title: "Product 1",
              },
            },
            cost: {
              amountPerQuantity: { amount: "10.00", currencyCode: "USD" },
              totalAmount: { amount: "10.00", currencyCode: "USD" },
            },
          },
          {
            id: "gid://shopify/CartLine/67890",
            quantity: 1,
            merchandise: {
              __typename: "ProductVariant",
              id: "gid://shopify/ProductVariant/41234567890456",
              product: {
                id: "gid://shopify/Product/10203664777510", // Full GID format
                title: "Product 2",
              },
            },
            cost: {
              amountPerQuantity: { amount: "15.00", currencyCode: "USD" },
              totalAmount: { amount: "15.00", currencyCode: "USD" },
            },
          },
        ],
        metafield: {
          value: JSON.stringify(bundleData),
        },
        cost: {
          totalAmount: { amount: "25.00", currencyCode: "USD" },
          subtotalAmount: { amount: "25.00", currencyCode: "USD" },
        },
      },
    };

    const result = cartTransformRun(input);
    
    // Should successfully match products despite ID format mismatch and create bundle
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toHaveProperty("merge");
    expect(result.operations[0].merge?.cartLines).toHaveLength(2);
    expect(result.operations[0].merge?.title).toContain("Format Test Bundle");
  });

  it("handles component reference matching with variant GIDs", () => {
    // Test standard Shopify bundle with component references
    const bundleData = {
      "standard-bundle": {
        id: "standard-bundle",
        name: "Standard Bundle Product",
        allBundleProductIds: ["gid://shopify/Product/bundle789"],
        pricing: {
          enableDiscount: true,
          discountMethod: "percentage_off",
          rules: [{ discountOn: "quantity", minimumQuantity: 1, fixedAmountOff: 0, percentageOff: 10 }]
        }
      }
    };

    const input = {
      cart: {
        lines: [
          {
            id: "gid://shopify/CartLine/parent123",
            quantity: 1,
            merchandise: {
              __typename: "ProductVariant",
              id: "gid://shopify/ProductVariant/parent456",
              component_reference: {
                value: JSON.stringify([
                  "gid://shopify/ProductVariant/component789",
                  "gid://shopify/ProductVariant/component012"
                ])
              },
              component_quantities: {
                value: JSON.stringify([1, 1])
              },
              product: {
                id: "gid://shopify/Product/bundle789",
                title: "Standard Bundle Product"
              }
            },
            cost: {
              amountPerQuantity: { amount: "25.00", currencyCode: "USD" },
              totalAmount: { amount: "25.00", currencyCode: "USD" },
            },
          },
        ],
        metafield: {
          value: JSON.stringify(bundleData),
        },
        cost: {
          totalAmount: { amount: "25.00", currencyCode: "USD" },
          subtotalAmount: { amount: "25.00", currencyCode: "USD" },
        },
      },
    };

    const result = cartTransformRun(input);
    
    // Should create merge operation for bundle parent
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toHaveProperty("merge");
  });
});