# Wolfpack Bundle Widget Refactor — Agentic Loop Plan for All 8 Templates

This document is a Codex-ready, agentic-loop refactor plan for the Wolfpack Product Bundles widget ecosystem. It replaces the earlier loop plan that focused too heavily on **FPB Standard** and **FPB Classic** by explicitly covering all 8 target templates:

## Full Page Bundle Templates

1. **FPB Standard**
2. **FPB Classic**
3. **FPB Compact**
4. **FPB Horizontal**

## Product Page Bundle Templates

1. **PPB Grid** — current in-code equivalent: `PDP_INPAGE + COGNIVE`
2. **PPB List** — current in-code equivalent: `PDP_INPAGE + CASCADE`
3. **PPB Horizontal Slots** — current in-code equivalent: `PDP_MODAL + MODAL + horizontal slot orientation`
4. **PPB Vertical Slots** — current in-code equivalent: `PDP_MODAL + SIMPLIFIED or vertical slot orientation`

The plan is written for a Codex-style implementation agent that can edit code, run tests, use browser automation, and verify results on a Shopify storefront.

---

# 0. Agent Mission

Refactor the full-page and product-page bundle widget ecosystem into a simpler, maintainable architecture where:

- All 8 templates render correctly.
- Product cards share one stable DOM contract.
- Selected states do not overflow or get clipped.
- Sidebars, slot summaries, selected-product rows, timelines, and discount progress bars are shared primitives.
- Template behavior is driven by plain config objects and scoped CSS.
- No source file exceeds 500 lines.
- Runtime CSS injection is removed except for tiny runtime variable patches.
- Tests pass after each loop.
- Visual verification is completed on the actual storefront after each template migration.

---

# 1. Required Tools for the Agent

The implementing agent should actively use the following tools during the loop.

## 1.1 Chrome DevTools MCP

Use Chrome DevTools MCP for all storefront verification:

- Open storefront product pages and full-page bundle pages.
- Inspect DOM structure.
- Inspect computed CSS.
- Check console errors and network failures.
- Verify layout dimensions and overflow.
- Capture screenshots before and after each template migration.
- Test desktop, tablet, and mobile responsive layouts.
- Confirm selected states and quantity controls fit inside product cards.

The agent must not mark a visual loop as complete without Chrome DevTools verification.

## 1.2 Shopify Plugin

Use the Shopify plugin to:

- Inspect the test shop/theme context when available.
- Confirm theme asset paths and app extension asset loading.
- Verify storefront pages where widgets are mounted.
- Check bundle product pages and full-page bundle pages.
- Confirm changes are visible in the storefront environment, not only local static files.

Do not use production secrets. If a required shop/storefront URL or auth context is missing, pause and ask for it.

## 1.3 Superpowers Plugin

Use the Superpowers plugin for:

- Maintaining a persistent implementation checklist.
- Breaking large goals into loop-sized tasks.
- Tracking acceptance criteria per template.
- Running code-review/self-review steps before finalizing each loop.
- Remembering unresolved bugs between loops.

The agent should keep a visible task board or equivalent loop ledger.

---

# 2. Recursive Goal

The agent should run the following recursive loop until all 8 templates pass functional tests and storefront visual verification.

```txt
Goal:
  Refactor one small slice of the bundle widget system.

Loop:
  1. Observe current code and storefront behavior.
  2. Select the smallest next template/component goal.
  3. Modify code with minimal blast radius.
  4. Run tests, lint, build, and file-size checks.
  5. Verify visually on storefront using Chrome DevTools MCP.
  6. Fix regressions immediately.
  7. Commit/record results.
  8. Re-enter the loop for the next template/component.

Stop only when:
  All 8 templates pass tests, visual verification, and cleanup criteria.
```

The agent must treat this as a **recursive engineering loop**, not a one-pass rewrite.

---

# 3. Non-Negotiable Constraints

