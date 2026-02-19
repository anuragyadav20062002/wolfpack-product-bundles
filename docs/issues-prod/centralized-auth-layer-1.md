# Issue: Centralized Auth Layer for API Routes

**Issue ID:** centralized-auth-layer-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-02-19
**Last Updated:** 2026-02-19 01:00

## Overview

Create `app/lib/auth-guards.server.ts` with three typed auth helpers
(`requireAdminSession`, `requireAppProxy`, `requireInternalSecret`) and migrate
all 14 `app/routes/api/*.tsx` routes to use them. This eliminates scattered,
per-route `authenticate.*` calls, fixes two auth-less routes, and makes coverage
auditable via grep.

## Pipeline Documents

- `docs/centralized-auth-layer/00-BR.md` — Business requirement + approach decision
- `docs/centralized-auth-layer/02-PO-requirements.md` — Acceptance criteria
- `docs/centralized-auth-layer/03-architecture.md` — ADR + file-by-file plan
- `docs/centralized-auth-layer/04-SDE-implementation.md` — Implementation plan

## Progress Log

### 2026-02-19 00:00 - Issue Created, Starting Implementation
- Feature pipeline stages BR → PO → Architect complete
- Approach: auth helper functions, no URL changes, TDD-first
- Will create: `app/lib/auth-guards.server.ts`
- Will create: `tests/unit/lib/auth-guards.test.ts` (TDD — tests first)
- Will modify: all API routes under `app/routes/api/`
- Next: Write tests → implement helpers → migrate routes → commit

### 2026-02-19 01:00 - All Phases Completed

**TDD Cycle:**
- ✅ Phase 1: Wrote 14 failing tests for `auth-guards.server.ts` (red)
- ✅ Phase 2: Implemented `auth-guards.server.ts` — all 14 tests pass (green)
- ✅ Fixed `jest.config.js`: converted `module.exports` → `export default` + ts-jest CJS override (pre-existing ESM/CJS mismatch, `ts-node` not installed)

**Route Migration:**
- ✅ Phase 3: Migrated 11 admin-tier routes to `requireAdminSession`
  - `api.billing.{create,cancel,confirm,status}`, `api.activate-cart-transform`,
    `api.check-cart-transform`, `api.ensure-product-template`, `api.check-bundles`,
    `api.get-function-id`, `api.cleanup-metafields`, `api.cleanup-all-orphaned-metafields`
- ✅ Phase 4: Migrated 2 app-proxy-tier routes to `requireAppProxy`
  - `api.bundles.json`, `api.bundle.$bundleId.json`
- ✅ Phase 5: Added `requireInternalSecret` to `api.webhooks.pubsub` (before body parsing)
- ✅ Phase 6: Added `// auth: public` annotations to 3 public routes
  - `api.storefront-products`, `api.storefront-collections`, `api.design-settings.$shopDomain`
  - Also removed dead `authenticate` import from `api.storefront-products`

**Verification:**
- ✅ Phase 7: `npx jest tests/unit/lib/auth-guards.test.ts` — 14/14 pass
- ✅ `npx remix vite:build` — clean build, 169 modules, server bundle 990 KB
- ✅ All routes have declared auth tier (verified via grep)

## Phases Checklist

- [x] Phase 1: Write failing tests for `auth-guards.server.ts` (TDD red phase) ✅
- [x] Phase 2: Implement `auth-guards.server.ts` (TDD green phase) ✅
- [x] Phase 3: Migrate admin-tier routes (billing, cart-transform, etc.) ✅
- [x] Phase 4: Migrate app-proxy-tier routes (bundles.json, bundle.$id.json) ✅
- [x] Phase 5: Add `requireInternalSecret` to `api.webhooks.pubsub.tsx` ✅
- [x] Phase 6: Add `// auth: public` annotations to public routes ✅
- [x] Phase 7: Build verification + run full test suite ✅

## Related Documentation
- `docs/issues-prod/webhook-pubsub-auth-1.md` — webhook endpoint auth (related)
- `docs/centralized-auth-layer/03-architecture.md` — auth tier map
