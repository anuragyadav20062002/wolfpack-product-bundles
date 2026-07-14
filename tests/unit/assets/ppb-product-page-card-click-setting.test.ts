// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProductPageConfigLifecycleMethods } = require('../../../app/assets/widgets/product-page/methods/config-lifecycle-methods.js');

describe('PPB product page card click setting', () => {
  it('defaults to disabled when controls settings are missing', () => {
    const context = {
      ...ProductPageConfigLifecycleMethods,
      config: {},
    };

    expect(context._isProductCardClickAddEnabled()).toBe(false);
  });

  it('reads the active controls card-click toggle', () => {
    const context = {
      ...ProductPageConfigLifecycleMethods,
      config: {
        controlsSettings: {
          activeControls: {
            addToCartWhenProductCardClicked: true,
          },
        },
      },
    };

    expect(context._isProductCardClickAddEnabled()).toBe(true);
  });

  it('falls back to settings-controls product-page path', () => {
    const context = {
      ...ProductPageConfigLifecycleMethods,
      config: {
        controlsSettings: {
          settingsControls: {
            productPage: {
              addToCartWhenProductCardClicked: true,
            },
          },
        },
      },
    };

    expect(context._isProductCardClickAddEnabled()).toBe(true);
  });

  it('falls back to the EB-mapped camelCase path', () => {
    const context = {
      ...ProductPageConfigLifecycleMethods,
      config: {
        controlsSettings: {
          activeControls: {
            addToBundleOnProductCardClicked: true,
          },
        },
      },
    };

    expect(context._isProductCardClickAddEnabled()).toBe(true);
  });

  it('accepts singular admin alias and truthy string values', () => {
    const context = {
      ...ProductPageConfigLifecycleMethods,
      config: {
        controlsSettings: {
          activeControls: {
            addToBundleOnProductCardClick: 'true',
          },
        },
      },
    };

    expect(context._isProductCardClickAddEnabled()).toBe(true);
  });

  it('parses validateConditionsBeforeAddToCart string flags correctly', () => {
    const context = {
      ...ProductPageConfigLifecycleMethods,
      config: {
        controlsSettings: {
          activeControls: {
            validateConditionsBeforeAddToCart: 'false',
          },
        },
      },
    };

    expect(context._isConditionValidationEnabled()).toBe(false);
  });
});