1. **No file over 500 lines.**
2. **No big-bang rewrite.** Migrate one component or one template at a time.
3. **No React/Vue/Svelte rewrite.** Use plain JavaScript modules.
4. **No prototype patching for templates after migration.** Replace template installers with config objects.
5. **No long runtime CSS strings.** Move template CSS into real scoped CSS files.
6. **No unscoped template CSS.** Every template rule must be scoped to a full-page or product-page template attribute/class.
7. **No desktop full-page bottom-footer fallback.** Full-page desktop uses sidebar layout only.
8. **Mobile summary tray stays.** It is the mobile UX, not stale footer code.
9. **Use existing CSS variables for colors.** Do not hard-code brand colors in new template CSS.
10. **Preserve merchant settings.** Do not break existing settings such as show text on add button, product slots, quantity rules, box selection, default products, free gifts, and discount messaging.

---

# 4. Current Template Mapping

## 4.1 Full Page Templates

| Target Template | Current Preset / Template Identifier | Notes |
|---|---|---|
| FPB Standard | `DEFAULT` / `STANDARD` alias | Standard sidebar/grid layout |
| FPB Classic | `CLASSIC` | 4-column desktop grid + slot sidebar |
| FPB Compact | `COMPACT` | Dense image-heavy layout |
| FPB Horizontal | `HORIZONTAL` | Horizontal/list-like layout and slot-oriented summary |

## 4.2 Product Page Templates

| Target Template | Current Code Identifier | Notes |
|---|---|---|
| PPB Grid | `PDP_INPAGE + COGNIVE` | Current `cognive-template.js` defines grid detection and reuses Cascade footer behavior |
| PPB List | `PDP_INPAGE + CASCADE` | Current `cascade-template.js` owns selected drawer/footer and list-like product rows |
| PPB Horizontal Slots | `PDP_MODAL + MODAL + horizontal orientation` | Current `modal-slot-template.js` handles modal slot template and horizontal slot grid |
| PPB Vertical Slots | `PDP_MODAL + SIMPLIFIED` or vertical orientation | Current `_usesVerticalModalSlotLayout()` decides vertical slot layout |

---

# 5. Known Current Problems to Fix

## 5.1 Product Cards

Symptoms:

- Selected state overflows inside product cards.
- Quantity controls get clipped.
- Card content shifts unexpectedly after selection.
- Different templates use different product-card structures.

Required fix:

- Create one shared product-card primitive.
- Reserve an action area in every card.
- Add button and quantity controls must swap inside the same action area.
- Selected state may change border/shadow but must not change layout height unexpectedly.

## 5.2 Sidebar / Summary

Symptoms:

- FPB sidebar does not render consistently.
- Row vs slot summary logic is scattered.
- Standard and Classic are partially handled, while Compact and Horizontal are not fully first-class.

Required fix:

- Shared summary primitives:
  - selected product rows
  - selected product slots
  - empty slots
  - skeleton rows
  - summary total
  - summary actions
- Template config chooses the summary mode.

## 5.3 Timeline

Symptoms:

- Step timeline state does not reliably match current/completed/locked state.
- Timeline rendering mixes visual and business logic.

Required fix:

- Shared timeline component.
- Selectors compute current/completed/locked states.
- Templates only choose visual mode.

## 5.4 Discount Progress

Symptoms:

- Progress bar renders differently in FPB, PPB, modal, sidebar, and footer.
- Progress calculations are repeated in template files.

Required fix:

- Shared discount progress data selector.
- Shared discount progress renderer.
- Use everywhere: FPB sidebar, FPB mobile tray, PPB footer, PPB drawer/bottom sheet.

## 5.5 Template System

Symptoms:

- Templates are installed by mutating prototypes.
- Template CSS is injected through large JS strings.
- Some template behavior is hidden inside condition checks in large widget files.

Required fix:

- Replace `installXTemplate()` functions with plain config files.
- Move CSS into scoped CSS files.
- Remove most `if template === X` branches from app controllers.

---

# 6. Target Architecture

