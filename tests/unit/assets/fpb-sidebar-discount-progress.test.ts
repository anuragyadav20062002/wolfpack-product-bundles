export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageSidePanelMethods } = require('../../../app/assets/widgets/full-page/methods/side-panel-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageMobileSummaryMethods } = require('../../../app/assets/widgets/full-page/methods/mobile-summary-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PricingCalculator, ToastManager } = require('../../../app/assets/bundle-widget-components.js');

class FakeElement {
  tagName: string;
  className = '';
  textContent = '';
  innerHTML = '';
  children: FakeElement[] = [];
  style: Record<string, string> = {};
  listeners: Record<string, Array<() => unknown>> = {};

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  get classList() {
    return {
      contains: (className: string) => this.className.split(/\s+/).includes(className),
      add: (className: string) => {
        if (!this.className.split(/\s+/).includes(className)) {
          this.className = [this.className, className].filter(Boolean).join(' ');
        }
      },
      toggle: (className: string, force?: boolean) => {
        const classes = this.className.split(/\s+/).filter(Boolean);
        const hasClass = classes.includes(className);
        const shouldHaveClass = force ?? !hasClass;
        this.className = shouldHaveClass
          ? Array.from(new Set([...classes, className])).join(' ')
          : classes.filter((item) => item !== className).join(' ');
      },
    };
  }

  appendChild(child: FakeElement) {
    this.children.push(child);
    return child;
  }

  append(...children: FakeElement[]) {
    children.forEach((child) => this.appendChild(child));
  }

  addEventListener(eventName: string, handler: () => unknown) {
    this.listeners[eventName] = this.listeners[eventName] || [];
    this.listeners[eventName].push(handler);
  }

  async click() {
    const handlers = this.listeners.click || [];
    for (const handler of handlers) {
      await handler();
    }
  }

  setAttribute() {}

  querySelector(selector: string): FakeElement | null {
    const selectorClasses = selector
      .split('.')
      .filter(Boolean)
      .map((part) => part.trim())
      .filter(Boolean);
    const matches = selectorClasses.length > 0
      && selectorClasses.every((className) => this.className.split(/\s+/).includes(className));
    if (matches) return this;

    for (const child of this.children) {
      const match = child.querySelector(selector);
      if (match) return match;
    }

    return null;
  }
}

function collectButtons(root: FakeElement): FakeElement[] {
  const buttons: FakeElement[] = [];
  if (root.tagName === 'BUTTON') buttons.push(root);
  for (const child of root.children) {
    buttons.push(...collectButtons(child));
  }
  return buttons;
}

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
  (global as any).document = {
    createElement: (tagName: string) => new FakeElement(tagName),
  };
});

