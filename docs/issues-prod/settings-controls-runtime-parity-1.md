# Issue: Settings Controls Runtime Parity
**Issue ID:** settings-controls-runtime-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 12:40

## Overview
Implement the main remaining EB parity gap from Settings -> Controls: Admin values are currently saved for page state, but most Controls settings are not promoted into runtime data or consumed by storefront widgets.

## Progress Log
### 2026-06-04 11:54 - Work started
- User requested implementation of the main remaining Settings -> Controls parity gap.
- Prior EB audit confirmed the Admin inventory exists in WPB, but runtime promotion is incomplete beyond `customCss` and `bundleCartLineMessaging`.
- Scope for this slice: add TDD coverage, promote EB Controls values into typed runtime settings, expose them through a storefront-readable controls settings route, and wire the main PPB/FPB widget behaviors directly affected by these controls.
- Impact analysis: touches Settings route save runtime, a new app-proxy API route, product-page/full-page widget JS sources, generated widget bundles, and graphify metadata. No Prisma migration planned because `DesignSettings.generalSettings` and existing `customCss`/`bundleCartLineMessaging` columns are sufficient.

### 2026-06-04 12:22 - Runtime wiring implemented
- Added red tests and `test-spec/settings-controls-runtime-parity.spec.md` for Controls runtime mapping, storefront route contract, and PPB/FPB widget source contracts.
- Added `app/lib/settings-controls-runtime.ts` to promote EB Controls payload values into `settingsControls`, scoped FPB/PPB `customCss`, and existing `bundleCartLineMessaging`.
- Updated `app/routes/app/app.settings.tsx` so `saveSettingsControls` upserts both `product_page` and `full_page` rows with scoped runtime data instead of only saving combined Product Page CSS/cart messaging.
- Added public storefront endpoint `app/routes/api/api.controls-settings.$shopDomain.tsx` returning `settingsControls` and bundle-type-specific `activeControls`.
- Wired PPB widget to fetch Controls, honor product-card-click, auto-add-after-last-step, post-add redirect/side-cart behavior, and execute script hooks.
- Wired FPB widget to fetch Controls and honor Landing Page checkout/cart redirect plus execute script hook.
- Bumped widget version to `2.9.74` and rebuilt generated widget/SDK assets.
- Verification: red tests failed before implementation; focused Jest tests now pass; `node --check` passes for both raw widget files; `npm run build:widgets` passes; modified-file ESLint has 0 errors; `npm run build` passes. Chrome DevTools smoke was attempted but the tool timed out before returning pages.

### 2026-06-04 12:26 - Commit prepared
- Rebuilt `graphify-out/GRAPH_REPORT.md` and `graphify-out/graph.json` with the documented graphify virtualenv after plain `python3` could not import `graphify`.
- Preparing a scoped commit for Controls runtime parity. Unrelated screenshots, network captures, and pre-existing dirty tests are intentionally left unstaged.

### 2026-06-04 12:40 - Chrome smoke completed
- Chrome DevTools recovered after the earlier timeout.
- Storefront app-proxy endpoint verified from `agent-5sfidg3m.myshopify.com`: both `bundleType=product_page` and `bundleType=full_page` return `200` with `settingsControls` and `activeControls`.
- FPB storefront verified at `https://agent-5sfidg3m.myshopify.com/pages/wpb-sit-sanity-fpb-2026-06-02-2`: widget renders, `window.__BUNDLE_WIDGET_VERSION__` is `2.9.74`, and network request `controls-settings/...bundleType=full_page` returns `200`.
- PPB storefront verified at `https://agent-5sfidg3m.myshopify.com/products/wpb-sit-sanity-ppb-2026-06-02`: widget renders, `window.__BUNDLE_WIDGET_VERSION__` is `2.9.74`, product cards render, and network request `controls-settings/...bundleType=product_page` returns `200`.

## Related Documentation
- `internal docs/EB Edit Settings Gap Audit 2026-06-04.md`
- `internal docs/EB Settings Design Reference.md`
- `internal docs/EB Settings Language Reference.md`
- `docs/issues-prod/settings-page-parity-1.md`

## Phases Checklist
- [x] Phase 1: Red tests for Controls runtime mapping and widget source contracts
- [x] Phase 2: Runtime mapping and API route implementation
- [x] Phase 3: PPB/FPB widget consumption and behavior wiring
- [x] Phase 4: Widget build/minification and verification
- [x] Phase 5: Chrome smoke verification
- [x] Phase 6: Commit relevant changes
