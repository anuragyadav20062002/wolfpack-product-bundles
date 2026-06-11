import { readProductPageWidgetSources } from './widget-source-helpers';
describe('PPB shared discount progress integration', () => {
  it('renders product-page footer progress through the shared progress component', () => {
    const source = readProductPageWidgetSources();

    expect(source).toContain("import { renderDiscountProgress } from './widgets/shared/components/discount-progress.js';");
    expect(source).toContain('getDiscountProgressData({');
    expect(source).toContain('renderDiscountProgress(progressData, {');
    expect(source).toContain("className: `bundle-footer-messaging bw-ppb-discount-progress");
    expect(source).toContain("messageClassName: 'bw-ppb-discount-progress__message'");
    expect(source).toContain("trackClassName: 'bw-ppb-discount-progress__track'");
    expect(source).toContain("fillClassName: 'bw-ppb-discount-progress__fill'");
  });
});
