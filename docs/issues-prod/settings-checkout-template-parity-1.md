# Issue: Settings, Checkout, and Template Parity Batch
**Issue ID:** settings-checkout-template-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 11:23

## Overview
Complete the follow-up parity batch covering integration icon wiring, FPB select-template thumbnails, checkout bundle-line rendering, SDK/storefront impact analysis, Settings subpage UI details, Design settings e2e propagation, and relevant commits.

## Progress Log
### 2026-06-04 11:08 - Batch started
- Created issue log before new code changes.
- Confirmed current worktree already contains many unrelated dirty files from earlier slices; changes in this batch must stay scoped and preserve existing work.
- Searched `public/` for Gokwik and Shopflo assets. They were added to the current worktree as `public/icons/Gokwik.avif` and `public/icons/Shopflo.avif` before implementation.
- Next steps: inspect template thumbnail wiring, checkout extension line-rendering behavior, SDK build impact, and Settings subpage gaps before implementing scoped fixes.

### 2026-06-04 11:23 - Targeted parity fixes implemented
- Wired Gokwik and Shopflo integration cards to `/icons/Gokwik.avif` and `/icons/Shopflo.avif`.
- Wired FPB select-template modal cards to the public `FPB-*` thumbnails.
- Updated checkout bundle component metadata to carry optional product image URLs through `component_pricing` and `_bundle_components`.
- Updated `bundle-checkout-ui` to render product thumbnails for custom component rows and removed the redundant custom `Bundle (n items)` line.
- Confirmed with Shopify Dev MCP docs that `purchase.checkout.cart-line-item.render-after` renders under Shopify's native line details and does not expose a replace/hide API for Shopify's own native line properties; only our custom extension output can be controlled here.
- Settings subpages now use icon-only back buttons, Design title is `Design Control Panel`, Settings card/helper icons use valid icon names, dropdown chevrons are CSS-rendered, expert color warning appears in the right Design section, and Show Variables opens an in-page modal.
- SDK impact analysis: no `app/assets/sdk/` source changes were required. `npm run build:widgets` still rebuilt `extensions/bundle-builder/assets/wolfpack-bundles-sdk.js` as part of the widget build.
- Chrome verification completed on WPB SIT Settings:
  - Settings landing opened in embedded Admin.
  - Design opened with icon-only back action and `Design Control Panel`.
  - Expert Color Controls toggle triggered contextual save bar and displayed `Disable Expert Color Controls to access brand colors.` in the right content section.
  - Language opened with icon-only back action; Show Variables opened a modal showing `{{allowedQuantity}}`.
- Validation completed:
  - Focused Jest: select-template, integration surfaces, checkout metadata, cart-transform query, checkout UI contract, and Settings subpage contracts passed.
  - `cargo test` in `extensions/bundle-cart-transform-rs` passed.
  - `npm exec -- tsc --noEmit --skipLibCheck --project extensions/bundle-checkout-ui/tsconfig.json` passed.
  - Shopify MCP component validation passed for checkout component rows.
  - `npm run build:widgets` completed.
  - `node --check app/assets/bundle-widget-full-page.js` and `node --check app/assets/bundle-widget-product-page.js` passed.
  - ESLint on touched files completed with zero errors; warnings only.
  - Graphify rebuild completed with the known graphify extraction warnings.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `internal docs/EB Settings Design Reference.md`
- `internal docs/EB Settings Language Reference.md`
- `internal docs/Shopify Integration/Checkout UI Extension.md`

## Phases Checklist
- [x] Phase 1: Integration icons and FPB template thumbnails
- [x] Phase 2: Checkout UI extension bundle-line rendering fix
- [x] Phase 3: SDK/storefront impact analysis and build
- [x] Phase 4: Settings subpage UI and save behavior parity pass
- [x] Phase 5: Admin-to-storefront e2e verification
- [x] Phase 6: Relevant commits
