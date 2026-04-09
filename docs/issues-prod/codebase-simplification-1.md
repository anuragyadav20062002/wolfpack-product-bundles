# Issue: Codebase Simplification Refactor

**Issue ID:** codebase-simplification-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-04-09
**Last Updated:** 2026-04-09 13:00

## Overview
Refactor the codebase using code-simplification + shopify-expert skills to reduce complexity,
remove over-engineering, and improve readability — without adding or removing any functionality.
Test admin side after every commit via Chrome DevTools + dev server logs.

## Progress Log

### 2026-04-09 09:00 - Starting
- Will run code-simplification skill to identify anti-patterns and over-engineering
- Each batch of changes will be committed and tested before proceeding

### 2026-04-09 13:00 - Phase 1: Audit Complete

Audit results (62 files analysed):
- **CRITICAL (4):** AP-06 CONSOLE_SPAM in 4 hot-path service files (fires on every bundle save/sync)
- **WARN (17):** 14× AP-13 DIRECT_AUTHENTICATE in route files; 2× AP-06 in route catch blocks; 3× Standard-5 OVERFETCH; 2× AP-12 hardcoded widget CSS; 2× AP-04 `as any` at service boundaries
- **INFO (5):** Lower-priority console spam in non-hot-path utilities

Fix batches planned:
1. Batch 1: Replace console.* → AppLogger in 4 CRITICAL service files
2. Batch 2: Fix AP-12 hardcoded `rgba(30,58,138,0.08)` in widget + rebuild
3. Batch 3: Replace authenticate.admin → requireAdminSession in 14 routes + route catch console.error
4. Batch 4: Standard-5 overfetch selects + AP-04 `as any` removals

### 2026-04-09 13:05 - Phase 2: Batch 1 Started
- ⏳ Replacing all bare console.* with AppLogger in hot-path services
- Files to modify:
  - `app/services/bundles/standard-metafields.server.ts`
  - `app/services/bundles/pricing-calculation.server.ts`
  - `app/services/bundles/metafield-sync/operations/definitions.server.ts`
  - `app/services/bundles/metafield-sync/utils/pricing.ts`

## Phases Checklist
- [x] Phase 1: Run code-simplification audit — identify targets ✅
- [ ] Phase 2: Batch 1 — AP-06 CRITICAL console spam in hot-path services
- [ ] Phase 3: Batch 2 — AP-12 widget hardcoded CSS + rebuild; Batch 3 — AP-13 authenticate + route console.error
- [ ] Phase 4: Batch 4 — Standard-5 overfetch + AP-04 `as any`; Final review
