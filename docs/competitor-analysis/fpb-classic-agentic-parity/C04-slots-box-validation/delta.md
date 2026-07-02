# C04 Slots Box Validation Delta

## Status

`in-progress-runtime-fixture-gap`

The EB C04 fixture was configured through the visible Admin UI and captured on
desktop and mobile. A fresh WPB hard-reload probe on `window.__BUNDLE_WIDGET_VERSION__ === "5.0.20"`
still shows that the live WPB proxy payload for `cmr361mz50000v00yrdeyxpf7` reports:

- `bundleDesignTemplate: "FBP_SIDE_FOOTER"`
- `bundleDesignPresetId: "CLASSIC"`
- `productSlotsEnabled: false`
- `productSlotIconUrl: null`
- `boxSelection: null`

Fresh proof:

- `wpb-live-c04-slot-payload-probe-5020.json`

This means the storefront template proof is valid for Classic rendering and
Classic sidebar slot CSS, but C04 cannot be marked complete as a product-slot
runtime parity row until the fixture persists product slots/box selection in
the storefront payload.

Evidence is stored under `/private/tmp/fpb-classic-agentic-parity/C04-slots-box-validation/`.

## Captured Evidence

- `eb-admin-step-setup-multicategory.png`: EB step/category setup with multiple categories. Confirms the category-name textbox appears inside the category accordion when more than one category exists.
- `eb-admin-bundle-settings-slots.png` and `eb-admin-bundle-settings-slots.snapshot.txt`: EB Product Slots and Quantity Validation controls.
- `eb-admin-discount-quantity-options.png` and `eb-admin-discount-quantity-options.snapshot.txt`: EB Bundle Quantity Options for `Box of 2` / `₹5 off`.
- `eb-desktop-after-fixture.png`, `eb-desktop-runtime-after-fixture.json`, `eb-desktop-network-relevant.json`: EB Classic desktop fixture after hard reload.
- `eb-mobile-after-fixture.png`, `eb-mobile-runtime-after-fixture.json`: EB Classic mobile fixture after hard reload.
- `eb-desktop-after-one-selection.png`, `eb-desktop-after-exact-max.png`, `eb-desktop-after-over-max-attempt.png`: EB selection states.
- `eb-checkout-over-max-accepted.png` and `eb-checkout-over-max-accepted.json`: EB accepted checkout with three selected items in this fixture.
- `wpb-desktop-empty-slots.png`, `wpb-desktop-empty-slots-runtime.json`, `wpb-desktop-empty-slots.snapshot.txt`: WPB Classic desktop after hard reload.
- `wpb-desktop-after-one-selection.png`, `wpb-desktop-after-one-selection-runtime.json`, `wpb-desktop-filled-slot-descendants-runtime.json`: WPB filled-slot thumbnail/remove proof.
- `wpb-desktop-after-third-add.png`, `wpb-desktop-after-third-add-runtime.json`: WPB over-selection state.
- `wpb-mobile-collapsed-empty.png`, `wpb-mobile-expanded-empty.png`, `wpb-mobile-expanded-empty-runtime.json`: WPB mobile tray proof at `390x844x2,mobile,touch`.
- `wpb-mobile-config-product-slots-runtime.json`: live WPB proxy/runtime config proof for the fixture gap.
- `wpb-cart-clear-proof.json`: WPB cart cleared after contaminated add-to-cart proof.

## EB Facts Read Before Implementation

- EB help article confirms the builder hierarchy is `Step -> Category -> Products`.
- EB help article confirms category names can be edited directly, matching the observed multi-category accordion textbox.
- EB help article says step/category rules can block progression or over-selection when requirements are not met.
- Live C04 evidence overrides the setup expectation for this exact fixture: with `Box of 2` visible, EB allowed a third item and accepted checkout with three bundle components.
- `internal docs/EB Implementation Reference.md` documents Product Slots as FPB-only Bundle Settings behavior that replaces the default empty slot plus icon with the merchant Slot Icon.
- `internal docs/EB Implementation Reference.md` documents box validation as exact active-rule quantity matching when `validateBoxSelectionQuantity: true`.

## First-Render Template Finding

The WPB storefront still had a stale full `data-bundle-config` payload whose
embedded `bundleDesignPresetId` was `STANDARD`, while the current proxy payload
returned `CLASSIC`. That is the root cause of the observed Standard first paint
followed by a Classic switch.

Current committed source/build includes `hydrateCurrentFullPageBundleBeforeRender()` and
the focused unit case `hydrates current bundle data before first render when the
full cached payload is stale`. Earlier hard reload proof reported
`window.__BUNDLE_WIDGET_VERSION__ === "5.0.19"`; the follow-up probe now reports
`window.__BUNDLE_WIDGET_VERSION__ === "5.0.20"` with the same Classic payload state.
The active widget stylesheets remain:

- `bundle-widget-full-page.css`
- `bundle-widget-full-page-classic.css`

No Standard stylesheet was active in the post-hydration runtime capture.

## WPB Source Delta

Classic desktop sidebar slots were rendered through the shared slot component as `.bw-selected-slot` elements inside `.classic-sidebar-slots`, but Classic CSS targeted older `.classic-sidebar-slot*` selectors. That meant Classic-specific square slot, dashed empty-slot, custom icon, and thumbnail rules did not apply to the actual DOM.

Source fix:

- `app/assets/widgets/full-page-css/templates/classic/desktop-sidebar.css` now scopes the Classic slot rules to `.fpb-preset-classic .classic-sidebar-slots .bw-selected-slot*`.
- Filled slots hide shared row copy and render thumbnail-only with the remove affordance over the thumbnail.
- Empty slots render the plus fallback or merchant `productSlotIconUrl` icon with Classic square/dashed treatment.
- `WIDGET_VERSION` bumped to `5.0.19`.

## Current Deltas

- EB and WPB both allowed selecting three products in this fixture after the second-stage/checkout state, despite the row's planned `Box of 2` over-max block expectation.
- WPB desktop Classic slot visuals now match the actual shared slot DOM: empty slots are 90.75px square dashed tiles and filled slots are thumbnail-only with visual copy hidden and a 22px remove affordance.
- WPB mobile footer uses the separate compact mobile tray. Because the live payload still has `productSlotsEnabled: false`, the tray renders skeleton rows instead of product-slot rows. This is fixture/runtime state, not a Classic CSS selector issue.
- WPB add-to-cart proof was contaminated by a pre-existing cart line (`beforeItemCount: 1`); the cart was cleared after capture. Re-capture clean cart proof after the fixture payload is corrected.
- The current Admin/business-logic flow is intentionally locked for this storefront loop, so no storefront-only implementation can fabricate missing product-slot or box-selection config. C04 remains open until a live fixture exposes the saved settings in the storefront payload.
