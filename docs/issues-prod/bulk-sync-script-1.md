# Issue: Bulk Bundle Sync Script

**Issue ID:** bulk-sync-script-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-04-02
**Last Updated:** 2026-04-02 17:30

## Overview
One-shot script to sync all bundles in a database (PROD or SIT) in a single run.
Needed to backfill `component_parents` metafields on component variants for existing
bundles created before Cart Transform MERGE was implemented.

The script mirrors what `handleSyncBundle` does for metafield operations, but without
deleting/re-creating pages (which would break live stores).

## What It Does Per Bundle
- FPB without `shopifyProductId`: creates Shopify container product + URL redirect
- All bundles with `shopifyProductId`: writes `component_parents` to component variants
  (enables Cart Transform MERGE) and writes `bundle_ui_config` to the bundle variant

## Progress Log

### 2026-04-02 17:30 - Completed
- ✅ Written script at `scripts/bulk-sync-bundles.ts`
- ✅ Added `bulk-sync` entry to package.json scripts
- ✅ Lint: 0 errors (scripts/ dir is in .eslintignore — expected)
- ✅ Committed

## Files to Change
- `scripts/bulk-sync-bundles.ts` (new)
- `package.json` (add script entry)

## Phases Checklist
- [x] Write script
- [x] Add package.json entry
- [x] Lint
- [x] Commit
