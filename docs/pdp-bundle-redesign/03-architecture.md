# Architecture Decision Record: PDP Bundle Redesign

**Feature ID:** pdp-bundle-redesign
**Status:** Architecture Complete
**Created:** 2026-03-18

---

## Context

The PDP bundle widget (`BundleWidgetProductPage` in `bundle-widget-product-page.js`) is functionally working but visually behind the Skai Lama reference. Three gaps need to close architecturally:

1. **Widget visual redesign** — slot cards, modal tabs, product cards, floating footer
2. **Free gift + default product** — `isFreeGift` / `isDefault` step support (exists in FPB, missing in PDP)
3. **Template auto-install** — `ensureProductBundleTemplate()` exists but is never called from configure page

---

## Constraints

- Must not break existing PDP bundles (no `isFreeGift`, no `isDefault` steps)
- All colors/borders via CSS custom properties — no hardcoded values in JS
- No DB schema changes (`isFreeGift`, `isDefault`, `defaultVariantId` already in Prisma)
- `api.ensure-product-template.tsx` currently exists as a stub — must be replaced with real implementation
- Widget version must be bumped (MINOR — new storefront feature)
- Responsive: 4-column desktop, 2-column mobile

---

## Options Considered

### Option A: In-Place Enhancement of Existing Class
Directly update `createEmptyStateCard`, `createSelectedProductCard`, and modal rendering methods within the existing `BundleWidgetProductPage` class. Add new methods for `createDefaultProductCard`, `createFreeGiftCard`, `renderFreeGiftSlotCard`.

- **Pros:** Minimal surface area of change; existing initialization, data loading, cart logic untouched; backward compatible (guards on `step.isFreeGift` / `step.isDefault` flags)
- **Cons:** Methods grow longer; old and new rendering logic coexist briefly during transition
- **Verdict:** ✅ Recommended — lowest regression risk

### Option B: Full Modal Re-architecture (separate render pipeline)
Create entirely separate `_renderNewSlotCards()` and `_renderNewModal()` methods, controlled by a feature flag in the widget config.

- **Pros:** Zero risk of breaking existing flow during development
- **Cons:** Code duplication; feature flags add complexity; eventually both paths must merge
- **Verdict:** ❌ Rejected — over-engineered for the scope; existing CSS infrastructure is already ready

### Option C: New Widget Class (BundleWidgetProductPageV2)
Extract redesigned logic into a new class extending the existing one.

- **Pros:** Clean rollback — load old/new based on DCP setting
- **Cons:** Two initialization paths; two bundles to maintain; much larger changeset
- **Verdict:** ❌ Rejected — scope doesn't justify it; existing class has all necessary hooks

---

## Decision: Option A — In-Place Enhancement

### Rationale

1. The existing CSS infrastructure (`.bw-slot-card`, `.bw-bs-*`, `.bw-slot-card--empty`, `.bw-slot-card--filled`) is already correct and wired to DCP CSS variables.
2. The `createEmptyStateCard` and `createSelectedProductCard` methods already branch on a "bottom-sheet mode" flag — the redesign extends this same branch.
3. `isFreeGift` / `isDefault` detection follows the exact same guard pattern used in FPB — no architectural innovation needed.
4. All modal rendering (`renderModalTabs`, `renderModalProducts`, floating footer) can be enhanced via targeted method edits without touching initialization/cart logic.

---

## Architecture: Template Auto-Install

### Current State
- `api.ensure-product-template.tsx` — stub route that returns a hardcoded "use Theme Editor" message
- `ensureProductBundleTemplate(admin, session, apiKey)` in `widget-theme-template.server.ts` — fully functional, idempotent, creates `templates/product.product-page-bundle.json`
- Configure page has `handleEnsureBundleTemplates` action handler — needs examination

### Target State
1. **Replace stub** in `api.ensure-product-template.tsx` with a real implementation that calls `ensureProductBundleTemplate()`
2. **Add "Add to Storefront" section** in the configure page UI that calls `POST /api/ensure-product-template` with `{ productHandle, bundleId }`
3. **Wire loading/success/error states** in configure page React component

