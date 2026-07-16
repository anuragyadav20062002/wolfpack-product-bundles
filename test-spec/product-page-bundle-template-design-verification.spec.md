---
schema_version: 1
id: product-page-bundle-template-design-verification
title: Product Page Bundle Template Design Verification
type: test-spec
status: active
summary: Verifies all Product Page Bundle designs and prevents empty Shopify HTML descriptions from rendering as product-card text.
last_audited: 2026-07-14
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/widgets/product-page/methods/inpage-render-methods.js
  - app/assets/widgets/product-page/methods/modal-methods.js
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
tags:
  - ppb
  - storefront
  - templates
keywords:
  - Product List
  - Product Grid
  - Horizontal Slots
  - Vertical Slots
---

# Test Spec: Product Page Bundle Template Design Verification

**Spec ID:** product-page-bundle-template-design-verification

**Created:** 2026-07-14

## Purpose

Verify the four PPB storefront designs after a cache-bypassed reload at desktop and mobile viewports, and ensure empty Shopify description markup never appears as literal product-card text.

## Test Cases

### ProductPageBundleTemplateDesigns

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Product List | `PDP_INPAGE + CASCADE` at 1280x800 and 390x844 | List rows, categories, selection drawer, discount progress, and step navigation work without horizontal overflow | Direct Chrome evidence |
| 2 | Product Grid | `PDP_INPAGE + COGNIVE` at 1280x800 and 390x844 | Grid cards, category switching, validation toast, and step flow work without horizontal overflow | Direct Chrome evidence |
| 3 | Horizontal Slots | `PDP_MODAL + MODAL` at 1280x800 and 390x844 | Horizontal slots open the picker, accept products, update totals, and preserve incomplete-step enforcement | Direct Chrome evidence |
| 4 | Vertical Slots | `PDP_MODAL + SIMPLIFIED` at 1280x800 and 390x844 | Vertical slots open the picker, accept products, update totals, and preserve incomplete-step enforcement | Direct Chrome evidence |
| 5 | Empty description HTML | Product with empty plain description and `descriptionHtml: '<p></p>'` | No description container or literal markup is rendered | Automated behavior test |

## Acceptance Criteria

- [x] All four PPB designs pass direct desktop and mobile verification after cache storage is cleared and cache is bypassed.
- [x] The fixture is restored to Product Grid after verification.
- [x] Empty Shopify HTML descriptions do not render on in-page or modal product cards.
- [x] Focused Jest, syntax checks, widget build, scoped ESLint, and graph rebuild pass.
