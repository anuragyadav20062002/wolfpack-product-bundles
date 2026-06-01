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

### 2026-06-02 01:50 - FPB DEFAULT page background parity slice started
- Existing EB select-template evidence shows FPB DEFAULT uses a light gray page background, while WPB computes white on both `body` and `#bundle-builder-app`.
- Chrome ancestor inspection shows the widget ancestors are transparent up to `body`, so the narrow fix is a DEFAULT-scoped body/root background rule.
- Patched raw FPB CSS with `body:has([data-fpb-design-preset=DEFAULT])` and root background rules.
- Generated minified storefront CSS with `npm run minify:assets css`; final asset generation passed under Shopify's 100,000 byte limit.
- Chrome storefront smoke on `preview-codex-fpb-2026-05-21`: body and `#bundle-builder-app` both compute to `rgb(241, 241, 241)`.
- Regression check: FPB DEFAULT category tabs still compute as transparent text tabs with active `3px solid rgb(0, 0, 0)` bottom border.

### 2026-06-02 02:00 - FPB full-bleed storefront layout slice started
- Existing EB DEFAULT evidence shows a broad full-page content/sidebar layout, while WPB's marker-rendered widget is constrained by the theme page content to `672px`.
- Chrome probe with a temporary full-bleed root rule expanded the FPB root to viewport width, content to `842px`, and sidebar to `366px` without changing PPB.
- Scope this slice to the FPB widget root via `data-bundle-type=full_page`; product card sizing remains a separate gap because `fpbCardCtaMode=icon` still forces compact cards.
- Patched raw FPB CSS with a `data-bundle-type=full_page` full-bleed root rule.
- Generated minified storefront CSS with `npm run minify:assets css`; final asset generation passed under Shopify's 100,000 byte limit after selector compaction.
- Chrome storefront smoke on `preview-codex-fpb-2026-05-21`: temporary probe style absent, FPB root width `1512px`, content width `842px`, sidebar width `366px`.
- Network proof: FPB CSS 200, FPB bundled JS 200, bundle JSON 200, storefront product hydration 200, view tracking 200.
- Regression check: DEFAULT background remains `rgb(241, 241, 241)` and active category tab remains transparent with `3px solid rgb(0, 0, 0)` bottom border.

### 2026-06-02 02:12 - FPB desktop product card sizing slice started
- Existing EB DEFAULT evidence shows two larger product cards in the left content area; Chrome computed WPB as four `182px` desktop columns with `166px` images.
- Local CSS inspection found the desktop `fpbCardCtaMode=icon` rule hardcodes `repeat(4, 182px)`, `182px` cards, and `166px` product images.
- Scope this slice to replacing the existing desktop compact-card dimensions with two larger cards; mobile rules are left unchanged.
- Patched raw FPB CSS and generated CSS to use two `300px` desktop columns with `284px` product images.
- Chrome initially showed Shopify's dev CSS CDN stayed on the previous 99,995-byte revision even after the local generated CSS changed to the larger-card constants.
- Forced a byte-distinct generated CSS asset under the Shopify 100,000 byte limit; subsequent Chrome reload served the updated CSS.
- Chrome storefront smoke on `preview-codex-fpb-2026-05-21`: grid computes to `300px 300px`, first product card computes to `300px x 420px`, first product image computes to `284px x 284px`.
- Network proof: FPB CSS 200, FPB bundled JS 200, bundle JSON 200, storefront product hydration 200.

### 2026-06-02 02:32 - FPB sidebar tier CTA slice started
- Existing EB DEFAULT evidence shows a prominent black sidebar tier CTA with merchant text such as `Box of 2` and discount subtext above the progress messaging.
- Current WPB sidebar only shows discount messaging/progress and a narrow action button.
- Live storefront JSON already carries the EB-style source data at `pricing.messages.displayOptions.bundleQuantityOptions.optionsByRuleId`, including `label: "Box of 2"` and `subtext: "₹5 off"`.
- Scope this slice to rendering that consumed JSON as a black sidebar tier CTA; no merchant-facing fallback copy will be fabricated when option text is absent.
- Implemented `createSidebarTierCta(nextRule)` in the FPB widget using `bundleQuantityOptions.optionsByRuleId` first and `tierTextByRuleId` second, with no fabricated fallback copy.
- Bumped `WIDGET_VERSION` to `2.9.15` and rebuilt widget assets with `npm run build:widgets`.
- Verification passed: `npx eslint --max-warnings 9999 app/assets/bundle-widget-full-page.js scripts/build-widget-bundles.js` returned 0 errors; both files are ignored by ESLint and reported warnings only.
- Verification passed: `node --check app/assets/bundle-widget-full-page.js && node --check scripts/build-widget-bundles.js`.
- Chrome storefront smoke on `preview-codex-fpb-2026-05-21`: served JS contains `createSidebarTierCta`, live `window.__BUNDLE_WIDGET_VERSION__` is `2.9.15`, and `.fpb-sidebar-tier-cta` renders `Box of 2` / `₹5 off`.
- Computed style proof: CTA width `326px`, black background, white text, black border, `8px` radius, centered text.
- Next gap observed: clicking `Add To Box` did not populate the sidebar selected product rows; handle selected-item/sidebar thumbnail parity as the next slice.
