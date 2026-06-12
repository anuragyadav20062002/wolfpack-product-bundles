# Agentic Loop Plan: FPB Mobile Storefront Footer CSS Parity

## Purpose

Create a CSS-only parity slice for the FPB storefront footer across all FPB templates in mobile viewport. The target outcome is that every FPB mobile footer visually and behaviorally matches the EB footer model for collapsed state, expanded state, internal expand-collapse interaction, selected-product display, progress/discount messaging, CTA behavior, and responsive viewport handling.

This plan is intentionally codebase-agnostic. It must be usable after major refactors and must not rely on prior file names, prior selectors, prior screenshots, or prior implementation assumptions. The agent must discover the current implementation before making changes.

---

## Scope

### Templates in scope

Apply the parity pass to every FPB storefront template that renders a mobile footer, including:

1. FPB Standard
2. FPB Classic
3. FPB Compact
4. FPB Horizontal

If the current codebase has renamed these templates, map them to the equivalent FPB full-page storefront templates and document the mapping in the implementation notes.

### Viewport scope

This is a mobile-only task.

All new or modified mobile footer styling must be constrained to mobile media queries. Prefer the project’s existing mobile breakpoint convention. If multiple mobile breakpoints exist, use the one already governing the FPB footer. Do not introduce a new breakpoint unless the current breakpoint structure cannot safely express the required behavior.

### Implementation scope

Allowed:

- Modify existing CSS.
- Refactor existing footer-related CSS to remove conflicts.
- Move mobile footer declarations into the correct mobile media query when they are currently leaking globally.
- Reuse existing state classes, attributes, selectors, custom properties, and DOM structure.
- Adjust responsive dimensions, spacing, overflow, positioning, transitions, z-index, and visibility rules for the FPB mobile footer.

Not allowed:

- No JavaScript changes.
- No runtime logic changes.
- No template markup changes unless a blocker is found and explicitly reported instead of silently worked around.
- No new CSS classes unless absolutely necessary.
- No desktop/tablet parity changes.
- No product-card, modal, banner, tab, drawer, or non-footer styling unless directly required to prevent the mobile footer from covering content.
- No competitor-specific identifiers, comments, or naming conventions.
- No broad global resets.
- No duplicate CSS properties that fight over the same element and state.

---

## Primary Goal

For each FPB template, make the mobile storefront footer match the EB footer interaction and layout model:

1. A stable collapsed footer is visible at the bottom of the viewport.
2. The existing storefront interaction expands and collapses the footer’s internal content area.
3. The expanded footer reveals selected products, empty slots or skeletons, discount/progress messaging, totals, navigation, remove controls, and any free-gift state supported by the current product flow.
4. The expanded content scrolls internally when needed.
5. The CTA remains visible and tappable in both collapsed and expanded states.
6. The footer does not introduce horizontal overflow.
7. The footer does not hide the last product row or any critical mobile controls.
8. All styling changes remain CSS-only and mobile-scoped.

---

## Non-Goals

Do not attempt to:

- Rebuild the footer architecture.
- Add new interaction logic.
- Add new footer components.
- Change template data flow.
- Change cart, bundle, discount, free-gift, or step-navigation logic.
- Change desktop side panels.
- Change PPB templates.
- Change unrelated product cards.
- Match EB internals exactly; the goal is storefront visual and behavioral parity using the current Wolfpack architecture.

---

## Required Footer States

The final implementation must handle these states for each FPB template:

1. Collapsed, no products selected.
2. Expanded, no products selected.
3. Collapsed, one product selected.
4. Expanded, one product selected.
5. Collapsed, multiple products selected.
6. Expanded, multiple products selected.
7. Expanded with product-list overflow.
8. Product row with long title.
9. Product row with variant label or subtitle.
10. Product row with quantity badge.
11. Product row with remove control.
12. Empty slot or skeleton slot.
13. Discount not reached.
14. Discount reached.
15. CTA disabled.
16. CTA enabled.
17. First step with no back action.
18. Later step with back action.
19. Free gift locked, if supported.
20. Free gift unlocked, if supported.
21. Expanded footer collapsed again without stale spacing.
22. Product removed while footer is expanded.
23. Product added while footer is collapsed.
24. Product added while footer is expanded.

---

## Required Browser Test Viewports

Test in Chrome mobile emulation at minimum:

