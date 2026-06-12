# Agentic Loop Plan: FPB Desktop Summary Sidebar CSS Parity Across All Templates

## Purpose

Open a focused storefront CSS parity slice for the **summary sidebar in desktop viewport** across every FPB template/preset.

The goal is to make the desktop summary sidebar visually and behaviorally match the EB reference for the same FPB flow while keeping the implementation clean, scoped, and maintainable after the recent refactor.

This plan is intentionally **codebase-agnostic**. It must not assume old file paths, old selector names, or old DOM details. The agent must first discover the current CSS ownership, state hooks, and template architecture in the live refactored codebase.

---

## Primary Goal

For every FPB desktop template, the summary sidebar must reach parity with EB across:

1. Sidebar shell and sticky layout.
2. Header/title/subtitle/count area.
3. Clear/reset action.
4. Discount/progress messaging.
5. Tier/box-selection CTA area, if present.
6. Selected product rows.
7. Empty slots and skeleton slots.
8. Product quantity, variant, price, and remove controls.
9. Free-gift and add-on states.
10. Subtotal/total/discount total area.
11. Back/next checkout/navigation CTA area.
12. Internal scroll behavior.
13. All relevant empty, loading, partial, complete, disabled, enabled, overflow, hover, focus, and reached states.

---

## Template Coverage

Apply the parity plan to all FPB desktop templates/presets currently supported by the product.

At minimum, this should include the known FPB desktop presets:

1. Standard
2. Classic
3. Compact
4. Horizontal

If the refactored codebase exposes additional FPB desktop templates, include them in the same parity matrix instead of assuming only these four exist.

---

## Desktop Viewport Definition

Use the product’s current desktop breakpoint as the source of truth.

If the codebase defines a canonical desktop breakpoint, use that. If not, use the established desktop convention of:

```css
@media (min-width: 1024px) {
  /* desktop-only summary sidebar parity rules */
}
```

Desktop sidebar changes must not affect mobile footer, mobile bottom sheet, mobile summary tray, product-card mobile layout, or modal layout.

---

## Hard Constraints

1. Modify only existing CSS.
2. Do not add JavaScript.
3. Do not create new CSS classes unless absolutely necessary and explicitly documented.
4. Prefer existing state hooks, attributes, template scopes, and component classes.
5. Desktop-only sidebar changes must live inside the relevant desktop media query.
6. Do not modify mobile-only footer/sidebar behavior.
7. Do not modify product-card CSS except where a direct sidebar overlap or layout interaction is proven and unavoidable.
8. Do not make unrelated changes to banners, tabs, modals, variant pickers, product grid, or checkout flow.
9. Do not add duplicate declarations that fight existing declarations for the same sidebar element.
10. Avoid `!important`. If unavoidable, isolate it to the narrowest possible selector and document why cascade cleanup could not solve it.
11. Do not introduce competitor-specific namespaces, class names, or terminology into the codebase.
12. Do not hard-code assumptions from pre-refactor files. Discover the current CSS structure first.
13. If an internal state is not represented by any existing class, attribute, or DOM state, document the blocker instead of adding runtime behavior.

---

## Expected Desktop Sidebar Result

At desktop viewport widths, each FPB template should render a summary sidebar that:

- Is visually aligned to EB for the same template category.
- Maintains correct sticky/fixed behavior while the product grid scrolls.
- Does not overlap product content.
- Does not introduce horizontal overflow.
- Keeps the CTA area visible and usable.
- Keeps the selected-products section scrollable internally when necessary.
- Presents empty slots, skeleton slots, selected items, discount progress, totals, and CTA states consistently.
- Preserves template-specific visual identity while matching the EB structural behavior.
- Remains stable when items are added, removed, quantities change, steps advance, and discounts/free gifts become unlocked.

---

## Sidebar Internal State Matrix

The agent must account for every relevant internal state below.

### Selection states

- No products selected.
- One product selected.
- Multiple products selected.
- Required quantity not yet met.
- Required quantity exactly met.
- Required quantity exceeded, if the product supports exceeding quantity.
- Included/default products present.
- Optional products present.
- Same product added with quantity greater than one.
- Same product added with multiple variants.

### Empty and loading states

- Empty selected-products list.
- Empty required slots.
- Skeleton placeholder rows.
- Loading state while product/selection data is resolving.
- Transition from skeleton to selected product.
- Transition from selected product back to empty slot after removal.

