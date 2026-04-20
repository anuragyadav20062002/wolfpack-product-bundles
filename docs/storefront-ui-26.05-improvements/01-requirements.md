# Requirements: Storefront UI — Competitive Polish (26.05)

## Context
A live competitor analysis of EB | Easy Bundle Builder (Skai Lama / GBB) was conducted on 2026-04-20
using Chrome DevTools MCP across their storefront and admin. The full gap report lives at
`docs/competitor-analysis/gbb-gap-analysis-2026-04-20.md`.

**Key finding after codebase audit:** Most headline gaps (step timeline, compare-at price, inline
quantity selector, category/collection tabs, sidebar layout, PDP slot cards with empty/filled states)
are **already implemented** in the widget source. The true gaps are:

1. **Product card visual quality** — card layout is cluttered (full-width button + separate qty row).
   Competitor uses a compact floating "+" that transforms into an inline −/count/+ on the card itself.
2. **Discount progress message** — only shows in the floating footer bar; competitor displays it
   prominently as a full-width banner between the step header and the product grid.
3. **Floating dismissible promo badge** — competitor has a corner widget "Get 10% Off Your Order!!"
   with an ✕ dismiss. We have no equivalent.
4. **Sidebar upsell slot** — competitor's bundle sidebar shows a gamified "Add 1 more product to get
   a Free Greeting Card" message. Our sidebar panel has no upsell slot.
5. **Step timeline gap calculation** — `--bundle-step-timeline-gap: 308px` is hardcoded, looks
   broken on narrow viewports; should be CSS-driven with a connecting line pseudo-element instead.

Admin UI is **explicitly out of scope** for this feature unless a storefront feature requires
a new DCP control.

## Audit / Prior Research Reference
- `docs/competitor-analysis/gbb-gap-analysis-2026-04-20.md` — full gap analysis
- `docs/competitor-analysis/findings.md` — prior March 2026 analysis (PDP bottom sheet)
- Screenshots: `docs/app-nav-map/screenshots/competitor-gbb-*.png`

---

## Functional Requirements

### FR-01 — Product Card: Compact Add Button + Inline Quantity
The FPB product card should use a compact circular/square add button instead of a full-width button.
When a product is added, that button transforms into an inline −/count/+ quantity control directly
on the card, removing the separate qty row below the title.

- **Variant products** (multi-variant): clicking the compact button still opens the variant
  selection modal. The "Choose Options" label remains but the button is compact.
- The current large qty row (`product-quantity-selector`) is hidden; the inline qty control
  (`inline-qty-btn`) sits inside the card image area (bottom-right corner overlay or below image).
- Zero-quantity cards show only the compact "+" button.

### FR-02 — Inline Discount Progress Banner (Above Product Grid)
A full-width banner should appear between the step header and the product grid when a discount
tier is configured. It shows the remaining-items message (e.g., "Add 2 more to get 10% off!").
The banner updates in real-time as items are added. When the threshold is reached it switches to
a "Congratulations" message styled in the primary color.

- Banner is only shown when the bundle has at least one tiered discount rule.
- Banner respects `--bundle-primary-color` and `--bundle-text-color` CSS variables.
- Banner is NOT a duplicate of the footer messaging — the footer keeps its existing display.

### FR-03 — Floating Dismissible Promo Badge (FPB only)
A small floating badge anchored to the bottom-left corner of the FPB page. Shows configurable
promo text (e.g., "Get 10% Off Your Order!!"). Has an ✕ dismiss button; once dismissed it stays
hidden for the session (localStorage key).

- DCP control: On/Off toggle + text input (max 60 chars).
- Default: Off (not shown unless merchant enables it).
- Badge inherits `--bundle-primary-color` as background.
- Does NOT appear in the PDP widget.

### FR-04 — Sidebar Upsell Slot
When the FPB is in sidebar layout (`footer_side`), the sidebar panel gains an upsell section below
the item list. It shows the next discount tier target message (same logic as FR-02). When no
discount tier is configured, the section is hidden.

- Upsell slot is inside the existing sidebar panel, below the items list, above the total row.
- Reads the same discount tier data already available to the widget.

### FR-05 — Step Timeline: CSS-Driven Connecting Line
Replace the hardcoded `gap: 308px` approach with a CSS `::after` pseudo-element on each
`.timeline-step` (except the last) that draws the connecting line. This makes the line
responsive at all viewport widths without JS or hardcoded pixel values.

- The connecting line fills (changes to `--bundle-step-timeline-line-completed` color) when
  the step is completed.