```txt
assets/
  widgets/
    shared/
      engine/
        create-bundle-state.js
        bundle-selectors.js
        bundle-actions.js
        bundle-validation.js
        bundle-pricing.js
        cart-lines.js
        cart-submit.js
      data/
        bundle-loader.js
        product-loader.js
        product-normalizer.js
        category-filter.js
      components/
        product-card.js
        quantity-control.js
        selected-product-row.js
        selected-product-slots.js
        step-timeline.js
        discount-progress.js
        box-selection.js
        bundle-summary.js

    full-page/
      full-page-app.js
      render/
        render-full-page.js
        render-full-page-main.js
        render-full-page-sidebar.js
        render-full-page-mobile-summary.js
      templates/
        registry.js
        standard.config.js
        classic.config.js
        compact.config.js
        horizontal.config.js
      styles/
        full-page-base.css
        full-page-sidebar.css
        full-page-mobile.css
        template-standard.css
        template-classic.css
        template-compact.css
        template-horizontal.css

    product-page/
      product-page-app.js
      render/
        render-product-page.js
        render-product-page-grid.js
        render-product-page-list.js
        render-product-page-horizontal-slots.js
        render-product-page-vertical-slots.js
        render-product-page-bottom-sheet.js
      templates/
        registry.js
        grid.config.js
        list.config.js
        horizontal-slots.config.js
        vertical-slots.config.js
      styles/
        product-page-base.css
        product-page-grid.css
        product-page-list.css
        product-page-horizontal-slots.css
        product-page-vertical-slots.css
        product-page-bottom-sheet.css
```

---

# 7. Loop Protocol

Every loop must follow this format.

## 7.1 Loop Start

The agent must state:

```txt
Current loop:
Template/component:
Files expected to change:
Expected acceptance criteria:
Regression risk:
```

## 7.2 Observe

Use code search and existing files to identify current behavior.

Use Chrome DevTools MCP to capture a baseline screenshot if the loop affects visual output.

## 7.3 Modify

Make the smallest coherent change.

Do not migrate multiple unrelated templates in one loop unless the loop is purely shared infrastructure.

## 7.4 Test

Run available commands, discovering actual scripts from `package.json`:

```txt
npm run lint
npm run test
npm run build
npm run typecheck
npm run test:e2e
```

If commands do not exist, record that they are unavailable and run the closest equivalent.

## 7.5 File-Size Check

Run a file-size check after each loop.

No `.js` or `.css` source file should exceed 500 lines unless explicitly grandfathered for the loop and scheduled for splitting in the next loop.

## 7.6 Visual Verification

Using Chrome DevTools MCP:

- Open the relevant storefront URL.
- Test desktop 1440px.
- Test tablet 768px.
- Test mobile 390px.
- Select product(s).
- Increase/decrease quantity.
- Remove product.
- Verify no console errors.
- Capture screenshots.

## 7.7 Record Result

Update the loop ledger:

```txt
Pass/fail:
Tests run:
Visual URLs checked:
Screenshots captured:
Known follow-ups:
```

---

# 8. Required Storefront Verification Matrix

The agent must eventually verify all 8 templates.

| Template | Desktop | Tablet | Mobile | Empty | Selected | Qty +/- | Remove | Discount | Add to Cart |
|---|---|---|---|---|---|---|---|---|---|
| FPB Standard | required | required | required | required | required | required | required | required | required |
| FPB Classic | required | required | required | required | required | required | required | required | required |
| FPB Compact | required | required | required | required | required | required | required | required | required |
| FPB Horizontal | required | required | required | required | required | required | required | required | required |
| PPB Grid | required | required | required | required | required | required | required | required | required |
| PPB List | required | required | required | required | required | required | required | required | required |
| PPB Horizontal Slots | required | required | required | required | required | required | required | required | required |
| PPB Vertical Slots | required | required | required | required | required | required | required | required | required |

---

# 9. Expanded Agentic Loop Backlog

The following loops intentionally include **FPB Horizontal, FPB Compact, PPB Grid, PPB List, PPB Vertical Slots, and PPB Horizontal Slots**, in addition to FPB Standard and FPB Classic.

---

## Loop 1 — Baseline Inventory and Visual Capture for All 8 Templates

### Goal

Create a complete baseline before code changes.

### Scope

All 8 templates:

```txt
FPB Standard
FPB Classic
FPB Compact
FPB Horizontal
PPB Grid
PPB List
PPB Horizontal Slots
PPB Vertical Slots
```

### Tasks

1. Identify storefront URLs or test routes for all 8 templates.
2. Use Shopify plugin to confirm the active theme/test shop context.
3. Use Chrome DevTools MCP to capture baseline screenshots.
4. Record existing console errors.
5. Record obvious visual failures:
   - product card overflow
   - sidebar mismatch
   - timeline mismatch
   - progress bar mismatch
   - slot layout mismatch
6. Create `/docs/refactor/baseline-template-matrix.md`.

### Acceptance Criteria

