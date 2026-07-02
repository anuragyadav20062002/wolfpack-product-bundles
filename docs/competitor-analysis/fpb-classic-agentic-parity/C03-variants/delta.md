# C03 Variants Delta

Evidence root: `/private/tmp/fpb-classic-agentic-parity/C03-variants/`

## EB Truth

- EB Classic Admin help content was captured before implementation:
  - `eb-step-setup-help-snapshot.txt`
  - `eb-rules-help-snapshot.txt`
- EB Classic storefront evidence was captured on desktop and mobile:
  - `eb-desktop.png`
  - `eb-desktop-a11y-snapshot.txt`
  - `eb-desktop-runtime-and-styles.json`
  - `eb-desktop-option-click-log.json`
  - `eb-mobile.png`
  - `eb-mobile-a11y-snapshot.txt`
  - `eb-mobile-runtime-and-styles.json`
  - `eb-mobile-option-click-log.json`
  - `eb-mobile-network-summary.json`
- In this fixture EB Classic renders grouped variant controls inline under product cards. The observed mobile fixture also used inline controls; no separate drawer node appeared after tapping the mobile control.
- EB retained the inherited long category label and second step/category leftovers in this shared fixture, so visual comparisons must separate variant behavior from those unrelated fixture leftovers.

## WPB Before Fix

- WPB Admin save response persisted `bundleDesignTemplate: "FBP_SIDE_FOOTER"` and `bundleDesignPresetId: "CLASSIC"` with `Fragrance Candle` and `Black Crew Neck T-Shirt - Kite App` in the first category:
  - `wpb-admin-save-request.network-request`
  - `wpb-admin-save-response.network-response`
- Cache-bypassed desktop proof before the fix showed the current Classic storefront rendered the variant products, but product cards had no variant option controls:
  - `wpb-desktop-before-fix.png`
  - `wpb-desktop-a11y-before-fix.txt`
  - `wpb-desktop-before-runtime-and-styles.json`
  - `wpb-dom-config-and-products-before.json`
- The live page HTML still embedded a stale full `data-bundle-config` payload with `bundleDesignPresetId: "STANDARD"` and only the older four products. The root dataset already carried `data-fpb-design-preset="CLASSIC"`, and the runtime eventually hydrated current Classic data.

## Root Cause

- Classic product cards already call the shared variant selector for grouped products.
- The selector returns empty markup when `product.options` is empty.
- Shopify/Admin payloads for these products carry variant option names and values in `variants[].selectedOptions`, but the storefront normalization path only read flattened `option1`, `option2`, and `option3`.
- The runtime compact serializer also stripped `selectedOptions` before the browser could derive option fields from it.
- Follow-up mobile proof showed a second shared data gap: the proxy payload had two Fragrance Candle copies. `steps[0].categories[0].products` correctly marked the `Peach` variant unavailable, while `steps[0].products` marked every Fragrance variant available. The storefront rendered from the top-level step product copy, so `Peach` leaked into the Classic grouped selector.

## Implementation

- `app/lib/bundle-config/category-runtime.ts`
  - Derives compact product `options` from `variants[].selectedOptions` when no explicit product options are present.
  - Derives compact variant `option1`, `option2`, and `option3` from `selectedOptions`.
  - Continues stripping raw `selectedOptions` from runtime payloads.
- `app/assets/widgets/full-page/methods/product-processing-methods.js`
  - Derives storefront product option names from explicit options, then `selectedOptions`, then variant-title fallback.
  - Normalizes variant `option1`, `option2`, and `option3` from direct fields, then `selectedOptions`, then title fallback.
  - Merges category-cached variant availability into duplicate top-level step products before product normalization.
- `app/assets/widgets/shared/variant-selector.js`
  - Builds grouped primary/overflow choices from selectable variants only.
  - Ignores direct primary selection requests when the requested value has no selectable variant.
- `scripts/build-widget-bundles.js`
  - Bumped `WIDGET_VERSION` to `5.0.20`.

## WPB After Fix

