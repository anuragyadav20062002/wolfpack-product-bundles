# Issue: Chrome DevTools Commit Test Plan
**Issue ID:** chromedevtools-commit-test-plan-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-06-03
**Last Updated:** 2026-06-03 19:38

## Overview
Create a Chrome DevTools test handoff for the latest five commits so the combined staging deployment can be verified in the embedded Shopify Admin UI and storefront.

## Progress Log
### 2026-06-03 19:05 - Started Test Plan
- Confirmed latest five commits with `git log -5 --oneline`.
- Preparing a tester-facing document for Claude Chrome DevTools verification.
- Next steps: document environment setup, per-commit test cases, evidence checklist, and expected behavior.

### 2026-06-03 19:06 - Completed Test Plan
- Created `docs/testing/chromedevtools-commit-by-commit-test-plan.md`.
- Document includes commit order, embedded Shopify Admin environment, Chrome DevTools iframe guidance, per-commit admin/storefront checks, expected widget versions, stop conditions, and final report template.
- No code changes were made.

### 2026-06-03 19:10 - Reworked for Combined Staging Push
- Replaced the commit-by-commit plan with `docs/testing/chromedevtools-staging-regression-plan.md`.
- Updated the flow for pushing all five commits to staging first, then testing the combined behavior in one Chrome DevTools session.
- Kept commit coverage references while grouping checks by Admin and storefront scenarios.

### 2026-06-03 19:14 - Preparing Final Testing Plan Commit
- Keeping `docs/testing/chromedevtools-staging-regression-plan.md` as the final testing file for the combined staging push.
- Preparing a separate docs commit after the implementation checkpoint commit.

### 2026-06-03 19:38 - Post-rebase version update
- Updating the final staging plan to expect widget version `2.9.55` after rebasing onto the newer upstream widget build.

## Related Documentation
- docs/testing/chromedevtools-staging-regression-plan.md

## Phases Checklist
- [x] Create Chrome DevTools test plan
- [x] Mark issue complete after document is written
