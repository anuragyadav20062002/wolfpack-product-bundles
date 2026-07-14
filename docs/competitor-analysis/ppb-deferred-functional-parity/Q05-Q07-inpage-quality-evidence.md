---
schema_version: 1
id: ppb-q05-q07-inpage-quality-evidence
title: PPB In-Page Accessibility and Runtime Quality Evidence
type: verification-evidence
status: verified
summary: Verifies Product List keyboard focus and Product List and Product Grid request health, typography isolation, and uniform card sizing.
last_audited: 2026-07-14
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/widgets/product-page/methods/layout-shell-methods.js
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
tags:
  - ppb
  - accessibility
  - runtime-health
keywords:
  - Product List
  - Product Grid
  - step focus
  - uniform card heights
---

# PPB In-Page Accessibility and Runtime Quality Evidence

## Fixture and protocol

- Store: `agent-5sfidg3m.myshopify.com`
- Bundle: `PPB Modal Shared Card Test`
- Bundle ID: `cmrf19c8d0000v0xpj8rz2wgh`
- Widget version: `5.0.182`
- Viewports: desktop `1280x800`; mobile `390x844`

Every storefront pass cleared Cache Storage and used a cache-bypassed hard
reload before evidence collection. Chrome DevTools MCP was used directly; no
screenshots were written to the repository.

## Q05 Product List keyboard access

The Product List replay confirmed:

1. Enter opened the selected-items drawer and Space closed it while focus
   remained on the toggle.
2. Enter changed quantity through the native increase/decrease buttons, and
   the in-place update retained focus on the activated control.
3. Enter activated the second accessible step on desktop and mobile.
4. The step-strip rerender focused the newly rendered active step instead of
   dropping focus to the page body.
5. The destination rendered the expected empty-category message and preserved
   the existing selected products.

The replay found the step-strip focus-loss defect before promotion. The
implementation now focuses the matching new step button after both direct
step activation and Next/Previous navigation rerender the Product List shell.

## Q06 request and console health

Product List and Product Grid completed their desktop and mobile passes with
successful app-owned document, configuration, design-settings, product,
stylesheet, and widget-script requests. The only console error resolved to the
theme-store request `GET /favicon.ico`, which returned `404`; it is not
app-owned.

The Admin template updates returned `200` with `success: true`. After the
in-page replay, the fixture was restored to Vertical Slots with
`bundleDesignTemplate=PDP_MODAL` and
`bundleDesignPresetId=SIMPLIFIED`. The final cache-bypassed mobile reload
rendered two simplified sections and no horizontal sections.

## Q07 typography, layout, and selector isolation

Both in-page templates reported `Inter, sans-serif` for the widget root and
add-to-cart control at both viewports, with `0px` document overflow and only
their selected Shopify CDN stylesheet active.

Product Grid rendered six visible cards, including one card with a variant
selector. Every card measured exactly:

- Desktop: `253.78125px` high.
- Mobile: `313.5px` high.

The no-variant and variant-selector cards therefore shared equal row height.
Neither Product List nor Product Grid rendered product-description content or
selected tick badges.

## Automated coverage

- `tests/unit/assets/ppb-product-list-step-conditions.test.ts`
- `tests/unit/assets/ppb-product-grid-interaction-parity.test.ts`
- `tests/unit/assets/ppb-product-page-card-controls.test.ts`
- `tests/unit/assets/ppb-list-shared-card.test.ts`
- `tests/unit/assets/ppb-template-registry-integration.test.ts`
