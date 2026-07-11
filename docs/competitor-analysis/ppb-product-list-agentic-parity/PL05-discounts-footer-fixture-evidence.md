# PL05 Discount Footer Fixture Evidence

Date: 2026-07-12

Scope: Product Page Bundle Product List only (`PDP_INPAGE` + `CASCADE`).

Evidence files:
- EB desktop: `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/eb-desktop-discount-footer-state.json`
- WPB desktop: `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/wpb-desktop-discount-footer-state.json`
- EB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/eb-mobile-discount-footer-state.json`
- WPB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/wpb-mobile-discount-footer-state.json`

## State Tested

1. Clear storefront state.
2. Reload EB and WPB Product List storefront pages.
3. Capture footer, add-to-cart button, and body discount-related text before selecting an item.
4. Select the first Product List row.
5. Capture the same footer/button/text state again.

## EB Source Of Truth

Desktop:
- Before selection: Add Bundle button text is `Add Bundle to Cart`; button class contains `gbbMixCascadeAddToCartBtn--disabled`; opacity is `0.5`; button background is black.
- After one selection: Add Bundle button text is `Add Bundle to Cart • ₹829`; button opacity is `1`; button background remains black.
- Footer candidates include a hidden `You're saving ₹0` node and visible subtotal values of `₹0` before selection and `₹829` after selection.

Mobile:
- Before selection: Add Bundle button text is `Add Bundle to Cart`; button class contains `gbbMixCascadeAddToCartBtn--disabled`; opacity is `0.5`; button width is `337px`; height is `37.59375px`.
- After one selection: Add Bundle button text is `Add Bundle to Cart • ₹829`; button opacity is `1`.
- Footer candidates again include a hidden `You're saving ₹0` node.

## WPB Current Result

Desktop, widget `5.0.136`:
- Before selection: Add Bundle button text is `Add Bundle to Cart`; button class is `add-bundle-to-cart disabled`; button background is disabled gray.
- After one selection: Add Bundle button text is `Add Bundle to Cart • $829.00`; button background is black.
- Product row selected state changes from `Add +` to quantity controls.

Mobile, widget `5.0.136`:
- Before selection: Add Bundle button text is `Add Bundle to Cart`; button class is `add-bundle-to-cart disabled`; button width is `339px`; height is `38px`.
- After one selection: Add Bundle button text is `Add Bundle to Cart • $829.00`; button background is black.
- Footer candidates contain no real savings/progress copy in this fixture.

## Decision

No Product List source patch is justified from this capture. The fixture currently proves the disabled-to-enabled footer state and total-price button transition, but it does not exercise a real discount progress or success state.

The earlier PL05 implementation note in `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/delta.md` covers tier-rule message logic and focused unit coverage. This storefront fixture still needs to be upgraded with real percentage, fixed-amount, or fixed-price discount permutations before visual footer parity for savings/progress copy can be accepted as complete.

Next fixture requirement:
- Configure EB and WPB with a Product List PPB that has a qualifying first tier and an unmet next tier.
- Capture empty, partially qualified, and fully qualified states on desktop and mobile.
- Only patch runtime code if EB/WPB diverge in the same configured discount state.