### Data Flow
```
Configure Page (React)
  → "Add to Storefront" button click
  → fetcher.submit({ productHandle, bundleId }, { method: 'POST', action: '/api/ensure-product-template' })
  → api.ensure-product-template.tsx action
  → ensureProductBundleTemplate(admin, session, apiKey)
  → Shopify REST API: GET/PUT templates/product.product-page-bundle.json
  → { success, templateCreated, templateAlreadyExists }
  → Configure page shows: success toast + "View product" link
                       OR: error toast + "Open Theme Editor" link (fallback)
```

---

## Architecture: Widget Visual Redesign

### Slot Card Redesign

**`createEmptyStateCard(step, stepIndex)`** — update to render:
```html
<div class="bw-slot-card bw-slot-card--empty" data-step-index="{N}">
  <div class="bw-slot-card__icon-wrapper">
    <!-- SVG plus-in-circle, 80×80px circular background -->
  </div>
  <span class="bw-slot-card__label">{step.name}</span>
</div>
```
- Border: `2px dashed var(--bundle-empty-state-card-border, #1e3a8a)`
- Height: 200px, border-radius: 10px
- Hover: `translateY(-2px)` + box-shadow (CSS only)

**`createSelectedProductCard(item, cardIndex)`** — update to render:
```html
<div class="bw-slot-card bw-slot-card--filled" data-card-index="{N}">
  <!-- Remove button (×) - top-right, NOT shown for isDefault steps -->
  <button class="bw-slot-card__remove">×</button>
  <div class="bw-slot-card__image-wrapper">
    <img src="{imageUrl}" class="bw-slot-card__image" />
  </div>
  <span class="bw-slot-card__title">{title}</span>
</div>
```
- Border: `2px solid var(--bundle-empty-state-card-border, #1e3a8a)`
- Image: `object-fit: cover`, `border-radius: 10px`

**New: `createDefaultProductCard(step)`** — for `step.isDefault === true`:
- Same as filled card but:
  - No remove button (×)
  - "Included" lock badge bottom-left
  - Pre-filled with `defaultVariantId` product data

**New: `createFreeGiftSlotCard(step, stepIndex)`** — for `step.isFreeGift === true`:
- Empty state card + red ribbon SVG overlay (top-right, 24×24px)
- Label: `"Free ${step.name}"` in primary color
- Locked state (`isFreeGiftUnlocked === false`): `opacity: 0.6`, cursor: default, non-clickable
- Unlocked state: clickable, opens modal at free gift step

### Modal Tab Redesign

**`renderModalTabs()`** — update tab pill styles:
- Inactive: `border: 1px solid var(--bundle-primary-color); background: white; color: var(--bundle-primary-color); border-radius: 40px`
- Active (non-free-gift): `background: var(--bundle-primary-color); color: white; border-radius: 40px`
- Active (free-gift tab): `background: #1e3a8a; color: white; border-radius: 8px` (NOT pill)
- Free gift tab only shown when steps include `isFreeGift`

### Modal Product Card Redesign

**`renderModalProducts(stepIndex)`** — update product card HTML:
- Regular steps: `border: 2px solid rgb(255,202,67); border-radius: 16px; padding: 12px` (gold)
- Free gift step: `border: 1px solid rgb(227,227,227); border-radius: 12px` (gray, not gold)
- "Add to Cart" button: `border-radius: 40px`, full-width, primary color bg

### Free Gift Modal Header

When `currentStep.isFreeGift === true`, render above the product grid:
```html
<div class="bw-bs-free-gift-promo">
  <p class="bw-bs-free-gift-heading">Get a {stepName} worth ${price} absolutely free!</p>
  <p class="bw-bs-free-gift-subheading">Add {N} product(s) to get 1 of them at 100% off!</p>
</div>
```

### Floating Footer Pill

