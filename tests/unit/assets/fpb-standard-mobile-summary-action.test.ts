export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageMobileSummaryMethods } = require('../../../app/assets/widgets/full-page/methods/mobile-summary-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { shouldUseMobileSummarySlotTiles } = require('../../../app/assets/widgets/full-page/methods/mobile-summary-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getMobileBottomBarActionState } = require('../../../app/assets/widgets/full-page/methods/responsive-layout-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { shouldCategoryTabActivateProducts } = require('../../../app/assets/widgets/full-page/methods/product-grid-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  fullPageProductProcessingMethods,
  normalizeFullPageDirectDefaultProduct,
} = require('../../../app/assets/widgets/full-page/methods/product-processing-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  shouldAutoAdvanceFullPageStep,
  getFullPageStepConditionValidationMessage,
} = require('../../../app/assets/widgets/full-page/methods/selection-navigation-methods.js');

class FakeElement {
  className = '';
  disabled = false;
  private ownText = '';
  private children: FakeElement[] = [];
  private listeners: Record<string, Array<(event?: { preventDefault?: () => void; key?: string }) => void | Promise<void>>> = {};

  get textContent() {
    return [this.ownText, ...this.children.map((child) => child.textContent)].join('');
  }

  set textContent(value: string) {
    this.ownText = value;
  }

  append(...children: FakeElement[]) {
    this.children.push(...children);
  }

  addEventListener(type: string, listener: (event?: { preventDefault?: () => void; key?: string }) => void | Promise<void>) {
    this.listeners[type] ||= [];
    this.listeners[type].push(listener);
  }

  async click() {
    for (const listener of this.listeners.click || []) {
      await listener({});
    }
  }
}

const originalDocument = global.document;

beforeEach(() => {
  global.document = {
    createElement: () => new FakeElement(),
  } as unknown as Document;
});

afterAll(() => {
  global.document = originalDocument;
});

function createContext() {
  return {
    freeGiftStepIndex: -1,
    _resolveText: (key: string, fallback: string) => {
      if (key === 'addToCartButton') return 'Add To Cart';
      if (key === 'nextButton') return 'Next';
      return fallback;
    },
    canCheckoutWithBoxSelection: () => true,
    canNavigateToStep: () => false,
    canProceedToNextStep: () => false,
    addBundleToCart: jest.fn(),
    showBoxSelectionValidationMessage: jest.fn(),
    _emitStorefrontEvent: jest.fn(),
    _withWidgetActionBusy: jest.fn(),
    renderFullPageLayoutWithSidebar: jest.fn(),
  };
}

const currencyInfo = {
  calculation: { code: 'USD', symbol: '$', format: ['$', '{{amount}}'].join('') },
  display: { code: 'USD', symbol: '$', format: ['$', '{{amount}}'].join(''), rate: 1 },
  isMultiCurrency: false,
};

