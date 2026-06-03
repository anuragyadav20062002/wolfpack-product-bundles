# Issue: Chrome DevTools Commit Test Plan
**Issue ID:** chromedevtools-commit-test-plan-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-06-03
**Last Updated:** 2026-06-03 (regression run logged)

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

### 2026-06-03 - Regression run continued (App Embed + widget version verified, new Save 500 finding)
- Retraction: the earlier "Slot Icon sibling card" finding was a visual misread. Source (`full-page-bundle/.../route.tsx:4953–5030` and `product-page-bundle/.../route.tsx:4373–4449`) confirms Slot Icon is nested inside the same `<s-section>` as Enable Quantity Validation. No code change needed; corrected in result file.
- Enabled the Wolfpack Bundle App Embed in the OS2 theme editor on `test-bundle-store123` and saved.
- Verified live widget version on `/pages/preview-sit-regression-fpb`: `window.__BUNDLE_WIDGET_VERSION__ === "2.9.55"` ✓ (matches plan target).
- **New blocker found:** Bundle Settings Save action returns HTTP 500 (`{"success":false,"error":"An error occurred"}`) when enabling `productSlotsEnabled` + `validateQuantityPerProduct` on the SIT backend. Save UI hangs on spinner with no surfaced error. Likely missing migration for new columns on SIT DB or a Render-side runtime error. Storefront Scenarios 4/5 and the FPB persistence sweep are blocked behind this fix. PPB pass deferred for the same reason.
- Result file updated with all findings; checklist rows updated; follow-up list reprioritised to triage the Save 500 first.

### 2026-06-03 - Regression run executed (partial)
- Ran the staging regression plan via Chrome DevTools MCP against `test-bundle-store123.myshopify.com` (plan's `wolfpack-store-test-1` was not open; user approved the substitution).
- Created `SIT Regression FPB` from scratch (Amber Essence product) to enable scenario coverage.
- **Admin scenarios PASS:** Scenario 1 (Unlisted Manage modal — Manage button label and modal parity with Edit Product confirmed), Scenario 6 (Preview placement across Configuration / Pricing / Assets), Scenario 7 (Slot Icon per-bundle scope, no DCP navigation).
- **Admin scenarios with caveat:** Scenario 2 — Change Icon opens local file picker with no Step Setup redirect; however, the Slot Icon card renders as a *sibling* of Enable Quantity Validation, not nested inside it. Flagged as `Partial — needs plan author sign-off` in the result checklist. Scenario 3 — structural independence of Quantity Validation and Product Slots confirmed; save→reload persistence sweep was not exercised.
- **BLOCKED:** Scenarios 4 and 5, and the widget version check, because App Embed is OFF on this store and storefront is password-gated. PPB pass deferred (same code paths as FPB).
- Full per-scenario evidence and follow-up list written to `docs/testing/staging-regression-result-1.md`.

## Related Documentation
- docs/testing/chromedevtools-staging-regression-plan.md
- docs/testing/staging-regression-result-1.md

## Phases Checklist
- [x] Create Chrome DevTools test plan
- [x] Mark issue complete after document is written
