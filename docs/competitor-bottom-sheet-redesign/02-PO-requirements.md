# Product Owner Requirements: Product-Page Bundle Widget — Bottom-Sheet Redesign

**Feature Name:** skai-lama-bottom-sheet-redesign
**Stage:** 2 — Product Owner Requirements
**Input:** `docs/skai-lama-bottom-sheet-redesign/00-BR.md`
**Date:** 2026-03-17

---

## User Stories with Acceptance Criteria

---

### Story 1: Empty-State Slot Cards in Inline Widget

**As a** shopper
**I want** to see a row of visual "selection slot" cards on the product page
**So that** I immediately understand how many choices I need to make and can click to open the product picker

**Acceptance Criteria:**
- [ ] Given a product-page bundle with 3 steps, when the page loads, the inline widget shows 3 slot cards in a horizontal row.
- [ ] Given a slot card is empty (no product selected for that step), it shows: (a) the step's representative category image, (b) the step name label below the image, (c) a `2px dashed` border in the brand primary color.
- [ ] Given a slot card is filled (a product was selected), it shows: (a) the selected product's image, (b) the product title (truncated to ~20 chars), (c) the variant title if multi-variant, (d) a `2px solid` border in the brand primary color, (e) a circular × remove button in the top-right corner.
- [ ] Given a step is marked as "default" (pre-selected), the filled card is shown but has NO × remove button.
- [ ] Given a step is a free-gift step (discount 100%) or has a `discountBadgeLabel` configured, the filled inline card shows a discount pill badge (e.g., "FREE" or "100% off") overlaid in the bottom-left corner of the card.
- [ ] Given a step's slot card is clicked (empty or filled), the bottom-sheet modal opens scoped to that step's category tab.
- [ ] Given the widget has a DCP setting "Widget Style" set to "Classic", the existing vertical-accordion layout is shown instead.

---

### Story 2: Bottom-Sheet Modal — Open/Close Animation

**As a** shopper
**I want** a product selection panel to slide smoothly up from the bottom of the screen
**So that** I can pick products without losing context of the product page

**Acceptance Criteria:**
- [ ] Given an inline slot card is clicked, a bottom-sheet modal slides up from `bottom: 0` of the viewport.
- [ ] The slide-up animation duration is 400ms, easing `ease-in-out`. Height transitions from `0` to `var(--modal-max-height, 765px)` on desktop.
- [ ] The modal has `border-radius: 15px 15px 0 0` (top corners rounded only).
- [ ] A semi-transparent overlay (`rgba(30,30,30,0.5)`) covers the page behind the modal, fading in with `0.3s ease-in-out` opacity transition.
- [ ] The modal is appended to `document.body` to avoid being clipped by ancestor `overflow: hidden`.
- [ ] On mobile (< 768px), the modal height is 85vh.
- [ ] Pressing the Escape key closes the modal (height → 0, opacity → 0, then DOM removed).
- [ ] Clicking the overlay closes the modal.
- [ ] Clicking the close button (X on desktop, chevron-down ↓ on mobile) closes the modal.
- [ ] Focus is trapped inside the modal when open (Tab key cycles within modal elements).

---

### Story 3: Modal Category Tabs

**As a** shopper
**I want** to see a row of step tabs at the top of the modal
**So that** I can understand my progress and jump to any step at any time

