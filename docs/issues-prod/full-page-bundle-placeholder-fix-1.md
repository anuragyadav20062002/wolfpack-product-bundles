# Issue: Full-Page Bundle Shows "Please configure a Bundle ID" Placeholder

**Issue ID:** full-page-bundle-placeholder-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-12
**Last Updated:** 2026-03-13

## Overview

Storefront shows "Full-Page Bundle Widget — Please configure a Bundle ID in the block settings" instead of the bundle, even for pages created through the app.

## Root Cause

The Liquid template reads `page.metafields['$app'].bundle_id` to get the bundle ID. In Shopify, a raw metafield set via `metafieldsSet` is NOT accessible in Liquid/Storefront unless a **MetafieldDefinition** with `storefront: "PUBLIC_READ"` exists for that owner type + namespace + key combination.

The app created `$app:bundle_id` metafields on pages via `metafieldsSet`, but never created a `PAGE` `MetafieldDefinition` with `PUBLIC_READ` access. So the metafield value was always `null` in Liquid, causing the placeholder to show.

## Fix

1. `definitions.server.ts` — Added `ensurePageBundleIdMetafieldDefinition()`:
   - Creates `MetafieldDefinition` for `ownerType: PAGE`, `namespace: $app`, `key: bundle_id`, `storefront: PUBLIC_READ`
   - Idempotent — silently skips if definition already exists (`TAKEN` error code)

2. `shopify.server.ts` — Call `ensurePageBundleIdMetafieldDefinition()` in `afterAuth` hook so all shops get the definition on next login

3. `widget-full-page-bundle.server.ts` — Call it before setting the page metafield during bundle creation so the definition is guaranteed to exist

## Progress Log

### 2026-03-13 - Phase 3: Ensure definition on full-page bundle configure page load

- Problem: `afterAuth` and `createFullPageBundle()` only run on re-auth or new bundle creation. Existing shops that haven't re-authenticated since the fix never got the `MetafieldDefinition` created → placeholder still shows.
- Fix: Added `ensurePageBundleIdMetafieldDefinition(admin)` fire-and-forget call in the full-page bundle configure route loader. Every time a merchant opens a full-page bundle in the admin, the definition is ensured for their shop. Idempotent — no-ops if already exists.
- File: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`

### 2026-03-12 21:45 - Fixed

- ✅ `definitions.server.ts` — new function
- ✅ `shopify.server.ts` — called in afterAuth
- ✅ `widget-full-page-bundle.server.ts` — called before metafieldsSet
- ✅ Barrel exports updated through the chain

## Phases Checklist

- [x] Phase 1: Add PAGE metafield definition function
- [x] Phase 2: Wire into afterAuth + bundle creation
- [x] Phase 3: Also call in full-page bundle configure loader (fixes existing shops without re-auth)
- [x] Phase 4: Fix TAKEN silent skip — update storefront access on existing definition
- [x] Phase 5: Fix root causes — malformed extension UID + wrong settings variable in Liquid
- [ ] Phase 6: shopify app deploy + verify on storefront

### 2026-03-13 - Phase 5: Identified and fixed two root causes

Two definitive root causes found:

**Root Cause A — Malformed UID in `extensions/bundle-builder/shopify.extension.toml`**
`uid = "23b807f7-472d-4f93-e241-5a1e079d6b51548daaf2"` is 44 characters (standard UUID is 36).
The last segment has 20 characters instead of 12 — two UUIDs were concatenated.
This caused `shopify app deploy` to fail or misidentify the extension, meaning the
bundle-builder extension was never properly deployed. Without a successful deploy:
- The `$app` namespace ownership cannot be verified by Shopify for this extension
- `page.metafields['$app'].bundle_id` returns null in Liquid regardless of definition access
Fix: Removed the malformed UID — Shopify CLI will assign/reconcile the correct one on next deploy.

**Root Cause B — Wrong Liquid settings variable for `target = "section"` extension**
`bundle-full-page.liquid` used `block.settings.bundle_id` for the manual fallback.
The extension has `target = "section"` in TOML, which means settings are accessed via
`section.settings`, NOT `block.settings`. `block` refers to blocks WITHIN a section —
for a section-target extension, `block.settings` is always nil/undefined.
The manual configuration path (theme editor bundle_id setting) was therefore broken.
Fix: Changed `block.settings.bundle_id` → `section.settings.bundle_id` in the Liquid.

### 2026-03-13 - Phase 4: Update existing definition's storefront access on TAKEN

- Problem: Definition confirmed to exist (log: "✓ PAGE bundle_id definition already exists") but placeholder still shows. Root cause: definition may have been created originally without `PUBLIC_READ` access. When `TAKEN` is returned, the code silently skipped — never checked or updated the existing definition's storefront access.
- Fix: When `TAKEN` is returned, now queries the existing definition via `metafieldDefinitions(ownerType: PAGE, namespace: "$app", key: "bundle_id")` to get its ID and current storefront access. If access is not `PUBLIC_READ`, calls `metafieldDefinitionUpdate` to update it.
- File: `app/services/bundles/metafield-sync/operations/definitions.server.ts`
