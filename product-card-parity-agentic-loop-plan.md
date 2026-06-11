# Agentic Loop Plan: Product Card Parity Slice for PPB + FPB Templates

## Purpose

Open a focused parity slice for **Product Cards** across the 8 Wolfpack design templates and make the Product Card design match the EB reference implementation as closely as possible.

This document is intended to be supplied directly to Codex. Treat the current repository as the only source of truth. Do not rely on earlier file paths, older attached CSS files, or previous refactor assumptions unless they still exist in the current repo.

---

## Target Templates

The parity slice covers these 8 templates:

### FPB templates

1. FPB Standard
2. FPB Classic
3. FPB Compact
4. FPB Horizontal

### PPB templates

5. PPB Grid
6. PPB List
7. PPB Vertical Slots
8. PPB Horizontal Slots

---

## Primary Goal

Make the **Product Card design** for each of the 8 templates visually and structurally match the EB reference implementation.

The goal is parity for the card itself, not a broad redesign of the entire widget.

---

## Core Constraints

1. **Modify existing Product Card CSS first**
   - Find and update the current CSS that already controls Product Cards.
   - Do not add new CSS properties unless absolutely necessary.
   - If a new property is necessary, document why no existing declaration can own that behavior.

2. **No patchwork or hotfix layering**
   - Do not add late-cascade overrides just to beat earlier incorrect rules.
   - Do not stack multiple selectors that set the same property on the same element.
   - Do not use broad selectors when a more correct existing owner exists.
   - Avoid `!important`; only retain or replace it when the current architecture already requires it and there is no safe alternative.

3. **Single owner per Product Card behavior**
   - Each visual behavior must have one clear CSS owner.
   - If multiple rules set the same card property, consolidate or remove the incorrect duplicate instead of adding another override.

4. **No competitor-prefix leakage**
   - Do not introduce any competitor-specific CSS prefix, selector token, variable token, comment token, test token, or docs token.
   - If existing CSS/comments/tests contain competitor-specific bundle-prefix wording, rename it to `wp` or a neutral Wolfpack-owned term.
   - Do not preserve competitor implementation class names in comments. Use terms like “EB reference,” “reference implementation,” or “captured reference behavior.”

5. **CSS scope only unless strictly required**
   - The expected fix surface is CSS related to Product Cards.
   - JavaScript should only be touched if the current DOM prevents the correct CSS from applying or if a template selector/state class is wrong.
   - Do not change product-selection logic, pricing logic, discount logic, cart logic, or bundle rules as part of this parity slice.

6. **Use Chrome and Shopify plugins when needed**
   - Use Chrome for live visual comparison, screenshots, computed-style inspection, DOM inspection, and bounding-box measurement.
   - Use Shopify only when store configuration, theme preview, template assignment, fixture data, or live product/bundle state needs to be inspected or adjusted.

---

## Product Card Scope Definition

### In scope

Product Card parity includes:

- Product card outer container
- Grid/list/slot container only where it controls card sizing, orientation, gap, wrapping, or scroll behavior
- Product image wrapper
- Product image itself
- Product title
- Product content wrapper
- Product price row
- Final price
- Strike/original price
- Variant badge or inline variant UI when rendered inside the card
- Add button / choose button / plus button
- Quantity controls when expanded inside the Product Card
- Selected state
- Added state
- Disabled/dimmed/maxed state
- Out-of-stock state
- Free/default-included state if rendered as a Product Card state
- Empty slot state for PPB slot templates when it visually replaces a Product Card

### Out of scope

Do not intentionally refactor:

- Header/banner sections
- Step tabs or category tabs except where their spacing directly affects Product Card grid measurement
- Sidebar/cart/footer summaries except selected-product mini cards if they share Product Card selectors
- Progress bars
- Discounts and tier logic
- Modal internals unless Product Card click state depends on modal-trigger styling
- Shopify product data model
- Cart/checkout behavior
- Analytics/pixel tracking

---

## Required Working Principle

For every mismatch, Codex must answer this before editing:

> Which existing CSS declaration currently controls the incorrect Product Card rendering, and why is that the correct declaration to modify?

Do not make changes before identifying the owning declaration.

---

# Loop 0: Repo Discovery and Current-State CSS Inventory

## Objective

Find the current Product Card styling architecture after the latest refactor. Do not assume old paths.

## Actions

1. Search the current repository for Product Card selectors, components, and template files.

Suggested searches:

```bash
rg -n "product[-_ ]?card|ProductCard|productImage|product-image|product_title|product-title|productPrice|product-price|price-row|add-btn|addButton|quantity|variant-badge|selected-overlay|slot" .
```

2. Search for template names and preset IDs.

```bash
rg -n "FPB|full.?page|PPB|product.?page|Standard|Classic|Compact|Horizontal|Grid|List|Vertical Slots|Horizontal Slots|VerticalSlots|HorizontalSlots" .
```

3. Search for existing CSS variables related to Product Cards.

```bash
rg -n "--.*product.*card|--.*product.*image|--.*product.*price|--.*product.*title|--.*card|--.*add.*btn|--.*quantity|--.*variant" .
```

4. Search for competitor-specific naming debt without adding new occurrences to docs or comments.
   - If found, rename to `wp` or a neutral Wolfpack term.
   - Keep this as a cleanup step tied to changed files.
   - Do not preserve competitor-prefixed selector names in comments unless they are external-only data that cannot be changed.

5. Produce a Product Card CSS ownership map.

## Output

Create a working note in the Codex session with this structure:

```md
## Product Card CSS Ownership Map

### Shared owners
- Card container:
- Image wrapper:
- Image element:
- Content wrapper:
- Title:
- Price row:
- Final price:
- Strike price:
- CTA/add button:
- Quantity controls:
- Variant badge/UI:
- Selected/disabled states:

### Template owners
- FPB Standard:
- FPB Classic:
- FPB Compact:
- FPB Horizontal:
- PPB Grid:
- PPB List:
- PPB Vertical Slots:
- PPB Horizontal Slots:

### Conflicts found
- Selector/property conflict:
- Affected templates:
- Proposed owner:
```

## Exit Criteria

- Current file locations are known.
- Current selector ownership is known.
- Any competitor-prefix naming debt in touched CSS/comments/tests is scheduled for cleanup.
- No visual fixes have been made yet.

---

# Loop 1: EB Reference Capture

## Objective

Create a precise Product Card reference for each of the 8 templates before editing Wolfpack CSS.

## Actions

1. Use Shopify if needed to confirm the correct Wolfpack template configuration and preview URLs.
2. Use Chrome to open the EB reference and Wolfpack implementation side-by-side.
3. Capture screenshots for each template at required viewports.
4. Inspect computed styles for the Product Card and all in-scope child elements.
5. Record bounding boxes for card and child elements.
6. Capture every required Product Card state.

## Required viewports

| Label | Size |
|---|---:|
| Desktop large | 1440 × 900 |
| Desktop medium | 1280 × 800 |
| Tablet | 768 × 1024 |
| Mobile standard | 390 × 844 |
| Mobile narrow | 360 × 800 |

Use device scale factor `1` unless the existing visual-regression setup requires another value.

## Required product fixtures

Use equivalent product fixtures in EB and Wolfpack:

1. Normal product with square image
2. Product with long title, 60–90 characters
3. Product with sale price and strike/original price
4. Product with variants
5. Out-of-stock product
6. Product with tall image
7. Product with wide image
8. Product with missing-image fallback
9. Free/default-included product if supported
10. Product that becomes disabled/dimmed after max selection if supported

## Required states

For every template, capture:

- Initial/default card
- Hover state on desktop
- Selected/added state
- Quantity-expanded state if available
- Disabled/dimmed state
- Out-of-stock state
- Variant-selected state if variants render in card
- Long-title state
- Sale-price state
- Mobile tapped state
- Empty slot state for PPB slot templates

## Measurement fields

For each card and child element, record:

- `x`, `y`, `width`, `height`
- `display`
- `grid-template-columns`
- `grid-template-rows`
- `flex-direction`
- `align-items`
- `justify-content`
- `gap`
- `padding`
- `margin`
- `border`
- `border-radius`
- `box-shadow`
- `background`
- `overflow`
- `object-fit`
- `font-size`
- `font-weight`
- `line-height`
- `letter-spacing`
- `text-align`
- `white-space`
- line clamp/truncation behavior
- CTA/add button dimensions and alignment

## Output

Create an EB reference matrix:

```md
## EB Product Card Reference Matrix

### Template: <template name>
Viewport:
State:
Card bbox:
Image bbox:
Content bbox:
Title computed styles:
Price row computed styles:
CTA computed styles:
Observed deltas vs Wolfpack:
Likely owning Wolfpack selector:
```

## Exit Criteria

- EB reference card behavior is captured for all 8 templates.
- Wolfpack deltas are documented before any CSS edits.
- Screenshots and computed-style notes exist for before-state comparison.

