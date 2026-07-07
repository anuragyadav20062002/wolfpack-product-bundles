/**
 * Unit Tests — TemplateManager condition math
 *
 * Verifies operator-aware "remaining to qualify" calculations used for
 * discount messaging, especially strict operators that are prone to
 * off-by-one regressions.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TemplateManager } = require('../../../app/assets/widgets/shared/template-manager.js');

export {};

describe('TemplateManager.getQualificationGap', () => {
  it('GTE uses direct threshold gap', () => {
    expect(TemplateManager.getQualificationGap(2, 3, 'gte', 1)).toBe(1);
    expect(TemplateManager.getQualificationGap(3, 3, 'gte', 1)).toBe(0);
  });

  it('GT includes strict +1 gap', () => {
    expect(TemplateManager.getQualificationGap(3, 3, 'gt', 1)).toBe(1);
    expect(TemplateManager.getQualificationGap(4, 3, 'gt', 1)).toBe(0);
  });

  it('EQ follows pricing-rule threshold semantics (>=)', () => {
    expect(TemplateManager.getQualificationGap(2, 3, 'eq', 1)).toBe(1);
    expect(TemplateManager.getQualificationGap(3, 3, 'eq', 1)).toBe(0);
    expect(TemplateManager.getQualificationGap(4, 3, 'eq', 1)).toBe(0);
  });
});

describe('TemplateManager.calculateConditionData', () => {
  const currencyInfo = {
    calculation: { code: 'USD', symbol: '$', format: '${{amount}}' },
    display: { code: 'USD', symbol: '$', format: '${{amount}}', rate: 1 },
  };

  it('quantity GT at boundary requires 1 more item', () => {
    const data = TemplateManager.calculateConditionData('quantity', 3, 'gt', 0, 3, currencyInfo);
    expect(data.itemsNeeded).toBe('1');
    expect(data.alreadyQualified).toBe(false);
    expect(data.conditionText).toContain('1 more item');
  });

  it('amount GT at boundary requires 0.01 more (1 cent)', () => {
    const data = TemplateManager.calculateConditionData('amount', 500, 'gt', 500, 0, currencyInfo);
    expect(data.amountNeeded).toBe('0.01');
    expect(data.alreadyQualified).toBe(false);
    expect(data.conditionText).toContain('$0.01 more');
  });
});

describe('TemplateManager evidence-matched variables', () => {
  const currencyInfo = {
    calculation: { code: 'USD', symbol: '$', format: '${{amount}}' },
    display: { code: 'USD', symbol: '$', format: '${{amount}}', rate: 1 },
  };

  it('exposes compatible aliases for quantity percentage discounts', () => {
    const variables = TemplateManager.createDiscountVariables(
      {
        name: 'Test Bundle',
        pricing: {
          method: 'percentage_off',
          rules: [{
            id: 'rule-1',
            conditionType: 'quantity',
            conditionOperator: 'gte',
            conditionValue: 3,
            discountValue: 15,
          }],
        },
      },
      10000,
      1,
      { hasDiscount: false, applicableRule: null, finalPrice: 10000, discountAmount: 0, discountPercentage: 0, qualifiesForDiscount: false },
      currencyInfo,
    );

    expect(variables.discountConditionDiff).toBe('2');
    expect(variables.discountUnit).toBe('');
    expect(variables.discountValue).toBe('15');
    expect(variables.discountValueUnit).toBe('%');
    expect(TemplateManager.replaceVariables(
      'Add {{discountConditionDiff}} product(s) to save {{discountValue}}{{discountValueUnit}}!',
      variables,
    )).toBe('Add 2 product(s) to save 15%!');
  });

  it('exposes currency-first aliases for fixed amount discounts', () => {
    const variables = TemplateManager.createDiscountVariables(
      {
        name: 'Test Bundle',
        pricing: {
          method: 'fixed_amount_off',
          rules: [{
            id: 'rule-fixed',
            conditionType: 'quantity',
            conditionOperator: 'gte',
            conditionValue: 2,
            discountValue: 500,
          }],
        },
      },
      10000,
      0,
      { hasDiscount: false, applicableRule: null, finalPrice: 10000, discountAmount: 0, discountPercentage: 0, qualifiesForDiscount: false },
      currencyInfo,
    );

    expect(variables.discountConditionDiff).toBe('2');
    expect(variables.discountValue).toBe('5.00');
    expect(variables.discountValueUnit).toBe('$');
    expect(TemplateManager.replaceVariables(
      'Success! Your {{discountValueUnit}}{{discountValue}} discount has been applied to your cart.',
      variables,
    )).toBe('Success! Your $5.00 discount has been applied to your cart.');
  });

  it('ignores stale percentage display text for fixed amount discounts', () => {
    const variables = TemplateManager.createDiscountVariables(
      {
        name: 'Test Bundle',
        pricing: {
          method: 'fixed_amount_off',
          rules: [{
            id: 'rule-fixed',
            conditionType: 'quantity',
            conditionOperator: 'gte',
            conditionValue: 2,
            discountValue: 500,
          }],
          messages: {
            displayOptions: {
              bundleQuantityOptions: {
                defaultRuleId: 'rule-fixed',
                optionsByRuleId: {
                  'rule-fixed': { label: 'Box of 2', subtext: '500% off' },
                },
              },
            },
          },
        },
      },
      10000,
      1,
      { hasDiscount: false, applicableRule: null, finalPrice: 10000, discountAmount: 0, discountPercentage: 0, qualifiesForDiscount: false },
      currencyInfo,
    );

    expect(variables.discountValue).toBe('5.00');
    expect(variables.discountValueUnit).toBe('$');
    expect(TemplateManager.replaceVariables(
      'Add {{discountConditionDiff}} product(s) to save {{discountValueUnit}}{{discountValue}}!',
      variables,
    )).toBe('Add 1 product(s) to save $5.00!');
  });

  it('uses the next locked tier variables after the first tier is achieved', () => {
    const variables = TemplateManager.createDiscountVariables(
      {
        name: 'Daily Essentials',
        pricing: {
          method: 'percentage_off',
          rules: [
            {
              id: 'rule-1',
              conditionType: 'quantity',
              conditionOperator: 'gte',
              conditionValue: 1,
              discountValue: 10,
            },
            {
              id: 'rule-6',
              conditionType: 'quantity',
              conditionOperator: 'gte',
              conditionValue: 6,
              discountValue: 20,
            },
          ],
        },
      },
      10000,
      1,
      {
        hasDiscount: true,
        applicableRule: {
          id: 'rule-1',
          conditionType: 'quantity',
          conditionOperator: 'gte',
          conditionValue: 1,
          discountValue: 10,
        },
        finalPrice: 9000,
        discountAmount: 1000,
        discountPercentage: 10,
        qualifiesForDiscount: true,
      },
      currencyInfo,
    );

    expect(variables.discountConditionDiff).toBe('5');
    expect(variables.discountValue).toBe('20');
    expect(variables.discountValueUnit).toBe('%');
  });
});

describe('TemplateManager.getDiscountMessageTemplate', () => {
  const bundle = {
    pricing: {
      rules: [
        { id: 'rule-2', conditionType: 'quantity', conditionOperator: 'gte', conditionValue: 2, discountValue: 770 },
        { id: 'rule-3', conditionType: 'quantity', conditionOperator: 'gte', conditionValue: 3, discountValue: 1540 },
      ],
      messages: {
        ruleMessages: {
          'rule-2': {
            discountText: 'Add one for tier 2',
            successMessage: 'Tier 2 reached',
          },
          'rule-3': {
            discountText: 'Add one for tier 3',
            successMessage: 'Tier 3 reached',
          },
        },
      },
    },
  };

  it('uses the next unsatisfied rule discount text for progress messages', () => {
    const template = TemplateManager.getDiscountMessageTemplate({
      bundle,
      totalQuantity: 2,
      totalPrice: 10000,
      discountInfo: {
        hasDiscount: true,
        applicableRule: bundle.pricing.rules[0],
      },
      messageType: 'progress',
      fallbackTemplate: 'Fallback progress',
    });

    expect(template).toBe('Add one for tier 3');
  });

  it('uses the applicable rule success text for qualified messages', () => {
    const template = TemplateManager.getDiscountMessageTemplate({
      bundle,
      totalQuantity: 2,
      totalPrice: 10000,
      discountInfo: {
        hasDiscount: true,
        applicableRule: bundle.pricing.rules[0],
      },
      messageType: 'success',
      fallbackTemplate: 'Fallback success',
    });

    expect(template).toBe('Tier 2 reached');
  });

  it('prefers configured tier text for qualified adaptive messages', () => {
    const template = TemplateManager.getDiscountMessageTemplate({
      bundle: {
        pricing: {
          rules: bundle.pricing.rules,
          messages: {
            ruleMessages: bundle.pricing.messages.ruleMessages,
            tierTextByRuleId: {
              'rule-2': {
                tierText: 'Nice! You are saving today',
                tierSubtext: 'Add one more to save more',
              },
            },
          },
        },
      },
      totalQuantity: 2,
      totalPrice: 10000,
      discountInfo: {
        hasDiscount: true,
        applicableRule: bundle.pricing.rules[0],
      },
      messageType: 'success',
      fallbackTemplate: 'Fallback success',
    });

    expect(template).toBe('Nice! You are saving today<br>Add one more to save more');
  });
});
