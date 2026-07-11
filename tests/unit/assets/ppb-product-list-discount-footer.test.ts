export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { cascadeTemplateMethods } = require('../../../app/assets/widgets/product-page/templates/cascade-template.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PricingCalculator } = require('../../../app/assets/widgets/shared/pricing-calculator.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { CurrencyManager } = require('../../../app/assets/widgets/shared/currency-manager.js');

global.PricingCalculator = PricingCalculator;
global.CurrencyManager = CurrencyManager;

const MONEY_FORMAT = ['$', '{{amount}}'].join('');
global.window = {
  Shopify: {
    currency: {
      active: 'USD',
      format: MONEY_FORMAT,
    },
  },
  shopMoneyFormat: MONEY_FORMAT,
};

function makeDiscountFooterContext(quantity: number) {
  return {
    selectedProducts: [{ '101': quantity }],
    stepProductData: [[{
      id: '101',
      variantId: '101',
      title: 'Bundle Product',
      price: 1000,
      available: true,
    }]],
    selectedBundle: {
      name: 'PPB Product List Fixture',
      steps: [{ id: 'productsData1' }],
      pricing: {
        enabled: true,
        method: 'percentage_off',
        rules: [
          {
            id: 'tier-1',
            conditionType: 'quantity',
            conditionOperator: 'gte',
            conditionValue: 2,
            discountValue: 10,
          },
          {
            id: 'tier-2',
            conditionType: 'quantity',
            conditionOperator: 'gte',
            conditionValue: 4,
            discountValue: 20,
          },
        ],
        messages: {
          ruleMessages: {
            'tier-1': {
              discountText: 'Tier 1 needs {{discountConditionDiff}} for {{discountValue}}{{discountValueUnit}}',
              successMessage: 'Tier 1 success {{discountValue}}{{discountValueUnit}}',
            },
            'tier-2': {
              discountText: 'Tier 2 needs {{discountConditionDiff}} for {{discountValue}}{{discountValueUnit}}',
              successMessage: 'Tier 2 success {{discountValue}}{{discountValueUnit}}',
            },
          },
        },
      },
      messaging: {
        displayOptions: {
          progressBar: {},
        },
      },
    },
    getDiscountInfoWithSelectedAddonDiscount(discountInfo: unknown) {
      return discountInfo;
    },
  };
}

describe('PPB Product List discount footer messaging', () => {
  it('targets the next unmet discount rule after the first tier is already qualified', () => {
    const context = makeDiscountFooterContext(2);

    expect(cascadeTemplateMethods._getCascadeFooterMessage.call(context)).toBe('Tier 2 needs 2 for 20%');
  });

  it('uses the applied best-tier success message when all discount tiers are qualified', () => {
    const context = makeDiscountFooterContext(4);

    expect(cascadeTemplateMethods._getCascadeFooterMessage.call(context)).toBe('Tier 2 success 20%');
  });
});
