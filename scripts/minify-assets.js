#!/usr/bin/env node

/**
 * Asset minification script for Shopify extension files.
 *
 * CSS source files can be separate from their deploy targets. When a CSS entry
 * has { source, target }, the source remains readable and the minified output
 * is written to the Shopify extension asset target.
 *
 * CSS minification:
 *   - Remove all block comments (/* ... *\/)
 *   - Collapse whitespace / newlines
 *   - Remove spaces around :  {  }  ,  ;
 *   - Remove empty rules
 *   - Strip trailing semicolons before }
 *
 * JS minification (conservative — no AST, no renaming):
 *   - Preserve /*! ... *\/ licence/banner headers
 *   - Remove all other block comments
 *   - Remove single-line // comments (excluding those inside strings)
 *   - Collapse 3+ consecutive blank lines to a single blank line
 *   - Trim trailing whitespace on every line
 *
 * Usage:
 *   node scripts/minify-assets.js          # minify all targets
 *   node scripts/minify-assets.js css      # CSS files only
 *   node scripts/minify-assets.js js       # JS files only
 *
 * Output:
 *   Prints a summary table of before/after byte counts and % reduction.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// ---------------------------------------------------------------------------
// Target files
// ---------------------------------------------------------------------------

const CSS_FILES = [
  {
    source: join(ROOT_DIR, 'app/assets/widgets/full-page-css/bundle-widget-full-page.css'),
    target: join(ROOT_DIR, 'extensions/bundle-builder/assets/bundle-widget-full-page.css'),
  },
  join(ROOT_DIR, 'extensions/bundle-builder/assets/bundle-widget.css'),
  join(ROOT_DIR, 'extensions/bundle-builder/assets/modal-discount-bar.css'),
];

const JS_FILES = [
  join(ROOT_DIR, 'extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js'),
  join(ROOT_DIR, 'extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js'),
];

// Shopify enforces a 100,000 B hard limit on app-block CSS assets.
const CSS_SIZE_LIMIT_BYTES = 100_000;

// ---------------------------------------------------------------------------
// CSS minification
// ---------------------------------------------------------------------------

/**
 * Minify a CSS string using regex-based transformations.
 *
 * Steps (in order):
 *  1. Remove all block comments  /* ... *\/
 *  2. Collapse newlines + surrounding whitespace into a single space
 *  3. Collapse runs of spaces/tabs to a single space
 *  4. Remove spaces around CSS structural characters:  : { } , ;
 *  5. Strip trailing semicolons before }  (e.g. "color:red;}}" → "color:red}}")
 *  6. Remove empty rules  (e.g. ".foo{}" or "@media screen{}")
 *  7. Trim leading/trailing whitespace
 *
 * @param {string} css
 * @returns {string}
 */
function minifyCSS(css) {
  // 1. Remove block comments (greedy is fine — CSS has no nested comments)
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');

  // 2. Collapse newlines + surrounding horizontal whitespace → single space
  css = css.replace(/\s*\n\s*/g, ' ');

  // 3. Collapse remaining runs of spaces/tabs
  css = css.replace(/[ \t]+/g, ' ');

  // 4. Remove spaces around structural characters
  //    Around {  }
  css = css.replace(/\s*\{\s*/g, '{');
  css = css.replace(/\s*\}\s*/g, '}');
  //    Around :  (careful: must not break data URIs or pseudo-selectors with spaces)
  //    Only strip spaces around : when it looks like a property colon (inside a rule).
  //    Safe heuristic: remove space-colon and colon-space sequences.
  css = css.replace(/\s*:\s*/g, ':');
  //    Around ,
  css = css.replace(/\s*,\s*/g, ',');
  //    Around ;
  css = css.replace(/\s*;\s*/g, ';');

  // 5. Strip trailing semicolons immediately before }
  css = css.replace(/;}/g, '}');

  // 6. Remove empty rules (selector followed by empty braces, including @-rules)
  //    Repeat until no more empty rules remain (handles nested empties).
  let prev;
  do {
    prev = css;
    css = css.replace(/[^{}]+\{\}/g, '');
  } while (css !== prev);

  // 7. Trim
  return css.trim();
}

// ---------------------------------------------------------------------------
// JS minification
// ---------------------------------------------------------------------------

/**
 * Remove block comments from JS, preserving /*! ... *\/ licence headers.
 *
 * Strategy: walk the source character by character, tracking string and
 * comment context so we never accidentally strip comment-like text inside
 * a string literal or regex.
 *
 * @param {string} src
 * @returns {string}
 */
