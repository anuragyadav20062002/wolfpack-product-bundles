# PL02 Step Rules EB Fixture Evidence

Date: 2026-07-12

Scope: Product Page Bundle Product List only (`PDP_INPAGE` + `CASCADE`).

Evidence files:
- EB admin snapshot before rule edit: `/private/tmp/ppb-product-list-agentic-parity/eb-configure-after-reconnect.txt`
- EB admin after selecting Step rules: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-rules-after-label-click.txt`
- EB admin rule fields: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-rule-fields.txt`
- EB admin after Add Step attempt: `/private/tmp/ppb-product-list-agentic-parity/PL02-after-add-step.txt`
- EB update request: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-rules-eb-update.request.network-request`
- EB update response: `/private/tmp/ppb-product-list-agentic-parity/PL02-step-rules-eb-update.response.network-response`
- EB desktop initial runtime: `/private/tmp/ppb-product-list-agentic-parity/PL02-eb-desktop-runtime-initial.json`
- EB desktop one-item footer DOM: `/private/tmp/ppb-product-list-agentic-parity/PL02-eb-desktop-clickable-elements.json`
- EB desktop two-item snapshot: `/private/tmp/ppb-product-list-agentic-parity/PL02-eb-desktop-two-items.snapshot.txt`
- EB desktop two-item state: `/private/tmp/ppb-product-list-agentic-parity/PL02-eb-desktop-two-items-state.json`
- EB desktop valid add and cart clear: `/private/tmp/ppb-product-list-agentic-parity/PL02-eb-desktop-cart-after-valid-add-and-clear.json`
- EB mobile one-item state: `/private/tmp/ppb-product-list-agentic-parity/PL02-eb-mobile-one-item-disabled-state.json`
- EB mobile two-item state: `/private/tmp/ppb-product-list-agentic-parity/PL02-eb-mobile-two-items-enabled-state.json`
- WPB admin post-save snapshot: `/private/tmp/ppb-product-list-agentic-parity/PL02-wpb-cmrf-post-save-check.txt`
- WPB admin save request: `/private/tmp/ppb-product-list-agentic-parity/PL02-wpb-cmrf-save.request.network-request`
- WPB admin save response: `/private/tmp/ppb-product-list-agentic-parity/PL02-wpb-cmrf-save.response.network-response`
- WPB desktop runtime config: `/private/tmp/ppb-product-list-agentic-parity/PL02-wpb-desktop-runtime-config.json`
- WPB desktop one-item state: `/private/tmp/ppb-product-list-agentic-parity/PL02-wpb-desktop-one-item-state.json`
- WPB desktop two-item state: `/private/tmp/ppb-product-list-agentic-parity/PL02-wpb-desktop-two-item-state.json`
- WPB mobile step-rule states: `/private/tmp/ppb-product-list-agentic-parity/PL02-wpb-mobile-step-rule-states.json`

## Admin Fixture

EB bundle:
- Store: `yash-wolfpack.myshopify.com`
- Offer: `MIX-156854`
- Template: `PDP_INPAGE`
- Template ID: `CASCADE`
- Bundle product: `WPB PPB Product List Parity 2026-07-11`

Configured Step 1 rule:

```json
{
  "conditions": {
    "isEnabled": true,
    "rules": [
      { "type": "quantity", "condition": "greaterThanOrEqualTo", "value": "02" }
    ]
  }
}
```

The EB admin exposes Step rules for PPB Product List with:
- metric combobox: `Quantity`, `Amount`
- operator combobox: `is less than or equal to`, `is greater than or equal to`, `is equal to`
- numeric spinbutton

Interaction note: direct clicking the radio uid failed in the Chrome DevTools MCP accessibility tree, but clicking the adjacent `Step rules` label selected the radio and exposed `Add Rule`.

## Desktop Source Of Truth

One selected item:
- Footer text: `Add Bundle to Cart • ₹829`
- Footer class includes `gbbMixCascadeAddToCartBtn--disabled-conditionsNotMet`
- `pointer-events: none`
- `opacity: 0.5`
- Cart after click attempt remained empty.

Two selected items:
- Selected products: `14k Dangling Obsidian Earrings x 1`, `14k Dangling Pendant Earrings x 1`
- Footer text: `Add Bundle to Cart • ₹1448`
- Footer class: `gbbMixCascadeAddToCartBtn gbbMixCascadeAddToCartBtnV2`
- `pointer-events: auto`
- `opacity: 1`
- Add-to-cart succeeded.
- Cart line after valid add:

```json
{
  "title": "WPB PPB Product List Parity 2026-07-11",
  "quantity": 1,
  "properties": {
    "_EasyBundleId": "MIX-156854",
    "_originalOfferId": "MIX-156854_AFH",
    "Box": "1",
    "Items": "1 x 14k Dangling Obsidian Earrings, 1 x 14k Dangling Pendant Earrings"
  },
  "final_price": 144800
}
```

The cart was cleared immediately after this proof.

## Mobile Source Of Truth

Viewport: `390x844`, DPR `3`.

One selected item:
- Footer class includes `gbbMixCascadeAddToCartBtn--disabled-conditionsNotMet`
- Footer text: `Add Bundle to Cart • ₹829`
- `pointer-events: none`
- `opacity: 0.5`

Two selected items:
- Footer class: `gbbMixCascadeAddToCartBtn gbbMixCascadeAddToCartBtnV2`
- Footer text: `Add Bundle to Cart • ₹1448`
- `pointer-events: auto`
- `opacity: 1`

## Remaining Fixture Gap

The Add Step button did not create a visible second step during this pass; it surfaced the sticky EB `Save` bar while preserving the Step 1 rule. PL02 now has live single-step step-rule gating proof, but still needs a separate EB fixture pass for true multi-step next/back behavior.

## WPB Mirror Proof

WPB bundle:
- Store: `agent-5sfidg3m.myshopify.com`
- App: `wolfpack-product-bundles-sit`
- Bundle id: `cmrf19c8d0000v0xpj8rz2wgh`
- Product: `PPB Modal Shared Card Test`
- Widget version: `5.0.136`
- Runtime markers: `data-ppb-template-type="PDP_INPAGE"`, `data-ppb-design-preset="CASCADE"`

Configured Step 1 rule:

```json
{
  "stepConditions": {
    "69281805-aff6-4219-a5a6-7f6d187d2a87": [
      { "type": "quantity", "operator": "greater_than_or_equal_to", "value": "2" }
    ]
  }
}
```

The cache-busted runtime config returned:

```json
{
  "conditionType": "quantity",
  "conditionOperator": "greater_than_or_equal_to",
  "conditionValue": 2
}
```

Desktop WPB result:
- Zero selected items: footer text `Add Bundle to Cart`, class `add-bundle-to-cart disabled`, disabled `true`.
- One selected item: selected row `14k Dangling Obsidian Earrings x 1`; footer text `Complete All Steps to Continue`, class `add-bundle-to-cart disabled`, disabled `true`.
- Two selected items: selected rows `14k Dangling Obsidian Earrings x 1`, `14k Dangling Pendant Earrings x 1`; footer text `Add Bundle to Cart • $1448.00`, class `add-bundle-to-cart`, disabled `false`.

Mobile WPB result:
- Viewport: `390x745`, DPR `2`.
- Zero selected items: footer text `Add Bundle to Cart`, class `add-bundle-to-cart disabled`, disabled `true`.
- One selected item: footer text `Complete All Steps to Continue`, class `add-bundle-to-cart disabled`, disabled `true`.
- Two selected items: footer text `Add Bundle to Cart • $1448.00`, class `add-bundle-to-cart`, disabled `false`.

## Decision

No Product List source patch is justified for the single-step quantity rule state. WPB matches EB's gating sequence on desktop and mobile: one selected product blocks the footer, and two selected products enables it with the selected-items total.
