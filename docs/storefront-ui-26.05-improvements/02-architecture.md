# Architecture: Storefront UI — Competitive Polish (26.05)

## Fast-Track Note
BR context from: `docs/storefront-ui-26.05-improvements/01-requirements.md`
Competitor reference: `docs/competitor-analysis/gbb-gap-analysis-2026-04-20.md`
All decisions finalised through Q&A session on 2026-04-20.

---

## Impact Analysis

- **God nodes touched:** `BundleWidgetFullPage` (114 edges) — all FR changes touch this. Extra care required.
- **Communities touched:**
  - Community 1 (`BundleWidgetFullPage`, `ComponentGenerator`, `CurrencyManager`, `PricingCalculator`) — FR-01, FR-02, FR-04
  - Community 2 (CSS Variables, button styling, DCP controls) — FR-01, FR-02, FR-03, FR-05
  - Community 3 (BundleStep, free gift logic) — FR-05
- **Blast radius:**
  - FR-01 — affects all FPB layouts; removes variant modal entirely; adds new component; touches bundle configure page
  - FR-02 — affects FPB footer rendering pipeline; must test all layouts (classic, sidebar, tabs-modal)
  - FR-03 — isolated; FPB only; requires Prisma migration
  - FR-04 — sidebar layout only
  - FR-05 — CSS + JS changes to timeline; must test all step counts and step types

---

## Decision

**FR-01 (Product Card Compact Button + Variant Selector):**
Replace full-width `.product-add-btn` with a 35×35px circle button. When qty > 0 the button fully transforms into `[−] count [+]`. Variant selection moves from a modal to an inline card component: a merchant-configurable button group for one variant dimension (on the card, always visible) + a custom visual dropdown panel for remaining dimensions. The existing variant selection modal is removed entirely. The variant selector is built as a reusable component at `app/assets/widgets/shared/variant-selector.js`, exported from the shared components index. A new `primaryVariantOption` field on `BundleStep` stores the merchant's chosen button-group dimension; the bundle configure page gains a UI to select it with a smart suggestion (smallest-count dimension suggested). Products missing the configured dimension fall back to first available dimension (runtime) and surface a warning (configure page).

**FR-02 (Discount Progress Banner):**
Inject a `<div class="discount-progress-banner">` attached to the top of the floating footer bar. It is a sibling of the footer container and moves with it on expand/collapse — achieved by inserting it inside the footer's outermost wrapper, above the existing footer content. In sidebar layout it renders above the "Add to Cart" button. DCP controls: background color + text color (two new CSS variables). No footer duplication — banner supplements, footer bar is unchanged.

