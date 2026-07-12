#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

const WIDGET_VERSION = '5.0.143';

// Shared component modules (in dependency order)
const SHARED_MODULES = [
  join(ROOT_DIR, 'app/assets/widgets/shared/condition-validator.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/constants.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/currency-manager.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/bundle-data-manager.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/pricing-calculator.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/toast-manager.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/template-manager.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/component-generator.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/default-loading-animation.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/loading-overlay.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/bundle-level-css-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/variant-selector.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/full-page-preset.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/mixin-descriptors.js'),
];

const WIDGET_SHARED_MODULES = [
  ...SHARED_MODULES,
  join(ROOT_DIR, 'app/assets/widgets/shared/variant-selector-policy.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/components/discount-progress.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/components/bundle-banners.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/components/quantity-control.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/components/product-card.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/components/selected-product-row.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/components/selected-product-slots.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/components/step-timeline.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/engine/create-bundle-state.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/engine/bundle-selectors.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/engine/bundle-actions.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/engine/cart-lines.js'),
  join(ROOT_DIR, 'app/assets/widgets/shared/engine/cart-submit.js'),
];

const SOURCES = {
  modal: join(ROOT_DIR, 'app/assets/bundle-modal-component.js'),
  fullPage: join(ROOT_DIR, 'app/assets/bundle-widget-full-page.js'),
  productPage: join(ROOT_DIR, 'app/assets/bundle-widget-product-page.js'),
  sdk: join(ROOT_DIR, 'app/assets/sdk/wolfpack-bundles.js'),
};

const SDK_MODULES = [
  join(ROOT_DIR, 'app/assets/sdk/state.js'),
  join(ROOT_DIR, 'app/assets/sdk/config-loader.js'),
  join(ROOT_DIR, 'app/assets/sdk/events.js'),
  join(ROOT_DIR, 'app/assets/sdk/cart.js'),
  join(ROOT_DIR, 'app/assets/sdk/validate-bundle.js'),
  join(ROOT_DIR, 'app/assets/sdk/get-display-price.js'),
  join(ROOT_DIR, 'app/assets/sdk/debug.js'),
];

const PRODUCT_PAGE_MODULES = [
  join(ROOT_DIR, 'app/assets/widgets/product-page/single-step-categories.js'),
  join(ROOT_DIR, 'app/assets/widgets/product-page/templates/grid.config.js'),
  join(ROOT_DIR, 'app/assets/widgets/product-page/templates/list.config.js'),
  join(ROOT_DIR, 'app/assets/widgets/product-page/templates/horizontal-slots.config.js'),
  join(ROOT_DIR, 'app/assets/widgets/product-page/templates/vertical-slots.config.js'),
  join(ROOT_DIR, 'app/assets/widgets/product-page/templates/registry.js'),
  join(ROOT_DIR, 'app/assets/widgets/product-page/templates/modal-slot-template.js'),
  join(ROOT_DIR, 'app/assets/widgets/product-page/templates/cascade-template.js'),
  join(ROOT_DIR, 'app/assets/widgets/product-page/templates/cognive-template.js'),
  join(ROOT_DIR, 'app/assets/widgets/product-page/methods/config-lifecycle-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/product-page/methods/default-product-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/product-page/methods/dom-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/product-page/methods/footer-modal-state-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/product-page/methods/modal-state-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/product-page/methods/widget-misc-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/product-page/methods/layout-shell-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/product-page/methods/inpage-render-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/product-page/methods/product-data-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/product-page/methods/selection-data-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/product-page/methods/modal-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/product-page/methods/selection-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/product-page/methods/cart-methods.js'),
];

const MODAL_MODULES = [
  join(ROOT_DIR, 'app/assets/widgets/full-page/modal/variant-methods.js'),
];

const FULL_PAGE_MODULES = [
  join(ROOT_DIR, 'app/assets/widgets/full-page/templates/standard.config.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/templates/classic.config.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/templates/compact.config.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/templates/horizontal.config.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/templates/registry.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/templates/standard-template.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/templates/classic-template.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/templates/compact-template.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/templates/horizontal-template.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/shared/summary-pricing-display.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/methods/analytics-config-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/methods/initial-render-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/methods/responsive-layout-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/methods/mobile-summary-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/methods/side-panel-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/methods/box-selection-sidebar-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/methods/timeline-banner-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/methods/search-category-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/methods/product-grid-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/methods/product-card-footer-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/methods/footer-selection-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/methods/validation-addons-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/methods/step-footer-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/methods/discount-modal-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/methods/clear-cart-confirmation-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/methods/product-processing-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/methods/modal-product-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/methods/selection-navigation-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/methods/runtime-cart-settings-methods.js'),
  join(ROOT_DIR, 'app/assets/widgets/full-page/methods/tier-floating-runtime-methods.js'),
];

const OUTPUTS = {
  fullPage: join(ROOT_DIR, 'extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js'),
  productPage: join(ROOT_DIR, 'extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js'),
  sdk: join(ROOT_DIR, 'extensions/bundle-builder/assets/wolfpack-bundles-sdk.js'),
};

