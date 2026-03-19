# Product Owner Requirements: FPB Sidebar Panel Redesign + Free Gift + Default Product

## User Stories with Acceptance Criteria

---

### Story 1: Merchant configures a free gift step
**As a** merchant
**I want** to mark a bundle step as a "free gift" step with a display name
**So that** shoppers see a special locked/unlocked gift incentive in the sidebar

**Acceptance Criteria:**
- [ ] Given a bundle step configuration page, when the merchant toggles "Free Gift Step", a text field "Gift Name" appears (e.g., "cap", "greeting card")
- [ ] Given isFreeGift=true, when the bundle is saved, the DB stores `isFreeGift: true` and `freeGiftName: <value>`
- [ ] Given isFreeGift=true, the step appears last in the step timeline (or at its configured position)
- [ ] Given isFreeGift=false (default), no gift-related UI renders anywhere — existing bundles are unaffected

---

### Story 2: Merchant configures a mandatory default product step
**As a** merchant
**I want** to mark a step as a "default/mandatory" step and pin a specific variant
**So that** every customer's bundle automatically includes that product without being able to remove it

**Acceptance Criteria:**
- [ ] Given a step config page, when merchant toggles "Default Product (always included)", a variant selector appears
- [ ] Given isDefault=true and a defaultVariantId set, the widget auto-selects that variant on load
- [ ] Given isDefault=true, the selected product card in the sidebar shows NO remove/trash button
- [ ] Given isDefault=true, the step does NOT appear as a navigable step tab in the step timeline
- [ ] Given isDefault=true, the product counts toward the bundle total price from page load

---

### Story 3: Shopper sees locked free gift section
**As a** shopper
**I want** to see that a free gift is available but not yet unlocked
**So that** I'm motivated to add more products to earn it

**Acceptance Criteria:**
- [ ] Given a bundle with isFreeGift step, when fewer than all paid steps are complete, the sidebar shows a locked section below the selected items list
- [ ] Given locked state, the section shows: 🔒 icon + `"Add {N} more product(s) to claim a FREE {freeGiftName}!"`
- [ ] Given locked state, the section has a light gray background with a border, clearly separated from selected items
- [ ] Given locked state, the free gift step does NOT appear as an active/navigable step — user cannot navigate to it yet
- [ ] Given locked state, N = (total required items across all paid steps) - (currently selected items count)

---

### Story 4: Shopper unlocks free gift and selects it
**As a** shopper
**I want** to know I've unlocked a free gift and easily select it
**So that** I claim my reward before adding to cart

**Acceptance Criteria:**
- [ ] Given all paid steps are complete, the free gift section in sidebar changes to green: `"Congrats! You're eligible for a FREE {freeGiftName}!"` with a ✅ checkmark
- [ ] Given unlocked state, the step timeline shows the free gift step as now active/clickable
- [ ] Given the shopper is on the free gift step, the page heading shows: `"Complete the look and get a {freeGiftName} free!"`
- [ ] Given the shopper is on the free gift step, all product cards show:
  - A "Free" yellow/cream badge in the top-left corner of the card image
  - Price displayed as `$0.00`
  - Original price struck through (e.g., `$15.00`)
- [ ] Given the shopper selects a free gift product, the item appears in the sidebar selected list with `$0.00` and original price struck through
- [ ] Given the shopper selected a free gift product, the "Add To Cart" button becomes active

---

### Story 5: Free gift re-locks when paid item removed
**As a** shopper
**I want** the free gift to re-lock if I remove a required paid item
**So that** the bundle conditions remain accurate

**Acceptance Criteria:**
- [ ] Given free gift is unlocked and shopper removes a paid item, the free gift section reverts to locked state
- [ ] Given re-lock occurs, if a free gift was already selected, it is automatically deselected and removed from the sidebar list
- [ ] Given re-lock, the step timeline reverts to showing the free gift step as locked/inactive

---

### Story 6: Skeleton empty slots in sidebar
**As a** shopper
**I want** to see placeholder slots for items I haven't yet selected
**So that** I understand how many more products I need to add

**Acceptance Criteria:**
- [ ] Given a bundle with 3 paid steps requiring 1 item each, and 0 items selected, sidebar shows 3 skeleton placeholder slots
- [ ] Given 1 item selected, sidebar shows 1 filled item row + 2 skeleton placeholders
- [ ] Skeleton slot: gray rectangle (matches thumbnail size) + 2 gray shimmer lines for name/price
- [ ] Free gift slot placeholder is NOT shown in skeleton (only shown as locked/unlocked section below)

---

### Story 7: Mobile sticky bottom bar
**As a** shopper on mobile
**I want** to see my bundle progress at the bottom of the screen without scrolling
**So that** I can always see my total and act without losing context

