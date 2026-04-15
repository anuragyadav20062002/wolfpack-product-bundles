# Skai Lama (Easy Bundle Builder) — Competitive Analysis Findings

**Analyzed:** 2026-03-17
**Links:**
1. `https://skailama-demo.myshopify.com/products/swag®-create-your-look-new` — Multi-step "Create Your Look" bundle (3 steps + free gift)
2. `https://skailama-demo.myshopify.com/products/ultimate-soft-toy-bundle-new` — Fixed-price toy bundle (3 steps, fixed bundle price)

**Screenshots:** `docs/skai-lama-analysis/` (01–19)

---

## 1. Overall Architecture

Skai Lama uses a **bottom-sheet modal** pattern for their product-page bundle widget:

- **Inline widget** (always visible on product page): Shows empty-state card slots or filled product cards per step category
- **Modal** (triggered by clicking an empty slot): Slides up from bottom as a full-height sheet, lists all products in that step's category
- The modal does NOT replace the page — it overlays it
- App JS files: `easy-bundle-product-page-min.js` + `easy-bundle-min.js` (Shopify CDN extensions)
- CSS class prefix: `gbb` (e.g., `gbbMixProductsModal`, `gbbMixEmptyStateCard`)

---

## 2. Inline Widget — States and Layout

### 2a. Empty State (initial page load)
- Each step renders a **clickable card slot** (`gbbMixEmptyStateCard`)
- Card dimensions: ~131×200px
- Style: white background + dashed blue border (`2px dashed #007AFF`) + `border-radius: 12px`
- Contains: category image (product photo from Shopify) + category label text below
- `cursor: pointer` — clicking opens the modal filtered to that category
- Cards arranged in a horizontal row

**Screenshot ref:** `01-link1-initial-desktop.png`, `02-link1-viewport-desktop.png`

### 2b. Mixed State (some steps filled, some empty)
- Filled steps: show `gbbMixSelectedProductCard` (solid blue border, product image + title + variant)
- Empty steps: still show `gbbMixEmptyStateCard` (dashed blue border)
- Wrapper becomes `gbbMixProductPageCategoriesWrapper gbbMixProductPageCategoriesWrapperVStacked` when at least one is filled

**Screenshot ref:** `15-mobile-inline-mixed-state.png`

### 2c. Fully Filled State
- All steps show `gbbMixSelectedProductCard`
- "Add Bundle to Cart" button becomes active (blue with box shadow)
- Inline widget layout uses stacked rows with category label above each card

**Screenshot ref:** `10-inline-widget-filled-state.png`, `11-inline-widget-filled-fullpage.png`

### Inline Widget Card — Filled State Detail
```
┌─────────────────────────┐
│ [Product Image]          │  ← 131×200px
│ Product Title            │
│ Variant: S / Blue        │
│                      [X] │  ← remove button (absent for default/pre-selected products)
└─────────────────────────┘
```
- Class: `gbbMixSelectedProductCard`
- Border: `2px solid #007AFF`
- Border radius: `10px`
- Remove button: `gbbMixProductPageCategorySelectedPrtoductIconWrapper` (note: typo in class name, intentional in their codebase)
- For **default/pre-selected products** (`categoryId: "DefaultProduct"`): NO remove button

---

## 3. Bottom Sheet Modal

### 3a. Trigger
- Clicking any `gbbMixEmptyStateCard` opens the modal
- Modal opens filtered to that step's category
- Modal renders with `data-category-id` attribute matching the clicked step

### 3b. Modal Animation
```css
/* Opening */
.gbbMixProductsModal {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 0;              /* closed state */
  transition: height 0.4s ease-in-out;
  border-radius: 15px 15px 0 0;
  background: white;
  z-index: 999999;
}

/* Open state (JS adds class) */
.gbbMixProductsModal.open {
  height: ~765px;         /* or ~85vh on mobile */
}
```
- Slides UP from bottom over 400ms
- Overlay (`gbbMixOverlay`): `position: fixed; background: rgba(30,30,30,0.5); opacity: 0 → 1; transition: 0.8s ease-in-out`

**Screenshot ref:** `03-modal-open-state.png`, `04-modal-bottom-sheet-open.png`, `14-mobile-modal-open.png`

### 3c. Modal Structure
```
┌────────────────────────────────────────────────────────┐
│  [Category Tabs: T-Shirt | Pants | Hoodie | Cap]   [X] │  ← header
│  ─────────────────────────────────────────────────────  │
│  [Card] [Card] [Card] [Card] [Card]                     │  ← 5-col grid (desktop)
│  [Card] [Card] [Card] [Card] [Card]                     │
│  [Card] [Card]                                          │
└────────────────────────────────────────────────────────┘
```