function makeContext(preset: string, progressType: 'simple' | 'step_based'): any {
  return {
    selectedProducts: [{}],
    stepProductData: [[]],
    selectedBundle: {
      bundleDesignPresetId: preset,
      steps: [{ id: 'step-1', enabled: true }],
      pricing: {
        enabled: true,
        method: 'percentage_off',
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
      showDiscountMessaging: true,
      showDiscountProgressBar: true,
      discountProgressBarType: progressType,
      discountTextTemplate: 'Add {{conditionText}} to get {{discountText}}',
    },
    currentStepIndex: 0,
    _isStandardDesktopSidebar: (panel: FakeElement) => {
      return ['STANDARD', 'CLASSIC'].includes(preset)
        && !panel.classList.contains('fpb-mobile-bottom-sheet');
    },
    getDiscountInfoWithSelectedAddonDiscount: (discountInfo: unknown) => discountInfo,
    getAllSelectedProductsData: () => [],
    getSummaryProductDisplayTitle: () => '',
    getSummaryProductVariantDisplay: () => '',
    getBundleSummaryText: () => ({ title: 'Your Bundle', subTitle: 'Review your bundle' }),
    getFullPageDesignPreset: () => preset,
    resolveFullPageLayout: () => 'footer_side',
    createSidebarTierCta: () => null,
    getSelectedBoxSelectionQuantity: () => 0,
    renderBoxSelectionOptions: () => null,
    getSummarySidebarEmptyStateMode: () => 'skeletons',
    getClassicSidebarSlotCount: () => 0,
    renderClassicSidebarSlots: () => document.createElement('div'),
    _renderStandardSidebarEmptySlots: () => undefined,
    _shouldRenderProductSlots: () => false,
    _renderSidebarProductSkeletons: () => undefined,
    _renderFreeGiftSection: () => undefined,
    _formatSidebarDiscountMessage: (message: string) => message,
    createStandardSidebarDiscountProgress: () => {
      const el = document.createElement('div');
      el.className = 'bw-discount-progress bw-discount-progress--standard-sidebar fpb-dp-sidebar';
      return el;
    },
    _renderDiscountProgress: () => {
      const el = document.createElement('div');
      el.className = `fpb-discount-progress fpb-dp-${progressType} fpb-dp-sidebar`;
      return el;
    },
    canProceedToNextStep: () => true,
    bundleHasNoConditions: () => false,
    getSidebarTierCtaContent: () => null,
    _resolveText: (_key: string, fallback: string) => fallback,
    _escapeHTML: (value: string) => value,
    areBundleConditionsMet: () => false,
    canCheckoutWithBoxSelection: () => true,
    showBoxSelectionValidationMessage: () => undefined,
    addBundleToCart: () => undefined,
    canNavigateToStep: () => true,
    renderFullPageLayoutWithSidebar: () => undefined,
  };
}

describe('FPB summary sidebar discount progress', () => {
  it.each(['STANDARD', 'CLASSIC', 'COMPACT', 'HORIZONTAL'])(
    'requests step-based progress rendering in the %s summary sidebar',
    (preset) => {
      const panel = document.createElement('aside') as unknown as FakeElement;
      let renderProgressCount = 0;
      const context = makeContext(preset, 'step_based');
      context._renderDiscountProgress = () => {
        renderProgressCount += 1;
        return document.createElement('div');
      };

      fullPageSidePanelMethods.renderSidePanel.call(context, panel);

      expect(renderProgressCount).toBe(1);
    },
  );

  it.each(['STANDARD', 'CLASSIC', 'COMPACT', 'HORIZONTAL'])(
    'requests simple progress rendering in the %s summary sidebar',
    (preset) => {
      const panel = document.createElement('aside');
      let renderProgressCount = 0;
      const context = makeContext(preset, 'simple');
      context._renderDiscountProgress = () => {
        renderProgressCount += 1;
        return document.createElement('div');
      };

      fullPageSidePanelMethods.renderSidePanel.call(context, panel);

      expect(renderProgressCount).toBe(1);
    },
  );

  it('does not format a sidebar discount message when discount messaging is disabled', () => {
    const panel = document.createElement('aside');
    const context = makeContext('CLASSIC', 'simple');
    context.config.showDiscountMessaging = false;
    context.config.showDiscountProgressBar = false;
    context._formatSidebarDiscountMessage = jest.fn((message: string) => message);

    fullPageSidePanelMethods.renderSidePanel.call(context, panel);

    expect(context._formatSidebarDiscountMessage).not.toHaveBeenCalled();
  });

  it.each(['STANDARD', 'CLASSIC'])(
    'renders the next locked tier message in the %s sidebar after the first discount tier is reached',
    (preset) => {
      const panel = document.createElement('aside');
      const context = makeContext(preset, 'simple');
      context.config.showDiscountProgressBar = false;
      context.selectedBundle.pricing.rules = [
        {
          id: 'rule-1',
          conditionType: 'quantity',
          conditionOperator: 'gte',
          conditionValue: 1,
          discountValue: 10,
        },
        {
          id: 'rule-6',
          conditionType: 'quantity',
          conditionOperator: 'gte',
          conditionValue: 6,
          discountValue: 20,
        },
      ];
      context.selectedBundle.pricing.messages = {
        ruleMessages: {
          'rule-1': {
            discountText: 'Add {{discountConditionDiff}} product to save {{discountValue}}{{discountValueUnit}}',
            successMessage: 'Rule one reached',
          },
          'rule-6': {
            discountText: 'Add {{discountConditionDiff}} more to save {{discountValue}}{{discountValueUnit}}',
            successMessage: 'Rule six reached',
          },
        },
      };

      const totalSpy = jest.spyOn(PricingCalculator, 'calculateBundleTotal').mockReturnValue({
        totalPrice: 10000,
        totalQuantity: 1,
        unitPrices: [10000],
      });
      const discountSpy = jest.spyOn(PricingCalculator, 'calculateDiscount').mockReturnValue({
        hasDiscount: true,
        finalPrice: 9000,
        discountAmount: 1000,
        discountPercentage: 10,
        qualifiesForDiscount: true,
        applicableRule: context.selectedBundle.pricing.rules[0],
      });

      try {
        fullPageSidePanelMethods.renderSidePanel.call(context, panel);
      } finally {
        totalSpy.mockRestore();
        discountSpy.mockRestore();
      }

      const message = panel.querySelector('.side-panel-discount-message');
      expect(message?.innerHTML).toContain('Add 5 more to save 20%');
      expect(message?.innerHTML).not.toContain('Rule one reached');
    },
  );

  it('shows only the raw Classic total for fixed bundle price summary display', () => {
    const panel = document.createElement('aside');
    const context = makeContext('CLASSIC', 'simple');
    context.selectedBundle.pricing.method = 'fixed_bundle_price';
    context.selectedBundle.pricing.rules[0].method = 'fixed_bundle_price';
    context.config.showDiscountMessaging = false;
    context.config.showDiscountProgressBar = false;
    context.getAllSelectedProductsData = () => [{}, {}];
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
      fullPageSidePanelMethods.renderSidePanel.call(context, panel);
    } finally {
      totalSpy.mockRestore();
      discountSpy.mockRestore();
    }

    const total = panel.querySelector('.side-panel-total');
    expect(total?.innerHTML).toContain('side-panel-total-final');
    expect(total?.innerHTML).not.toContain('side-panel-total-original');
    expect(total?.innerHTML).not.toContain('$5.00');
  });
});