- Every template has a baseline entry.
- Every template has at least one desktop and one mobile screenshot.
- Current failures are documented before refactoring.

---

## Loop 2 — Add File-Size and Runtime-CSS Guardrails

### Goal

Prevent the codebase from getting worse during refactor.

### Tasks

1. Add a script or documented command that reports files over 500 lines.
2. Add a grep/check for large `style.textContent` blocks.
3. Add a check for `installXTemplate` prototype patching usage.
4. Do not fail CI yet if too many legacy files violate this; record current violations.
5. Make the check strict only for new/refactored files.

### Acceptance Criteria

- Agent can run a command to see oversized files.
- New files created by this refactor stay under 500 lines.

---

## Loop 3 — Shared State Skeleton

### Goal

Introduce shared bundle state without changing visuals.

### Tasks

1. Add `shared/engine/create-bundle-state.js`.
2. Add `shared/engine/bundle-selectors.js` with basic selectors.
3. Add `shared/engine/bundle-actions.js` with basic product selection actions.
4. Wire one non-invasive selector into FPB and PPB for selected quantity or total count.
5. Keep old renderers intact.

### Acceptance Criteria

- Existing widgets render unchanged.
- Tests/build pass.
- No visual change expected.

---

## Loop 4 — Shared Product Card Contract

### Goal

Create the shared product card primitive that fixes selected-state overflow.

### Tasks

1. Add `shared/components/product-card.js`.
2. Add `shared/components/quantity-control.js`.
3. Define stable DOM:
   - image area
   - title area
   - price area
   - action area
4. Ensure add button and quantity controls occupy the same action area.
5. Add shared CSS contract in base CSS.

### Acceptance Criteria

- Product card can render in icon, text, row, and slot modes.
- Quantity controls do not rely on absolute positioning outside the action area.
- Unit test or DOM snapshot test exists for selected vs unselected card.

---

## Loop 5 — Shared Discount Progress Component

### Goal

Build one discount progress component before applying template migrations.

### Tasks

1. Add `shared/components/discount-progress.js`.
2. Add selector for discount progress data:
   - current value
   - target value
   - progress percent
   - message
   - success state
3. Support simple and stepped modes.
4. Do not replace all templates yet.

### Acceptance Criteria

- Component renders from prepared data.
- It does not calculate pricing internally.
- Existing widgets unaffected.

---

## Loop 6 — Shared Selected Rows and Slots

### Goal

Create shared summary primitives for row-based and slot-based templates.

### Tasks

1. Add `selected-product-row.js`.
2. Add `selected-product-slots.js`.
3. Support states:
   - empty
   - filled
   - default/included
   - free gift locked/unlocked
4. Add data-action attributes for remove/select.

### Acceptance Criteria

- Can render row summary and slot summary from the same selected product data.
- Works without template-specific business logic.

---

# 10. Full Page Template Migration Loops

---

## Loop 7 — FPB Standard Migration

### Goal

Migrate FPB Standard to the shared card, progress, rows, and sidebar primitives.

### Target Behavior

- 3-column desktop grid.
- 2-column mobile grid.
- Large image product cards.
- Right sidebar with selected rows and skeleton rows.
- Box selection pills.
- Discount message and progress bar.
- Back + Next/Add to Cart actions.

### Tasks

1. Create `full-page/templates/standard.config.js`.
2. Create/clean `template-standard.css`.
3. Replace Standard product cards with shared `product-card.js`.
4. Replace Standard sidebar rows with `selected-product-row.js`.
5. Replace Standard progress with `discount-progress.js`.
6. Verify show-text-on-add-button mode.

### Storefront Visual Checks

- Empty state.
- One selected product.
- Multiple selected products.
- Quantity increase/decrease.
- Remove product.
- Sidebar skeleton row behavior.
- Progress bar updates.

### Acceptance Criteria

- No product-card overflow.
- Sidebar matches structural target.
- Tests/build pass.
- Visual screenshots captured.

---

## Loop 8 — FPB Classic Migration

### Goal

Migrate FPB Classic to shared card and slot summary primitives.

### Target Behavior

- 4-column desktop grid.
- 2-column mobile grid.
- Compact cards.
- Centered category pills.
- Slot-grid sidebar summary.
- Box selection pills.
- Progress bar.
- Checkout action.

### Tasks

