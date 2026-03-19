# Architecture Decision Record: Beco BYOB Expandable Floating Footer

## Context

The current `renderFullPageFooter()` builds a stacked multi-section footer (success banner +
progress section + horizontal product tiles scroll + nav row). On mobile it takes 30-40% of the
viewport. We want a Beco-style compact bar (72px) that expands upward into a product-list panel on
tap — same information, far less visual noise.

## Constraints

- Must not break `footer_side` layout (sidebar uses `renderSidebarPanel()`, not the footer).
- Must preserve all existing DCP CSS variable names (`--bundle-full-page-footer-*`).
- No new server-side routes or DB fields.
- Widget JS is a single-file IIFE — no external dependencies.
- Existing `getAllSelectedProductsData()` and `deselectProduct()` / `removeSelectedProduct()` helpers must be reused.

## Options Considered

### Option A: In-place rewrite of `renderFullPageFooter()`
Replace the method body while keeping the same element (`this.elements.footer`) and same call sites.

**Pros:**
- Only one function changes; call sites (`renderFullPageLayout`, `renderFooter`) unchanged.
- All existing `footer.style.display` guards still work.
- DCP CSS variables remain attached to `.full-page-footer` (no selector rename needed).

**Cons:**
- New HTML structure inside `.full-page-footer` is a breaking change for any custom CSS in merchant themes — acceptable since this is a widget (shadow DOM-lite via class scoping).

**Verdict: ✅ Recommended**

### Option B: New `renderBecoFooter()` alongside existing method
Add a new method, switch on a feature flag.

**Pros:**
- Old footer preserved as rollback.

**Cons:**
- Duplicated code (pricing calc, nav buttons, DCP lookups).
- Feature flag = another config surface.

**Verdict: ❌ Rejected** — unnecessary complexity; the old code is fully replaced.

### Option C: CSS-only expand (checkbox hack / `:has()`)
Hide/show the panel via a CSS checkbox trick.

**Pros:**
- Zero JS for toggle.

**Cons:**
- Accessibility issues, complex focus management, `:has()` Safari compat concerns.

**Verdict: ❌ Rejected**

## Decision: Option A — In-place rewrite of `renderFullPageFooter()`

## New DOM Structure

```
div.full-page-footer.beco-style  (position: fixed; bottom: 0; width: 100%; z-index: 1000)
  │
  ├── div.footer-panel  (max-height: 0 → 60vh via CSS transition; overflow: hidden)
  │     ├── div.footer-callout-banner  (hidden when no discount / bundle not complete)
  │     │     └── "🎉 {successMessage}"
  │     └── ul.footer-panel-list
  │           └── li.footer-panel-item × N
  │                 ├── img.footer-panel-thumb (48×48)
  │                 ├── div.footer-panel-info
  │                 │     ├── p.footer-panel-name
  │                 │     └── p.footer-panel-price  "{price} × {qty}"
  │                 └── button.footer-panel-remove  (🗑 icon)
  │
  ├── button.footer-backdrop  (position:fixed; inset:0; z-index:-1; hidden when collapsed)
  │
  └── div.footer-bar  (always visible)
        ├── button.footer-back-btn  (hidden on step 0)
        ├── div.footer-thumbstrip
        │     └── img × min(3, N) + span.footer-thumbstrip-overflow ("+M" badge)
        ├── button.footer-toggle  "X/Y Products ∨/∧"
        ├── div.footer-total
        │     ├── span.total-final  "{price}"
        │     └── span.footer-discount-badge  "{N}% OFF"
        └── button.footer-cta-btn  "Add to Cart" / "Next"
```

**State management:** `this.elements.footer.classList.toggle('is-open')` drives expand/collapse
via CSS (no inline style manipulation for the panel height).

## CSS Strategy

