#!/usr/bin/env node

/**
 * Build script for bundling widget JavaScript files
 *
 * This script combines the shared components with widget-specific code
 * into single bundled files for the Shopify theme extension.
 *
 * Usage: node scripts/build-widget-bundles.js [full-page|product-page|all]
 *
 * Output:
 * - extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js
 * - extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// ---------------------------------------------------------------------------
// WIDGET VERSION
// ---------------------------------------------------------------------------
// Increment this before building when you intend to deploy widget changes.
// Use semantic versioning (MAJOR.MINOR.PATCH):
//   PATCH  — bug fix
//   MINOR  — new storefront feature (backwards-compatible)
//   MAJOR  — breaking change requiring merchant theme update
//
// After incrementing, run:  npm run build:widgets
// Then deploy:              shopify app deploy
//
// Verify live version in browser DevTools on the storefront:
//   console.log(window.__BUNDLE_WIDGET_VERSION__)
// ---------------------------------------------------------------------------
const WIDGET_VERSION = '2.3.2';

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
];

// Source files
const SOURCES = {
  modal: join(ROOT_DIR, 'app/assets/bundle-modal-component.js'),
  fullPage: join(ROOT_DIR, 'app/assets/bundle-widget-full-page.js'),
  productPage: join(ROOT_DIR, 'app/assets/bundle-widget-product-page.js'),
};

// Output files
const OUTPUTS = {
  fullPage: join(ROOT_DIR, 'extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js'),
  productPage: join(ROOT_DIR, 'extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js'),
};

/**
 * Build a header banner injected at the top of every bundle.
 * window.__BUNDLE_WIDGET_VERSION__ lets developers verify which build is running
 * in browser DevTools: console.log(window.__BUNDLE_WIDGET_VERSION__)
 */
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

/**
 * Read a file and return its contents
 */
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
 * Read and process all shared component modules
 */
function readSharedComponents() {
  const moduleCodes = [];

  for (const modulePath of SHARED_MODULES) {
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
 * Build the full-page widget bundle
 */
function buildFullPageBundle() {
  console.log('Building full-page widget bundle...');

  // Read source files
  const componentsCode = readSharedComponents();
  const modalCode = readFile(SOURCES.modal);
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

${processedModal}

  // Export modal to window for widget access
  window.BundleProductModal = BundleProductModal;

  // ============================================================================
  // BUNDLE WIDGET FULL PAGE
  // ============================================================================

${processedWidget}

})();
`;

  // Write output
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
  const componentsCode = readSharedComponents();
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

${processedWidget}

})();
`;

  // Write output
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
    case 'all':
      buildFullPageBundle();
      console.log('');
      buildProductPageBundle();
      break;
    default:
      console.error(`Unknown target: ${target}`);
      console.error('Usage: node scripts/build-widget-bundles.js [full-page|product-page|all]');
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