1. Create `full-page/templates/classic.config.js`.
2. Create/clean `template-classic.css`.
3. Replace Classic product cards with shared `product-card.js`.
4. Replace Classic sidebar with `selected-product-slots.js`.
5. Replace Classic progress with `discount-progress.js`.
6. Remove Classic runtime CSS injection when migrated.

### Acceptance Criteria

- Slot grid summary renders selected and empty states.
- No quantity clipping.
- Classic CSS does not affect Standard/Compact/Horizontal.

---

## Loop 9 — FPB Compact Migration

### Goal

Make FPB Compact a first-class template, not a partial icon-mode override.

### Current Context

Current Compact uses runtime CSS injection and is mostly scoped to `data-fpb-card-cta-mode=icon`. It defines compact desktop and mobile product dimensions, but does not own a complete independent renderer.

### Target Behavior

- Dense product-card layout.
- 3-column or configured dense desktop grid.
- 2-column mobile grid.
- Compact sidebar spacing.
- Shared selected-slot or compact summary primitive.
- Progress bar renders consistently.

### Tasks

1. Create `full-page/templates/compact.config.js`.
2. Create/clean `template-compact.css`.
3. Replace Compact product cards with shared product card in compact mode.
4. Decide summary mode:
   - preferred: `compactSlots`
   - fallback: `rows` only if target mockup requires rows
5. Replace Compact progress with shared progress.
6. Remove `installCompactTemplate()` prototype/runtime CSS dependency.
7. Verify both icon and text CTA modes if setting applies.

### Storefront Visual Checks

- Compact product cards do not overflow.
- Selected state remains inside card.
- Sidebar/summary layout matches compact target.
- Mobile tray still works.

### Acceptance Criteria

- FPB Compact is migrated through config + CSS.
- No reliance on long JS CSS strings.
- No regression in Standard or Classic.

---

## Loop 10 — FPB Horizontal Migration

### Goal

Make FPB Horizontal a first-class full-page template.

### Current Context

Current Horizontal uses `installHorizontalTemplate()` with runtime CSS for horizontal/summary behavior and mobile tray styles. This should become config + scoped CSS.

### Target Behavior

- Horizontal/list-like product presentation.
- Underline/category navigation if required by target.
- Row-based product card mode.
- Sidebar summary uses selected rows or horizontal slots according to target.
- Mobile summary tray works.
- Progress bar and timeline use shared components.

### Tasks

1. Create `full-page/templates/horizontal.config.js`.
2. Create/clean `template-horizontal.css`.
3. Add product-card `row` mode if not already present.
4. Render FPB Horizontal product list/rows using shared product-card row mode.
5. Use `selected-product-row.js` for sidebar unless target requires slots.
6. Replace Horizontal mobile progress/tray special CSS with scoped template CSS.
7. Remove runtime CSS injection from `horizontal-template.js` once migrated.

### Storefront Visual Checks

- Horizontal product rows/cards align correctly.
- Product title truncation works.
- Selected state works.
- Sidebar selected rows update.
- Mobile tray expands/collapses correctly.

### Acceptance Criteria

- FPB Horizontal is included in the refactor, not deferred.
- No long runtime CSS remains for Horizontal.
- No template CSS leaks to other FPB templates.

---

# 11. Product Page Template Migration Loops

---

## Loop 11 — Product Page Registry and Template Normalization

### Goal

Introduce product-page template registry before migrating individual PPB templates.

### Current Context

Current product-page templates are prototype installers:

- `cascade-template.js` → `PDP_INPAGE + CASCADE`
- `cognive-template.js` → `PDP_INPAGE + COGNIVE`
- `modal-slot-template.js` → `PDP_MODAL` with horizontal/vertical orientation

### Tasks

1. Add `product-page/templates/registry.js`.
2. Add config files:
   - `grid.config.js`
   - `list.config.js`
   - `horizontal-slots.config.js`
   - `vertical-slots.config.js`
3. Map current identifiers:
   - `COGNIVE` → `GRID`
   - `CASCADE` → `LIST`
   - `PDP_MODAL + horizontal` → `HORIZONTAL_SLOTS`
   - `PDP_MODAL + vertical/SIMPLIFIED` → `VERTICAL_SLOTS`
4. Keep legacy identifiers supported through a resolver.

### Acceptance Criteria

