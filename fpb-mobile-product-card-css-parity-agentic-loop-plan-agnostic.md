# Agentic Loop Plan: FPB Mobile Product Card CSS Parity

## Purpose

Open a focused parity stream for **Full Page Bundle product cards in mobile viewports** across every FPB storefront template.

This plan is intentionally scoped narrower than `product-card-parity-agentic-loop-plan.md`. Use that document for the broader 8-template FPB/PPB product-card program. Use this document when the immediate task is FPB-only mobile parity.

The target outcome is that FPB mobile product cards match the EB reference behavior and rendering for unselected, selected, quantity, disabled, variant, pricing, and CTA states without changing unrelated storefront surfaces.

---

## Templates In Scope

1. FPB Standard
2. FPB Classic
3. FPB Compact
4. FPB Horizontal

If the repo renames template IDs, map the current implementation back to these four visual families before editing.

---

## Viewports In Scope

Mobile only.

Minimum Chrome verification widths:

| Label | Size |
|---|---:|
| Narrow mobile | 320 x 800 |
| Small mobile | 360 x 800 |
| Standard mobile | 390 x 844 |
| Wide mobile | 430 x 932 |
| Mobile breakpoint guard | 767 x 900 |
| One pixel above mobile breakpoint | 768 x 900 |

All product-card CSS changes must be mobile-scoped unless the current owning declaration is already intentionally shared and changing it is proven not to affect desktop.

---

## Primary Goal

Bring FPB mobile product cards to EB parity across:

- Card container geometry.
- Grid/list orientation.
- Image wrapper and image fit.
- Title, variant, and price layout.
- Sale-price and compare-at-price treatment.
- Compact `+` CTA mode.
- `Show Text on + Button` CTA mode.
- Quantity selector after selection.
- Selected and unselected state treatment.
- Disabled/maxed/out-of-stock treatment.
- Long-title wrapping and clipping.
- Variant product cards.
- Product-card spacing relative to sticky mobile footer.

---

## Hard Constraints

1. Do not run `npm run dev`. The user provides the dev server.
2. Do not deploy.
3. Do not create CSS/source-grep contract tests for layout, class names, selector order, or styling.
4. Do not add broad late-cascade overrides when an existing template owner can be edited.
5. Do not use minified or compressed CSS in source files.
6. Do not introduce competitor-prefixed selectors, comments, variables, or code names.
7. Do not change cart, discount, rule, pricing, step navigation, or product data logic unless a product-card state hook is objectively missing.
8. Do not alter PPB behavior in this parity stream.
9. Do not change desktop sidebars, mobile footer, modals, banners, tabs, or progress bars except to prevent product-card overlap caused by the mobile card changes.

---

## Required Product Card States

Every template loop must verify these states where supported by the configured fixture:

1. Unselected product card.
2. Selected product card.
3. Quantity selector visible after selection.
4. Quantity increment/decrement interaction.
5. Compact `+` button mode.
6. `Show Text on + Button` enabled mode, where the text button replaces the plus icon and sits below the price.
7. Long title.
8. Sale price with compare-at price.
9. Variant product card.
10. Out-of-stock or disabled state.
11. Max rule reached state.
12. Product removed back to unselected state.
13. Product added while mobile footer is collapsed.
14. Product added while mobile footer is expanded.

If a fixture does not expose a required state, document the missing fixture before moving on.

---

## Ownership Rules

Before editing any mismatch, identify the current owner:

| Surface | Expected owner type |
|---|---|
| Shared card DOM | `app/assets/widgets/shared/components/product-card.js` or current shared card renderer |
| FPB selection update state | current full-page selection/product-card update method |
| Shared FPB mobile card CSS | raw FPB source CSS under `app/assets/widgets/full-page-css/` |
| Standard template card CSS | Standard FPB template source CSS |
| Classic template card CSS | Classic FPB template source CSS |
| Compact template card CSS | Compact FPB template source CSS |
| Horizontal template card CSS | Horizontal FPB template source CSS |
| Generated storefront assets | `extensions/bundle-builder/assets/` after build/minify only |

Do not patch a downstream generated file directly. Edit raw source, then rebuild/minify.

---

# Loop 0: Discovery And Ownership Map

## Goal

Map the current FPB mobile product-card architecture before changing code.

## Actions

1. Inspect the shared product-card renderer and FPB selection update methods.
2. Inspect raw FPB CSS ownership for:
   - shared product card base,
   - Standard mobile card rules,
   - Classic mobile card rules,
   - Compact mobile card rules,
   - Horizontal mobile card rules.
3. Confirm mobile breakpoint conventions.
4. Confirm runtime template hooks:
   - `data-fpb-design-preset`,
   - `data-fpb-card-cta-mode`,
   - selected classes,
   - disabled classes,
   - quantity-control classes.
5. Identify duplicate/conflicting selectors for card height, image height, title height, price row, action area, and selected state.
6. Produce a short ownership map in the session before editing.

## Acceptance Criteria

- All FPB mobile product-card owners are known.
- Shared versus template-specific responsibilities are clear.
- Any missing state hook blocker is documented.
- No code has been changed in this loop.

---

# Loop 1: EB Mobile Reference Capture

## Goal

Capture current EB behavior for FPB mobile product cards.

## Actions

1. Open EB FPB reference in Chrome mobile emulation.
2. Capture Standard, Classic, Compact, and Horizontal mobile product-card screenshots.
3. For each template, capture:
   - unselected state,
   - selected state,
   - quantity selector state,
   - compact plus CTA,
   - text-button CTA when enabled,
   - long title,
   - sale price,
   - disabled or maxed state if available.