### Product row states

- Product image present.
- Product image missing/fallback.
- Long product title.
- Variant label present.
- Variant label absent.
- Price present.
- Original/strike price present.
- Final/discounted price present.
- Quantity badge present.
- Remove button visible.
- Remove button hover state.
- Remove button focus-visible state.
- Disabled remove state, if applicable.

### Discount and progress states

- No discount configured.
- Discount configured but unreached.
- Discount nearly reached.
- Discount reached.
- Multiple discount tiers.
- Step-based progress.
- Simple progress.
- Progress bar at 0%.
- Progress bar partially filled.
- Progress bar at 100%.
- Reached messaging.
- Unreached messaging.

### Free gift and add-on states

- Free gift locked.
- Free gift unlocked.
- Free gift selected.
- Free gift automatically included.
- Free gift price shown as free.
- Free gift original price shown, if applicable.
- Add-on message present.
- Add-on/upsell slot empty.
- Add-on/upsell slot reached.

### Box/tier states

- Box selection area absent.
- Box selection area present.
- Tier CTA absent.
- Tier CTA present.
- Active tier selected.
- Inactive tier available.
- Tier/box option disabled.
- Tier/box option text wraps.

### CTA/navigation states

- Next button disabled.
- Next button enabled.
- Next button hover state.
- Next button focus-visible state.
- Back button absent on first step.
- Back button present after first step.
- Back button disabled.
- Back button enabled.
- Checkout/add-to-cart loading state, if represented by existing CSS state.
- CTA text long enough to wrap or overflow.

### Sidebar shell states

- Sidebar shorter than viewport.
- Sidebar taller than viewport.
- Selected-product list overflow.
- Product grid scrolls while sidebar remains sticky.
- Sidebar internal list scrolls without shifting CTA area.
- Sidebar at top of page.
- Sidebar after page scroll.
- Browser zoom at 100% and 125%.
- OS scrollbar visible and overlay scrollbar environments.

### Accessibility interaction states

- Keyboard focus-visible on clear button.
- Keyboard focus-visible on product remove button.
- Keyboard focus-visible on back/next buttons.
- Hover-capable pointer behavior.
- Touch-capable desktop or hybrid device behavior.
- Reduced-motion preference, if existing CSS supports motion reduction.

---

## Agentic Workflow Rule

Every loop must follow this cycle:

1. Inspect current implementation.
2. Identify one parity gap.
3. Make the smallest CSS-only change.
4. Test in Chrome desktop viewport.
5. Compare against EB reference.
6. Check at least one adjacent template for regression.
7. Keep the change only if it improves parity without introducing cascade conflict.
8. Move to the next loop only after the current loop exit criteria are met.

Do not batch unrelated sidebar changes.

---

## Loop 0: Refactored Codebase Discovery

### Goal

Discover the current FPB desktop summary sidebar architecture without relying on old file paths or old selectors.

### Actions

- Search the codebase for current FPB summary sidebar components and styles.
- Identify current template/preset names and scopes.
- Identify shared sidebar CSS versus template-specific sidebar CSS.
- Identify the canonical desktop breakpoint.
- Identify existing state hooks for:
  - empty
  - loading
  - skeleton
  - selected
  - reached
  - unlocked
  - disabled
  - active
  - overflow
  - sticky
  - current step
- Identify whether sidebar styles are authored in static CSS, generated runtime CSS, CSS modules, theme variables, or a combination.
- Identify any existing CSS variables used by the sidebar.
- Identify any current cascade conflicts or duplicate sidebar rules.

### Exit criteria

- Current sidebar CSS ownership is mapped.
- Current template list is confirmed.
- Current state hooks are known.
- Current desktop breakpoint is known.
- No implementation change has been made yet.

---

## Loop 1: EB Desktop Sidebar Reference Capture

### Goal

Capture the target EB desktop sidebar behavior and measurements before editing CSS.

### Actions

Use Chrome with desktop viewport widths:

- 1024px
- 1200px
- 1280px
- 1366px
- 1440px
- 1536px
- 1728px
- 1920px

For each available FPB template/preset, capture EB reference screenshots and inspect:

