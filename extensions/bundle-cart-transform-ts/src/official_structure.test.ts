// Test cart transform with official Shopify metafield structure
import { describe, it, expect } from 'vitest';
import { cartTransformRun } from './cart_transform_run';

describe('Official Shopify Structure Tests', () => {
  it('should merge bundle components using official component_parents structure', () => {
    // Test data following official Shopify example
    const input = {
      cart: {
        lines: [
          // Component 1: Shirt (has component_parents metafield)
          {
            id: "gid://shopify/CartLine/1",
            quantity: 2, // Has 2 shirts, needs 2 for bundle
            merchandise: {
              __typename: "ProductVariant",
              id: "gid://shopify/ProductVariant/3", // Shirt variant
              title: "Blue Shirt",
              // This component belongs to bundle parent variant 6
              component_parents: {
                value: JSON.stringify([
                  {
                    "id": "gid://shopify/ProductVariant/6",
                    "component_reference": {
                      "value": [
                        "gid://shopify/ProductVariant/3", // shirt
                        "gid://shopify/ProductVariant/4"  // pants
                      ]
                    },
                    "component_quantities": {
                      "value": [2, 1] // 2 shirts, 1 pants
                    },
                    "price_adjustment": 10 // 10% discount
                  }
                ])
              }
            },
            cost: {
              amountPerQuantity: { amount: "10.00", currencyCode: "USD" },
              totalAmount: { amount: "20.00", currencyCode: "USD" },
            },
          },
          // Component 2: Pants (has component_parents metafield)
          {
            id: "gid://shopify/CartLine/2",
            quantity: 1, // Has 1 pants, needs 1 for bundle
            merchandise: {
              __typename: "ProductVariant",
              id: "gid://shopify/ProductVariant/4", // Pants variant
              title: "Black Pants",
              // This component belongs to bundle parent variant 6
              component_parents: {
                value: JSON.stringify([
                  {
                    "id": "gid://shopify/ProductVariant/6",
                    "component_reference": {
                      "value": [
                        "gid://shopify/ProductVariant/3", // shirt
                        "gid://shopify/ProductVariant/4"  // pants
                      ]
                    },
                    "component_quantities": {
                      "value": [2, 1] // 2 shirts, 1 pants
                    },
                    "price_adjustment": 10 // 10% discount
                  }
                ])
              }
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
    console.log('Test result operations:', JSON.stringify(result.operations, null, 2));
    
    // Should create 1 merge operation
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toHaveProperty("merge");
    
    const mergeOp = result.operations[0].merge;
    expect(mergeOp.parentVariantId).toBe("gid://shopify/ProductVariant/6");
    expect(mergeOp.cartLines).toHaveLength(2);
    expect(mergeOp.price?.percentageDecrease?.value).toBe(10);
  });

  it('should expand bundle using official component_reference structure', () => {
    const input = {
      cart: {
        lines: [
          // Bundle parent product (has component_reference and component_quantities)
          {
            id: "gid://shopify/CartLine/1",
            quantity: 1,
            merchandise: {
              __typename: "ProductVariant",
              id: "gid://shopify/ProductVariant/6", // Bundle parent
              title: "Complete Bundle",
              // Bundle contains 2 shirts + 1 pants
              component_reference: {
                value: JSON.stringify([
                  "gid://shopify/ProductVariant/3", // shirt
                  "gid://shopify/ProductVariant/4"  // pants
                ])
              },
              component_quantities: {
                value: JSON.stringify([2, 1]) // 2 shirts, 1 pants
              },
              price_adjustment: {
                value: "10.5" // 10.5% discount
              }
            },
            cost: {
              amountPerQuantity: { amount: "30.00", currencyCode: "USD" },
              totalAmount: { amount: "30.00", currencyCode: "USD" },
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
    console.log('Expand test result:', JSON.stringify(result.operations, null, 2));
    
    // Should create 1 expand operation
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toHaveProperty("expand");
    
    const expandOp = result.operations[0].expand;
    expect(expandOp.cartLineId).toBe("gid://shopify/CartLine/1");
    expect(expandOp.expandedCartItems).toHaveLength(2);
    expect(expandOp.expandedCartItems[0].merchandiseId).toBe("gid://shopify/ProductVariant/3");
    expect(expandOp.expandedCartItems[0].quantity).toBe(2);
    expect(expandOp.expandedCartItems[1].merchandiseId).toBe("gid://shopify/ProductVariant/4");
    expect(expandOp.expandedCartItems[1].quantity).toBe(1);
    expect(expandOp.price?.percentageDecrease?.value).toBe(10.5);
  });
});