### 3d. Category Tabs (inside modal)
- Horizontal scrollable tab row
- Unselected: white background + blue border (`1px solid #007AFF`) + blue text
- Selected: blue background (`#007AFF`) + white text
- Style: `border-radius: 8px; padding: 10px 30px; font-size: 14px; font-weight: 700`
- Each tab shows category name only (no quantity hint in modal tabs)

### 3e. Product Cards (inside modal)
- Grid: 5 columns desktop / 2 columns mobile
- Card shows: product image + product title + variant selector
- Default (unselected): light border, normal opacity
- Selected state (`gbbMixProductItemSelected`): solid black/dark border + elevated box-shadow + checkmark icon visible
- Selecting a product from a category **auto-advances** to the next category tab (instant, no animation delay)

**Screenshot ref:** `05-first-product-selected.png`, `06-auto-step-advanced-to-pants.png`, `07-tshirt-selected-state.png`

### 3f. Auto-Step Progression
- When a product is selected in the current category tab AND the step's quantity requirement is met → modal automatically switches to the **next category tab**
- No animation — tab switch is instant
- This creates a guided "wizard" UX: select product → jumps to next step → select → next step...
- After the final step is filled, modal closes automatically
- If an already-filled step is revisited (user clicks a filled card), modal opens to that step's tab

**Screenshot ref:** `06-auto-step-advanced-to-pants.png`, `08-two-products-selected-auto-advance.png`

### 3g. Modal Close
- Desktop: X icon button in top-right of modal header
- Mobile: chevron-down (↓) icon in top-right

---

## 4. Free Gift Feature

### Implementation
The free gift is **not a special feature** — it is a regular bundle step configured as:
- Step name: e.g., "Get a Free Cap"
- `conditionsText`: Custom text like "Get a cap worth $15 absolutely free!"
- Discount rule: "1 product at 100% off" (discount type: `percentage_off`, value: 100, quantity: 1)
- Shown as the last step in the bundle

### Visual Indicator on Inline Widget Card
- When the free gift step is filled, the inline card shows a badge overlay: `gbbMixSelectedProductCardDiscountBadge`
- Badge style: black pill (`rgba(30,30,30,0.9)` background, white text), content: "100% off"
- Position: bottom-left corner of the filled card

**Screenshot ref:** `09-free-cap-selected-complete-bundle.png`

### Data Structure
The step's data attribute includes:
```json
{
  "categoryId": "some-step-id",
  "conditionsText": "Get a cap worth $15 absolutely free!",
  "discountType": "percentage_off",
  "discountValue": 100,
  "quantity": 1
}
```

---

## 5. Default / Pre-Selected Products

- Configured as `categoryId: "DefaultProduct"` in the widget data
- Shown in the inline widget from page load (already in a "filled" card state)
- NO remove button — customer cannot deselect
- NOT shown as a selectable tab in the modal
- Counts toward bundle completion automatically

---

## 6. "Add Bundle to Cart" Button

### States
```
Disabled (bundle incomplete):
  background: #ccc / gray
  cursor: not-allowed

Enabled (bundle complete):
  background: #007AFF (brand blue)
  box-shadow: 0 4px 15px rgba(0,122,255,0.4)
  cursor: pointer
```

### Button Content Layout
```
[  Add Bundle to Cart  $89.00  $120.00  20% OFF  ]
                       ↑price  ↑strike   ↑pill
```
- `gbbMixBundlePrice`: current (discounted) price
- `gbbMixBundleTotalPrice`: strikethrough original price
- `gbbMixBundleBtnDiscountPill`: colored pill (e.g., "20% OFF" or fixed price label)

**Screenshot ref:** `18-link2-all-selected-fixed-price.png`

---

## 7. Toast Notification

- Appears when bundle is added to cart
- Class: `gbbMixToastNotification`
- Style: `background: rgba(30,30,30,0.9)`, white text, rounded pill
- **Animation**: Spring physics using CSS `linear()` easing function with bounce — not a standard ease-in-out
- Position: top-center of viewport
- Auto-dismisses after ~2s

---

## 8. Mobile Behavior

- Inline widget: cards stack vertically in 1-2 column layout
- Modal: slides up to ~85% of viewport height, cards in 2-column grid
- Close button: chevron-down (↓) icon instead of X
- Category tabs: horizontally scrollable (same as desktop)

**Screenshot ref:** `12-mobile-inline-widget.png`, `13-mobile-after-deselect.png`, `14-mobile-modal-open.png`

---

## 9. Link 2 — Fixed-Price Bundle (Ultimate Soft Toy)