- 320px wide
- 360px wide
- 375px wide
- 390px wide
- 414px wide
- 430px wide
- 767px wide
- One pixel above the mobile breakpoint as a guard check

Also test at least one real or simulated modern tall mobile viewport, because footer expansion often fails when height assumptions are too rigid.

---

## Agentic Loop Contract

Every loop must follow this cycle:

1. Inspect the current implementation.
2. Identify the smallest parity gap for the current loop.
3. Modify existing CSS only.
4. Keep mobile-only declarations inside mobile media queries.
5. Reuse existing selectors and state hooks.
6. Test in Chrome.
7. Compare collapsed and expanded behavior against the EB model.
8. Remove any duplicate or conflicting declarations created during the loop.
9. Stop the loop only when its acceptance criteria pass.

Do not combine unrelated fixes in one loop. Footer shell, expand-collapse, product rows, discount progress, CTA, and template-specific rules must be treated as separate loops.

---

# Loop 0: Discovery and Guardrail Setup

## Goal

Understand the current refactored footer implementation without relying on old file names, old selectors, or old CSS structure.

## Actions

1. Search the codebase for FPB mobile footer rendering and styling.
2. Identify the current CSS ownership boundaries:
   - Shared FPB footer CSS.
   - Template-specific FPB footer CSS.
   - Runtime-injected CSS, if any.
   - Theme/global CSS that affects the footer.
3. Identify the current mobile breakpoint convention.
4. Identify the existing state hooks used for:
   - Collapsed footer.
   - Expanded footer.
   - Open bottom sheet or tray.
   - Backdrop active state.
   - Disabled CTA.
   - Discount reached.
   - Empty selected-products state.
   - Product row removal state.
   - Free-gift state.
5. Identify whether the footer interaction already toggles an open/expanded class, attribute, or equivalent state hook.
6. Identify all existing footer variants across the FPB templates.
7. Identify duplicate or conflicting footer rules.
8. Create a short implementation note with current selector/state mapping.

## Rules

- Do not make any CSS changes in this loop.
- Do not assume prior selectors still exist.
- Do not assume prior template file locations still exist.

## Acceptance criteria

- Current footer architecture is mapped.
- Current template coverage is mapped.
- Current mobile breakpoint is known.
- Existing interaction state hooks are known.
- Any missing state hook blocker is documented.

---

# Loop 1: EB Mobile Footer Behavior Capture

## Goal

Define the parity target based on storefront behavior, not old implementation details.

## Actions

In Chrome mobile emulation, inspect the EB footer behavior for equivalent FPB flows and capture:

1. Collapsed footer layout.
2. Expanded footer layout.
3. Internal expand-collapse interaction.
4. Product row layout.
5. Empty/skeleton slot layout.
6. Discount/progress behavior.
7. CTA disabled and enabled behavior.
8. Back button and next button behavior.
9. Remove control behavior.
10. Product-list overflow behavior.
11. Free-gift locked/unlocked behavior, if present.
12. Safe-area and bottom inset behavior.

Record only behavioral and visual metrics, such as:

- Footer collapsed height.
- Footer expanded height or max-height.
- Footer width and horizontal margins.
- Bottom offset.
- Border radius.
- Padding.
- Gap between major footer sections.
- Product row height.
- Thumbnail size.
- CTA height.
- CTA alignment.
- Progress area height.
- Internal scroll region.
- Backdrop behavior.
- Transition duration and direction.

## Rules

- Do not copy implementation internals.
- Do not introduce competitor-specific identifiers into the codebase.
- Use EB only as the visual/behavioral target.

## Acceptance criteria

- EB target behavior is documented in implementation notes.
- Mobile viewport measurements are available.
- Required footer states are understood before coding begins.

---

# Loop 2: Shared Mobile Footer Shell

## Goal

Create a stable shared mobile footer shell that works across all FPB templates.

## Actions

Modify only existing shared footer CSS inside the mobile media query.

Normalize these footer-shell behaviors:

1. Mobile footer visibility.
2. Desktop side panel or desktop footer suppression on mobile, if applicable.
3. Fixed or sticky bottom positioning.
4. Safe-area bottom padding.
5. Footer width and edge spacing.
6. Footer border radius.
7. Footer z-index relative to product grid, backdrop, modals, toasts, and floating badges.
8. Collapsed footer height.
9. Expanded footer max-height.
10. Body or content bottom padding so the footer does not hide the final product row.
11. Horizontal overflow prevention.
12. Stable box sizing.

