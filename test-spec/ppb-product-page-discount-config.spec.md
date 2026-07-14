---
schema_version: 1
id: ppb-product-page-discount-config
title: PPB Product Page Discount Messaging Config Parity
type: test-spec
status: active
summary: Verify PPB footer discount messaging toggles, templates, and stepped milestone rendering.
last_audited: 2026-07-14
owners:
  - engineering
domains:
  - storefront
systems:
  - product-page-widget
source_paths:
  - app/assets/widgets/product-page/methods/footer-modal-state-methods.js
  - tests/unit/assets/ppb-product-page-footer-discount-messaging-toggle.test.ts
related_docs: []
tags:
  - tdd
  - discount-messaging
keywords:
  - step_based
  - discount milestones
---

# Test Spec: PPB Product Page Discount Messaging Config Parity
**Spec ID:** ppb-product-page-discount-config  **Created:** 2026-07-13

## Purpose
Verify PPB Product Page discount messaging follows bundle-side toggles and messaging defaults before claiming discount/config parity in the matrix.

## Test Cases
### ProductPageFooter
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Merchant disables discount messaging | `config.showDiscountMessaging = false` | Footer discount area is hidden and no discount message/inline progress markup is injected | Covers D08 control path |
| 2 | Discount messaging enabled | `config.showDiscountMessaging = true` and one discount rule configured | Footer includes discount progress markup and messaging classes | Sanity for enabled state |
| 3 | Progress bar disabled | `selectedBundle.messaging.progressBar.enabled = false` | Footer remains hidden | Guard for progress-visibility interaction |
| 4 | Progress bar mode: simple | `selectedBundle.messaging.progressBar.type = "simple"` | Footer renders bar mode with message and no milestone list classes | Verifies D10 simple mode render |
| 5 | Progress bar mode: step based | `selectedBundle.messaging.progressBar.type = "step_based"` | Footer renders stepped mode milestones from sorted rules | Verifies D10 step_based mode render |
| 6 | Bundle messaging toggle explicit off | `selectedBundle.messaging.showDiscountMessaging = false` during config lifecycle merge | `config.showDiscountMessaging` remains false after merge | Prevents fallback override from silently re-enabling |
| 7 | Missing messaging config | `selectedBundle` has pricing enabled but no messaging block | `config.showDiscountMessaging` defaults true to preserve legacy progress behavior | Backward-compatible default |
| 8 | Locale-specific discount template mapping | `pricing.messages.ruleMessagesByLocale` has active locale entry | Footer resolves message from matching locale instead of default | Verifies D12 |
| 9 | Locale fallback for missing locale | `ruleMessagesByLocale` lacks active locale | Footer falls back to default `ruleMessages` for active locale | Verifies D12 |

## Acceptance Criteria
- [x] Product Page footer discount messaging is hidden when the toggle is false.
- [x] Discount message and progress UI render when toggle is true and rules exist.
- [x] Product Page config lifecycle preserves explicit bundle messaging toggles.
- [x] Legacy fallback keeps discount messaging enabled when pricing is enabled and messaging payload is absent.
