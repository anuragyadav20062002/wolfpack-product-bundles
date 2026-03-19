# Product Owner Requirements: PDP Bundle Redesign

**Feature ID:** pdp-bundle-redesign
**Status:** PO Complete
**Created:** 2026-03-18

---

## User Stories with Acceptance Criteria

---

### Story 1: Empty-State Slot Cards Match Reference Design

**As a** customer on a product bundle page
**I want** each empty selection slot to clearly show a visual placeholder with the step name
**So that** I understand what I need to pick for each bundle slot

**Acceptance Criteria:**
- [ ] Each unfilled step renders a card that is `200px` tall with `border-radius: 10px`
- [ ] Empty card border is `2px dashed` using `--bundle-empty-state-card-border` CSS variable (default: `#1e3a8a` navy)
- [ ] Card has a centered SVG icon placeholder (generic "plus-in-circle" or step icon) with circular background
- [ ] Step name (e.g., "First Toy", "Tshirt") appears below the icon in the primary theme color
- [ ] Hovering the card lifts it slightly (`translateY(-2px)`) with a subtle box-shadow
- [ ] Clicking anywhere on the empty card opens the product selection modal at the correct step

---

### Story 2: Filled Product Slot Cards

**As a** customer
**I want** selected products to appear in their slot with an image and name
**So that** I can review my bundle choices before adding to cart

**Acceptance Criteria:**
- [ ] Filled slot shows the product image (object-fit: cover) at full card width, with `border-radius: 10px` on image
- [ ] Product title renders below image in the primary theme color, truncated with ellipsis if long
- [ ] Card border changes to `2px solid --bundle-empty-state-card-border` (blue) when filled
- [ ] A remove (×) icon appears in the top-right corner of the filled card
- [ ] Clicking the remove icon clears the selection and reverts the card to empty state
- [ ] Clicking the product image area re-opens the modal for that step to change selection

---

### Story 3: Default / Compulsory Product Slot

**As a** merchant
**I want** compulsory products (e.g., a Gift Box always included in every order) to appear pre-filled in the widget
**So that** customers know the item is always included without needing to select it

**Acceptance Criteria:**
- [ ] Steps where `isDefault: true` render as filled cards on initial load using `defaultVariantId`
- [ ] The default product image and title are shown exactly like a filled card
- [ ] The remove (×) icon is NOT shown — customer cannot remove the default product
- [ ] An "Included" badge or lock icon appears on the card to communicate it's always included
- [ ] Default product is NOT counted towards the bundle unlock/progress condition
- [ ] Default product is automatically added to cart when "Add Bundle to Cart" is clicked

---

### Story 4: Free Gift Slot Card

**As a** customer
**I want** the free gift slot to be visually distinct with a gift ribbon icon
**So that** I know which item I get for free and feel excited about the offer

**Acceptance Criteria:**
- [ ] Steps where `isFreeGift: true` render a slot card with a dashed border in the primary color
- [ ] A red ribbon/gift SVG icon (🎀) appears overlaid in the top-right corner of the slot card
- [ ] The label shows "Free [stepName]" (e.g., "Free Cap") in the primary color
- [ ] The card is NOT clickable when the free gift is not yet unlocked (paid steps incomplete)
- [ ] When paid steps are all complete, the free gift slot becomes clickable and the customer can choose their free item
- [ ] If the free gift step has only 1 variant, it auto-selects without opening the modal

---

### Story 5: Bottom-Sheet Modal — Step Tabs

**As a** customer
**I want** the product selection modal to show clear step navigation tabs
**So that** I can see all steps and switch between them easily

