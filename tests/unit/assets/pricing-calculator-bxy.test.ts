/**
 * Unit Tests - BXY storefront pricing and message variables
 *
 * Covers the direct runtime rule shape emitted by Product Page bundle config.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PricingCalculator } = require('../../../app/assets/widgets/shared/pricing-calculator.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TemplateManager } = require('../../../app/assets/widgets/shared/template-manager.js');

const currencyInfo = {
  calculation: { code: 'USD', symbol: '$', format: '${{amount}}' },
  display: { code: 'USD', symbol: '$', format: '${{amount}}', rate: 1 },
};

function makeBxyBundle() {
  return {
    name: 'BXY Bundle',
    pricing: {
      enabled: true,
      method: 'buy_x_get_y',
      rules: [{
        id: 'rule-bxy',
        conditionType: 'quantity',
        conditionOperator: 'gte',
        conditionValue: 2,
        discountValue: 100,
        customerBuys: 2,
        customerGets: 1,
        bxyDiscountType: 'percentage',
        bxyApplyMode: 'lowest_priced',
      }],
    },
  };
}

describe('PricingCalculator.calculateDiscount - buy_x_get_y', () => {
  it('does not qualify at customerBuys quantity when customerGets is still missing', () => {
    const result = PricingCalculator.calculateDiscount(
      makeBxyBundle(),
      24600,
      2,
      [12300, 12300],
    );

    expect(result).toMatchObject({
      hasDiscount: false,
      discountAmount: 0,
      finalPrice: 24600,
      discountPercentage: 0,
      qualifiesForDiscount: false,
      applicableRule: null,
    });
  });

  it('qualifies at customerBuys plus customerGets and discounts one item', () => {
    const result = PricingCalculator.calculateDiscount(
      makeBxyBundle(),
      36900,
      3,
      [12300, 12300, 12300],
    );

    expect(result.hasDiscount).toBe(true);
    expect(result.discountAmount).toBe(12300);
    expect(result.finalPrice).toBe(24600);
    expect(result.discountPercentage).toBeCloseTo(33.3333, 4);
    expect(result.qualifiesForDiscount).toBe(true);
    expect(result.applicableRule?.id).toBe('rule-bxy');
  });
});

describe('TemplateManager BXY variables', () => {
  it('uses buy plus get as the quantity target and customerGets as discountedItems', () => {
    const variables = TemplateManager.createDiscountVariables(
      makeBxyBundle(),
      24600,
      2,
      {
        hasDiscount: false,
        applicableRule: null,
        finalPrice: 24600,
        discountAmount: 0,
        discountPercentage: 0,
        qualifiesForDiscount: false,
      },
      currencyInfo,
    );

    expect(variables.discountConditionDiff).toBe('1');
    expect(variables.targetQuantity).toBe('3');
    expect(variables.discountedItems).toBe('1');
    expect(variables.discountValue).toBe('100');
    expect(variables.discountValueUnit).toBe('%');
    expect(variables.discountText).toBe('100% off');
    expect(TemplateManager.replaceVariables(
      'Success! You got {{discountedItems}} product(s) at {{discountValue}}{{discountValueUnit}} off',
      variables,
    )).toBe('Success! You got 1 product(s) at 100% off');
  });
});
