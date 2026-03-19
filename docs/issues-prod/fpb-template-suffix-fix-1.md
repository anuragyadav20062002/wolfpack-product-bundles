# Issue: Full-Page Bundle templateSuffix Not Attached + Block UUID Discovery Fix

**Issue ID:** fpb-template-suffix-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-17
**Last Updated:** 2026-03-17 21:00

## Overview

Two related bugs in the Add to Storefront / Sync Bundle flow for full-page bundles:

1. `templateSuffix: 'full-page-bundle'` was never being attached to the Shopify page
   because it was gated on template creation success.
2. Template creation always failed on fresh installs because block UUID discovery
   scanned theme templates (which had no block reference yet — chicken-and-egg).

## Root Cause

In `widget-full-page-bundle.server.ts`:
```javascript
const useCustomTemplate = templateResult.success;  // always false on fresh install
const templateSuffix = useCustomTemplate ? 'full-page-bundle' : undefined;  // always undefined
```

In `widget-theme-template.server.ts`, `discoverBlockUuid()` scanned theme template
JSON files looking for a block reference URL. On a fresh install, no template has ever
had the block added, so no reference exists → UUID = null → template not created.

The fix: the extension UID (= the block UUID) lives in
`extensions/bundle-builder/shopify.extension.toml` as the `uid` field. Read it
directly instead of scanning theme templates.

## Files Modified

- `app/services/widget-installation/widget-theme-template.server.ts`
  - Added `readExtensionUidFromToml()` — reads uid from TOML at runtime
  - Replaced `discoverBlockUuid()` with `resolveBlockUuid()` (env var → TOML)
  - Removed dead `escapeRegex()` helper
- `app/services/widget-installation/widget-full-page-bundle.server.ts`
  - Always set `templateSuffix: 'full-page-bundle'` (removed conditional)
  - `widgetInstallationRequired` path now triggers on theme API write failure, not UUID failure

## Progress Log

### 2026-03-17 19:00 - Completed

- ✅ `readExtensionUidFromToml()` reads uid from `extensions/bundle-builder/shopify.extension.toml`
- ✅ `resolveBlockUuid()` replaces `discoverBlockUuid()` — no more theme scanning
- ✅ `templateSuffix: 'full-page-bundle'` always attached to page
- ✅ Warning logs on Sync Bundle eliminated
- ✅ Lint: zero errors
- Commit: see git log

### 2026-03-17 21:00 - Fix: Commit TOML uid field that was missing from production

- ✅ `extensions/bundle-builder/shopify.extension.toml` — added `uid` field so `readExtensionUidFromToml()` resolves correctly in production (Render) where the TOML is read from committed code
- Root cause: Shopify CLI adds `uid` locally after `shopify app deploy`, but those TOML changes were never staged/committed, so production was always hitting the "TOML uid not found" warning path