## Rules

- Only place declarations here if they are truly shared by all FPB mobile footer templates.
- If a rule differs by template, defer it to the relevant template loop.
- Do not create template-specific behavior in shared CSS.

## Chrome tests

For every FPB template:

1. Load storefront at each required mobile viewport.
2. Verify the footer appears at the bottom.
3. Verify there is no horizontal scrollbar.
4. Scroll to the final product row and confirm it is not hidden behind the footer.
5. Verify no desktop footer or side panel is visible on mobile unless intentionally part of the mobile design.

## Acceptance criteria

- Shared footer shell is stable for all FPB templates.
- No horizontal overflow is introduced.
- No desktop or tablet layout changes occur.
- No template-specific visual decisions are added to shared CSS.

---

# Loop 3: Expand-Collapse State Styling

## Goal

Make the existing footer interaction reveal and hide the footer’s internal content area like EB.

## Actions

1. Trigger the mobile footer toggle in Chrome.
2. Confirm the current codebase exposes an open/expanded state hook.
3. Style the collapsed and expanded states using only existing hooks.
4. Ensure the expanded content area appears above or within the footer as intended.
5. Ensure the expanded section has a bounded height.
6. Ensure selected-product content scrolls internally when too tall.
7. Ensure the collapsed footer restores exact collapsed geometry after closing.
8. Style the existing caret, chevron, toggle label, or equivalent visual indicator using the existing open state.
9. Style the existing backdrop only if it already exists.
10. Verify the CTA remains visible and usable in both states.

## Blocker rule

If the current interaction does not expose any usable open/expanded state hook, stop and report:

> Blocked: CSS can style the expanded footer state, but the current storefront interaction does not expose an existing open/expanded state hook. Runtime must toggle an existing or newly agreed state hook before CSS-only parity can be completed.

Do not add JavaScript in this parity slice.

## Chrome tests

For every FPB template:

1. Tap toggle to expand.
2. Tap toggle again to collapse.
3. Add a product while collapsed.
4. Add a product while expanded.
5. Remove a product while expanded.
6. Open with many selected products and scroll the internal list.
7. Collapse after scrolling internally.
8. Reopen and verify layout resets correctly.

## Acceptance criteria

- Expand-collapse uses existing interaction state.
- Expanded content is visible and internally scrollable.
- Collapsed state fully restores.
- CTA remains visible and tappable.
- No JavaScript was changed.

---

# Loop 4: Shared Selected-Product Content

## Goal

Normalize selected-product display inside the expanded mobile footer where behavior is shared across templates.

## Actions

Inside mobile-scoped CSS only, adjust shared selected-product primitives for:

1. Product row layout.
2. Thumbnail size.
3. Product title truncation.
4. Variant/subtitle truncation.
5. Quantity badge size and position.
6. Price display.
7. Remove control size and tap target.
8. Empty slot or skeleton slot presentation.
9. Product-list scrolling.
10. Product-list spacing and bottom padding.

## Rules

- Shared row behavior may be implemented globally only if all templates use the same structure.
- If a template uses a distinct row style, defer its geometry to the template loop.
- Do not hide content merely to make spacing fit unless EB also hides it in the same state.

## Chrome tests

For every FPB template:

1. One selected product.
2. Multiple selected products.
3. Long product name.
4. Product with variant label.
5. Product with quantity greater than one.
6. Remove product control.
7. Product list overflow.

## Acceptance criteria

- Product rows are legible and stable.
- Long text does not cause overflow.
- Remove controls are tappable.
- Product list scrolls internally.
- No template loses required information.

---

# Loop 5: Shared CTA, Total, and Navigation Behavior

## Goal

Normalize CTA, total, and navigation behavior for the mobile footer where the behavior is shared.

## Actions

Inside mobile-scoped CSS only, adjust shared footer action primitives for:

1. CTA height.
2. CTA width behavior.
3. CTA disabled state.
4. CTA enabled state.
5. Total label visibility.
6. Final price visibility.
7. Original/strikethrough price visibility, if present.
8. Discount badge visibility, if present.
9. Back button visibility and size.
10. Step navigation layout.
11. Button spacing.
12. Tap target sizes.

