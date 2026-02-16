# Issue: Webhook Server Consolidation & Fixes

**Issue ID:** webhook-consolidation-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-16
**Last Updated:** 2026-02-16 15:00

## Overview
The webhook system had a dual delivery architecture (direct route handlers + Pub/Sub handlers) with critical behavioral divergence, missing TOML registrations in production, and incomplete route handlers.

## Problems Identified

1. **Production TOML missing business topics** — `products/update`, `products/delete`, `app_subscriptions/update` not registered in production, so Shopify never delivers them.
2. **Route handler for `products/update` was a no-op** — Only logged warnings for critical changes, never set bundles to draft.
3. **Route handler for `products/delete` was incomplete** — Deleted StepProducts but had TODO for marking bundles as draft.
4. **`app/uninstalled` not registered in TOML** — No handler in WebhookProcessor.
5. **`app/scopes_update` not registered in TOML** — No handler in WebhookProcessor.
6. **Route handlers were dead code** — All webhook delivery uses Pub/Sub URI, so HTTP route handlers at `app/routes/webhooks/` never received traffic.
7. **Unused `registerWebhooks` export** — Exported from shopify.server.ts but never called.

## Fix Strategy

**Consolidate on Pub/Sub as the sole delivery path.** A separate worker service is deployed with Google Cloud Pub/Sub configured. The Pub/Sub handlers have idempotency, structured error handling, and complete business logic. Route handlers were dead code and have been removed.

## Progress Log

### 2026-02-16 14:00 - Starting Implementation
- Analyzed all 5 route handlers and 4 Pub/Sub handlers
- Identified 6 critical issues

### 2026-02-16 14:30 - Initial Fixes (Later Revised)
- Initially fixed route handlers and TOML — then discovered route handlers are dead code (all delivery goes to Pub/Sub)

### 2026-02-16 15:00 - Consolidated on Pub/Sub + Cleanup

**TOML Fixes:**
- `shopify.app.toml`: Added `topics` array with all 6 topics (products/update, products/delete, app_subscriptions/update, app_purchases_one_time/update, app/uninstalled, app/scopes_update)
- `shopify.app.wolfpack-product-bundles-sit.toml`: Added `app/uninstalled` and `app/scopes_update`

**New Pub/Sub Handlers:**
- Created `app/services/webhooks/handlers/lifecycle.server.ts` with:
  - `handleAppUninstalled()` — comprehensive DB cleanup (bundles, sessions, design settings, queued jobs, compliance records, webhook events, shop record). Metafield cleanup skipped because Shopify auto-deletes `$app` namespace metafields on uninstall.
  - `handleScopesUpdate()` — updates all session scopes for the shop
- Updated `processor.server.ts` — added routing for `app/uninstalled` and `app/scopes_update` topics
- Updated `handlers/index.ts` — added lifecycle handler re-exports

**Dead Code Removal:**
- Deleted all 5 route handler files:
  - `app/routes/webhooks/webhooks.products.update.tsx`
  - `app/routes/webhooks/webhooks.products.delete.tsx`
  - `app/routes/webhooks/webhooks.app_subscriptions.update.tsx`
  - `app/routes/webhooks/webhooks.app.uninstalled.tsx`
  - `app/routes/webhooks/webhooks.app.scopes_update.tsx`
- Deleted empty `app/routes/webhooks/` directory
- Removed `flatRoutes({ rootDirectory: "routes/webhooks" })` from `app/routes.ts`
- Removed unused `registerWebhooks` export from `app/shopify.server.ts`
- Cleaned up `vite.config.ts` — removed references to deleted webhook routes

**Verified:** `npx remix vite:build` — success (server bundle shrank 1,071 KB → 1,050 KB)

## Files Summary

| File | Action |
|------|--------|
| `shopify.app.toml` | Modified — added business + lifecycle webhook topics |
| `shopify.app.wolfpack-product-bundles-sit.toml` | Modified — added lifecycle topics |
| `app/services/webhooks/handlers/lifecycle.server.ts` | **Created** — app/uninstalled + app/scopes_update handlers |
| `app/services/webhooks/handlers/index.ts` | Modified — added lifecycle re-exports |
| `app/services/webhooks/processor.server.ts` | Modified — added lifecycle topic routing |
| `app/routes.ts` | Modified — removed webhooks route directory |
| `app/shopify.server.ts` | Modified — removed unused registerWebhooks export |
| `vite.config.ts` | Modified — removed dead webhook route references |
| `app/routes/webhooks/` (5 files) | **Deleted** — dead code, never received traffic |

## Phases Checklist
- [x] Phase 1: Add business topics to production TOML
- [x] Phase 2: Add lifecycle topics to both TOMLs
- [x] Phase 3: Create lifecycle handlers (app/uninstalled, app/scopes_update) in Pub/Sub path
- [x] Phase 4: Wire lifecycle handlers into WebhookProcessor
- [x] Phase 5: Delete dead route handlers + clean up references
- [x] Phase 6: Build verification