- Sidebar width.
- Sidebar height.
- Sticky top offset.
- Sidebar padding.
- Sidebar border/radius/shadow/background.
- Header layout.
- Product row height.
- Product thumbnail size.
- Product row gap.
- Skeleton slot dimensions.
- Empty slot styling.
- Discount/progress block dimensions.
- Total section height.
- CTA area height.
- Internal scroll container height.
- Bottom spacing.
- Typography sizes and weights.
- Disabled/enabled CTA behavior.
- Reached/unreached discount behavior.

### Exit criteria

- EB target measurements are documented.
- EB reference screenshots are grouped by template and state.
- No implementation change has been made in this loop.

---

## Loop 2: Shared Desktop Sidebar Shell

### Goal

Normalize the shared desktop sidebar shell across FPB templates while preserving template-specific differences.

### Actions

Inside desktop-only media queries, align shared sidebar behavior for:

- Desktop visibility.
- Width basis.
- Sticky positioning.
- Top offset.
- Height and max-height.
- Internal box sizing.
- Border, background, and radius if shared across templates.
- Safe scroll behavior.
- Separation from product grid.
- CTA staying visible while selected products scroll.

Do not apply template-specific dimensions in shared CSS unless all templates intentionally share them.

### Chrome test

For every template:

- Open the storefront at 1024px, 1366px, and 1440px.
- Scroll the product grid.
- Confirm sidebar sticky behavior.
- Confirm sidebar does not overlap content.
- Confirm no horizontal overflow.
- Confirm mobile footer is not affected below the desktop breakpoint.

### Exit criteria

- Shared sidebar shell is stable.
- Sidebar is correctly positioned on desktop.
- Product grid and sidebar coexist without overlap.
- No mobile regression is introduced.

---

## Loop 3: Sidebar Header and Count Area

### Goal

Bring sidebar header, subtitle, clear/reset action, and item-count area to EB parity.

### Actions

Align:

- Sidebar title typography.
- Subtitle typography and spacing.
- Header row grid/flex structure.
- Clear/reset button size, placement, color, border, and hover/focus states.
- Item-count text placement.
- Empty count state.
- Count updates after add/remove.
- Long title/subtitle behavior.

Use only existing markup and state classes.

### Chrome test

For each template:

- Empty selection.
- One item selected.
- Multiple items selected.
- Clear button hover.
- Clear button keyboard focus.
- Clear action triggered, if available.

### Exit criteria

- Header and count area match EB reference.
- Clear/reset control remains accessible and tappable/clickable.
- Long text does not break the sidebar.

---

## Loop 4: Discount and Progress Section

### Goal

Align the summary sidebar discount/progress messaging with EB for all internal discount states.

### Actions

Style existing progress/message states for:

- No discount.
- Simple progress.
- Step-based progress.
- Multiple tiers.
- 0% progress.
- Partial progress.
- Reached progress.
- Reached message.
- Unreached message.
- Hidden/suppressed progress state.

Verify:

- Progress track height.
- Fill behavior.
- Step label spacing.
- Tier text alignment.
- Message color and typography.
- Reached state visual treatment.
- Spacing around the progress block.

### Chrome test

For each template:

- Load an unreached discount scenario.
- Add items until near threshold.
- Add items until threshold is reached.
- Remove items to return below threshold.
- Verify no stale reached styling remains.

### Exit criteria

- Discount progress visually matches EB for all states.
- Reached/unreached state transitions do not leave layout artifacts.
- Progress does not overflow or compress product rows incorrectly.

---

## Loop 5: Empty Slots and Skeleton States

### Goal

Align the empty-slot and skeleton portions of the sidebar with EB.

### Actions

Style current empty/skeleton row elements for:

- Required empty slots.
- Optional empty slots.
- Loading skeleton rows.
- Placeholder image/thumb area.
- Placeholder text lines.
- Placeholder remove/action area, if present.
- Number of visible placeholder rows.
- Transition from empty slot to selected item.
- Transition from selected item to empty slot.

Avoid creating artificial placeholder markup. Use only what exists.

### Chrome test

For each template:

- Initial empty state.
- Loading state if reproducible.
- One selected item plus remaining empty slots.
- Full selection with no empty slots.
- Remove item and verify empty slot returns cleanly.

### Exit criteria

- Empty and skeleton states match EB structure.
- Placeholder rows do not distort sidebar height.
- Empty slots do not conflict with selected product rows.

---

## Loop 6: Selected Product Rows

### Goal

Bring selected-product rows to EB parity across all row states.

### Actions

