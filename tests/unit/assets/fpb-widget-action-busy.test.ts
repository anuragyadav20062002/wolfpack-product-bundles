export {};

jest.mock('../../../app/assets/widgets/shared/toast-manager.js', () => ({
  ToastManager: {
    show: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageRuntimeCartSettingsMethods } = require('../../../app/assets/widgets/full-page/methods/runtime-cart-settings-methods.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageStepFooterMethods } = require('../../../app/assets/widgets/full-page/methods/step-footer-methods.js');
const addBundleToCart = fullPageStepFooterMethods.addBundleToCart;

class FakeElement {
  tagName: string;
  className = '';
  textContent = '';
  innerHTML = '';
  children: FakeElement[] = [];
  style: Record<string, string> = {};
  dataset: Record<string, string> = {};
  disabled = false;
  id = '';

  classList: {
    add: (value: string) => void;
    remove: (value: string) => void;
    toggle: (value: string, force?: boolean) => void;
    contains: (value: string) => boolean;
  };

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
    this.classList = {
      add: (value) => {
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        classes.add(value);
        this.className = Array.from(classes).join(' ');
      },
      remove: (value) => {
        this.className = this.className
          .split(/\s+/)
          .filter(item => item !== value)
          .filter(Boolean)
          .join(' ');
      },
      toggle: (value, force) => {
        const shouldAdd = force ?? !this.classList.contains(value);
        if (shouldAdd) {
          this.classList.add(value);
        } else {
          this.classList.remove(value);
        }
      },
      contains: (value) => this.className.split(/\s+/).includes(value),
    };
  }

  appendChild(child: FakeElement) {
    this.children.push(child);
    return child;
  }

  addEventListener() {}

  setAttribute(name: string, value: string) {
    if (name === 'id') {
      this.id = value;
    }
  }

  querySelector(selector: string): FakeElement | null {
    const selectorClasses = selector.split('.').filter(Boolean).map((part) => part.trim()).filter(Boolean);
    const selfMatch = selectorClasses.every((className) => this.classList.contains(className));
    if (selfMatch) return this;

    for (const child of this.children) {
      const match = child.querySelector(selector);
      if (match) return match;
    }

    return null;
  }

  querySelectorAll(selector: string): FakeElement[] {
    const selectorClasses = selector.split('.').filter(Boolean).map((part) => part.trim()).filter(Boolean);
    const matches: FakeElement[] = [];

    const isMatch = (node: FakeElement) => selectorClasses.every((className) => node.classList.contains(className));

    const walk = (node: FakeElement) => {
      if (isMatch(node)) matches.push(node);
      for (const child of node.children) {
        walk(child);
      }
    };

    walk(this);
    return matches;
  }
}

const makeDocument = () => ({
  createElement: (tagName: string) => new FakeElement(tagName),
  getElementById: () => null,
  querySelector: () => null,
  documentElement: new FakeElement('html'),
  body: {
    appendChild: () => undefined,
  },
});

beforeEach(() => {
  (global as any).document = makeDocument();
  (global as any).window = {
    Shopify: {
      currency: {
        active: 'USD',
        format: '{{amount}}',
      },
    },
  };
  (global as any).getComputedStyle = () => ({ getPropertyValue: () => '' });
  (global as any).fetch = undefined;
});

describe('FPB widget action busy state', () => {
  it('sets spinner state on action button and restores after action', async () => {
    const container = new FakeElement('div');
    const button = new FakeElement('button');
    button.innerHTML = 'Next';

    const context = {
      _isWidgetActionBusy: false,
      container,
      _getButtonDataset: fullPageRuntimeCartSettingsMethods._getButtonDataset,
      _setActionButtonLoadingState: fullPageRuntimeCartSettingsMethods._setActionButtonLoadingState,
      _setWidgetBusy: fullPageRuntimeCartSettingsMethods._setWidgetBusy,
    };

    fullPageRuntimeCartSettingsMethods._setWidgetBusy.call(context, true, button);
    expect(container.className).toContain('fpb-widget-busy');
    expect(button.className).toContain('fpb-inline-spinner-active');
    expect(button.innerHTML).toContain('fpb-inline-spinner');
    expect(button.disabled).toBe(true);

    fullPageRuntimeCartSettingsMethods._setWidgetBusy.call(context, false, button);
    expect(container.className).not.toContain('fpb-widget-busy');
    expect(button.className).not.toContain('fpb-inline-spinner-active');
    expect(button.innerHTML).toBe('Next');
  });

  it('prevents overlapping actions and keeps widget blocked while action is running', async () => {
    const container = new FakeElement('div');
    const actionButton = new FakeElement('button');
    const context: Record<string, any> = {
      _isWidgetActionBusy: false,
      container,
      _getButtonDataset: fullPageRuntimeCartSettingsMethods._getButtonDataset,
      _setActionButtonLoadingState: fullPageRuntimeCartSettingsMethods._setActionButtonLoadingState,
      _setWidgetBusy: fullPageRuntimeCartSettingsMethods._setWidgetBusy,
    };

    let releaseAction: () => void = () => undefined;
    const running = new Promise<void>((resolve) => {
      releaseAction = resolve;
    });

    const firstCall = fullPageRuntimeCartSettingsMethods._withWidgetActionBusy.call(
      context,
      () => running,
      { actionButton },
    );

    await Promise.resolve();
    expect(context._isWidgetActionBusy).toBe(true);

    const secondCall = await fullPageRuntimeCartSettingsMethods._withWidgetActionBusy.call(
      context,
      () => {
        throw new Error('Should not run while first action is active');
      },
      { actionButton },
    );
    expect(secondCall).toBe(false);

    releaseAction?.();
    await firstCall;
    expect(context._isWidgetActionBusy).toBe(false);
  });

  it('shows and clears FPB next-button spinner while add-to-cart request is in-flight', async () => {
    const actionButton = new FakeElement('button');
    actionButton.innerHTML = 'Add to Cart';
    const container = new FakeElement('div');
    container.className = 'bundle-widget-full-page';
    container.appendChild(actionButton);

    const context: Record<string, any> = {
      _isWidgetActionBusy: false,
      container,
      _getButtonDataset: fullPageRuntimeCartSettingsMethods._getButtonDataset,
      _setActionButtonLoadingState: fullPageRuntimeCartSettingsMethods._setActionButtonLoadingState,
      _setWidgetBusy: fullPageRuntimeCartSettingsMethods._setWidgetBusy,
      _withWidgetActionBusy: fullPageRuntimeCartSettingsMethods._withWidgetActionBusy,
      generateBundleSessionKey: fullPageRuntimeCartSettingsMethods.generateBundleSessionKey,
      resolveFullPageOfferId: fullPageRuntimeCartSettingsMethods.resolveFullPageOfferId,
      getCartLineLabels: fullPageRuntimeCartSettingsMethods.getCartLineLabels,
      showLoadingOverlay: () => undefined,
      hideLoadingOverlay: () => undefined,
      areBundleConditionsMet: () => true,
      canCheckoutWithBoxSelection: () => true,
      selectedBundle: {
        name: 'Bundle',
        steps: [
          {
            isDefault: false,
            pricing: { enabled: true },
          },
        ],
        loadingGif: null,
      },
      selectedProducts: [
        {
          'gid://shopify/ProductVariant/123': 1,
        },
      ],
      stepProductData: [[
        {
          variantId: 'gid://shopify/ProductVariant/123',
          id: 'gid://shopify/ProductVariant/123',
          title: 'Variant',
        },
      ]],
      expandProductsByVariant: (products: unknown[]) => products,
      extractId: () => null,
      getAddonLineDiscount: () => null,
      getSelectedSellingPlanAllocationId: () => null,
      buildCartLineSourceProperties: () => ({}),
      syncBundleDetailsCartMetafield: async () => undefined,
      _emitStorefrontEvent: () => undefined,
      _handlePostAddToCartAction: () => undefined,
      _getLandingPageControls: () => ({ checkout: null }),
    };

    let resolveResponse: () => void = () => undefined;
    (global as any).fetch = () => new Promise((resolve) => {
      resolveResponse = () => {
        resolve({
          ok: true,
          json: async () => ({}),
        });
      };
    });

    const action = addBundleToCart.call(context, actionButton);

    expect(context._isWidgetActionBusy).toBe(true);
    expect(container.className).toContain('fpb-widget-busy');
    expect(actionButton.innerHTML).toContain('fpb-inline-spinner');

    resolveResponse?.();
    await action;

    expect(context._isWidgetActionBusy).toBe(false);
    expect(container.className).not.toContain('fpb-widget-busy');
    expect(actionButton.innerHTML).toBe('Add to Cart');
  });
});
