# Issue: Full-Page Bundle Shows "Please configure a Bundle ID" Placeholder

**Issue ID:** full-page-bundle-placeholder-fix-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-03-12
**Last Updated:** 2026-03-16

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
- [x] Phase 6: Fix definitive root cause — extract bundle ID from page.handle
- [x] Phase 8: Fix page templateSuffix — all bundle pages use shared 'full-page-bundle' template
- [x] Phase 9: Remove junk code — correct Shopify auth syntax in bundle API route
- [ ] Phase 7: shopify app deploy + verify on storefront

### 2026-03-16 - Phase 9: Remove junk code, fix Shopify auth pattern in bundle API route

**Root cause of broken product enrichment (separate from the 404):**
The bundle API route (`api.bundle.$bundleId[.]json.tsx`) was calling `requireAppProxy(request)`
TWICE. The `requireAppProxy` guard only returns `{ session }`, discarding the `admin` client.
The second call tried `authResult.admin` which is always `undefined`. This made the
`if (admin && ...)` condition always false — product enrichment via Shopify GraphQL
was silently never running.

**Correct Shopify syntax**: `authenticate.public.appProxy(request)` returns `{ session, admin, liquid }`
in one call. The route now imports `authenticate` from `shopify.server` and destructures both
`session` (for DB scoping) and `admin` (for Shopify API calls) directly.

**Junk removed:**
- All `console.log`/`console.error` debug statements from the API route (~40 statements)
- Duplicate `requireAppProxy` call and broken `authResult.admin` extraction
- `ensurePageBundleIdMetafieldDefinition` import and fire-and-forget call from configure route loader
- `ensurePageBundleIdMetafieldDefinition` call from `createFullPageBundle` (metafield approach
  superseded by `page.handle` extraction in Liquid)
- `ensurePageBundleIdMetafieldDefinition` import from `shopify.server.ts` afterAuth hook
- All `console.log` noise from `afterAuth` hook (replaced with `AppLogger`)

### 2026-03-16 - Phase 8: Fix page templateSuffix — all bundle pages use shared template

**Root Cause Found (Final):** Two compounding issues caused the persistent placeholder:

1. **`shopify app deploy` was never run after Phase 6** — The `page.handle` Liquid fix exists in
   the committed code but was never deployed to Shopify's CDN. The live storefront was still
   running the old Liquid that only read from `page.metafields['$app'].bundle_id` (nil) and
   `block.settings.bundle_id` (empty) → always showed placeholder.

2. **Pages created without `templateSuffix`** — Bundle pages were created with no template
   assignment so they use Shopify's default `templates/page.json`. The theme editor deep link
   was opening a per-bundle custom template (`page.bundle-{bundleId}`). Even if the merchant
   added the block to that custom template, the page still renders with `templates/page.json`
   (which may not have the block). The block and the page were never connected.

**Fix:**
- `widget-full-page-bundle.server.ts`: New pages created with `templateSuffix: 'full-page-bundle'`.
  Existing pages (when `createFullPageBundle` is called again) have their `templateSuffix` updated
  via `pageUpdate` mutation.
- `route.tsx`: Theme editor URL now always uses `template=page.full-page-bundle` for full-page
  bundles instead of per-bundle `page.bundle-{bundleId}`. Merchant installs the block ONCE on
  the shared `full-page-bundle` template; all bundle pages show their respective bundle via
  `page.handle | remove_first: 'bundle-'` extraction already in the Liquid.

**Next:** Run `shopify app deploy` to push Liquid changes to CDN.

### 2026-03-13 - Phase 6: Definitive fix — page.handle extraction

Previous fixes (MetafieldDefinition PUBLIC_READ, section.settings, extension UID) all still
depended on Shopify's metafield system working correctly. The real definitive fix:

**Page handles are deterministic**: App creates pages with handle `bundle-{bundleId}`.
Bundle IDs are Prisma CUIDs (lowercase alphanumeric, no special chars). The
`replace(/[^a-z0-9]+/g, '-')` transformation is a no-op for CUIDs, so the handle is
always exactly `bundle-` + bundleId. Stripping the prefix in Liquid gives back the exact
bundle ID — no metafield, no definition, no PUBLIC_READ access required.

Fix: Added `page.handle | remove_first: 'bundle-'` as the PRIMARY source of bundle_id
in bundle-full-page.liquid. Metafield and section.settings kept as fallbacks.
Works immediately on all existing bundle pages without redeploy of server code.

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
