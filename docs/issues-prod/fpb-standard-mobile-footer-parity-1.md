# Issue: FPB Standard Mobile Footer Parity
**Issue ID:** fpb-standard-mobile-footer-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-05
**Last Updated:** 2026-06-05 18:10

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
- [ ] Phase 6: Build, minify, and verify in Chrome after hard reload
