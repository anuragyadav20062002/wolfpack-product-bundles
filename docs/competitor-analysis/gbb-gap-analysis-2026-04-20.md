# Competitor Gap Analysis — EB | Easy Bundle Builder vs Wolfpack
**Date:** 2026-04-20
**Analyst:** Claude Code (via Chrome DevTools MCP)
**Scope:** Storefront UI (FPB + PDP widgets) + Admin UI flows

---

## Sources Examined

| Page | URL | What it shows |
|------|-----|---------------|
| Competitor BYOB #1 | vicodeo.com/apps/gbb/builder/1 | Classic full-page BYOB storefront |
| Competitor BYOB #2 | skailama-demo.myshopify.com/apps/gbb/easybundle/39 | Split-pane BYOB with live sidebar |
| Competitor BYOB #3 | infusedenergy.shop/apps/gbb/easybundle/19 | Dark-themed BYOB with category tabs |
| Competitor PDP | skailama-demo.myshopify.com/products/swag-create-your-look-new | PDP bundle widget |
| Competitor Admin | admin.shopify.com/store/wolfpack-store-test-1/apps/gift-box-builder-1 | Full admin UI flow |
| Our FPB | yash-wolfpack.myshopify.com/pages/fp-6th | Our full-page bundle widget |

Screenshots saved to: `docs/app-nav-map/screenshots/competitor-gbb-*.png`

---

## Competitor Feature Catalog

### Storefront — BYOB / FPB Layout Variants
The competitor offers **4 layout types** (selected during bundle creation):
1. **Classic** — Dedicated bundle page, vertical product list
2. **Horizontal** — Dedicated bundle page, horizontal/split layout
3. **Product List** — On a product page (our PDP equivalent)
4. **Horizontal Slots** — On a product page with horizontal slot cards

We currently support: FPB (full page) and PDP. We offer 0 layout variants within each type.

---

## Section 1: FPB (Full-Page Bundle) — Storefront Gaps

### GAP 1.1 — No Hero/Banner Section
**Priority: HIGH | Effort: LOW**

**Competitor:** Every BYOB page has a full-width hero banner at the top with a branded headline, background image/color, and product imagery. Examples:
- "GIFT THE SAVOR, SHARE THE JOY" (Vicodeo — dark food imagery)
- "CREATE YOUR BOX OF JOY!" (Skailama — yellow/gold, toy images)

**Ours:** Title text + a small green discount pill. No visual impact.

**Fix:** Our promo banner feature (DCP-controlled) already exists. Ensure it renders prominently at the top of FPB with background image support, overlay text, and good typography defaults.

---

### GAP 1.2 — Weak Step Progress Indicator
**Priority: HIGH | Effort: LOW–MEDIUM**

**Competitor:**
- Step indicators have a circular icon (product-category image or emoji) per step
- Steps are connected by a progress line that fills as steps are completed
- Step label appears below each icon (e.g., "Toys", "Free Greeting Card")
- Active step is visually distinct (filled/colored icon)

**Ours:** A single dark pill "Step 1 | 0 selected". No icon, no connecting line, no visual completion state. When there are multiple steps, they appear as pills without any connecting progress visualization.

**Fix:** Redesign the step timeline UI:
- Circular icon per step (use the step banner image or a fallback icon)
- Animated connecting line between steps (fills on completion)
- Step label below
- Active vs completed vs upcoming states clearly distinguished

---

### GAP 1.3 — No Live Bundle Sidebar
**Priority: HIGH | Effort: HIGH**

**Competitor (Skailama BYOB):** The right half of the page is a persistent "Your Bundle" sidebar showing:
- "X item(s)" count
- Each added product: thumbnail + name + price + quantity (x1)
- "Clear" button to reset
- Upsell slot: "Add 1 more product(s) to get a Free Greeting Card"
- Running total
- "Next" CTA

**Ours:** The only bundle summary is in the floating bottom bar ("X Products / Total ₹0.00 / Add to Cart"). Users have no persistent visibility of what they've added.

**Fix:** Add an optional sidebar layout mode for FPB where the right panel shows the live bundle summary. This is a new layout variant (like our existing sidebar layout), but ensuring the bundle sidebar is feature-complete.

---

### GAP 1.4 — Product Cards: No Compare-at / Strikethrough Price
**Priority: MEDIUM | Effort: LOW**

**Competitor:** When a product has a compare-at price, it shows:
```
~~$29.99~~
$24.99
```
Original price struck through, sale price below in accent color.

**Ours:** We only show a single price. Products with discounts don't visually communicate the saving to shoppers.

**Fix:** Read `compareAtPrice` from product data and render it struck through above the price when present.

---

### GAP 1.5 — Product Card Add Button: UX Polish
**Priority: MEDIUM | Effort: LOW**

**Competitor:** Uses a small circular "+" button on each product card (bottom-right corner). Clean, unobtrusive, familiar e-commerce pattern. When a product is added, the "+" becomes a quantity control (- / count / +).

**Ours:** Full-width solid black "Add to Bundle" button that dominates the card. No inline quantity control — requires removing and re-adding from the footer.

**Fix:** Offer an inline quantity selector (+/- count) on the card when a product has been added. This already exists in some issue history (`full-page-competitive-design-2`) but verify it's fully working.

---

### GAP 1.6 — No Category/Tag Tab Filtering Within a Step
**Priority: MEDIUM | Effort: MEDIUM**

**Competitor (Infused Energy):** Within a step, products are organized into categories shown as tabs (e.g., "Infusion" / "Extrakte"). Clicking a tab filters the product grid instantly.

