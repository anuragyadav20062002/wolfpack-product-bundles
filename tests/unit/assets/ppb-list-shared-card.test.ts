import { readProductPageWidgetSources } from './widget-source-helpers';
describe('PPB List shared card migration', () => {
  it('routes CASCADE/List in-page product rows through the shared row-mode product card', () => {
    const source = readProductPageWidgetSources();

    expect(source).toContain('if (usesCascadeCards) {');
    expect(source).toContain('renderSharedProductCard(');
    expect(source).toContain("mode: 'row'");
    expect(source).toContain("className: `bw-ppb-cascade-product-row gbbMixCascadeProductWrapper");
    expect(source).toContain('stockBadgeHtml: stockBadge');
    expect(source).toContain('addDisabled');
    expect(source).toContain('increaseDisabled');
  });
});
