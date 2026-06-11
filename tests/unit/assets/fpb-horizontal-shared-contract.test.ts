// eslint-disable-next-line @typescript-eslint/no-require-imports
const { FPB_HORIZONTAL_TEMPLATE_CONFIG } = require('../../../app/assets/widgets/full-page/templates/horizontal.config.js');

describe('FPB Horizontal template config contract', () => {
  it('keeps the HORIZONTAL preset mapping', () => {
    expect(FPB_HORIZONTAL_TEMPLATE_CONFIG.id).toBe('HORIZONTAL');
    expect(FPB_HORIZONTAL_TEMPLATE_CONFIG.presetId).toBe('HORIZONTAL');
    expect(FPB_HORIZONTAL_TEMPLATE_CONFIG.aliases).toEqual(expect.arrayContaining(['HORIZONTAL']));
  });

  it('declares shared primitives for later renderer migration', () => {
    expect(FPB_HORIZONTAL_TEMPLATE_CONFIG.productCard.mode).toBe('row');
    expect(FPB_HORIZONTAL_TEMPLATE_CONFIG.summary.mode).toBe('rows');
    expect(FPB_HORIZONTAL_TEMPLATE_CONFIG.discountProgress.mode).toBe('stepped');
  });
});

describe('FPB Horizontal build inclusion', () => {
  it('inlines Horizontal config before the Horizontal template installer', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('node:path');
    const script = fs.readFileSync(path.join(process.cwd(), 'scripts/build-widget-bundles.js'), 'utf8');
    const fullPageModulesStart = script.indexOf('const FULL_PAGE_MODULES = [');
    const fullPageModulesEnd = script.indexOf('];', fullPageModulesStart);
    const fullPageModules = script.slice(fullPageModulesStart, fullPageModulesEnd);

    const configIndex = fullPageModules.indexOf('app/assets/widgets/full-page/templates/horizontal.config.js');
    const templateIndex = fullPageModules.indexOf('app/assets/widgets/full-page/templates/horizontal-template.js');

    expect(configIndex).toBeGreaterThanOrEqual(0);
    expect(templateIndex).toBeGreaterThan(configIndex);
  });
});