describe('FPB Standard mobile summary action', () => {
  it('keeps the final-step action as add to cart even when conditions are not complete', () => {
    const button = fullPageMobileSummaryMethods._createMobileSummaryActionButton.call(
      createContext(),
      {
        finalPrice: 829,
        currencyInfo,
        conditionlessMobile: false,
        hasSelectionMobile: false,
        isLastStep: true,
        isComplete: false,
      },
    );

    expect(button.textContent?.includes('Add To Cart')).toBe(true);
    expect(button.textContent?.includes('Next')).toBe(false);
    expect(button.disabled).toBe(true);
  });

  it('uses next for non-final steps without an add-on step', () => {
    const button = fullPageMobileSummaryMethods._createMobileSummaryActionButton.call(
      createContext(),
      {
        finalPrice: 0,
        currencyInfo,
        conditionlessMobile: false,
        hasSelectionMobile: false,
        isLastStep: false,
        isComplete: false,
      },
    );

    expect(button.textContent?.includes('Next')).toBe(true);
    expect(button.textContent?.includes('Add To Cart')).toBe(false);
  });

  it('advances the compact summary one step at a time before an add-on step', async () => {
    const context = {
      ...createContext(),
      currentStepIndex: 0,
      freeGiftStepIndex: 2,
      canNavigateToStep: jest.fn((stepIndex: number) => stepIndex === 1),
      canProceedToNextStep: jest.fn(() => true),
      _withWidgetActionBusy: jest.fn(async (callback: () => Promise<void>) => {
        await callback();
      }),
    };

    const button = fullPageMobileSummaryMethods._createMobileSummaryActionButton.call(
      context,
      {
        finalPrice: 829,
        currencyInfo,
        conditionlessMobile: false,
        hasSelectionMobile: false,
        isLastStep: false,
        isComplete: false,
      },
    );

    await button.click();

    expect(context.canNavigateToStep).toHaveBeenCalledWith(1);
    expect(context.currentStepIndex).toBe(1);
    expect(context._emitStorefrontEvent).toHaveBeenCalledWith('step-changed', {
      previousStepIndex: 0,
      currentStepIndex: 1,
      direction: 'next',
    });
    expect(context.renderFullPageLayoutWithSidebar).toHaveBeenCalledTimes(1);
  });

  it('keeps the alternate mobile bottom bar final-step action as add to cart when conditions are not complete', () => {
    const actionState = getMobileBottomBarActionState({
      conditionlessMobile: false,
      hasSelectionMobile: false,
      isLastStep: true,
      isComplete: false,
      boxSelectionValidMobile: true,
    });

    expect(actionState).toEqual({ shouldAddToCart: true, disabled: true });
  });

  it('keeps the alternate mobile bottom bar non-final action as next', () => {
    const actionState = getMobileBottomBarActionState({
      conditionlessMobile: false,
      hasSelectionMobile: false,
      isLastStep: false,
      isComplete: false,
      boxSelectionValidMobile: true,
    });

    expect(actionState).toEqual({ shouldAddToCart: false, disabled: false });
  });

  it('allows the compact mobile summary tray to expand with no selected products', () => {
    const classList = {
      add: jest.fn(),
      remove: jest.fn(),
    };
    const context = {
      compactMobileSummaryTrayExpanded: false,
      compactMobileSummaryTrayAnimationTimeout: null,
      getAllSelectedProductsData: () => [],
      _populateCompactMobileSummaryTray: jest.fn(),
      _syncCompactMobileSummaryScrollLock: jest.fn(),
    };

    fullPageMobileSummaryMethods._toggleCompactMobileSummaryTray.call(
      context,
      { classList },
    );

    expect(context.compactMobileSummaryTrayExpanded).toBe(true);
    expect(context._populateCompactMobileSummaryTray).toHaveBeenCalledTimes(1);
    expect(classList.add).toHaveBeenCalledWith('fpb-mobile-summary-tray-animating-open');
  });

  it('uses slot tiles for slot-enabled Classic and Standard compact summaries only', () => {
    expect(shouldUseMobileSummarySlotTiles({
      designPreset: 'CLASSIC',
      productSlotsEnabled: true,
    })).toBe(true);

    expect(shouldUseMobileSummarySlotTiles({
      designPreset: 'STANDARD',
      productSlotsEnabled: true,
    })).toBe(true);

    expect(shouldUseMobileSummarySlotTiles({
      designPreset: 'COMPACT',
      productSlotsEnabled: true,
    })).toBe(false);

    expect(shouldUseMobileSummarySlotTiles({
      designPreset: 'CLASSIC',
      productSlotsEnabled: false,
    })).toBe(false);
  });

  it('keeps Standard mobile category tabs from switching the expanded product body', () => {
    expect(shouldCategoryTabActivateProducts({
      designPreset: 'STANDARD',
      viewportWidth: 390,
      hasCategoryEntries: true,
    })).toBe(false);
  });

  it('keeps desktop and non-Standard category tabs on the normal switching path', () => {
    expect(shouldCategoryTabActivateProducts({
      designPreset: 'STANDARD',
      viewportWidth: 1280,
      hasCategoryEntries: true,
    })).toBe(true);

    expect(shouldCategoryTabActivateProducts({
      designPreset: 'COMPACT',
      viewportWidth: 390,
      hasCategoryEntries: true,
    })).toBe(true);
  });

  it('normalizes direct default products for full-page first-load selection', () => {
    const product = normalizeFullPageDirectDefaultProduct({
      title: '14k Dangling Obsidian Earrings',
      handle: '14k-dangling-obsidian-earrings',
      images: [{ originalSrc: 'https://cdn.shopify.com/default.jpg' }],
      graphqlId: 'gid://shopify/Product/9506413773059',
      productId: '9506413773059',
      requiredQuantity: 1,
      variants: [{
        variantGraphqlId: 'gid://shopify/ProductVariant/48720141091075',
        variantId: '48720141091075',
        price: '829.00',
        inventoryQuantity: 0,
      }],
    });

    expect(product).toEqual(expect.objectContaining({
      id: '9506413773059',
      title: '14k Dangling Obsidian Earrings',
      variantId: '48720141091075',
      price: 82900,
      available: true,
      quantityAvailable: 0,
      defaultRequiredQuantity: 1,
    }));
  });

  it('preserves missing direct default inventory as unbounded for full-page first-load selection', () => {
    const product = normalizeFullPageDirectDefaultProduct({
      title: 'Inventory Unknown Earrings',
      graphqlId: 'gid://shopify/Product/9506413773059',
      productId: '9506413773059',
      variants: [{
        variantGraphqlId: 'gid://shopify/ProductVariant/48720141091075',
        variantId: '48720141091075',
        price: '829.00',
      }],
    });

    expect(product).toEqual(expect.objectContaining({
      variantId: '48720141091075',
      available: true,
      quantityAvailable: null,
    }));
  });

  it('preserves direct default metadata on matching grid products', () => {
    const directDefault = {
      variantId: '48720141091075',
      defaultRequiredQuantity: 1,
      isDirectDefaultProduct: true,
    };
    const context = {
      directDefaultProducts: [directDefault],
    };

    const products = fullPageProductProcessingMethods._mergeDirectDefaultProductsIntoStep.call(
      context,
      0,
      [{
        id: '9506413773059',
        variantId: '48720141091075',
        title: '14k Dangling Obsidian Earrings',
      }],
    );

    expect(products).toEqual([
      expect.objectContaining({
        title: '14k Dangling Obsidian Earrings',
        variantId: '48720141091075',
        isDirectDefaultProduct: true,
        defaultRequiredQuantity: 1,
      }),
    ]);
  });

  it('auto-advances when a step rule opts into auto-next and the quantity is positive', () => {
    expect(shouldAutoAdvanceFullPageStep({
      quantity: 1,
      step: {
        autoNextStepOnConditionMet: true,
        conditionType: 'quantity',
        conditionOperator: 'equal_to',
        conditionValue: 2,
      },
    })).toBe(true);
  });

  it('formats exact step-rule validation like EB', () => {
    expect(getFullPageStepConditionValidationMessage({
      conditionType: 'quantity',
      conditionOperator: 'equal_to',
      conditionValue: 2,
    })).toBe('Add exactly 2 products on this step');
  });
});