---

# Loop 2: Shared CSS Normalization

## Objective

Fix Product Card parity at the most shared correct layer before touching template-specific CSS.

## Actions

1. Compare all 8 EB references and identify shared Product Card invariants.
2. Identify which Wolfpack shared CSS currently controls those invariants.
3. Modify existing shared declarations where the mismatch is common to multiple templates.
4. Remove or consolidate conflicting duplicate declarations when they target the same selector/property.
5. Avoid template-specific overrides for behavior that should be shared.

## Shared behavior candidates

Evaluate whether these are shared across FPB/PPB or only within a family:

- Base card display mode
- Card border radius
- Card background
- Card border
- Card box shadow
- Image object-fit
- Title line clamp
- Title overflow behavior
- Price row display direction
- CTA/add button base sizing
- Selected/disabled state treatment

## Do not do this

Do not create broad new rules like:

```css
.product-card { ... }
```

unless `.product-card` is already the correct current owner and the existing declaration is being edited in place.

## Exit Criteria

- Shared mismatches are fixed once at the correct shared owner.
- No template-specific files contain duplicated shared Product Card declarations.
- FPB and PPB smoke checks still render.

---

# Loop 3: FPB Standard Product Cards

## Objective

Make FPB Standard Product Cards match EB and establish the FPB baseline.

## Actions

1. Open EB FPB Standard and Wolfpack FPB Standard in Chrome.
2. Compare Product Card at all required viewports.
3. Inspect computed styles for every mismatch.
4. Edit the existing FPB Standard/shared FPB CSS owner.
5. Re-run all FPB Standard card states.
6. Confirm FPB Classic, Compact, and Horizontal did not regress.

## Specific checks

- Desktop grid column count and gap
- Card width/height
- Image ratio and crop behavior
- Content padding
- Title typography and clamp
- Price row spacing and alignment
- Add button size, alignment, and selected state
- Mobile 2-column or template-expected layout
- Long-title behavior
- Sale-price behavior

## Exit Criteria

- FPB Standard card matches EB within visual-diff threshold.
- Shared FPB CSS remains clean and not over-scoped.
- No duplicate declarations were introduced.

---

# Loop 4: FPB Classic Product Cards

## Objective

Make FPB Classic Product Cards match EB without bypassing the current Classic architecture.

## Actions

1. Locate current Classic-specific CSS/runtime styling in the repo.
2. Confirm whether Classic Product Card geometry is owned by bundled CSS, runtime CSS, template CSS, or CSS variables.
3. Compare EB Classic and Wolfpack Classic in Chrome.
4. Update the existing Classic owner only where Classic legitimately diverges from FPB Standard.
5. Remove redundant Classic overrides that merely duplicate shared FPB card behavior.
6. Verify desktop and mobile.

## Specific checks

- Desktop product grid column count
- Mobile product grid column count
- Card geometry
- Image geometry
- Title row height and alignment
- Price row placement
- Add button size and position
- Hidden/visible variant and quantity elements
- Selected/added state

## Exit Criteria

- Classic Product Cards match EB.
- Classic-specific CSS contains only true Classic deltas.
- No old competitor-prefix comments or selector references remain in touched files.

---

# Loop 5: FPB Compact Product Cards

## Objective

Make FPB Compact Product Cards match EB while preserving Compact density.

## Actions

1. Compare EB Compact and Wolfpack Compact at all required viewports.
2. Identify whether differences are inherited from shared FPB or owned by Compact-specific CSS.
3. Modify existing Compact Product Card CSS only where Compact differs from Standard.
4. Test interactions and mobile tray/footer proximity.

## Specific checks

- Compact card density
- Card height
- Image-to-content ratio
- Title line height and truncation
- Price row spacing
- Add button dimensions and placement
- Quantity-expanded state
- Mobile viewport overlap with sticky/floating UI

## Exit Criteria

- FPB Compact cards match EB.
- Compact fixes do not affect Standard, Classic, or Horizontal.
- No extra duplicate card rules remain.

---

# Loop 6: FPB Horizontal Product Cards

## Objective

Make FPB Horizontal Product Cards match EB, especially where orientation differs from vertical cards.

## Actions

1. Compare EB Horizontal and Wolfpack Horizontal in Chrome.
2. Determine whether Product Cards are vertical cards in a horizontal scroller or true horizontal row cards.
3. Identify existing orientation-specific CSS owner.
4. Fix only the declarations that control orientation, image sizing, content sizing, and CTA alignment.
5. Verify desktop, tablet, and mobile behavior.