**New: `renderFloatingFooter()`** — replaces or augments the existing `.bw-bs-footer`:
```html
<div class="bw-bs-floating-footer">
  <button class="bw-bs-nav-btn bw-bs-nav-btn--prev">Prev</button>
  <div class="bw-bs-cart-counter">
    <!-- cart icon + count -->
  </div>
  <button class="bw-bs-nav-btn bw-bs-nav-btn--next">Next</button>
  <!-- OR on last step: -->
  <button class="bw-bs-nav-btn bw-bs-nav-btn--done">Done</button>
</div>
```
- Container: `background: rgba(30,30,30,0.8); border-radius: 15px; width: 300px; height: 80px`
- Fixed at bottom of modal panel
- "Prev" hidden on first step; "Next" hidden on last step (replaced by "Done")

---

## Architecture: Free Gift + Default Product in PDP

### Detecting step types in `BundleWidgetProductPage`

```javascript
// Getters to add to class
get paidSteps() {
  return this.selectedBundle?.steps?.filter(s => !s.isFreeGift && !s.isDefault) ?? [];
}
get freeGiftStep() {
  return this.selectedBundle?.steps?.find(s => s.isFreeGift) ?? null;
}
get defaultSteps() {
  return this.selectedBundle?.steps?.filter(s => s.isDefault) ?? [];
}
get isFreeGiftUnlocked() {
  return this.paidSteps.every((step, i) => this.validateStep(i));
}
```

### Default product pre-fill on init

In `initializeDataStructures()` or `renderUI()`:
- For each step where `step.isDefault === true` and `step.defaultVariantId`:
  - Pre-populate `this.selectedProducts[stepIndex]` with the default product data
  - Fetch product details for `defaultVariantId` via storefront API
  - Render as a filled card immediately on load

### Cart: include default products

In `addToCart()`:
- Default step products are included in the cart payload automatically (pre-filled)
- Not blocked by free-gift unlock check
- Free gift step: only included if `isFreeGiftUnlocked && freeGiftSelected`

### Auto-select single-variant free gift

If free gift step has exactly 1 product with exactly 1 variant:
- On free gift unlock, auto-select it without opening modal

---

## Files to Modify

| File | Change |
|------|--------|
| `app/assets/bundle-widget-product-page.js` | Main widget class — slot cards, modal, free gift, default product |
| `extensions/bundle-builder/assets/bundle-widget.css` | CSS for new slot card variants, free gift ribbon, floating footer pill, product card gold border, modal tab pills |
| `app/routes/api/api.ensure-product-template.tsx` | Replace stub with real `ensureProductBundleTemplate()` call |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | Add "Add to Storefront" section UI |
| `scripts/build-widget-bundles.js` | Bump `WIDGET_VERSION` (MINOR bump) |
| `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` | Rebuilt output (auto-generated) |

### Files to Create

| File | Purpose |
|------|---------|
| `docs/pdp-bundle-redesign/04-SDE-implementation.md` | Implementation plan (Stage 4) |
| `docs/issues-prod/pdp-bundle-redesign-1.md` | Issue tracking file |

---

## Data Model

No schema changes required. All fields already exist in Prisma:

```prisma
model BundleStep {
  isFreeGift       Boolean  @default(false)
  isDefault        Boolean  @default(false)
  defaultVariantId String?
  // ... existing fields
}
```

The widget reads these from the bundle config JSON already served by `/api/bundle/{bundleId}.json`.

---

## CSS Variable Mapping (DCP → New Widget Elements)

| Widget Element | CSS Variable | Default |
|----------------|-------------|---------|
| Empty slot card border color | `--bundle-empty-state-card-border` | `#1e3a8a` |
| Empty slot card border style | `--bundle-empty-slot-border-style` | `dashed` |
| Filled slot card border | `--bundle-empty-state-card-border` | `#1e3a8a` (solid) |
| Product card border radius | `--bundle-product-card-border-radius` | `16px` |
| Modal background | `--bundle-bs-panel-bg` | `rgb(244,249,249)` |
| Tab active background | `--bundle-primary-color` (from `buttonBgColor`) | `rgb(69,150,227)` |
| "Add to Cart" button | `--bundle-primary-color` | `rgb(69,150,227)` |
| Product title in modal | `--bundle-product-title-color` | `rgb(69,150,227)` |
| Product card border (regular) | `--bundle-product-card-border` | `rgb(255,202,67)` |
| "Add Bundle to Cart" button | `--bundle-add-to-cart-button-bg` | `rgb(69,150,227)` |

