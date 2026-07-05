# C01 Category Pills Delta

**Case ID:** C01-category-pills
**Evidence root:** `/private/tmp/fpb-classic-agentic-parity/C01-category-pills/`
**Status:** verified

## EB Evidence

- EB Classic storefront renders category pills above products on desktop.
- Active pill is dark with light text; inactive pill is light with a border.
- Long labels are allowed to occupy large pill width; on mobile the active long pill clips/scrolls horizontally rather than wrapping into a tall control.
- Truly empty/unselected categories are pruned from storefront output. The second long-label category only rendered after products were selected in EB Admin.

Key files:
- `eb-desktop.png`
- `eb-desktop-second-category.png`
- `eb-mobile.png`
- `eb-mobile-second-category.png`
- `eb-category-state-probe.json`
- `eb-category-click-result.json`
- `eb-runtime.json`
- `eb-computed.json`

## WPB Evidence

- WPB Admin setup selected two products in Category 2; the Admin snapshot showed `2 Selected`.
- Live WPB storefront page HTML still embedded stale full config with `bundleDesignPresetId: "STANDARD"` and old single-category products.
- WPB app-proxy API returned the current bundle data: `bundleDesignPresetId: "CLASSIC"`, `bundleDesignTemplate: "FBP_SIDE_FOOTER"`, and both long-label categories with product counts `4` and `2`.
- Runtime `5.0.17` hydrates the current app-proxy bundle before first render when the embedded full cached payload is stale, so the root stays `CLASSIC` and no `STANDARD` transition is captured.
- Classic category tabs now render active/inactive pills matching EB's state treatment. The duplicate lower category row is hidden for Classic, leaving the top pill row as the category navigation surface.

Key files:
- `wpb-admin-after-picker-a11y.txt`
- `wpb-after-css-runtime.json`
- `wpb-desktop-after-css-runtime.json`
- `wpb-desktop-after-css.png`
- `wpb-mobile-after-css-final.png`
- `wpb-desktop-after-css-category-click-result.json`
- `wpb-mobile-after-css-category-click-result.json`
- `wpb-proxy-api-state.json`
- `wpb-live-deploy-check.json`
- `wpb-after-css-network.json`

## Source Decision

Two source gaps were involved:

1. The full-page Liquid block can still serve stale full bundle JSON from `custom.bundle_config` in the live dev tunnel.
2. Classic-owned CSS flattened category tabs back to transparent text instead of EB-style pills.

Fix:
- `extensions/bundle-builder/blocks/bundle-full-page.liquid` now emits the compact full-page bootstrap marker:
  `{"v":2,"type":"full_page","bundleType":"full_page","id":...}`
- `app/assets/widgets/full-page/methods/tier-floating-runtime-methods.js` hydrates current data through `/apps/product-bundles/api/bundle/{id}.json` before first render when the embedded payload is a full cached config.
- `app/assets/widgets/full-page-css/templates/classic/base.css`, `desktop-products.css`, and `mobile.css` own the Classic pill treatment and suppress the duplicate category-section row for Classic only.

## Verification

Passed:
- `npx jest --selectProjects unit --testPathPattern tests/unit/assets/fpb-full-page-metafield-cache.test.ts --runInBand`
- `npm run build:widgets`
- `npm run minify:assets css`
- `node --check app/assets/bundle-widget-full-page.js`
- `node --check app/assets/widgets/full-page/methods/runtime-cart-settings-methods.js`
- `node --check app/assets/widgets/full-page/methods/tier-floating-runtime-methods.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `node --check extensions/bundle-builder/assets/wolfpack-bundles-sdk.js`
- `npx eslint --max-warnings 9999 app/assets/bundle-widget-full-page.js app/assets/widgets/full-page/methods/runtime-cart-settings-methods.js app/assets/widgets/full-page/methods/tier-floating-runtime-methods.js tests/unit/assets/fpb-full-page-metafield-cache.test.ts`
- `npm run graphify:rebuild`

Live Chrome proof:
- Desktop and mobile Cache Storage were cleared and the storefront was reloaded with cache bypass through Chrome DevTools MCP.
- `wpb-desktop-after-css-runtime.json`: `version` is `5.0.17`, `rootPreset` is `CLASSIC`, `rawPreset` is still `STANDARD`, `hasStandardTransition` is `false`, and only base + Classic full-page stylesheets are active.
- `wpb-after-css-runtime.json`: mobile pills use black active state, white inactive state, `999px` radius, no wrapping, horizontal overflow, and hidden duplicate category row.
- `wpb-desktop-after-css-category-click-result.json` and `wpb-mobile-after-css-category-click-result.json`: second category switching still renders the expected second-category products.
