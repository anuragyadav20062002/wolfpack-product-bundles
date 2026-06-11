import { readProductPageWidgetSources } from './widget-source-helpers';
describe('PPB Grid shared card migration', () => {
  it('routes COGNIVE/Grid in-page cards through the shared grid-mode product card', () => {
    const source = readProductPageWidgetSources();

    expect(source).toContain("import { renderSharedProductCard } from './widgets/shared/components/product-card.js';");
    expect(source).toContain('if (usesGridCards) {');
    expect(source).toContain('renderSharedProductCard(');
    expect(source).toContain("mode: 'grid'");
    expect(source).toContain("className: `bw-ppb-cognive-product-card");
    expect(source).toContain('stockBadgeHtml: stockBadge');
    expect(source).toContain('addDisabled');
    expect(source).toContain('increaseDisabled');
  });
});
