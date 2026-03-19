# Architecture Decision Record: Product-Page Bundle Widget — Bottom-Sheet Redesign

**Feature Name:** skai-lama-bottom-sheet-redesign
**Stage:** 3 — Architecture Decisions
**Input:** `00-BR.md`, `02-PO-requirements.md`, plus codebase exploration
**Date:** 2026-03-17

---

## Context

We are redesigning the product-page bundle widget (`bundle-widget-product-page.js`) from a vertical-accordion layout to a **bottom-sheet modal** pattern, matching the UX of Skai Lama's Easy Bundle Builder. The implementation must:

1. Not break live merchants (backward-compatible `widgetStyle: 'classic'` default)
2. Stay within the existing vanilla-JS, CSS-variable-driven architecture (no framework)
3. Reuse or extend the DCP settings + CSS variable pipeline that already exists
4. Keep the new widget JS delta small (< 30KB minified net-new)

---

## Constraints

- Widget is vanilla JS (no React, no Preact) — all DOM manipulation is imperative
- Styling entirely via CSS custom properties (`--bundle-*`) injected by DCP
- `bundle_ui_config` JSON metafield (ProductVariant, `$app` namespace) is the sole data source on the storefront
- No Prisma DB migration — new config fields live in the JSON metafield only
- Widget must be rebuilt after changes: `npm run build:widgets`
- Existing merchants must NOT see a changed widget until they explicitly opt in (`widgetStyle` absent → `'classic'` behavior; only `'bottom-sheet'` when explicitly set)
- Many relevant CSS variables **already exist** (`--bundle-modal-border-radius`, `--bundle-empty-state-card-border`, `--bundle-discount-pill-bg`, `--bundle-modal-close-*`) — reuse before adding new ones

---

## Options Considered

### Option A — Extend Existing Modal (In-Place Evolution)
**Description:** Keep the existing full-screen `#bundle-builder-modal`, but change its CSS to position it as a bottom-sheet (`position: fixed; bottom: 0; height` animation). Modify the inline step accordion to render slot cards. Wrap both behind `widgetStyle` check.

**Pros:**
- Smaller diff — modal DOM structure already exists
- Less risk of breaking existing behavior for `'classic'` merchants
- Modal event listeners, tab switching, product rendering all stay in place

**Cons:**
- Full-screen modal HTML is structurally different from bottom-sheet (modal-overlay is a sibling, not a backdrop behind the sheet)
- The existing modal is positioned with `position: fixed; top: 0; left: 0; width: 100%; height: 100%` — converting to `bottom: 0; height: 0 → 765px` requires touching many CSS rules
- Mixing two modes in one modal class becomes complex and hard to test
- The inline step rendering (accordion vs. slot cards) must still be branched

**Verdict: ❌ Rejected** — the structural CSS changes are invasive, and mixing two modes in one modal adds long-term complexity.

---

### Option B — New `BottomSheetModal` Class + Slot Card Rendering ✅ Recommended
**Description:** Extract a new `BottomSheetModal` class (inline in the widget JS, not a separate module). The `BundleWidgetProductPage` class checks `widgetStyle` on init and either:
- `'classic'` → current behavior unchanged (accordion + full-screen modal)
- `'bottom-sheet'` → renders slot cards in inline widget, instantiates `BottomSheetModal`

The `BottomSheetModal` class handles:
- DOM creation + append to `document.body`
- CSS height-transition animation
- Overlay element
- Tab rendering + switching
- Product grid (reuses existing product-card HTML generation logic)
- Auto-step progression
- Close/open state

**Pros:**
- Clean separation: `'classic'` path is literally untouched
- `BottomSheetModal` is self-contained and testable in isolation
- Reuses existing product loading, cart add, price calculation, condition validation
- New CSS is additive (new classes, no overwrites of existing modal classes)
- Clear boundary between old and new code

**Cons:**
- Some duplication of product card HTML generation (mitigated by sharing `ComponentGenerator` and existing template methods)
- Slightly larger JS file, but within 30KB budget

**Verdict: ✅ Recommended**

---

### Option C — Separate Widget File
**Description:** Create `bundle-widget-product-page-v2.js` as a completely new file. The Liquid block detects `widgetStyle` and loads the appropriate script.

**Pros:**
- Zero risk of regression for existing merchants
- Completely clean slate

**Cons:**
- Two files to maintain in perpetuity → tech debt
- DCP must target both files → doubled CSS variable surface
- Build script complexity doubles
- Liquid block must conditionally load different scripts → complexity in block settings

**Verdict: ❌ Rejected** — maintenance burden outweighs the isolation benefit.

---

