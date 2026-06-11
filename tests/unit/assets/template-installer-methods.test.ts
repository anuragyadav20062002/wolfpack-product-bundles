// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('node:fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('node:path');

const templateInstallerFiles = [
  'app/assets/widgets/product-page/templates/cascade-template.js',
  'app/assets/widgets/product-page/templates/cognive-template.js',
  'app/assets/widgets/product-page/templates/modal-slot-template.js',
  'app/assets/widgets/full-page/templates/standard-template.js',
  'app/assets/widgets/full-page/templates/classic-template.js',
  'app/assets/widgets/full-page/templates/compact-template.js',
  'app/assets/widgets/full-page/templates/horizontal-template.js',
];

describe('template installer method attachments', () => {
  it.each(templateInstallerFiles)('%s does not assign individual prototype methods', (relativePath) => {
    const source = fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

    expect(source).not.toContain('const prototype =');
    expect(source).not.toContain('prototype.');
  });
});
