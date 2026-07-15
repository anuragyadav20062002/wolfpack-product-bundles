---
schema_version: 1
id: ppb-g05-subscriptions-no-common-plan-evidence
title: PPB Subscriptions No Common Plan Evidence
type: parity-evidence
status: active
summary: Documents the EB-captured PPB subscription state where no common selling plan exists, so no template-specific storefront subscription behavior is available to mirror.
last_audited: 2026-07-15
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
tags:
  - ppb
  - subscriptions
  - selling-plans
keywords:
  - G05
  - NO_SELLING_PLAN_GROUPS_FOUND
  - common selling plan
---

# PPB Subscriptions no-common-plan evidence

## Scope

G05 covers PPB bundle subscriptions: common-plan validation and selected subscription plan effects on storefront/cart behavior.

The current EB-captured PPB configuration has no common subscription plan across the bundle products. Because EB cannot select a plan in this state, there is no template-specific subscription storefront/cart behavior for Product List, Product Grid, Horizontal Slots, or Vertical Slots to mirror.

## Current EB check

On 2026-07-15, the EB PPB admin tab for `WPB PPB Product List Parity 2026-07-11` was opened to `Subscriptions` without changing the fixture. The section showed:

- `Bundle Subscriptions`
- `How to setup?`
- `Get Subscription Plans`
- Alert text: `To offer this bundle as a subscription, all of its products must be part of the same subscription plan in your Shopify settings. Please update your product selling plans and try again.`

This proves the current EB PPB fixture is in a no-common-plan state, with no selected subscription plan and no subscription storefront/cart path available for template replay.

## Existing direct audit evidence

The full PPB configure audit records the same subscription validation result:

- Request: `GET /api/mixAndMatch/syncSellingPlanGroups?shopName=yash-wolfpack.myshopify.com&offerId=MIX-519528`
- Response: `data.isValid: false`, `message: "NO_SELLING_PLAN_GROUPS_FOUND"`
- Alert explained that all bundle products must be part of the same subscription plan.

The same audit also records the help-contract facts:

- EB requires every product in the bundle to share the same subscription plan.
- If common plans exist, EB exposes subscription widget settings such as heading, description, one-time purchase option, default selection, and recurring discounts.

## Matrix resolution

All four G05 cells are terminal **E** for the current captured configuration:

- EB exposes the validation surface.
- EB has no selectable common plan in the captured/current PPB fixture.
- No selected subscription plan reaches the storefront/cart for any template.
- WPB should not invent a storefront subscription state for this matrix row without a matching EB common-plan fixture.

This does not close G04. Individual product selling-plan/pre-order selection is a separate integration path and remains unproven for product-card/cart payload behavior.
