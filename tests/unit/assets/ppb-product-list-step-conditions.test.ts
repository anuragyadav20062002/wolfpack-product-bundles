export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  ProductPageModalStateMethods,
  formatCascadeStepLimitToast,
  formatProductPageStepValidationToast,
} = require('../../../app/assets/widgets/product-page/methods/modal-state-methods.js');
const {
  ProductPageLayoutShellMethods,
  shouldUseCascadeStepFlow,
  getCascadeStepNavigationState,
} = require('../../../app/assets/widgets/product-page/methods/layout-shell-methods.js');

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

  it('enables step-flow mode only for multi-step Product List bundles', () => {
    expect(shouldUseCascadeStepFlow({
      isInpage: true,
      isCascade: true,
      steps: [{ id: 'step-1' }, { id: 'step-2' }],
    })).toBe(true);

    expect(shouldUseCascadeStepFlow({
      isInpage: true,
      isCascade: true,
      steps: [{ id: 'step-1' }],
    })).toBe(false);

    expect(shouldUseCascadeStepFlow({
      isInpage: true,
      isCascade: false,
      steps: [{ id: 'step-1' }, { id: 'step-2' }],
    })).toBe(false);
  });

  it('blocks forward Product List navigation until the current step is complete', () => {
    expect(getCascadeStepNavigationState({
      currentStepIndex: 0,
      direction: 1,
      stepCount: 2,
      isCurrentStepValid: false,
    })).toEqual({ targetStepIndex: 0, blocked: true, isFinal: false });
  });

  it('moves forward after the current Product List step is complete', () => {
    expect(getCascadeStepNavigationState({
      currentStepIndex: 0,
      direction: 1,
      stepCount: 2,
      isCurrentStepValid: true,
    })).toEqual({ targetStepIndex: 1, blocked: false, isFinal: false });
  });

  it('moves backward without validating the current Product List step', () => {
    expect(getCascadeStepNavigationState({
      currentStepIndex: 1,
      direction: -1,
      stepCount: 2,
      isCurrentStepValid: false,
    })).toEqual({ targetStepIndex: 0, blocked: false, isFinal: false });
  });

  it('restores focus to the active Product List step after its step strip rerenders', () => {
    const originalDocument = global.document;
    const replacementButtons = [{ focus: jest.fn() }, { focus: jest.fn() }];
    global.document = createStepFlowDocument() as unknown as Document;
    const context = {
      ...ProductPageLayoutShellMethods,
      currentStepIndex: 0,
      selectedBundle: {
        steps: [{ name: 'Step 1' }, { name: 'Step 2' }],
      },
      elements: {
        stepsContainer: {
          querySelectorAll: jest.fn(() => replacementButtons),
        },
      },
      validateStep: jest.fn(() => true),
      isStepAccessible: jest.fn(() => true),
      renderSteps: jest.fn(),
      renderFooter: jest.fn(),
      updateAddToCartButton: jest.fn(),
    } as any;

    try {
      const header = context._createCascadeStepFlowHeader();
      header.children[1].dispatch('click');

      expect(context.currentStepIndex).toBe(1);
      expect(replacementButtons[1].focus).toHaveBeenCalledTimes(1);
    } finally {
      global.document = originalDocument;
    }
  });

  it('reports the final Product List step instead of navigating past it', () => {
    expect(getCascadeStepNavigationState({
      currentStepIndex: 1,
      direction: 1,
      stepCount: 2,
      isCurrentStepValid: true,
    })).toEqual({ targetStepIndex: 1, blocked: false, isFinal: true });
  });

  it('formats the Product List exact-rule over-target message like EB', () => {
    expect(formatCascadeStepLimitToast('exactly', 1)).toBe('Add exactly 01 products on this step');
  });

  it('formats a modal lower-bound rule like EB', () => {
    expect(formatProductPageStepValidationToast({
      conditionType: 'quantity',
      conditionOperator: 'greater_than_or_equal_to',
      conditionValue: 2,
    })).toBe('Add at least 02 products on this step');
  });

  it('formats a modal exact rule like EB', () => {
    expect(formatProductPageStepValidationToast({
      conditionType: 'quantity',
      conditionOperator: 'equal_to',
      conditionValue: 1,
    })).toBe('Add exactly 01 products on this step');
  });
});

function createStepFlowDocument() {
  return {
    createElement: (tagName: string) => {
      const listeners = new Map<string, () => void>();
      return {
        tagName: tagName.toUpperCase(),
        children: [] as any[],
        className: '',
        classList: { toggle: jest.fn() },
        disabled: false,
        setAttribute: jest.fn(),
        addEventListener(name: string, listener: () => void) {
          listeners.set(name, listener);
        },
        appendChild(child: any) {
          this.children.push(child);
          return child;
        },
        dispatch(name: string) {
          listeners.get(name)?.();
        },
        set innerHTML(_value: string) {},
      };
    },
  };
}
