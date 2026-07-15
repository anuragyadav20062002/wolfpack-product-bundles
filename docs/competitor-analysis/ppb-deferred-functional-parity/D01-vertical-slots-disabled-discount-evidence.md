---
schema_version: 1
id: d01-vertical-slots-disabled-discount-evidence
title: D01 Vertical Slots Disabled Discount Evidence
type: evidence
status: final
summary: Confirms disabled discount behavior for PPB Vertical Slots with retained discount rules on EB and WPB desktop and mobile.
last_audited: 2026-07-16
owners:
  - product
domains:
  - competitor-analysis
systems:
  - ppb-storefront
source_paths:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
related_docs: []
tags:
  - ppb
  - discounts
  - vertical-slots
keywords:
  - D01
  - disabled-discount
  - Vertical Slots
---

# D01 Vertical Slots Disabled Discount Evidence

## Scope

Proves D01 for the Vertical Slots PPB template: when discounts are disabled but discount rules remain persisted, the storefront shows original totals and does not leak discount/progress messaging.

## EB evidence

- Fixture: EB PPB parity bundle `WPB PPB Product List Parity 2026-07-11` switched to Vertical Slots (`PDP_MODAL` + `SIMPLIFIED`) with discount disabled while quantity discount rules remained saved.
- Desktop hard reload with cache cleared showed runtime attributes `gbbmix-template-id="SIMPLIFIED"` and `gbbmix-template-type="PDP_MODAL"`.
- EB runtime/config showed discount disabled (`isDiscountEnabled=false`, `isShowDiscountsEnabled=false`) while saved rules remained `Quantity >= 2 => 5%` and `Quantity >= 3 => 10%`.
- After selecting two products in Step 1 and one product in Step 2, visible selected/summary text showed product prices and selected items only. No discount success, progress, or remaining-discount copy appeared.
- Mobile hard reload with cache cleared at `390x844x3` showed the same disabled-discount state and no horizontal overflow.

## WPB evidence

- Fixture: WPB bundle `cmrf19c8d0000v0xpj8rz2wgh` temporarily set `BundlePricing.enabled=false` while preserving the existing percentage rules and messages.
- Desktop hard reload with cache cleared showed runtime version `5.0.187`, `wpbmix-template-id="SIMPLIFIED"`, `wpbmix-template-type="PDP_MODAL"`, `data-ppb-template-type="PDP_MODAL"`, `data-ppb-design-preset="SIMPLIFIED"`, and `data-ppb-slot-orientation="vertical"`.
- Direct bundle API/config read showed pricing `enabled:false`, method `percentage_off`, retained rules, and retained messages.
- After selecting two Category 1 products, the modal/footer totals showed original pricing only: `Add Bundle to Cart • $1448.00` and footer `$1448.00 2 Done`.
- No discount/progress messaging was present on desktop or mobile, and both viewports had no horizontal overflow.

## Restore proof

- WPB pricing was restored to `BundlePricing.enabled=true` with the preserved rules.
- EB discount was restored through the Admin keyboard path; the discount checkbox and Discount Messaging checkbox returned checked with the same two rules retained, then the Shopify save bar returned `Saved Successfully!`.
- EB template was restored through a fresh Admin configure session using keyboard activation in the template overlay. Product Grid became selected, `Next` completed, and the overlay advanced to `Your bundle is ready`.
- EB storefront baseline was hard-reloaded with cache cleared on desktop and mobile. Both returned `gbbmix-template-id="COGNIVE"` and `gbbmix-template-type="PDP_INPAGE"` with discount prompt `Add 2 product(s) to save 5%!`, proving the temporary Vertical Slots/disabled-discount fixture was not left active.

## Matrix result

D01 Vertical Slots is terminal **P**.
