---
schema_version: 1
id: ppb-deferred-functional-parity
title: Product Page Bundle Deferred Functional Parity
type: test-spec
status: active
summary: Verifies every Product Page Bundle feature matrix cell previously marked shared or not tested.
last_audited: 2026-07-14
owners:
  - engineering
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/widgets/product-page
  - app/assets/bundle-widget-product-page.js
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
tags:
  - ppb
  - functional-parity
keywords:
  - feature storefront matrix
  - deferred permutations
---

# Test Spec: Product Page Bundle Deferred Functional Parity

**Spec ID:** ppb-deferred-functional-parity  **Created:** 2026-07-14

## Purpose

Close every Product Page Bundle feature-to-storefront matrix cell currently marked shared/partial (`S`) or not tested (`T`) with direct template-specific evidence, a documented inapplicability/divergence, or a tested implementation fix.

## Test Cases

### DeferredFunctionalParity

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Data and category permutations | Empty, collection, mixed, amount, weight, category-as-step, auto-next, banner, variant, and pagination configurations | Every applicable template preserves products, selection, validation, ordering, and navigation | Covers deferred R/C rows |
| 2 | Slot permutations | Alternate slot count, filled-slot layout, and condition-driven rendering settings | Horizontal and Vertical Slots follow each saved control without leakage | Covers M10-M12 |
| 3 | Discount permutations | Disabled, fixed amount, fixed bundle price, Buy X Get Y, amount thresholds, and quantity options | Display, progress, totals, validation, and cart allocations agree | Covers deferred D rows |
| 4 | Selection and cart permutations | Defaults, hard reload, valid/blocked cart, quantity limits, pagination, and dynamic checkout | State and cart mutations follow the saved contract for each template | Covers deferred S rows |
| 5 | Bundle integration permutations | Visibility, browsed product, upsell, subscription, selling plan, inactive status, inventory, redirect, embed, and placement controls | The correct PPB context mounts and reaches the expected cart or navigation result | Covers G01-G08 and G22-G39 |
| 6 | Global design and language permutations | Price, compare-at, swatch, condition, card, CTA, animation, summary, locale, colors, typography, corners, media, and CSS settings | Each saved value affects only its owner surface across all applicable templates | Covers G09-G21 and G25-G37 |
| 7 | Accessibility and runtime health | Keyboard traversal, modal focus behavior, request health, and computed typography sweep | Core controls remain keyboard reachable and no unexplained app-owned errors or theme leakage occur | Covers Q05-Q07 |
| 8 | Four-template regression | Product List, Product Grid, Horizontal Slots, and Vertical Slots at desktop and mobile after all changes | Existing selection, validation, discount, modal, and responsive behavior remains green | Cache Storage cleared and cache bypassed before each evidence pass |
| 9 | Product descriptions stay hidden | Products with populated plain-text and HTML descriptions in every PPB template | Product cards, rows, slots, and selected-item surfaces never render merchant product descriptions or description controls | Product detail data may remain available to non-card consumers |
| 10 | Selected cards have no tick badges | Select and deselect products in every PPB template | Quantity controls, selected styling, and totals update without rendering a checkmark overlay on any card or selected item | Stale overlays are removed during an in-place quantity update |
| 11 | Loaded empty category-step terminates loading | Advance from a populated category-step into a category-step whose product load resolves empty | The empty-state message renders after one request; the renderer does not recursively reload or freeze the storefront | Covers R07 with an empty category |
| 12 | Modal slot keyboard controls | Render empty and filled Horizontal/Vertical slot cards, then activate the filled card with Enter and Space | Empty slots and remove actions are labelled native controls; filled slots reopen from either activation key | Covers Q05 for both modal templates |
| 13 | Responsive modal focus lifecycle | Open a modal where the desktop close control is breakpoint-hidden and the mobile close control is visible, then close it after the main slots rerender | Initial focus skips the hidden control, lands on the visible close control, and focus returns to the opener after the slot rerender | Covers mobile Q05 focus behavior |

## Acceptance Criteria

- [ ] No `S` or `T` cells remain in the Product Page Bundle feature-to-storefront matrix.
- [ ] Every promoted cell links durable evidence or focused automated coverage.
- [ ] Every discovered defect has a failing test written before its implementation fix.
- [ ] All four PPB templates pass direct Chrome DevTools verification at `1280x800` and `390x844` after hard refresh.
- [ ] App-owned console and network failures are resolved or explicitly documented.
- [ ] Scoped ESLint, raw widget syntax checks, widget builds, focused tests, and Graphify rebuild pass.
