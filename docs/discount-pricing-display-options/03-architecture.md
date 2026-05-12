# Architecture: Discount Pricing Display Options

**Issue ID:** discount-pricing-display-options-1
**Stage:** Architect
**Created:** 2026-05-11

## Design

Add a pure pricing display normalizer as the first implementation boundary. Route UI and
handlers should use this normalized shape instead of spreading ad hoc pricing-display JSON
across route-local state.

## Files

- `app/types/pricing.ts`
  - Add pricing display option types.
  - Keep existing pricing rule types backward compatible.
- `app/lib/pricing-display-options.ts`
  - Add pure normalizer and serializer helpers.
  - No React, Remix, Prisma, or browser dependencies.
- `tests/unit/lib/pricing-display-options.test.ts`
  - Cover normalizer behavior before UI wiring.
- `app/hooks/useBundlePricing.ts`
  - Later: initialize and mutate display options.
- `app/hooks/useBundleConfigurationState.ts`
  - Later: include display options in baseline/dirty/discard.
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
  - Later: render Bundle Quantity Options, Progress Bar Options, and tooltips.
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
  - Later: persist display options in `BundlePricing.messages` or display metadata without
    schema churn.
- Widget/metafield sync files
  - Later: pass normalized display options through existing pricing messages/display JSON.

## Data Shape

Store extended display settings inside pricing metadata so no Prisma migration is required
for this slice.

```ts
pricing.messages = {
  showDiscountDisplay: true,
  showDiscountMessaging: boolean,
  ruleMessages: Record<string, RuleMessage>,
  displayOptions: {
    bundleQuantityOptions: {
      enabled: boolean,
      defaultRuleId: string | null,
      optionsByRuleId: Record<string, { label: string; subtext: string }>
    },
    progressBar: {
      enabled: boolean,
      type: "simple" | "step_based",
      progressText: string,
      successText: string
    }
  }
}
```

Existing `showProgressBar` remains the fast boolean flag for compatibility. The richer
progress configuration lives in `messages.displayOptions.progressBar`.

## Validation

- Quantity options only derive from rules whose condition type is `quantity`.
- Default rule must be a valid quantity rule or fall back to the first quantity rule.
- Progress bar can derive milestones from quantity or amount rules.
- Step compatibility is reported as metadata for UI warnings.

## Test Plan

- Failing tests first for:
  - quantity option derivation
  - default rule fallback
  - amount-rule exclusion from quantity options
  - progress bar defaulting
  - serialization shape
  - step-condition compatibility metadata
