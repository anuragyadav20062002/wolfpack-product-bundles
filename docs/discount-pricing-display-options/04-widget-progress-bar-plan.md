# Widget Progress Bar Mode Plan

**Issue ID:** discount-pricing-display-options-1
**Created:** 2026-05-11
**Status:** Planned

## Goal

Add widget support for the admin-configured Progress Bar mode:

- `step_based`: current storefront behavior.
- `simple`: a simplified continuous bar that uses the same discount-rule progress data
  without presenting it as a rule-step experience.

## Current Implementation

Source:

- `app/assets/bundle-widget-full-page.js`

Current methods:

- `_renderDiscountProgress()`
  - Renders `.fpb-discount-progress`.
  - Used by the floating footer and sidebar panel.
  - Calculates bundle total through `PricingCalculator.calculateBundleTotal`.
  - Calculates current discount through `PricingCalculator.calculateDiscount`.
  - Uses `TemplateManager.createDiscountVariables`.
  - Uses `this.config.discountTextTemplate` and `this.config.successMessageTemplate`.
- `_renderDiscountProgressBanner()`
  - Similar progress messaging for `.discount-progress-banner`.

This current behavior maps to `step_based`.

## Data Source

Admin save now serializes:

```json
{
  "messages": {
    "displayOptions": {
      "progressBar": {
        "enabled": true,
        "type": "simple",
        "progressText": "Add {{conditionText}} to unlock {{discountText}}",
        "successText": "{{discountText}} unlocked"
      }
    }
  }
}
```

Metafield sync passes `pricing.messages.displayOptions` through `messaging.displayOptions`,
so the widget should read from the pricing messaging payload.

## Widget Changes

1. Add a small resolver:
   - `getProgressBarDisplayOptions()`
   - Reads `selectedBundle.pricing.messages.displayOptions.progressBar`.
   - Defaults to `{ enabled: config.showDiscountProgressBar, type: "step_based" }` when
     the rich options are absent.
2. Update the show/hide gate:
   - Continue respecting `showDiscountProgressBar`.
   - Also require `displayOptions.progressBar.enabled`.
3. Split rendering:
   - `step_based`: keep current `_renderDiscountProgress()` behavior.
   - `simple`: reuse the same progress percentage and discount variables, but render a
     simpler class modifier such as `.fpb-discount-progress.simple`.
4. Template selection:
   - If mode-specific `progressText` / `successText` is present, use it.
   - Otherwise use the existing discount messaging templates.
5. CSS:
   - Add class modifiers only if Simple requires visual differences.
   - Do not change default Step-Based styling.
6. Build:
   - Bump `WIDGET_VERSION` in `scripts/build-widget-bundles.js`.
   - Run `npm run build:widgets:full-page`.
   - Commit both source and bundled widget assets.

## Acceptance Criteria

- Existing bundles with Progress Bar enabled keep the current Step-Based behavior after
  sync.
- `Simple Bar` uses the same discount conditions and checkout/cart-transform-compatible
  rule calculations as Step-Based.
- `Step-Based Bar` remains the default for saved bundles that do not specify a mode.
- Floating footer and sidebar render the same chosen mode.
- No direct storefront-visible copy is fabricated beyond the neutral templates stored by
  the merchant-facing admin configuration.

## Shopify References

- Polaris tooltip usage for Admin UI: `https://shopify.dev/docs/api/app-home/polaris-web-components/overlays/tooltip`
- App Bridge save bar guidance: `https://shopify.dev/docs/api/app-home/app-bridge-web-components`
