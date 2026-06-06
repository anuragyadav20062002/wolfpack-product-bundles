import fs from 'node:fs';
import path from 'node:path';

describe('widget build shared module list', () => {
  it('inlines the loading overlay helper before widget entry files', () => {
    const script = fs.readFileSync(path.join(process.cwd(), 'scripts/build-widget-bundles.js'), 'utf8');
    const sharedModulesStart = script.indexOf('const SHARED_MODULES = [');
    const sharedModulesEnd = script.indexOf('];', sharedModulesStart);
    const sharedModules = script.slice(sharedModulesStart, sharedModulesEnd);

    expect(sharedModules).toContain("app/assets/widgets/shared/loading-overlay.js");
  });
});