describe('FPB configured summary header', () => {
  it('renders the configured summary title in the desktop sidebar', () => {
    const panel = document.createElement('aside') as unknown as FakeElement;
    const context = makeContext('CLASSIC', 'simple');
    context.selectedBundle.name = 'Daily Essentials';
    context.selectedBundle.bundleTextConfig = {
      bundleSummary: {
        title: 'Daily kit',
        subTitle: 'Review your bundle',
      },
    };
    context.getBundleSummaryText = fullPageMobileSummaryMethods.getBundleSummaryText;

    fullPageSidePanelMethods.renderSidePanel.call(context, panel);

    expect(panel.querySelector('.side-panel-title')?.textContent).toBe('Daily kit');
  });

  it('renders the configured summary title in the mobile footer', () => {
    const context = makeContext('CLASSIC', 'simple');
    context.selectedBundle.name = 'Daily Essentials';
    context.selectedBundle.bundleTextConfig = {
      bundleSummary: {
        title: 'Daily kit',
        subTitle: 'Review your bundle',
      },
    };
    context.getBundleSummaryText = fullPageMobileSummaryMethods.getBundleSummaryText;

    const bundleItems = fullPageMobileSummaryMethods._renderCompactMobileSummaryBundleItems.call(
      context,
      { display: { format: '${{amount}}' } },
      0,
    );

    expect(bundleItems.querySelector('.fpb-mobile-summary-bundle-title')?.textContent).toBe('Daily kit');
  });

  it('falls back to the bundle name when the configured summary title is empty', () => {
    const context = makeContext('CLASSIC', 'simple');
    context.selectedBundle.name = 'Daily Essentials';
    context.selectedBundle.bundleTextConfig = {
      bundleSummary: {
        title: '   ',
        subTitle: 'Review your bundle',
      },
    };

    expect(fullPageMobileSummaryMethods.getBundleSummaryText.call(context)).toEqual({
      title: 'Daily Essentials',
      subTitle: 'Review your bundle',
    });
  });
});

describe('FPB summary removal accessibility', () => {
  it.each([
    ['14k Dangling Pendant Earrings', 'Delete 14k Dangling Pendant Earrings'],
    ['', 'Delete product'],
  ])('builds an action-oriented removal label for %p', (title, expected) => {
    expect(fullPageSidePanelMethods.getSummaryProductRemoveButtonLabel(title)).toBe(expected);
  });
});

