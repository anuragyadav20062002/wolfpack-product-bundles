# Architecture Decision Record: Full-Page Bundle Layout Selection

## Context

Adding a `fullPageLayout` field (`footer_bottom | footer_side`) to full-page bundles. The value flows from the create modal → DB → API → widget JS, which branches rendering accordingly. The side-footer is a sticky sidebar panel shown to the right of the product grid on desktop, collapsing below on mobile.

## Constraints

- Must not break existing full-page bundles (default to `footer_bottom`)
- Must reuse existing rendering code (DRY) — pricing calculations, product tiles, nav buttons
- Must use the existing CSS custom property system for DCP compatibility
- No Liquid template changes needed (widget reads layout from bundle JSON API)

## Decision: Prisma Enum Field + API-First Propagation

**Rationale:** A dedicated DB enum field is the cleanest, most queryable, and most maintainable approach. The widget already fetches bundle JSON from `/api/bundle/{id}.json` during initialization — adding `fullPageLayout` to that response is trivial. No Liquid template or theme editor changes required.

### Data Flow

```
CREATE:  Dashboard Modal → formData → handleCreateBundle → db.bundle.create({ fullPageLayout })
EDIT:    Configure Page  → formData → handleSaveBundle   → db.bundle.update({ fullPageLayout })
RENDER:  Liquid → widget JS → GET /api/bundle/{id}.json → this.selectedBundle.fullPageLayout
           → 'footer_side'   → renderFullPageLayoutWithSidebar()
           → null/'footer_bottom' → renderFullPageLayout()  [existing, unchanged]
```

## Data Model

### New Prisma Enum (after line 52 in schema.prisma)

```prisma
enum FullPageLayout {
  footer_bottom   // Sticky footer at viewport bottom (existing)
  footer_side     // Sidebar panel to the right of product grid (new)
}
```

### Updated Bundle Model (new field after `bundleType` on line 91)

```prisma
fullPageLayout   FullPageLayout?   @default(footer_bottom)
```

Nullable so product-page bundles hold `null`. Migration sets `footer_bottom` as the DB default for all existing rows.

## Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `prisma/schema.prisma` | Add `FullPageLayout` enum + `fullPageLayout` field on Bundle |
| 2 | `app/hooks/useDashboardState.ts` | Add `fullPageLayout` state, setter, reset |
| 3 | `app/routes/app/app.dashboard/route.tsx` | Render layout selection cards (with storefront illustrations) when `bundleType === 'full_page'`; add hidden input |
| 4 | `app/routes/app/app.dashboard/dashboard.module.css` | Add `.layoutIllustration` styles for the mini storefront preview cards |
| 5 | `app/routes/app/app.dashboard/handlers/handlers.server.ts` | Extract `fullPageLayout` from formData; pass to `db.bundle.create` |
| 6 | `app/routes/api/api.bundle.$bundleId[.]json.tsx` | Add `fullPageLayout: bundle.fullPageLayout ?? null` to response |
| 7 | `app/hooks/useBundleForm.ts` | Add `fullPageLayout` to form state + setter |
| 8 | `app/hooks/useBundleConfigurationState.ts` | Wire `fullPageLayout` through initialData, originalValuesRef, discard, markAsSaved |
| 9 | `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/types.ts` | Add `fullPageLayout` to BundleData interface |
| 10 | `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | Add `<Select>` dropdown; append `fullPageLayout` to save formData |
| 11 | `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | Extract + persist `fullPageLayout` in save handler |
| 12 | `app/assets/bundle-widget-full-page.js` | Add layout branch in `renderSteps()`; new `renderFullPageLayoutWithSidebar()` + `renderSidePanel()` methods |
| 13 | `extensions/bundle-builder/assets/bundle-widget-full-page.css` | Add sidebar layout CSS (`.layout-sidebar`, `.full-page-side-panel`, `.side-panel-*`) |

**No new files created** (except auto-generated Prisma migration).

## Layout Card Illustrations

Each card in the create modal shows a **minimal storefront schematic** — not a screenshot, but a CSS/HTML illustration that communicates the layout at a glance. Both illustrations share the same outer container and color palette.