- Existing PPB templates still render.
- App can resolve all 4 target PPB template configs.
- No visual change expected.

---

## Loop 12 — PPB List Migration (`CASCADE`)

### Goal

Migrate PPB List from Cascade prototype helpers into config + renderer + scoped CSS.

### Current Context

`cascade-template.js` currently:

- Detects `PDP_INPAGE + CASCADE`.
- Computes selected product entries.
- Builds a selected-items drawer.
- Builds footer discount message.
- Patches methods onto the product-page prototype.

### Target Behavior

- Product rows/list layout.
- Category tabs if configured.
- Product row with image, title, price, add/selected control.
- Selected drawer/list footer.
- Shared discount progress/message.

### Tasks

1. Create `render-product-page-list.js`.
2. Create/clean `product-page-list.css`.
3. Replace Cascade product row rendering with shared product-card row mode.
4. Replace `_getSelectedProductEntries()` with shared selector.
5. Replace `_renderCascadeFooter()` with shared selected rows + progress component.
6. Keep `CASCADE` data attributes during compatibility phase.
7. Remove Cascade prototype installer after migration.

### Storefront Visual Checks

- Product rows match PPB List mockup structurally.
- Add button and quantity selected state work.
- Selected drawer opens/closes.
- Discount message/progress updates.
- Add Bundle to Cart updates and submits.

### Acceptance Criteria

- PPB List fully covered by agentic plan.
- No product row overflow.
- No runtime prototype dependency for Cascade/List.

---

## Loop 13 — PPB Grid Migration (`COGNIVE`)

### Goal

Migrate PPB Grid from Cognive prototype wrapper into first-class config + renderer + scoped CSS.

### Current Context

`cognive-template.js` is a thin wrapper that detects `PDP_INPAGE + COGNIVE`, marks grid template, enables compact in-page cards, and reuses Cascade footer.

### Target Behavior

- Grid product-card layout.
- Cards use shared product-card grid/compact mode.
- Footer or selected drawer uses shared summary and progress.
- Add Bundle to Cart behaves correctly.

### Tasks

1. Create `render-product-page-grid.js`.
2. Create/clean `product-page-grid.css`.
3. Replace Cognive product grid rendering with shared product-card grid mode.
4. Replace Cognive footer reuse of Cascade with shared summary/progress renderer.
5. Keep `COGNIVE` as legacy preset alias for `GRID`.
6. Remove Cognive prototype installer after migration.

### Storefront Visual Checks

- Product grid matches PPB Grid mockup structurally.
- Cards do not overflow at selected state.
- Category tabs render correctly if present.
- Footer/drawer selected count updates.
- Discount progress works.

### Acceptance Criteria

- PPB Grid is migrated and verified.
- No dependency on Cascade footer internals.
- No CSS leakage to PPB List or slot templates.

---

## Loop 14 — PPB Horizontal Slots Migration

### Goal

Migrate horizontal slot template into first-class renderer and scoped CSS.

### Current Context

`modal-slot-template.js` handles `PDP_MODAL` templates and creates modal slot step sections. Horizontal slots are the non-vertical branch, usually `PDP_MODAL + MODAL + horizontal orientation`.

### Target Behavior

- Horizontal slot cards render in a grid/row as shown in target mockup.
- Empty slots show visual/image and label.
- Filled slots show selected/default product.
- Free gift/default slots remain supported.
- Bottom sheet product picker works.
- Add Bundle to Cart updates correctly.

### Tasks

1. Create `render-product-page-horizontal-slots.js`.
2. Create/clean `product-page-horizontal-slots.css`.
3. Use shared `selected-product-slots.js` for empty/filled/default/free-gift states.
4. Move empty slot card logic out of prototype patching.
5. Keep modal product picker behavior intact.
6. Verify slot orientation resolver maps current data to `HORIZONTAL_SLOTS`.
7. Remove horizontal slot behavior from `modal-slot-template.js` after migration.

### Storefront Visual Checks

- Empty slots align horizontally.
- Filled selected slots render images and labels.
- Remove action works.
- Add more opens bottom sheet/modal.
- Default/included products cannot be removed.
- Free gift lock/unlock works if present.

### Acceptance Criteria

- PPB Horizontal Slots fully migrated.
- Slot states use shared slot component.
- No regression in PPB Vertical Slots.

