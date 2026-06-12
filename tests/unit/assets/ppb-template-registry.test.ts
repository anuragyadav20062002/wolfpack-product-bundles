// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  PPB_TEMPLATE_CONFIGS,
  resolveProductPageTemplateConfig,
} = require('../../../app/assets/widgets/product-page/templates/registry.js');

describe('PPB template registry resolver', () => {
  it('maps PDP_INPAGE + COGNIVE to Grid', () => {
    expect(resolveProductPageTemplateConfig({
      templateType: 'PDP_INPAGE',
      designPreset: 'COGNIVE',
    }).id).toBe('GRID');
  });

  it('maps PDP_INPAGE + CASCADE to List', () => {
    expect(resolveProductPageTemplateConfig({
      templateType: 'PDP_INPAGE',
      designPreset: 'CASCADE',
    }).id).toBe('LIST');
  });

  it('maps modal stacked slots to Horizontal Slots', () => {
    expect(resolveProductPageTemplateConfig({
      templateType: 'PDP_MODAL',
      designPreset: 'MODAL',
      renderFilledSlotsAsHorizontalStacked: true,
    }).id).toBe('HORIZONTAL_SLOTS');
  });

  it('maps PDP_MODAL + SIMPLIFIED to Vertical Slots', () => {
    expect(resolveProductPageTemplateConfig({
      templateType: 'PDP_MODAL',
      designPreset: 'SIMPLIFIED',
    }).id).toBe('VERTICAL_SLOTS');
  });

  it('maps modal non-stacked slots to Vertical Slots', () => {
    expect(resolveProductPageTemplateConfig({
      templateType: 'PDP_MODAL',
      designPreset: 'MODAL',
      renderFilledSlotsAsHorizontalStacked: false,
    }).id).toBe('VERTICAL_SLOTS');
  });

  it('exports all four target PPB configs', () => {
    expect(Object.keys(PPB_TEMPLATE_CONFIGS).sort()).toEqual([
      'GRID',
      'HORIZONTAL_SLOTS',
      'LIST',
      'VERTICAL_SLOTS',
    ]);
  });
});

describe('PPB template registry build inclusion', () => {
  it('inlines product-page configs and registry before template method modules', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('node:path');
    const script = fs.readFileSync(path.join(process.cwd(), 'scripts/build-widget-bundles.js'), 'utf8');
    const modulesStart = script.indexOf('const PRODUCT_PAGE_MODULES = [');
    const modulesEnd = script.indexOf('];', modulesStart);
    const modules = script.slice(modulesStart, modulesEnd);

    const registryIndex = modules.indexOf('app/assets/widgets/product-page/templates/registry.js');
    const cascadeIndex = modules.indexOf('app/assets/widgets/product-page/templates/cascade-template.js');
    const modalIndex = modules.indexOf('app/assets/widgets/product-page/templates/modal-slot-template.js');

    expect(modules).toContain('app/assets/widgets/product-page/templates/grid.config.js');
    expect(modules).toContain('app/assets/widgets/product-page/templates/list.config.js');
    expect(modules).toContain('app/assets/widgets/product-page/templates/horizontal-slots.config.js');
    expect(modules).toContain('app/assets/widgets/product-page/templates/vertical-slots.config.js');
    expect(registryIndex).toBeGreaterThanOrEqual(0);
    expect(cascadeIndex).toBeGreaterThan(registryIndex);
    expect(modalIndex).toBeGreaterThan(registryIndex);
  });
});