- The fix is CSS-only in `bundle-widget-full-page.css`. No JS change required.
- Must be tested at 320px, 768px, and 1280px widths.

---

## Out of Scope
- Admin UI changes (DCP new sections) unless strictly required by FR-03's toggle
- PDP widget changes (the PDP already has visual slot cards with empty/filled states)
- AI bundle creation, layout picker, Typography/Corners/Font controls
- Subscription bundles, Gift Box Bundles, Multi-language
- Any backwards-compatibility shims for old bundle data

---

## Acceptance Criteria

### FR-01
- [ ] FPB product card shows a compact add button (≤40×40px target area) instead of full-width "Add to Bundle"
- [ ] When quantity > 0, the button transforms to an inline −/count/+ control on the card
- [ ] The separate `product-quantity-selector` row is removed from the card layout
- [ ] Multi-variant products still open the variant modal on compact button click
- [ ] Cards look correct at 320px (1-col), 640px (2-col), 1024px (4-col) widths

### FR-02
- [ ] Discount banner appears above the product grid when discount tiers are configured
- [ ] Banner message matches the remaining-items logic (same as footer)
- [ ] Banner updates in real-time as items are added/removed
- [ ] Banner shows "Congratulations" state when threshold is reached
- [ ] Banner is hidden when no discount rule exists
- [ ] No duplicate banner shown in both grid area and footer

### FR-03
- [ ] Floating badge is hidden by default; only shown when DCP toggle is On
- [ ] Badge text is configurable in DCP (max 60 chars)
- [ ] Badge renders in bottom-left corner with ✕ dismiss button
- [ ] Dismiss persists for the session (localStorage)
- [ ] Badge does not appear in PDP widget

### FR-04
- [ ] Sidebar upsell slot appears below item list in sidebar layout
- [ ] Shows correct remaining-items message from discount tier config
- [ ] Hidden when no discount tier is configured

### FR-05
- [ ] Connecting line between timeline steps is drawn via CSS `::after` pseudo-element
- [ ] `gap: 308px` is removed from `.step-timeline`
- [ ] Line fills correctly on step completion at all tested widths

---

## UI/UX Spec

### FR-01 Product Card Layout (after change)
```
┌────────────────────────┐
│  [Product Image]       │
│                    [+] │  ← compact circular button (bottom-right overlay)
│                        │    OR when qty > 0: [−] 1 [+]
├────────────────────────┤
│  Product Title         │
│  ~~$29.99~~ $24.99     │  ← compare-at (already works) + sale price
│  [Choose Options ▾]    │  ← variant selector (if multi-variant)
└────────────────────────┘
```
The compact button style: 36×36px circle, `--bundle-primary-color` background, white "+" text.
When active (qty > 0): inline row `[−] {n} [+]` same size, no separate qty row below.

### FR-02 Discount Banner
```
┌─────────────────────────────────────────────────────┐
│  🏷  Add 2 more items to unlock 10% off your bundle  │
└─────────────────────────────────────────────────────┘
```
Full-width, `background: var(--bundle-secondary-bg, #f5f5f5)`, left-aligned icon + text,
`border-radius: 8px`, `padding: 10px 16px`, `margin-bottom: 12px`.

### FR-03 Floating Badge
```
╔═══════════════════════╗  ← fixed bottom-left, z-index: 100
║ Get 10% Off Your Order ✕║
╚═══════════════════════╝
```
`position: fixed; bottom: 80px; left: 16px;` (above bottom bar).
Background: `--bundle-primary-color`. Text: white. Border-radius: 24px. Padding: 10px 16px.

---

## Data Changes
- **FR-03**: New DCP field `floatingBadgeEnabled: boolean` + `floatingBadgeText: string` on the bundle settings model. Requires Prisma migration + DCP UI addition.
- All other FRs: CSS/JS changes only — no data model changes.

---

## Risks

| Risk | Mitigation |
|------|-----------|
| FR-01 compact button may break the variant modal trigger | Keep existing `data-product-id` and click handler — only change button markup/style |
| FR-05 CSS pseudo-element approach may conflict with existing `position: relative` on `.timeline-step` | Test across all step counts (1, 2, 5 steps) and layout modes before merging |
| FR-03 DCP field addition requires Prisma migration | Use `String? @default("")` + `Boolean @default(false)` — safe migration, no existing data affected |
| Inline qty overlay (FR-01) may be hidden by card overflow:hidden | Set `overflow: visible` on `.product-card` or adjust z-index |