---

## Loop 15 — PPB Vertical Slots Migration

### Goal

Migrate vertical slot template into first-class renderer and scoped CSS.

### Current Context

`modal-slot-template.js` returns vertical layout when:

- template type is `PDP_MODAL`, and
- `renderFilledSlotsAsHorizontalStacked` is false, or
- design preset is `SIMPLIFIED`.

### Target Behavior

- Vertical slot/accordion-like list.
- Empty slots have text and visual area.
- Filled slots show selected products in rows.
- Add more/open modal works.
- Add Bundle to Cart and dynamic checkout visual remain aligned.

### Tasks

1. Create `render-product-page-vertical-slots.js`.
2. Create/clean `product-page-vertical-slots.css`.
3. Use shared `selected-product-slots.js` in vertical mode.
4. Replace `_usesVerticalModalSlotLayout()` branches with template config resolver.
5. Preserve legacy `SIMPLIFIED` mapping.
6. Move vertical slot CSS out of `modal-slots.css` into scoped template CSS.
7. Remove vertical slot prototype patches after migration.

### Storefront Visual Checks

- Vertical slots match PPB Vertical Slots mockup structurally.
- Empty and filled states are stable.
- Product selection modal opens correctly.
- Remove and add-more behavior works.
- Add Bundle to Cart state updates.

### Acceptance Criteria

- PPB Vertical Slots fully migrated.
- No dependency on modal-slot prototype installer.
- No regression in Horizontal Slots.

---

# 12. Cross-Template Integration Loops

---

## Loop 16 — Shared Step Timeline Integration Across FPB Templates

### Goal

Use the shared timeline component across all FPB templates.

### Templates Covered

```txt
FPB Standard
FPB Classic
FPB Compact
FPB Horizontal
```

### Tasks

1. Replace existing FPB timeline rendering with shared timeline.
2. Compute timeline state in selectors.
3. Template config chooses timeline visual mode.
4. Verify current/completed/locked state for every FPB template.

### Acceptance Criteria

- Timeline works for all 4 FPB templates.
- Timeline visual mode is config-driven.
- No template-specific business logic inside timeline renderer.

---

## Loop 17 — Shared Discount Progress Across All 8 Templates

### Goal

Ensure every template uses the shared discount progress component.

### Templates Covered

All 8 templates.

### Tasks

1. Replace remaining custom progress code in FPB.
2. Replace Cascade/Cognive/List/Grid footer progress logic.
3. Replace modal slot / bottom-sheet progress logic.
4. Verify progress messages use existing language/template settings.

### Acceptance Criteria

- One progress component is used everywhere.
- Discount progress updates after select/remove/qty changes.
- Visual verification passes on all templates.

---

## Loop 18 — Shared Cart and Checkout Integration

### Goal

Move cart line building to shared engine for both FPB and PPB.

### Tasks

1. Add/finish `cart-lines.js`.
2. Add/finish `cart-submit.js`.
3. Use shared cart lines in FPB.
4. Use shared cart lines in PPB.
5. Preserve widget-specific redirect/side-cart behavior.
6. Verify default products and free gifts are included correctly.

### Acceptance Criteria

- Cart payload is correct for all 8 templates.
- Default products are included.
- Free gifts behave correctly.
- Add-to-cart success verified on storefront.

---

## Loop 19 — Remove Prototype Template Installers

### Goal

Delete the old template installer architecture after all templates have migrated.

### Tasks

1. Remove full-page installer imports.
2. Remove product-page installer imports.
3. Remove `installStandardTemplate`, `installClassicTemplate`, `installCompactTemplate`, `installHorizontalTemplate` usage.
4. Remove `installCascadeTemplate`, `installCogniveTemplate`, `installModalSlotTemplate` usage.
5. Keep compatibility aliases in registry resolvers.

### Acceptance Criteria

- No prototype patching remains for templates.
- All templates still render.
- Tests and visual checks pass.

---

## Loop 20 — Runtime CSS Cleanup

### Goal

Remove long runtime CSS strings and move all template CSS to scoped CSS files.

### Tasks

1. Search for `style.textContent` template CSS blocks.
2. Move remaining CSS into template CSS files.
3. Keep only tiny dynamic CSS variable assignments if needed.
4. Ensure CSS is loaded through the existing asset pipeline.
5. Confirm scoped selectors are used.

