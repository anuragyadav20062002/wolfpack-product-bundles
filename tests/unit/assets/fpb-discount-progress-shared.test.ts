import { readFullPageWidgetSources } from './widget-source-helpers';
describe('FPB shared discount progress integration', () => {
  it('renders FPB progress through the shared progress component', () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("import { renderDiscountProgress } from './widgets/shared/components/discount-progress.js';");
    expect(source).toContain('const progressData = getDiscountProgressData({');
    expect(source).toContain('renderDiscountProgress(progressData, {');
    expect(source).toContain("className: progressBarType === 'simple'");
    expect(source).toContain("progressData.milestones = progressBarType === 'step_based' ? milestones : [];");
    expect(source).toContain("milestoneListClassName: 'fpb-discount-step-list'");
    expect(source).toContain("subtitleListClassName: placement === 'sidebar' ? 'fpb-discount-step-subtitle-list' : ''");
    expect(source).not.toContain('renderStepBasedDiscountProgress(progressPct, milestones, isReached, placement)');
  });
});
