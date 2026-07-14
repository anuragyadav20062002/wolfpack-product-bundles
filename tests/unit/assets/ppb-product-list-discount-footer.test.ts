export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  cascadeTemplateMethods,
  getCascadeAddToCartButtonContent,
} = require('../../../app/assets/widgets/product-page/templates/cascade-template.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PricingCalculator } = require('../../../app/assets/widgets/shared/pricing-calculator.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { CurrencyManager } = require('../../../app/assets/widgets/shared/currency-manager.js');

(globalThis as any).PricingCalculator = PricingCalculator;
(globalThis as any).CurrencyManager = CurrencyManager;

const MONEY_FORMAT = ['$', '{{amount}}'].join('');
(globalThis as any).window = {
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

  it('builds EB-style Product List add-to-cart content for a qualified percentage discount', () => {
    expect(getCascadeAddToCartButtonContent({
      label: 'Add Bundle to Cart',
      totalPriceText: '$1907.00',
      finalPriceText: '$1716.30',
      discountInfo: {
        hasDiscount: true,
        discountAmount: 19070,
        discountPercentage: 10,
        discountMethod: 'percentage_off',
        applicableRule: {
          discountValue: 10,
        },
      },
    })).toEqual({
      label: 'Add Bundle to Cart',
      separator: '\u2022',
      finalPriceText: '$1716.30',
      compareAtPriceText: '$1907.00',
      discountPillText: '10% off',
    });
  });

  it('omits Product List discount button extras when no discount is qualified', () => {
    expect(getCascadeAddToCartButtonContent({
      label: 'Add Bundle to Cart',
      totalPriceText: '$1907.00',
      finalPriceText: '$1907.00',
      discountInfo: {
        hasDiscount: false,
        discountAmount: 0,
        discountPercentage: 0,
      },
    })).toEqual({
      label: 'Add Bundle to Cart',
      separator: '\u2022',
      finalPriceText: '$1907.00',
      compareAtPriceText: '',
      discountPillText: '',
    });
  });
});
