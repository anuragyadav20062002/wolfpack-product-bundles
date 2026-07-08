---
title: Bundle Instance Tracking
type: feature
audited: 2026-04-16
sources: app/assets/bundle-widget-full-page.js, extensions/bundle-cart-transform-ts/
---

# Bundle Instance Tracking

## Problem

A customer may add the same bundle to their cart multiple times (e.g., 2 gift sets). Each must remain a distinct, editable line item in the cart and checkout.

## Solution: EB `_wolfpackProductBundle:OfferId`

Each add-to-cart call generates a 12-character uppercase alphanumeric grouping ID:
```javascript
const offerLineId = `${offerId}_${sessionKey}_${itemIndex}`;
```

This ID is added as a **cart attribute** (`_wolfpackProductBundle:OfferId`) to every component line item in the same bundle add operation. Cart Transform removes the trailing item index and groups by `{offerId}_{sessionKey}`.

## Why It Works

- Shopify's `/cart/add.js` does NOT merge lines that have different `properties`/attributes
- Cart Transform groups component lines by matching the `_wolfpackProductBundle:OfferId` base for MERGE operations
- Two adds of the same bundle → two different session keys → two separate merged lines

## MERGE Deduplication

Shopify auto-consolidates `linesMerge` results with the same `parentVariantId` + `title`. To prevent this for multiple instances:

```typescript
const bundleNameCounts = new Map<string, number>();
// For each merge, track count per bundle name
// Append " (2)", " (3)" etc. to make titles unique
```

This is handled in the cart transform function. Without unique titles, two bundle instances would collapse into one line item.
