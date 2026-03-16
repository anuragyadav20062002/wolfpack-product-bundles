---
name: prod-504-root-cause-fix-1
description: Fix root causes of 504s on production — in-memory session cache + connection pool increase
type: project
---

# Issue: Production 504 Root Cause Fix

**Issue ID:** prod-504-root-cause-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-17
**Last Updated:** 2026-03-17 13:30

## Overview

After the band-aid fix (dcp-bundle-api-504-fix-1) added a DB timeout + widget retry,
the root causes of the 504s on production have been identified and need proper fixes:

1. **`authenticate.public.appProxy` hits Postgres on every storefront request** — the
   Shopify SDK's `PrismaSessionStorage.loadSession()` is called to retrieve the offline
   access token. Combined with the bundle data query, each storefront visitor triggers
   2 DB round-trips before anything renders.

2. **`connection_limit=10` causes pool exhaustion** under concurrent production traffic.
   New requests wait up to `pool_timeout=20s` → Shopify App Proxy times out → 504.

## Fix Strategy

1. **`CachedSessionStorage`** — a thin in-memory TTL wrapper around `PrismaSessionStorage`.
   `loadSession` checks memory first; only hits Postgres on a cache miss (first request
   per shop per 10-minute window). Cache is invalidated on `storeSession` / `deleteSession`
   so re-installs are handled correctly.

2. **`connection_limit=25`** in `DATABASE_URL` / `DIRECT_URL` (both SIT `prisma/.env` and
   the Render dashboard env var for production). Gives enough headroom for concurrent
   bundle-data queries + session lookups without pool exhaustion.

## Files to Modify / Create

1. `app/lib/cached-session-storage.server.ts` — NEW: CachedSessionStorage class
2. `app/shopify.server.ts` — swap `new PrismaSessionStorage(prisma)` for cached version
3. `prisma/.env` — raise `connection_limit` from 10 → 25 (SIT; gitignored)

## Test Files to Create

1. `tests/unit/lib/cached-session-storage.test.ts`

## Phases Checklist

- [x] Phase 1: CachedSessionStorage — tests + implementation ✅
- [x] Phase 2: Wire into shopify.server.ts + connection_limit bump ✅
- [x] Phase 3: Lint, tests, commit ✅

## Progress Log

### 2026-03-17 13:00 - Planning Complete
- ✅ Root cause confirmed: session DB lookup on every appProxy request
- ✅ Root cause confirmed: connection_limit=10 causes pool exhaustion
- Next: Phase 1 — CachedSessionStorage tests + implementation

### 2026-03-17 13:30 - All Phases Completed
- ✅ Phase 1: Created `app/lib/cached-session-storage.server.ts` (11 tests, 11/11 pass)
- ✅ Phase 2:
  - `app/shopify.server.ts` — wraps PrismaSessionStorage with CachedSessionStorage
  - `prisma/.env` — connection_limit raised 10 → 25 (SIT; gitignored)
- ✅ Phase 3: 436/436 tests pass, 0 ESLint errors
- Files Created: `app/lib/cached-session-storage.server.ts`, `tests/unit/lib/cached-session-storage.test.ts`
- Files Modified: `app/shopify.server.ts`
- Files Updated (not committed): `prisma/.env` (gitignored — user must update Render env var for prod)

**IMPORTANT — Production action required:**
Update the `DATABASE_URL` environment variable in the Render dashboard for the production
service. Change `connection_limit=10` to `connection_limit=25` in the connection string.

**Status:** Completed ✅