### Bottom Footer Card Illustration

```
┌─────────────────────────────────────┐
│  ○────○────○   (step tabs)          │
│                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ img  │ │ img  │ │ img  │        │
│  │      │ │      │ │      │        │
│  ├──────┤ ├──────┤ ├──────┤        │
│  │$20   │ │$20   │ │$20   │        │
│  │[Add] │ │[Add] │ │[Add] │        │
│  └──────┘ └──────┘ └──────┘        │
│                                     │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← sticky footer bar
│  [tiles]        Total  [← ] [Next] │
└─────────────────────────────────────┘
```

Rendered as nested `<div>`s with CSS:
- Outer: bordered rounded container
- Top row: 3 small circles connected by a line (step tabs)
- Middle: 3 product card placeholders (gray boxes with small bar)
- Bottom: solid colored bar spanning full width (the footer)

### Side Footer Card Illustration

```
┌─────────────────────────┬───────────┐
│  ○────○────○             │Your Bundle│
│                          │           │
│  ┌──────┐ ┌──────┐      │ [Box of 3]│
│  │ img  │ │ img  │      │ ████░░░░  │
│  │      │ │      │      │           │
│  ├──────┤ ├──────┤      │ ┌──┐┌──┐  │
│  │$20   │ │$20   │      │ │  ││+ │  │
│  │[Add] │ │[Add] │      │ └──┘└──┘  │
│  └──────┘ └──────┘      │           │
│                          │ Total $40 │
│                          │ [← ][Next]│
└─────────────────────────┴───────────┘
```

Rendered as nested `<div>`s with CSS:
- Outer: bordered rounded container with `display: flex`
- Left (~65%): step tabs row + 2 product card placeholders
- Right (~35%): bordered sidebar with "Your Bundle" text, tier pill, progress bar, product slot grid (1 filled + 1 empty with +), total, and nav buttons

