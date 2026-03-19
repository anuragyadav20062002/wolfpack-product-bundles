# Product Owner Requirements: Beco BYOB Expandable Floating Footer

## User Stories with Acceptance Criteria

### Story 1: Compact sticky footer bar

**As a** shopper
**I want** a slim footer bar that shows my selection progress and total price
**So that** I can browse products without the footer consuming most of my screen

**Acceptance Criteria:**
- [ ] Given I have selected ≥ 1 product, the footer bar is visible (fixed to bottom of viewport).
- [ ] Given I have selected 0 products, the footer bar is hidden.
- [ ] The bar shows a thumbnail strip: up to 3 product images; if > 3, show 3 images + a "+N" badge.
- [ ] The bar shows "X/Y Products" where X = total items selected, Y = bundle required quantity.
- [ ] The bar shows total price and, when a discount applies, a coloured discount badge ("NN% OFF").
- [ ] The bar contains the primary "Add to Cart" CTA button (right-aligned).
- [ ] The bar contains a "Back" button (left-aligned or inline) to navigate to the previous step when on step > 1; hidden on step 1.
- [ ] Footer is hidden when `footer_side` layout is active.

---

### Story 2: Expandable product-list panel (reverse dropdown)

**As a** shopper
**I want** to tap "X/Y Products" to review my selections and remove items
**So that** I can manage my bundle without scrolling back through the page

**Acceptance Criteria:**
- [ ] Tapping the "X/Y Products ∨" button opens a panel that slides up from above the footer bar.
- [ ] The panel lists every selected product as a row: 48×48 thumbnail | name | price × qty | trash icon.
- [ ] Tapping the trash icon removes that product (calls existing deselect/remove logic); panel stays open.
- [ ] Tapping outside the panel (backdrop) collapses it.
- [ ] Tapping "X/Y Products ∧" again collapses the panel.
- [ ] Chevron rotates 180° (∨ → ∧) when open.
- [ ] Panel expand/collapse animates smoothly (~250ms ease-out on `max-height`).
- [ ] Panel is scrollable when product list overflows (max-height: 60vh mobile / 50vh desktop).

---

### Story 3: Deal-unlock callout banner in expanded panel

**As a** shopper
**I want** to see a confirmation message when I've met the bundle requirement
**So that** I know I've unlocked the deal and am ready to buy

**Acceptance Criteria:**
- [ ] When selected count equals the bundle required quantity, a green callout banner appears at the top of the expanded panel.
- [ ] The banner reads: "🎉 [discount description]" — e.g. "Best Deal Unlocked! Get 2 products at ₹499".
- [ ] When selected count is less than required, the banner is not shown.
- [ ] Banner text uses the bundle's existing discount messaging (same text as step success state).

---

### Story 4: DCP colour controls for new footer layout

**As a** merchant
**I want** to control footer bar and CTA button colours via DCP
**So that** the footer matches my store's brand

**Acceptance Criteria:**
- [ ] DCP "Footer" subsection retains existing controls: background colour, border colour, text colour, CTA button colour, CTA text colour.
- [ ] New DCP control: "Expanded panel background colour" (for the product list panel).
- [ ] New DCP control: "Deal callout banner colour" (background colour of the green banner).
- [ ] New DCP control: "Remove button colour" (colour of the trash icon).
- [ ] All new DCP controls fall back gracefully to sensible defaults when not configured.

---

## UI/UX Specifications

### Footer Bar (collapsed)
```
┌──────────────────────────────────────────────────────────────────┐
│ [← Back]  [img][img][img]  2/3 Products ∨  Total: ₹499  15% OFF │ [ADD TO CART] │
└──────────────────────────────────────────────────────────────────┘
```
- Height: ~72px (desktop), 60-68px (mobile)
- Background: `var(--bundle-full-page-footer-bg-color, #FFFFFF)`
- Border-top: `1px solid var(--bundle-full-page-footer-border-color, rgba(0,0,0,0.1))`
- Thumbnail images: 36px × 36px, 4px border-radius, slight overlap (margin-left: -8px from 2nd)
- "+N overflow badge": circular, same size as thumbnail, dark background, white text
- "X/Y Products" button: text button, no border, font-weight 500
- Discount badge: pill shape, green background, white text, `font-size: 12px`
- CTA button: `var(--bundle-full-page-cta-bg-color, #000)`, height: 100% of bar, `min-width: 120px`
- Back button: ghost/text button, left side, hidden on step 1

### Expanded Panel
```
┌──────────────────────────────────────────────────────────────────┐
│  🎉 Best Deal Unlocked! Get 2 products at ₹499                   │  ← green banner
├──────────────────────────────────────────────────────────────────┤
│  [48×48]  Natural Laundry Cleaner — 2 litre    ₹450 x1    [🗑]  │
│  [48×48]  Bamboo Kitchen Towel — 20 Sheets     ₹350 x1    [🗑]  │
└──────────────────────────────────────────────────────────────────┘
```
- Background: `var(--bundle-footer-panel-bg, #FFFFFF)`
- Product row height: 64px
- Separator: `1px solid rgba(0,0,0,0.06)` between rows
- Trash icon: 20×20px, colour `var(--bundle-footer-remove-icon-color, #888888)`
- Deal banner background: `var(--bundle-footer-callout-bg, #22C55E)`, white text
- Rounded top corners: `border-radius: 12px 12px 0 0` on the panel
- Backdrop: `position: fixed; inset: 0; background: transparent; z-index: below panel`

### Component labels / exact text
- Toggle button: `"{selectedCount}/{requiredCount} Products"` (no "select" suffix)
- CTA button: uses existing bundle `addToCartText` setting (default: `"Add to Cart"`)
- Back button label: `"← Back"` or just chevron on mobile

## Data Persistence
No new data persisted. All state is transient DOM state (CSS class `is-open` on the footer element).

## Backward Compatibility Requirements
- Existing DCP CSS variable names (`--bundle-full-page-footer-*`) must remain functional.
- The new selectors must either reuse those variables or define new ones with fallbacks.
- Merchants who don't configure DCP will see sensible defaults.

## Out of Scope (explicit)
- Multi-quantity per product (Beco shows x1 per product; our widget works the same way)
- Wishlist / save-for-later in the expanded panel
- Animation easing beyond CSS transitions
- Product-page widget footer
