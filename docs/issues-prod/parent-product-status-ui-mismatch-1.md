# Issue: Parent Product Status UI Mismatch
**Issue ID:** parent-product-status-ui-mismatch-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 20:59

## Overview
Fresh bundle parent products are now created in Shopify as `DRAFT`, but the configure page Bundle Product card and top warning banner still treat every non-active parent product as `Unlisted`. The Admin UI must reflect the actual Shopify parent product status and only show the unlisted banner when Shopify reports `UNLISTED`.

## Progress Log
### 2026-06-04 20:56 - Root cause found
- User reported Shopify shows the parent product as `Draft` while the configure UI shows `Unlisted` and renders `Your bundle is Unlisted`.
- Investigation found FPB and PPB configure routes collapse non-active statuses into `Unlisted` in the Bundle Product card, and banner gating is based on `status !== active`.
- Next steps: add RED route contract tests, map Shopify product status labels explicitly, gate `UnlistedBundleBanner` only on `UNLISTED`, run focused tests/lint/build, then commit.

### 2026-06-04 20:59 - Implemented and verified
- Added `app/lib/parent-product-status-ui.ts` as the shared Shopify parent product status presenter.
- Updated FPB and PPB configure routes to render `Active`, `Draft`, `Archived`, `Unlisted`, or `Unknown` from the actual Shopify product status.
- Updated FPB and PPB configure routes so `UnlistedBundleBanner` renders only when Shopify reports `UNLISTED`, not for every non-active status.
- RED proof: the new status UI tests failed before implementation because the helper was missing and routes still gated the banner on non-active status.
- Verification: `npx jest tests/unit/lib/parent-product-status-ui.test.ts tests/unit/routes/parent-product-status-ui.test.ts --runInBand` passed 7 tests; `npx jest tests/unit/routes/parent-product-default-draft.test.ts tests/unit/routes/fpb-sync-product.test.ts tests/unit/routes/ppb-sync-product.test.ts --runInBand` passed 20 tests; ESLint on changed files returned 0 errors; `npm run build` completed successfully.

## Related Documentation
- `docs/issues-prod/parent-product-default-draft-1.md`
- `internal docs/Shopify Integration/Admin API.md`

## Phases Checklist
- [x] Phase 1: RED tests for Draft label and Unlisted-only banner gating
- [x] Phase 2: Fix FPB and PPB configure route status rendering/gating
- [x] Phase 3: Focused tests and lint/build checks
- [x] Phase 4: Commit relevant changes