Align:

- Row display model.
- Row height.
- Row gap.
- Thumbnail size and radius.
- Product title typography.
- Variant text typography.
- Price typography.
- Quantity badge placement.
- Original/final price layout.
- Remove button size, color, hover, and focus state.
- Missing image fallback.
- Long title truncation.
- Multiple-variant display.
- Quantity greater than one display.

### Chrome test

For each template:

- Product with short title.
- Product with long title.
- Product with variant.
- Product without variant.
- Product with quantity one.
- Product with quantity greater than one.
- Product with missing/fallback image.
- Remove product.

### Exit criteria

- Product rows match EB reference.
- Long text truncates without breaking layout.
- Remove controls are visible and usable.
- Product row list remains scroll-safe.

---

## Loop 7: Product List Overflow and Internal Scroll

### Goal

Ensure the selected-products area scrolls internally while the CTA and total area remain usable.

### Actions

Align:

- Product list max-height.
- Overflow-y behavior.
- Scrollbar behavior.
- Bottom padding inside scroll area.
- Top/bottom fade behavior, if existing.
- Sidebar height when viewport is shorter.
- Sidebar height when viewport is taller.
- CTA sticking to bottom of sidebar content.

Do not force the entire page to scroll just to access sidebar CTA if EB keeps the CTA fixed within the sidebar.

### Chrome test

For each template:

- Add enough products to overflow the sidebar list.
- Scroll the selected-products list independently.
- Scroll the page/product grid.
- Confirm CTA remains visible.
- Confirm no row is hidden behind totals/CTA.

Test viewport heights:

- 700px
- 768px
- 800px
- 900px
- 1080px

### Exit criteria

- Product list overflow is contained.
- CTA and totals remain visible.
- Sidebar does not exceed viewport in a way that makes actions unreachable.

---

## Loop 8: Free Gift, Add-On, and Upsell States

### Goal

Align free-gift, add-on, and upsell/sidebar message states with EB.

### Actions

Style existing elements for:

- Free gift locked.
- Free gift unlocked.
- Free gift selected.
- Free gift automatically included.
- Free gift price/free label.
- Original price on free gift.
- Add-on message present.
- Add-on message absent.
- Upsell slot unreached.
- Upsell slot reached.

Verify these states do not displace the product list or CTA area unexpectedly.

### Chrome test

For each template:

- Start below free-gift threshold.
- Reach free-gift threshold.
- Select/remove free gift if applicable.
- Add/remove regular items after free gift unlock.
- Verify totals and row layout remain correct.

### Exit criteria

- Free-gift and add-on states match EB reference.
- Locked/unlocked state transitions are visually clean.
- Sidebar layout remains stable after threshold changes.

---

## Loop 9: Box Selection and Tier CTA States

### Goal

Align any sidebar box-selection or tier CTA UI with EB.

### Actions

Only if the template/flow exposes these elements, align:

- Box option row/button layout.
- Active option state.
- Inactive option state.
- Disabled option state.
- Tier CTA block.
- Tier CTA text wrapping.
- Spacing before/after the box/tier area.
- Interaction states for hover and focus-visible.

If the current flow does not expose box/tier elements, document that the state is not applicable for that template.

### Chrome test

For each template where applicable:

- Active tier.
- Inactive tier.
- Disabled tier.
- Long tier label.
- Tier switch if supported.

### Exit criteria

- Box/tier UI matches EB where applicable.
- Non-applicable templates are documented.
- No layout regression appears in templates without box/tier UI.

---

## Loop 10: Totals, Divider, and CTA Area

### Goal

Align the lower summary section with EB across all CTA and total states.

### Actions

Align:

- Divider spacing.
- Subtotal/total label.
- Original total.
- Final total.
- Discounted total.
- Button group layout.
- Next/checkout CTA size.
- Back button size.
- Button gap.
- Disabled opacity.
- Enabled hover/focus states.
- Loading state if represented by existing CSS.
- Long CTA label handling.

CTA must remain visible and usable in all sidebar content states.

### Chrome test

For each template:

- No items selected.
- Required items not met.
- Required items met.
- Discount reached.
- Back button absent.
- Back button present.
- CTA hover.
- CTA focus-visible.
- Long CTA text.

### Exit criteria

- Totals and CTA area match EB.
- CTA never gets pushed off-screen by sidebar content.
- Disabled/enabled visual states are correct.