Both illustrations use the same muted color palette (#E8E8E8 for placeholders, #2C2C2C for text/buttons, #F5F5F5 for backgrounds) so they look clean in both light and dark Polaris themes.

### CSS Module Classes (dashboard.module.css)

```css
.layoutIllustration {
  width: 100%;
  aspect-ratio: 16 / 10;
  border: 1px solid #c9cccf;
  border-radius: 6px;
  overflow: hidden;
  background: #FAFAFA;
  padding: 8px;
  box-sizing: border-box;
}
```

The internal elements use inline styles for simplicity (they're small, fixed illustrations — not dynamic components).

## Widget JS Architecture

### Branching Point: `renderSteps()` (line 675)

```javascript
// Inside the full_page branch:
const layout = this.selectedBundle.fullPageLayout || 'footer_bottom';
if (layout === 'footer_side') {
  await this.renderFullPageLayoutWithSidebar();
} else {
  await this.renderFullPageLayout();
}
```

### New Method: `renderFullPageLayoutWithSidebar()`

Mirrors `renderFullPageLayout()` structure but creates a 2-column layout:

```
.full-page-layout.layout-sidebar
  ├── .full-page-content-section (left ~66%)
  │   ├── promoBanner
  │   ├── stepTimeline
  │   ├── searchInput
  │   ├── categoryTabs
  │   └── productGridContainer
  └── .full-page-side-panel (right ~34%)
      ├── .side-panel-header ("Your Bundle" + Clear)
      ├── .side-panel-tiers (discount rule pills)
      ├── .side-panel-progress (progress bar)
      ├── .side-panel-products-grid (product slots)
      └── .side-panel-nav (Total + Back/Next)
```

**DRY shared code:** Both layouts call the same helper methods:
- `createPromoBanner()`
- `createStepTimeline()`
- `createSearchInput()`
- `createCategoryTabs()`
- `createFullPageProductGrid()`
- `PricingCalculator.calculateBundleTotal()` / `calculateDiscount()`
- `CurrencyManager.formatMoney()`
- `this.canProceedToNextStep()` / `this.areBundleConditionsMet()`

The **only new code** is the side panel DOM construction and its update method.

### New Method: `renderSidePanel(panelElement)`

Builds the sidebar content. Called from `renderFullPageLayoutWithSidebar()` after products load and on every `updateProductSelection()` call when in sidebar mode.

### Modified: `updateProductSelection()`

After the existing `renderFullPageFooter()` call (line 2813), add a sidebar branch:

```javascript
if (bundleType === 'full_page') {
  const layout = this.selectedBundle.fullPageLayout || 'footer_bottom';
  if (layout === 'footer_side') {
    const sidePanel = this.elements.stepsContainer.querySelector('.full-page-side-panel');
    if (sidePanel) this.renderSidePanel(sidePanel);
  } else {
    this.renderFullPageFooter();
  }
}
```

## Widget CSS Architecture

### Layout Toggle via CSS Class

```css
/* Default: column layout (bottom footer) — existing, unchanged */
.full-page-layout { flex-direction: column; }

/* Sidebar mode: row layout */
.full-page-layout.layout-sidebar { flex-direction: row; }
```

### CSS Custom Properties (DCP compatibility)

The side panel reuses all existing footer CSS variables:
- `--bundle-full-page-footer-bg-color` → side panel background
- `--bundle-full-page-footer-border-color` → side panel border
- `--bundle-full-page-footer-next-btn-bg` → tier pill active color, Next button
- `--bundle-full-page-footer-back-btn-bg` → Back button
- `--bundle-full-page-progress-track` / `--bundle-full-page-progress-fill` → progress bar
- `--bundle-full-page-footer-total-final` → total price color
- `--bundle-full-page-footer-remove-color` → Clear button and remove buttons

No new CSS variables needed — full DCP compatibility from day one.

### Mobile Responsive (< 768px)

```css
@media (max-width: 768px) {
  .full-page-layout.layout-sidebar {
    flex-direction: column;
  }
  .full-page-side-panel {
    position: static;
    height: auto;
    max-width: 100%;
    border-left: none;
    border-top: 1px solid var(--bundle-full-page-footer-border-color);
  }
}
```

## Migration / Backward Compatibility

- `@default(footer_bottom)` ensures all existing rows get `footer_bottom`
- Widget treats `null` and `'footer_bottom'` identically: `layout || 'footer_bottom'`
- Product-page bundles: `fullPageLayout` stays `null`, never read by widget
- No changes to product-page widget (`bundle-widget-product-page.js`)
- No changes to Liquid template (widget reads from API, not data-* attributes)

## Build Sequence

| Phase | Description | Files |
|-------|-------------|-------|
| 1 | Database migration | `prisma/schema.prisma` |
| 2 | API endpoint | `api.bundle.$bundleId[.]json.tsx` |
| 3 | Create flow (dashboard) | `useDashboardState.ts`, `dashboard/route.tsx`, `dashboard.module.css`, `dashboard/handlers.server.ts` |
| 4 | Configure flow | `useBundleForm.ts`, `useBundleConfigurationState.ts`, `configure/types.ts`, `configure/route.tsx`, `configure/handlers.server.ts` |
| 5 | Widget JS | `bundle-widget-full-page.js` |
| 6 | Widget CSS | `bundle-widget-full-page.css` |
| 7 | Build + lint + commit | `npm run build:widgets`, ESLint, issue file |

## Testing Approach

1. **Create flow:** Create a full-page bundle with "Footer at Side" → verify `fullPageLayout = 'footer_side'` in DB
2. **API response:** GET `/api/bundle/{id}.json` → verify `fullPageLayout` present
3. **Configure flow:** Open configure page → verify Select shows current layout → change to other option → save → verify DB updated
4. **Widget — side layout:** Load the bundle page → verify 2-column layout with sticky sidebar, product slots, discount tiers, progress bar, navigation
5. **Widget — bottom layout:** Load a bundle with `footer_bottom` → verify existing bottom footer unchanged
6. **Backward compat:** Load an old bundle (null `fullPageLayout`) → verify bottom footer renders
7. **Mobile:** Resize viewport < 768px → verify sidebar collapses below product grid
