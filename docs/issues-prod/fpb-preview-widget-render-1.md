# Issue: FPB Preview Widget Render Failure
**Issue ID:** fpb-preview-widget-render-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-05
**Last Updated:** 2026-06-05 20:19

## Overview
Tester reported that creating a Full Page Bundle and opening preview renders only the shop shell on the storefront; the FPB widget itself does not render.

## Progress Log
### 2026-06-05 20:03 - Started reproduction and RCA
- Investigating preview page creation/open flow and widget hydration path before making code changes.
- Reproduction target: create/preview FPB path where the Shopify page shell loads but the widget container does not render bundle content.
- Next steps: inspect existing preview-page helpers, tests, route handlers, then reproduce in Chrome or unit-level flow and patch root cause.

### 2026-06-05 20:06 - Root cause fixed with regression coverage
- Isolated the blank preview path to the app-created Shopify page body and app-embed hydration contract: the page body marker was malformed/duplicated, new preview pages were not refreshed with the resolved bundle config after creation, and the app embed could skip initialization when the full-page script was already present.
- Added focused regression tests for create-preview route behavior, clean marker HTML with escaped config, and app embed initializer wiring.
- Updated preview creation/re-open flow to refresh the page body with the full bundle object before returning the preview URL.
- Exposed the full-page widget initializer and updated the body app embed to invoke it after hydrating the hidden marker.
- Verification: `npx jest tests/unit/routes/fpb-configure-preview.test.ts tests/unit/services/widget-full-page-bundle-preview.test.ts --runInBand` passed 23 tests.

### 2026-06-05 20:19 - Completed verification before commit
- Verified the preview fix alongside the current FPB parity/status slices with the modified-test set: `npx jest tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/lib/analytics-helpers.test.ts tests/unit/routes/fpb-addons-admin-layout.test.ts tests/unit/routes/fpb-addons-step-config-controls-parity.test.ts tests/unit/routes/fpb-bundle-settings-surface-contract.test.ts tests/unit/routes/fpb-save-bundle.test.ts tests/unit/services/widget-full-page-bundle.test.ts tests/unit/routes/fpb-addons-selected-products-modal.test.ts tests/unit/routes/fpb-configure-preview.test.ts tests/unit/services/widget-full-page-bundle-preview.test.ts tests/unit/routes/parent-product-status-ui.test.ts tests/unit/assets/bundle-widget-full-page-discount-display.test.ts --runInBand` passed 153 tests.
- Verified raw widget syntax and rebuilt widget assets with `node --check`, `npm run build:widgets`, and `npm run minify:assets css`.
- Live storefront preview still requires manual deploy/CDN propagation before browser verification because autonomous Shopify deploy is prohibited.

## Related Documentation
- `test-spec/fpb-page-url-theme-shell.spec.md`
- `test-spec/fpb-proxy-preview-stale-url.spec.md`
- `internal docs/EB Implementation Reference.md`

## Phases Checklist
- [x] Phase 1: Reproduce or isolate the blank-preview path
- [x] Phase 2: Identify root cause in preview page/widget hydration flow
- [x] Phase 3: Add focused regression coverage
- [x] Phase 4: Implement root-cause fix
- [x] Phase 5: Verify tests/build and document deploy-gated browser follow-up