**FR-03 (Floating Badge):**
New `floatingBadgeEnabled Boolean @default(false)` + `floatingBadgeText String @default("")` on `Bundle`. Fixed-position FPB-only badge, bottom-left, above footer bar (z-index managed so it doesn't overlap other components). DCP: toggle + text input (max 60 chars). Session-dismissed via `sessionStorage`.

**FR-04 (Sidebar Upsell Slot):**
Append `.sidebar-upsell-slot` div inside `_renderSidebarPanel()` below the items list, above the total row. Content from `PricingCalculator.getDiscountProgressMessage()`. Hidden when no discount tier configured.

**FR-05 (Timeline — Clean Rebuild):**
Remove `gap: 308px` from `.step-timeline`. Use `::after` pseudo-element on `.timeline-step:not(:last-child)` for the connecting line. Line fills left-to-right via CSS `clip-path` or `width` transition (400ms ease) driven by a `.completed` class toggled in JS. Three icon states: `active` (primary color), `inactive` (grayscale via `filter: grayscale(1) opacity(0.4)`), `complete` (checkmark SVG badge overlaid, icon still visible). Icons are user-uploadable per step (`timelineIconUrl` field on `BundleStep`, separate from `bannerImageUrl`); defaults provided for regular / free-gift / default-product step types. Step type detected via existing `isFreeGift` + `isDefault` flags — no new flags needed. All colors DCP-customizable.

---

## Data Model

```typescript
// prisma/schema.prisma — BundleStep additions
primaryVariantOption  String?   // e.g. "Size" — dimension shown as button group on card
timelineIconUrl       String?   // user-uploaded timeline step icon (separate from bannerImageUrl)

// prisma/schema.prisma — Bundle additions (FR-03)
floatingBadgeEnabled  Boolean   @default(false)
floatingBadgeText     String    @default("")
```

---

## New Shared Component

```
app/assets/widgets/shared/variant-selector.js   ← new file
```

Exported from `app/assets/widgets/shared/index.js` as `VariantSelectorComponent`.
Used by `bundle-widget-full-page.js` to replace existing modal-based variant selection.

---

## Files

### FR-05 — Timeline CSS + Icon States (implement first)

| File | Action | What changes |
|------|--------|-------------|
| `extensions/bundle-builder/assets/bundle-widget-full-page.css` | modify | Remove `gap` from `.step-timeline`. Add `flex: 1` to `.timeline-step`. Add `::after` connecting line pseudo-element. Add `.timeline-step.completed::after` fill transition (400ms, `width` 0→100%). Add `.timeline-step--active`, `.timeline-step--inactive`, `.timeline-step--completed` icon state classes. Add `--bundle-timeline-active-color`, `--bundle-timeline-inactive-color`, `--bundle-timeline-complete-color` CSS vars. |
| `app/assets/bundle-widget-full-page.js` | modify | In timeline render: assign `timeline-step--active / --inactive / --completed` classes per step. Render `<img class="timeline-step-icon">` from `step.timelineIconUrl` or default SVG based on step type (`isFreeGift`, `isDefault`). Add checkmark badge overlay on completed steps. Remove any JS-injected `.timeline-line` gap logic. |
| `app/lib/css-generators/css-variables-generator.ts` | modify | Emit `--bundle-timeline-active-color`, `--bundle-timeline-inactive-color`, `--bundle-timeline-complete-color` from settings. |
| `app/routes/app.bundle.$id.configure.tsx` | modify | Add timeline icon upload field per step (reuse existing image upload pattern from `bannerImageUrl`). |
| `app/services/bundles/settings/` | modify | Include new timeline color settings in `extractGeneralSettings` / `buildSettingsData`. |
| `prisma/schema.prisma` | modify | Add `timelineIconUrl String?` to `BundleStep`. |
| `app/assets/bundle-widget-full-page-bundled.js` (generated) | rebuild | `npm run build:widgets` |

### FR-02 — Discount Progress Banner (implement second)

| File | Action | What changes |
|------|--------|-------------|
| `app/assets/bundle-widget-full-page.js` | modify | Add `_renderDiscountProgressBanner()` → returns banner HTML. Insert inside footer outermost wrapper, above footer content (so it moves with footer expand/collapse). Add `_updateDiscountProgressBanner()` called from same refresh path as footer update. In sidebar layout: inject banner above Add to Cart button in `_renderSidebarPanel()` / `_refreshSidebarPanel()`. |
| `extensions/bundle-builder/assets/bundle-widget-full-page.css` | modify | Add `.discount-progress-banner` styles. Add `.discount-progress-banner.reached` congratulations state. Use `--bundle-discount-banner-bg` and `--bundle-discount-banner-text` CSS vars. |
| `app/lib/css-generators/css-variables-generator.ts` | modify | Emit `--bundle-discount-banner-bg` and `--bundle-discount-banner-text` from settings. |
| `app/services/bundles/settings/` | modify | Add `discountBannerBg` + `discountBannerText` to settings extraction. |
| `app/routes/app.bundle.$id.configure.tsx` (DCP) | modify | Add banner background color + text color pickers in existing Discount/Footer section. |

### FR-01 — Compact Button + Variant Selector (implement third — largest change)

| File | Action | What changes |
|------|--------|-------------|
| `app/assets/widgets/shared/variant-selector.js` | create | New `VariantSelectorComponent` class. Renders: button group (for `primaryVariantOption` dimension, max 4 visible + "+N more"), visual dropdown panel (image thumbnail + name, opens custom tile panel for remaining dimensions). Handles single-dimension (panel only). Handles fallback when product missing configured dimension. Emits `variant-selected` custom event. Importable/reusable. |
| `app/assets/widgets/shared/index.js` | modify | Export `VariantSelectorComponent`. |
| `app/assets/bundle-widget-full-page.js` | modify | In `renderProductCard()`: replace full-width `.product-add-btn` with 35×35px circle button. Remove `product-quantity-selector` row from card HTML. Wire `inline-qty-btn` / `inline-quantity-controls` as full transformation (button disappears, `[−] count [+]` appears). Remove variant selection modal entirely. Integrate `VariantSelectorComponent` on each card. On max-qty click: show toast "Maximum products selected" (via `ToastManager`). |
| `extensions/bundle-builder/assets/bundle-widget-full-page.css` | modify | `.product-add-btn` → 35×35px circle (`border-radius: var(--bundle-add-btn-radius, 99px)`), `background: var(--bundle-add-btn-color, var(--bundle-primary-color))`. `.inline-quantity-controls` → full-width replacement at same position. `.product-quantity-selector` → `display: none`. `.product-card` → `position: relative`. Add variant selector component styles. |
| `app/lib/css-generators/css-variables-generator.ts` | modify | Emit `--bundle-add-btn-color` and `--bundle-add-btn-radius`. |
| `app/routes/app.bundle.$id.configure.tsx` (DCP + configure) | modify | Add "Add Button Color" color picker + "Add Button Shape" border-radius slider to DCP. Add per-step "Primary Variant Dimension" selector with smart suggestion (smallest-count dimension auto-suggested, user can override). Show warning badge on step if products are missing the configured dimension. |
| `app/services/bundles/settings/` | modify | Add `addBtnColor` + `addBtnRadius` to settings. |
| `prisma/schema.prisma` | modify | Add `primaryVariantOption String?` to `BundleStep`. |
| `app/assets/bundle-widget-full-page-bundled.js` (generated) | rebuild | `npm run build:widgets` |

### FR-04 — Sidebar Upsell Slot (implement fourth)

| File | Action | What changes |
|------|--------|-------------|
| `app/assets/bundle-widget-full-page.js` | modify | In `_renderSidebarPanel()`: append `.sidebar-upsell-slot` div below items list, above total. In `_refreshSidebarPanel()`: update upsell text from `PricingCalculator.getDiscountProgressMessage()`. Hide slot if no discount configured. |
| `extensions/bundle-builder/assets/bundle-widget-full-page.css` | modify | Add `.sidebar-upsell-slot` styles (bordered box, accent bg, padding, icon). |

### FR-03 — Floating Dismissible Promo Badge (implement last)

| File | Action | What changes |
|------|--------|-------------|
| `prisma/schema.prisma` | modify | Add `floatingBadgeEnabled Boolean @default(false)` + `floatingBadgeText String @default("")` to `Bundle`. |
| `app/lib/css-generators/css-variables-generator.ts` | modify | Emit `--bundle-floating-badge-display: block/none` based on `floatingBadgeEnabled`. |
| `extensions/bundle-builder/blocks/bundle-full-page.liquid` | modify | Render `data-floating-badge-enabled` + `data-floating-badge-text` on widget container. |
| `app/assets/bundle-widget-full-page.js` | modify | In `init()`: read badge data attrs. If enabled and not dismissed (`sessionStorage`), render `<div class="floating-promo-badge">…<button class="floating-badge-dismiss">✕</button></div>`. Dismiss handler sets sessionStorage. |
| `extensions/bundle-builder/assets/bundle-widget-full-page.css` | modify | Add `.floating-promo-badge` styles (fixed, bottom-left, above footer bar, z-index 100, primary color, does not overlap footer or discount banner). |
| `app/routes/app.bundle.$id.configure.tsx` (DCP) | modify | Add "Floating Badge" toggle + text input (max 60 chars) in Controls section. |
| `app/services/bundles/settings/` | modify | Include `floatingBadgeEnabled` + `floatingBadgeText` in `extractGeneralSettings` / `buildSettingsData`. |

---

## Prisma Migrations

```bash
# FR-05 + FR-01 step fields:
npx prisma migrate dev --name add-step-timeline-and-variant-fields

# FR-03 bundle fields (run after FR-05/FR-01 migration):
npx prisma migrate dev --name add-floating-badge-fields

npx prisma generate
```

---

## Build & Deploy

```bash
# After all JS/CSS source changes:
npm run build:widgets

# Increment WIDGET_VERSION in scripts/build-widget-bundles.js before deploy
# Then: npm run deploy:prod  OR  npm run deploy:sit
```

---

## Test Plan

| Test file | Scope | Key behaviours |
|-----------|-------|---------------|
| `tests/unit/services/` (settings handler) | unit | FR-02: `discountBannerBg`/`discountBannerText` defaults; FR-03: `floatingBadgeEnabled`/`floatingBadgeText` defaults; FR-01: `addBtnColor`/`addBtnRadius` defaults |
| `tests/unit/assets/variant-selector.test.js` | unit | Button group dimension selection; fallback when dimension missing; "+N more" threshold; single-dimension → panel only; `variant-selected` event fires with correct variantId |
| Manual storefront verification | visual | All 5 FRs across: 320px, 768px, 1280px; sidebar layout; classic layout; 1-step and 5-step bundles; free-gift step; default-product step |

**No tests needed for:** CSS changes, Liquid block changes, DCP UI rendering, timeline icon upload UI.

---

## Implementation Wave Order

FR-05 → FR-02 → FR-01 → FR-04 → FR-03

1. **FR-05** — CSS + JS timeline rebuild; zero schema change; isolated
2. **FR-02** — Footer banner; no schema change
3. **FR-01** — Largest change: new component, bundle configure UI, schema migration; test all layouts thoroughly
4. **FR-04** — Sidebar only; narrow scope
5. **FR-03** — Requires Prisma migration; do last

---

## Separate Issues (one per FR)

Per user request: one GitHub issue + issue file per FR.

| Issue ID | FR | Title |
|----------|----|-------|
| `fpb-timeline-1` | FR-05 | Step timeline: CSS connecting line + icon states + animation |
| `fpb-discount-banner-1` | FR-02 | Inline discount progress banner above footer |
| `fpb-compact-card-1` | FR-01 | Compact add button + variant selector component |
| `fpb-sidebar-upsell-1` | FR-04 | Sidebar upsell slot |
| `fpb-floating-badge-1` | FR-03 | Floating dismissible promo badge |
