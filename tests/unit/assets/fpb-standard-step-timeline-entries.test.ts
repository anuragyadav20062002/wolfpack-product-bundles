// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageTimelineBannerMethods } = require('../../../app/assets/widgets/full-page/methods/timeline-banner-methods.js');

function makeContext(preset: string) {
  return {
    getFullPageDesignPreset: () => preset,
    getStepCategoryTabEntries: () => [
      { id: 'category-1', title: 'Category 1' },
      { id: 'category-2', title: 'Category 2' },
    ],
  };
}

describe('FPB step timeline entries', () => {
  it('does not promote Standard category tabs into timeline entries', () => {
    const result = fullPageTimelineBannerMethods.shouldRenderMultipleCategoryTimelineEntry.call(
      makeContext('STANDARD'),
      { name: 'Step 1' }
    );

    expect(result).toBe(false);
  });

  it.each(['CLASSIC', 'COMPACT', 'HORIZONTAL'])(
    'does not promote %s category tabs into timeline entries',
    (preset) => {
      const result = fullPageTimelineBannerMethods.shouldRenderMultipleCategoryTimelineEntry.call(
        makeContext(preset),
        { name: 'Step 1' }
      );

      expect(result).toBe(false);
    }
  );

  it('does not promote free gift steps into category timeline entries', () => {
    const result = fullPageTimelineBannerMethods.shouldRenderMultipleCategoryTimelineEntry.call(
      makeContext('STANDARD'),
      { name: 'Add On', isFreeGift: true }
    );

    expect(result).toBe(false);
  });
});