## Rules

- Preserve existing business logic around enabled/disabled state.
- Do not force-enable disabled CTAs through CSS.
- Do not hide back navigation if the current step flow requires it.
- Do not introduce duplicate button layout rules across shared and template-specific CSS.

## Chrome tests

For every FPB template:

1. First step, CTA disabled.
2. First step, CTA enabled.
3. Later step, back and next visible.
4. Discount applied with total updated.
5. Expanded and collapsed CTA states.
6. Narrowest viewport tap targets.

## Acceptance criteria

- CTA is visible and tappable in all valid states.
- Disabled state remains visually disabled.
- Back/next layout does not wrap badly or clip.
- Total/price area does not overflow.

---

# Loop 6: Shared Discount, Progress, and Free-Gift States

## Goal

Normalize discount/progress and free-gift state rendering where these states are shared across templates.

## Actions

Inside mobile-scoped CSS only, adjust existing state styles for:

1. Discount unreached message.
2. Discount reached message.
3. Progress track.
4. Progress fill.
5. Step-based discount milestones.
6. Free-gift locked state, if present.
7. Free-gift unlocked state, if present.
8. Success or reached-state banner, if present.
9. Empty-state messaging, if present.

## Rules

- Do not change discount logic.
- Do not change progress calculation.
- Do not create fake reached states in CSS.
- Do not hide progress on one template unless EB-equivalent behavior requires it.

## Chrome tests

For every FPB template:

1. No discount reached.
2. First threshold partially reached.
3. Threshold reached.
4. Multiple thresholds, if supported.
5. Free gift locked.
6. Free gift unlocked.
7. Expanded and collapsed rendering.

## Acceptance criteria

- Progress and messaging match the EB visual model.
- Reached/unreached states are clearly distinct.
- Free-gift states are visible and stable when supported.
- No progress layout clips inside the footer.

---

# Loop 7: Standard Template Mobile Footer

## Goal

Bring the Standard FPB mobile footer to EB parity using only Standard’s current template-specific CSS surface.

## Actions

Inside Standard’s mobile-scoped footer CSS only:

1. Align collapsed footer geometry.
2. Align expanded footer geometry.
3. Align product-list area.
4. Align empty/skeleton state.
5. Align selected-product rows.
6. Align total and CTA layout.
7. Align discount/progress area.
8. Align free-gift state if present.
9. Align internal spacing and border radius.
10. Remove duplicate Standard footer overrides that conflict with shared footer rules.

## Chrome tests

At all required mobile widths:

1. Empty collapsed.
2. Empty expanded.
3. One item selected.
4. Multiple items selected.
5. Overflow product list.
6. CTA disabled and enabled.
7. Discount reached and unreached.
8. Remove product.
9. Collapse after expanded scrolling.

## Acceptance criteria

- Standard footer matches EB-equivalent behavior.
- Standard does not regress other templates.
- Standard-specific CSS remains scoped to Standard mobile footer behavior.

---

# Loop 8: Classic Template Mobile Footer

## Goal

Bring the Classic FPB mobile footer to EB parity using only Classic’s current template-specific CSS surface.

## Actions

Inside Classic’s mobile-scoped footer CSS only:

1. Align collapsed footer or tray geometry.
2. Align expanded footer or tray geometry.
3. Align selected-product rows.
4. Align empty/skeleton rows.
5. Align discount/progress placement.
6. Align CTA size and typography.
7. Align total area.
8. Align remove controls.
9. Reconcile any Classic-specific runtime or template override conflicts.
10. Keep Classic-specific density and visual tone while matching EB behavior.

## Special caution

If Classic has runtime-injected CSS or higher-specificity template rules that conflict with the static CSS surface, do not layer excessive overrides. First try to modify the source rule that owns the behavior. If the owner cannot be identified or safely changed, document the blocker.

## Chrome tests

At all required mobile widths:

1. Collapsed state.
2. Expanded state.
3. No selected products.
4. Selected products.
5. Overflow product list.
6. Discount reached and unreached.
7. CTA disabled and enabled.
8. Remove product.
9. Expand-collapse repeat cycle.

## Acceptance criteria

- Classic footer matches EB-equivalent behavior.
- No runtime/static cascade conflict is left unresolved.
- Classic product-card layout is not affected.

---

# Loop 9: Compact Template Mobile Footer

