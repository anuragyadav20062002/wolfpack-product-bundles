---
schema_version: 1
id: ppb-g11-product-list-vertical-slots-compare-at-divergence-evidence
title: PPB G11 Product List and Vertical Slots Compare-at Divergence Evidence
type: parity-evidence
status: active
summary: Documents why Product List and Vertical Slots compare-at visibility are terminal accepted divergences after fixing Wolfpack to honor the merchant control.
last_audited: 2026-07-16
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - app/assets/widgets/shared/components/product-card.js
  - app/assets/widgets/product-page/methods/inpage-render-methods.js
related_docs:
  - docs/competitor-analysis/ppb-deferred-functional-parity/C03-product-list-sale-compare-at-evidence.md
  - docs/competitor-analysis/ppb-deferred-functional-parity/G11-product-grid-compare-at-visibility-evidence.md
tags:
  - ppb
  - compare-at
keywords:
  - G11
  - Product List
  - Vertical Slots
---

# G11 Product List and Vertical Slots Compare-at Divergence Evidence

## Result

Row G11 is terminal **X** for Product List and Vertical Slots.

EB Product List and Vertical Slots render compare-at prices in the observed runtime even when the saved compare-at runtime flags are false. Wolfpack now intentionally honors the merchant-level Product Page control instead: when `productPage.showCompareAtPrices` is false, sale product cards render the current price without the compare-at price.

This is an accepted product/safety divergence because reproducing EB's Product List/Vertical Slots behavior would show strike-through pricing after the merchant disables compare-at display.

## EB evidence

Existing Product List evidence in `C03-product-list-sale-compare-at-evidence.md` records EB Product List runtime values:

```json
{
  "templateType": "PDP_INPAGE",
  "templateId": "CASCADE",
  "showProductComparedAtPrice": false,
  "comparedAtVisibility": "block"
}
```

The same pass records visible Product List sale rendering:

```text
14k Solid Bloom Earrings
₹529
₹489
```

Vertical Slots was checked through Chrome DevTools MCP with cache-cleared hard reloads after configuring EB to `PDP_MODAL` + `SIMPLIFIED`.

Desktop `1280x800x1`:

```json
{
  "templateType": "PDP_MODAL",
  "templateId": "SIMPLIFIED",
  "showProductComparedAtPrice": false,
  "showComparedAtPriceOnATC": false,
  "productCardComparedAtPriceVisibility": "block",
  "step2PriceTokens": ["₹529", "₹489", "₹150", "₹99.99", "₹629"],
  "overflowX": 0
}
```

Mobile `390x844x3`:

```json
{
  "templateType": "PDP_MODAL",
  "templateId": "SIMPLIFIED",
  "showProductComparedAtPrice": false,
  "showComparedAtPriceOnATC": false,
  "productCardComparedAtPriceVisibility": "block",
  "step2PriceTokens": ["₹529", "₹489", "₹150", "₹99.99", "₹629"],
  "overflowX": 0
}
```

EB was restored to Product Grid after the capture and verified as `PDP_INPAGE` + `COGNIVE`.

## Wolfpack defect and fix

The first WPB Product List pass exposed a real defect: the shared Product List card renderer always rendered `compareAtPrice` when present, bypassing `_shouldShowProductComparedAtPrice()`.

Focused red test:

```bash
npx jest --selectProjects unit --runTestsByPath tests/unit/assets/ppb-list-shared-card.test.ts
```

Failure:

```text
PPB List shared product cards › honors disabled compare-at visibility for Product List rows
Expected substring: not "$15.99"
Received string: ... "$15.99" ... "$12.99" ...
```

Fix:

- `renderSharedProductCard` now renders compare-at only when `options.showCompareAtPrice === true`.
- Product List/Product Grid in-page callers pass `this._shouldShowProductComparedAtPrice()`.
- Full-page shared-card callers pass `showCompareAtPrice: true` to preserve existing full-page behavior.
- Widget version bumped to `5.0.189` and widgets rebuilt.

Focused green test:

```bash
npx jest --selectProjects unit --runTestsByPath tests/unit/assets/ppb-list-shared-card.test.ts tests/unit/assets/ppb-product-page-card-controls.test.ts tests/unit/assets/bundle-widget-product-page-compare-at-price.test.ts
```