```css
/* Panel: collapsed → expanded via class */
.full-page-footer.beco-style .footer-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 250ms ease-out, opacity 250ms ease-out;
  opacity: 0;
}
.full-page-footer.beco-style.is-open .footer-panel {
  max-height: 60vh;
  opacity: 1;
  overflow-y: auto;
}

/* Chevron rotation */
.footer-toggle .footer-chevron { transition: transform 200ms ease; }
.full-page-footer.beco-style.is-open .footer-toggle .footer-chevron {
  transform: rotate(180deg);
}

/* Backdrop */
.footer-backdrop { display: none; position: fixed; inset: 0; z-index: 999; background: transparent; }
.full-page-footer.beco-style.is-open .footer-backdrop { display: block; }
```

## DCP Variables — Mapping

| Existing variable | Used on new element |
|---|---|
| `--bundle-full-page-footer-bg-color` | `.footer-bar` background |
| `--bundle-full-page-footer-border-color` | `.footer-bar` border-top |
| `--bundle-full-page-footer-text-color` | `.footer-bar` text |
| `--bundle-full-page-cta-bg-color` | `.footer-cta-btn` background |
| `--bundle-full-page-cta-text-color` | `.footer-cta-btn` color |
| `--bundle-full-page-footer-header-color` | `.footer-toggle` color |
| **New:** `--bundle-footer-panel-bg` | `.footer-panel` background |
| **New:** `--bundle-footer-callout-bg` | `.footer-callout-banner` background |
| **New:** `--bundle-footer-remove-icon-color` | `.footer-panel-remove` icon color |

## Files to Modify

| File | Change |
|------|--------|
| `app/assets/bundle-widget-full-page.js` | Rewrite `renderFullPageFooter()`, add `toggleFooterPanel()`, `createFooterBar()`, `createFooterPanel()`, `createFooterPanelItem()` helpers |
| `extensions/bundle-builder/assets/bundle-widget-full-page.css` | Add new `.beco-style` selectors; retain old selectors for DCP variable compatibility |
| `scripts/build-widget-bundles.js` | Bump `WIDGET_VERSION` (MINOR: 1.6.0 → 1.7.0) |

**No changes to:**
- `renderSidebarPanel()` (footer_side layout unchanged)
- `renderFooter()` dispatcher (unchanged)
- `createFooter()` (unchanged — creates the `.bundle-footer-messaging` element)
- Any server files

## Testing Strategy

### Test Files to Create

| Test File | Category | What It Covers |
|-----------|----------|----------------|
| `tests/unit/assets/fpb-footer-expandable.test.js` | Widget unit | Footer render, expand/collapse toggle, thumbnail strip, panel item remove, deal callout visibility |

### Behaviors to Test (from PO ACs)

1. Footer hidden when 0 products selected
2. Footer visible when ≥ 1 product selected
3. Thumbnail strip shows up to 3 images
4. Thumbnail strip shows "+N" badge when > 3 selected
5. Toggle button shows correct "X/Y Products" text
6. Clicking toggle adds `is-open` class
7. Clicking toggle again removes `is-open` class
8. Clicking backdrop removes `is-open` class
9. Deal callout shown when bundle condition met (hasDiscount = true)
10. Deal callout hidden when not met
11. Panel item shows name, price × qty
12. Clicking remove calls deselectProduct
13. Discount badge shown when discount applies
14. Back button hidden on step 0, visible on step > 0
15. footer_side layout: footer stays hidden

### Mock Strategy
- Mock `PricingCalculator`, `CurrencyManager`, `TemplateManager` (already mocked in test suite)
- Mock `this.getAllSelectedProductsData()`, `this.deselectProduct()`
- Test the JS function logic — do NOT test CSS rendering

### TDD Exceptions
- CSS changes (no tests for CSS)
- Widget version bump

## Migration / Backward Compatibility

- Old selectors (`.footer-products-tiles-wrapper`, `.footer-progress-section`, etc.) are kept in
  CSS as-is (still compile, just no longer rendered). This prevents DCP variable breakage.
- Merchants with custom CSS targeting old selectors will not see a regression (elements no longer
  exist in DOM, so selectors simply don't match — no layout shift).
- New elements use distinct class names (`.beco-style`, `.footer-panel`, `.footer-bar`) with no
  collision risk.
