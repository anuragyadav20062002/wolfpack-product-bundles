# Architecture: FPB Discount Progress Bar

## Impact Analysis

- **Communities touched:** Community 5 (BundleWidgetFullPage / pricing pipeline), Community 8 (FPB Widget JS), Community 246 (useBundlePricing hook)
- **God nodes affected:** `BundleWidgetFullPage` (125 edges), `bundle-widget-full-page.js Widget Source` (82 edges)
- **Blast radius:**
  - `app/types/pricing.ts` — `PricingDisplay` type
  - `app/types/state.types.ts` — `PricingSettings` type  
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/types.ts` — `BundlePricing` interface
  - `app/hooks/useBundlePricing.ts` — state, setter, getPricingData, return object
  - `app/hooks/useBundleConfigurationState.ts` — originalValues, reset, markAsSaved
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — formData, dep array, hidden input, originalValues
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` — Prisma upsert
  - `app/services/bundles/metafield-sync/types.ts` — `BundleUiMessaging`
  - `app/services/bundles/metafield-sync/operations/bundle-product.server.ts` — metafield write
  - `app/assets/bundle-widget-full-page.js` — render + update methods
  - `app/assets/widgets/full-page-css/bundle-widget-full-page.css` — new CSS
  - **No changes needed:** `prisma/schema.prisma` — column `showProgressBar Boolean @default(true)` already exists (re-added by migration `20260504194551_add_show_progress_bar_to_bundle_pricing`)
  - **No changes needed:** Cart transform clone (`app.bundles.cart-transform.tsx`) and dashboard clone handler — both clone the entire `BundlePricing` row via Prisma, so `showProgressBar` is automatically preserved

## Decision

Re-wire the existing `showProgressBar` DB column end-to-end through TypeScript types → hook → handler → metafield → widget. The column was removed from app code in Feb 2026 and re-added to the DB in May 2026 but never re-wired. No migration needed.

For the widget, **replace** the existing `discount-progress-banner` text-only stripe with a richer component that includes both the text label AND the visual fill bar as a single unit. This avoids managing two separate DOM elements and ensures the bar always appears with its label context. The new class name is `.fpb-discount-progress` to avoid collision with the old CSS.

The `modal-footer-progress-section` in `component-generator.js` (modal step progress) is unrelated — leave it unchanged. This feature targets the bundle-level discount progress only.

## Data Model

```typescript
// app/types/pricing.ts — PricingDisplay (add field)
export interface PricingDisplay {
  showFooter: boolean;
  showDiscountProgressBar: boolean;  // ADD — was removed Feb 2026, DB column re-added May 2026
}

// app/services/bundles/metafield-sync/types.ts — BundleUiMessaging (add field)
export interface BundleUiMessaging {
  progressTemplate: string;
  successTemplate: string;
  showFooter: boolean;
  showDiscountMessaging?: boolean;
  showDiscountProgressBar?: boolean;  // ADD
}
```

## Widget Config Shape (no DB change)

```javascript
// Read by widget from bundle_ui_config metafield
this.config.showDiscountProgressBar  // boolean, default: false
```

**Note:** DB column is `showProgressBar` (Prisma camelCase → `showProgressBar`). Widget config key is `showDiscountProgressBar` for clarity. The metafield sync maps between the two.

## Widget Visual Design

```
┌─────────────────────────────────────────────────────┐
│  Add 2 more items for 20% off              3 / 5    │
│  [█████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  │
└─────────────────────────────────────────────────────┘
```

- **Container:** `.fpb-discount-progress` — padding 10px 16px, full-width, no border
- **Label row:** `.fpb-dp-label` (left) + `.fpb-dp-count` (right) — 12px, muted grey
- **Track:** `.fpb-dp-track` — 6px tall, border-radius 3px, background `#e5e7eb`
- **Fill:** `.fpb-dp-fill` — border-radius 3px, `transition: width 300ms ease`, `background: var(--bundle-dp-fill-color, #1d1d1f)`
- **Reached state:** `.fpb-discount-progress.reached` — fill turns `var(--bundle-dp-fill-reached, #16a34a)`, label shows success text
- **Host in floating subtype:** inserted before `.footer-inner` inside `.full-page-footer`
- **Host in sidebar subtype:** inserted after `.side-panel-discount-message` inside sidebar panel

## Files

| File | Action | What changes |
|---|---|---|
| `app/types/pricing.ts` | modify | Add `showDiscountProgressBar: boolean` to `PricingDisplay`; add to validation + default factory |
| `app/types/state.types.ts` | modify | Add `showDiscountProgressBar: boolean` to `PricingSettings` |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/types.ts` | modify | Add `showDiscountProgressBar?: boolean` to `BundlePricing` |
| `app/hooks/useBundlePricing.ts` | modify | Add state, setter, include in `getPricingData()` + return object |
| `app/hooks/useBundleConfigurationState.ts` | modify | Add to `originalValues`, reset, `markAsSaved` |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | modify | Add hidden input, formData.append, dep array, originalValues; render `s-switch` toggle in Discount Display Options card |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | modify | Read + write `showProgressBar` in Prisma upsert create + update |
| `app/services/bundles/metafield-sync/types.ts` | modify | Add `showDiscountProgressBar?: boolean` to `BundleUiMessaging` |
| `app/services/bundles/metafield-sync/operations/bundle-product.server.ts` | modify | Write `showDiscountProgressBar` to `messaging` object in metafield |
| `app/assets/bundle-widget-full-page.js` | modify | (1) Read `showDiscountProgressBar` from config; (2) Add `_renderDiscountProgress()` method; (3) Add `_updateDiscountProgress()` method; (4) Call `_updateDiscountProgress()` wherever `_updateDiscountProgressBanner()` is currently called; (5) Remove `_renderDiscountProgressBanner()` + `_updateDiscountProgressBanner()` (replace entirely); (6) Update `renderFullPageFooter()` to insert `.fpb-discount-progress` instead of old banner; (7) Update `renderSidePanel()` to insert `.fpb-discount-progress` after discount message |
| `app/assets/widgets/full-page-css/bundle-widget-full-page.css` | modify | Remove `.discount-progress-banner` rules; add `.fpb-discount-progress`, `.fpb-dp-label`, `.fpb-dp-count`, `.fpb-dp-track`, `.fpb-dp-fill`, `.fpb-discount-progress.reached` |
| `app/assets/widgets/shared/component-generator.js` | modify | Remove `modal-footer-progress-section` HTML from modal template (was never connected; replace with nothing — the modal uses the floating footer path) |

## Test Plan

| Test file | Scope | Key behaviours |
|---|---|---|
| `tests/unit/lib/pricing-display-defaults.test.ts` | unit | `showDiscountProgressBar` defaults to `false`; validation accepts `true`/`false`; rejects non-boolean |
| `tests/unit/services/bundle-ui-messaging.test.ts` | unit | Metafield sync writes `showDiscountProgressBar: true/false`; missing field defaults to `false` |

**No tests needed for:**
- Widget JS (`_renderDiscountProgress` etc.) — widget JS is not covered by test suite
- CSS changes
- React route rendering (Polaris component UI)
- Prisma upsert — covered by integration through handler; column already migrated

**Mock:** Pure function tests only — no Prisma, no Shopify API calls needed for the above two test files.
