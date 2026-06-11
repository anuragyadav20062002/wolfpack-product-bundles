import { readFullPageWidgetSources } from './widget-source-helpers';
describe('FPB Classic shared component migration', () => {
  it('routes CLASSIC product cards through the shared product-card renderer', () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("designPreset === 'CLASSIC'");
    expect(source).toContain('renderSharedProductCard');
    expect(source).toContain("mode: designPreset === 'HORIZONTAL' ? 'row' : 'grid'");
  });

  it('routes Classic sidebar slots through the shared selected-slots renderer', () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain('renderSelectedProductSlots');
    expect(source).toContain('classic-sidebar-slots');
    expect(source).toContain('bw-selected-slots--classic-sidebar');
    expect(source).toContain("data-action=\"remove-selected-product\"");
  });
});
