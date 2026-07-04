export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageInitialRenderMethods } = require('../../../app/assets/widgets/full-page/methods/initial-render-methods.js');

describe('FPB discount display toggles', () => {
  beforeEach(() => {
    (global as any).window = {
      Shopify: {
        locale: 'en',
      },
    };
  });

  it('preserves disabled full-page pricing messaging when pricing is enabled', () => {
    const context = {
      selectedBundle: {
        pricing: {
          enabled: true,
          messages: {
            showDiscountMessaging: false,
            showDiscountProgressBar: false,
            ruleMessages: {},
            displayOptions: {},
          },
        },
      },
      config: {},
    };

    fullPageInitialRenderMethods.updateMessagesFromBundle.call(context);

    expect(context.config.showDiscountMessaging).toBe(false);
  });
});