## Specific checks

- Horizontal card orientation
- Image width/height
- Content column sizing
- Title alignment and truncation
- Price alignment
- CTA/add button placement
- Horizontal scrolling or wrapping behavior
- Mobile fallback behavior

## Exit Criteria

- FPB Horizontal Product Cards match EB.
- No vertical-card assumptions leak into Horizontal.
- No shared FPB regressions.

---

# Loop 7: PPB Grid Product Cards

## Objective

Make PPB Grid Product Cards match EB and establish the PPB baseline.

## Actions

1. Open EB PPB Grid and Wolfpack PPB Grid.
2. Compare all required states and viewports.
3. Find current PPB Grid card CSS ownership.
4. Fix shared PPB card declarations where applicable.
5. Rename any outdated or unclear template naming to `Grid` if it refers to this template and is safe to change.

## Specific checks

- Grid card dimensions
- Grid column count and gap
- Product image crop/fit
- Title placement
- Price display
- Button or selection state
- Variant state if present
- Mobile wrapping

## Exit Criteria

- PPB Grid matches EB.
- PPB Grid becomes the clean baseline for PPB cards.
- Any outdated internal template label referring to Grid is replaced where safe.

---

# Loop 8: PPB List Product Cards

## Objective

Make PPB List Product Cards match EB without forcing Grid geometry into a list layout.

## Actions

1. Compare EB PPB List and Wolfpack PPB List.
2. Determine the current owner for list-card orientation and dimensions.
3. Fix existing List-specific Product Card CSS.
4. Confirm shared PPB card typography and state rules still apply where intended.

## Specific checks

- Row/card height
- Thumbnail dimensions
- Content stack
- Title truncation
- Price alignment
- CTA/action alignment
- Quantity or selected state
- Mobile list density

## Exit Criteria

- PPB List matches EB.
- Grid and slot templates do not regress.
- List-specific CSS owns only list-specific differences.

---

# Loop 9: PPB Vertical Slots Product Cards

## Objective

Make PPB Vertical Slots Product Cards and empty slot cards match EB.

## Actions

1. Compare EB PPB Vertical Slots and Wolfpack PPB Vertical Slots.
2. Separate filled slot card behavior from empty slot placeholder behavior.
3. Find current CSS owners for filled slots and empty slots.
4. Fix existing declarations instead of layering new slot overrides.
5. Verify filled, empty, selected, removed, and mobile states.

## Specific checks

- Filled slot card geometry
- Empty slot card geometry
- Product image or placeholder area
- Product title and price alignment
- Add/remove control placement
- Vertical stacking gap
- Mobile slot layout

## Exit Criteria

- PPB Vertical Slots match EB.
- Empty slot states match EB.
- Fixes do not affect PPB Grid/List unless intentionally shared.

---

# Loop 10: PPB Horizontal Slots Product Cards

## Objective

Make PPB Horizontal Slots Product Cards and empty horizontal slots match EB.

## Actions

1. Compare EB PPB Horizontal Slots and Wolfpack PPB Horizontal Slots.
2. Identify whether layout is row-based, scroll-based, or wrapping.
3. Find current CSS owners for slot card dimensions, image placement, text stack, and controls.
4. Fix existing declarations.
5. Verify desktop and mobile slot behavior.

## Specific checks

- Horizontal slot dimensions
- Thumbnail/image placement
- Product title and variant alignment
- Price alignment
- Add/remove button placement
- Empty slot state
- Horizontal overflow behavior
- Mobile wrapping/scroll behavior

## Exit Criteria

- PPB Horizontal Slots match EB.
- Horizontal slot CSS does not regress PPB Vertical Slots.
- No duplicate slot-card properties remain.

---

# Loop 11: Cross-Template Regression Pass

## Objective

Confirm all 8 templates still match EB after all local fixes.

## Actions

1. Re-test all 8 templates at all required viewports.
2. Re-test all required Product Card states.
3. Compare before/after screenshots.
4. Run automated tests available in the repo.
5. Run linting/formatting if available.
6. Search changed files for duplicate declarations and naming leakage.

Suggested checks:

```bash
# Run whatever the repo supports; examples only.
npm test
npm run lint
npm run build
npm run typecheck
```

Search changed CSS for duplicate-looking Product Card selectors:

```bash
rg -n "product[-_ ]?card|product-image|product-title|product-price|price-row|add-btn|quantity|variant-badge|slot" <changed-files>
```

