import { join } from 'path';

export const CSS_SIZE_LIMIT_BYTES = 100_000;

export function createTargets(rootDir) {
  return {
    css: [
      {
        source: join(rootDir, 'app/assets/widgets/full-page-css/bundle-widget-full-page.css'),
        target: join(rootDir, 'extensions/bundle-builder/assets/bundle-widget-full-page.css'),
      },
      {
        source: join(rootDir, 'app/assets/widgets/full-page-css/templates/side-footer-standard.css'),
        target: join(rootDir, 'extensions/bundle-builder/assets/bundle-widget-full-page-standard.css'),
      },
      {
        source: join(rootDir, 'app/assets/widgets/full-page-css/templates/side-footer-classic.css'),
        target: join(rootDir, 'extensions/bundle-builder/assets/bundle-widget-full-page-classic.css'),
      },
      {
        source: join(rootDir, 'app/assets/widgets/full-page-css/templates/side-footer-compact.css'),
        target: join(rootDir, 'extensions/bundle-builder/assets/bundle-widget-full-page-compact.css'),
      },
      {
        source: join(rootDir, 'app/assets/widgets/full-page-css/templates/side-footer-horizontal.css'),
        target: join(rootDir, 'extensions/bundle-builder/assets/bundle-widget-full-page-horizontal.css'),
      },
      {
        source: join(rootDir, 'app/assets/widgets/product-page-css/bundle-widget.css'),
        target: join(rootDir, 'extensions/bundle-builder/assets/bundle-widget.css'),
      },
      {
        source: join(rootDir, 'app/assets/widgets/product-page-css/templates/inpage-cascade.css'),
        target: join(rootDir, 'extensions/bundle-builder/assets/bundle-widget-product-page-cascade.css'),
      },
      {
        source: join(rootDir, 'app/assets/widgets/product-page-css/templates/inpage-cognive.css'),
        target: join(rootDir, 'extensions/bundle-builder/assets/bundle-widget-product-page-cognive.css'),
      },
      {
        source: join(rootDir, 'app/assets/widgets/product-page-css/templates/modal-slots.css'),
        target: join(rootDir, 'extensions/bundle-builder/assets/bundle-widget-product-page-modal.css'),
      },
      join(rootDir, 'extensions/bundle-builder/assets/modal-discount-bar.css'),
    ],
    js: [
      join(rootDir, 'extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js'),
      join(rootDir, 'extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js'),
    ],
  };
}
