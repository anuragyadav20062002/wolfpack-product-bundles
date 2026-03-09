# Issue: Ad-Ready Bundle Infrastructure — Phase 2 & Phase 3

**Issue ID:** ad-ready-phase2-phase3-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-03-09
**Last Updated:** 2026-03-09 18:00

## Overview

Phase 2: Multi-channel publication (publish bundles to Google, Meta, TikTok channels) + Campaign bundles (UNLISTED status for ad-only bundles).
Phase 3: UTM attribution via Web Pixel extension + orders/create webhook + OrderAttribution model + attribution dashboard.

## Related Documentation
- Feature Spec: `docs/ad-ready-bundles/FEATURE-SPEC.md`
- Phase 1 Issue: `docs/issues-prod/ad-ready-feed-ready-1.md`

## Progress Log

### 2026-03-09 18:00 - Starting Phase 2 + Phase 3 Implementation
- Phase 2: Multi-channel publication, UNLISTED campaign bundles
- Phase 3: Web Pixel UTM capture, OrderAttribution, attribution dashboard

### 2026-03-09 19:30 - Completed Phase 2 + Phase 3 Implementation
- **Phase 2a**: Refactored `publishToOnlineStore()` → `publishToSalesChannels()` — discovers all channels (up to 50) and publishes to all at once (Online Store + Google + Meta + TikTok)
- **Phase 2b**: Added `unlisted` to BundleStatus enum in Prisma + TypeScript, updated status options/badges, dashboard query includes unlisted bundles
- **Phase 2c**: `handleUpdateBundleStatus` maps `unlisted` → Shopify `ACTIVE` then `UNLISTED` (two-step: product must be active before setting UNLISTED, API 2025-10+)
- **Phase 3a**: Created `extensions/wolfpack-utm-pixel/` — Web Pixel captures UTMs on `page_viewed`, sends attribution on `checkout_completed` to server
- **Phase 3b**: Created `OrderAttribution` model, `orders/create` webhook handler (backup path), attribution API route for pixel POST
- **Phase 3c**: Created `app/routes/app/app.attribution.tsx` — dashboard with revenue by platform/campaign/bundle, date range filtering
- Added `write_pixels`, `read_customer_events` scopes + `orders/create` webhook topic
- Files modified: prisma/schema.prisma, app/constants/bundle.ts, handlers.server.ts, bundle-configure-handlers.server.ts, processor.server.ts, route.tsx, shopify.app.toml
- Files created: extensions/wolfpack-utm-pixel/, orders.server.ts, api.attribution.tsx, app.attribution.tsx, 2 test files
- 15 test suites, 356 tests, all passing, 0 ESLint errors

## Phases Checklist
- [x] Phase 2a: Extend publication logic to all sales channels
- [x] Phase 2b: Add `unlisted` to BundleStatus enum (Prisma + TypeScript)
- [x] Phase 2c: Campaign bundle UNLISTED status sync
- [x] Phase 3a: Web Pixel extension for UTM capture
- [x] Phase 3b: OrderAttribution model + orders/create webhook handler
- [x] Phase 3c: Attribution dashboard UI
- [x] Tests for all new functionality
- [x] Lint check