Search changed files for competitor-prefix leakage using the repository's known naming-debt search terms, but do not add those terms to comments/docs.

## Exit Criteria

- All 8 templates pass manual Chrome verification.
- Automated tests pass or unrelated failures are documented.
- No changed file contains competitor-prefix leakage.
- No duplicate Product Card declarations remain.
- No unrelated widget areas changed visually.

---

# Visual Diff and Acceptance Thresholds

Because the goal is exact Product Card parity:

| Area | Threshold |
|---|---:|
| Product Card bounding box | 0 px difference, except browser rounding up to 1 px |
| Product image bounding box | 0 px difference, except browser rounding up to 1 px |
| Content wrapper bounding box | 0 px difference, except browser rounding up to 1 px |
| CTA/add button dimensions | Exact computed match |
| Padding/gap/margin | Exact computed match |
| Border width/radius | Exact computed match |
| Font size/weight/line-height | Exact computed match |
| Colors | Exact computed match |
| Screenshot diff inside card crop | Maximum 0.5% differing pixels |
| Visible clustered difference | Fail if larger than 10 px unless caused only by product image content |

A mismatch is acceptable only if it is documented as one of:

- Browser subpixel rounding
- Product image asset difference
- Font rendering difference outside CSS control
- EB behavior that is intentionally impossible because of Wolfpack-owned architecture, with explicit approval

---

# CSS Quality Gate

Before finalizing, verify:

1. Every changed CSS declaration is Product Card related or directly required by Product Card layout.
2. No unrelated header, footer, sidebar, banner, discount, or checkout CSS was changed.
3. Existing declarations were modified instead of adding new duplicate declarations.
4. No broad new selector was added when a precise existing selector exists.
5. No new `!important` was introduced unless explicitly justified.
6. No two selectors now fight over the same Product Card property.
7. No competitor-specific prefix/token appears in changed CSS, comments, docs, tests, or generated artifacts.
8. PPB fixes do not regress FPB.
9. FPB fixes do not regress PPB.
10. Template-specific fixes are scoped only to that template.
11. Product Card layout does not shift after image load.
12. Product Card content does not overlap sticky footers, side panels, trays, or slot containers.

---

# Final Stopping Criteria

The parity slice is complete only when all of the following are true:

1. FPB Standard Product Cards match EB.
2. FPB Classic Product Cards match EB.
3. FPB Compact Product Cards match EB.
4. FPB Horizontal Product Cards match EB.
5. PPB Grid Product Cards match EB.
6. PPB List Product Cards match EB.
7. PPB Vertical Slots Product Cards and empty slot states match EB.
8. PPB Horizontal Slots Product Cards and empty slot states match EB.
9. All required desktop, tablet, and mobile viewports pass.
10. All required Product Card states pass.
11. Computed style differences are zero or documented as approved browser rounding.
12. Visual diffs inside Product Card crops are within threshold.
13. CSS ownership map has one clear owner for every Product Card behavior.
14. No duplicate/conflicting card declarations remain in changed files.
15. No competitor-prefix leakage remains in changed CSS/comments/tests/docs.
16. No unrelated visual areas changed.
17. Automated tests, linting, typecheck, and build pass where available.
18. Chrome screenshots are attached for EB reference, Wolfpack before, and Wolfpack after.
19. Shopify preview links are recorded for all 8 tested templates if Shopify was used.
20. The final PR summary lists every changed selector and why it was changed.

---

# Recommended Commit Breakdown

Use small reviewable commits:

1. `product-card-parity/repo-discovery-and-ownership-map`
2. `product-card-parity/reference-capture`
3. `product-card-parity/shared-css-normalization`
4. `product-card-parity/fpb-standard`
5. `product-card-parity/fpb-classic`
6. `product-card-parity/fpb-compact`
7. `product-card-parity/fpb-horizontal`
8. `product-card-parity/ppb-grid`
9. `product-card-parity/ppb-list`
10. `product-card-parity/ppb-vertical-slots`
11. `product-card-parity/ppb-horizontal-slots`
12. `product-card-parity/final-regression-and-cleanup`

---

# PR Summary Template

Use this final PR summary format:

```md
## Product Card Parity Slice

### Scope
- Templates covered:
- Product Card states covered:
- Viewports covered:

### Source of truth
- EB reference pages/screenshots used:
- Shopify preview links used:

### CSS ownership changes
| Behavior | Old owner | New/final owner | Reason |
|---|---|---|---|
| Card dimensions | | | |
| Image geometry | | | |
| Title typography | | | |
| Price row | | | |
| CTA/add button | | | |
| Selected/disabled states | | | |

### Template results
| Template | Status | Notes |
|---|---|---|
| FPB Standard | Pass/Fail | |
| FPB Classic | Pass/Fail | |
| FPB Compact | Pass/Fail | |
| FPB Horizontal | Pass/Fail | |
| PPB Grid | Pass/Fail | |
| PPB List | Pass/Fail | |
| PPB Vertical Slots | Pass/Fail | |
| PPB Horizontal Slots | Pass/Fail | |

### Testing
- Chrome visual comparison:
- Computed-style comparison:
- Screenshot diff:
- Build:
- Lint:
- Tests:

### Guardrails confirmed
- No unrelated CSS changed:
- No duplicate Product Card declarations added:
- No unnecessary new CSS properties added:
- No new `!important` added:
- No competitor-prefix leakage remains in changed files:
```

---

# Codex Execution Reminder

Do not solve this by piling overrides. The correct path is:

1. Capture EB behavior.
2. Locate the current Wolfpack owner.
3. Modify the owning declaration.
4. Remove conflicts.
5. Verify across all 8 templates.
6. Stop only when the Product Card parity criteria pass.

---

# Loop 12: Product Card State and FPB Text-Button Parity

## Objective

Open a focused continuation loop for Product Card interaction states after the base card geometry pass:

1. Match EB selected and unselected Product Card states for both FPB and PPB.
2. Match EB add-button state transitions for both FPB and PPB.
3. Sync FPB Product Cards with the **Show Text on + Button** configuration.
4. Confirm that **Show Text on + Button** remains FPB-only, because EB applies this behavior only to FPB.

## EB Contract to Verify Before Editing

Capture live EB evidence for:

- FPB unselected card state.
- FPB selected/added card state.
- FPB quantity-expanded state, if EB expands quantity inside the card.
- FPB with **Show Text on + Button** disabled: compact `+` icon button.
- FPB with **Show Text on + Button** enabled: text button replaces the `+` icon and moves below the price.
- PPB unselected card state.
- PPB selected/added card state.
- PPB quantity or selected-item state, if rendered in the card or slot.
- PPB behavior when the analogous text-button setting exists in Wolfpack: do **not** apply FPB-only EB behavior to PPB unless fresh EB evidence proves it.

## Wolfpack Owner Discovery

Before editing, identify the current owner for each behavior:

| Behavior | Expected owner to confirm |
|---|---|
| FPB CTA mode decision | Runtime bundle settings / `data-fpb-card-cta-mode` |
| FPB add button copy | `getProductAddButtonText()` or current FPB card renderer |
| FPB selected card DOM | FPB product card renderer and selection update methods |
| FPB selected card CSS | FPB shared/template product-card CSS |
| PPB selected card DOM | PPB in-page/modal render methods and selection update methods |
| PPB selected card CSS | PPB base/template product-card CSS |
| PPB text-button behavior | Should remain unchanged unless EB evidence says otherwise |

## Implementation Rules

1. Keep the FPB text-button implementation scoped to FPB.
2. Do not let PPB inherit FPB `Show Text on + Button` layout or copy.
3. Do not add a separate setting or fallback field.
4. Do not invent new merchant-facing copy.
5. If existing copy already comes from bundle text settings, reuse that single source.
6. Prefer the existing `data-fpb-card-cta-mode` / template-owner CSS path over adding broad overrides.
7. For selected/unselected visuals, patch the current card state owners rather than adding late global CSS.

## Verification

Run the following after changes:

1. Raw JS syntax check for any touched storefront widget JS.
2. `npm run build:widgets` if any widget JS changes.
3. `npm run minify:assets css` if any widget CSS changes.
4. Live Chrome verification for FPB:
   - icon mode unselected
   - icon mode selected
   - text mode unselected
   - text mode selected
5. Live Chrome verification for PPB:
   - unselected
   - selected
   - confirm FPB-only text-button behavior did not alter PPB.
6. Desktop and mobile screenshots for the states changed in this loop.

## Exit Criteria

- FPB selected/unselected states match EB.
- PPB selected/unselected states match EB.
- FPB `Show Text on + Button` enabled renders a text button below the price, matching EB.
- FPB `Show Text on + Button` disabled keeps the compact icon button.
- PPB does not receive the FPB-only text-button behavior.
- CSS ownership remains clear and scoped.
- Required builds/minification/checks pass.
