# C04 Slots Box Validation Delta

## Status

`wpb-mobile-slot-card-proofed-desktop-css-proofed-validation-fixture-gated`

The EB C04 fixture was configured through the visible Admin UI and captured on
desktop and mobile. A current WPB storefront probe on
`window.__BUNDLE_WIDGET_VERSION__ === "5.0.32"` shows that the live WPB proxy
payload for `cmr361mz50000v00yrdeyxpf7` reports:

- `bundleDesignTemplate: "FBP_SIDE_FOOTER"`
- `bundleDesignPresetId: "CLASSIC"`
- `productSlotsEnabled: true`
- `productSlotIconUrl: null`
- `boxSelection.rules[0].boxLabel: "Box of 2"`
- `boxSelection.rules[0].boxSubtext: "$5 off"`
- `boxSelection.rules[0].boxQuantity: 2`
- `boxSelection.validateBoxSelectionQuantity: false`

Fresh proof:

- `reconfigure-check-bundle-api-20260704.json`
- `wpb-c04-5032-current-mobile-expanded-runtime-20260704.json`
- `admin-auth-stuck-20260704.json`

This means the storefront template proof is valid for Classic rendering and slot
CSS, but C04 cannot be marked complete as a full validation row. The active
bundle still carries the later C07 three-category fixture, and the visible
Shopify Admin path could not be used to restore the one-category C04 fixture in
this pass because the app iframe stayed on `/auth/session-token` after the
dev-tunnel restart. No DB shortcut was used.

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
- `eb-c04-current-desktop-runtime-20260704.json` and `eb-c04-current-desktop-20260704.png`: fresh EB desktop proof showing `FBP_SIDE_FOOTER + CLASSIC`, `Box of 2`, `₹5 off`, `validateBoxSelectionQuantity: false`, a `170 x 90` slot rail, and two `80 x 80` slots with no visible custom empty-slot icon/background.
- `reconfigure-check-bundle-api-20260704.json`: current WPB dev-tunnel proxy proof showing `FBP_SIDE_FOOTER + CLASSIC`, Product Slots enabled, `Box of 2`, `$5 off`, `validateBoxSelectionQuantity: false`, and the later C07 category set.
- `wpb-c04-5032-current-mobile-expanded-runtime-20260704.json` and `wpb-c04-5032-current-mobile-expanded-20260704.png`: current WPB mobile-width proof showing root `CLASSIC`, one filled `65 x 60` slot with a `65 x 80` image, one `65 x 60` dashed empty slot, and active `Box of 2` / `$5 off`.
- `admin-auth-stuck-20260704.json`: Shopify Admin proof that the dev-tunnel iframe remained on `/auth/session-token` and did not reach the configure form.

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
- Follow-up `5.0.32` narrows the Classic desktop sidebar rail to EB's current
  two-slot geometry: `inline-grid`, 5rem slot tracks, 0.625rem gap, explicit
  5rem slot width/height, and no broad/shared selector changes.

## Current Deltas

- EB and WPB both emit `validateBoxSelectionQuantity: false` in the current storefront payloads, so the planned under-min/exact-max/over-max blocking expectation remains unproved by this fixture.
- Current EB desktop evidence shows two `80 x 80` Classic slots in a `170 x 90` rail. WPB `5.0.32` source and generated Classic CSS now use a 5rem Classic-only desktop sidebar rail. Fresh desktop browser proof is still pending because the available Chrome DevTools MCP viewport stayed below the desktop breakpoint in this pass.
- Current WPB mobile-width proof shows the Classic slot tray rendering the same mobile slot geometry previously matched to EB: a `65 x 60` filled slot with a `65 x 80` image and a `65 x 60` dashed empty slot.
- The active WPB fixture still has the C07 category set. The Admin iframe blocker prevents restoring the one-category C04 fixture through the approved UI path in this pass.
- The current Admin/business-logic flow is intentionally locked for this storefront loop, so no storefront-only implementation can fabricate missing validation behavior. C04 remains open until live Admin reconfiguration and validation proof are available.
