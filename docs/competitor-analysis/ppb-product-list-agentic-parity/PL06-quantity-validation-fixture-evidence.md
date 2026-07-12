# PL06 Quantity Validation Fixture Evidence

Date: 2026-07-12

Scope: Product Page Bundle Product List only (`PDP_INPAGE` + `CASCADE`).

Evidence files:
- EB desktop runtime: `/private/tmp/ppb-product-list-agentic-parity/PL06-quantity-validation/eb-desktop-runtime.json`
- EB desktop config drill: `/private/tmp/ppb-product-list-agentic-parity/PL06-quantity-validation/eb-desktop-config-drill.json`
- WPB desktop runtime: `/private/tmp/ppb-product-list-agentic-parity/PL06-quantity-validation/wpb-desktop-runtime.json`
- WPB desktop config drill: `/private/tmp/ppb-product-list-agentic-parity/PL06-quantity-validation/wpb-desktop-config-drill.json`
- EB mobile runtime: `/private/tmp/ppb-product-list-agentic-parity/PL06-quantity-validation/eb-mobile-runtime.json`
- WPB mobile runtime: `/private/tmp/ppb-product-list-agentic-parity/PL06-quantity-validation/wpb-mobile-runtime.json`

## State Tested

1. Inspect current EB Product List fixture runtime config.
2. Inspect current WPB Product List fixture runtime markers and DOM.
3. Check desktop and mobile for quantity-option or box-selection UI.
4. Confirm whether the current fixture can exercise under-target, exact-target, and over-target validation states.

## EB Source Of Truth

Current EB fixture:
- Template: `PDP_INPAGE + CASCADE`.
- `boxSelection.isEnabled`: `false`.
- `boxSelection.validateBoxSelectionQuantity`: `false`.
- Default rule is a non-actionable fallback: `boxQuantity: 9007199254740991`.
- Quantity-option wrapper count: `0`.

Mobile confirms the same configuration:
- Template: `PDP_INPAGE + CASCADE`.
- `boxSelection.isEnabled`: `false`.
- `boxSelection.validateBoxSelectionQuantity`: `false`.
- `.gbbMixQuantityOptionsWrapper` count: `0`.

## WPB Current Result

Desktop, widget `5.0.136`:
- Runtime marker: `data-ppb-template-type="PDP_INPAGE"`.
- Runtime marker: `data-ppb-design-preset="CASCADE"`.
- `.bundle-quantity-options` count: `0`.
- No box-selection DOM is present.

Mobile, widget `5.0.136`:
- Runtime marker: `data-ppb-template-type="PDP_INPAGE"`.
- Runtime marker: `data-ppb-design-preset="CASCADE"`.
- `.bundle-quantity-options` count: `0`.
- No box-selection DOM is present.

## Decision

No Product List source patch is justified from this capture. The current EB fixture has quantity validation disabled, so it cannot prove the PL06 states required by the spec: validation disabled, exact target, under target, and over target.

Existing behavior coverage is in `test-spec/ppb-product-list-box-selection-validation.spec.md` and `tests/unit/assets/ppb-product-list-cart-display-metadata.test.ts`, which cover the runtime exact-quantity validation contract. That is useful code coverage, but it is not storefront parity proof for the live Product List fixture.

Next fixture requirement:
- Configure EB Product List with quantity options and `validateBoxSelectionQuantity` enabled.
- Mirror the same Product List fixture in WPB.
- Capture desktop and mobile for disabled validation, exact target, under target, and over target.
- Verify the visible quantity-option UI, add-to-cart blocking behavior, toast copy, and cart network suppression before patching runtime code.

## 2026-07-13 EB Admin Recheck

Chrome DevTools MCP was used for all browser evidence.

Evidence files:
- EB storefront runtime before admin recheck: `/private/tmp/ppb-product-list-agentic-parity/PL06-quantity-validation/eb-current-runtime-before-admin-2026-07-13.json`
- EB admin Step Setup snapshot: `/private/tmp/ppb-product-list-agentic-parity/PL06-quantity-validation/eb-admin-current-snapshot-before-quantity-2026-07-13.txt`
- EB admin Discount & Pricing quantity-options blocked snapshot: `/private/tmp/ppb-product-list-agentic-parity/PL06-quantity-validation/eb-admin-quantity-options-toggle-blocked-2026-07-13.txt`
- EB validation save request: `/private/tmp/ppb-product-list-agentic-parity/PL06-quantity-validation/eb-validation-save.request.network-request`
- EB validation save response: `/private/tmp/ppb-product-list-agentic-parity/PL06-quantity-validation/eb-validation-save.response.network-response`
- EB storefront runtime after validation save: `/private/tmp/ppb-product-list-agentic-parity/PL06-quantity-validation/eb-runtime-after-validation-save-2026-07-13.json`

Observed EB Admin state:
- Discount & Pricing still had quantity-based percentage discount rules at quantity `2` and `3`.
- The `Bundle Quantity Options` checkbox was visible but remained unchecked. Direct checkbox click, wrapper click, Space, Enter, and form fill did not toggle it during the MCP pass.
- Bundle Settings exposed `Enable Quantity Validation`. Clicking the checkbox wrapper changed the Admin accessibility tree to `checked` and enabled the `Maximum allowed quantity per product` spinbutton.
- Saving produced a successful `POST /api/mixAndMatch/update?shopName=yash-wolfpack.myshopify.com&offerId=MIX-156854` with status `200`.

Saved EB payload result:
- The save request and response still contained `boxSelection.isEnabled: false`.
- The save request and response still contained `boxSelection.validateBoxSelectionQuantity: false`.
- The `boxSelection.rules` array did contain quantity tiers for `2` and `3`, but EB did not enable the selector or strict validation flags.

Storefront runtime after hard reload:
- Template remained `PDP_INPAGE + CASCADE`.
- Runtime `boxSelection.isEnabled` remained `false`.
- Runtime `boxSelection.validateBoxSelectionQuantity` remained `false`.
- Quantity-option wrapper count remained `0`.

Decision:
- PL06 remains blocked at the EB fixture layer, not by WPB runtime code.
- Do not implement a Product List source patch from the Admin checkbox alone. The authoritative EB payload and storefront runtime do not currently prove enabled quantity-option UI or strict validation behavior for PPB Product List.
- The next PL06 attempt needs a reliable way to make EB persist `boxSelection.isEnabled: true` and `boxSelection.validateBoxSelectionQuantity: true`, or a separate EB fixture that already emits those runtime flags.
