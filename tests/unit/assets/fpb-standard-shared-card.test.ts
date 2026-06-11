import { readFullPageWidgetSources } from './widget-source-helpers';
describe('FPB Standard shared card migration', () => {
  it('routes DEFAULT product cards through the shared product-card renderer', () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("renderSharedProductCard");
    expect(source).toContain("designPreset === 'DEFAULT'");
    expect(source).toContain("mode: designPreset === 'HORIZONTAL' ? 'row' : 'grid'");
    expect(source).toContain("addButtonText: this.getProductAddButtonText()");
  });

  it('routes DEFAULT sidebar rows through the shared selected-row renderer', () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain('renderSelectedProductRow');
    expect(source).toContain('createStandardSidebarSelectedRow');
    expect(source).toContain('if (isStandardDesktopSidebar) {');
    expect(source).toContain("data-action=\"remove-selected-product\"");
  });

  it('routes DEFAULT sidebar discount progress through the shared progress renderer', () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain('renderDiscountProgress');
    expect(source).toContain('getDiscountProgressData');
    expect(source).toContain('createStandardSidebarDiscountProgress');
    expect(source).toContain("bw-discount-progress");
  });
});
