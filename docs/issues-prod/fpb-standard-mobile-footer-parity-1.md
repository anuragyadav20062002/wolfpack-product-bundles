# Issue: FPB Standard Mobile Footer Parity
**Issue ID:** fpb-standard-mobile-footer-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-05
**Last Updated:** 2026-06-06 06:29

## Overview
The Standard Design FPB mobile footer is not matching Easy Bundles closely enough. This slice focuses only on the mobile footer, starting with a live audit to determine whether the mobile footer is the desktop summary sidebar converted responsively or a separate mobile component.

## Progress Log
### 2026-06-05 17:54 - Started footer-only parity slice
- Scope is limited to FPB Standard Design mobile footer.
- First verification target: confirm the EB component relationship, then compare current WPB mobile footer against live EB geometry, hierarchy, text, colors, and behavior.
- Next steps: capture EB/WPB mobile evidence in Chrome, document gaps, add focused tests, patch the widget, rebuild assets, and re-verify with hard reload/cache busting.

### 2026-06-05 18:10 - Footer relationship and gaps confirmed
- EB evidence captured:
  - `/private/tmp/eb-standard-mobile-footer-initial-2026-06-05.json`
  - `/private/tmp/eb-standard-mobile-footer-initial-2026-06-05.png`
  - `/private/tmp/eb-standard-mobile-footer-action-area-2026-06-05.json`
  - `/private/tmp/eb-standard-mobile-footer-selected-2026-06-05.json`
  - `/private/tmp/eb-standard-mobile-footer-selected-2026-06-05.png`
- WPB evidence captured after ignored-cache reload:
  - `/private/tmp/wpb-standard-mobile-footer-initial-2026-06-05.json`
  - `/private/tmp/wpb-standard-mobile-footer-initial-2026-06-05.png`
  - `/private/tmp/wpb-standard-mobile-footer-selected-2026-06-05.json`
  - `/private/tmp/wpb-standard-mobile-footer-selected-2026-06-05.png`
- Confirmed relationship: EB mobile footer is a separate sticky footer node (`.gbbAddProductsPageFooterHTML`) in the add-products page, not the desktop summary sidebar converted with media queries. WPB already uses a separate `.fpb-mobile-bottom-sheet.fpb-mobile-summary-tray`, but its internals were incomplete.
- Main gaps found: WPB hid the count badge at zero, omitted the badge chevron, missed the EB discount/progress block in the top footer region, inherited sidebar progress typography, and only rendered a text-only discount message before the CTA row.

### 2026-06-05 18:10 - Mobile footer patch implemented
- Patched `app/assets/bundle-widget-full-page.js` so the compact mobile summary tray always renders the centered count badge, wraps discount text and progress into one EB-like top block, and renders progress for the compact mobile tray when pricing is enabled.
- Patched `app/assets/widgets/full-page/templates/standard-template.js` with Standard-only runtime CSS for the badge chevron, centered discount text, 126.5625px top block, and EB-aligned progress rows.
- Kept raw shared full-page CSS under Shopify's 100,000 B app-block limit by keeping Standard-only fine-grain styling in the Standard runtime template.
- Rebuilt generated widget assets and bumped `WIDGET_VERSION` to `3.0.11`.
- Verification run:
  - `npx jest tests/unit/assets/bundle-widget-full-page-discount-display.test.ts --runInBand --testNamePattern="Standard mobile side-footer summary"`
  - `node --check app/assets/bundle-widget-full-page.js`
  - `node --check app/assets/widgets/full-page/templates/standard-template.js`
  - `npm run build:widgets`
  - `npm run minify:assets css`
  - `npx eslint --max-warnings 9999 app/assets/bundle-widget-full-page.js app/assets/widgets/full-page/templates/standard-template.js tests/unit/assets/bundle-widget-full-page-discount-display.test.ts scripts/build-widget-bundles.js`
  - `git diff --check`

### 2026-06-05 20:24 - Started expandable-state footer parity slice
- Scope is the FPB Standard Design mobile footer as a whole, with specific focus on the expandable state and state transitions.
- Audit plan: hard-reload EB and WPB storefronts in Chrome mobile viewport, capture collapsed/expanded/selected states, measure footer DOM geometry and interaction details, then patch only the footer DOM/CSS/behavior gaps.
- Next steps: add focused regression coverage for the expanded footer contract, rebuild widget assets, and recheck the mobile storefront after cache-busted reload.

### 2026-06-05 20:32 - Expandable footer state patched
- Chrome audit evidence captured after ignored-cache reload:
  - EB collapsed: `/private/tmp/eb-fpb-standard-mobile-footer-collapsed-2026-06-05.json`, `/private/tmp/eb-fpb-standard-mobile-footer-collapsed-2026-06-05.png`
  - EB expanded: `/private/tmp/eb-fpb-standard-mobile-footer-after-badge-click-2026-06-05.json`, `/private/tmp/eb-fpb-standard-mobile-footer-expanded-2026-06-05.png`
  - WPB collapsed/current gap: `/private/tmp/wpb-fpb-standard-mobile-footer-collapsed-2026-06-05.json`, `/private/tmp/wpb-fpb-standard-mobile-footer-collapsed-2026-06-05.png`