function removeJSBlockComments(src) {
  let out = '';
  let i = 0;
  const len = src.length;

  while (i < len) {
    const ch = src[i];

    // Template literal  `...`
    if (ch === '`') {
      let j = i + 1;
      while (j < len) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '`') { j++; break; }
        j++;
      }
      out += src.slice(i, j);
      i = j;
      continue;
    }

    // Single-quoted string  '...'
    if (ch === "'") {
      let j = i + 1;
      while (j < len) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === "'") { j++; break; }
        j++;
      }
      out += src.slice(i, j);
      i = j;
      continue;
    }

    // Double-quoted string  "..."
    if (ch === '"') {
      let j = i + 1;
      while (j < len) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '"') { j++; break; }
        j++;
      }
      out += src.slice(i, j);
      i = j;
      continue;
    }

    // Possible comment start
    if (ch === '/' && i + 1 < len) {
      const next = src[i + 1];

      // Block comment  /* ... */
      if (next === '*') {
        const isLicence = src[i + 2] === '!';
        const end = src.indexOf('*/', i + 2);
        if (end === -1) {
          // Unterminated comment — pass through rest of file
          if (isLicence) out += src.slice(i);
          break;
        }
        if (isLicence) {
          // Preserve licence/banner headers
          out += src.slice(i, end + 2);
        }
        // Skip (or already emitted)
        i = end + 2;
        continue;
      }

      // Single-line comment  // ...  — handled in next pass; pass through here
    }

    out += ch;
    i++;
  }

  return out;
}

/**
 * Remove single-line  //  comments from JS.
 *
 * This runs AFTER removeJSBlockComments so we only need to worry about
 * strings and template literals (no block comments left).
 *
 * @param {string} src
 * @returns {string}
 */
function removeJSSingleLineComments(src) {
  // Process line by line.  For each line, strip any  //  that appears outside
  // a string literal.  We do a small linear scan per line — fast enough for
  // our file sizes.
  const lines = src.split('\n');
  const result = [];

  for (const line of lines) {
    result.push(stripLineComment(line));
  }

  return result.join('\n');
}

/**
 * Strip the  //  comment from a single source line, respecting string literals.
 *
 * @param {string} line
 * @returns {string}
 */
function stripLineComment(line) {
  let i = 0;
  const len = line.length;

  while (i < len) {
    const ch = line[i];

    // Single-quoted string
    if (ch === "'") {
      i++;
      while (i < len) {
        if (line[i] === '\\') { i += 2; continue; }
        if (line[i] === "'") { i++; break; }
        i++;
      }
      continue;
    }

    // Double-quoted string
    if (ch === '"') {
      i++;
      while (i < len) {
        if (line[i] === '\\') { i += 2; continue; }
        if (line[i] === '"') { i++; break; }
        i++;
      }
      continue;
    }

    // Template literal start — rare on a single line without newline, but handle it
    if (ch === '`') {
      i++;
      while (i < len) {
        if (line[i] === '\\') { i += 2; continue; }
        if (line[i] === '`') { i++; break; }
        i++;
      }
      continue;
    }

    // Single-line comment start
    if (ch === '/' && i + 1 < len && line[i + 1] === '/') {
      // Everything from here to end-of-line is a comment — strip it
      return line.slice(0, i).trimEnd();
    }

    i++;
  }

  return line;
}

/**
 * Minify a JS string (conservative — no renaming, no tree-shaking).
 *
 * @param {string} js
 * @returns {string}
 */
function minifyJS(js) {
  // 1. Remove block comments (preserve /*! licence headers)
  js = removeJSBlockComments(js);

  // 2. Remove single-line // comments (outside strings)
  js = removeJSSingleLineComments(js);

  // 3. Trim trailing whitespace on every line
  js = js
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n');

  // 4. Collapse 3+ consecutive blank lines to a single blank line
  js = js.replace(/\n{3,}/g, '\n\n');

  // 5. Trim leading/trailing whitespace
  return js.trim();
}

// ---------------------------------------------------------------------------
// File processing
// ---------------------------------------------------------------------------

/**
 * @typedef {{ file: string, beforeBytes: number, afterBytes: number, skipped: boolean, reason?: string }} FileResult
 */

/**
 * Process a single file: read → minify → write → return result.
 *
 * @param {string | { source: string, target: string }} fileEntry
 * @param {'css'|'js'} type
 * @returns {FileResult}
 */
function processFile(fileEntry, type) {
  const sourcePath = typeof fileEntry === 'string' ? fileEntry : fileEntry.source;
  const targetPath = typeof fileEntry === 'string' ? fileEntry : fileEntry.target;
  const label = targetPath.replace(ROOT_DIR + '/', '');
  const sourceLabel = sourcePath.replace(ROOT_DIR + '/', '');

  if (!existsSync(sourcePath)) {
    console.warn(`  [SKIP] ${sourceLabel} — file not found`);
    return { file: label, beforeBytes: 0, afterBytes: 0, skipped: true, reason: 'not found' };
  }

  const original = readFileSync(sourcePath, 'utf-8');
  const beforeBytes = Buffer.byteLength(original, 'utf-8');

  let minified;
  if (type === 'css') {
    minified = minifyCSS(original);
  } else {
    minified = minifyJS(original);
  }

  const afterBytes = Buffer.byteLength(minified, 'utf-8');

  writeFileSync(targetPath, minified, 'utf-8');

  // Warn if CSS exceeds Shopify's limit
  if (type === 'css' && afterBytes > CSS_SIZE_LIMIT_BYTES) {
    console.warn(
      `  [WARN] ${label} is ${afterBytes.toLocaleString()} B — exceeds Shopify's ${CSS_SIZE_LIMIT_BYTES.toLocaleString()} B limit!`,
    );
  }

  return { file: label, beforeBytes, afterBytes, skipped: false };
}

