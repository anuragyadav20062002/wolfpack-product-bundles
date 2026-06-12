# Issue: FPB Product Card Micro-Parity Across Templates

**Issue ID:** fpb-product-card-micro-parity-1
**Status:** In Progress
**Priority:** High
**Created:** 2026-06-13

## Overview

Open a focused storefront parity slice for the small product-card details that remain visible across FPB templates. The current screenshot evidence shows:

- a thin horizontal divider between product title and selected variant text,
- product price remains anchored in the same lower area when the card becomes selected,
- selected/unselected CTA state should not shift title, variant, or price rows,
- the card needs to preserve the compact image/title/variant/price/action rhythm across Standard, Classic, Compact, and Horizontal.

This slice is intentionally narrower than a full template pass. It only covers product-card internal layout and selected-state stability.

## Evidence

- User screenshot: `Screenshot 2026-06-13 at 00.55.11.png`
- Observed card details:
  - Product title: `18k Pedal Ring`
  - Variant row: `11`
  - Divider between title and variant row
  - Price row: `₹399.00`
  - Square plus CTA at bottom-right
  - Price remains in place rather than moving when the selection state changes

## Scope

### Templates

- FPB Standard
- FPB Classic
- FPB Compact
- FPB Horizontal

### Product-Card Details

- Title row height and truncation behavior.
- Variant row visibility and divider treatment.
- Price row position and spacing.
- CTA area stability for unselected and selected states.
- Image crop/clipping remains unchanged unless it directly causes row shift.
- Multi-variant cards with variant selector on/off.

## Out of Scope

- Summary sidebar selected-product rows.
- Step timeline / step bar.
- Discount messaging and progress bar.
- Product data loading or variant expansion rules.
- Full grid/container geometry unless it causes product-card row instability.
- Admin configuration UI.

## Acceptance Criteria

- [ ] All four FPB templates render a divider between product title and variant text when variant text is present.
- [ ] Cards without variant text do not render an empty divider/blank variant band.
- [ ] Price row does not shift vertically when a product becomes selected.
- [ ] CTA selected state does not resize the card or push title/variant/price rows.
- [ ] Mobile and desktop behavior are checked for each template.
- [ ] Focused source/behavior tests cover row stability without CSS-grep layout assertions.
- [ ] Storefront widget assets are rebuilt if widget JS/CSS changes.

## Implementation Notes

- Start with live screenshot comparison for Standard and one non-Standard template, then apply the shared card contract only where evidence matches.
- Prefer shared product-card renderer changes if the same issue appears in all templates.
- Avoid broad template refactors; this should be a small product-card surface patch.
- Use visual verification in Chrome after build/deploy-ready assets are generated.

## Suggested Test Coverage

- Add/extend a behavior test around shared product-card markup/state if the shared renderer owns the affected rows.
- If a template-specific renderer owns the affected card, add a focused source/contract test for that template.
- Do not add tests that assert raw CSS properties, class placement, or pixel layout from source text.

## Related Files

- `app/assets/widgets/shared/components/product-card.js`
- `app/assets/widgets/full-page/methods/product-grid-methods.js`
- `app/assets/widgets/full-page/methods/product-card-footer-methods.js`
- `app/assets/widgets/full-page-css/`
- `extensions/bundle-builder/assets/`

## Related Specs / Prior Work

- `test-spec/fpb-standard-design-storefront.spec.md`
- `test-spec/fpb-classic-design-storefront.spec.md`
- `test-spec/fpb-compact-design-storefront.spec.md`
- `test-spec/fpb-horizontal-design-storefront.spec.md`
- `test-spec/shared-product-card.spec.md`
- `docs/issues-prod/fpb-template-deep-parity-audit-1.md`
- `docs/issues-prod/fpb-fresh-template-parity-1.md`

## Progress Log

### 2026-06-13 - Begin implementation

- Added focused shared product-card behavior coverage for variant row rendering, selected-state retention of variant/price regions, and no empty variant row for default/missing variants.
- Implementation target: shared product-card variant row plus Standard/Horizontal legacy newline-title guard.

### 2026-06-13 - Shared card patch

- Added a dedicated shared variant row with divider treatment for real variant text only.
- Preserved the existing price/action regions so selected-state quantity controls do not move the title, variant, or price rows.
- Guarded against ordinary hyphenated product titles being split into variant rows.