**Acceptance Criteria:**
- [ ] Given viewport width < 768px, the right sidebar panel is hidden
- [ ] Given mobile viewport, a sticky bottom bar appears above the browser chrome with:
  - `^{N}` up-caret + item count indicator (tappable)
  - Current total price
  - CTA button: "Next" (in-progress) or "Add To Cart" (complete) — styled as a pill
- [ ] Given shopper taps the `^N` indicator, a bottom sheet slides up showing:
  - "Your Bundle" header + "Clear" button
  - Full selected items list (same as desktop sidebar)
  - Free gift locked/unlocked section (same as desktop sidebar)
  - Total row
  - CTA button inside sheet
- [ ] Given sheet is open, tapping outside or a close button collapses it
- [ ] Given free gift is unlocked, the bottom sheet's free gift section shows the green state

---

## UI/UX Specifications

### Sidebar — Locked Free Gift Section
```
Component: div.side-panel-free-gift (new)
Background: var(--bundle-free-gift-locked-bg, #f5f5f5)
Border: 1px solid var(--bundle-free-gift-locked-border, #e0e0e0)
Border-radius: 8px
Padding: 10px 12px
Icon: 🔒 (emoji or SVG lock icon)
Text: "Add {N} more product(s) to claim a FREE {freeGiftName}!"
Text size: 13px
Text color: var(--bundle-text-secondary, #666)
```

### Sidebar — Unlocked Free Gift Section
```
Component: div.side-panel-free-gift.unlocked (new)
Background: var(--bundle-free-gift-unlocked-bg, #e8f5e9)
Border: 1px solid var(--bundle-free-gift-unlocked-border, #a5d6a7)
Icon: ✅ (emoji or SVG checkmark)
Text: "Congrats! You're eligible for a FREE {freeGiftName}!"
Text color: var(--bundle-free-gift-unlocked-text, #2e7d32)
```

### Product Card — Free Badge
```
Position: absolute top-left of product image
Label: "Free"
Background: var(--bundle-free-badge-bg, #FFF3CD)
Color: var(--bundle-free-badge-text, #333)
Border-radius: 4px
Padding: 2px 6px
Font-size: 11px
Font-weight: 600
```

### Skeleton Slot
```
Component: div.side-panel-skeleton-slot (new)
Thumbnail: 40×40px gray rectangle (border-radius: 4px, background: #e0e0e0)
Line 1: 80px wide × 10px tall gray bar (border-radius: 3px)
Line 2: 50px wide × 8px tall gray bar
Animation: CSS pulse/shimmer (opacity 0.5 → 1 → 0.5, 1.5s infinite)
```

### Mobile Bottom Bar
```
Component: div.fpb-mobile-bottom-bar (new, replaces existing sidebar on mobile)
Position: fixed; bottom: 0; left: 0; right: 0
Background: white
Border-top: 1px solid #e0e0e0
Padding: 8px 16px + safe-area-inset-bottom
Height: ~56px (collapsed), expands via bottom sheet
Z-index: 1000

Left: "^{N}" toggle button (caret icon + count badge)
Center: total price text
Right: CTA pill button (Next / Add To Cart)
```

### Mobile Bottom Sheet
```
Component: div.fpb-mobile-bottom-sheet (new)
Position: fixed; bottom: 56px; left: 0; right: 0
Max-height: 70vh
Overflow-y: auto
Background: white
Border-radius: 16px 16px 0 0
Box-shadow: 0 -4px 20px rgba(0,0,0,0.15)
Transform: translateY(100%) → translateY(0) (slide up animation, 300ms ease)
```

### Free Gift Step Page Heading
```
Element: div.fpb-step-free-heading (new, above product grid)
Text: "Complete the look and get a {freeGiftName} free!"
Font-size: 18px
Font-weight: 600
Padding-bottom: 12px
Only renders when currentStep.isFreeGift === true
```

## Data Persistence

### New DB fields on BundleStep (Prisma migration)
```
isFreeGift        Boolean  @default(false)
freeGiftName      String?                   // display label e.g. "cap"
isDefault         Boolean  @default(false)
defaultVariantId  String?                   // Shopify variant GID
```

### API response additions (no migration needed, just include new fields)
```json
{
  "steps": [{
    "isFreeGift": false,
    "freeGiftName": null,
    "isDefault": false,
    "defaultVariantId": null
  }]
}
```

## Backward Compatibility Requirements
- All new DB fields default to `false`/`null` — zero data migration needed
- Widget must render correctly when `isFreeGift` and `isDefault` are absent from response (treat as false)
- Existing bundles see no change in behavior

## Out of Scope (explicit)
- Multiple free gift steps
- Free gift quantity > 1
- Custom free gift unlock conditions (other than "all paid steps complete")
- Per-step banner image
- Admin UI for per-step `categoryImageUrl`
- DCP (Design Control Panel) controls for free gift colors (use CSS vars with sensible defaults for V1)
