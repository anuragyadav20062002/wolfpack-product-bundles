# Issue: Theme Color Inheritance for Free Plan Bundle Widget

**Issue ID:** fpb-theme-color-inheritance-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-26
**Last Updated:** 2026-03-26 01:00

## Overview

When a merchant is on the Free plan (DCP gated), the bundle widget automatically inherits the store's active Shopify theme colors as the base color palette — mapping theme accent, button, text, and background colors to the 6 global bundle color anchors. Ensures Free plan bundles look native to the store instead of using generic black/white defaults.

## Phases Checklist
- [x] Phase 1: Schema migration + `theme-colors.server.ts` service (with TDD)
- [x] Phase 2: `generateCSSFromSettings` theme color cascade (with TDD)
- [x] Phase 3: CSS endpoint wiring + sync trigger points
- [x] Phase 4: Scope addition (`read_themes`) — already present in both TOMLs

## Progress Log

### 2026-03-26 01:00 - Completed implementation
- ✅ Added `themeColors Json?` to `DesignSettings` in `prisma/schema.prisma` + regenerated client
- ✅ Created `app/services/theme-colors.server.ts` — `syncThemeColors(admin, shopDomain)` fetches active theme via `OnlineStoreTheme` GraphQL, parses `config/settings_data.json`, maps 5 Shopify color keys → 6 bundle global anchors, upserts to both bundle types. Silent fail throughout.
- ✅ Updated `app/lib/css-generators/index.ts` — `generateCSSFromSettings` accepts optional `themeColors` param; resolves anchors as DCP value → theme color → hardcoded default
- ✅ Updated `app/routes/api/api.design-settings.$shopDomain.tsx` — passes `designSettings.themeColors` to CSS generation (no extra DB query)
- ✅ Wired `syncThemeColors` into `afterAuth` hook in `app/shopify.server.ts` (install/reinstall)
- ✅ Wired `syncThemeColors` into `handleSyncBundle` in both configure route handlers (fire-and-forget)
- ✅ `read_themes` scope already present in both `shopify.app.toml` files — no change needed
- ✅ 29 new tests, all passing. Zero regressions. Zero lint errors.
- Files modified: `prisma/schema.prisma`, `app/lib/css-generators/index.ts`, `app/routes/api/api.design-settings.$shopDomain.tsx`, `app/shopify.server.ts`, both configure `handlers.server.ts` files
- Files created: `app/services/theme-colors.server.ts`, `tests/unit/services/theme-colors.test.ts`, `tests/unit/lib/theme-color-inheritance.test.ts`

### 2026-03-26 00:00 - Starting implementation
- Feature pipeline complete: BR + PO + Architecture documents written
- Architecture: `themeColors Json?` field on DesignSettings; `syncThemeColors` service; cascade in `generateCSSFromSettings`
- Files to create: `app/services/theme-colors.server.ts`
- Files to modify: `prisma/schema.prisma`, `app/lib/css-generators/index.ts`, `app/routes/api/api.design-settings.$shopDomain.tsx`, `app/shopify.server.ts`, both configure route `handlers.server.ts` files, `shopify.app.toml`, `shopify.app.wolfpack-product-bundles-sit.toml`
- Test files to create: `tests/unit/services/theme-colors.test.ts`, `tests/unit/lib/theme-color-inheritance.test.ts`

## Related Documentation
- `docs/theme-color-inheritance/00-BR.md`
- `docs/theme-color-inheritance/02-PO-requirements.md`
- `docs/theme-color-inheritance/03-architecture.md`
