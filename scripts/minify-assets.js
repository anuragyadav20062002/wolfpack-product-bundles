#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { minifyCSS, resolveCssImports } from './minify-assets/css-minifier.js';
import { minifyJS } from './minify-assets/js-minifier.js';
import { fmtBytes, printSummary } from './minify-assets/output.js';
import { createTargets, CSS_SIZE_LIMIT_BYTES } from './minify-assets/targets.js';

const __filename = fileURLToPath(import.meta.url);
const ROOT_DIR = dirname(dirname(__filename));
const { css: CSS_FILES, js: JS_FILES } = createTargets(ROOT_DIR);

function processFile(fileEntry, type) {
  const sourcePath = typeof fileEntry === 'string' ? fileEntry : fileEntry.source;
  const targetPath = typeof fileEntry === 'string' ? fileEntry : fileEntry.target;
  const label = targetPath.replace(ROOT_DIR + '/', '');
  const sourceLabel = sourcePath.replace(ROOT_DIR + '/', '');

  if (!existsSync(sourcePath)) {
    console.warn(`  [SKIP] ${sourceLabel} - file not found`);
    return { file: label, beforeBytes: 0, afterBytes: 0, skipped: true, reason: 'not found' };
  }

  const original = readFileSync(sourcePath, 'utf-8');
  const beforeBytes = Buffer.byteLength(original, 'utf-8');
  const minified = type === 'css'
    ? minifyCSS(resolveCssImports(sourcePath, original))
    : minifyJS(original);
  const afterBytes = Buffer.byteLength(minified, 'utf-8');

  writeFileSync(targetPath, minified, 'utf-8');

  if (type === 'css' && afterBytes > CSS_SIZE_LIMIT_BYTES) {
    console.warn(
      `  [WARN] ${label} is ${afterBytes.toLocaleString()} B - exceeds Shopify's ${CSS_SIZE_LIMIT_BYTES.toLocaleString()} B limit!`,
    );
  }

  return { file: label, beforeBytes, afterBytes, skipped: false };
}

function runGroup(label, files, type, results) {
  console.log(label);
  for (const file of files) {
    const result = processFile(file, type);
    if (!result.skipped) {
      console.log(`  -> ${result.file}  (${fmtBytes(result.beforeBytes)} -> ${fmtBytes(result.afterBytes)})`);
    }
    results.push(result);
  }
  console.log('');
}

function main() {
  const mode = process.argv[2] || 'all';
  if (!['css', 'js', 'all'].includes(mode)) {
    console.error(`Unknown mode: ${mode}`);
    console.error('Usage: node scripts/minify-assets.js [css|js|all]');
    process.exit(1);
  }

  console.log('\n============================================================');
  console.log('  Asset Minifier');
  console.log('============================================================\n');

  const startTime = Date.now();
  const results = [];
  if (mode === 'css' || mode === 'all') runGroup('Minifying CSS files...', CSS_FILES, 'css', results);
  if (mode === 'js' || mode === 'all') runGroup('Minifying JS bundles...', JS_FILES, 'js', results);

  printSummary(results);
  console.log(`  Completed in ${Date.now() - startTime}ms`);
  console.log('============================================================\n');

  const overLimit = results.filter(
    (result) => !result.skipped && result.afterBytes > CSS_SIZE_LIMIT_BYTES && result.file.endsWith('.css'),
  );
  if (overLimit.length > 0) {
    console.error(
      `ERROR: ${overLimit.length} CSS file(s) exceed the Shopify ${CSS_SIZE_LIMIT_BYTES.toLocaleString()} B limit:`,
    );
    for (const result of overLimit) {
      console.error(`  ${result.file}: ${result.afterBytes.toLocaleString()} B`);
    }
    process.exit(1);
  }
}

main();
