# Issue: Bundle Parent Product Default Draft
**Issue ID:** parent-product-default-draft-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 20:14

## Overview
Change generated Shopify bundle parent products so first creation defaults to Shopify `DRAFT` instead of `ACTIVE`/`UNLISTED`. The bundle-level status flow can still explicitly sync products later when merchants publish or choose campaign visibility.

## Progress Log
### 2026-06-04 20:08 - Work started
- User requested Bundle Parent Product default creation state to be `draft`.
- Impact analysis: touches FPB and PPB configure handler product creation payloads and focused route tests. Existing unlisted status update/sync behavior should remain unchanged.
- Next steps: add failing tests for parent product creation payloads, update creation/recreation status defaults to `DRAFT`, run focused tests and lint, then commit with this issue ID.

### 2026-06-04 20:13 - Implemented and verified
- Added `tests/unit/routes/parent-product-default-draft.test.ts` to lock FPB and PPB parent product creation/recreation payloads to Shopify `DRAFT` while preserving explicit `UNLISTED` sync logic.
- Changed FPB and PPB configure handler parent product creation/recreation payloads from `ACTIVE` to `DRAFT`.
- Verification: `npx jest tests/unit/routes/parent-product-default-draft.test.ts --runInBand` passed 2 tests; `npx jest tests/unit/routes/fpb-sync-product.test.ts tests/unit/routes/ppb-sync-product.test.ts --runInBand` passed 18 tests; ESLint on changed files returned 0 errors; `npm run build` completed successfully.

### 2026-06-04 20:14 - Ready for commit
- Rebuilt graph metadata after code changes.
- Staging only the handler changes, focused test/spec, issue log, and graph metadata for commit.

## Related Documentation
- `internal docs/Shopify Integration/Admin API.md`
- `docs/issues-prod/eb-ui-clone-rewrite-1.md`
- `docs/issues-prod/ad-ready-phase2-phase3-1.md`

## Phases Checklist
- [x] Phase 1: Red tests for FPB and PPB parent product creation default status
- [x] Phase 2: Change product creation/recreation payloads to `DRAFT`
- [x] Phase 3: Focused tests and lint/build checks
- [x] Phase 4: Commit relevant changes
