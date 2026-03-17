# Issue: Admin UI Tier Configuration for Full-Page Bundle Widget

**Issue ID:** admin-tier-config-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-03-17
**Last Updated:** 2026-03-17 18:00

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
- [ ] Phase 6: Widget JS reads tierConfig from API response

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