**Ours:** Only a search bar. No visual category tab navigation within a step.

**Fix:** Allow merchants to configure category groups within a step (similar to our existing tabs feature in FPB — verify current state and fill gaps in DCP control).

---

### GAP 1.7 — No Inline Gamification/Progress Message
**Priority: MEDIUM | Effort: LOW**

**Competitor (Vicodeo):** Persistent banner between product grid and navigation: "Add 3 product(s) to get 10% discount!" Updates dynamically as items are added.

**Ours:** Discount messaging exists in the footer bar, but not as a prominent inline banner above/within the product grid.

**Fix:** Add a sticky discount progress message between the step header and product grid that updates in real-time.

---

### GAP 1.8 — No Dismissible Floating Promo Badge
**Priority: LOW | Effort: LOW**

**Competitor:** A small floating corner widget "Get 10% Off Your Order!!" with an ✕ close button. Acts as a persistent CTA without blocking the flow.

**Ours:** None.

**Fix:** Optional floating badge (DCP-controlled, merchant can enable/disable, set text and appearance).

---

### GAP 1.9 — Bottom Bar: Visual Refinement
**Priority: LOW | Effort: LOW**

**Competitor:** Bottom bar clearly separates Back | Total | Next with appropriate visual weight. Total prominently shown. Branded color on primary button.

**Ours:** "0 Products / Total ₹0.00 / Add to Cart" — good structure but can be improved with better spacing, contrast, and primary color application.

---

## Section 2: PDP Widget — Storefront Gaps

### GAP 2.1 — Steps Not Shown as Visual Icon Cards
**Priority: HIGH | Effort: MEDIUM**

**Competitor (Skailama PDP):** Steps in the inline widget render as visual icon cards in a horizontal row:
```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ 👕 icon  │  │ 👖 icon  │  │ 🧢 icon  │
│  Tshirt  │  │  Pants   │  │ Free Cap │
└──────────┘  └──────────┘  └──────────┘
```
Each card has a dashed border (empty state) or solid border + product image (filled state).

**Ours:** Steps rendered as a more text-heavy, less visual layout. No empty-state step cards with dashed borders and category icons.

**Fix:** Implement visual icon step cards with empty/filled states in the PDP inline widget.

---

### GAP 2.2 — Filled Product Card: Missing Remove Button
**Priority: MEDIUM | Effort: LOW**

**Competitor:** When a step is filled, the card shows the selected product image + title + variant + an [X] remove button top-right.

**Ours:** Verify current remove mechanism in PDP widget — ensure it matches this pattern.

---

## Section 3: Admin UI Gaps (Informational — No Implementation Unless New Feature)

These gaps are noted for awareness. Per user direction, admin UI changes only happen if they introduce a new end-user feature.

| Gap | Priority | Notes |
|-----|----------|-------|
| AI bundle creation ("Describe it. We'll build it.") | Future | Major differentiator — NLP to pre-configure bundle wizard |
| Visual layout picker with preview images | Future | 4 layout options shown with branded preview cards |
| Design Control Panel: Typography control | Medium | Font family/size per element |
| Design Control Panel: Corners (border radius) | Low | Global border radius slider |
| Design Control Panel: Expert Color Controls | Medium | Per-element color overrides: General, Product Card, Bundle Cart, Upsell |
| Design Control Panel: "Preview Bundle" shortcut | Low | Quick access to storefront preview from DCP |
| Settings: Language/translation section | Future | All widget text labels configurable per language |
| Bundle creation: Choose Collections option | Medium | Our product picker may lack collection-level filtering |

---

## Section 4: Prioritized Implementation Roadmap

### Wave 1 — Visual Impact, Low Risk (Storefront Only)
1. Step progress indicator redesign (icons + connecting line + states)
2. Compare-at / strikethrough price on product cards
3. Inline discount progress message (above product grid)
4. Bottom bar visual refinement

### Wave 2 — Product Card UX
5. Inline quantity selector (+/-) on card after add
6. PDP step cards with visual icon + empty/filled states
7. PDP remove button on filled step cards

### Wave 3 — Layout & Navigation
8. Category tab filtering within steps (FPB)
9. Hero banner improvements (make more prominent and easier to configure)

### Wave 4 — Optional Engagement Features
10. Floating dismissible promo badge
11. Live bundle sidebar (new layout mode for FPB)

---

## Screenshots Index
| File | Content |
|------|---------|
| competitor-gbb-vicodeo-page1.png | BYOB Classic — product grid, bottom nav, floating badge |
| competitor-gbb-skailama-byob.png | BYOB Split-pane — full page with sidebar |
| competitor-gbb-skailama-byob-viewport.png | BYOB Split-pane — viewport, hero banner + sidebar visible |
| competitor-gbb-infusedenergy-byob.png | BYOB Dark theme — category tabs |
| competitor-gbb-skailama-pdp.png | PDP widget — visual step icon cards |
| our-fpb-widget.png | Our FPB widget — current state |
| competitor-admin-ai-create.png | Admin: AI bundle creation onboarding |
| competitor-admin-layout-picker.png | Admin: Layout picker with visual previews |
| competitor-admin-product-picker.png | Admin: Product selection wizard step |
| competitor-admin-product-modal.png | Admin: Product picker modal with search |
| competitor-admin-settings.png | Admin: Settings (Design / Language / Controls) |
| competitor-admin-design-panel.png | Admin: Design Control Panel with color pickers |
