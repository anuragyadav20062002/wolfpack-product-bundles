# Issue: Widget Bundle Build System

**Issue ID:** widget-build-system-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-01-15
**Last Updated:** 2026-01-15 17:45

## Overview
Create a build process to bundle widget JavaScript files for the Shopify theme extension. This eliminates manual bundling and ensures consistent output.

## Progress Log

### 2026-01-15 17:30 - Fixed Missing Asset Error
- Fixed `bundle-modal-component.js` missing asset error in bundle-full-page.liquid
- Bundled modal component directly into `bundle-widget-full-page-bundled.js`
- Simplified liquid file to load single script instead of two

### 2026-01-15 17:40 - Created Build Script
- Created `scripts/build-widget-bundles.js` build script
- Combines shared components + widget-specific code into bundled IIFEs
- Removes ES module import/export statements automatically
- Added npm scripts: `build:widgets`, `build:widgets:full-page`, `build:widgets:product-page`

### 2026-01-15 17:45 - Updated Documentation
- Added "Widget Bundle Build Process" section to CLAUDE.md
- Documents mandatory build process after widget changes
- Lists source files and output files
- Provides workflow integration steps

## Files Changed
- `scripts/build-widget-bundles.js` (new) - Build script
- `package.json` - Added build:widgets scripts
- `CLAUDE.md` - Added build process documentation
- `extensions/bundle-builder/blocks/bundle-full-page.liquid` - Simplified script loading
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` - Rebuilt with modal
- `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` - Rebuilt

## Related Documentation
- CLAUDE.md - Widget Bundle Build Process section

## Phases Checklist
- [x] Fix missing asset error
- [x] Bundle modal component into full-page bundle
- [x] Create build script
- [x] Add npm scripts
- [x] Update CLAUDE.md documentation
- [x] Test build process
