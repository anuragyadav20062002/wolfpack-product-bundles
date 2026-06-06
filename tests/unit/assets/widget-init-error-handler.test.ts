import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readAsset(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('widget init error handlers', () => {
  it.each([
    'app/assets/bundle-widget-product-page.js',
    'app/assets/bundle-widget-full-page.js',
  ])('%s constructor catch uses the existing error UI method', (relativePath) => {
    const source = readAsset(relativePath);
    expect(source).not.toContain('this.showError(error.message)');
    expect(source).toContain('this.showErrorUI(error);');
  });
});
