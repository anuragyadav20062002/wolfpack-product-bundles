// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageConfigLifecycleMethods } = require('../../../app/assets/widgets/product-page/methods/config-lifecycle-methods.js');

function makeContext(productPageControls: Record<string, any> = {}) {
  return {
    config: {
      controlsSettings: {
        settingsControls: {
          productPage: productPageControls,
        },
      },
    },
    _getProductPageControls: ProductPageConfigLifecycleMethods._getProductPageControls,
    _runControlsScript: ProductPageConfigLifecycleMethods._runControlsScript,
  };
}

function resetUrl(path = '/products/test-bundle') {
  (global as any).window.location.href = `https://example.test${path}`;
}

function currentPathname() {
  return new URL((global as any).window.location.href, 'https://example.test').pathname;
}

describe('Product Page post-add redirect handling', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (global as any).window = {
      location: { href: 'https://example.test/products/test-bundle' },
    };
    (global as any).document = {
      querySelector: jest.fn(),
    };
    resetUrl();
    delete (global as any).window.__ppbRedirectScript;
    delete (global as any).window.__ppbCustomScript;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    delete (global as any).window;
    delete (global as any).document;
  });

  it('redirects to checkout when the saved Product Page redirect mode is checkout', () => {
    ProductPageConfigLifecycleMethods._handlePostAddToCartAction.call(
      makeContext(),
      { action: 'checkout' },
    );

    expect(currentPathname()).toBe('/products/test-bundle');

    jest.advanceTimersByTime(1000);

    expect(currentPathname()).toBe('/checkout');
  });

  it('redirects to cart when the saved Product Page redirect mode is cart', () => {
    ProductPageConfigLifecycleMethods._handlePostAddToCartAction.call(
      makeContext(),
      { action: 'cart' },
    );

    jest.advanceTimersByTime(1000);

    expect(currentPathname()).toBe('/cart');
  });

  it('clicks the configured side-cart trigger when the saved Product Page redirect mode is side_cart', () => {
    const clickSpy = jest.fn();
    (global as any).document.querySelector.mockReturnValue({ click: clickSpy });

    ProductPageConfigLifecycleMethods._handlePostAddToCartAction.call(
      makeContext(),
      {
        action: 'side_cart',
        selectors: { sideCartOpenButton: '.open-cart' },
      },
    );

    jest.advanceTimersByTime(300);

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect((global as any).document.querySelector).toHaveBeenCalledWith('.open-cart');
    expect(currentPathname()).toBe('/products/test-bundle');
  });

  it('runs redirect and custom scripts before applying the post-add action', () => {
    ProductPageConfigLifecycleMethods._handlePostAddToCartAction.call(
      makeContext({
        scripts: {
          executeCustomScript: 'window.__ppbCustomScript = (window.__ppbCustomScript || 0) + 1;',
        },
      }),
      {
        action: 'cart',
        executeScript: 'window.__ppbRedirectScript = (window.__ppbRedirectScript || 0) + 1;',
      },
    );

    expect((global as any).window.__ppbRedirectScript).toBe(1);
    expect((global as any).window.__ppbCustomScript).toBe(1);

    jest.advanceTimersByTime(1000);

    expect(currentPathname()).toBe('/cart');
  });
});