- Confirmed EB expanded state is the same sticky footer growing from `370x195.5625` to `370x407.5625`; the discount/progress block stays on top, a `270px` products/footer block appears below it, and the centered badge arrow flips.
- Patched the compact WPB Standard mobile tray to toggle `fpb-mobile-summary-tray-expanded`, render a selected-products section with header, Clear action, selected row, empty slot skeleton, and keep the CTA in the bottom row.
- Bumped `WIDGET_VERSION` to `3.0.13` and rebuilt widget assets.
- Verification:
  - `npx jest tests/unit/assets/bundle-widget-full-page-discount-display.test.ts --runInBand --testNamePattern="Standard mobile side-footer summary"`
  - `npx jest tests/unit/assets/bundle-widget-full-page-discount-display.test.ts tests/unit/assets/bundle-widget-full-page-template-layout.test.ts --runInBand`
  - `node --check app/assets/bundle-widget-full-page.js`
  - `node --check app/assets/widgets/full-page/templates/standard-template.js`
  - `npm run build:widgets`
  - `npm run minify:assets css`
  - `npx eslint --max-warnings 9999 app/assets/bundle-widget-full-page.js app/assets/widgets/full-page/templates/standard-template.js tests/unit/assets/bundle-widget-full-page-discount-display.test.ts scripts/build-widget-bundles.js`
  - `git diff --check`
- Live storefront cannot show `3.0.13` until manual Shopify deploy/CDN propagation; follow-up Chrome hard reload is still required after deploy.

### 2026-06-05 21:25 - Additional footer-only parity slice started
- Scope remains limited to FPB Standard Design mobile footer.
- User clarified the footer internally uses summary-sidebar components but can collapse and expand.
- Audit target: live EB collapsed/expanded footer behavior and current WPB Standard footer after cache-busted Chrome reload, with attention to component ownership, collapsed badge, expanded product list, CTA row, and state transitions.
- Next steps: capture fresh EB/WPB mobile evidence, add focused regression coverage for the confirmed gap, patch only footer DOM/CSS/behavior, rebuild assets, and verify.

### 2026-06-05 21:25 - Additional footer-only parity slice patched
- Fresh EB mobile evidence captured after ignored-cache reload:
  - Collapsed footer screenshot: `/private/tmp/eb-standard-footer-additional-collapsed-2026-06-05.png`
  - Zero-item badge-click screenshot: `/private/tmp/eb-standard-footer-additional-empty-badge-click-2026-06-05.png`
  - Selected expanded footer screenshot: `/private/tmp/eb-standard-footer-additional-expanded-selected-2026-06-05.png`
- EB collapsed footer remains `370px x 195.5625px`, uses `.gbbProductsFooterHTMLForMobile`, and keeps `.gbbFooterBundleItemsContainer` in the DOM with `display: none` / `0px` geometry.
- EB zero-item badge click does not open the full selected-products state; it only grows to roughly `370px x 203.5625px` with bundle-items clipped to `0px`.
- EB selected-product badge click expands to `370px x 407.5625px`, with `126.5625px` discount region and `270px` products/action footer region.
- Patched WPB `_toggleCompactMobileSummaryTray()` so empty Standard mobile footers stay collapsed and only selected-product states can render the expanded product-list section.
- Added regression coverage in `tests/unit/assets/bundle-widget-full-page-discount-display.test.ts` and updated `test-spec/fpb-standard-mobile-footer-parity.spec.md`.
- Bumped `WIDGET_VERSION` to `3.0.17`, rebuilt widget assets, minified CSS, and rebuilt graphify output.
- Live WPB Chrome check could not use the open pages for Standard verification: `wpb-fresh-fpb-template-parity-2026-06-04` is currently `CLASSIC`, and `preview-testing` is not `FBP_SIDE_FOOTER` / `DEFAULT`.

### 2026-06-06 06:29 - Batch Commit Prep
- Preparing the storefront parity batch that includes the Standard mobile footer expandable-state source/test/spec changes and rebuilt widget assets.
- Confirmed image artifacts are excluded from staging.
- Next: run focused widget contract tests, syntax checks, lint, and staged diff checks before committing.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `internal docs/EB Settings Design Reference.md`
- `docs/issues-prod/eb-ui-clone-rewrite-1.md`

## Phases Checklist
- [x] Phase 1: Capture live EB mobile footer evidence
- [x] Phase 2: Capture current WPB mobile footer evidence
- [x] Phase 3: Confirm footer/sidebar implementation relationship
- [x] Phase 4: Add focused footer parity tests
- [x] Phase 5: Patch mobile footer DOM/CSS behavior
- [x] Phase 6: Capture expandable-state EB/WPB evidence
- [x] Phase 7: Patch expandable-state footer parity
- [ ] Phase 8: Verify live `3.0.13` in Chrome after manual deploy and hard reload
- [x] Phase 9: Additional footer-only collapsed/expanded parity slice
