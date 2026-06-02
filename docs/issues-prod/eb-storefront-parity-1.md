# Issue: EB Storefront Parity for FPB and PPB
**Issue ID:** eb-storefront-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-02
**Last Updated:** 2026-06-02 10:41

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

### 2026-06-02 02:45 - FPB selected-item variant fallback slice started
- Chrome click proof showed `Add To Box` fires but is blocked by `This item is out of stock.` and the sidebar stays at `0 items`.
- Public `/api/storefront-products` response for the FPB fixture returns products with empty `variants` arrays, so the widget has no sellable variant ID and treats cards as unavailable.
- Existing EB rewrite evidence documents this stock-gate class: sellable Storefront variants must not be blocked when inventory details are missing or zero, and selected-state sidebar proof depends on usable variant data.
- Scope this slice to the storefront-products DTO source: include a non-inventory first-variant fallback in the main product query and use it when paginated variant hydration fails, instead of returning `variants: []`.
- Patched `api.storefront-products` to include `variants(first: 1)` in the main product query and map that fallback variant when `fetchAllVariants` fails.
- Live API proof: `/apps/product-bundles/api/storefront-products` now returns fallback variants for the FPB fixture; unavailable first product remains unavailable, while second and third products return available variant IDs.
- Verification passed: `npx eslint --max-warnings 9999 app/routes/api/api.storefront-products.tsx` returned 0 errors and warnings only.
- Chrome storefront smoke: after reload, the visible available card uses variant ID `48191701188867`; clicking `Add To Box` selects it, sidebar changes to `1 item`, renders the product thumbnail/title/price row, removes skeleton rows, and enables the action button.

### 2026-06-02 03:02 - FPB sidebar action button width slice started
- EB DEFAULT evidence shows a wider, more prominent black sidebar action button in the bottom total/action row.
- Current selected WPB sidebar action row computes to `174px 140px`, with the button only `140px` wide.
- Scope this slice to CSS sizing only: widen the existing action column/button without changing Add to Cart vs Next behavior.
- Patched the existing sidebar action CSS to reserve a `198px` action column and `198px` CTA min-width.
- Generated minified storefront CSS with `npm run minify:assets css`; local generated full-page CSS is under Shopify's 100,000 byte limit.
- Chrome selected-state smoke: after selecting the available card, the action row computes to `116px 198px`, button width computes to `198px`, and the sidebar still shows the selected product row/thumbnail.

### 2026-06-02 03:18 - FPB DEFAULT product price visibility slice started
- Existing EB DEFAULT evidence says product card prices are not shown, while CLASSIC/COMPACT/HORIZONTAL show prices.
- Current Chrome proof after the variant fallback shows DEFAULT product cards rendering compare-at and final prices.
- Scope this slice to CSS hiding product-card price rows only when `data-fpb-design-preset=DEFAULT`; sidebar totals and selected-row prices remain visible.

### 2026-06-02 03:19 - FPB fixed-amount discount message currency slice started
- Chrome selected-state proof showed the FPB sidebar message rendering `$5.00` while the consumed pricing DTO already carries EB-style merchant display text: `bundleQuantityOptions.optionsByRuleId[ruleId].subtext` = `₹5 off`.
- Existing EB reference confirms discount messaging is template-driven via `{{discountValue}}` and `{{discountValueUnit}}`, with compact storefront discount data mirrored from the admin configuration.
- Scope this slice to discount variable generation: prefer rule-bound DTO display text for fixed-amount reward variables, without hardcoding currency symbols or merchant-facing copy.
- Implemented shared `TemplateManager` logic to derive fixed-amount reward variables from rule-bound `bundleQuantityOptions` / `tierTextByRuleId` text before falling back to storefront currency formatting.
- Bumped `WIDGET_VERSION` to `2.9.17` and rebuilt storefront bundles with `npm run build:widgets`.
- Verification passed: `node --check app/assets/widgets/shared/template-manager.js`, `node --check scripts/build-widget-bundles.js`, and modified-file ESLint with 0 errors.
- Local runtime proof: a fixed-amount rule with DTO subtext `₹5 off` now renders `Add 1 product(s) to save ₹5!` even when `currencyInfo.display.symbol` is `$`.
- Chrome DevTools page listing timed out twice at 120 seconds, so live Chrome e2e for this slice is still pending and must be retried when the DevTools connection recovers.
- CSS-only hiding exceeded Shopify's 100,000 byte full-page CSS limit, so the final patch removes `.product-price-row` while rendering FPB DEFAULT product cards instead.
- Bumped `WIDGET_VERSION` to `2.9.16` and rebuilt widget assets with `npm run build:widgets`; CSS minification also passed.
- Verification passed: `node --check app/assets/bundle-widget-full-page.js && node --check scripts/build-widget-bundles.js`.
- Verification passed: `npx eslint --max-warnings 9999 app/assets/bundle-widget-full-page.js scripts/build-widget-bundles.js` returned 0 errors and ignore-pattern warnings only.
- Chrome storefront smoke on `preview-codex-fpb-2026-05-21`: served widget version is `2.9.16`, visible DEFAULT product card text is `2024 Summer Slides / Add To Box` with `0` price rows, and selected sidebar still shows product row price plus total after adding the card.

