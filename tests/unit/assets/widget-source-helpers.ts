import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function read(filePath: string) {
  return readFileSync(join(process.cwd(), filePath), 'utf8');
}

function readMethodSources(dirPath: string) {
  return readdirSync(join(process.cwd(), dirPath))
    .filter((file) => file.endsWith('.js'))
    .sort()
    .map((file) => read(`${dirPath}/${file}`))
    .join('\n');
}

export function readFullPageWidgetSources() {
  return [
    read('app/assets/bundle-widget-full-page.js'),
    readMethodSources('app/assets/widgets/full-page/methods'),
    readMethodSources('app/assets/widgets/full-page/templates'),
    readMethodSources('app/assets/widgets/full-page/modal'),
    readMethodSources('app/assets/widgets/shared'),
    readMethodSources('app/assets/widgets/shared/components'),
    readMethodSources('app/assets/widgets/shared/engine'),
  ].join('\n');
}

export function readProductPageWidgetSources() {
  return [
    read('app/assets/bundle-widget-product-page.js'),
    readMethodSources('app/assets/widgets/product-page/methods'),
    readMethodSources('app/assets/widgets/product-page/templates'),
    readMethodSources('app/assets/widgets/shared'),
    readMethodSources('app/assets/widgets/shared/components'),
    readMethodSources('app/assets/widgets/shared/engine'),
  ].join('\n');
}
