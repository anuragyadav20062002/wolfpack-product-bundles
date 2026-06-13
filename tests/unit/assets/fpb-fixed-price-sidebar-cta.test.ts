export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageBoxSelectionSidebarMethods } = require('../../../app/assets/widgets/full-page/methods/box-selection-sidebar-methods.js');

const originalWindow = global.window;

beforeEach(() => {
  (global as any).window = {
    Shopify: {
      shop: { currency: 'PKR' },
    },
    shopMoneyFormat: 'PKR{{amount}}',
  };
});

afterAll(() => {
  (global as any).window = originalWindow;
});

function makeContext(pricing: any) {
  return {
    selectedBundle: { pricing },
  };
}

describe('fullPageBoxSelectionSidebarMethods.getSidebarTierCtaContent', () => {
  it('derives fixed bundle price CTA subtext from the rule instead of stale percentage subtext', () => {
    const content = fullPageBoxSelectionSidebarMethods.getSidebarTierCtaContent.call(
      makeContext({
        enabled: true,
        method: 'fixed_bundle_price',
        rules: [
          {
            id: 'rule-5',
            conditionType: 'quantity',
            conditionValue: 5,
            discountValue: 500000,
          },
        ],
        messages: {
          displayOptions: {
            bundleQuantityOptions: {
              enabled: true,
              defaultRuleId: 'rule-5',
              optionsByRuleId: {
                'rule-5': {
                  label: 'Box of 5',
                  subtext: '500000% off',
                },
              },
            },
          },
        },
      }),
      null,
    );

    expect(content).toEqual({
      label: 'Box of 5',
      subtext: 'Bundle for PKR5000.00',
    });
  });

  it('preserves saved sidebar CTA subtext for percentage rules', () => {
    const content = fullPageBoxSelectionSidebarMethods.getSidebarTierCtaContent.call(
      makeContext({
        enabled: true,
        method: 'percentage_off',
        rules: [
          {
            id: 'rule-3',
            conditionType: 'quantity',
            conditionValue: 3,
            discountValue: 10,
          },
        ],
        messages: {
          displayOptions: {
            bundleQuantityOptions: {
              enabled: true,
              defaultRuleId: 'rule-3',
              optionsByRuleId: {
                'rule-3': {
                  label: 'Box of 3',
                  subtext: '10% off',
                },
              },
            },
          },
        },
      }),
      null,
    );

    expect(content).toEqual({
      label: 'Box of 3',
      subtext: '10% off',
    });
  });

  it('does not render tier CTA content when bundle quantity option display is disabled', () => {
    const content = fullPageBoxSelectionSidebarMethods.getSidebarTierCtaContent.call(
      makeContext({
        enabled: true,
        method: 'fixed_bundle_price',
        rules: [
          {
            id: 'rule-5',
            conditionType: 'quantity',
            conditionValue: 5,
            discountValue: 500000,
          },
        ],
        messages: {
          displayOptions: {
            bundleQuantityOptions: {
              enabled: false,
              defaultRuleId: 'rule-5',
              optionsByRuleId: {
                'rule-5': {
                  label: 'Box of 5',
                  subtext: '500000% off',
                },
              },
            },
          },
        },
      }),
      null,
    );

    expect(content).toBeNull();
  });
});
