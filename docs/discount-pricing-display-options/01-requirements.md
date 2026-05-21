# Business Requirements: Discount Pricing Display Options

**Issue ID:** discount-pricing-display-options-1
**Stage:** BR
**Created:** 2026-05-11

## Problem

The edit bundle Discount & Pricing section currently exposes rule editing, progress bar,
and discount messaging in a fragmented way. The redesign requires a cleaner overview while
still keeping full merchant control over quantity-based pricing choices, progress bar
behavior, and discount messaging.

Easy Bundles demonstrates useful patterns for Bundle Quantity Options, Progress Bar
Options, and contextual tooltips. Wolfpack should adopt those concepts within the
Polaris Web Components design philosophy.

## Goals

- Keep the redesigned Discount & Pricing overview compact.
- Fully implement Bundle Quantity Options based on quantity discount tiers.
- Add a per-rule `Make this rule default` action.
- Fully implement Progress Bar Options with Simple Bar and Step-Based Bar modes.
- Integrate pricing display settings with existing discount rules and step conditions.
- Use Polaris Web Components, including `s-tooltip` for dense help affordances.
- Preserve existing cart transform and widget contracts.

## Non-Goals

- Do not add Buy X, get Y in this UI migration.
- Do not replace the pricing engine.
- Do not remove existing discount messaging functionality.
- Do not create custom tooltip infrastructure unless Polaris `s-tooltip` fails live
  verification.

## Success Criteria

- Existing discount rules still save and load correctly.
- Quantity display options are derived from quantity-based rules.
- Merchants can choose one default quantity rule.
- Progress bar display settings persist with pricing data.
- Save payloads remain backward compatible with existing widgets and metafields.
- New normalizer tests cover quantity rules, amount rules, default rule fallback, progress
  settings, and step-condition compatibility metadata.