---

## Loop 11: Standard Template Desktop Sidebar

### Goal

Apply template-specific sidebar parity for Standard.

### Actions

Inside Standard’s current template scope and desktop media query:

- Align Standard sidebar width and height.
- Align Standard product rows.
- Align Standard progress and discount block.
- Align Standard totals and CTA.
- Align Standard empty/skeleton state.
- Align Standard spacing relative to product grid.

### Chrome test

Run the full internal state matrix for Standard at:

- 1024px
- 1280px
- 1366px
- 1440px
- 1920px

### Exit criteria

- Standard passes the desktop summary sidebar state matrix.
- Changes do not affect other templates.

---

## Loop 12: Classic Template Desktop Sidebar

### Goal

Apply template-specific sidebar parity for Classic.

### Actions

Inside Classic’s current template scope and desktop media query:

- Align Classic sidebar dimensions.
- Align Classic header and clear action.
- Align Classic progress block.
- Align Classic selected product rows.
- Align Classic empty/skeleton slots.
- Align Classic total and CTA area.
- Resolve any Classic-specific cascade conflicts cleanly.

If Classic has runtime-injected CSS or higher-specificity generated styles, do not bury the issue under broad overrides. Reconcile ownership or document the blocker.

### Chrome test

Run the full internal state matrix for Classic at:

- 1024px
- 1280px
- 1366px
- 1440px
- 1920px

### Exit criteria

- Classic passes the desktop summary sidebar state matrix.
- Runtime/static CSS conflicts are resolved or documented.
- Changes do not affect other templates.

---

## Loop 13: Compact Template Desktop Sidebar

### Goal

Apply template-specific sidebar parity for Compact while preserving Compact’s intended density.

### Actions

Inside Compact’s current template scope and desktop media query:

- Align Compact sidebar width and compact spacing.
- Align Compact selected product rows.
- Align Compact empty/skeleton state.
- Align Compact progress block.
- Align Compact free-gift/add-on states.
- Align Compact totals and CTA.
- Ensure Compact does not clip text or controls due to reduced spacing.

### Chrome test

Run the full internal state matrix for Compact at:

- 1024px
- 1280px
- 1366px
- 1440px
- 1920px

### Exit criteria

- Compact passes the desktop summary sidebar state matrix.
- Compact remains compact without clipping controls or text.
- Changes do not affect other templates.

---

## Loop 14: Horizontal Template Desktop Sidebar

### Goal

Apply template-specific sidebar parity for Horizontal.

### Actions

Inside Horizontal’s current template scope and desktop media query:

- Align Horizontal sidebar position relative to the horizontal product layout.
- Align Horizontal sidebar dimensions.
- Align Horizontal selected product rows.
- Align Horizontal empty/skeleton state.
- Align Horizontal progress block.
- Align Horizontal totals and CTA.
- Confirm horizontal layout does not create horizontal page overflow.

### Chrome test

Run the full internal state matrix for Horizontal at:

- 1024px
- 1280px
- 1366px
- 1440px
- 1920px

### Exit criteria

- Horizontal passes the desktop summary sidebar state matrix.
- No horizontal overflow appears.
- Changes do not affect other templates.

---

## Loop 15: Cross-Template Regression Matrix

### Goal

Confirm every template passes every sidebar state after all template-specific passes.

### Required template matrix

- Standard
- Classic
- Compact
- Horizontal
- Any additional FPB templates discovered in the current codebase

### Required viewport matrix

- 1023px as desktop-breakpoint guard
- 1024px
- 1200px
- 1280px
- 1366px
- 1440px
- 1536px
- 1728px
- 1920px

### Required state matrix

For each template and viewport, verify:

- Empty state.
- Loading/skeleton state.
- One selected product.
- Multiple selected products.
- Product-list overflow.
- Long title.
- Variant present.
- Quantity greater than one.
- Product removal.
- Discount unreached.
- Discount reached.
- Free gift locked.
- Free gift unlocked.
- Add-on/upsell state, if applicable.
- Box/tier state, if applicable.
- CTA disabled.
- CTA enabled.
- Back button absent.
- Back button present.
- Sidebar sticky while page scrolls.
- Product grid scroll at top, middle, and bottom.

### Exit criteria

- All templates pass the full matrix.
- No template inherits another template’s dimensions accidentally.
- No desktop sidebar changes affect mobile footer behavior.
- No horizontal overflow is present.

