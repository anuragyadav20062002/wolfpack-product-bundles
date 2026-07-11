export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageModalStateMethods } = require('../../../app/assets/widgets/product-page/methods/modal-state-methods.js');

function makeConditionContext(overrides: Record<string, unknown> = {}) {
  return {
    ...ProductPageModalStateMethods,
    selectedBundle: {
      steps: [],
    },
    selectedProducts: [],
    stepProductData: [],
    findProductBySelectionKey(products: Array<Record<string, unknown>>, selectionKey: string) {
      return products.find(product => (
        product.variantId === selectionKey
        || product.id === selectionKey
        || product.parentProductId === selectionKey
      )) ?? null;
    },
    ...overrides,
  };
}

describe('PPB Product List step conditions', () => {
  it('validates category amount rules from selected product value instead of selected quantity', () => {
    const context = makeConditionContext({
      selectedBundle: {
        steps: [{
          categories: [{
            categoryId: 'category-1',
            products: [{ id: 'gid://shopify/Product/9001' }],
            conditions: [{ type: 'amount', condition: 'greaterThanOrEqualTo', value: 100 }],
          }],
        }],
      },
      selectedProducts: [{ 'gid://shopify/ProductVariant/7001': 1 }],
      stepProductData: [[{
        id: 'gid://shopify/Product/9001',
        parentProductId: '9001',
        variantId: 'gid://shopify/ProductVariant/7001',
        price: 61900,
      }]],
    });

    expect(ProductPageModalStateMethods.validateStep.call(context, 0)).toBe(true);
  });

  it('keeps category amount rules unmet when selected product value is below the threshold', () => {
    const context = makeConditionContext({
      selectedBundle: {
        steps: [{
          categories: [{
            categoryId: 'category-1',
            products: [{ id: 'gid://shopify/Product/9001' }],
            conditions: [{ type: 'amount', condition: 'greaterThanOrEqualTo', value: 100 }],
          }],
        }],
      },
      selectedProducts: [{ 'gid://shopify/ProductVariant/7001': 1 }],
      stepProductData: [[{
        id: 'gid://shopify/Product/9001',
        parentProductId: '9001',
        variantId: 'gid://shopify/ProductVariant/7001',
        price: 6360,
      }]],
    });

    expect(ProductPageModalStateMethods.validateStep.call(context, 0)).toBe(false);
  });

  it('blocks forward access when a previous required step is incomplete', () => {
    const context = makeConditionContext({
      selectedBundle: {
        steps: [
          { conditionType: 'quantity', conditionOperator: 'greater_than_or_equal_to', conditionValue: 2 },
          { conditionType: 'quantity', conditionOperator: 'greater_than_or_equal_to', conditionValue: 1 },
        ],
      },
      selectedProducts: [{ '101': 1 }, {}],
    });

    expect(ProductPageModalStateMethods.isStepAccessible.call(context, 1)).toBe(false);
  });

  it('allows forward access after previous required step conditions are complete', () => {
    const context = makeConditionContext({
      selectedBundle: {
        steps: [
          { conditionType: 'quantity', conditionOperator: 'greater_than_or_equal_to', conditionValue: 2 },
          { conditionType: 'quantity', conditionOperator: 'greater_than_or_equal_to', conditionValue: 1 },
        ],
      },
      selectedProducts: [{ '101': 2 }, {}],
    });

    expect(ProductPageModalStateMethods.isStepAccessible.call(context, 1)).toBe(true);
  });
});