**Rule:** These are existing DCP variables. No new DCP settings will be added (out of scope per PO).

---

## Migration / Backward Compatibility Strategy

- Existing PDP bundles (no `isFreeGift`, no `isDefault`) render identically — the new slot card design replaces the old purely visually; the data model and selection logic are unchanged
- `createEmptyStateCard` already branches on "bottom-sheet mode" — enhancement stays within that branch
- `api.ensure-product-template.tsx` stub replacement: current stub returns `success: true` (optimistic) — new implementation is also idempotent, so merchants who already set up their theme are unaffected
- Widget version bump: MINOR (1.8.2 → 1.9.0)

---

## Testing Strategy

### Test Files to Create

| Test File | Category | What It Covers |
|-----------|----------|----------------|
| `tests/unit/routes/api.ensure-product-template.test.ts` | Unit | Action: happy path (created), already-exists, API error, missing productHandle, auth failure |

### Behaviors to Test

From PO acceptance criteria:

**Template auto-install (Story 9):**
- Given valid session and productHandle, when POST to `/api/ensure-product-template`, then returns `{ success: true, templateCreated: true }`
- Given template already exists, when POST again, then returns `{ success: true, templateAlreadyExists: true }` (idempotent)
- Given Shopify REST API error, when POST, then returns `{ success: false, error: "..." }` with 500
- Given missing productHandle in body, when POST, then returns 400

**Widget JS (covered by bundle — TDD exception):**
- `createEmptyStateCard`: verifies correct HTML structure, class names, data attributes
- `createSelectedProductCard`: verifies remove button present, absent for `isDefault`
- `isFreeGiftUnlocked` getter: returns false when paid steps incomplete, true when all paid steps filled
- `paidSteps` getter: filters out `isFreeGift` and `isDefault` steps

### Mock Strategy
- **Mock:** `requireAdminSession` → returns `{ admin, session }`
- **Mock:** `ensureProductBundleTemplate` → returns various result shapes
- **Do NOT mock:** Pure getters/utility methods in widget JS

### TDD Exceptions (no tests required)
- CSS changes in `bundle-widget.css`
- Widget JS changes in `bundle-widget-product-page.js` (covered by `tests/unit/assets/` pattern per arch convention)
- Configure page React UI (Polaris rendering)
- Build script changes

---

## Implementation Sequence (for SDE Stage)

**Phase 1:** Template auto-install
- Replace `api.ensure-product-template.tsx` stub
- Add "Add to Storefront" section to configure page
- Tests for API route

**Phase 2:** Slot card visual redesign (CSS + JS)
- Update `createEmptyStateCard` — SVG icon, step name, dashed border
- Update `createSelectedProductCard` — product image, title, remove button, solid border
- Update `bundle-widget.css` for both card types

**Phase 3:** Default product card
- Add `createDefaultProductCard(step)` method
- Pre-fill logic in `initializeDataStructures` / `renderUI`
- CSS: "Included" badge, lock icon

**Phase 4:** Free gift slot + modal
- Add `createFreeGiftSlotCard(step, stepIndex)` — ribbon overlay, locked state
- Add `paidSteps`, `freeGiftStep`, `isFreeGiftUnlocked` getters
- Promo heading in free gift modal
- Dark navy tab styling for free gift tab

**Phase 5:** Modal redesign
- `renderModalTabs` — pill styling, active/inactive
- `renderModalProducts` — gold card borders (regular), gray (free gift)
- `renderFloatingFooter` — Prev/Next pill
- Discount progress text below tabs

**Phase 6:** Add Bundle to Cart button redesign + DCP wiring
- Full-width pill, `opacity: 0.5` when incomplete
- All CSS vars mapped to correct elements

**Phase 7:** Version bump + build + verify
- `WIDGET_VERSION` 1.8.2 → 1.9.0
- `npm run build:widgets:product-page`
- CSS file size check (must be < 100,000 B)
