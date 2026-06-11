import { readFullPageWidgetSources } from './widget-source-helpers';
describe('FPB Compact shared card migration', () => {
  it('routes COMPACT product cards through the shared product-card renderer', () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("designPreset === 'COMPACT'");
    expect(source).toContain('renderSharedProductCard');
    expect(source).toContain("mode: designPreset === 'HORIZONTAL' ? 'row' : 'grid'");
  });
});