## Goal

Bring the Compact FPB mobile footer to EB parity while preserving Compact’s intended denser mobile presentation.

## Actions

Inside Compact’s mobile-scoped footer CSS only:

1. Align compact collapsed footer height.
2. Align compact expanded footer height.
3. Ensure expanded content stays usable on short mobile screens.
4. Align selected-product rows.
5. Align empty/skeleton state.
6. Align total and CTA area.
7. Align discount/progress state.
8. Align free-gift state if present.
9. Ensure the footer does not cover the last product row.
10. Remove compact-specific cascade conflicts.

## Chrome tests

At all required mobile widths:

1. Empty state.
2. One item selected.
3. Multiple items selected.
4. Product-list overflow.
5. Long product title.
6. CTA disabled and enabled.
7. Discount reached and unreached.
8. Product removal.
9. Scroll-to-bottom grid check.

## Acceptance criteria

- Compact footer matches EB-equivalent behavior.
- Compact remains visually compact without clipping.
- Content below the footer remains reachable.

---

# Loop 10: Horizontal Template Mobile Footer

## Goal

Bring the Horizontal FPB mobile footer to EB parity while preserving Horizontal’s layout intent.

## Actions

Inside Horizontal’s mobile-scoped footer CSS only:

1. Align collapsed footer bar.
2. Align expanded footer content.
3. Align selected-product row or horizontal item treatment.
4. Align empty/skeleton state.
5. Align progress/discount state.
6. Align total and CTA area.
7. Align remove controls.
8. Prevent horizontal viewport overflow.
9. Ensure internal scrolling happens in the footer content region, not the page body.
10. Remove horizontal-specific cascade conflicts.

## Chrome tests

At all required mobile widths:

1. Empty collapsed.
2. Empty expanded.
3. Selected collapsed.
4. Selected expanded.
5. Product-list overflow.
6. Long product title.
7. CTA disabled and enabled.
8. Discount reached and unreached.
9. Remove product.
10. Expand-collapse repeat cycle.

## Acceptance criteria

- Horizontal footer matches EB-equivalent behavior.
- No horizontal overflow exists.
- Horizontal changes do not affect Standard, Classic, or Compact.

---

# Loop 11: Cross-Template Regression Matrix

## Goal

Verify the complete FPB mobile footer system across all templates after shared and template-specific changes.

## Required matrix

Run this matrix for every FPB template:

| State | Required result |
|---|---|
| Empty collapsed | Footer visible, no clipping, CTA state correct |
| Empty expanded | Empty/skeleton area stable and readable |
| One item collapsed | Count/summary/total correct |
| One item expanded | Product row visible and removable |
| Multiple items collapsed | Summary does not overflow |
| Multiple items expanded | Internal product list scrolls |
| Product overflow | Footer content scrolls, page does not horizontally overflow |
| Long title | Text truncates cleanly |
| Variant subtitle | Subtitle fits or truncates cleanly |
| Quantity badge | Badge visible and aligned |
| Remove product | Layout updates without stale spacing |
| Discount unreached | Message/progress correct |
| Discount reached | Reached styling correct |
| CTA disabled | Disabled state visible and not force-clickable by CSS |
| CTA enabled | CTA visible and tappable |
| Back action present | Back/next layout stable |
| Free gift locked | Locked visual state correct, if supported |
| Free gift unlocked | Unlocked visual state correct, if supported |
| Expanded then collapsed | Collapsed geometry fully restored |

## Breakpoint guard

Verify that mobile-only footer rules do not affect layouts above the mobile breakpoint.

At one pixel above the mobile breakpoint:

- Desktop/tablet footer behavior remains unchanged.
- Desktop/tablet side panel behavior remains unchanged.
- No mobile tray, bottom sheet, or mobile footer shell leaks into the layout.

## Acceptance criteria

- Every template passes the matrix.
- Every viewport passes without horizontal overflow.
- No desktop/tablet regression exists.
- No unsupported state is silently ignored; unsupported states are documented.

---

# Loop 12: CSS Quality and Maintainability Pass

## Goal

Ensure the final CSS is maintainable, scoped, and consistent with the constraints.

## Actions

