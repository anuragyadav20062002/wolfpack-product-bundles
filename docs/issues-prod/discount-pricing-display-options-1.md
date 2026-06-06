# Issue: Discount Pricing Display Options

**Issue ID:** discount-pricing-display-options-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-11
**Last Updated:** 2026-05-11 21:26

## Overview

Implement the edit-flow Discount & Pricing display options required by the redesign:
Bundle Quantity Options, full Progress Bar Options, Discount Messaging placement, and the
per-rule `Make this rule default` behavior inspired by Easy Bundles. The implementation
must integrate with existing discount rules, step conditions, widget/metafield payloads,
and the future bundle editor state boundary.

## Progress Log

### 2026-05-11 20:41 - Started implementation workflow

- Updated the Discount & Pricing design map to require `Make this rule default` on bundle
  quantity rule rows.
- Created this issue before code changes.
- The repo does not contain the mandatory `feature-pipeline` skill, so BR → PO →
  Architect documents will be created manually before implementation.
- Next: add feature pipeline docs, then write failing tests for the pricing-display
  normalizer.

### 2026-05-11 20:43 - Completed manual feature-pipeline planning

- Added BR, PO, and Architecture documents for Discount Pricing Display Options.
- Architecture chooses a pure pricing display normalizer first, followed by route/UI wiring.
- Next: write failing unit tests for quantity options, default rule behavior, progress bar
  options, and serialization.

### 2026-05-11 20:59 - Implemented first pricing display slice

- Added `app/lib/pricing-display-options.ts` pure normalizer/serializer.
- Added pricing display option types in `app/types/pricing.ts`.
- Added unit tests for:
  - deriving bundle quantity options from quantity discount rules
  - excluding amount rules from quantity options
  - default rule fallback when a saved rule is missing
  - step capacity compatibility metadata
  - progress bar milestone normalization
  - display options serialization
- Wired pricing display options into `useBundlePricing`, dirty/discard baselines, FPB save
  payloads, handler persistence, and metafield messaging payloads.
- Added first-pass FPB edit UI rows for Bundle Quantity Options, `Make this rule default`,
  Box Label, Box Subtext, Progress Bar mode, and Polaris `s-tooltip` help.
- Remaining UI work: fold the older Discount Messaging editor into the Display Options
  area and add final Progress Bar content controls.
- Chrome smoke verified that Bundle Quantity Options expands and the Save Bar appears; then
  discarded the browser-only test change.
- Verification:
  - `npx jest tests/unit/lib/pricing-display-options.test.ts tests/unit/lib/pricing-display-defaults.test.ts --runInBand`
  - `npx eslint --max-warnings 9999 ...` on touched files: 0 errors, existing warnings only.

### 2026-05-11 21:21 - Continuing remaining admin UI defects

- Starting the final Discount & Pricing admin UI pass.
- Scope:
  - move the rule-level Discount Messaging editor inside the Display Options section
  - add Progress Bar content template controls beside Simple / Step-Based mode
  - keep `Make this rule default` on bundle quantity rule rows
  - re-test the merchant controls in Chrome DevTools after unit and lint checks
- Next: add failing tests for progress bar template normalization and serialization, then
  implement the state/UI changes.

### 2026-05-11 21:26 - Completed final admin UI pass and widget plan

- Added progress bar `progressText` and `successText` normalization/serialization tests.
- Added progress bar template fields to pricing display option types and state updates.
- Moved the rule-level Discount Messaging editor into the redesigned Display Options
  section, removing the duplicate standalone editor.
- Verified in Chrome DevTools on the embedded Shopify Admin URL:
  - Display Options renders Bundle Quantity Options, Progress Bar, and Discount Messaging.
  - Bundle Quantity Options expands to rule rows with `Make this rule default`, Box Label,
    and Box Subtext.
  - Progress Bar expands to Simple Bar / Step-Based Bar and template fields.
  - Discount Messaging expands/collapses inside Display Options.
  - App Bridge Save Bar appears on edits and Discard clears the browser-only changes.
  - Polaris `s-tooltip` content appears from the help trigger.
- Added widget implementation plan for `Simple` / `Step-Based` progress bar modes.
- Verification:
  - `npx jest tests/unit/lib/pricing-display-options.test.ts tests/unit/lib/pricing-display-defaults.test.ts --runInBand`
  - `npx eslint --quiet ...` on touched code/test files
  - `git diff --check ...`

## Related Documentation

- `docs/edit-bundle-ui-redesign/discount-pricing-image-2-control-map.md`
- `docs/discount-pricing-display-options/01-requirements.md`
- `docs/discount-pricing-display-options/02-product-requirements.md`
- `docs/discount-pricing-display-options/03-architecture.md`
- `docs/discount-pricing-display-options/04-widget-progress-bar-plan.md`

## Phases Checklist

- [x] Phase 1: Manual feature-pipeline BR / PO / Architecture docs
- [x] Phase 2: Pricing display normalizer tests
- [x] Phase 3: Pricing display normalizer implementation
- [x] Phase 4: Route state and save-payload integration
- [x] Phase 5: Final edit UI integration with Polaris web components
- [x] Phase 6: Widget/metafield payload compatibility wiring
- [x] Phase 7: Lint and Chrome DevTools verification