- Desktop hard reload with cache bypass served `window.__BUNDLE_WIDGET_VERSION__ === "5.0.18"`.
- Desktop Classic product cards now render grouped inline variant controls:
  - `Fragrance Candle`: `Cherry`, `Vanilla`, `Lavendar`, `Orange`, `+2`
  - `Black Crew Neck T-Shirt - Kite App`: primary option pills plus secondary `Option 2: Black` control
- Desktop option interaction proof:
  - `wpb-desktop-option-click-log-after-fix.json`
  - Selecting `Vanilla` changed the card `data-product-id` from `48719984394499` to `48719984427267`, changed the selected pill to `Vanilla`, and changed the image to `Vanilla.png`.
- Desktop selection proof:
  - `wpb-desktop-selection-proof-after-fix.json`
  - After selecting `Vanilla` and clicking add, the bundle summary changed from `0 items` to `1 item` and showed `Fragrance Candle x1`.
- Desktop no-Standard-first proof:
  - `wpb-desktop-flash-timeline-after-fix.json`
  - The sampled early reload timeline captured no `STANDARD` preset/class samples before the final Classic render.
- Saved screenshots and a11y:
  - `wpb-desktop-after-fix.png`
  - `wpb-desktop-a11y-after-fix.txt`
  - `wpb-desktop-runtime-and-styles-after-fix.json`

## Remaining Gap

- Variants-as-individual-products proof is still not captured for this row, so C03 remains `fixed-awaiting-live-proof` rather than `verified`.

## WPB Follow-Up Proof

- True mobile proof after the availability merge:
  - `wpb-mobile-cache-clear-after-availability-merge-5020.json`
  - `wpb-mobile-overflow-panel-after-availability-merge-5020.json`
  - `wpb-mobile-overflow-panel-after-availability-merge-5020.png`
  - `wpb-mobile-a11y-after-availability-merge-5020.txt`
- `wpb-mobile-overflow-panel-after-availability-merge-5020.json` records `window.__BUNDLE_WIDGET_VERSION__ === "5.0.20"`, viewport `390 x 844` at DPR `2`, root preset `CLASSIC`, Fragrance overflow text `+1`, `bodyContainsPeach: false`, and overflow choices `Cherry`, `Vanilla`, `Lavendar`, `Orange`, and `Ocean`.
- Final cart proof:
  - `wpb-mobile-cart-add-request-vanilla-5020.network-request`
  - `wpb-mobile-cart-proof-vanilla-5020.json`
- The saved `cart/add.js` request posts selected Vanilla variant ID `48719984427267` with quantity `1`; the unavailable `Peach` variant is absent from the UI and cannot enter the bundle selection through the grouped selector.

## Verification

- `npx jest tests/unit/lib/bundle-config-contracts.test.ts --runInBand`
- `npx jest tests/unit/assets/fpb-standard-variant-availability.test.ts --runInBand`
- `npm run build:widgets`
- `npm run minify:assets css`
- `node --check app/assets/bundle-widget-full-page.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `npx jest tests/unit/assets/fpb-standard-variant-availability.test.ts tests/unit/lib/bundle-config-contracts.test.ts tests/unit/assets/fpb-full-page-metafield-cache.test.ts tests/unit/assets/fpb-template-stylesheet-switch.test.ts tests/unit/routes/fpb-step-category-accordion.test.ts --runInBand`
- `npx eslint --max-warnings 9999 app/assets/widgets/full-page/methods/product-processing-methods.js app/lib/bundle-config/category-runtime.ts tests/unit/assets/fpb-standard-variant-availability.test.ts tests/unit/lib/bundle-config-contracts.test.ts`
- `npm run graphify:rebuild`
- `npx jest tests/unit/assets/bundle-widget-full-page-category-hydration.test.ts tests/unit/assets/fpb-standard-variant-availability.test.ts --runInBand`
- `npm run build:widgets`
- `node --check app/assets/widgets/shared/variant-selector.js`
- `node --check app/assets/widgets/full-page/methods/product-processing-methods.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `npx eslint --max-warnings 9999 app/assets/widgets/full-page/methods/product-processing-methods.js app/assets/widgets/shared/variant-selector.js tests/unit/assets/bundle-widget-full-page-category-hydration.test.ts tests/unit/assets/fpb-standard-variant-availability.test.ts`
- `npm run graphify:rebuild`