---

## Loop 16: CSS Cascade Cleanup

### Goal

Ensure the final CSS is maintainable and refactor-safe.

### Actions

- Remove duplicate sidebar declarations.
- Merge competing rules where possible.
- Move shared rules into shared sidebar CSS only if they are truly shared.
- Move template-only rules into template scope.
- Keep desktop-only rules inside desktop media queries.
- Remove unused or superseded declarations.
- Verify no new classes were added unless documented.
- Verify no JS was changed.
- Verify no unrelated selectors were modified.
- Verify no competitor-specific namespace or class name was introduced.
- Run formatting and lint checks available in the repo.
- Run `git diff --check`.

### Exit criteria

- CSS diff is scoped and understandable.
- No avoidable `!important` remains.
- No conflicting duplicate declarations remain.
- No unrelated files or features were changed.

---

## Loop 17: Final Chrome Acceptance Pass

### Goal

Produce final evidence that the desktop summary sidebar parity slice is complete.

### Actions

For every FPB template:

1. Open storefront in Chrome.
2. Test at the full desktop viewport matrix.
3. Capture collapsed/base sidebar state, if applicable.
4. Capture empty state.
5. Capture selected-product state.
6. Capture overflow state.
7. Capture discount unreached state.
8. Capture discount reached state.
9. Capture free-gift/add-on state, if applicable.
10. Capture CTA disabled state.
11. Capture CTA enabled state.
12. Scroll product grid and confirm sticky behavior.
13. Remove products and confirm sidebar returns to empty/skeleton state cleanly.
14. Confirm mobile breakpoint guard at 1023px and desktop entry at 1024px.

### Exit criteria

- Final screenshots exist for each template and major state.
- All acceptance criteria pass.
- No known desktop or mobile regressions remain.

---

## Global Stopping Criteria

Stop only when all of the following are true:

1. Every FPB desktop template has summary sidebar parity with EB.
2. Sidebar shell, header, progress, product rows, empty slots, free gift/add-on area, totals, and CTA all match the EB reference for each template.
3. All internal states in the sidebar state matrix have been tested.
4. Selected-product overflow scrolls internally and does not hide CTA or totals.
5. Sidebar sticky behavior works while the product grid scrolls.
6. Desktop changes are scoped to desktop media queries.
7. Mobile footer, mobile bottom sheet, and mobile summary tray remain unaffected.
8. No JavaScript was changed.
9. No new CSS classes were introduced unless documented as unavoidable.
10. No unrelated product-card, modal, banner, tab, or checkout styling was changed.
11. No horizontal overflow exists at any tested desktop viewport.
12. Disabled, enabled, hover, and focus-visible states are visually correct.
13. Empty, loading, skeleton, selected, overflow, reached, unreached, locked, unlocked, and removed states are visually correct.
14. Final CSS has no avoidable duplicate/conflicting declarations.
15. Final Chrome screenshots confirm parity for all templates.

---

## Blocker Rules

### Missing state hook

If a sidebar internal state exists in EB but the current storefront does not expose any CSS-addressable class, attribute, or DOM state for it, stop that specific state and document:

> Blocked: this sidebar state cannot be completed as a CSS-only task because the current storefront does not expose a CSS-addressable state hook.

Do not add JavaScript in this slice.

### Missing template parity target

If a template exists in the refactored codebase but no matching EB reference can be reproduced, document:

> Blocked: this template’s sidebar parity target could not be verified because the EB reference state/template was not available for comparison.

Do not invent target dimensions without a reference.

### Cascade conflict

If generated/runtime CSS prevents clean static CSS parity and would require broad `!important` overrides, document:

> Blocked: clean CSS parity is prevented by higher-specificity generated/runtime sidebar styles. CSS ownership must be reconciled before continuing.

Do not bury the conflict under broad overrides.

---

## Deliverable Expected From Codex

The final implementation PR should include:

1. A concise summary of desktop summary sidebar parity changes.
2. The list of FPB templates tested.
3. The list of desktop viewport widths tested.
4. The internal state matrix tested.
5. Screenshots or visual evidence for each template.
6. Any documented blockers or non-applicable states.
7. Confirmation that mobile footer behavior was not changed.
8. Confirmation that only existing CSS was modified.

---

## Implementation Notes

### Loop 0: Refactored Codebase Discovery

