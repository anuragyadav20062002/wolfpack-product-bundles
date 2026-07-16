---
schema_version: 1
id: ppb-g19-bundle-summary-configuration-absence-evidence
title: PPB G19 Bundle Summary Configuration Absence Evidence
type: parity-evidence
status: verified
summary: Documents that current EB Product Page Bundle admin and runtime do not expose bundle summary title or subtitle configuration.
last_audited: 2026-07-16
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - internal docs/EB Implementation Reference.md
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
related_docs:
  - internal docs/EB Implementation Reference.md
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
tags:
  - ppb
  - g19
  - bundle-summary
  - eb-absent
keywords:
  - bundleTextConfig
  - bundleSummary
  - Bundle Cart
  - Product Page Layout
---

# PPB G19 Bundle Summary Configuration Absence Evidence

## Scope

G19 asks whether saved bundle summary title/subtitle/totals copy reaches the
correct Product Page Bundle summary surface.

Current EB evidence resolves the row as **E** for all PPB templates. The archived
EB reference documents `bundleTextConfig.bundleSummary.{title, subTitle}` for
Bundle Box/FPB, but the current Product Page Bundle admin and storefront runtime
do not expose that PPB configuration path.

## EB Admin proof

Chrome DevTools MCP opened EB Settings → Language and switched the Template
Language selector from `Landing Page Layout` to `Product Page Layout`.

Visible Product Page Layout language groups were:

- Product Card
- Bundle Cart
- Bundle
- Toasts

The Product Page Layout → Bundle Cart group exposed navigation and CTA labels:

- `Discount Badge Suffix`
- `Subscription Selection Label`
- `Inline Add To Cart Button - Quantity Selection message`
- `Inline Cart Drawer Button Text`
- `Inline Cart Selected Products Label`
- `Subtotal Text`
- `Add Bundle Cart label`
- `Footer Previous Button`
- `Footer Next Button`
- `Footer Finish Button`

The Product Page Layout → Bundle group exposed general bundle labels:

- `No Products Available label`
- `Add Bundle Loading label`
- `Add Bundle Success label`
- `Add Empty Product Card Text`
- `Steps Drawer Pill Text`

No Product Page Layout group exposed a bundle summary title, bundle summary
subtitle, `bundleTextConfig`, `bundleSummary`, `Your Bundle`, or `Review your
bundle` control.

## EB storefront proof

Chrome DevTools MCP selected the EB storefront product page
`https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`,
cleared Cache Storage and local/session state, and reloaded with
`ignoreCache: true`.

The active runtime reported:

```json
{
  "offerId": "MIX-156854",
  "template": { "templateId": "COGNIVE" },
  "bundleTextConfig": null,
  "productPageControls": {
    "hideOutOfStockProducts": true,
    "executeScriptAfterAddToCart": "",
    "executeDefaultSideCartUpdate": true
  }
}
```

Targeted DOM queries for summary title/subtitle selectors returned no matches:

- `.gbbFooterBundleTitle`
- `.gbbFooterBundleSubtext`
- classes containing `BundleTitle`
- classes containing `BundleSub`
- classes containing `Summary` / `summary`

Visible Product Grid text showed the current summary/CTA surfaces such as
`View Bundle Items`, discount progress text, and `Next`, but no configurable
summary title/subtitle copy.

## Classification

Classify G19 as **E** across Product List, Product Grid, Horizontal Slots, and
Vertical Slots. The current EB Product Page Bundle configuration does not expose
or execute the archived `bundleTextConfig.bundleSummary` title/subtitle contract,
so WPB should not invent a PPB-specific summary title/subtitle behavior for this
parity row.