**Acceptance Criteria:**
- [ ] Given a bundle with N steps (excluding default steps), the modal header shows N horizontal tabs.
- [ ] Given the active tab, it renders with: brand primary color background, white text, `border-radius: 8px`, `padding: 10px 30px`, `font-size: 14px`, `font-weight: 700`.
- [ ] Given an inactive tab, it renders with: white background, `1px solid` brand primary color border, brand primary text color.
- [ ] Given the number of tabs exceeds the modal header width, the tab row is horizontally scrollable (no overflow clipping, `overflow-x: auto`, no visible scrollbar on mobile).
- [ ] Given a completed step tab (user has met the step's condition), the tab shows a checkmark icon (✓) prefix or suffix.
- [ ] Clicking any tab navigates to that step's product grid (re-renders products for that step).
- [ ] Default product steps are NOT shown as tabs.

---

### Story 4: Product Grid Inside Modal

**As a** shopper
**I want** to see a grid of selectable products when a category tab is active
**So that** I can browse and select the product I want for that step

**Acceptance Criteria:**
- [ ] Given a step tab is active, the modal body shows the step's products in a grid: 5 columns on desktop (≥ 1024px), 3 columns on tablet (768–1023px), 2 columns on mobile (< 768px).
- [ ] Given products are loading, the modal body shows N skeleton card placeholders (matching the grid layout) with a pulsing shimmer animation.
- [ ] Given a product card is unselected, it has a light border, normal opacity.
- [ ] Given a product card is selected (user clicked it), it shows: dark/black `2px solid` border, elevated `box-shadow`, and a checkmark icon overlay in the top-right corner of the image.
- [ ] Given a product has variants, the card shows a variant dropdown selector.
- [ ] Given a product is clicked, the selection is recorded for that step. If the step now meets its quantity condition, trigger auto-step progression (Story 5).
- [ ] Given a product is clicked when it is already selected (and the step allows deselection), it is deselected.

---

### Story 5: Auto-Step Progression

**As a** shopper
**I want** the modal to automatically advance to the next step after I complete a selection
**So that** I don't have to manually navigate between steps and the bundle completion feels effortless

**Acceptance Criteria:**
- [ ] Given the active step's quantity condition is met immediately after a product selection, the modal automatically switches to the next incomplete step tab within 300ms (no manual click required).
- [ ] Given all steps are complete after a product selection, the modal automatically closes within 500ms.
- [ ] Given there is no next incomplete step (all are filled), auto-progression closes the modal.
- [ ] Given the user manually clicks a different tab, auto-progression does not override the manual selection.
- [ ] Given the user deselects a product from a previously-complete step via the inline card's × button, the step reverts to incomplete state but the modal does NOT re-open automatically.

---

### Story 6: Default / Pre-Selected Product Step

**As a** merchant
**I want** to configure a step with a mandatory pre-selected product
**So that** every bundle built includes that product automatically (e.g., a branded bag)

**Acceptance Criteria:**
- [ ] Given a step is configured with `isDefault: true` and a `defaultVariantId`, the inline widget shows that step as a pre-filled card from page load.
- [ ] Given a default step, the filled card has NO × remove button.
- [ ] Given a default step, it does NOT appear as a tab in the modal.
- [ ] Given a default step, it counts toward bundle completion automatically (it is always considered "complete").
- [ ] Given an existing bundle with no `isDefault` field on any step, behavior is unchanged (backward-compatible).

---

### Story 7: Discount Badge on Inline Filled Cards

**As a** shopper
**I want** to see a "FREE" or "N% off" badge on gift or discounted step cards
**So that** I understand the value I'm getting in the bundle

**Acceptance Criteria:**
- [ ] Given a step has `discountBadgeLabel` set (e.g., "FREE" or "20% off"), when the inline card for that step is filled, a badge pill is shown overlaid at the bottom-left of the card image.
- [ ] Badge style: `background: rgba(30,30,30,0.9)`, white text, pill shape (`border-radius: 20px`, `padding: 4px 10px`, `font-size: 12px`, `font-weight: 700`).
- [ ] Given a step has no `discountBadgeLabel`, no badge is shown.
- [ ] Badge color is overridable via DCP control: "Discount badge background" + "Discount badge text color".

---

### Story 8: Add Bundle to Cart Button

**As a** shopper
**I want** the "Add Bundle to Cart" button to clearly show me whether I've completed all selections
**So that** I know when I can proceed and understand the price I'll pay

**Acceptance Criteria:**
- [ ] Given one or more steps are incomplete, the button is disabled: gray background (`#ccc`), `cursor: not-allowed`.
- [ ] Given all steps are complete, the button is enabled: brand primary color background, `box-shadow: 0 4px 15px rgba(0,122,255,0.4)`, `cursor: pointer`.
- [ ] Given the bundle has a discount, the button shows: (a) discounted price, (b) strikethrough original total, (c) a colored pill badge with "N% OFF" or discount label.
- [ ] Given the button is clicked while bundle is complete, it adds all component items to cart and shows a success toast.
- [ ] Toast content: "Bundle added to cart! 🎉" with `rgba(30,30,30,0.9)` background, white text, auto-dismiss after 2.5s.

---

### Story 9: DCP Controls for New Settings

**As a** merchant
**I want** to customise the new bottom-sheet widget's appearance from the Design Control Panel
**So that** the widget matches my store's brand without writing any CSS

**Acceptance Criteria:**
- [ ] DCP has a "Widget Style" toggle: "Classic (Accordion)" | "Bottom-Sheet (New)" — defaults to "Bottom-Sheet" for new bundles.
- [ ] When "Bottom-Sheet" is selected, DCP shows additional settings:
  - **Modal border radius** (range: 0–30px, default 15px)
  - **Modal overlay opacity** (range: 0–0.8, default 0.5)
  - **Modal animation duration** (range: 200–600ms, default 400ms)
  - **Empty slot border style** (toggle: Dashed / Solid, default Dashed)
  - **Empty slot border color** (color picker, default = brand primary)
  - **Discount badge background color** (color picker, default `rgba(30,30,30,0.9)`)
  - **Discount badge text color** (color picker, default white)
- [ ] DCP preview panel shows the inline widget in "empty state" (all slots dashed) and "partially filled state" (some slots filled, some dashed).
- [ ] DCP preview panel shows the bottom-sheet modal in open state (tabs + product grid) with the configured styles applied.
- [ ] All DCP settings are persisted in the `designSettings` object and saved as CSS variables via the `PreviewScope` / widget CSS injection pipeline.

---

## UI/UX Specifications

### Inline Widget Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Slot: T-Shirt]   [Slot: Pants]   [Slot: Cap (Free)]   │
│  (dashed border)  (filled card)    (filled + badge)      │
│                                                          │
│  [Add Bundle to Cart  $89.00  ~~$120.00~~  25% OFF]      │
└─────────────────────────────────────────────────────────┘
```

- Slot card dimensions: min-width 120px, height auto (maintains aspect ratio via image)
- Row: horizontal flex, `gap: 16px`, `overflow-x: auto` on mobile if slots overflow

### Bottom-Sheet Modal Layout

```
┌─────────────────────────────────────────────────────────┐  ← border-radius top 15px
│  [T-Shirt ✓] [Pants] [Cap]                          [X] │  ← tabs + close
│  ─────────────────────────────────────────────────────  │
│  [Prod] [Prod] [Prod] [Prod] [Prod]                     │  ← 5-col grid
│  [Prod] [Prod] [Prod] [Prod] [Prod]                     │
│  [Prod] [Prod]                                          │
└─────────────────────────────────────────────────────────┘  ← anchored to bottom: 0
[  Overlay rgba(30,30,30,0.5)  ]
```

### Empty Slot Card
- Width: ~131px (or 1fr in grid)
- Border: `2px dashed var(--bundle-primary-color, #007AFF)`
- Border radius: `12px`
- Image: step's category representative (first product image or step thumbnail)
- Label: step name, centered, 12px, gray `#666`
- Cursor: pointer

### Filled Inline Card (non-default)
- Border: `2px solid var(--bundle-primary-color, #007AFF)`
- Border radius: `10px`
- Remove button: 20×20px circular, top-right, `×` icon, `background: rgba(0,0,0,0.5)`, white text
- Discount badge: bottom-left, pill `border-radius: 20px`, 12px bold white text on dark bg

---

## Data Persistence

### New fields in `bundle_ui_config` JSON metafield (ProductVariant)

```typescript
interface BundleUiConfig {
  // Existing fields (unchanged)
  bundleId: string;
  steps: StepConfig[];
  discount: DiscountConfig;
  messaging: MessagingConfig;

  // NEW optional fields
  widgetStyle?: 'classic' | 'bottom-sheet';  // default: 'bottom-sheet'
  modal?: {
    borderRadius?: number;    // default: 15 (px)
    overlayOpacity?: number;  // default: 0.5
    animationDuration?: number; // default: 400 (ms)
  };
  emptySlot?: {
    borderStyle?: 'dashed' | 'solid';  // default: 'dashed'
    borderColor?: string;               // default: primary color
  };
  discountBadge?: {
    bgColor?: string;    // default: 'rgba(30,30,30,0.9)'
    textColor?: string;  // default: '#ffffff'
  };
}

interface StepConfig {
  // Existing fields (unchanged)
  id: string;
  name: string;
  conditionOperator: string;
  conditionValue: number;
  products: ProductRef[];

  // NEW optional fields
  isDefault?: boolean;         // default: false
  defaultVariantId?: string;   // required if isDefault: true
  discountBadgeLabel?: string; // e.g., "FREE", "20% off" — if set, badge shown on filled card
  categoryImageUrl?: string;   // image shown in empty slot card (fallback: first product image)
}
```

### Where saved
- `bundle_ui_config` metafield on the ProductVariant (`$app` namespace, `PUBLIC_READ`)
- New `widgetStyle`, `modal`, `emptySlot`, `discountBadge` fields at root of config
- New `isDefault`, `defaultVariantId`, `discountBadgeLabel`, `categoryImageUrl` fields per step
- **No Prisma DB migration needed** — all new fields are stored in the JSON metafield

### DCP design settings
- Stored in `designSettings` Redux/state object (existing pattern)
- Serialized into `bundle_ui_config` when merchant saves the bundle

---

## Backward Compatibility Requirements

1. **Existing merchants:** If `widgetStyle` is absent in `bundle_ui_config`, widget defaults to `'bottom-sheet'` for new renders. No: existing merchants see a changed widget. To avoid this: default to `'classic'` if `widgetStyle` is absent — only show `'bottom-sheet'` when explicitly set.

   **Decision:** Default to `'classic'` when `widgetStyle` is absent (safe for existing merchants). New bundles created after this feature ships default to `'bottom-sheet'`.

2. **Step isDefault field absent:** Widget treats step as a normal selectable step — no behavior change.

3. **discountBadgeLabel absent:** No badge shown — widget renders exactly as today.

4. **modal/emptySlot/discountBadge config absent:** Widget uses hardcoded defaults (15px radius, 0.5 opacity, dashed border, dark badge bg).

---

## Out of Scope (Explicit)

- Full-page bundle widget (separate widget, already addressed in beco-design-alignment-1)
- Cart Transform pricing logic — unchanged
- Checkout UI extension — unchanged
- Spring-physics toast animation (defer to future polish sprint)
- Shopify admin UI for configuring `isDefault` / `defaultVariantId` per step (merchant must set via DCP — the isDefault data is surfaced in DCP step settings)
- Storefront search inside modal (already exists for full-page; scoped out here)
- Multi-language labels on badge (i18n already handled by discount messaging i18n feature)
- Video product media in modal cards
