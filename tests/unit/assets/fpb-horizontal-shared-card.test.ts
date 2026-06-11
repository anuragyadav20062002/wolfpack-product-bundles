import { readFullPageWidgetSources } from './widget-source-helpers';
describe('FPB Horizontal shared card migration', () => {
  it('routes HORIZONTAL product cards through shared row-mode product cards', () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("designPreset === 'HORIZONTAL'");
    expect(source).toContain('renderSharedProductCard');
    expect(source).toContain("mode: designPreset === 'HORIZONTAL' ? 'row' : 'grid'");
  });
});