1. Review the diff for mobile-only scoping.
2. Remove duplicate declarations targeting the same element/state.
3. Remove unnecessary `!important` declarations.
4. Confirm no new CSS classes were added unless documented as unavoidable.
5. Confirm no JavaScript was changed.
6. Confirm no markup was changed.
7. Confirm no unrelated product-card, modal, tab, banner, or desktop footer styling changed.
8. Confirm template-specific styles are not placed in shared CSS.
9. Confirm shared styles are not duplicated in every template file.
10. Confirm selectors are specific enough to avoid leaks but not over-specific.
11. Run available lint, format, typecheck, and build commands.
12. Run a final Chrome smoke test.

## Acceptance criteria

- CSS diff is small and explainable.
- CSS ownership is clear.
- No conflicting footer declarations remain.
- No mobile footer styling leaks into desktop/tablet.
- Build and lint checks pass, or failures are unrelated and documented.

---

## Final Stopping Criteria

Stop only when all criteria below are true:

1. FPB Standard mobile footer passes collapsed and expanded parity checks.
2. FPB Classic mobile footer passes collapsed and expanded parity checks.
3. FPB Compact mobile footer passes collapsed and expanded parity checks.
4. FPB Horizontal mobile footer passes collapsed and expanded parity checks.
5. Existing storefront interaction controls footer expand-collapse behavior.
6. No JavaScript was changed.
7. No markup was changed.
8. All mobile footer styling is inside the correct mobile media query.
9. No new CSS classes were introduced unless documented as unavoidable.
10. No desktop/tablet regression exists.
11. No horizontal overflow exists at tested mobile widths.
12. The footer does not cover the final product row or critical mobile controls.
13. The expanded selected-product list scrolls internally.
14. CTA remains visible and tappable in collapsed and expanded states.
15. Discount/progress states render correctly.
16. Empty/skeleton states render correctly.
17. Remove controls are visible and tappable.
18. Free-gift states render correctly if supported.
19. Chrome screenshots or screen recordings exist for every template’s key states.
20. Final CSS diff is scoped, maintainable, and free of redundant conflicts.

---

## Blocker Handling

If the agent encounters a blocker, it must stop the affected loop and document:

1. The template affected.
2. The state affected.
3. The exact missing hook or conflicting owner.
4. Why CSS-only implementation cannot safely solve it.
5. The minimal non-CSS change that would be required in a separate task.

Common blockers include:

- No open/expanded state hook is toggled by the current footer interaction.
- The selected-product list is not rendered in the DOM for the expanded state.
- CTA disabled/enabled state is not exposed to CSS.
- Discount reached/unreached state is not exposed to CSS.
- A runtime-injected style always overrides static mobile footer styles.
- The mobile footer is rendered by different markup per template with no shared styling surface.

Do not hide blockers with broad overrides or unrelated CSS changes.

---

## Implementation Notes Template

The implementing agent should maintain a short notes section while working:

