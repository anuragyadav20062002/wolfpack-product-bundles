// eslint-disable-next-line @typescript-eslint/no-require-imports
const { FPB_CLASSIC_TEMPLATE_CONFIG } = require('../../../app/assets/widgets/full-page/templates/classic.config.js');

describe('FPB Classic template config contract', () => {
  it('keeps the CLASSIC preset mapping', () => {
    expect(FPB_CLASSIC_TEMPLATE_CONFIG.id).toBe('CLASSIC');
    expect(FPB_CLASSIC_TEMPLATE_CONFIG.presetId).toBe('CLASSIC');
    expect(FPB_CLASSIC_TEMPLATE_CONFIG.aliases).toEqual(expect.arrayContaining(['CLASSIC']));
  });

  it('declares shared primitives for later renderer migration', () => {
    expect(FPB_CLASSIC_TEMPLATE_CONFIG.productCard.mode).toBe('grid');
    expect(FPB_CLASSIC_TEMPLATE_CONFIG.summary.mode).toBe('slots');
    expect(FPB_CLASSIC_TEMPLATE_CONFIG.discountProgress.mode).toBe('stepped');
  });
});

describe('FPB Classic build inclusion', () => {
  it('inlines Classic config before the Classic template installer', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('node:path');
    const script = fs.readFileSync(path.join(process.cwd(), 'scripts/build-widget-bundles.js'), 'utf8');
    const fullPageModulesStart = script.indexOf('const FULL_PAGE_MODULES = [');
    const fullPageModulesEnd = script.indexOf('];', fullPageModulesStart);
    const fullPageModules = script.slice(fullPageModulesStart, fullPageModulesEnd);

    const configIndex = fullPageModules.indexOf('app/assets/widgets/full-page/templates/classic.config.js');
    const templateIndex = fullPageModules.indexOf('app/assets/widgets/full-page/templates/classic-template.js');

    expect(configIndex).toBeGreaterThanOrEqual(0);
    expect(templateIndex).toBeGreaterThan(configIndex);
  });
});
