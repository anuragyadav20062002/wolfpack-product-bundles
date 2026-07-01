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
  (global as any).window = {
    Shopify: {
      currency: {
        active: 'USD',
        format: '${{amount}}',
      },
    },
    shopMoneyFormat: '${{amount}}',
  };
  (global as any).document = {
    createElement: (tagName: string) => new FakeElement(tagName),
  };
});

function makeContext(preset: string, progressType: 'simple' | 'step_based') {
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
    'renders step-based progress in the %s summary sidebar through the shared helper',
    (preset) => {
      const panel = document.createElement('aside');

      fullPageSidePanelMethods.renderSidePanel.call(makeContext(preset, 'step_based'), panel);

      const summaryContent = panel.querySelector('.side-panel-summary-content');

      expect(panel.querySelector('.side-panel-discount-message')?.innerHTML).toContain('Add');
      expect(summaryContent).not.toBeNull();
      expect(summaryContent?.children[0].className).toBe('side-panel-discount-message');
      expect(summaryContent?.children[1].className).toContain('fpb-discount-progress');
      expect(summaryContent?.children[2].className).toBe('side-panel-item-count');
      expect(summaryContent?.children[3].tagName).toBe('DIV');
      expect(panel.querySelector('.fpb-discount-progress.fpb-dp-step_based.fpb-dp-sidebar')).not.toBeNull();
      expect(panel.querySelector('.bw-discount-progress--standard-sidebar')).toBeNull();
    },
  );

  it.each(['STANDARD', 'CLASSIC', 'COMPACT', 'HORIZONTAL'])(
    'renders simple progress in the %s summary sidebar through the shared helper',
    (preset) => {
      const panel = document.createElement('aside');

      fullPageSidePanelMethods.renderSidePanel.call(makeContext(preset, 'simple'), panel);

      const summaryContent = panel.querySelector('.side-panel-summary-content');

      expect(panel.querySelector('.side-panel-discount-message')?.innerHTML).toContain('Add');
      expect(summaryContent).not.toBeNull();
      expect(summaryContent?.children[0].className).toBe('side-panel-discount-message');
      expect(summaryContent?.children[1].className).toContain('fpb-discount-progress');
      expect(summaryContent?.children[2].className).toBe('side-panel-item-count');
      expect(summaryContent?.children[3].tagName).toBe('DIV');
      expect(panel.querySelector('.fpb-discount-progress.fpb-dp-simple.fpb-dp-sidebar')).not.toBeNull();
      expect(panel.querySelector('.bw-discount-progress--standard-sidebar')).toBeNull();
    },
  );
});

describe('FPB Standard summary sidebar add-ons', () => {
  it('renders the add-on summary block inside the Standard sidebar summary content', () => {
    const panel = document.createElement('aside');
    const context = makeContext('STANDARD', 'simple');
    let renderTarget: FakeElement | null = null;
    context._renderFreeGiftSection = (container: FakeElement) => {
      renderTarget = container;
      const addon = document.createElement('div');
      addon.className = 'side-panel-addon-message side-panel-free-gift';
      addon.textContent = 'Add 1 more product(s) to claim 100% off on Add ons';
      container.appendChild(addon);
    };

    fullPageSidePanelMethods.renderSidePanel.call(context, panel);

    const summaryContent = panel.querySelector('.side-panel-summary-content');
    const addonMessage = panel.querySelector('.side-panel-addon-message.side-panel-free-gift');

    expect(summaryContent).not.toBeNull();
    expect(renderTarget).toBe(summaryContent);
    expect(addonMessage?.textContent).toContain('100% off');
  });

  it('does not render the add-on summary block when the active step is the add-on step', () => {
    const panel = document.createElement('aside');
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
    expect(panel.className).not.toContain('full-page-side-panel--has-addon-summary');
  });

  it('keeps non-Standard desktop free-gift rendering outside the summary content', () => {
    const panel = document.createElement('aside');
    const context = makeContext('COMPACT', 'simple');
    let renderTarget: FakeElement | null = null;
    context._renderFreeGiftSection = (container: FakeElement) => {
      renderTarget = container;
      const addon = document.createElement('div');
      addon.className = 'side-panel-addon-message side-panel-free-gift';
      addon.textContent = 'Add 1 more product(s) to claim 100% off on Add ons';
      container.appendChild(addon);
    };

    fullPageSidePanelMethods.renderSidePanel.call(context, panel);

    const summaryContent = panel.querySelector('.side-panel-summary-content');

    expect(summaryContent).not.toBeNull();
    expect(renderTarget).toBe(panel);
  });
});
