import { readFullPageWidgetSources, readProductPageWidgetSources } from './widget-source-helpers';
describe('widget cart-line metadata integration', () => {
  it('delegates FPB cart-line source metadata to the shared helper', () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain('buildCartLineDisplayProperties as buildSharedCartLineDisplayProperties');
    expect(source).toContain('buildCartLineSourceProperties as buildSharedCartLineSourceProperties');
    expect(source).toContain('const sourceProperties = buildSharedCartLineSourceProperties({');
    expect(source).toContain('return buildSharedCartLineDisplayProperties(displayProperties, this.getCartLineLabels());');
  });

  it('delegates PPB cart-line source metadata to the shared helper', () => {
    const source = readProductPageWidgetSources();

    expect(source).toContain("import { buildCartLineSourceProperties } from '../../shared/engine/cart-lines.js';");
    expect(source).toContain('return buildCartLineSourceProperties({');
  });
});
