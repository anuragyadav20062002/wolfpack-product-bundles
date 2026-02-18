# Architecture Decision Record: Legacy Backwards-Compatibility Removal (Round 2)

## Context

Two remaining backwards-compatibility code paths are being dropped. Both are purely defensive branches guarding against data written by older versions of the system that are no longer deployed.

## Files to Modify

| Action | File | Change |
|--------|------|--------|
| EDIT | `extensions/bundle-checkout-ui/src/Checkout.tsx` | Remove format detection + legacy object branch from `parseComponents` |
| EDIT | `app/assets/bundle-widget-product-page.js` | Remove `pricingMessages` var + `else if` branch from `updateMessagesFromBundle` |
| EDIT | `app/assets/bundle-widget-full-page.js` | Same as above |
| REBUILD | `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` | `npm run build:widgets` |
| REBUILD | `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` | `npm run build:widgets` |

## Decision: single atomic commit

Same rationale as Round 1 — all three edits are independent, zero cross-references, one clean revert point.

## Resulting Shapes

### `parseComponents` after
```typescript
function parseComponents(json: string): ComponentDetail[] {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed) || parsed.length === 0) return [];
  const num = (v: unknown): number => { ... };
  return parsed.map((item: any[]) => ({
    title: String(item[0] ?? ''),
    quantity: num(item[1]),
    retailPrice: num(item[2]),
    bundlePrice: num(item[3]),
    discountPercent: num(item[4]),
    savingsAmount: num(item[5]),
  }));
}
```

### `updateMessagesFromBundle` after (both widgets)
```javascript
updateMessagesFromBundle() {
  const messaging = this.selectedBundle?.messaging;
  if (messaging) {
    // new path — progressTemplate / successTemplate
  } else {
    // default — show if pricing.enabled
  }
}
```

## Degradation Behaviour

Old bundles without the `messaging` key fall to the `else` default: `showDiscountMessaging` is set from `pricing.enabled`, templates stay as widget defaults. No crash, no silent failure.
