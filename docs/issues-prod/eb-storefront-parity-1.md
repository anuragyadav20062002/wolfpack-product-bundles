# Issue: EB Storefront Parity for FPB and PPB
**Issue ID:** eb-storefront-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-02
**Last Updated:** 2026-06-02 01:21

## Overview
Align FPB and PPB storefront behavior with EB end-to-end across APIs, DTOs, consumed JSON, metafields, template dispatch/designs, cart behavior, and per-template e2e proof.

## Progress Log
### 2026-06-02 01:21 - Goal started and fast-track architecture initiated
- User set the active goal to 100% EB storefront parity for FPB and PPB.
- Stage 1 requirements are fast-tracked from existing EB evidence docs instead of re-researching known behavior.
- Live SIT evidence confirmed PPB already loads through the product page app block and initialized widget container, while FPB marker hydration is a separate full-page issue.
- Next: implement in small template/contract slices, with e2e proof after each template.

## Related Documentation
- internal docs/EB Implementation Reference.md
- docs/competitor-analysis/16-eb-full-data-flow-investigation.md
- docs/issues-prod/eb-complete-configure-e2e-audit-1.md
- docs/issues-prod/select-template-1.md
- docs/eb-storefront-parity/02-architecture.md

## Phases Checklist
- [ ] Phase 1 - FPB storefront bootstrap and config contract
- [ ] Phase 2 - FPB templates: DEFAULT, CLASSIC, COMPACT, HORIZONTAL
- [ ] Phase 3 - PPB storefront bootstrap and config contract
- [ ] Phase 4 - PPB templates: CASCADE, COGNIVE, MODAL, SIMPLIFIED
- [ ] Phase 5 - Cart payload/metafield parity for FPB and PPB
- [ ] Phase 6 - Final desktop/mobile e2e parity pass

### 2026-06-02 01:32 - FPB proxy API category DTO gap patched
- SIT FPB bootstrap smoke passed: marker hydrated, FPB CSS/JS requested, bundle JSON fetched, view tracking fired.
- Found next storefront gap: `/apps/product-bundles/api/bundle/{id}.json` returned the step with `categoriesLen: 0`, causing "No products available in this step".
- Root cause: public bundle API loaded `StepProduct` but did not include ordered `StepCategory`, while the formatter emits category runtime data from `step.StepCategory`.
- Patched the API loader to include ordered `StepCategory` and added focused route coverage plus `test-spec/fpb-storefront-category-api.spec.md`.
- Next: run focused verification, commit, deploy, then re-smoke FPB storefront JSON/render.

### 2026-06-02 01:36 - FPB proxy API category DTO verification passed
- Added focused test coverage proving the public bundle API query loads ordered `StepCategory` rows along with `StepProduct`.
- Verification passed: `npx jest tests/unit/routes/api.bundle.free-gift.test.ts --runInBand`.
- Verification passed: `npx eslint --max-warnings 9999 'app/routes/api/api.bundle.$bundleId[.]json.tsx' tests/unit/routes/api.bundle.free-gift.test.ts` with 0 errors.

### 2026-06-02 01:40 - FPB storefront category smoke passed on SIT/dev proxy
- Live storefront JSON now returns two categories for bundle `cmpfhj2m10000v0t038osl42y`, with product-backed category entries.
- Reloaded FPB page and confirmed `#bundle-builder-app` initializes with FPB `DEFAULT` markers and product cards render.
- Confirmed `No products available in this step.` is no longer present.
- Network proof: FPB page document 200, FPB CSS/JS 200, bundle JSON 200, storefront-products hydration 200, view tracking 200.
- Remaining non-goal-complete work: template-by-template visual parity and cart/metafield e2e for FPB and PPB.

### 2026-06-02 01:43 - FPB DEFAULT category tab parity slice started
- Existing EB select-template evidence shows FPB DEFAULT category tabs are text-only underline tabs, while WPB renders filled/outlined pills.
- Scope this slice to the DEFAULT preset only so CLASSIC/COMPACT/HORIZONTAL pill-style category tabs are not regressed.
- Patched raw FPB CSS with a `data-fpb-design-preset=DEFAULT` scoped underline-tab treatment.
- Generated minified storefront CSS with `npm run minify:assets css`; final asset generation passed under Shopify's 100,000 byte limit.
- Chrome storefront smoke on `preview-codex-fpb-2026-05-21`: FPB CSS/JS 200, bundle JSON 200, product hydration 200, view tracking 200.
- Computed style proof: active category tab has transparent background, `0px` radius, and `3px solid rgb(0, 0, 0)` bottom border; inactive category tab is transparent with transparent bottom border.