- Current FPB desktop templates are confirmed from `app/assets/widgets/full-page/templates/registry.js`: Standard (`id=STANDARD`, `presetId=DEFAULT`, aliases `DEFAULT`, `STANDARD`, `DEFAULT_FBP`), Classic (`CLASSIC`), Compact (`COMPACT`), and Horizontal (`HORIZONTAL`).
- Storefront template CSS assets are mapped in `extensions/bundle-builder/blocks/bundle-full-page.liquid` and `extensions/bundle-builder/blocks/bundle-app-embed.liquid`: `bundle-widget-full-page-standard.css`, `bundle-widget-full-page-classic.css`, `bundle-widget-full-page-compact.css`, and `bundle-widget-full-page-horizontal.css`.
- Desktop runtime sidebar DOM is owned by `app/assets/widgets/full-page/methods/side-panel-methods.js`, which renders `.full-page-side-panel`, `.side-panel-header`, `.side-panel-clear-btn`, `.side-panel-subtitle`, `.fpb-sidebar-tier-cta`, `.fpb-box-selection-wrapper`, `.side-panel-discount-message`, `.fpb-discount-progress.fpb-dp-sidebar`, `.side-panel-item-count`, `.side-panel-products`, `.side-panel-total`, `.side-panel-action-container`, `.side-panel-nav`, and `.side-panel-btn-next`.
- Supporting state/render helpers are in `app/assets/widgets/full-page/methods/mobile-summary-methods.js` (`_isStandardDesktopSidebar`, `createStandardSidebarSelectedRow`, `createStandardSidebarDiscountProgress`), `validation-addons-methods.js` (`_renderFreeGiftSection`, `_renderStandardSidebarEmptySlots`, `_renderSidebarProductSkeletons`), and `box-selection-sidebar-methods.js` (`renderBoxSelectionOptions`, `renderClassicSidebarSlots`).
- Shared desktop/sidebar CSS ownership is split across `app/assets/widgets/full-page-css/base/toast-sidebar-shell.css`, `base/sidebar-totals-discounts.css`, and `base/floating-badge-sidebar-progress.css`.
- Template-specific desktop CSS ownership:
  - Standard: `app/assets/widgets/full-page-css/templates/side-footer-standard.css`.
  - Classic: `app/assets/widgets/full-page-css/templates/classic/desktop-sidebar.css` plus `side-footer-classic.css` import aggregation.
  - Compact: `app/assets/widgets/full-page-css/templates/side-footer-compact.css`.
  - Horizontal: `app/assets/widgets/full-page-css/templates/side-footer-horizontal.css`.
- Canonical desktop breakpoint for most current FPB sidebar work is `@media (min-width:1024px)`. Horizontal also has a broad `@media (min-width:769px)` block, so desktop parity changes must be careful not to affect tablet-width behavior unless verified.
- Existing CSS-addressable state hooks:
  - Template/root scopes: `.layout-sidebar`, `.fpb-preset-classic`, `.fpb-h`, `.fpb-d`, `[data-fpb-design-preset=DEFAULT|CLASSIC|COMPACT|HORIZONTAL]`, `[data-fpb-card-cta-mode=icon]`.
  - Selected rows: `.side-panel-product-row`, `.side-panel-product-slot`, `.bw-selected-row--free-gift`, `.bw-selected-slot--free-gift`, `.side-panel-qty-badge`, `.side-panel-product-remove`.
  - Empty/skeleton rows: `.side-panel-skeleton-slots`, `.side-panel-skeleton-slot`, `.side-panel-skeleton-slot--standard-empty`, `.side-panel-product-slot--empty`, `.classic-sidebar-slot--empty`.
  - Discount/progress: `.side-panel-discount-message`, `.fpb-discount-progress`, `.fpb-dp-sidebar`, `.fpb-dp-step_based`, `.fpb-dp-simple`, `.reached`, `.bw-discount-progress--success`, `.bw-discount-progress__milestone--reached`, `.fpb-discount-step-reached`.
  - Free gift/add-on: `.side-panel-free-gift`, `.side-panel-free-gift.unlocked`, `.side-panel-addon-message`.
  - Box/tier: `.fpb-box-selection-wrapper`, `.fpb-box-selection-option`, `.fpb-box-selection-option-active`, `.fpb-sidebar-tier-cta`, `.bundle-tier-pill--active`, `.bundle-tier-pill--disabled`, `.bundle-tier-pill--loading`.
  - CTA/accessibility: native `:disabled`, `:hover`, `:focus-visible`, plus `.side-panel-btn-next` and `.side-panel-btn-back`.