## Decision: Option B — New `BottomSheetModal` Class

The bottom-sheet modal is implemented as a new class within `bundle-widget-product-page.js`, gated behind `widgetStyle === 'bottom-sheet'`. The inline widget rendering is branched: slot cards for bottom-sheet, existing accordion for classic.

---

## Data Model

### bundle_ui_config — New Optional Fields

```typescript
interface BundleUiConfig {
  // Existing (unchanged)
  bundleId: string;
  steps: StepConfig[];
  discount: DiscountConfig;
  messaging: MessagingConfig;

  // NEW — optional, safe to absent
  widgetStyle?: 'classic' | 'bottom-sheet';  // absent = 'classic' (backward-compat)
}

interface StepConfig {
  // Existing (unchanged)
  id: string;
  name: string;
  conditionOperator: string;
  conditionValue: number;
  products: ProductRef[];

  // NEW — optional, safe to absent
  isDefault?: boolean;           // absent = false
  defaultVariantId?: string;     // required if isDefault: true
  discountBadgeLabel?: string;   // absent = no badge shown
  categoryImageUrl?: string;     // absent = use first product image
}
```

No Prisma migration needed. `widgetStyle` is stored in and read from the `bundle_ui_config` JSON metafield on the ProductVariant, written by the DCP configure route.

### DesignSettings — New Optional Fields

```typescript
interface DesignSettings {
  // Existing (unchanged) — ~60 fields

  // NEW for bottom-sheet widget
  widgetStyle?: 'classic' | 'bottom-sheet';           // new DCP toggle
  bottomSheetOverlayOpacity?: number;                  // 0–0.8, default 0.5
  bottomSheetAnimationDuration?: number;               // 200–600ms, default 400
  emptySlotBorderStyle?: 'dashed' | 'solid';          // default 'dashed'
  emptySlotBorderColor?: string;                       // default = globalPrimaryButtonColor

  // Reuse existing CSS variables for discount badge:
  // --bundle-discount-pill-bg → discountPillBgColor (already exists)
  // --bundle-discount-pill-text → discountPillTextColor (already exists)

  // Reuse existing for modal border-radius:
  // --bundle-modal-border-radius → modalBorderRadius (already exists)
}
```

**Key finding:** Many needed CSS variables already exist in `DesignSettings`:
- `--bundle-modal-border-radius` → `modalBorderRadius` ✅ exists
- `--bundle-modal-bg-color` → `modalBgColor` ✅ exists
- `--bundle-discount-pill-bg` / `--bundle-discount-pill-text` ✅ exist
- `--bundle-empty-state-card-border`, `--bundle-empty-state-card-bg` ✅ exist
- `--bundle-modal-close-color`, `--bundle-modal-close-bg` ✅ exist

Net-new CSS variables required: `--bundle-bottom-sheet-overlay-opacity`, `--bundle-bottom-sheet-animation-duration`, `--bundle-empty-slot-border-style`

---

## Files to Modify

| File | Change Type | Details |
|------|-------------|---------|
| `app/assets/bundle-widget-product-page.js` | **Modify** | Add `BottomSheetModal` class (~400 lines); branch `renderSteps()` to render slot cards for bottom-sheet; auto-step progression logic |
| `extensions/bundle-builder/assets/bundle-widget-product-page.css` | **Modify** | Add `.slot-card`, `.slot-card-empty`, `.slot-card-filled`, `.bottom-sheet-modal`, `.bottom-sheet-overlay`, `.bottom-sheet-tabs`, `.discount-badge-pill` CSS classes |
| `app/components/design-control-panel/types.ts` | **Modify** | Add `widgetStyle`, `bottomSheetOverlayOpacity`, `bottomSheetAnimationDuration`, `emptySlotBorderStyle`, `emptySlotBorderColor` to `DesignSettings` |
| `app/components/design-control-panel/settings/SettingsPanel.tsx` | **Modify** | Add `widgetStyle` subsection case → `<WidgetStyleSettings>` |
| `app/components/design-control-panel/settings/WidgetStyleSettings.tsx` | **Create** | New DCP settings component: toggle Classic/Bottom-Sheet + conditional sub-controls |
| `app/components/design-control-panel/preview/ProductPageInlinePreview.tsx` | **Create** | New DCP preview showing inline slot cards (empty + filled states) |
| `app/components/design-control-panel/preview/BottomSheetPreview.tsx` | **Create** | New DCP preview showing bottom-sheet open state with tabs + product grid |
| `app/components/design-control-panel/PreviewPanel.tsx` | **Modify** | Add `widgetStyle` section to preview routing; render `ProductPageInlinePreview` + `BottomSheetPreview` |
| `app/utils/design-settings.ts` (or equivalent) | **Modify** | Add CSS variable mappings for 3 new variables in `settingsToCSSVarRecord()` |
| `app/services/bundles/bundle-ui-config-builder.server.ts` (or equivalent) | **Modify** | Include `widgetStyle` and per-step `isDefault`/`discountBadgeLabel`/`categoryImageUrl` when building `bundle_ui_config` JSON |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | **Modify** | Pass `widgetStyle` from DCP settings into the saved `bundle_ui_config` |
| `scripts/build-widget-bundles.js` | **Modify** | Increment `WIDGET_VERSION` (MINOR bump) |
| `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` | **Rebuild** | Output of `npm run build:widgets` |

