export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageMobileSummaryMethods } = require('../../../app/assets/widgets/full-page/methods/mobile-summary-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PricingCalculator, ToastManager } = require('../../../app/assets/bundle-widget-components.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { shouldUseMobileSummarySlotTiles } = require('../../../app/assets/widgets/full-page/methods/mobile-summary-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getClassicMobileAdditionalOffersPulseState } = require('../../../app/assets/widgets/full-page/methods/mobile-summary-methods.js');
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
  innerHTML = '';
  attributes: Record<string, string> = {};
  private ownText = '';
  private children: FakeElement[] = [];
  private listeners: Record<string, Array<(event?: { preventDefault?: () => void; key?: string }) => void | Promise<void>>> = {};

  get childElementCount() {
    return this.children.length;
  }

  get classList() {
    return {
      add: (...classNames: string[]) => {
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        classNames.forEach((className) => classes.add(className));
        this.className = Array.from(classes).join(' ');
      },
      remove: (...classNames: string[]) => {
        const removeSet = new Set(classNames);
        this.className = this.className
          .split(/\s+/)
          .filter((className) => className && !removeSet.has(className))
          .join(' ');
      },
      toggle: (className: string, force?: boolean) => {
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        const shouldHaveClass = force ?? !classes.has(className);
        if (shouldHaveClass) {
          classes.add(className);
        } else {
          classes.delete(className);
        }
        this.className = Array.from(classes).join(' ');
      },
      contains: (className: string) => this.className.split(/\s+/).includes(className),
    };
  }

  get textContent() {
    return [this.ownText, ...this.children.map((child) => child.textContent)].join('');
  }

  set textContent(value: string) {
    this.ownText = value;
  }

  append(...children: FakeElement[]) {
    this.children.push(...children);
  }

  appendChild(child: FakeElement) {
    this.children.push(child);
    return child;
  }

  getChildren() {
    return this.children;
  }

  setAttribute(name: string, value: string) {
    this.attributes[name] = value;
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
  const shopMoneyFormat = ['$', '{{amount}}'].join('');
  (global as any).window = {
    Shopify: {
      currency: {
        active: 'USD',
        format: shopMoneyFormat,
      },
    },
    shopMoneyFormat,
  };
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
    areBundleConditionsMet: () => false,
    getFullPageDesignPreset: () => 'STANDARD',
    getStepConditionValidationMessage: () => 'Add exactly 2 products on this step',
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
  it('does not force compact mobile summary progress when discount progress is disabled', () => {
    const sheet = new FakeElement();
    const renderProgress = jest.fn(() => new FakeElement());
    const context = {
      ...createContext(),
      selectedProducts: [{}],
      stepProductData: [[]],
      selectedBundle: {
        bundleDesignPresetId: 'CLASSIC',
        steps: [{ id: 'step-1', enabled: true }],
        pricing: {
          enabled: true,
          method: 'fixed_amount',
          rules: [
            {
              id: 'rule-1',
              conditionType: 'quantity',
              conditionOperator: 'gte',
              conditionValue: 2,
              discountValue: 5,
            },
          ],
        },
      },
      config: {
        showDiscountMessaging: false,
        showDiscountProgressBar: false,
        discountTextTemplate: 'Add {{conditionText}} to save {{discountText}}',
      },
      compactMobileSummaryTrayExpanded: false,
      currentStepIndex: 0,
      getDiscountInfoWithSelectedAddonDiscount: (discountInfo: unknown) => discountInfo,
      getAllSelectedProductsData: () => [],
      usesCompactMobileSummaryTray: () => true,
      _shouldRenderProductSlots: () => false,
      _syncCompactMobileSummaryScrollLock: jest.fn(),
      _renderDiscountProgress: renderProgress,
      _createMobileSummaryActionButton: fullPageMobileSummaryMethods._createMobileSummaryActionButton,
      bundleHasNoConditions: () => false,
    };

    fullPageMobileSummaryMethods._populateCompactMobileSummaryTray.call(context, sheet);

    expect(renderProgress).not.toHaveBeenCalled();
  });

  it('uses the raw Classic total in compact mobile fixed bundle price action display', () => {
    const sheet = new FakeElement();
    const context = {
      ...createContext(),
      selectedProducts: [{}, {}],
      stepProductData: [[]],
      selectedBundle: {
        bundleDesignPresetId: 'CLASSIC',
        steps: [{ id: 'step-1', enabled: true }],
        pricing: {
          enabled: true,
          method: 'fixed_bundle_price',
          rules: [
            {
              id: 'rule-1',
              conditionType: 'quantity',
              conditionOperator: 'gte',
              conditionValue: 2,
              discountValue: 5,
              method: 'fixed_bundle_price',
            },
          ],
        },
      },
      config: {
        showDiscountMessaging: false,
        showDiscountProgressBar: false,
      },
      compactMobileSummaryTrayExpanded: false,
      currentStepIndex: 0,
      getDiscountInfoWithSelectedAddonDiscount: (discountInfo: unknown) => discountInfo,
      getAllSelectedProductsData: () => [{}, {}],
      _shouldRenderProductSlots: () => false,
      _syncCompactMobileSummaryScrollLock: jest.fn(),
      _renderDiscountProgress: jest.fn(),
      _createMobileSummaryActionButton: fullPageMobileSummaryMethods._createMobileSummaryActionButton,
      bundleHasNoConditions: () => false,
      getFullPageDesignPreset: () => 'CLASSIC',
    };
    const totalSpy = jest.spyOn(PricingCalculator, 'calculateBundleTotal').mockReturnValue({
      totalPrice: 144800,
      totalQuantity: 2,
      unitPrices: [82900, 61900],
    });
    const discountSpy = jest.spyOn(PricingCalculator, 'calculateDiscount').mockReturnValue({
      hasDiscount: true,
      finalPrice: 500,
      discountAmount: 144300,
      applicableRule: { method: 'fixed_bundle_price' },
    });

    try {
      fullPageMobileSummaryMethods._populateCompactMobileSummaryTray.call(context, sheet);
    } finally {
      totalSpy.mockRestore();
      discountSpy.mockRestore();
    }

    expect(sheet.textContent).toContain('Add To Cart');
    expect(sheet.textContent).not.toContain('$5.00');
  });

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

  it('keeps Classic final-step underfilled add-to-cart clickable and validates on press', async () => {
    const toastSpy = jest.spyOn(ToastManager, 'show').mockImplementation(() => {});
    const context = {
      ...createContext(),
      getFullPageDesignPreset: () => 'CLASSIC',
      areBundleConditionsMet: jest.fn(() => false),
      getStepConditionValidationMessage: jest.fn(() => 'Add exactly 2 products on this step'),
    };

    const button = fullPageMobileSummaryMethods._createMobileSummaryActionButton.call(
      context,
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
    expect(button.disabled).toBe(false);

    await button.click();

    expect(context.areBundleConditionsMet).toHaveBeenCalledTimes(1);
    expect(context.getStepConditionValidationMessage).toHaveBeenCalledTimes(1);
    expect(toastSpy).toHaveBeenCalledWith('Add exactly 2 products on this step');
    expect(context.addBundleToCart).not.toHaveBeenCalled();

    toastSpy.mockRestore();
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

  it('lets the Classic compact summary count toggle use the same interaction path as Standard', async () => {
    const sheet = new FakeElement();
    const toggleTray = jest.fn();
    const context = {
      ...createContext(),
      selectedProducts: [],
      stepProductData: [[]],
      selectedBundle: {
        bundleDesignPresetId: 'CLASSIC',
        steps: [{ id: 'step-1', enabled: true }],
        pricing: { enabled: false },
      },
      config: {},
      compactMobileSummaryTrayExpanded: false,
      currentStepIndex: 0,
      getDiscountInfoWithSelectedAddonDiscount: (discountInfo: unknown) => discountInfo,
      getAllSelectedProductsData: () => [],
      _shouldRenderProductSlots: () => false,
      _syncCompactMobileSummaryScrollLock: jest.fn(),
      _renderDiscountProgress: jest.fn(),
      _createMobileSummaryActionButton: fullPageMobileSummaryMethods._createMobileSummaryActionButton,
      _toggleCompactMobileSummaryTray: toggleTray,
      bundleHasNoConditions: () => false,
      getFullPageDesignPreset: () => 'CLASSIC',
    };

    fullPageMobileSummaryMethods._populateCompactMobileSummaryTray.call(context, sheet);
    await sheet.getChildren()[0].click();

    expect(toggleTray).toHaveBeenCalledWith(sheet);
  });

  it('enables the Classic additional-offers pulse only when add-on tiers are mixed', () => {
    const paidStep = { id: 'paid-step' };
    const addonStep = { id: 'addon-step', isFreeGift: true };
    const mixedState = getClassicMobileAdditionalOffersPulseState({
      designPreset: 'CLASSIC',
      currentStepIndex: 0,
      steps: [paidStep, addonStep],
      addonStates: [
        { tier: { tierId: 'tier-1' }, isEligible: true },
        { tier: { tierId: 'tier-2' }, isEligible: false },
      ],
    });

    expect(mixedState.shouldPulse).toBe(true);
    expect(mixedState.message).toBe('Additional offers to be unlocked');

    expect(getClassicMobileAdditionalOffersPulseState({
      designPreset: 'CLASSIC',
      currentStepIndex: 0,
      steps: [paidStep, addonStep],
      addonStates: [
        { tier: { tierId: 'tier-1' }, isEligible: true },
        { tier: { tierId: 'tier-2' }, isEligible: true },
      ],
    }).shouldPulse).toBe(false);

    expect(getClassicMobileAdditionalOffersPulseState({
      designPreset: 'CLASSIC',
      currentStepIndex: 1,
      steps: [paidStep, addonStep],
      addonStates: [
        { tier: { tierId: 'tier-1' }, isEligible: true },
        { tier: { tierId: 'tier-2' }, isEligible: false },
      ],
    }).shouldPulse).toBe(false);

    expect(getClassicMobileAdditionalOffersPulseState({
      designPreset: 'STANDARD',
      currentStepIndex: 0,
      steps: [paidStep, addonStep],
      addonStates: [
        { tier: { tierId: 'tier-1' }, isEligible: true },
        { tier: { tierId: 'tier-2' }, isEligible: false },
      ],
    }).shouldPulse).toBe(false);
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

  it('keeps Classic mobile slot tiles free of per-slot remove controls', () => {
    const container = new FakeElement();
    const context = {
      getFullPageDesignPreset: () => 'CLASSIC',
      getSummaryProductDisplayTitle: () => 'Selected product',
      _getSelectedProductImageSrc: () => 'https://cdn.example.test/product.jpg',
      _escapeHTML: (value: string) => value,
      selectedBundle: {},
    };

    fullPageMobileSummaryMethods._renderCompactMobileSummarySlotTiles.call(
      context,
      container,
      [{ quantity: 1 }],
      { minQuantity: 1 },
      1,
    );

    expect(container.getChildren()[0].getChildren()).toHaveLength(0);
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