### 2026-06-02 03:34 - FPB CLASSIC evidence-backed layout slice started
- Current EB CLASSIC screenshot evidence shows a gray full-page background and no product search box above category pills.
- Existing WPB CLASSIC screenshot showed a white page and a visible search box, while DEFAULT had already been moved to a gray background.
- Patched the FPB storefront CSS background selector to apply the gray page background to every FPB design preset marker, not just DEFAULT.
- Patched full-page sidebar rendering so `FBP_SIDE_FOOTER` presets do not render the product search box.
- Built widget assets with `npm run build:widgets` and generated CSS with `npm run minify:assets css`; full-page CSS output stayed under Shopify's 100,000 byte limit.
- Verification passed: `node --check app/assets/bundle-widget-full-page.js && node --check app/assets/widgets/shared/template-manager.js && node --check scripts/build-widget-bundles.js`.
- Verification passed: `npx eslint --max-warnings 9999 app/assets/bundle-widget-full-page.js app/assets/widgets/shared/template-manager.js scripts/build-widget-bundles.js` returned 0 errors and ignore-pattern warnings only.
- Admin e2e: opened Select Template for FPB bundle `cmpfhj2m10000v0t038osl42y`, selected Classic Design, and advanced to the preview-ready modal state.
- Storefront e2e: public bundle JSON returned `bundleDesignTemplate: "FBP_SIDE_FOOTER"` and `bundleDesignPresetId: "CLASSIC"`; runtime markers matched `CLASSIC`, bundle-scoped search was absent, body/root backgrounds computed `rgb(241, 241, 241)`, product-card prices rendered, and `.fpb-sidebar-tier-cta` rendered `Box of 2` / `₹5 off`.
- Interaction smoke: clicking an available CLASSIC product populated the sidebar selected row, updated the count to `1 item`, showed `Total $5.00`, and enabled `Add to Cart`.

### 2026-06-02 03:58 - FPB COMPACT grid parity slice started
- Current EB COMPACT screenshot evidence shows a compact two-column portrait product grid beside the sidebar.
- Existing WPB COMPACT screenshot showed oversized single-column cards, and the CSS forced `grid-template-columns: 1fr` for the COMPACT preset.
- Patched the COMPACT desktop grid rule to render two compact columns with tighter spacing.
- Generated CSS with `npm run minify:assets css`; full-page CSS output stayed under Shopify's 100,000 byte limit.
- Admin e2e: reopened Select Template for FPB bundle `cmpfhj2m10000v0t038osl42y`, selected Compact Design, and submitted through the preview-ready modal flow.
- Storefront e2e: public bundle JSON returned `bundleDesignTemplate: "FBP_SIDE_FOOTER"` and `bundleDesignPresetId: "COMPACT"`; runtime markers matched `COMPACT`, bundle-scoped search was absent, body/root backgrounds computed `rgb(241, 241, 241)`, grid computed `220px 220px` with `12px` gap, product-card prices rendered, and `.fpb-sidebar-tier-cta` rendered `Box of 2` / `₹5 off`.
- Interaction smoke: clicking an available COMPACT product populated the sidebar selected row, updated the count to `1 item`, and enabled `Add to Cart`.

### 2026-06-02 04:18 - FPB HORIZONTAL tab parity slice started
- Current EB HORIZONTAL screenshot evidence shows text category tabs with an underline active state, not filled pill tabs.
- Existing WPB HORIZONTAL screenshot showed pill category tabs.
- Patched the HORIZONTAL preset to reuse the FPB underline tab treatment while keeping the horizontal product-card layout.
- Added runtime `data-fpb-tab-style` markers so DEFAULT and HORIZONTAL use underline tabs while CLASSIC and COMPACT keep pill tabs.
- Bumped `WIDGET_VERSION` to `2.9.18`, rebuilt widget bundles with `npm run build:widgets`, and regenerated CSS with `npm run minify:assets css`.
- Verification passed: `node --check app/assets/bundle-widget-full-page.js`, `node --check scripts/build-widget-bundles.js`, and modified-file ESLint with 0 errors and ignore-pattern warnings only.
- Chrome storefront read-only proof: current live FPB bundle remains COMPACT (`data-fpb-design-preset="COMPACT"`), so HORIZONTAL browser proof is still pending.
- Admin e2e blocker: the SIT embedded app iframe currently returns Cloudflare `Error 1016 Origin DNS error` for the dev tunnel, preventing template switching through Select Template.