function buildBanner(widgetType) {
  const buildDate = new Date().toISOString().split('T')[0];
  return `/*!
 * Wolfpack Bundle Widget — ${widgetType}
 * Version : ${WIDGET_VERSION}
 * Built   : ${buildDate}
 *
 * Cache note: Shopify CDN cache is busted automatically by shopify app deploy.
 * After deploying, allow 2-10 minutes for propagation before testing.
 * Verify live version: console.log(window.__BUNDLE_WIDGET_VERSION__)
 */
window.__BUNDLE_WIDGET_VERSION__ = '${WIDGET_VERSION}';`;
}

function readFile(path) {
  try {
    return readFileSync(path, 'utf-8');
  } catch (error) {
    console.error(`Error reading file: ${path}`);
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * Remove ES module import/export statements from code
 */
function removeModuleStatements(code) {
  // Remove import statements (single line and multiline)
  code = code.replace(/^import\s+\{[\s\S]*?\}\s+from\s+['"][^'"]+['"];?\s*$/gm, '');
  code = code.replace(/^import\s+.*\s+from\s+['"][^'"]+['"];?\s*$/gm, '');

  // Remove export statements
  code = code.replace(/^export\s+\{[\s\S]*?\};?\s*$/gm, '');
  code = code.replace(/^export\s+(default\s+)?/gm, '');

  // Remove window exports (we'll handle these differently in the bundle)
  code = code.replace(/^window\.\w+\s*=\s*\w+;?\s*$/gm, '');

  return code;
}

/**
 * Remove 'use strict' statements (will be added once at the top of bundle)
 */
function removeUseStrict(code) {
  return code.replace(/^['"]use strict['"];?\s*$/gm, '');
}

/**
 * Remove CommonJS module.exports guards from SDK modules before concatenating
 * them inside the browser IIFE.
 */
function removeCommonJsExports(code) {
  const marker = 'if (typeof module';
  let result = code;
  let markerIndex = result.indexOf(marker);

  while (markerIndex !== -1) {
    const blockStart = result.indexOf('{', markerIndex);
    if (blockStart === -1) break;

    let depth = 0;
    let blockEnd = -1;
    for (let index = blockStart; index < result.length; index += 1) {
      const char = result[index];
      if (char === '{') depth += 1;
      if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          blockEnd = index + 1;
          break;
        }
      }
    }

    if (blockEnd === -1) break;

    while (blockEnd < result.length && /\s/.test(result[blockEnd])) {
      blockEnd += 1;
    }

    result = `${result.slice(0, markerIndex)}${result.slice(blockEnd)}`;
    markerIndex = result.indexOf(marker);
  }

  return result;
}

/**
 * Read and process all shared component modules
 */
function readSharedComponents(modules = SHARED_MODULES) {
  const moduleCodes = [];

  for (const modulePath of modules) {
    if (!existsSync(modulePath)) {
      console.error(`Missing module file: ${modulePath}`);
      process.exit(1);
    }

    const code = readFile(modulePath);
    const processed = removeUseStrict(removeModuleStatements(code));
    moduleCodes.push(processed);
  }

  return moduleCodes.join('\n\n');
}

/**
 * Read and inline all SDK-specific modules (state, cart, validate, etc.)
 */
function readSdkModules() {
  const moduleCodes = [];
  for (const modulePath of SDK_MODULES) {
    if (!existsSync(modulePath)) {
      console.error(`Missing SDK module: ${modulePath}`);
      process.exit(1);
    }
    const code = readFile(modulePath);
    // Strip CJS module.exports guard — not needed inside the IIFE
    const processed = removeCommonJsExports(removeUseStrict(code));
    moduleCodes.push(processed);
  }
  return moduleCodes.join('\n\n');
}

function readProductPageModules() {
  const moduleCodes = [];
  for (const modulePath of PRODUCT_PAGE_MODULES) {
    if (!existsSync(modulePath)) {
      console.error(`Missing product-page module: ${modulePath}`);
      process.exit(1);
    }

    const code = readFile(modulePath);
    const processed = removeUseStrict(removeModuleStatements(code));
    moduleCodes.push(processed);
  }
  return moduleCodes.join('\n\n');
}

function readFullPageModules() {
  const moduleCodes = [];
  for (const modulePath of FULL_PAGE_MODULES) {
    if (!existsSync(modulePath)) {
      console.error(`Missing full-page module: ${modulePath}`);
      process.exit(1);
    }

    const code = readFile(modulePath);
    const processed = removeUseStrict(removeModuleStatements(code));
    moduleCodes.push(processed);
  }
  return moduleCodes.join('\n\n');
}

function readModalModules() {
  const moduleCodes = [];
  for (const modulePath of MODAL_MODULES) {
    if (!existsSync(modulePath)) {
      console.error(`Missing modal module: ${modulePath}`);
      process.exit(1);
    }

    const code = readFile(modulePath);
    const processed = removeUseStrict(removeModuleStatements(code));
    moduleCodes.push(processed);
  }

  return moduleCodes.join('\n\n');
}

/**
 * Build the Wolfpack Bundles SDK bundle
 */
function buildSdkBundle() {
  console.log('Building Wolfpack Bundles SDK...');

  const sharedCode = readSharedComponents();
  const sdkModulesCode = readSdkModules();
  // Entry point: strip the outer IIFE wrapper — we'll re-wrap everything below
  const entryCode = removeUseStrict(removeModuleStatements(readFile(SOURCES.sdk)))
    .replace(/^\s*\(function\s*\(window\)\s*\{/, '')
    .replace(/\}\)\(window\);\s*$/, '');

  const buildDate = new Date().toISOString().split('T')[0];
  const banner = `/*!
 * Wolfpack Bundles SDK
 * Version : ${WIDGET_VERSION}
 * Built   : ${buildDate}
 *
 * Verify live version: console.log(window.__WOLFPACK_BUNDLES_SDK_VERSION__)
 */
window.__WOLFPACK_BUNDLES_SDK_VERSION__ = '${WIDGET_VERSION}';`;

  const bundledCode = `${banner}
(function (window) {
  'use strict';

  // ============================================================================
  // SHARED MODULES (ConditionValidator, PricingCalculator, CurrencyManager, etc.)
  // ============================================================================

${sharedCode}

  // ============================================================================
  // SDK MODULES (state, config-loader, events, cart, validate-bundle, get-display-price, debug)
  // ============================================================================

${sdkModulesCode}

  // ============================================================================
  // SDK ENTRY POINT
  // ============================================================================

${entryCode}

})(window);
`;

  writeFileSync(OUTPUTS.sdk, bundledCode);
  console.log(`  -> ${OUTPUTS.sdk}`);
  console.log(`  -> ${(bundledCode.length / 1024).toFixed(1)} KB`);
}

/**
 * Build the full-page widget bundle
 */
function buildFullPageBundle() {
  console.log('Building full-page widget bundle...');

  const componentsCode = readSharedComponents(WIDGET_SHARED_MODULES);
  const modalModulesCode = readModalModules();
  const modalCode = readFile(SOURCES.modal);
  const fullPageModulesCode = readFullPageModules();
  const widgetCode = readFile(SOURCES.fullPage);

  // Process the code
  const processedModal = removeUseStrict(removeModuleStatements(modalCode));
  const processedWidget = removeUseStrict(removeModuleStatements(widgetCode));

  // Combine into a single IIFE
  const bundledCode = `${buildBanner('Full Page')}
(function() {
  'use strict';

  // ============================================================================
  // BUNDLE WIDGET COMPONENTS
  // ============================================================================

${componentsCode}

  // ============================================================================
  // BUNDLE PRODUCT MODAL COMPONENT
  // ============================================================================

${modalModulesCode}

${processedModal}

  // Export modal to window for widget access
  window.BundleProductModal = BundleProductModal;

  // ============================================================================
  // BUNDLE WIDGET FULL PAGE
  // ============================================================================

${fullPageModulesCode}

${processedWidget}

})();
`;

  writeFileSync(OUTPUTS.fullPage, bundledCode);
  console.log(`  -> ${OUTPUTS.fullPage}`);
  console.log(`  -> ${(bundledCode.length / 1024).toFixed(1)} KB`);
}

/**
 * Build the product-page widget bundle
 */
function buildProductPageBundle() {
  console.log('Building product-page widget bundle...');

  // Read source files
  const componentsCode = readSharedComponents(WIDGET_SHARED_MODULES);
  const productPageModulesCode = readProductPageModules();
  const widgetCode = readFile(SOURCES.productPage);

  // Process the code
  const processedWidget = removeUseStrict(removeModuleStatements(widgetCode));

  // Combine into a single IIFE
  const bundledCode = `${buildBanner('Product Page')}
(function() {
  'use strict';

  // ============================================================================
  // BUNDLE WIDGET COMPONENTS
  // ============================================================================

${componentsCode}

  // ============================================================================
  // BUNDLE WIDGET PRODUCT PAGE
  // ============================================================================

${productPageModulesCode}

${processedWidget}

})();
`;

  writeFileSync(OUTPUTS.productPage, bundledCode);
  console.log(`  -> ${OUTPUTS.productPage}`);
  console.log(`  -> ${(bundledCode.length / 1024).toFixed(1)} KB`);
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);
  const target = args[0] || 'all';

  console.log('');
  console.log('='.repeat(60));
  console.log('  Bundle Widget Build Script');
  console.log('='.repeat(60));
  console.log('');

  const startTime = Date.now();

  switch (target) {
    case 'full-page':
      buildFullPageBundle();
      break;
    case 'product-page':
      buildProductPageBundle();
      break;
    case 'sdk':
      buildSdkBundle();
      break;
    case 'all':
      buildFullPageBundle();
      console.log('');
      buildProductPageBundle();
      console.log('');
      buildSdkBundle();
      break;
    default:
      console.error(`Unknown target: ${target}`);
      console.error('Usage: node scripts/build-widget-bundles.js [full-page|product-page|sdk|all]');
      process.exit(1);
  }

  const elapsed = Date.now() - startTime;

  console.log('');
  console.log('-'.repeat(60));
  console.log(`  Build completed in ${elapsed}ms`);
  console.log('='.repeat(60));
  console.log('');
}

main();