- 3 steps, each requiring 1 product selection
- Fixed bundle price (not percentage discount) — button shows a flat price badge
- Same modal/inline mechanics
- After all 3 steps filled → modal auto-closes, inline shows all 3 filled cards

**Screenshot ref:** `16-link2-initial-desktop.png`, `17-link2-modal-open.png`, `18-link2-all-selected-fixed-price.png`, `19-link2-inline-filled-state.png`

---

## 10. Gap Analysis — Skai Lama vs Our Current Widget

| Feature | Skai Lama | Our Widget | Gap |
|---------|-----------|------------|-----|
| Bottom sheet modal | ✅ Slides up from bottom, 400ms ease-in-out | ❌ Inline accordion / no modal | **HIGH — core UX differentiator** |
| Modal overlay | ✅ Semi-transparent dark overlay | ❌ None | HIGH |
| Auto-step progression | ✅ Auto-advances to next tab on selection | ❌ Manual only | HIGH |
| Empty state cards | ✅ Clickable slots with dashed border + category image | ⚠️ Varies by design | MEDIUM |
| Filled card with remove button | ✅ X button per card | ✅ We have this | ✅ |
| Free gift step (discount badge on card) | ✅ "100% off" pill on inline card | ❌ No visual badge on inline cards | MEDIUM |
| Default/pre-selected product (no remove) | ✅ No remove button for defaults | ❌ Not supported | MEDIUM |
| Category tabs in modal (scrollable) | ✅ Horizontal scroll | ⚠️ Step tabs exist but different context | MEDIUM |
| Product cards in modal (5-col grid) | ✅ 5 desktop / 2 mobile | ⚠️ Our modal has different layout | MEDIUM |
| Selected product card highlight | ✅ Black border + elevated shadow + checkmark | ⚠️ Different styling | LOW |
| Add to cart button with price + badge | ✅ Embedded price + strikethrough + pill | ✅ We have footer section | LOW |
| Spring bounce toast | ✅ CSS linear() spring animation | ❌ None or basic | LOW |
| Mobile modal height ~85vh | ✅ Responsive | ⚠️ Our modal may clip | MEDIUM |

---

## 11. Recommended Changes to Our Widget

### Priority 1 (Core Experience — game-changing)

1. **Bottom sheet modal pattern**: Replace or supplement our product selection UI with a bottom-sheet modal that slides up (400ms ease-in-out, `border-radius: 15px 15px 0 0`). Triggered by clicking empty-state card slots.

2. **Auto-step progression**: When a step's quantity condition is met (i.e., user selects required number of products), automatically advance to the next step tab inside the modal. Close modal when all steps complete.

3. **Empty state cards**: Render clickable card slots in the inline widget showing category image + dashed blue border. Currently our full-page widget has product cards but the product-page widget needs this pattern.

### Priority 2 (Visual Polish)

4. **Discount badge on inline filled cards**: Show a "100% off" or "N% off" badge pill on free-gift step cards in the inline widget.

5. **Default/pre-selected product support**: Step marked as `isDefault: true` should render a filled card with NO remove button and should not appear in the modal.

6. **Modal overlay**: Add a semi-transparent overlay (`rgba(30,30,30,0.5)`) behind the modal.

### Priority 3 (Nice-to-have)

7. **Spring-physics toast**: Use CSS `linear()` easing with bounce for add-to-cart toast notification.

8. **Mobile close chevron**: Show a chevron-down instead of X on mobile modal.

---

## 12. DCP (Design Control Panel) Changes Needed

| Section | Current | Needed |
|---------|---------|--------|
| Modal settings | Not present for product-page | Add: modal border-radius, overlay opacity, animation duration |
| Empty state card | Not present | Add: border style (dashed/solid), border color, card dimensions |
| Step tab styling | Full-page only | Extend to product-page modal tabs |
| Discount badge on cards | Not present | Add: badge bg color, text color, show/hide toggle |
| Auto-step progression | Not configurable | Add: enable/disable toggle |

---

## 13. Feature Pipeline Scope

Based on this analysis, the "Skai Lama Bottom Sheet Redesign" feature will require:

- **Widget JS** (`app/assets/bundle-widget-product-page.js`): Bottom sheet modal, auto-step progression, empty state cards, overlay
- **Widget CSS** (`extensions/bundle-builder/assets/bundle-widget-product-page.css`): All new component styles
- **DCP Preview** (`app/components/design-control-panel/preview/`): New modal preview, empty state card preview
- **DCP Controls**: New settings for modal, empty cards, auto-progression
- **Liquid block** (`extensions/bundle-builder/blocks/bundle-product-page.liquid`): Any new config passthrough
- **Bundle rebuild**: `npm run build:widgets`

**Estimated complexity:** HIGH — this is a fundamental UX redesign of the product-page widget.