4. Measure bounding boxes and computed styles for:
   - card root,
   - image wrapper,
   - image,
   - content wrapper,
   - title,
   - price row,
   - CTA/action region,
   - quantity selector.
5. Record interaction behavior:
   - tap plus,
   - tap text button,
   - increment quantity,
   - decrement quantity,
   - remove to zero,
   - max reached.

## Acceptance Criteria

- EB visual and interaction target is documented.
- Measurements are available before WPB edits.
- Template-specific differences are separated from shared behavior.

---

# Loop 2: WPB Baseline Capture

## Goal

Capture current Wolfpack FPB mobile product-card behavior with the same states and viewports.

## Actions

1. Refresh the storefront before testing.
2. Do not start the dev server.
3. Confirm runtime widget version.
4. Capture the same state matrix used for EB.
5. Compare WPB against EB and list gaps by owner:
   - shared card gap,
   - Standard-only gap,
   - Classic-only gap,
   - Compact-only gap,
   - Horizontal-only gap.

## Acceptance Criteria

- WPB baseline is captured in Chrome.
- Every gap is mapped to a probable owning source file.
- No visual fix has been made yet.

---

# Loop 3: Shared FPB Mobile Card State Hooks

## Goal

Fix only shared FPB mobile state primitives needed by all templates.

## Allowed Changes

- Shared product-card DOM only if CSS cannot target the current state correctly.
- Shared mobile CSS only when all four FPB templates should inherit the same behavior.
- Selection update methods only if selected, quantity, or disabled state classes are missing or stale.

## Required Checks

- Compact plus mode still works.
- Text-button mode still works.
- Quantity selector appears after selection.
- Product removed to zero returns to the unselected state.
- PPB product cards are unchanged.

## Acceptance Criteria

- Shared behavior works for all FPB templates.
- Template-specific visual differences are not flattened.

---

# Loop 4: FPB Standard Mobile Product Cards

## Goal

Match EB Standard mobile product-card layout and states.

## Focus Areas

- Card size and grid columns.
- Image dimensions and object fit.
- Title line height and wrapping.
- Price row alignment.
- Compact plus button placement.
- Text-button mode placement below price.
- Quantity selector placement and dimensions.
- Selected/unselected visual treatment.
- Footer overlap safety.

## Acceptance Criteria

- Standard mobile card matches EB in all required states.
- No Classic, Compact, or Horizontal regression.

---

# Loop 5: FPB Classic Mobile Product Cards

## Goal

Match EB Classic mobile product-card layout while preserving Classic-specific density and styling.

## Focus Areas

- Classic mobile grid/card sizing.
- Image and card radius.
- Typography hierarchy.
- Selected state.
- Quantity selector.
- Text-button mode if enabled.

## Acceptance Criteria

- Classic mobile card matches EB.
- Shared FPB rules remain reusable.

---

# Loop 6: FPB Compact Mobile Product Cards

## Goal

Match EB Compact mobile product-card behavior without losing compact density.

## Focus Areas

- Compact card height.
- Compact image height.
- Title/price compression.
- Compact plus button.
- Text-button mode layout.
- Quantity selector after selection.
- Maxed/disabled state.

## Acceptance Criteria

- Compact mobile card matches EB.
- Product card does not collide with the mobile footer.

---

# Loop 7: FPB Horizontal Mobile Product Cards

## Goal

Match EB Horizontal mobile product-card behavior, including row orientation and mobile fallback rules.

## Focus Areas

- Row/grid orientation.
- Image sizing.
- Title and price width handling.
- CTA/action region.
- Quantity selector.
- Selected/unselected state.
- Long title and sale price behavior.

## Acceptance Criteria

- Horizontal mobile card matches EB.
- Horizontal-specific fixes do not leak into vertical templates.

---

# Loop 8: Text Button And Quantity Selector Parity

## Goal

Ensure FPB mobile product cards honor `Show Text on + Button` and quantity selector behavior consistently across all four templates.

## Required Behavior

1. Compact plus mode:
   - unselected card shows compact `+`,
   - selected card shows quantity selector,
   - selected state matches EB.
2. Text-button mode:
   - unselected card replaces the plus icon with a text button,
   - text button sits below the price,
   - selected card shows quantity selector in the EB position,
   - selected state matches EB.

## Acceptance Criteria

- Both CTA modes pass for Standard, Classic, Compact, and Horizontal.
- Quantity selector is visible and usable in both CTA modes.
- No PPB behavior changes.

---

# Loop 9: Final Mobile Matrix Verification

## Goal

Verify all FPB mobile product-card states after implementation.

## Required Matrix

| Template | 320 | 360 | 390 | 430 | 767 | 768 guard |
|---|---:|---:|---:|---:|---:|---:|
| Standard | | | | | | |
| Classic | | | | | | |
| Compact | | | | | | |
| Horizontal | | | | | | |

For each cell, verify:

- no horizontal overflow,
- no text overlap,
- no footer collision,
- quantity controls are tappable,
- selected/unselected states are stable,
- compact plus and text-button modes behave correctly.

## Required Commands

Run only commands relevant to changed files:

```bash
node --check app/assets/widgets/full-page/methods/<changed-file>.js
npx eslint --max-warnings 9999 <changed-js-files>
npm run build:widgets
npm run minify:assets css
npm run graphify:rebuild
git diff --check
```

Do not run `npm run dev`.

## Acceptance Criteria

- Chrome mobile evidence confirms parity across all FPB templates.
- Source CSS remains readable and uncompressed.
- Generated assets are rebuilt from raw source.
- Commit is scoped and has a precise message.

