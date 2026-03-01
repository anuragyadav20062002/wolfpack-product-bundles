#!/usr/bin/env node

/**
 * Bundle Widget Build Script - Product Page Version
 *
 * This script combines the shared components and product-page widget
 * into a single bundled file for deployment to Shopify theme extensions.
 *
 * Input files (source of truth):
 *  - app/assets/bundle-widget-components.js
 *  - app/assets/bundle-widget-product-page.js
 *
 * Output file (deployed to Shopify):
 *  - extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js
 *
 * Usage:
 *  node create-product-page-bundle.cjs
 */

const fs = require('fs');
const path = require('path');

console.log('🔨 Building bundle-widget-product-page-bundled.js...\n');

// Define file paths
const componentsFile = path.join(__dirname, 'app', 'assets', 'bundle-widget-components.js');
const productPageFile = path.join(__dirname, 'app', 'assets', 'bundle-widget-product-page.js');
const outputFile = path.join(__dirname, 'extensions', 'bundle-builder', 'assets', 'bundle-widget-product-page-bundled.js');

// Read source files
console.log('📖 Reading source files...');
console.log(`  - ${path.relative(__dirname, componentsFile)}`);
console.log(`  - ${path.relative(__dirname, productPageFile)}`);

let componentsCode, productPageCode;

try {
  componentsCode = fs.readFileSync(componentsFile, 'utf8');
  productPageCode = fs.readFileSync(productPageFile, 'utf8');
} catch (error) {
  console.error('❌ Error reading source files:', error.message);
  process.exit(1);
}

// Remove export statements since we're bundling
console.log('\n🔧 Processing code...');
console.log('  - Removing export statements');
console.log('  - Wrapping in IIFE');

componentsCode = componentsCode.replace(/export\s+/g, '');
productPageCode = productPageCode.replace(/export\s+/g, '');
productPageCode = productPageCode.replace(/import\s+{[^}]+}\s+from\s+['"][^'"]+['"];?\s*/g, '');

// Create bundled output with IIFE wrapper
const bundledCode = `(function() {
  'use strict';

  // ============================================================================
  // BUNDLE WIDGET COMPONENTS
  // ============================================================================

${componentsCode}

  // ============================================================================
  // PRODUCT PAGE WIDGET
  // ============================================================================

${productPageCode}

})();
`;

// Write bundled file
console.log(`\n💾 Writing bundled file...`);
console.log(`  - ${path.relative(__dirname, outputFile)}`);

try {
  fs.writeFileSync(outputFile, bundledCode, 'utf8');
} catch (error) {
  console.error('❌ Error writing bundled file:', error.message);
  process.exit(1);
}

// Calculate file sizes
const componentsSize = (componentsCode.length / 1024).toFixed(2);
const productPageSize = (productPageCode.length / 1024).toFixed(2);
const bundledSize = (bundledCode.length / 1024).toFixed(2);

console.log('\n✅ Bundle created successfully!\n');
console.log('📊 File sizes:');
console.log(`  - Components:    ${componentsSize} KB`);
console.log(`  - Product Page:  ${productPageSize} KB`);
console.log(`  - Bundled:       ${bundledSize} KB`);
console.log('\n🚀 Ready to deploy to Shopify!');
