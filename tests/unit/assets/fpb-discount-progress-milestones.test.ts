export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageStepFooterMethods } = require('../../../app/assets/widgets/full-page/methods/step-footer-methods.js');

function makeContext(pricing: any) {
  return {
    selectedBundle: { pricing },
    getBoxSelectionRules: () => [],
  };
}

describe('fullPageStepFooterMethods.getDiscountProgressMilestones', () => {
  it('derives FPB quantity milestone labels and subtitles from actual discount rules', () => {
    const milestones = fullPageStepFooterMethods.getDiscountProgressMilestones.call(
      makeContext({
        method: 'percentage_off',
        rules: [
          {
            id: 'rule-3',
            conditionType: 'quantity',
            conditionValue: 3,
            discountValue: 10,
          },
        ],
      }),
      0,
      1,
    );

    expect(milestones).toEqual([
      {
        ruleId: 'rule-3',
        title: '3 Pack',
        subTitle: 'Save 10%',
        isReached: false,
      },
    ]);
  });

  it('preserves configured merchant milestone text over generated fallback text', () => {
    const milestones = fullPageStepFooterMethods.getDiscountProgressMilestones.call(
      makeContext({
        method: 'percentage_off',
        messages: {
          tierTextByRuleId: {
            'rule-5': {
              tierText: '5 Pack',
              tierSubtext: 'Best value',
            },
          },
        },
        rules: [
          {
            id: 'rule-5',
            conditionType: 'quantity',
            conditionValue: 5,
            discountValue: 20,
          },
        ],
      }),
      0,
      5,
    );

    expect(milestones).toEqual([
      {
        ruleId: 'rule-5',
        title: '5 Pack',
        subTitle: 'Best value',
        isReached: true,
      },
    ]);
  });
});
