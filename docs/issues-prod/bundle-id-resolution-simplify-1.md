# Issue: Simplify bundle-id Resolution in bundle-full-page.liquid

**Issue ID:** bundle-id-resolution-simplify-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-03-17
**Status:** Completed
**Last Updated:** 2026-03-17 08:30

## Overview

The full-page bundle Liquid block has a 4-source resolution chain for `bundle_id`:
1. `page.metafields.custom.bundle_id` — set by app
2. `page.handle` extract (if handle contains 'bundle-') — fragile, not set by app this way
3. `page.metafields['$app'].bundle_id` — legacy, unreliable in Liquid
4. `block.settings.bundle_id` — manual

The app only sets sources 1 and 3. Source 2 is dead code (app creates handles like `my-bundle-name`, not `bundle-{id}`). Source 3 (`$app`) is documented as unreliable in Liquid.

**Fix:** Reduce to 2 authoritative sources: `custom:bundle_id` → block setting.

## Progress Log

### 2026-03-17 08:30 - Completed

- ✅ Removed handle-based fallback (source 2): app creates handles like `my-bundle-name`, not `bundle-{id}` — this source was never set by the app and was dead code
- ✅ Removed `$app` metafield fallback (source 3): `$app` namespace is documented as unreliable in Liquid; app sets both `custom` and `$app` at page creation, but `custom` is always sufficient
- ✅ Kept: `page.metafields.custom.bundle_id` (primary, always set by app) → `block.settings.bundle_id` (backward compat for manually configured blocks)
- Files Modified: `extensions/bundle-builder/blocks/bundle-full-page.liquid`
- Resolution chain reduced from 4 sources to 2 authoritative sources