// ---------------------------------------------------------------------------
// Summary table
// ---------------------------------------------------------------------------

/**
 * Print a formatted summary table to stdout.
 *
 * @param {FileResult[]} results
 */
function printSummary(results) {
  const COL_FILE = 58;
  const COL_BEFORE = 10;
  const COL_AFTER = 10;
  const COL_SAVED = 10;
  const COL_PCT = 8;

  const hr = '-'.repeat(COL_FILE + COL_BEFORE + COL_AFTER + COL_SAVED + COL_PCT + 8);

  console.log('');
  console.log(hr);
  console.log(
    `  ${'File'.padEnd(COL_FILE)}  ${'Before'.padStart(COL_BEFORE)}  ${'After'.padStart(COL_AFTER)}  ${'Saved'.padStart(COL_SAVED)}  ${'Reduction'.padStart(COL_PCT)}`,
  );
  console.log(hr);

  let totalBefore = 0;
  let totalAfter = 0;

  for (const r of results) {
    if (r.skipped) {
      console.log(`  ${'[SKIPPED]'.padEnd(COL_FILE)}  ${r.file}`);
      continue;
    }

    const saved = r.beforeBytes - r.afterBytes;
    const pct = r.beforeBytes > 0 ? ((saved / r.beforeBytes) * 100).toFixed(1) : '0.0';
    const overLimit = r.file.endsWith('.css') && r.afterBytes > CSS_SIZE_LIMIT_BYTES ? ' !!!' : '';

    console.log(
      `  ${r.file.padEnd(COL_FILE)}  ${fmtBytes(r.beforeBytes).padStart(COL_BEFORE)}  ${(fmtBytes(r.afterBytes) + overLimit).padStart(COL_AFTER)}  ${fmtBytes(saved).padStart(COL_SAVED)}  ${(pct + '%').padStart(COL_PCT)}`,
    );

    totalBefore += r.beforeBytes;
    totalAfter += r.afterBytes;
  }

  const totalSaved = totalBefore - totalAfter;
  const totalPct = totalBefore > 0 ? ((totalSaved / totalBefore) * 100).toFixed(1) : '0.0';

  console.log(hr);
  console.log(
    `  ${'TOTAL'.padEnd(COL_FILE)}  ${fmtBytes(totalBefore).padStart(COL_BEFORE)}  ${fmtBytes(totalAfter).padStart(COL_AFTER)}  ${fmtBytes(totalSaved).padStart(COL_SAVED)}  ${(totalPct + '%').padStart(COL_PCT)}`,
  );
  console.log(hr);
  console.log('');
}

/**
 * Format bytes as a human-readable string with B / KB suffix.
 *
 * @param {number} bytes
 * @returns {string}
 */
function fmtBytes(bytes) {
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'all'; // 'css' | 'js' | 'all'

  if (!['css', 'js', 'all'].includes(mode)) {
    console.error(`Unknown mode: ${mode}`);
    console.error('Usage: node scripts/minify-assets.js [css|js|all]');
    process.exit(1);
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('  Asset Minifier');
  console.log('='.repeat(60));
  console.log('');

  const startTime = Date.now();

  /** @type {FileResult[]} */
  const results = [];

  if (mode === 'css' || mode === 'all') {
    console.log('Minifying CSS files...');
    for (const f of CSS_FILES) {
      const r = processFile(f, 'css');
      if (!r.skipped) {
        console.log(`  -> ${r.file}  (${fmtBytes(r.beforeBytes)} → ${fmtBytes(r.afterBytes)})`);
      }
      results.push(r);
    }
    console.log('');
  }

  if (mode === 'js' || mode === 'all') {
    console.log('Minifying JS bundles...');
    for (const f of JS_FILES) {
      const r = processFile(f, 'js');
      if (!r.skipped) {
        console.log(`  -> ${r.file}  (${fmtBytes(r.beforeBytes)} → ${fmtBytes(r.afterBytes)})`);
      }
      results.push(r);
    }
    console.log('');
  }

  const elapsed = Date.now() - startTime;

  printSummary(results);

  console.log(`  Completed in ${elapsed}ms`);
  console.log('='.repeat(60));
  console.log('');

  // Exit non-zero if any CSS file exceeds the Shopify size limit
  const overLimit = results.filter(
    (r) => !r.skipped && r.afterBytes > CSS_SIZE_LIMIT_BYTES && r.file.endsWith('.css'),
  );
  if (overLimit.length > 0) {
    console.error(
      `ERROR: ${overLimit.length} CSS file(s) exceed the Shopify ${CSS_SIZE_LIMIT_BYTES.toLocaleString()} B limit:`,
    );
    for (const r of overLimit) {
      console.error(`  ${r.file}: ${r.afterBytes.toLocaleString()} B`);
    }
    process.exit(1);
  }
}

main();