### Acceptance Criteria

- No large runtime CSS injection remains.
- Template CSS is inspectable in browser DevTools.
- No CSS leakage across templates.

---

## Loop 21 — Full Visual Regression Pass on Storefront

### Goal

Complete full storefront verification across all templates.

### Tasks

For each template:

1. Open storefront page using Shopify plugin/context.
2. Use Chrome DevTools MCP at 1440px, 768px, and 390px.
3. Test:
   - empty state
   - selected state
   - quantity controls
   - remove product
   - discount progress
   - timeline/step state
   - add to cart
4. Capture screenshots.
5. Record console/network errors.

### Acceptance Criteria

- All 8 templates pass visual verification.
- Screenshots saved or documented.
- No unresolved visual blockers.

---

## Loop 22 — Final File Size, Dead Code, and Documentation Cleanup

### Goal

Finalize maintainability.

### Tasks

1. Run file-size guard.
2. Split any file over 500 lines.
3. Delete stale code:
   - old desktop footer fallback
   - old runtime CSS installers
   - unused modal footer code
   - duplicate product card code paths
   - stale broad CSS selectors
4. Update docs:
   - architecture overview
   - template registry guide
   - testing guide
   - storefront visual QA checklist

### Acceptance Criteria

- No file over 500 lines.
- No stale desktop full-page footer path.
- Docs explain how to add or modify a template.
- All tests/build pass.

---

# 13. Per-Template Definition of Done

## FPB Standard

- 3-column desktop grid.
- 2-column mobile grid.
- Shared product cards.
- Sidebar selected rows + skeleton rows.
- Box selection pills.
- Shared progress bar.
- Timeline works.
- No overflow.

## FPB Classic

- 4-column desktop grid.
- Compact card layout.
- Slot-grid sidebar.
- Category pills centered.
- Shared progress bar.
- No overflow.

## FPB Compact

- Compact/dense card layout.
- Compact sidebar/summary.
- Shared product card.
- Shared progress.
- Mobile tray works.
- No overflow.

## FPB Horizontal

- Horizontal/list-like product layout.
- Underline/category nav if configured.
- Shared row card mode.
- Sidebar summary works.
- Shared progress.
- Mobile tray works.

## PPB Grid

- COGNIVE legacy mapping preserved.
- Grid cards use shared product-card component.
- Footer/selected drawer uses shared components.
- Progress works.
- Add to cart works.

## PPB List

- CASCADE legacy mapping preserved.
- Product rows use shared row mode.
- Selected drawer uses shared selected rows.
- Progress works.
- Add to cart works.

## PPB Horizontal Slots

- Horizontal slot layout works.
- Empty/filled/default/free-gift slots use shared slot component.
- Modal/bottom sheet opens.
- Add to cart works.

## PPB Vertical Slots

- Vertical slot layout works.
- SIMPLIFIED legacy mapping preserved.
- Empty/filled/default/free-gift slots use shared slot component.
- Modal/bottom sheet opens.
- Add to cart works.

---

# 14. Final Stop Condition

The agent may stop only when all of the following are true:

```txt
1. All 8 templates are migrated or explicitly integrated into the new registry/config/render system.
2. All 8 templates pass storefront visual verification.
3. Product card selected-state overflow is fixed across FPB and PPB.
4. Sidebar/summary rendering is shared and template-config driven.
5. Timeline rendering is shared and state-driven.
6. Discount progress rendering is shared and state-driven.
7. Cart line building is shared across FPB and PPB.
8. Runtime template CSS strings are removed.
9. Prototype template installers are removed.
10. No source file exceeds 500 lines.
11. Tests/build/lint pass or unavailable scripts are documented.
12. A final visual QA matrix is completed.
```

---

# 15. Agent Self-Review Checklist

Before closing each loop, the agent must answer:

```txt
Did I change only the intended scope?
Did tests/build/lint pass?
Did I check browser console errors?
Did I verify on storefront with Chrome DevTools MCP?
Did I capture or record screenshots?
Did I avoid hard-coded colors?
Did I keep files under 500 lines?
Did I avoid creating new abstraction complexity?
Did I update the loop ledger?
```

If any answer is “no,” the loop is not complete.

---

# End of Agentic Loop Plan
