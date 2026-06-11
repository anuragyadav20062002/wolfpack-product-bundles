// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ComponentGenerator } = require('../../../app/assets/widgets/shared/component-generator.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { FPB_STANDARD_TEMPLATE_CONFIG } = require('../../../app/assets/widgets/full-page/templates/standard.config.js');

const currencyInfo = {
  display: {
    format: '${{amount}}',
  },
};

describe('FPB Standard template config contract', () => {
  it('keeps DEFAULT and STANDARD aliases for current payloads', () => {
    expect(FPB_STANDARD_TEMPLATE_CONFIG.id).toBe('STANDARD');
    expect(FPB_STANDARD_TEMPLATE_CONFIG.presetId).toBe('DEFAULT');
    expect(FPB_STANDARD_TEMPLATE_CONFIG.aliases).toEqual(expect.arrayContaining(['DEFAULT', 'STANDARD', 'DEFAULT_FBP']));
  });

  it('declares shared primitives for later renderer migration', () => {
    expect(FPB_STANDARD_TEMPLATE_CONFIG.productCard.mode).toBe('grid');
    expect(FPB_STANDARD_TEMPLATE_CONFIG.summary.mode).toBe('rows');
    expect(FPB_STANDARD_TEMPLATE_CONFIG.discountProgress.mode).toBe('stepped');
  });
});

describe('FPB Standard product card shared DOM hooks', () => {
  it('adds shared product card hooks while preserving legacy classes', () => {
    const cardHtml = ComponentGenerator.renderProductCard({
      id: 'product-1',
      variantId: 'variant-1',
      title: 'The Complete Snowboard',
      imageUrl: 'https://cdn.example.com/snowboard.jpg',
      price: 69995,
    }, 0, currencyInfo, { actionMode: 'expandingQuantity', addButtonText: '+' });

    expect(cardHtml).toContain('product-card');
    expect(cardHtml).toContain('bw-product-card');
    expect(cardHtml).toContain('data-bw-product-card="true"');
    expect(cardHtml).toContain('product-image bw-product-card__media');
    expect(cardHtml).toContain('product-content-wrapper bw-product-card__body');
    expect(cardHtml).toContain('product-card-action bw-product-card__action');
    expect(cardHtml).toContain('product-add-btn');
  });

  it('keeps selected quantity controls inside the shared action region', () => {
    const cardHtml = ComponentGenerator.renderProductCard({
      id: 'product-1',
      variantId: 'variant-1',
      title: 'The Complete Snowboard',
      imageUrl: 'https://cdn.example.com/snowboard.jpg',
      price: 69995,
    }, 2, currencyInfo, { actionMode: 'expandingQuantity' });

    expect(cardHtml).toContain('bw-product-card--selected selected');
    expect(cardHtml).toContain('product-card-action bw-product-card__action is-expanded');
    expect(cardHtml).toContain('inline-quantity-controls bw-quantity-control');
    expect(cardHtml).toContain('inline-qty-display bw-quantity-control__value');
  });
});

describe('FPB Standard build inclusion', () => {
  it('inlines Standard config before the Standard template installer', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('node:path');
    const script = fs.readFileSync(path.join(process.cwd(), 'scripts/build-widget-bundles.js'), 'utf8');
    const fullPageModulesStart = script.indexOf('const FULL_PAGE_MODULES = [');
    const fullPageModulesEnd = script.indexOf('];', fullPageModulesStart);
    const fullPageModules = script.slice(fullPageModulesStart, fullPageModulesEnd);

    const configIndex = fullPageModules.indexOf('app/assets/widgets/full-page/templates/standard.config.js');
    const templateIndex = fullPageModules.indexOf('app/assets/widgets/full-page/templates/standard-template.js');

    expect(configIndex).toBeGreaterThanOrEqual(0);
    expect(templateIndex).toBeGreaterThan(configIndex);
  });
});