Result:

```text
Test Suites: 3 passed, 3 total
Tests: 20 passed, 20 total
```

## WPB Product List evidence after fix

Fixture:

```json
{
  "bundleId": "cmrf19c8d0000v0xpj8rz2wgh",
  "bundleDesignTemplate": "PDP_INPAGE",
  "bundleDesignPresetId": "CASCADE",
  "productPage.showCompareAtPrices": false,
  "step2Enabled": true,
  "widgetVersion": "5.0.189"
}
```

Desktop `1280x800x1`, cache-cleared hard reload:

```json
{
  "template": "PDP_INPAGE",
  "preset": "CASCADE",
  "controlsShowCompareAtPrices": false,
  "saleCards": [
    "14k Solid Bloom Earrings $489.00 Add +",
    "Purely Almonds Original $20.00 Add +",
    "18k Dangling Pendant Earrings $579.00 Add +",
    "Yellow Sofa $99.99 2 Seater 3 seater 4 seater Add +"
  ],
  "solidBloomHasCompare": false,
  "almondsHasCompare": false,
  "yellowSofaHasCompare": false,
  "overflowX": 0
}
```

Mobile `390x844x3`, cache-cleared hard reload:

```json
{
  "template": "PDP_INPAGE",
  "preset": "CASCADE",
  "controlsShowCompareAtPrices": false,
  "saleCards": [
    "14k Solid Bloom Earrings $489.00 Add +",
    "Purely Almonds Original $20.00 Add +",
    "18k Dangling Pendant Earrings $579.00 Add +",
    "Yellow Sofa $99.99 2 Seater 3 seater 4 seater Add +"
  ],
  "solidBloomHasCompare": false,
  "almondsHasCompare": false,
  "yellowSofaHasCompare": false,
  "overflowX": 0
}
```

## WPB Vertical Slots evidence after fix

Fixture:

```json
{
  "bundleId": "cmrf19c8d0000v0xpj8rz2wgh",
  "bundleDesignTemplate": "PDP_MODAL",
  "bundleDesignPresetId": "SIMPLIFIED",
  "productPage.showCompareAtPrices": false,
  "step2Enabled": true,
  "widgetVersion": "5.0.189"
}
```

Desktop `1280x800x1`, cache-cleared hard reload:

```json
{
  "template": "PDP_MODAL",
  "preset": "SIMPLIFIED",
  "controlsShowCompareAtPrices": false,
  "saleCards": [
    "14k Solid Bloom Earrings $489.00 Add to Cart",
    "Purely Almonds Original $20.00 Add to Cart",
    "18k Dangling Pendant Earrings $579.00 Add to Cart",
    "Yellow Sofa $99.99 2 Seater 3 seater 4 seater Add to Cart"
  ],
  "solidBloomHasCompare": false,
  "almondsHasCompare": false,
  "yellowSofaHasCompare": false,
  "overflowX": 0
}
```

Mobile `390x844x3`, cache-cleared hard reload:

```json
{
  "template": "PDP_MODAL",
  "preset": "SIMPLIFIED",
  "controlsShowCompareAtPrices": false,
  "saleCards": [
    "14k Solid Bloom Earrings $489.00 Add to Cart",
    "Purely Almonds Original $20.00 Add to Cart",
    "18k Dangling Pendant Earrings $579.00 Add to Cart",
    "Yellow Sofa $99.99 2 Seater 3 seater 4 seater Add to Cart"
  ],
  "solidBloomHasCompare": false,
  "almondsHasCompare": false,
  "yellowSofaHasCompare": false,
  "overflowX": 0
}
```

## Fixture restore

After the batch, the WPB fixture was restored and hard-reloaded:

```json
{
  "template": "PDP_MODAL",
  "preset": "SIMPLIFIED",
  "controlsShowCompareAtPrices": true,
  "step2Enabled": false,
  "step2ProductCount": 4,
  "widgetVersion": "5.0.189",
  "visibleText": "Step 1 Product 1 Product 2 Add Bundle to Cart Buy it now",
  "overflowX": 0
}
```
