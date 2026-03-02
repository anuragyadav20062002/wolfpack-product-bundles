/**
 * Unit Tests — TemplateManager condition math
 *
 * Verifies operator-aware "remaining to qualify" calculations used for
 * discount messaging, especially strict operators that are prone to
 * off-by-one regressions.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TemplateManager } = require('../../../app/assets/widgets/shared/template-manager.js');

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