```md
## Implementation Notes

### Current mobile breakpoint
- Primary FPB footer mobile breakpoint is `@media (max-width:767px)` in `app/assets/widgets/full-page-css/base/sidebar-totals-discounts.css`.
- Related template files also use `max-width:767px` or `max-width:768px`; the footer tray owner currently uses `max-width:767px`.

### Template mapping
- Standard: preset `DEFAULT`, normalized to template `STANDARD`; template CSS asset `side-footer-standard.css`.
- Classic: preset `CLASSIC`; template CSS asset imports `templates/classic/mobile.css` through `side-footer-classic.css`.
- Compact: preset `COMPACT`; template CSS asset `side-footer-compact.css`.
- Horizontal: preset `HORIZONTAL`; template CSS asset `side-footer-horizontal.css`.

### Existing state hooks discovered
- Generic mobile sheet collapsed/open path: `.fpb-mobile-bottom-sheet` plus `.is-open`; backdrop uses `.fpb-mobile-backdrop.is-open`.
- Footer-side template tray path: `.fpb-mobile-bottom-sheet.fpb-mobile-summary-tray` is created for Standard, Classic, Compact, and Horizontal and is forced open by runtime.
- Expanded selected-products tray: `.fpb-mobile-summary-tray-expanded`, toggled by the existing count badge interaction.
- Count/toggle: `.fpb-mobile-summary-count-badge` with `aria-expanded`.
- CTA: `.side-panel-btn.side-panel-btn-next` inside `.side-panel-nav`; disabled state is the native `:disabled`.
- Discount/progress: `.side-panel-discount-message`, `.fpb-mobile-summary-discount-text`, `.fpb-discount-progress.fpb-dp-sidebar`, reached/unreached content is generated by existing pricing state.
- Empty slots/skeleton: `.fpb-mobile-summary-empty-product-card` and child skeleton classes, rendered only when product slots are enabled.
- Product rows/removal: `.fpb-mobile-summary-product-row`, `.fpb-mobile-summary-product-remove`.
- Free gift state: current mobile summary action computes locked/unlocked navigation via existing free-gift step logic; no dedicated CSS-only locked/unlocked class was found in Loop 0.

### CSS ownership
- Shared footer CSS: `app/assets/widgets/full-page-css/base/sidebar-totals-discounts.css`.
- Runtime DOM owner: `app/assets/widgets/full-page/methods/responsive-layout-methods.js` creates the mobile bar/sheet/backdrop and selects the compact summary tray path.
- Summary tray content owner: `app/assets/widgets/full-page/methods/mobile-summary-methods.js`.
- Standard-specific CSS: `app/assets/widgets/full-page-css/templates/side-footer-standard.css`.
- Classic-specific CSS: `app/assets/widgets/full-page-css/templates/classic/mobile.css`, imported by `side-footer-classic.css`.
- Compact-specific CSS: `app/assets/widgets/full-page-css/templates/side-footer-compact.css`.
- Horizontal-specific CSS: `app/assets/widgets/full-page-css/templates/side-footer-horizontal.css`.
- Built storefront targets: `extensions/bundle-builder/assets/bundle-widget-full-page*.css`, generated by `npm run minify:assets css` or `npm run build:widgets`.

### Blockers
- Loop 0 found no blocker to CSS-only work for the tray expanded/collapsed state: existing hooks are present.
- Potential Loop 1 dependency: EB and WPB storefront pages must be available in Chrome tabs or another approved navigation mechanism, because the current tool surface exposed page selection, emulation, screenshots, clicks, and evaluation but not an explicit navigate-page tool.
- Potential CSS quality issue to resolve in later loops: Standard and Horizontal duplicate nearly identical `.fpb-mobile-summary-*` footer rules, while shared base CSS also owns generic tray rules.

### Chrome evidence
- Loop 1 EB 390x844 empty state screenshot: `/private/tmp/eb-fpb-mobile-footer-loop1-390.png`.
- Loop 1 EB 390x844 empty metrics: `/private/tmp/eb-fpb-mobile-footer-loop1-390-metrics.json`.
- Loop 1 EB 390x844 selected state screenshot: `/private/tmp/eb-fpb-mobile-footer-loop1-selected-after-390.png`.
- Loop 1 EB 390x844 selected metrics: `/private/tmp/eb-fpb-mobile-footer-loop1-selected-after.json`.
- Loop 1 WPB 390x844 empty metrics after cache-clear/reload: `/private/tmp/wpb-fpb-mobile-footer-loop1-empty-390.json`.
- Loop 1 WPB 390x844 selected screenshot: `/private/tmp/wpb-fpb-mobile-footer-loop1-selected-390.png`.
- Loop 1 WPB 390x844 selected metrics: `/private/tmp/wpb-fpb-mobile-footer-loop1-selected-390.json`.
- EB collapsed/selected mobile footer shell at 390x844: `x=10`, `y=670.03125`, `width=370`, `height=173.96875`, `bottom=844`, `position=sticky`, `z-index=9999`, `padding=5px`, `background=#fff`.
- WPB collapsed/selected mobile footer shell at 390x844: `x=10`, `y=648`, `width=370`, `height=196`, `bottom=844`, `position=fixed`, `z-index=1001`, `padding=5px`, `background=#fff`.
- EB visible CTA at 390x844 selected state: `x=15`, `y=791`, `width=360`, `height=38`, black background, `border-radius=5px`, `padding=8px`, grid with `gap=8px`.
- WPB visible CTA at 390x844 selected state already matches EB geometry closely: `x=15`, `y=790.28125`, `width=360`, `height=38`, black background, `border-radius=5px`, `padding=8px`, grid with `gap=8px`.
- EB count badge at 390x844 selected state: `x=171.5390625`, `y=658.4375`, `width=46.921875`, `height=25.1875`, `bottom=683.625`, `bottom:147.781px`.
- WPB count badge at 390x844 selected state: `x=171`, `y=636`, `width=48`, `height=25`, `bottom=661`, `bottom:183px`.
- EB selected bundle-review/footer-product content exists in the DOM after product selection but remains `display:none` in this mobile state; the visible footer stays the collapsed sticky footer.
- WPB direct `.product-add-btn` click is required for reliable selected-state capture in Chrome; the accessibility-tree click did not update selection because of the sticky footer overlap.