describe('FPB Standard summary sidebar add-ons', () => {
  it('renders the add-on summary block before the active add-on step', () => {
    const panel = document.createElement('aside');
    const context = makeContext('STANDARD', 'simple');
    let renderCount = 0;
      context._renderFreeGiftSection = (container: FakeElement) => {
      renderCount += 1;
      const addon = document.createElement('div') as unknown as FakeElement;
      addon.className = 'side-panel-addon-message side-panel-free-gift';
      addon.textContent = 'Add 1 more product(s) to claim 100% off on Add ons';
      container.appendChild(addon);
    };

    fullPageSidePanelMethods.renderSidePanel.call(context, panel);

    expect(renderCount).toBe(1);
  });

  it('does not render the add-on summary block when the active step is the add-on step', () => {
      const panel = document.createElement('aside') as unknown as FakeElement;
    const context = makeContext('STANDARD', 'simple');
    let renderCount = 0;
    context.currentStepIndex = 1;
    context.selectedBundle.steps = [
      { id: 'step-1', enabled: true },
      { id: 'personalization-addons', name: 'Add On', isFreeGift: true },
    ];
    context._renderFreeGiftSection = () => {
      renderCount += 1;
    };

    fullPageSidePanelMethods.renderSidePanel.call(context, panel);
    expect(renderCount).toBe(0);
  });
});

describe('FPB sidebar add-on CTA copy', () => {
  it('keeps Classic final-step add-to-cart copy when box tier text is configured', () => {
    const panel = document.createElement('aside') as unknown as FakeElement;
    const context = makeContext('CLASSIC', 'simple');
    context.selectedProducts = [[{}], [{}]];
    context.resolveFullPageLayout = () => 'sidebar';
    context.areBundleConditionsMet = () => true;
    context.getSidebarTierCtaContent = () => ({ label: 'Box of 2', subtext: '$5 off' });
    context._resolveText = (key: string, fallback: string) => (
      key === 'addToCartButton' ? 'Add To Cart' : fallback
    );

    fullPageSidePanelMethods.renderSidePanel.call(context, panel);

    const buttons = collectButtons(panel);
    expect(buttons.some((button) => button.textContent === 'Add To Cart')).toBe(true);
    expect(buttons.some((button) => button.textContent === 'Box of 2 $5 off')).toBe(false);
  });

  it('validates Classic final-step quantity before desktop add-to-cart', async () => {
    const toastSpy = jest.spyOn(ToastManager, 'show').mockImplementation(() => {});
    const panel = document.createElement('aside') as unknown as FakeElement;
    const context = makeContext('CLASSIC', 'simple');
    context.selectedProducts = [[]];
    context.resolveFullPageLayout = () => 'sidebar';
    context.areBundleConditionsMet = jest.fn(() => false);
    context.getStepConditionValidationMessage = jest.fn(() => 'Add exactly 2 products on this step');
    context.addBundleToCart = jest.fn();
    context._resolveText = (key: string, fallback: string) => (
      key === 'addToCartButton' ? 'Add To Cart' : fallback
    );

    fullPageSidePanelMethods.renderSidePanel.call(context, panel);

    const addToCartButton = collectButtons(panel).find((button) => button.textContent === 'Add To Cart');
    expect(addToCartButton).toBeDefined();
    await addToCartButton?.click();

    expect(context.areBundleConditionsMet).toHaveBeenCalledTimes(1);
    expect(context.getStepConditionValidationMessage).toHaveBeenCalledTimes(1);
    expect(toastSpy).toHaveBeenCalledWith('Add exactly 2 products on this step');
    expect(context.addBundleToCart).not.toHaveBeenCalled();

    toastSpy.mockRestore();
  });

  it('keeps add-to-cart copy on the active add-on step when tier CTA text is configured', () => {
    const panel = document.createElement('aside') as unknown as FakeElement;
    const context = makeContext('CLASSIC', 'simple');
    context.currentStepIndex = 1;
    context.selectedProducts = [[{}], [{}]];
    context.selectedBundle.steps = [
      { id: 'step-1', enabled: true },
      { id: 'personalization-addons', name: 'Add On', enabled: true, isFreeGift: true },
    ];
    context.areBundleConditionsMet = () => true;
    context.getSidebarTierCtaContent = () => ({ label: 'Box of 2', subtext: '$5 off' });
    context._resolveText = (key: string, fallback: string) => (
      key === 'addToCartButton' ? 'Add To Cart' : fallback
    );

    fullPageSidePanelMethods.renderSidePanel.call(context, panel);

    const cta = panel.querySelector('.side-panel-btn-next');
    expect(cta?.textContent).toBe('Add To Cart');
    expect(cta?.className).not.toContain('side-panel-btn-has-tier-cta');
  });
});
