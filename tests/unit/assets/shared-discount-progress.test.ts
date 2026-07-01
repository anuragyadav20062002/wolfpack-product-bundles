// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getDiscountProgressData } = require('../../../app/assets/widgets/shared/engine/bundle-selectors.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderDiscountProgress } = require('../../../app/assets/widgets/shared/components/discount-progress.js');

describe('shared discount progress data selector', () => {
  it('normalizes in-progress data', () => {
    expect(getDiscountProgressData({
      currentValue: 2,
      targetValue: 5,
      message: 'Add 3 more',
    })).toEqual({
      currentValue: 2,
      targetValue: 5,
      progressPercent: 40,
      message: 'Add 3 more',
      success: false,
    });
  });

  it('clamps over-complete data to 100 percent', () => {
    expect(getDiscountProgressData({
      currentValue: 7,
      targetValue: 5,
      message: 'Unlocked',
    })).toMatchObject({
      progressPercent: 100,
      success: true,
    });
  });

  it('handles zero target safely', () => {
    expect(getDiscountProgressData({
      currentValue: 2,
      targetValue: 0,
      message: 'No target',
    })).toMatchObject({
      progressPercent: 0,
      success: false,
    });
  });
});

describe('shared discount progress renderer', () => {
  it('escapes progress message text', () => {
    const view = renderDiscountProgress({
      currentValue: 1,
      targetValue: 2,
      progressPercent: 50,
      message: '<strong>Save</strong>',
      success: false,
    });

    expect(view).toContain('&lt;strong&gt;Save&lt;/strong&gt;');
    expect(view).not.toContain('<strong>Save</strong>');
  });
});
