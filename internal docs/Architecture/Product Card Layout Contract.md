---
title: Product Card Layout Contract
type: architecture
audited: 2026-07-13
---

# Product Card Layout Contract

For every storefront template (FPB/PPB and all template modes), in any product grid, all cards in the same row must render at the same height, including across selection states.

Hard expectation: all templates share this rule. A product card must never increase in height when moving from unselected to selected (or selected to unselected), and all cards in a row must remain equal height together.

A product should never visually "grow" when transitioning from unselected to selected (or selected to unselected), and row height must remain stable during that transition.

This is a hard requirement for all storefront templates and template modes:

- Applies to FPB and PPB, and every grid variant (including inline, modal, compact, PDP, side-footer, and slot-based layouts).
- Applies to all PPB templates: Product List, Product Grid, Horizontal Slots, and Vertical Slots.

This is a hard requirement:

- A card must not increase row height when changing state, including unselected → selected, selected → unselected, and any hover/focus/active transitions.
- All templates share the same rule: product cards in a given row must always end at the same final pixel height.
- Cards may differ across different rows (row-level height variation is allowed) but not within the same row.
- Uniformity is scoped to each row only: cards in row N must match each other exactly; cards in row N+1 may differ.
- Never let a card height increase when transitioning from unselected → selected (or any other selection-state transition), even briefly.
- This is required for all templates and all grid implementations, including PDP inline, PDP modal, vertical-slot, horizontal-slot, and side-footer/compact variants.
- Different rows may have different heights if content density differs, but any cards sharing a row must be equal height at all times.

## Hard expectation

- For all storefront templates, product cards in the same row must remain visually uniform in height across all interaction states.
- Height must never increase when a product transitions from unselected to selected or from selected to unselected.
- Variation is allowed across rows, but not within a row.

## Implementation rules

- Avoid state transitions that change intrinsic card height (for example by showing additional in-card fields, tall selected chips, or expanding rows inside the card).
- Keep hover/focus feedback non-expanding (outline, border, iconography, color) so cards do not visually overlap neighbors while hovered.
- Keep selection/hover feedback on the existing card frame via overlays, borders, iconography, text color, opacity, and icon badges.
- Prefer fixed row contracts (`min-height`, `height`, flex stretch, consistent padding/line-clamp) so selected/unselected variants stay layout-stable.
- Keep PPB/inpage and PPB/modal states non-expanding on `selected` and hover-expanded transitions.
- Keep description rendering display-safe: pass only escaped merchant text, do not inject merchant description/title fields as raw HTML, and avoid trimming/normalizing merchant copy during render.
- If new content must appear on selection, render it outside the row-level card height envelope (popover, drawer, footer/action panel, details panel, etc.).
- Current implementation also enforces row stability at CSS-level in full-page/product-card grids by using `grid-auto-rows: minmax(0, 1fr)` across the preset templates instead of `auto`.
- 2026-07-13: Fixed hover-overlap by forcing card containers to stay `height: 100%` in:
  - `app/assets/widgets/full-page-css/base/search-category-product-grid.css`
  - `app/assets/widgets/full-page-css/templates/side-footer-standard.css`
  - `app/assets/widgets/full-page-css/templates/side-footer-classic.css`
  - `app/assets/widgets/full-page-css/templates/side-footer-compact.css`
  - `app/assets/widgets/full-page-css/templates/side-footer-horizontal.css`
  - `app/assets/widgets/product-page-css/base/modal-product-grid.css`
  - `app/assets/widgets/product-page-css/base/bottom-sheet-modal.css`

## Acceptance

- Any template parity or CSS change touching product cards should preserve equal card height within the row under all shopper states in every template.
- Visual proof should check before/after selection in the same viewport and confirm no row height jump.
