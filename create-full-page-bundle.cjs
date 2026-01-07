#!/usr/bin/env node

/**
 * Bundle Widget Build Script - Full Page Version
 *
 * This script combines the shared components and full-page widget
 * into a single bundled file for deployment to Shopify theme extensions.
 *
 * Input files (source of truth):
 *  - app/assets/bundle-widget-components.js
 *  - app/assets/bundle-widget-full-page.js
 *
 * Output file (deployed to Shopify):
 *  - extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js
 *
 * Usage:
 *  node create-full-page-bundle.cjs
 */

const fs = require('fs');
const path = require('path');

console.log('🔨 Building bundle-widget-full-page-bundled.js...\n');

// Define file paths
const componentsFile = path.join(__dirname, 'app', 'assets', 'bundle-widget-components.js');
const fullPageFile = path.join(__dirname, 'app', 'assets', 'bundle-widget-full-page.js');
const outputFile = path.join(__dirname, 'extensions', 'bundle-builder', 'assets', 'bundle-widget-full-page-bundled.js');

// Read source files
console.log('📖 Reading source files...');
console.log(`  - ${path.relative(__dirname, componentsFile)}`);
console.log(`  - ${path.relative(__dirname, fullPageFile)}`);

let componentsCode, fullPageCode;

try {
  componentsCode = fs.readFileSync(componentsFile, 'utf8');
  fullPageCode = fs.readFileSync(fullPageFile, 'utf8');
} catch (error) {
  console.error('❌ Error reading source files:', error.message);
  process.exit(1);
}

// Remove export statements since we're bundling
console.log('\n🔧 Processing code...');
console.log('  - Removing export statements');
console.log('  - Wrapping in IIFE');

componentsCode = componentsCode.replace(/export\s+/g, '');
fullPageCode = fullPageCode.replace(/export\s+/g, '');
fullPageCode = fullPageCode.replace(/import\s+{[^}]+}\s+from\s+['"][^'"]+['"];?\s*/g, '');

// Create bundled output with IIFE wrapper
const bundledCode = `(function() {
  'use strict';

  // ============================================================================
  // BUNDLE WIDGET COMPONENTS
  // ============================================================================

${componentsCode}

  // ============================================================================
  // FULL PAGE WIDGET
  // ============================================================================

${fullPageCode}

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
const fullPageSize = (fullPageCode.length / 1024).toFixed(2);
const bundledSize = (bundledCode.length / 1024).toFixed(2);

console.log('\n✅ Bundle created successfully!\n');
console.log('📊 File sizes:');
console.log(`  - Components:  ${componentsSize} KB`);
console.log(`  - Full Page:   ${fullPageSize} KB`);
console.log(`  - Bundled:     ${bundledSize} KB`);
console.log('\n🚀 Ready to deploy to Shopify!');
