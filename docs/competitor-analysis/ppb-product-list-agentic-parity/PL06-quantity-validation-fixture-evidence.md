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