---

## Widget JS Architecture

### New `BottomSheetModal` class (inside `bundle-widget-product-page.js`)

```javascript
class BottomSheetModal {
  constructor(widget) {
    this.widget = widget;        // reference to parent BundleWidgetProductPage
    this.el = null;              // .bottom-sheet-modal element
    this.overlay = null;         // .bottom-sheet-overlay element
    this.activeTabIndex = 0;
    this._isOpen = false;
  }

  // DOM creation (appended to document.body once)
  create() { ... }

  // Open modal, optionally at a specific step tab
  open(stepIndex) { ... }

  // Close modal with animation
  close() { ... }

  // Render tabs based on current widget step data
  renderTabs() { ... }

  // Activate a specific tab and render its product grid
  activateTab(stepIndex) { ... }

  // Render products grid for a step
  renderProducts(stepIndex) { ... }

  // Called after each product selection — check auto-progression
  onProductSelected(stepIndex) { ... }

  // Destroy DOM
  destroy() { ... }
}
```

### Modified `BundleWidgetProductPage` init branching

```javascript
init() {
  const widgetStyle = this.bundleConfig?.widgetStyle ?? 'classic';

  if (widgetStyle === 'bottom-sheet') {
    this.bottomSheet = new BottomSheetModal(this);
    this.renderSlotCards();     // new method
  } else {
    this.renderSteps();         // existing method (unchanged)
  }
}
```

### Slot Card Rendering

```javascript
renderSlotCards() {
  // For each step:
  //   - If isDefault: render filled card (no × button), skip modal
  //   - If selected: render filled card with × and optional discount badge
  //   - If empty: render empty slot card (dashed border, category image, label)
  // All cards get click handler → this.bottomSheet.open(stepIndex)
}
```

### Auto-Step Progression

```javascript
// Inside BottomSheetModal.onProductSelected(stepIndex):
onProductSelected(stepIndex) {
  const stepComplete = ConditionValidator.isConditionMet(
    this.widget.selectedBundle.steps[stepIndex],
    this.widget.getSelectedCountForStep(stepIndex)
  );

  if (!stepComplete) return;

  // Find next incomplete step (skip default steps)
  const nextIncomplete = this.findNextIncompleteStep(stepIndex);

  if (nextIncomplete === -1) {
    // All steps complete — close after 500ms
    setTimeout(() => this.close(), 500);
    this.widget.updateAddToCartButton();
    return;
  }

  // Auto-advance after 300ms
  setTimeout(() => this.activateTab(nextIncomplete), 300);
}
```

---

## CSS Architecture

### New CSS classes (additive — no overwrites of existing classes)

```css
/* Inline slot cards */
.bundle-widget-pdp-slots           /* flex container, horizontal, gap */
.bundle-slot-card                  /* base card: cursor pointer, border-radius, overflow hidden */
.bundle-slot-card--empty           /* dashed border variant */
.bundle-slot-card--filled          /* solid border variant */
.bundle-slot-card__image           /* category/product image */
.bundle-slot-card__label           /* step name text below image */
.bundle-slot-card__remove          /* × button, top-right */
.bundle-slot-card__discount-badge  /* pill, bottom-left of image */

/* Bottom-sheet overlay */
.bundle-bottom-sheet-overlay       /* position: fixed; full-screen; opacity transition */
.bundle-bottom-sheet-overlay--open /* opacity: var(--bundle-bottom-sheet-overlay-opacity, 0.5) */

/* Bottom-sheet modal */
.bundle-bottom-sheet               /* position: fixed; bottom:0; height:0; transition */
.bundle-bottom-sheet--open         /* height: var(--bundle-bottom-sheet-max-height, 765px) */
.bundle-bottom-sheet__header       /* tabs row + close button */
.bundle-bottom-sheet__tabs         /* overflow-x: auto; flex; gap */
.bundle-bottom-sheet__tab          /* individual tab button */
.bundle-bottom-sheet__tab--active  /* active tab: primary bg + white text */
.bundle-bottom-sheet__close        /* X button (desktop) or ↓ (mobile) */
.bundle-bottom-sheet__body         /* overflow-y: auto; product grid */
.bundle-bottom-sheet__grid         /* display: grid; 5-col desktop, 2-col mobile */
```