- Current cascade concerns to watch:
  - Standard has broad `.layout-sidebar ...` rules early in `side-footer-standard.css`, then more specific `[data-fpb-design-preset=DEFAULT]` rules later.
  - Classic desktop sidebar uses `.fpb-preset-classic` scoping and theme variables.
  - Horizontal sidebar CSS has desktop rules starting at `min-width:769px` and separate mobile summary tray rules outside a desktop media query.
  - Compact desktop sidebar currently has many product-card `!important` declarations; avoid broadening those for sidebar parity unless a specific cascade conflict is proven.
- Loop 0 made no CSS or JS implementation changes.

### Loop 1: EB/WPB Desktop Sidebar Evidence and First Horizontal Slice

- Captured EB FPB desktop sidebar at 1440x900:
  - Screenshot: `/private/tmp/eb-fpb-desktop-sidebar-loop1-1440-selected.png`.
  - Focused metrics: `/private/tmp/eb-fpb-desktop-sidebar-loop1-1440-selected-focused.json`.
- EB selected-state sidebar reference at 1440:
  - Shell `.gbbPageFooterHTML`: `466.828px` wide, `619.375px` high, `position:sticky`, `top:90px`, `padding:20px`, `border:1px solid #e3e3e3`, `border-radius:10px`, white background.
  - Grid rows: `55px 108.578px 298.797px 100px`, `gap:5px`.
  - Header inner width: `424.828px`; title `25px/30px/700`; subtitle `14px/20px`.
  - Product list area: `260px` high, `padding-right:10px`, selected row `96px` high with `75px` image column and `9px` gap.
- Captured WPB Horizontal FPB desktop before CSS slice:
  - Empty screenshot: `/private/tmp/wpb-fpb-desktop-sidebar-loop1-1440-empty.png`.
  - Empty metrics: `/private/tmp/wpb-fpb-desktop-sidebar-loop1-1440-empty-focused.json`.
  - Selected screenshot: `/private/tmp/wpb-fpb-desktop-sidebar-loop1-1440-selected.png`.
  - Selected metrics: `/private/tmp/wpb-fpb-desktop-sidebar-loop1-1440-selected-focused.json`.
- Important discovery: the active agent storefront parity page is `data-fpb-design-preset="HORIZONTAL"`, not Standard. It loads `bundle-widget-full-page-horizontal.css`.
- Implemented first CSS-only Horizontal desktop sidebar slice in `app/assets/widgets/full-page-css/templates/side-footer-horizontal.css`:
  - Added desktop-only `@media (min-width:769px)` override for the EB-like summary shell.
  - Matched shell width/height/rows/padding/border/radius/background/top offset.
  - Repositioned direct sidebar sections into the EB row structure.
  - Hid `.fpb-mobile-bottom-sheet.fpb-mobile-summary-tray` on desktop to stop the mobile summary tray leaking into desktop.
  - Rebuilt generated asset: `extensions/bundle-builder/assets/bundle-widget-full-page-horizontal.css`.
- Live verification after the first rebuild confirmed:
  - Metrics: `/private/tmp/wpb-fpb-desktop-sidebar-loop1-1440-after-css3-empty.json`.
  - `.full-page-side-panel`: `466.828px x 619.375px`, `top:90px`, `border:1px solid rgb(227, 227, 227)`, `border-radius:10px`, `background:white`, grid rows `55px 108.562px 298.797px 100px`.
  - `.fpb-mobile-bottom-sheet.fpb-mobile-summary-tray`: `display:none` at 1440 after cache propagation.
- Follow-up correction verified after CDN propagation:
  - Direct grid children now explicitly span `grid-column:1 / -1` to prevent the shell from creating an implicit second grid column.
  - Final selected metrics: `/private/tmp/wpb-fpb-desktop-sidebar-loop1-1440-final-selected.json`.
  - Final selected screenshot: `/private/tmp/wpb-fpb-desktop-sidebar-loop1-1440-final-selected.png`.
  - Live active panel now reports one grid column `424.828px`, rows `55px 108.562px 298.797px 100px`, and the desktop mobile tray remains `display:none`.
