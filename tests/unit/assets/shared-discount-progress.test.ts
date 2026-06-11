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
  it('renders a progress bar from prepared data', () => {
    const html = renderDiscountProgress({
      currentValue: 2,
      targetValue: 5,
      progressPercent: 40,
      message: 'Add 3 more',
      success: false,
    });

    expect(html).toContain('data-bw-discount-progress="true"');
    expect(html).toContain('bw-discount-progress__message');
    expect(html).toContain('bw-discount-progress__track');
    expect(html).toContain('bw-discount-progress__fill');
    expect(html).toContain('--bw-discount-progress-width:40%');
    expect(html).toContain('Add 3 more');
  });

  it('escapes progress message text', () => {
    const html = renderDiscountProgress({
      currentValue: 1,
      targetValue: 2,
      progressPercent: 50,
      message: '<strong>Save</strong>',
      success: false,
    });

    expect(html).toContain('&lt;strong&gt;Save&lt;/strong&gt;');
    expect(html).not.toContain('<strong>Save</strong>');
  });

  it('supports stepped mode', () => {
    const html = renderDiscountProgress({
      currentValue: 5,
      targetValue: 5,
      progressPercent: 100,
      message: 'Unlocked',
      success: true,
    }, { mode: 'stepped' });

    expect(html).toContain('bw-discount-progress--mode-stepped');
    expect(html).toContain('bw-discount-progress--success');
  });

  it('renders optional milestone labels through the shared contract', () => {
    const html = renderDiscountProgress({
      currentValue: 2,
      targetValue: 4,
      progressPercent: 50,
      success: false,
      milestones: [
        { title: '2 items', subTitle: 'Save 10%', isReached: true },
        { title: '4 items', subTitle: 'Save 20%', isReached: false },
      ],
    }, {
      mode: 'stepped',
      milestoneListClassName: 'fpb-discount-step-list',
      milestoneClassName: 'fpb-discount-step',
      milestoneReachedClassName: 'fpb-discount-step-reached',
      milestoneTitleClassName: 'fpb-discount-step-title',
      milestoneSubtitleClassName: 'fpb-discount-step-subtitle',
      subtitleListClassName: 'fpb-discount-step-subtitle-list',
      renderSubtitleList: true,
    });

    expect(html).toContain('fpb-discount-step-list');
    expect(html).toContain('fpb-discount-step fpb-discount-step-reached');
    expect(html).toContain('fpb-discount-step-title');
    expect(html).toContain('fpb-discount-step-subtitle-list');
    expect(html).toContain('2 items');
    expect(html).toContain('Save 20%');
  });
});