### CSS variable reuse vs net-new

**Reused existing variables:**
- `--bundle-modal-border-radius` → bottom-sheet `border-radius` (top corners)
- `--bundle-modal-bg-color` → bottom-sheet background
- `--bundle-header-tab-active-bg/text` → bottom-sheet active tab
- `--bundle-header-tab-inactive-bg/text` → bottom-sheet inactive tab
- `--bundle-header-tab-radius` → bottom-sheet tab border-radius
- `--bundle-discount-pill-bg/text` → inline slot discount badge
- `--bundle-empty-state-card-border` → empty slot card border color
- `--bundle-product-card-bg` → product grid cards
- `--bundle-product-card-border-radius` → product grid cards

**Net-new CSS variables (3 only):**
- `--bundle-bottom-sheet-overlay-opacity` (default: `0.5`)
- `--bundle-bottom-sheet-animation-duration` (default: `400ms`)
- `--bundle-empty-slot-border-style` (default: `dashed`)

---

## Migration / Backward Compatibility Strategy

1. **Widget behavior gate:** `widgetStyle` absent in `bundle_ui_config` → widget runs existing `renderSteps()` accordion path. Zero change for existing merchants.

2. **New bundles:** When a merchant creates a new product-page bundle after this feature ships, the configure route saves `widgetStyle: 'bottom-sheet'` in `bundle_ui_config` by default.

3. **Opt-in for existing bundles:** Merchant can switch to bottom-sheet via the DCP "Widget Style" toggle → saves `widgetStyle: 'bottom-sheet'` → next page load uses new UX.

4. **Step isDefault / discountBadgeLabel:** Both absent → widget ignores, no behavior change. No migration required.

5. **CSS:** New classes are purely additive (`.bundle-slot-card-*`, `.bundle-bottom-sheet-*`). Existing `.step-box`, `#bundle-builder-modal`, `.product-card` classes are untouched.

---

## Testing Strategy

### Test Files to Create

| Test File | Category | What It Covers |
|-----------|----------|----------------|
| `tests/unit/assets/bundle-bottom-sheet.test.js` | Unit | Auto-step progression logic: `findNextIncompleteStep()`, `onProductSelected()` edge cases |
| `tests/unit/assets/bundle-slot-cards.test.js` | Unit | Slot card rendering: empty vs filled, default step (no × btn), discount badge label |
| `tests/unit/lib/bundle-ui-config-widgetstyle.test.ts` | Unit | `bundle_ui_config` builder: `widgetStyle` field written correctly, step `isDefault`/`discountBadgeLabel` included |
| `tests/unit/routes/product-page-configure.test.ts` | Unit | Configure route action: saves `widgetStyle` from DCP settings to metafield |

### Behaviors to Test

From PO acceptance criteria:

1. **Auto-step progression:**
   - Given step 0 selection meets condition → `findNextIncompleteStep(0)` returns step 1
   - Given steps 0 + 1 complete, step 2 is last incomplete → returns 2
   - Given all steps complete → returns -1 → triggers modal close
   - Given a default step is at index 1 → it is skipped in progression

2. **Slot card rendering:**
   - Given `isDefault: true` step → filled card with NO remove button
   - Given `discountBadgeLabel: 'FREE'` → badge `.bundle-slot-card__discount-badge` present with "FREE"
   - Given `discountBadgeLabel` absent → no badge element rendered
   - Given empty step (no selection) → `.bundle-slot-card--empty` class present, dashed border

3. **bundle_ui_config builder:**
   - `widgetStyle: 'bottom-sheet'` written when DCP toggle is set
   - `isDefault: true` + `defaultVariantId` written per step when configured
   - Existing bundles without these fields → `widgetStyle` absent → widget uses classic path

4. **Configure route:**
   - Action saves DCP `widgetStyle` → triggers metafield update

### Mock Strategy
- **Mock:** Shopify Admin GraphQL, Prisma DB client
- **Do NOT mock:** `ConditionValidator.isConditionMet`, auto-step progression logic (pure functions)
- **Do NOT test:** DCP React component rendering, CSS variable injection

### TDD Exceptions (no tests)
- All CSS changes in `.css` files
- HTML template strings in widget JS
- DCP preview TSX components (pure display)
- Widget build script changes
