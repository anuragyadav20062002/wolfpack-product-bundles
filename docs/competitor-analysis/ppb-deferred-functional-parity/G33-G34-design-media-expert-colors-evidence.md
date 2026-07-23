---
schema_version: 1
id: ppb-g33-g34-design-media-expert-colors-evidence
title: PPB G33-G34 Design Media and Expert Colors Evidence
type: parity-evidence
status: active
summary: Documents EB and Wolfpack Product Page design image-fit and expert product-card color propagation across all four PPB templates.
last_audited: 2026-07-16
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/widgets/product-page-css/base/bottom-sheet-modal.css
  - app/assets/widgets/product-page-css/templates/inpage-cascade.css
  - app/assets/widgets/product-page-css/templates/inpage-cognive.css
  - extensions/bundle-builder/assets/bundle-widget.css
  - extensions/bundle-builder/assets/bundle-widget-product-page-cascade.css
  - extensions/bundle-builder/assets/bundle-widget-product-page-cognive.css
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
related_docs:
  - internal docs/EB Settings Design Reference.md
  - docs/competitor-analysis/ppb-deferred-functional-parity/G30-G31-product-list-modal-slots-design-typography-evidence.md
  - docs/competitor-analysis/ppb-deferred-functional-parity/G32-vertical-slots-corners-evidence.md
tags:
  - ppb
  - design-settings
  - expert-colors
keywords:
  - G33
  - G34
  - product image fit
  - expert color controls
---

# G33-G34 Design Media and Expert Colors

## Result

Rows G33 and G34 are terminal **P** for Product List, Product Grid, Horizontal Slots, and Vertical Slots.

Chrome DevTools MCP was used directly. Before each storefront evidence pass, Cache Storage was cleared and the page was hard reloaded with `ignoreCache: true`. Desktop used `1280x800`; mobile used `390x844`.

The shared fixture proved both rows together:

```json
{
  "imageFit": "contain",
  "productCardBg": "#fff4cc",
  "productCardTitle": "#0055ff",
  "productCardButtonBg": "#ff00cc",
  "productCardButtonText": "#003300",
  "footerBg": "#ccfff5"
}
```

## EB configuration and restore

EB was configured once through the authenticated iframe context, then the single PPB offer `MIX-156854` was cycled through all four template contracts using the hydrated `mixAndMatch/read` payload and `mixAndMatch/update`.

The EB page customization payload was backed up before mutation and restored after the batch. The final restore verification hard reload showed:

```json
{
  "template": "PDP_INPAGE",
  "templateId": "COGNIVE",
  "imageFit": "cover",
  "productCardBg": "#FFFFFF",
  "productCardTitle": "#1E1E1E",
  "productCardButtonBg": "#000000",
  "productCardButtonText": "#FFFFFF",
  "overflowX": 0
}
```

### EB storefront proof

| Template | Desktop proof | Mobile proof |
| --- | --- | --- |
| Product List (`PDP_INPAGE / CASCADE`) | Runtime vars: `contain`, `#fff4cc`, `#0055ff`, `#ff00cc`, `#003300`; product image `object-fit: contain`; title `rgb(0, 85, 255)`; add button `rgb(255, 0, 204)` / `rgb(0, 51, 0)`; overflow `0`. | Same runtime vars and computed values at `390x844`, DPR `3`; overflow `0`. |
| Product Grid (`PDP_INPAGE / COGNIVE`) | Runtime vars: `contain`, `#fff4cc`, `#0055ff`, `#ff00cc`, `#003300`; product image `object-fit: contain`; title `rgb(0, 85, 255)`; add button `rgb(255, 0, 204)` / `rgb(0, 51, 0)`; overflow `0`. | Same runtime vars and computed values at `390x844`, DPR `3`; overflow `0`. |
| Horizontal Slots (`PDP_MODAL / MODAL`) | Modal product card background `rgb(255, 244, 204)`; image `contain`; title `rgb(0, 85, 255)`; add button `rgb(255, 0, 204)` / `rgb(0, 51, 0)`; overflow `0`. | Same modal product-card computed values at `390x844`, DPR `3`; overflow `0`. |
| Vertical Slots (`PDP_MODAL / SIMPLIFIED`) | Modal product card background `rgb(255, 244, 204)`; image `contain`; title `rgb(0, 85, 255)`; add button `rgb(255, 0, 204)` / `rgb(0, 51, 0)`; overflow `0`. | Same modal product-card computed values at `390x844`, DPR `3`; overflow `0`. |

## Wolfpack configuration and restore

Wolfpack SIT was configured once by updating the `product_page` `DesignSettings` row and cycling bundle `cmrf19c8d0000v0xpj8rz2wgh` through the four template pairs. The fixture was restored after the batch to:

```json
{
  "bundleDesignTemplate": "PDP_MODAL",
  "bundleDesignPresetId": "SIMPLIFIED",
  "productCardImageFit": "cover",
  "productCardBgColor": "#FFFFFF",
  "productCardFontColor": "#000000",
  "buttonBgColor": "#000000",
  "buttonTextColor": "#FFFFFF"
}
```

The final restore hard reload showed Vertical Slots baseline values and overflow `0`.

### Wolfpack storefront proof

| Template | Desktop proof | Mobile proof |
| --- | --- | --- |
| Product List (`PDP_INPAGE / CASCADE`) | Root vars: `contain`, `#fff4cc`, `#0055ff`, `#ff00cc`, `#003300`; product card background `rgb(255, 244, 204)`; image `contain`; title `rgb(0, 85, 255)`; add button `rgb(255, 0, 204)` / `rgb(0, 51, 0)`; overflow `0`. | Same runtime vars and computed values at `390x844`, DPR `3`; overflow `0`. |
| Product Grid (`PDP_INPAGE / COGNIVE`) | Root vars: `contain`, `#fff4cc`, `#0055ff`, `#ff00cc`, `#003300`; product card background `rgb(255, 244, 204)`; image `contain`; title `rgb(0, 85, 255)`; add button `rgb(255, 0, 204)` / `rgb(0, 51, 0)`; overflow `0`. | Same runtime vars and computed values at `390x844`, DPR `3`; overflow `0`. |
| Horizontal Slots (`PDP_MODAL / MODAL`) | Modal product card background `rgb(255, 244, 204)`; image `contain`; title `rgb(0, 85, 255)`; add button `rgb(255, 0, 204)` / `rgb(0, 51, 0)`; overflow `0`. | Same modal product-card computed values at `390x844`, DPR `3`; overflow `0`. |
| Vertical Slots (`PDP_MODAL / SIMPLIFIED`) | Modal product card background `rgb(255, 244, 204)`; image `contain`; title `rgb(0, 85, 255)`; add button `rgb(255, 0, 204)` / `rgb(0, 51, 0)`; overflow `0`. | Same modal product-card computed values at `390x844`, DPR `3`; overflow `0`. |

## Source fixes made before matrix promotion

Two CSS-only source fixes were required before Wolfpack matched the EB runtime:

- `be76a78c` — modal product-card selectors now consume the design variables instead of fixed modal defaults.
- `395038d7` — Product List and Product Grid product-card selectors now consume the same design variables instead of fixed in-page defaults.

Per the repository CSS testing rules, no CSS/class grep unit test was added. Verification used generated CSS rebuilds and direct computed-style storefront proof.
