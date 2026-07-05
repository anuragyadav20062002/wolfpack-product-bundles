// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  FPB_TEMPLATE_CONFIGS,
  resolveFullPageTemplateConfig,
} = require('../../../app/assets/widgets/full-page/templates/registry.js');

describe('FPB template registry resolver', () => {
  it('maps STANDARD to Standard', () => {
    expect(resolveFullPageTemplateConfig({ presetId: 'STANDARD' }).id).toBe('STANDARD');
  });

  it('does not expose DEFAULT or DEFAULT_FBP as Standard aliases', () => {
    expect(FPB_TEMPLATE_CONFIGS.STANDARD.aliases).toEqual(['STANDARD']);
  });

  it('maps CLASSIC, COMPACT, and HORIZONTAL presets', () => {
    expect(resolveFullPageTemplateConfig({ presetId: 'CLASSIC' }).id).toBe('CLASSIC');
    expect(resolveFullPageTemplateConfig({ presetId: 'COMPACT' }).id).toBe('COMPACT');
    expect(resolveFullPageTemplateConfig({ presetId: 'HORIZONTAL' }).id).toBe('HORIZONTAL');
  });

  it('exports all four target FPB configs', () => {
    expect(Object.keys(FPB_TEMPLATE_CONFIGS).sort()).toEqual([
      'CLASSIC',
      'COMPACT',
      'HORIZONTAL',
      'STANDARD',
    ]);
  });

  it('uses the Standard step timeline renderer for Classic', () => {
    expect(FPB_TEMPLATE_CONFIGS.CLASSIC.timeline.mode).toBe(
      FPB_TEMPLATE_CONFIGS.STANDARD.timeline.mode,
    );
    expect(FPB_TEMPLATE_CONFIGS.CLASSIC.timeline.mode).toBe('standard');
  });

  it('inlines the registry before full-page template method modules', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('node:path');
    const script = fs.readFileSync(path.join(process.cwd(), 'scripts/build-widget-bundles.js'), 'utf8');
    const modulesStart = script.indexOf('const FULL_PAGE_MODULES = [');
    const modulesEnd = script.indexOf('];', modulesStart);
    const modules = script.slice(modulesStart, modulesEnd);

    const registryIndex = modules.indexOf('app/assets/widgets/full-page/templates/registry.js');
    const standardInstallerIndex = modules.indexOf('app/assets/widgets/full-page/templates/standard-template.js');
    const classicInstallerIndex = modules.indexOf('app/assets/widgets/full-page/templates/classic-template.js');

    expect(registryIndex).toBeGreaterThanOrEqual(0);
    expect(standardInstallerIndex).toBeGreaterThan(registryIndex);
    expect(classicInstallerIndex).toBeGreaterThan(registryIndex);
  });
});
