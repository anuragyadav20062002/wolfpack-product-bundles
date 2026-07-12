# PL05 Discount Footer Fixture Evidence

Date: 2026-07-12

Scope: Product Page Bundle Product List only (`PDP_INPAGE` + `CASCADE`).

Evidence files:
- EB desktop: `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/eb-desktop-discount-footer-state.json`
- WPB desktop: `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/wpb-desktop-discount-footer-state.json`
- EB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/eb-mobile-discount-footer-state.json`
- WPB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/wpb-mobile-discount-footer-state.json`
- EB admin configured snapshot: `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/eb-admin-discount-configured.txt`
- EB save request: `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/eb-discount-save.request.network-request`
- EB save response: `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/eb-discount-save.response.network-response`
- EB desktop discount tiers: `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/eb-storefront-empty-desktop.txt`, `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/eb-storefront-one-selected-desktop.txt`, `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/eb-storefront-two-selected-desktop.txt`, `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/eb-storefront-three-selected-desktop.txt`
- EB mobile discount tiers: `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/eb-storefront-empty-mobile.txt`, `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/eb-storefront-one-selected-mobile.txt`, `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/eb-storefront-two-selected-mobile.txt`, `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/eb-storefront-three-selected-mobile.txt`
- WPB current empty desktop before mirror: `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/wpb-storefront-empty-desktop-before.txt`
- WPB admin document payload: `/private/tmp/ppb-product-list-agentic-parity/PL05-discounts-footer/wpb-admin-config-document.response.network-response`

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

## 2026-07-12 EB Discount Tier Fixture

Chrome DevTools MCP was used for all browser evidence.

EB Product List fixture `WPB PPB Product List Parity 2026-07-11` was configured in Discount & Pricing with:
- Discount enabled.
- Discount Type: `Percentage Off`.
- Rule #1: quantity greater than or equal to `2`, percentage off `5`.
- Rule #2: quantity greater than or equal to `3`, percentage off `10`.
- Discount Messaging enabled with default EB messages.
- Progress Bar remained unchecked. The EB admin exposed a focusable Progress Bar wrapper, but the checkbox itself did not toggle through direct click, form fill, Space, or Enter during the MCP run.

The save request persisted through `POST https://prod.backend.giftbox.giftkart.app/api/mixAndMatch/update?shopName=yash-wolfpack.myshopify.com&offerId=MIX-156854` with status `200`.

## EB Storefront Discount Behaviour

Desktop and mobile matched semantically:
- Empty selection: footer message `Add 2 product(s) to save 5%!`; add-to-cart remains present without a selected total.
- One selected product: drawer opens automatically and message becomes `Add 1 product(s) to save 5%!`; add-to-cart shows the selected total.
- Two selected products: first tier applies; footer shows discounted total, compare-at total, `5% off`, and next-tier copy `Congrats! Add 1 more product(s) to save 10%!`.
- Three selected products: second tier applies; footer shows discounted total, compare-at total, `10% off`, and success copy `Success! Your 10% discount has been applied to your cart.`

Observed desktop values:
- Two products: `₹1375.60`, compare-at `₹1448`, `5% off`.
- Three products: `₹1599.30`, compare-at `₹1777`, `10% off`.

## WPB Fixture Status

WPB SIT fixture `cmrf19c8d0000v0xpj8rz2wgh` currently has pricing rules present in the loader payload but `rules: []` and `enabled: false`. The empty desktop storefront capture therefore has no discount message and is not yet comparable against the EB discount-tier fixture.

Attempted WPB admin fixture mirroring through Chrome DevTools MCP:
- Opened embedded admin URL: `https://admin.shopify.com/store/agent-5sfidg3m/apps/wolfpack-product-bundles-sit/app/bundles/product-page-bundle/configure/cmrf19c8d0000v0xpj8rz2wgh`.
- Opened `Discount & Pricing None`.
- Tried `click`, `doubleClick`, `fill_form`, and single `fill` on the `Enable discount pricing` `s-switch` exposed as an accessibility checkbox.
- The accessibility tree continued to show the switch unchecked and no rule fields rendered.
- Direct app frame navigation redirected to Shopify session-token auth and did not resolve back into the app.
- Admin-page `fetch` to the app frame URL failed due CORS, so no browser-context POST was attempted.

Decision: do not mutate the WPB fixture outside the app UI in this MCP-only pass. The next step is either:
- manually enable WPB Discount & Pricing in the admin UI, then resume Chrome MCP storefront comparison, or
- explicitly approve a non-UI fixture update path that uses the app save contract or database mutation for the SIT fixture only.
