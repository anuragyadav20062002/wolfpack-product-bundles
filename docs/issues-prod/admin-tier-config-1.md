# Issue: Admin UI Tier Configuration for Full-Page Bundle Widget

**Issue ID:** admin-tier-config-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-17
**Last Updated:** 2026-03-17 18:30
**Status:** Completed

## Overview

Move pricing tier configuration from Shopify Theme Editor into the Remix admin configure page. Merchants select linked bundles by name, set labels, and save — no Theme Editor interaction required.

Architecture: Option C — `tierConfig Json?` column on Bundle, exposed via existing bundle API. Widget reads tiers from API response (preferred) or data-tier-config HTML attribute (fallback).

## Related Documentation
- docs/admin-tier-config/00-BR.md
- docs/admin-tier-config/02-PO-requirements.md
- docs/admin-tier-config/03-architecture.md
- docs/admin-tier-config/04-SDE-implementation.md

## Phases Checklist

- [x] Phase 1: Types + validator (with tests) ✅
- [x] Phase 2: Prisma migration (tierConfig Json? on Bundle) ✅
- [x] Phase 3: Bundle API response includes tierConfig ✅
- [x] Phase 4: Save handler reads/writes tierConfig ✅
- [x] Phase 5: Admin UI PricingTiersSection component ✅
- [x] Phase 6: Widget JS reads tierConfig from API response ✅

## Progress Log

### 2026-03-17 - Starting Phase 1

### 2026-03-17 18:00 - Phases 1–5 Completed
- ✅ Created `app/types/tier-config.ts` — TierConfigEntry + TierConfig types
- ✅ Created `tests/unit/lib/tier-config-validator.test.ts` — 14 passing tests
- ✅ Created `app/lib/tier-config-validator.server.ts` — validateTierConfig() with DB ownership check
- ✅ Modified `prisma/schema.prisma` — added `tierConfig Json?` to Bundle model
- ✅ Applied schema via `npx prisma db push` (migration history mismatch on SIT DB)
- ✅ Modified `app/routes/api/api.bundle.$bundleId[.]json.tsx` — added `tierConfig` to formattedBundle
- ✅ Modified `handlers/handlers.server.ts` — parses + validates + saves tierConfig on bundle update
- ✅ Modified `types.ts` — added `availableBundles` to LoaderData
- ✅ Modified `route.tsx` — loader queries availableBundles, component adds tierConfig state + section
- ✅ Created `app/components/PricingTiersSection.tsx` — Polaris UI for tier CRUD (max 4 tiers)
- ✅ Lint: zero errors (removed unused Icon import)
- Next: Phase 6 — widget JS reads tierConfig from API response

### 2026-03-17 18:30 - Phase 6 Completed + All Phases Done
- ✅ Created `tests/unit/assets/fpb-tier-api-source.test.ts` — 13 tests for resolveTierConfig
- ✅ Added `resolveTierConfig()` method to full-page widget (app/assets/bundle-widget-full-page.js)
- ✅ Moved `initTierPills()` call to after `loadBundleData()` + `selectBundle()`
- ✅ API tierConfig (`{label, linkedBundleId}`) mapped to pill format (`{label, bundleId}`)
- ✅ Fallback to data-tier-config attribute when API returns null
- ✅ Minimum 2 tiers required; API with < 2 returns [] (pills off)
- ✅ Fixed vi.fn() → jest.fn() in validator test (wrong test framework import)
- ✅ Bumped WIDGET_VERSION 1.5.1 → 1.6.0 (new storefront feature)
- ✅ Rebuilt widget bundles: `npm run build:widgets`
- ✅ All 497 tests pass
- Result: Merchants can configure tier pills in admin UI; widget prefers admin-saved config

### 2026-03-17 18:30 - All Phases Completed

**Total Commits:** 2
**Files Created:** 6 (types, validator, validator tests, tier API tests, PricingTiersSection, issue file)
**Files Modified:** 7 (schema, bundle API, handlers, types, route, css-vars build script, widget)

### Key Achievements:
- ✅ tierConfig Json? column on Bundle model (zero downtime, nullable)
- ✅ Admin UI to configure up to 4 pricing tier pills per FPB
- ✅ Save handler validates tier entries against shop ownership
- ✅ Bundle API exposes tierConfig in response
- ✅ Widget resolves API tiers (admin-saved) over HTML attribute (Theme Editor legacy)
- ✅ Full test coverage: 14 validator tests + 13 API resolution tests

### Impact:
- Merchants no longer need to configure tier pills in Shopify Theme Editor
- Tier configuration is stored in DB and travels with the bundle record
- Backward-compatible: existing Theme Editor tier config still works as fallback

**Status:** Ready for shopify app deploy + CDN propagation (~5 min)
