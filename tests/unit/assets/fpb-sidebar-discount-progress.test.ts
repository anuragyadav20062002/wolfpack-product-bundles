export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageSidePanelMethods } = require('../../../app/assets/widgets/full-page/methods/side-panel-methods.js');

class FakeElement {
  tagName: string;
  className = '';
  textContent = '';
  innerHTML = '';
  children: FakeElement[] = [];
  style: Record<string, string> = {};

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

  addEventListener() {}

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