**Acceptance Criteria:**
- [ ] Modal slides up from bottom with `border-radius: 15px 15px 0 0`
- [ ] Background is `rgb(244,249,249)` (light teal), configurable via DCP
- [ ] Dark overlay (`rgba(30,30,30,0.5)`) covers the page behind modal
- [ ] Step tabs are pill-shaped buttons: inactive = outlined (border + text in primary color, white bg), active = solid fill (primary color bg, white text)
- [ ] Only non-free-gift steps appear as pill tabs; free gift step tab uses dark navy (`#1e3a8a`) with `border-radius: 8px` styling
- [ ] Discount progress text ("Add N more product(s) to get bundle at $X") shows below tabs in gray (#444), `fontSize:16px`
- [ ] Close (×) button in top-right closes the modal without saving
- [ ] Clicking outside the modal (on the overlay) closes it

---

### Story 6: Bottom-Sheet Modal — Product Grid

**As a** customer
**I want** to browse and select products in a clear grid layout
**So that** I can quickly find and add what I want to my bundle

**Acceptance Criteria:**
- [ ] Products render in a 4-column grid on desktop (≥768px), 2-column on mobile (<768px)
- [ ] Each product card: white bg, `border: 2px solid rgb(255,202,67)` (gold/yellow), `border-radius: 16px`, `padding: 12px`
- [ ] Product image fills the top of the card with `border-radius: 12px`
- [ ] Product title in primary color, `fontSize: 16px`, `fontWeight: 700`
- [ ] "Add to Cart" button: full-width, pill shape (`border-radius: 40px`), primary color bg, white text
- [ ] Clicking "Add to Cart" selects the product, closes/advances the modal, and updates the slot card
- [ ] Products already selected show a "Selected ✓" state on their card
- [ ] Modal scrolls vertically to show all products; the floating footer is fixed at the bottom
- [ ] **Free gift modal:** product cards use `border: 1px solid rgb(227,227,227)` (gray) — NOT gold — and `border-radius: 12px`
- [ ] **Free gift modal:** header shows promo heading "Get a [name] worth $[price] absolutely free!" in bold (`fontSize: 20px`, `fontWeight: 700`)
- [ ] **Free gift modal:** sub-heading "Add N product(s) to get 1 of them at 100% off!" below promo heading

---

### Story 7: Bottom-Sheet Modal — Floating Footer Navigation

**As a** customer
**I want** clear Prev/Next navigation and a cart count indicator while selecting products
**So that** I know how many items I've added and can navigate steps easily

**Acceptance Criteria:**
- [ ] A floating pill (`bg: rgba(30,30,30,0.8)`, `border-radius: 15px`, `width: 300px`, `height: 80px`) is fixed at the bottom of the modal
- [ ] Pill contains: "Prev" button (white bg, `border-radius: 10px`) | cart count + icon (white pill) | "Next" button (white bg)
- [ ] "Prev" is disabled/hidden on the first step
- [ ] "Next" is disabled/hidden on the last step and replaced by "Done" button
- [ ] Cart count shows total items selected across all steps
- [ ] Clicking "Next" advances to the next incomplete step tab
- [ ] Clicking "Done" closes the modal

---

### Story 8: Add Bundle to Cart Button

**As a** customer
**I want** the Add Bundle to Cart button to be clearly enabled or disabled
**So that** I know when my bundle is ready to purchase

**Acceptance Criteria:**
- [ ] Button is full-width, pill shape (`border-radius: 40px`), `padding: 14px 10px`
- [ ] When bundle is incomplete (not all required steps filled): button is grayed out (`opacity: 0.5`), cursor: not-allowed, non-clickable
- [ ] When bundle is complete: button uses DCP primary color and is clickable
- [ ] Clicking adds all selected bundle products to cart via Shopify `/cart/add.js`
- [ ] On success: shows a success toast and optionally redirects to cart

---

### Story 9: Automated Theme Template Installation

**As a** merchant configuring a PDP bundle
**I want** the product bundle template to be installed automatically
**So that** I don't need to manually navigate the Shopify Theme Editor

**Acceptance Criteria:**
- [ ] The configure page shows an "Add to Storefront" button
- [ ] Clicking it calls `POST /api/install-pdp-widget` which calls `ensureProductBundleTemplate()`
- [ ] On success: toast "Widget installed! Your bundle product page is live." + link to view the product
- [ ] On failure: toast "Couldn't auto-install — opening Theme Editor instead." + opens Theme Editor at the product URL
- [ ] The call is idempotent — clicking multiple times is safe
- [ ] Loading state shown on button during API call ("Installing…", button disabled)
- [ ] The product page template is `product.product-page-bundle.json` in the active theme

---

### Story 10: DCP Settings Drive All Visuals

**As a** merchant
**I want** to customize every visual aspect of my bundle widget from the Design Control Panel
**So that** it matches my store's branding perfectly

**Acceptance Criteria:**
- [ ] Slot card border color/style driven by DCP (`--bundle-empty-state-card-border`, `--bundle-empty-slot-border-style`)
- [ ] Product card border radius driven by DCP (`--bundle-product-card-border-radius`)
- [ ] Modal background color driven by DCP (`--bundle-bs-panel-bg`)
- [ ] Primary button color drives tab active color, "Add to Cart" color, "Add Bundle to Cart" color
- [ ] Product title color in modal driven by DCP (`--bundle-product-title-color`)
- [ ] All existing 259 DCP settings must produce visible changes when modified
- [ ] No hardcoded color values in widget JS (all colors via CSS custom properties)

---

## UI/UX Specifications

### Slot Card Grid Layout
- Container: CSS grid, `grid-template-columns: repeat(N, 1fr)` where N = step count (max 4)
- Card width: auto (fills column), height: 200px
- Gap between cards: `12px` (configurable via DCP)
- Below cards: full-width "Add Bundle to Cart" button with `margin-top: 16px`

### Empty Slot Card
```
┌─────────────────┐
│                 │
│    ⊕ (icon)     │  ← 80×80px circular bg, centered
│                 │
│   "First Toy"   │  ← step name, blue, 14px, centered
│                 │
└─────────────────┘
border: 2px dashed #1e3a8a
border-radius: 10px
height: 200px
```

### Filled Slot Card
```
┌─────────────────┐  ← border: 2px solid #1e3a8a
│ [product image] │  ← object-fit: cover, top portion
│─────────────────│
│ Product Title   │  ← blue, truncated, 13px
└─────────────────┘
Top-right: × remove button (small, 20×20px)
```

### Default Slot Card
Same as filled but:
- No × remove button
- Small "Included" lock badge bottom-left

### Free Gift Slot Card
Same as empty but:
- Top-right corner: ribbon SVG (red, 24×24px)
- Label: "Free [name]"
- Locked state: reduced opacity (0.6), cursor: default

### Product Selection Modal
```
┌────────────────────────────────────────────────┐
│  [First Toy] [Second Toy] [Greeting Card]   [×] │  ← tabs + close
│  Add 2 product(s) to get bundle at $38.99       │  ← discount text
├────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│  │image │ │image │ │image │ │image │           │
│  │      │ │      │ │      │ │      │           │
│  │ Name │ │ Name │ │ Name │ │ Name │           │
│  │[Add] │ │[Add] │ │[Add] │ │[Add] │           │
│  └──────┘ └──────┘ └──────┘ └──────┘           │
│           (scrollable)                          │
│                                                 │
│         ┌─────────────────────┐                 │
│         │ [Prev] 🛒 2 [Next]  │  ← floating    │
│         └─────────────────────┘                 │
└────────────────────────────────────────────────┘
bg: rgb(244,249,249)
border-radius: 15px 15px 0 0
```

### Configure Page — Add to Storefront Section
- Section titled "Add to Storefront"
- Body text: "Install the bundle widget on your product page automatically — no Theme Editor needed."
- Button: "Add to Storefront" (Polaris primary)
- Loading state: "Installing…" + spinner
- Success state: "Installed ✓" + link to view product page

---

## Data Persistence

- No schema changes — `isFreeGift`, `isDefault`, `defaultVariantId` already in Prisma schema
- Theme template written once to Shopify theme via REST API (idempotent)
- DCP settings already persisted in `DesignSettings` table

---

## Backward Compatibility Requirements

- Existing PDP bundles (no `isFreeGift`, no `isDefault` steps) must continue rendering correctly
- The new visual design must be purely additive — no data migrations
- Widget version bump required (semantic: MINOR, new storefront feature)
- `bundle-widget-product-page-bundled.js` must be rebuilt after JS changes

---

## Out of Scope (Explicit)

- Changes to FPB (full-page bundle) widget
- New DCP settings (only wire existing 259 to HTML elements)
- Admin configure route visual redesign (only add the "Add to Storefront" section)
- Cart transform logic changes
- Shopify deploy (manual by merchant)
- A/B testing or feature flags
