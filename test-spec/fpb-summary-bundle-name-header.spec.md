---
schema_version: 1
id: fpb-summary-bundle-name-header
title: FPB Summary Configured Header Text
type: test-spec
status: active
summary: Verifies FPB storefront summary copy and accessible selected-product removal labels.
last_audited: 2026-07-20
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - full-page-bundle-widget
source_paths:
  - app/assets/widgets/full-page/methods/mobile-summary-methods.js
  - app/assets/widgets/full-page/methods/side-panel-methods.js
related_docs:
  - docs/competitor-analysis/fpb-feature-to-storefront-matrix.md
tags:
  - fpb
  - summary
  - parity
keywords:
  - bundle summary title
  - bundleTextConfig
---

# Test Spec: FPB Summary Configured Header Text

**Spec ID:** fpb-summary-bundle-name-header  **Created:** 2026-07-06

## Purpose
Verify storefront summary headers use the directly saved
`bundleTextConfig.bundleSummary` title and fall back to the bundle name only
when the configured title is empty. Verify icon-only summary removal controls
receive an action-oriented accessible name derived from the displayed product.

## Test Cases
### SummaryHeaderText
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Desktop summary sidebar title | FPB bundle named `Daily Essentials` with saved summary title `Daily kit` | Summary title renders `Daily kit` | Behaviour only; no CSS assertion |
| 2 | Mobile footer expanded title | FPB bundle named `Daily Essentials` with saved summary title `Daily kit` | Expanded summary title renders `Daily kit` | Behaviour only; no CSS assertion |
| 3 | Empty configured title | FPB bundle named `Daily Essentials` with an empty summary title | Summary resolver returns `Daily Essentials` | Prevents blank title without fabricated copy |

### SummaryRemovalAccessibility

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Named selected product | Display title `14k Dangling Pendant Earrings` | Removal label is `Delete 14k Dangling Pendant Earrings` | Matches the existing desktop removal contract |
| 2 | Missing selected-product title | Empty display title | Removal label is `Delete product` | Keeps the icon-only button named |

## Acceptance Criteria
- [x] Saved summary title wins over the bundle name on desktop and mobile.
- [x] Empty saved summary title falls back to the bundle name.
- [x] Desktop and mobile icon-only removal controls use the same accessible label contract.
- [x] All listed test cases pass.
