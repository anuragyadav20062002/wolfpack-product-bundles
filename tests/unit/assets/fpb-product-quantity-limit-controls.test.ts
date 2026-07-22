export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageSelectionNavigationMethods } = require('../../../app/assets/widgets/full-page/methods/selection-navigation-methods.js');

class FakeButton {
  disabled = false;
  attributes = new Map<string, string>();

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }

  removeAttribute(name: string) {
    this.attributes.delete(name);
  }
}

describe('FPB per-product quantity-limit controls', () => {
  it('disables the increment control at the configured limit without hardcoding the limit', () => {
    const button = new FakeButton();
    const context = {
      selectedBundle: {
        validateQuantityPerProduct: { isEnabled: true, allowedQuantity: 3 },
      },
    };

    fullPageSelectionNavigationMethods.syncProductQuantityIncreaseState.call(context, button, 3);

    expect(button.disabled).toBe(true);
    expect(button.attributes.get('aria-disabled')).toBe('true');
  });

  it('re-enables the increment control when quantity drops below the configured limit', () => {
    const button = new FakeButton();
    const context = {
      selectedBundle: {
        validateQuantityPerProduct: { isEnabled: true, allowedQuantity: 2 },
      },
    };

    fullPageSelectionNavigationMethods.syncProductQuantityIncreaseState.call(context, button, 2);
    fullPageSelectionNavigationMethods.syncProductQuantityIncreaseState.call(context, button, 1);

    expect(button.disabled).toBe(false);
    expect(button.attributes.has('aria-disabled')).toBe(false);
  });

  it('leaves the increment control enabled when per-product validation is disabled', () => {
    const button = new FakeButton();
    const context = {
      selectedBundle: {
        validateQuantityPerProduct: { isEnabled: false, allowedQuantity: 1 },
      },
    };

    fullPageSelectionNavigationMethods.syncProductQuantityIncreaseState.call(context, button, 9);

    expect(button.disabled).toBe(false);
    expect(button.attributes.has('aria-disabled')).toBe(false);
  });
});
