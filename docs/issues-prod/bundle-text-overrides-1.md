# Issue: Bundle Text Overrides (Messages Tab)

**Issue ID:** bundle-text-overrides-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-26
**Last Updated:** 2026-04-26 12:30

## Overview

Add per-bundle text overrides so merchants can customise the user-visible strings rendered
by both the Full-Page Bundle (FPB) and Product-Page Bundle (PDP) widgets.  Overrides are
stored as two JSON columns on the Bundle model and surfaced in a new "Messages" section in
each bundle's configure page.  Multi-language support via Shopify Markets locale detection
is included in the same pass.

## Progress Log

### 2026-04-26 11:00 - Starting implementation

Plan based on `docs/phase2-competitive-parity/PHASE2_PLAN.md` (section 2.1).

Files to modify:
- `prisma/schema.prisma` — add `textOverrides Json?` + `textOverridesByLocale Json?`
- `prisma/migrations/20260426000000_add_bundle_text_overrides/migration.sql` — ALTER TABLE
- `app/services/bundles/metafield-sync/types.ts` — add fields to BundleUiConfig
- `app/lib/bundle-formatter.server.ts` — include in FormattedBundle interface + return
- `app/services/bundles/metafield-sync/bundle-config-metafield.server.ts` — pass through
- FPB configure route.tsx — Messages section + shopLocales query
- PDP configure route.tsx — same
- FPB handlers.server.ts — save textOverrides / textOverridesByLocale
- PDP handlers.server.ts — same
- `app/assets/bundle-widget-full-page.js` — _resolveText helper + replace strings
- `app/assets/bundle-widget-product-page.js` — same

Priority strings (from widget audit):
- `addToCartButton` → "Add to Cart" (FPB) / "Add Bundle to Cart" (PDP)
- `nextButton` → "Next"
- `doneButton` → "Done"
- `freeBadge` → "Free"
- `includedBadge` → "Included"
- `yourBundle` → "Your Bundle" (FPB sidebar header)
- `addingToCart` → "Adding to Cart..." (PDP loading state)
- `completeSteps` → "Complete All Steps to Continue" (PDP validation state)

## Progress Log

### 2026-04-26 12:30 - Completed

- ✅ `prisma/schema.prisma`: Added `textOverrides Json?` + `textOverridesByLocale Json?` to Bundle model
- ✅ `prisma/migrations/20260426000000_add_bundle_text_overrides/migration.sql`: ALTER TABLE migration
- ✅ `app/services/bundles/metafield-sync/types.ts`: Added `BundleTextOverrides` interface + fields to `BundleUiConfig`
- ✅ `app/lib/bundle-formatter.server.ts`: Added `textOverrides` + `textOverridesByLocale` to `FormattedBundle` interface + return value
- ✅ `app/services/bundles/metafield-sync/operations/bundle-product.server.ts`: Pass `textOverrides` + `textOverridesByLocale` through to `bundleUiConfig`
- ✅ FPB `route.tsx`: `shopLocales` query in loader, `messages` nav item, state hooks, formData.append, useCallback deps, Messages UI section (Language + Widget Labels cards)
- ✅ PDP `route.tsx`: Same
- ✅ FPB `handlers.server.ts`: Read + save `textOverrides` / `textOverridesByLocale` in `db.bundle.update`
- ✅ PDP `handlers.server.ts`: Same
- ✅ `app/assets/bundle-widget-full-page.js`: `_resolveText` helper + replaced 6 hardcoded strings (addToCartButton × 2, nextButton × 2, doneButton, freeBadge, includedBadge, yourBundle)
- ✅ `app/assets/bundle-widget-product-page.js`: `_resolveText` helper + replaced 7 hardcoded strings (addToCartButton × 3, nextButton, doneButton, completeSteps, includedBadge, addingToCart)
- ✅ `npm run build:widgets` — FPB 232.2 KB, PDP 135.7 KB, 0 errors
- ✅ ESLint: 0 errors on all modified files

## Phases Checklist
- [x] Prisma schema + migration
- [x] BundleUiConfig + bundle-formatter
- [x] Metafield sync passes through fields
- [x] FPB configure route — Messages section + shopLocales
- [x] PDP configure route — Messages section + shopLocales
- [x] FPB handlers — save overrides
- [x] PDP handlers — save overrides
- [x] FPB widget — _resolveText helper + string replacements
- [x] PDP widget — same
- [x] Widget build (npm run build:widgets)
- [x] Lint all modified .ts/.tsx files
- [x] Commit