### 2026-06-02 09:46 - PPB SIMPLIFIED modal product-loading slice started
- Chrome storefront proof shows the PPB app block now renders on `WPB Complete Audit Product Page 2026-05-25` with `data-ppb-template-type="PDP_MODAL"` and `data-ppb-design-preset="SIMPLIFIED"`.
- Clicking the visible `Product 1` slot opens the modal, but the modal shows `Could not load products. Please check your connection and try again.`
- Root-cause candidate: PPB `resolveStorefrontApiBase()` falls back to the shop origin when `window.Shopify.shop` is absent and `window.__BUNDLE_APP_URL__` is null, producing `/api/storefront-products` instead of EB-aligned app-proxy data loading via `/apps/product-bundles/api/storefront-products`.
- Scope this slice to align PPB storefront data fetches with the app-proxy API strategy already used by FPB.

### 2026-06-02 10:04 - PPB SIMPLIFIED modal product-loading app-proxy fix prepared
- Updated PPB storefront widget API base resolution so missing `window.__BUNDLE_APP_URL__` now uses Shopify app-proxy paths instead of shop-origin `/api/...` paths.
- Rebuilt widget bundles with `WIDGET_VERSION=2.9.19`; generated PPB bundled asset contains the same app-proxy fallback.
- Verification passed: `node --check app/assets/bundle-widget-product-page.js`, `node --check scripts/build-widget-bundles.js`, `npm run build:widgets`, and modified-file ESLint with 0 errors and ignore-pattern warnings only.
- Chrome storefront retry after reload still shows the old product-loading error modal; live asset proof is pending until the Shopify extension/CDN serves the rebuilt `2.9.19` widget.
- Follow-up Chrome proof after live `2.9.19` served: the modal now requests `/apps/product-bundles/api/storefront-products`; the API returns `200` with the configured product DTO, but the widget still shows the load error because the only returned variant is unavailable and PPB filters it into an empty list.
- Patched PPB product normalization so unavailable configured products remain visible as out-of-stock cards instead of becoming a false product-loading failure.
- Patched PPB stock lookup so `available:false` from the Storefront DTO disables the card as out of stock even when `quantityAvailable` is null.
- Rebuilt widget bundles and re-smoked live PPB after SIT served the new extension asset path: SIMPLIFIED computes to a single 345px slot column, clicking the slot opens the modal, `fetchErrorVisible=false`, and the configured product renders in the product grid.

### 2026-06-02 10:17 - PPB SIMPLIFIED slot-grid CSS parity slice started
- EB reference confirms MODAL and SIMPLIFIED both use `PDP_MODAL`; MODAL is a 3-column mini-slot grid and SIMPLIFIED is a single-column full-width slot row.
- Live Chrome proof on the SIT PPB page shows `data-ppb-design-preset="SIMPLIFIED"` but computed `.bw-ppb-modal-slot-grid` remains `104.32px 104.32px 104.32px`.
- Root cause: `.bw-ppb-modal-slot-grid--simplified` is declared before the base `.bw-ppb-modal-slot-grid`, so the base grid rule wins.
- Scope this slice to increase SIMPLIFIED selector specificity/order without changing MODAL behavior.

### 2026-06-02 10:29 - PPB SIMPLIFIED slot-grid CSS parity fix prepared
- Added a high-specificity SIMPLIFIED grid override after the base PPB modal grid so SIMPLIFIED resolves to one column while MODAL stays three columns.
- Added SIMPLIFIED empty-slot row overrides after the base modal empty-card styles so EB's label-left/icon-right short row can win after minification.
- Bumped `WIDGET_VERSION` to `2.9.20`, rebuilt widget bundles, and minified CSS assets.
- Verification passed: `node --check scripts/build-widget-bundles.js`, `npm run build:widgets`, `npm run minify:assets css`, and `npx eslint --max-warnings 9999 scripts/build-widget-bundles.js` with 0 errors and an ignore-pattern warning only.
- Chrome storefront reload still serves the older Shopify CDN stylesheet; computed SIMPLIFIED grid remains `104.32px 104.32px 104.32px`, so live e2e proof is pending after SIT deploy/CDN propagation.
