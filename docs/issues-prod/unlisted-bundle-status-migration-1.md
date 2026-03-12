# Issue: PROD Crash — unlisted BundleStatus enum missing from DB

**Issue ID:** unlisted-bundle-status-migration-1
**Status:** Completed
**Priority:** 🔴 High (PROD broken)
**Created:** 2026-03-12
**Last Updated:** 2026-03-12 21:15

## Overview

PROD dashboard crashes on every load with:
```
invalid input value for enum "BundleStatus": "unlisted"
```

## Root Cause

The `unlisted` value was added to the `BundleStatus` enum in `prisma/schema.prisma` but no migration was ever created to apply it to the PROD PostgreSQL database.

The dashboard loader queries:
```typescript
status: { in: [BundleStatus.ACTIVE, BundleStatus.DRAFT, BundleStatus.UNLISTED] }
```

PostgreSQL rejects the query because `'unlisted'` is not a valid value in its `BundleStatus` enum type.

## Fix

Created migration `20260312210000_add_unlisted_bundle_status/migration.sql`:
```sql
ALTER TYPE "BundleStatus" ADD VALUE IF NOT EXISTS 'unlisted';
```

`IF NOT EXISTS` makes it idempotent — safe to run on DBs where the value may already exist (e.g., SIT).

## Progress Log

### 2026-03-12 21:15 - Fixed

- ✅ Created `prisma/migrations/20260312210000_add_unlisted_bundle_status/migration.sql`
- Next: deploy to PROD (`npx prisma migrate deploy` on PROD or via deploy pipeline)

## Phases Checklist

- [x] Phase 1: Identify missing migration
- [x] Phase 2: Create migration SQL
- [ ] Phase 3: Run migration on PROD via deploy