### Loop 3 local patch notes
- Patched Standard and Horizontal template CSS sources to target the measured EB collapsed shell: `height=173.96875px`, discount row `104.96875px`, CTA row `58px`, expanded shell `385.96875px`.
- Changed mobile footer selectors to higher-specificity body-appended sheet selectors because `_renderMobileBottomBar()` appends `.fpb-mobile-bottom-sheet` directly under `body`; ancestor-scoped template selectors do not match the sheet.
- Regenerated CSS assets with `npm run minify:assets css`.
- Local generated assets contain the new values in `extensions/bundle-builder/assets/bundle-widget-full-page-standard.css` and `extensions/bundle-builder/assets/bundle-widget-full-page-horizontal.css`.
- Chrome verification blocker: the active storefront is loading Shopify CDN asset `bundle-widget-full-page-horizontal.css`, and fetch checks at `/private/tmp/wpb-fpb-mobile-footer-loop3-live-css-check.json` and `/private/tmp/wpb-fpb-mobile-footer-loop3-live-css-check-after-wait.json` show `hasOldHeight=true` and `hasNewHeight=false`.
- Post-patch live Chrome geometry therefore still reports the old WPB shell: `/private/tmp/wpb-fpb-mobile-footer-loop3-empty-after-horizontal-390.json`.

### Loop 4 expanded selected footer patch notes
- Live WPB verification now reaches local tunnel assets; `window.__BUNDLE_WIDGET_VERSION__` reports `3.0.25` on `https://agent-5sfidg3m.myshopify.com/pages/wpb-fresh-fpb-template-parity-2026-06-04`.
- EB expanded selected footer target at 390x844: shell `x=10`, `y=426.046875`, `width=370`, `height=417.953125`; product section `height=301.984375`; bundle items `height=235.984375`; product list rows `81px 86px`.
- WPB pre-patch expanded selected footer at 390x844 had the shorter Loop 3 shell `height=385.96875`, product section `height=270`, product list `height=140`, and hidden progress because the shared mobile rule set `.fpb-discount-progress` to `display:none !important`.
- Patched shared mobile footer CSS plus Standard, Classic, and Horizontal footer CSS to expose the sidebar discount progress in the mobile tray, use the EB expanded shell height `417.96875px`, product section `302px`, bundle items `236px`, product list `172px`, selected row `81px`, and CTA row preserved at `38px`.
- Replaced fixed `370px`/`360px` mobile shell widths with responsive custom properties: shell `calc(100vw - 20px)`, inner `calc(100vw - 30px)`, and progress `inner - 50px`. At 390px this still resolves to EB `370/360/310`; at 320px it resolves to `300/290/240`.
- Regenerated deploy target CSS with `npm run minify:assets css`.
- Chrome verification after hard reload:
  - 390x844 selected expanded WPB metrics: `/private/tmp/wpb-mobile-footer-expanded-after-responsive-390.json`; screenshot: `/private/tmp/wpb-mobile-footer-expanded-after-responsive-390.png`.
  - 320x844 selected expanded WPB metrics: `/private/tmp/wpb-mobile-footer-expanded-after-responsive-320.json`; screenshot: `/private/tmp/wpb-mobile-footer-expanded-after-responsive-320.png`.
  - Width guard metrics: `/private/tmp/wpb-mobile-footer-width-360.json`, `/private/tmp/wpb-mobile-footer-width-375.json`, `/private/tmp/wpb-mobile-footer-width-414.json`, `/private/tmp/wpb-mobile-footer-width-430.json`, `/private/tmp/wpb-mobile-footer-width-767.json`, `/private/tmp/wpb-mobile-footer-width-768-guard.json`.
- Verified no horizontal overflow for tested mobile widths 320, 360, 375, 390, 414, 430, and 767.
```

The notes may reference current files and selectors during implementation, but this plan itself intentionally does not depend on them.
