// eslint-disable-next-line @typescript-eslint/no-require-imports
const { FPB_COMPACT_TEMPLATE_CONFIG } = require('../../../app/assets/widgets/full-page/templates/compact.config.js');

describe('FPB Compact template config contract', () => {
  it('keeps the COMPACT preset mapping', () => {
    expect(FPB_COMPACT_TEMPLATE_CONFIG.id).toBe('COMPACT');
    expect(FPB_COMPACT_TEMPLATE_CONFIG.presetId).toBe('COMPACT');
    expect(FPB_COMPACT_TEMPLATE_CONFIG.aliases).toEqual(expect.arrayContaining(['COMPACT']));
  });

  it('declares shared primitives for later renderer migration', () => {
    expect(FPB_COMPACT_TEMPLATE_CONFIG.productCard.mode).toBe('compact');
    expect(FPB_COMPACT_TEMPLATE_CONFIG.summary.mode).toBe('compactSlots');
    expect(FPB_COMPACT_TEMPLATE_CONFIG.discountProgress.mode).toBe('stepped');
  });
});

describe('FPB Compact build inclusion', () => {
  it('inlines Compact config before the Compact template installer', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('node:path');
    const script = fs.readFileSync(path.join(process.cwd(), 'scripts/build-widget-bundles.js'), 'utf8');
    const fullPageModulesStart = script.indexOf('const FULL_PAGE_MODULES = [');
    const fullPageModulesEnd = script.indexOf('];', fullPageModulesStart);
    const fullPageModules = script.slice(fullPageModulesStart, fullPageModulesEnd);

    const configIndex = fullPageModules.indexOf('app/assets/widgets/full-page/templates/compact.config.js');
    const templateIndex = fullPageModules.indexOf('app/assets/widgets/full-page/templates/compact-template.js');

    expect(configIndex).toBeGreaterThanOrEqual(0);
    expect(templateIndex).toBeGreaterThan(configIndex);
  });
});
